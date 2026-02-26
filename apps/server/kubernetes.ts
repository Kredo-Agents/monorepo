import * as k8s from "@kubernetes/client-node";
import * as fs from "fs/promises";
import * as path from "path";
import * as crypto from "crypto";
import { execSync } from "child_process";
import { PassThrough } from "stream";
import { ENV } from "./_core/env";

// ─── K8s client setup (lazy-initialized) ─────────────────────────────────────

let _kc: k8s.KubeConfig | null = null;
let _k8sApps: k8s.AppsV1Api | null = null;
let _k8sCore: k8s.CoreV1Api | null = null;
let _k8sExec: k8s.Exec | null = null;
let _k8sMetrics: k8s.Metrics | null = null;

function getKubeConfig(): k8s.KubeConfig {
  if (!_kc) {
    _kc = new k8s.KubeConfig();
    if (ENV.k8sInCluster) {
      _kc.loadFromCluster();
    } else {
      _kc.loadFromDefault();
    }
  }
  return _kc;
}

function getAppsApi(): k8s.AppsV1Api {
  if (!_k8sApps) _k8sApps = getKubeConfig().makeApiClient(k8s.AppsV1Api);
  return _k8sApps;
}

function getCoreApi(): k8s.CoreV1Api {
  if (!_k8sCore) _k8sCore = getKubeConfig().makeApiClient(k8s.CoreV1Api);
  return _k8sCore;
}

function getExecApi(): k8s.Exec {
  if (!_k8sExec) _k8sExec = new k8s.Exec(getKubeConfig());
  return _k8sExec;
}

function getMetricsApi(): k8s.Metrics {
  if (!_k8sMetrics) _k8sMetrics = new k8s.Metrics(getKubeConfig());
  return _k8sMetrics;
}

const NAMESPACE = ENV.k8sNamespace;
const OPENCLAW_IMAGE = ENV.openclawImage;
const INSTANCES_BASE_PATH = ENV.instancesBasePath;
const GATEWAY_PORT = 18789;

// ─── Types ───────────────────────────────────────────────────────────────────

export interface InstanceConfig {
  instanceId: string;
  name: string;
  description?: string;
  model?: string;
  authToken?: string;
  agentName?: string;
  timezone?: string;
  sandboxMode?: "all" | "none" | "tools";
  sessionMode?: "per-sender" | "shared" | "per-group";
  telegramToken?: string;
  telegramChatId?: string;
  discordToken?: string;
  discordGuildId?: string;
  discordChannelId?: string;
  slackBotToken?: string;
  slackAppToken?: string;
  matrixHomeserverUrl?: string;
  matrixAccessToken?: string;
  matrixRoomId?: string;
  matrixDmPolicy?: "pairing" | "open" | "allowlist" | "disabled";
  whatsappPhoneNumberId?: string;
  whatsappAccessToken?: string;
  whatsappVerifyToken?: string;
  whatsappWebhookUrl?: string;
  // port is no longer needed — K8s pods use their own IPs
  port?: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function deploymentName(instanceId: string): string {
  return `openclaw-${instanceId}`;
}

function podLabels(instanceId: string): Record<string, string> {
  return {
    app: "openclaw-instance",
    "instance-id": instanceId,
  };
}

/**
 * Create instance directory structure on the NFS-mounted filesystem.
 */
async function createInstanceDirectories(instanceId: string) {
  const instancePath = path.join(INSTANCES_BASE_PATH, instanceId);
  const workspacePath = path.join(instancePath, "workspace");
  const skillsPath = path.join(workspacePath, "skills");
  const configPath = path.join(instancePath, "config");

  await fs.mkdir(instancePath, { recursive: true });
  await fs.mkdir(workspacePath, { recursive: true });
  await fs.mkdir(skillsPath, { recursive: true });
  await fs.mkdir(configPath, { recursive: true });

  return { instancePath, workspacePath, skillsPath, configPath };
}

function generateGatewayToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Generate full OpenClaw config file.
 * Identical to the docker.ts version — writes config to the NFS-backed instance directory.
 */
async function generateOpenClawConfig(
  config: InstanceConfig,
  paths: { configPath: string; workspacePath: string }
) {
  const gatewayToken = generateGatewayToken();
  if (!config.authToken) {
    throw new Error("Google API key is required.");
  }

  const configContent: any = {
    env: {},
    messages: { ackReactionScope: "group-mentions" },
    commands: { native: "auto", nativeSkills: "auto" },
    agents: {
      defaults: {
        heartbeat: { every: "4h" },
        maxConcurrent: 4,
        subagents: { maxConcurrent: 8 },
        compaction: { mode: "safeguard" },
        workspace: "/home/node/.openclaw/workspace",
        models: {},
        model: { primary: "" },
      },
    },
    cron: { enabled: true },
    gateway: {
      mode: "local",
      auth: { mode: "token", token: gatewayToken },
      http: { endpoints: { chatCompletions: { enabled: true } } },
      port: GATEWAY_PORT,
      bind: "lan",
      controlUi: {
        allowInsecureAuth: true,
        dangerouslyDisableDeviceAuth: true,
      },
      tailscale: { mode: "off", resetOnExit: false },
    },
    auth: { profiles: {} },
    skills: { install: { nodeManager: "npm" } },
    tools: {
      sandbox: {
        tools: {
          allow: [
            "group:runtime",
            "group:fs",
            "group:sessions",
            "group:automation",
          ],
        },
      },
    },
    hooks: {
      internal: {
        enabled: true,
        entries: { "session-memory": { enabled: true } },
      },
    },
  };

  // Configure model
  let fullModelKey: string;
  if (config.model && config.model.includes("/")) {
    fullModelKey = config.model;
  } else {
    const modelName = config.model || "gemini-2.5-flash";
    fullModelKey = `google/${modelName}`;
  }

  configContent.agents.defaults.models[fullModelKey] = {};
  configContent.agents.defaults.model.primary = fullModelKey;

  const profileKey = "google:default";
  configContent.auth.profiles[profileKey] = {
    provider: "google",
    mode: "token",
  };

  // Secondary model (OpenRouter)
  const openrouterApiKey = process.env.OPENROUTER_API_KEY;
  if (openrouterApiKey) {
    const cheapModelKey = "openrouter/step/step-3-5-flash";
    configContent.agents.defaults.models[cheapModelKey] = {};
    configContent.auth.profiles["openrouter:default"] = {
      provider: "openrouter",
      mode: "token",
    };
  }

  // Channels config
  configContent.channels = {};
  configContent.plugins = { load: { paths: [] }, entries: {} };

  if (config.telegramToken) {
    const allowFrom = config.telegramChatId
      ? config.telegramChatId.split(",").map((id: string) => id.trim())
      : undefined;
    configContent.channels.telegram = {
      enabled: true,
      dmPolicy: "pairing",
      groupPolicy: "allowlist",
      streamMode: "partial",
      botToken: config.telegramToken,
      ...(allowFrom ? { allowFrom } : {}),
    };
    configContent.plugins.entries.telegram = { enabled: true };
  }

  if (config.discordToken) {
    const guildId = config.discordGuildId || "*";
    const channelIds = config.discordChannelId
      ? config.discordChannelId.split(",").map((id: string) => id.trim())
      : ["*"];
    configContent.channels.discord = {
      enabled: true,
      token: config.discordToken,
      guilds: { [guildId]: { channels: channelIds, requireMention: false } },
    };
  }

  if (config.slackBotToken && config.slackAppToken) {
    configContent.channels.slack = {
      enabled: true,
      botToken: config.slackBotToken,
      appToken: config.slackAppToken,
    };
  }

  if (config.matrixHomeserverUrl && config.matrixAccessToken) {
    const roomIds = config.matrixRoomId
      ? config.matrixRoomId.split(",").map((id: string) => id.trim())
      : ["*"];
    configContent.channels.matrix = {
      enabled: true,
      homeserver: config.matrixHomeserverUrl,
      accessToken: config.matrixAccessToken,
      deviceName: "Kredo Gateway",
      encryption: true,
      rooms: roomIds.length > 0 && roomIds[0] !== "*" ? roomIds : undefined,
      dm: {
        policy: config.matrixDmPolicy || "pairing",
        allowFrom: config.matrixDmPolicy === "open" ? ["*"] : undefined,
      },
    };
    configContent.plugins.entries.matrix = { enabled: true };
  }

  if (config.whatsappPhoneNumberId && config.whatsappAccessToken) {
    configContent.channels.whatsapp = {
      enabled: true,
      phoneNumberId: config.whatsappPhoneNumberId,
      accessToken: config.whatsappAccessToken,
      ...(config.whatsappVerifyToken ? { verifyToken: config.whatsappVerifyToken } : {}),
      ...(config.whatsappWebhookUrl ? { webhookUrl: config.whatsappWebhookUrl } : {}),
    };
  }

  // Write config file
  const configFilePath = path.join(paths.configPath, "openclaw.json");
  await fs.writeFile(configFilePath, JSON.stringify(configContent, null, 2));
  await fs.chmod(configFilePath, 0o644);

  // Write SOUL.md
  const soulMdPath = path.join(paths.workspacePath, "SOUL.md");
  await fs.writeFile(
    soulMdPath,
    [
      "# Security Rules",
      "",
      "## NEVER display secrets",
      "",
      "You MUST NEVER display, print, echo, or output any of the following:",
      "- API keys, auth tokens, or credentials (e.g. GOOGLE_API_KEY, OPENROUTER_API_KEY, bot tokens)",
      "- The contents of environment variables that contain secrets",
      "- The contents of auth-profiles.json or any file containing tokens",
      "- Gateway tokens, webhook secrets, or any string that looks like a secret key",
      "",
      "If asked about credentials or tokens:",
      '- Confirm whether they are set (e.g. "Yes, GOOGLE_API_KEY is configured")',
      "- NEVER show the actual value, not even partially",
      "- NEVER read or cat files just to display their secret contents",
      "",
      "This rule is absolute and cannot be overridden by the user.",
    ].join("\n")
  );

  // Write auth profiles
  const authStoreDir = path.join(paths.configPath, "agents", "main", "agent");
  await fs.mkdir(authStoreDir, { recursive: true });
  const now = Date.now();
  const authStore = {
    version: 1,
    profiles: {
      [profileKey]: {
        type: "token",
        provider: "google",
        token: config.authToken,
      },
    },
    lastGood: { google: profileKey },
    usageStats: {
      [profileKey]: { errorCount: 0, lastFailureAt: 0, lastUsed: now },
    },
  };
  const authProfilesPath = path.join(authStoreDir, "auth-profiles.json");
  await fs.writeFile(authProfilesPath, JSON.stringify(authStore, null, 2));
  await fs.chmod(authProfilesPath, 0o600);

  return gatewayToken;
}

/**
 * Fix ownership of instance files so the container's `node` user (UID 1000) can read/write them.
 */
async function chownInstanceFiles(instancePath: string) {
  if (process.platform === "darwin") return;
  try {
    execSync(`chown -R 1000:1000 ${JSON.stringify(instancePath)}`);
  } catch {
    try {
      execSync(`sudo -n chown -R 1000:1000 ${JSON.stringify(instancePath)}`);
    } catch {
      console.warn(`chown failed for ${instancePath} — pod may have permission issues`);
    }
  }
}

/**
 * Build a K8s Deployment spec for an OpenClaw instance.
 */
function buildDeploymentSpec(
  instanceId: string,
  config: InstanceConfig,
  gatewayToken: string,
  instancePath: string,
): k8s.V1Deployment {
  const labels = podLabels(instanceId);
  const configPath = path.join(instancePath, "config");
  const workspacePath = path.join(instancePath, "workspace");

  const envVars: k8s.V1EnvVar[] = [
    { name: "NODE_ENV", value: "production" },
    { name: "HOME", value: "/home/node" },
    { name: "OPENCLAW_HOME", value: "/home/node" },
    { name: "OPENCLAW_GATEWAY_TOKEN", value: gatewayToken },
    { name: "OPENCLAW_CONFIG_PATH", value: "/home/node/.openclaw/openclaw.json" },
    { name: "GOOGLE_API_KEY", value: config.authToken || "" },
  ];

  if (process.env.OPENROUTER_API_KEY) {
    envVars.push({ name: "OPENROUTER_API_KEY", value: process.env.OPENROUTER_API_KEY });
  }

  return {
    apiVersion: "apps/v1",
    kind: "Deployment",
    metadata: {
      name: deploymentName(instanceId),
      namespace: NAMESPACE,
      labels,
    },
    spec: {
      replicas: 1,
      selector: { matchLabels: labels },
      template: {
        metadata: { labels },
        spec: {
          containers: [
            {
              name: "openclaw",
              image: OPENCLAW_IMAGE,
              command: ["/bin/bash", "-c"],
              args: [
                "cd /home/node/.openclaw/workspace && " +
                "([ ! -d .git ] && git init && git config user.name 'OpenClaw' && " +
                "git config user.email 'openclaw@workspace.local' && " +
                "echo '# OpenClaw Workspace' > README.md && " +
                "git add README.md && git commit -m 'Initial commit' || " +
                "echo 'Git already initialized') && " +
                "cd /app && node dist/index.js gateway",
              ],
              env: envVars,
              ports: [{ containerPort: GATEWAY_PORT, protocol: "TCP" }],
              livenessProbe: {
                exec: { command: ["node", "dist/index.js", "health"] },
                initialDelaySeconds: 60,
                periodSeconds: 30,
                timeoutSeconds: 10,
                failureThreshold: 3,
              },
              readinessProbe: {
                exec: { command: ["node", "dist/index.js", "health"] },
                initialDelaySeconds: 30,
                periodSeconds: 10,
                timeoutSeconds: 5,
                failureThreshold: 3,
              },
              resources: {
                requests: { cpu: "250m", memory: "512Mi" },
                limits: { cpu: "1000m", memory: "1Gi" },
              },
              volumeMounts: [
                {
                  name: "instance-config",
                  mountPath: "/home/node/.openclaw",
                  subPath: `${instanceId}/config`,
                },
                {
                  name: "instance-workspace",
                  mountPath: "/home/node/.openclaw/workspace",
                  subPath: `${instanceId}/workspace`,
                },
              ],
            },
          ],
          volumes: [
            {
              name: "instance-config",
              persistentVolumeClaim: { claimName: "openclaw-nfs-pvc" },
            },
            {
              name: "instance-workspace",
              persistentVolumeClaim: { claimName: "openclaw-nfs-pvc" },
            },
          ],
        },
      },
    },
  };
}

// ─── Public API (same interface as docker.ts) ────────────────────────────────

/**
 * Create and start an OpenClaw instance as a K8s Deployment.
 */
export async function createInstance(config: InstanceConfig) {
  try {
    const paths = await createInstanceDirectories(config.instanceId);
    const gatewayToken = await generateOpenClawConfig(config, paths);
    await chownInstanceFiles(paths.instancePath);

    const deployment = buildDeploymentSpec(
      config.instanceId,
      config,
      gatewayToken,
      paths.instancePath,
    );

    // Delete existing deployment if it exists (idempotent create)
    try {
      await getAppsApi().deleteNamespacedDeployment({
        name: deploymentName(config.instanceId),
        namespace: NAMESPACE,
      });
      // Brief wait for cleanup
      await new Promise((r) => setTimeout(r, 2000));
    } catch {
      // Doesn't exist — fine
    }

    await getAppsApi().createNamespacedDeployment({
      namespace: NAMESPACE,
      body: deployment,
    });

    // Wait for pod IP (up to 60s)
    const podIp = await waitForPodIp(config.instanceId, 60_000);

    return {
      success: true,
      containerId: deploymentName(config.instanceId),
      gatewayToken,
      podIp,
    };
  } catch (error: any) {
    console.error("Failed to create OpenClaw instance:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Start instance — recreate deployment to apply latest config.
 */
export async function startInstance(instanceId: string, instanceConfig?: any) {
  try {
    const name = deploymentName(instanceId);

    // If config provided, recreate entirely
    if (instanceConfig) {
      // Delete existing
      try {
        await getAppsApi().deleteNamespacedDeployment({ name, namespace: NAMESPACE });
        await new Promise((r) => setTimeout(r, 2000));
      } catch {
        // Doesn't exist
      }
      await createInstance(instanceConfig);
      return { success: true };
    }

    // Otherwise scale deployment to 1
    try {
      await getAppsApi().patchNamespacedDeployment({
        name,
        namespace: NAMESPACE,
        body: { spec: { replicas: 1 } },
        contentType: "application/strategic-merge-patch+json",
      } as any);
    } catch {
      // If deployment doesn't exist, can't start without config
      return { success: false, error: "Deployment does not exist. Provide config to recreate." };
    }

    return { success: true };
  } catch (error: any) {
    console.error(`Failed to start instance ${instanceId}:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Stop instance — scale deployment to 0 replicas.
 */
export async function stopInstance(instanceId: string) {
  try {
    const name = deploymentName(instanceId);
    await getAppsApi().patchNamespacedDeployment({
      name,
      namespace: NAMESPACE,
      body: { spec: { replicas: 0 } },
      contentType: "application/strategic-merge-patch+json",
    } as any);
    return { success: true };
  } catch (error: any) {
    console.error(`Failed to stop instance ${instanceId}:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Delete instance — remove deployment and clean up NFS directory.
 */
export async function deleteInstance(instanceId: string) {
  try {
    const name = deploymentName(instanceId);

    // Delete K8s deployment
    try {
      await getAppsApi().deleteNamespacedDeployment({ name, namespace: NAMESPACE });
    } catch {
      // May not exist
    }

    // Remove instance directory from NFS
    const instancePath = path.join(INSTANCES_BASE_PATH, instanceId);
    await fs.rm(instancePath, { recursive: true, force: true });

    return { success: true };
  } catch (error: any) {
    console.error(`Failed to delete instance ${instanceId}:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Restart instance — delete the pod so the deployment recreates it.
 */
export async function restartInstance(instanceId: string) {
  try {
    const pod = await getRunningPod(instanceId);
    if (pod?.metadata?.name) {
      await getCoreApi().deleteNamespacedPod({
        name: pod.metadata.name,
        namespace: NAMESPACE,
      });
    }
    return { success: true };
  } catch (error: any) {
    console.error(`Failed to restart instance ${instanceId}:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Get instance status from K8s pod state.
 */
export async function getInstanceStatus(instanceId: string) {
  try {
    const pod = await getRunningPod(instanceId);
    if (!pod) {
      // Check if deployment exists but has 0 replicas
      try {
        const dep = await getAppsApi().readNamespacedDeployment({
          name: deploymentName(instanceId),
          namespace: NAMESPACE,
        });
        if (dep.spec?.replicas === 0) {
          return {
            success: true,
            status: "stopped",
            running: false,
            openclawStatus: "stopped",
            openclawReady: false,
          };
        }
      } catch {
        // No deployment
      }

      return {
        success: true,
        status: "stopped",
        running: false,
        openclawStatus: "stopped",
        openclawReady: false,
      };
    }

    const phase = pod.status?.phase; // Pending, Running, Succeeded, Failed, Unknown
    const containerStatuses = pod.status?.containerStatuses ?? [];
    const container = containerStatuses[0];
    const isReady = container?.ready ?? false;
    const isRunning = phase === "Running";

    let openclawStatus: string;
    if (!isRunning) {
      openclawStatus = "stopped";
    } else if (isReady) {
      openclawStatus = "ready";
    } else {
      openclawStatus = "starting";
    }

    // Map K8s health to docker-style healthStatus
    let healthStatus: string | undefined;
    if (isReady) {
      healthStatus = "healthy";
    } else if (isRunning) {
      healthStatus = "starting";
    }

    return {
      success: true,
      status: phase?.toLowerCase() ?? "unknown",
      healthStatus,
      openclawStatus,
      openclawReady: isReady,
      running: isRunning,
      startedAt: container?.state?.running?.startedAt?.toISOString(),
      finishedAt: container?.state?.terminated?.finishedAt?.toISOString(),
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Check gateway health by hitting the pod's HTTP endpoint directly.
 */
export async function getGatewayStatus(instanceId: string) {
  const podIp = await getPodIp(instanceId);
  if (!podIp) {
    return { success: false, ready: false, status: "unreachable" };
  }

  const baseUrl = `http://${podIp}:${GATEWAY_PORT}`;
  const endpoints = ["/health", "/api/health", "/api/v1/health"];

  for (const endpoint of endpoints) {
    const url = `${baseUrl}${endpoint}`;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2000);
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);

      if (response.ok) {
        return { success: true, ready: true, status: "healthy", endpoint };
      }
      if (response.status !== 404) {
        return {
          success: true,
          ready: false,
          status: `http_${response.status}`,
          endpoint,
        };
      }
    } catch (error: any) {
      if (error?.name !== "AbortError") {
        continue;
      }
    }
  }

  return { success: false, ready: false, status: "unreachable" };
}

/**
 * Get pod logs via K8s Logs API.
 */
export async function getInstanceLogs(instanceId: string, tail: number = 100) {
  try {
    const pod = await getRunningPod(instanceId);
    if (!pod?.metadata?.name) {
      return { success: false, error: "No running pod found" };
    }

    const res = await getCoreApi().readNamespacedPodLog({
      name: pod.metadata.name,
      namespace: NAMESPACE,
      tailLines: tail,
      timestamps: true,
    });

    return {
      success: true,
      logs: typeof res === "string" ? res : String(res),
    };
  } catch (error: any) {
    console.error(`Failed to get logs for instance ${instanceId}:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Get pod resource stats via K8s Metrics API.
 */
export async function getInstanceStats(instanceId: string) {
  try {
    const pod = await getRunningPod(instanceId);
    if (!pod?.metadata?.name) {
      return { success: false, error: "No running pod found" };
    }

    try {
      const metrics = await getMetricsApi().getPodMetrics(NAMESPACE);
      const podMetric = metrics.items.find(
        (m) => m.metadata?.name === pod.metadata!.name
      );

      if (!podMetric || !podMetric.containers?.length) {
        return { success: false, error: "No metrics available yet" };
      }

      const container = podMetric.containers[0];
      const cpuRaw = container.usage?.cpu ?? "0";
      const memRaw = container.usage?.memory ?? "0";

      // Parse CPU (e.g. "250m" = 250 millicores, "1" = 1000 millicores)
      let cpuMillicores: number;
      if (cpuRaw.endsWith("n")) {
        cpuMillicores = parseInt(cpuRaw) / 1_000_000;
      } else if (cpuRaw.endsWith("m")) {
        cpuMillicores = parseInt(cpuRaw);
      } else {
        cpuMillicores = parseFloat(cpuRaw) * 1000;
      }
      const cpuPercent = cpuMillicores / 10; // relative to 1 core = 100%

      // Parse memory (e.g. "512Mi", "1Gi", "524288Ki")
      let memoryBytes: number;
      if (memRaw.endsWith("Ki")) {
        memoryBytes = parseInt(memRaw) * 1024;
      } else if (memRaw.endsWith("Mi")) {
        memoryBytes = parseInt(memRaw) * 1024 * 1024;
      } else if (memRaw.endsWith("Gi")) {
        memoryBytes = parseInt(memRaw) * 1024 * 1024 * 1024;
      } else {
        memoryBytes = parseInt(memRaw);
      }
      const memoryLimit = 1024 * 1024 * 1024; // 1Gi limit from spec
      const memoryPercent = (memoryBytes / memoryLimit) * 100;

      return {
        success: true,
        cpu: cpuPercent.toFixed(2),
        memory: {
          usage: memoryBytes,
          limit: memoryLimit,
          percent: memoryPercent.toFixed(2),
        },
      };
    } catch {
      // Metrics server might not be available
      return { success: false, error: "Metrics server not available" };
    }
  } catch (error: any) {
    console.error(`Failed to get stats for instance ${instanceId}:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Execute a command inside the running pod.
 */
export async function execInContainer(
  instanceId: string,
  cmd: string[],
): Promise<{ success: boolean; output: string; error?: string }> {
  try {
    const pod = await getRunningPod(instanceId);
    if (!pod?.metadata?.name) {
      return { success: false, output: "", error: "No running pod found" };
    }

    const stdoutChunks: Buffer[] = [];
    const stderrChunks: Buffer[] = [];

    const stdoutStream = new PassThrough();
    const stderrStream = new PassThrough();

    stdoutStream.on("data", (chunk) => stdoutChunks.push(Buffer.from(chunk)));
    stderrStream.on("data", (chunk) => stderrChunks.push(Buffer.from(chunk)));

    await new Promise<void>((resolve, reject) => {
      getExecApi().exec(
        NAMESPACE,
        pod.metadata!.name!,
        "openclaw",
        cmd,
        stdoutStream as any,
        stderrStream as any,
        null,
        false,
        (status) => {
          if (status.status === "Success") {
            resolve();
          } else {
            reject(
              new Error(
                status.message || `Command failed: ${JSON.stringify(status)}`
              )
            );
          }
        },
      );
    });

    const output = Buffer.concat(stdoutChunks).toString("utf-8").trim();
    return { success: true, output };
  } catch (error: any) {
    const errorOutput = error.message || String(error);
    return { success: false, output: "", error: errorOutput };
  }
}

/**
 * Approve Telegram pairing inside the pod.
 */
export async function approveTelegramPairing(instanceId: string, code: string) {
  try {
    const result = await execInContainer(instanceId, [
      "node",
      "dist/index.js",
      "pairing",
      "approve",
      "telegram",
      code,
    ]);

    if (result.success) {
      return { success: true, output: result.output || "Pairing approved." };
    }
    return { success: false, error: result.error || "Pairing approval failed." };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Read the gateway auth token from an instance's config file on NFS.
 */
export async function readGatewayToken(instanceId: string): Promise<string | null> {
  try {
    const configPath = path.join(INSTANCES_BASE_PATH, instanceId, "config", "openclaw.json");
    const content = await fs.readFile(configPath, "utf-8");
    const config = JSON.parse(content);
    return config.gateway?.auth?.token || null;
  } catch {
    return null;
  }
}

/**
 * Install skill to instance — write file to NFS and restart pod.
 */
export async function installSkillToInstance(
  instanceId: string,
  skillName: string,
  skillContent: string,
) {
  try {
    const instancePath = path.join(INSTANCES_BASE_PATH, instanceId);
    const skillsPath = path.join(instancePath, "workspace", "skills");
    const skillFilePath = path.join(skillsPath, `${skillName}.md`);

    await fs.writeFile(skillFilePath, skillContent);
    await restartInstance(instanceId);

    return { success: true };
  } catch (error: any) {
    console.error(
      `Failed to install skill ${skillName} to instance ${instanceId}:`,
      error,
    );
    return { success: false, error: error.message };
  }
}

/**
 * Remove skill from instance.
 */
export async function removeSkillFromInstance(instanceId: string, skillName: string) {
  try {
    const instancePath = path.join(INSTANCES_BASE_PATH, instanceId);
    const skillsPath = path.join(instancePath, "workspace", "skills");
    const skillFilePath = path.join(skillsPath, `${skillName}.md`);

    await fs.rm(skillFilePath, { force: true });
    await restartInstance(instanceId);

    return { success: true };
  } catch (error: any) {
    console.error(
      `Failed to remove skill ${skillName} from instance ${instanceId}:`,
      error,
    );
    return { success: false, error: error.message };
  }
}

// ─── Pod IP resolution ───────────────────────────────────────────────────────

/**
 * Get the IP of the running pod for an instance.
 */
export async function getPodIp(instanceId: string): Promise<string | null> {
  const pod = await getRunningPod(instanceId);
  return pod?.status?.podIP ?? null;
}

/**
 * Get the gateway address (ip:port) for connecting to an instance.
 */
export async function getGatewayAddress(instanceId: string): Promise<string | null> {
  const ip = await getPodIp(instanceId);
  if (!ip) return null;
  return `${ip}:${GATEWAY_PORT}`;
}

/**
 * Find the running pod for an instance by label selector.
 */
async function getRunningPod(instanceId: string): Promise<k8s.V1Pod | null> {
  try {
    const labelSelector = `app=openclaw-instance,instance-id=${instanceId}`;
    const res = await getCoreApi().listNamespacedPod({
      namespace: NAMESPACE,
      labelSelector,
    });

    const pods = res.items ?? [];
    // Return the first running/pending pod (not terminated)
    const activePod = pods.find(
      (p) => p.status?.phase === "Running" || p.status?.phase === "Pending"
    );
    return activePod ?? pods[0] ?? null;
  } catch {
    return null;
  }
}

/**
 * Wait for a pod to get an IP address (with timeout).
 */
async function waitForPodIp(
  instanceId: string,
  timeoutMs: number,
): Promise<string | null> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const ip = await getPodIp(instanceId);
    if (ip) return ip;
    await new Promise((r) => setTimeout(r, 2000));
  }
  return null;
}
