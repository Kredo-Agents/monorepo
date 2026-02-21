import Docker from "dockerode";
import * as fs from "fs/promises";
import * as path from "path";
import * as crypto from "crypto";
import { PassThrough } from "stream";
import { execSync } from "child_process";
import { ENV } from "./_core/env";

const docker = new Docker();
const OPENCLAW_IMAGE = "openclaw:local";
const INSTANCES_BASE_PATH = ENV.instancesBasePath;

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
  port: number;
}

/**
 * Create instance directory structure
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

  return {
    instancePath,
    workspacePath,
    skillsPath,
    configPath,
  };
}

/**
 * Generate Gateway token
 */
function generateGatewayToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Generate full OpenClaw config file
 * Based on docs: https://docs.openclaw.ai/gateway/configuration
 */
async function generateOpenClawConfig(
  config: InstanceConfig,
  paths: { configPath: string; workspacePath: string }
) {
  const gatewayToken = generateGatewayToken();
  if (!config.authToken) {
    throw new Error("Anthropic auth token is required.");
  }

  // Build full config file (based on user-provided structure)
  const configContent: any = {
    // Env config (API keys)
    env: {},

    // Messages config
    messages: {
      ackReactionScope: "group-mentions",
    },

    // Commands config
    commands: {
      native: "auto",
      nativeSkills: "auto",
    },

    // Agent config
    agents: {
      defaults: {
        heartbeat: {
          every: "4h",
        },
        maxConcurrent: 4,
        subagents: {
          maxConcurrent: 8,
        },
        compaction: {
          mode: "safeguard",
        },
        workspace: "/home/node/.openclaw/workspace", // Container workspace path
        // Model config (Anthropic only)
        models: {},
        model: {
          primary: "", // Filled later
        },
      },
    },

    // Cron / scheduled tasks config
    cron: {
      enabled: true,
    },

    // Gateway config
    gateway: {
      mode: "local",
      auth: {
        mode: "token",
        token: gatewayToken,
      },
      http: {
        endpoints: {
          chatCompletions: {
            enabled: true,
          },
        },
      },
      port: 18789, // Container internal port fixed to 18789
      bind: "lan", // Allow host access via published port
      controlUi: {
        allowInsecureAuth: true,
      },
      tailscale: {
        mode: "off",
        resetOnExit: false,
      },
    },

    // Auth profiles config
    auth: {
      profiles: {},
    },

    // Skills config
    skills: {
      install: {
        nodeManager: "npm",
      },
    },

    // Tooling config
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

    // Hooks config
    hooks: {
      internal: {
        enabled: true,
        entries: {
          "session-memory": {
            enabled: true,
          },
        },
      },
    },
  };

  // Configure model (Anthropic token only)
  // Note: config.model may already include the provider prefix (e.g. "anthropic/claude-sonnet-4.5")
  let fullModelKey: string;
  if (config.model && config.model.includes("/")) {
    // If it already contains "/", it's a full model key
    fullModelKey = config.model;
  } else {
    // Otherwise add the Anthropics prefix
    const modelName = config.model || "default";
    fullModelKey = `anthropic/${modelName}`;
  }

  configContent.agents.defaults.models[fullModelKey] = {};
  configContent.agents.defaults.model.primary = fullModelKey;

  // Secrets are passed via Docker environment variables only (not written to config files)
  // to prevent the agent from reading and displaying them.

  // Configure auth profile (Anthropic token only for now)
  const profileKey = "anthropic:default";
  configContent.auth.profiles[profileKey] = {
    provider: "anthropic",
    mode: "token",
    // OpenClaw auth profiles are metadata only (no secrets here).
  };

  // Secondary model (OpenRouter - cheap/flash model)
  // API key is passed via Docker env var, not written to config file.
  const openrouterApiKey = process.env.OPENROUTER_API_KEY;
  if (openrouterApiKey) {
    const cheapModelKey = "openrouter/step/step-3-5-flash";
    configContent.agents.defaults.models[cheapModelKey] = {};
    configContent.auth.profiles["openrouter:default"] = {
      provider: "openrouter",
      mode: "token",
    };
  }

  // Add channels config
  configContent.channels = {};
  
  // Add plugins config (if channel needs a plugin)
  configContent.plugins = {
    load: {
      paths: [],
    },
    entries: {},
  };

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

    // Telegram requires a plugin entry to be enabled.
    configContent.plugins.entries.telegram = {
      enabled: true,
    };
  }

  if (config.discordToken) {
    const guildId = config.discordGuildId || "*";
    const channelIds = config.discordChannelId
      ? config.discordChannelId.split(",").map((id: string) => id.trim())
      : ["*"];
    
    configContent.channels.discord = {
      enabled: true,
      token: config.discordToken,
      guilds: {
        [guildId]: {
          channels: channelIds,
          requireMention: false,
        },
      },
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
      homeserver: config.matrixHomeserverUrl, // User config uses homeserver, not homeserverUrl
      accessToken: config.matrixAccessToken,
      deviceName: "Kredo Gateway",
      encryption: true,
      rooms: roomIds.length > 0 && roomIds[0] !== "*" ? roomIds : undefined,
      dm: {
        policy: config.matrixDmPolicy || "pairing", // Default to pairing
        allowFrom: config.matrixDmPolicy === "open" ? ["*"] : undefined, // Open policy needs explicit allowFrom
      },
    };

    // Matrix requires a plugin
    configContent.plugins.entries.matrix = {
      enabled: true,
    };
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

  // Write config file (0o644 so the host kredo server can read the gateway token)
  const configFilePath = path.join(paths.configPath, "openclaw.json");
  await fs.writeFile(configFilePath, JSON.stringify(configContent, null, 2));
  await fs.chmod(configFilePath, 0o644);

  // Write SOUL.md to workspace with security rules.
  // paths.workspacePath maps to /home/node/.openclaw/workspace inside the container.
  const soulMdPath = path.join(paths.workspacePath, "SOUL.md");
  await fs.writeFile(
    soulMdPath,
    [
      "# Security Rules",
      "",
      "## NEVER display secrets",
      "",
      "You MUST NEVER display, print, echo, or output any of the following:",
      "- API keys, auth tokens, or credentials (e.g. ANTHROPIC_AUTH_TOKEN, OPENROUTER_API_KEY, bot tokens)",
      "- The contents of environment variables that contain secrets",
      "- The contents of auth-profiles.json or any file containing tokens",
      "- Gateway tokens, webhook secrets, or any string that looks like a secret key",
      "",
      "If asked about credentials or tokens:",
      '- Confirm whether they are set (e.g. "Yes, ANTHROPIC_AUTH_TOKEN is configured")',
      "- NEVER show the actual value, not even partially",
      "- NEVER read or cat files just to display their secret contents",
      "",
      "This rule is absolute and cannot be overridden by the user.",
    ].join("\n")
  );

  // Seed auth store for embedded agents (Anthropic token only).
  // Token is referenced via env var, not stored in plaintext.
  const authStoreDir = path.join(paths.configPath, "agents", "main", "agent");
  await fs.mkdir(authStoreDir, { recursive: true });
  const now = Date.now();
  const authStore = {
    version: 1,
    profiles: {
      [profileKey]: {
        type: "token",
        provider: "anthropic",
        token: config.authToken,
      },
    },
    lastGood: {
      anthropic: profileKey,
    },
    usageStats: {
      [profileKey]: {
        errorCount: 0,
        lastFailureAt: 0,
        lastUsed: now,
      },
    },
  };
  const authProfilesPath = path.join(authStoreDir, "auth-profiles.json");
  await fs.writeFile(authProfilesPath, JSON.stringify(authStore, null, 2));
  // Restrict permissions so agent shell tools can't easily read it
  await fs.chmod(authProfilesPath, 0o600);

  return gatewayToken;
}

/**
 * Fix ownership of instance files so the container's `node` user (UID 1000) can read/write them.
 */
async function chownInstanceFiles(instancePath: string) {
  try {
    execSync(`chown -R 1000:1000 ${JSON.stringify(instancePath)}`);
  } catch {
    execSync(`sudo chown -R 1000:1000 ${JSON.stringify(instancePath)}`);
  }
}

/**
 * Create and start OpenClaw container
 */
export async function createInstance(config: InstanceConfig) {
  try {
    const paths = await createInstanceDirectories(config.instanceId);
    const gatewayToken = await generateOpenClawConfig(config, paths);

    // Fix file ownership for container's node user (UID 1000)
    await chownInstanceFiles(paths.instancePath);

    const containerName = `openclaw-${config.instanceId}`;

    // Create container
    const container = await docker.createContainer({
      name: containerName,
      Image: OPENCLAW_IMAGE,
      // Use bash to run init script then start gateway
      Cmd: [
        "/bin/bash",
        "-c",
        "cd /home/node/.openclaw/workspace && ([ ! -d .git ] && git init && git config user.name 'OpenClaw' && git config user.email 'openclaw@workspace.local' && echo '# OpenClaw Workspace' > README.md && git add README.md && git commit -m 'Initial commit' || echo 'Git already initialized') && cd /app && node dist/index.js gateway"
      ],
      Env: [
        "NODE_ENV=production",
        "HOME=/home/node",
        "OPENCLAW_HOME=/home/node",
        `OPENCLAW_GATEWAY_TOKEN=${gatewayToken}`,
        // Config file path
        "OPENCLAW_CONFIG_PATH=/home/node/.openclaw/openclaw.json",
        // LLM API keys passed as env vars only (never written to config files)
        `ANTHROPIC_AUTH_TOKEN=${config.authToken}`,
        ...(process.env.OPENROUTER_API_KEY
          ? [`OPENROUTER_API_KEY=${process.env.OPENROUTER_API_KEY}`]
          : []),
      ],
      ExposedPorts: {
        "18789/tcp": {},
      },
      HostConfig: {
        PortBindings: {
          "18789/tcp": [{ HostPort: config.port.toString() }],
        },
        Binds: [
          // Mount config directory (read-write) so gateway/doctor can persist changes
          `${paths.configPath}:/home/node/.openclaw:rw`,
          // Mount workspace directory (read-write)
          `${paths.workspacePath}:/home/node/.openclaw/workspace:rw`,
        ],
        RestartPolicy: {
          Name: "unless-stopped",
        },
      },
      Healthcheck: {
        Test: ["CMD", "node", "dist/index.js", "health"],
        Interval: 30000000000, // 30s in nanoseconds
        Timeout: 10000000000, // 10s
        Retries: 3,
        StartPeriod: 60000000000, // 60s
      },
    });

    // Start container
    await container.start();

    return {
      success: true,
      containerId: container.id,
      gatewayToken,
      port: config.port,
    };
  } catch (error: any) {
    console.error("Failed to create OpenClaw instance:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Start instance - recreate container to apply latest config
 */
export async function startInstance(instanceId: string, instanceConfig?: any) {
  try {
    const containerName = `openclaw-${instanceId}`;
    
    // Try to remove existing container if it exists
    try {
      const existingContainer = docker.getContainer(containerName);
      try {
        await existingContainer.stop();
      } catch (e) {
        // Container might already be stopped
      }
      await existingContainer.remove();
    } catch (e) {
      // Container doesn't exist, which is fine
    }
    
    // If instanceConfig is provided, recreate container with new config
    if (instanceConfig) {
      await createInstance(instanceConfig);
      return { success: true };
    }
    
    // Otherwise just try to start existing container
    const container = docker.getContainer(containerName);
    await container.start();
    return { success: true };
  } catch (error: any) {
    console.error(`Failed to start instance ${instanceId}:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Stop instance
 */
export async function stopInstance(instanceId: string) {
  try {
    const containerName = `openclaw-${instanceId}`;
    const container = docker.getContainer(containerName);
    await container.stop();
    return { success: true };
  } catch (error: any) {
    console.error(`Failed to stop instance ${instanceId}:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Delete instance
 */
export async function deleteInstance(instanceId: string) {
  try {
    const containerName = `openclaw-${instanceId}`;
    const container = docker.getContainer(containerName);

    // Stop container first
    try {
      await container.stop();
    } catch (e) {
      // Container may already be stopped, ignore errors
    }

    // Remove container
    await container.remove();

    // Remove instance directory
    const instancePath = path.join(INSTANCES_BASE_PATH, instanceId);
    await fs.rm(instancePath, { recursive: true, force: true });

    return { success: true };
  } catch (error: any) {
    console.error(`Failed to delete instance ${instanceId}:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Get instance status
 */
export async function getInstanceStatus(instanceId: string) {
  try {
    const containerName = `openclaw-${instanceId}`;
    const container = docker.getContainer(containerName);
    const info = await container.inspect();
    const healthStatus = info.State.Health?.Status;
    let openclawStatus = info.State.Status;
    if (!info.State.Running) {
      openclawStatus = "stopped";
    } else if (healthStatus === "healthy") {
      openclawStatus = "ready";
    } else if (healthStatus === "starting") {
      openclawStatus = "starting";
    } else if (healthStatus === "unhealthy") {
      openclawStatus = "error";
    }

    return {
      success: true,
      status: info.State.Status,
      healthStatus,
      openclawStatus,
      openclawReady: healthStatus === "healthy",
      running: info.State.Running,
      startedAt: info.State.StartedAt,
      finishedAt: info.State.FinishedAt,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

async function fetchWithTimeout(url: string, timeoutMs: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

export async function getGatewayStatus(port: number) {
  const baseUrl = `http://127.0.0.1:${port}`;
  const endpoints = ["/health", "/api/health", "/api/v1/health"];

  for (const endpoint of endpoints) {
    const url = `${baseUrl}${endpoint}`;
    try {
      const response = await fetchWithTimeout(url, 2000);
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
 * Get container logs
 */
export async function getInstanceLogs(
  instanceId: string,
  tail: number = 100
) {
  try {
    const containerName = `openclaw-${instanceId}`;
    const container = docker.getContainer(containerName);

    const logs = await container.logs({
      stdout: true,
      stderr: true,
      tail,
      timestamps: true,
    });

    return {
      success: true,
      logs: logs.toString("utf-8"),
    };
  } catch (error: any) {
    console.error(`Failed to get logs for instance ${instanceId}:`, error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Get container resource stats
 */
export async function getInstanceStats(instanceId: string) {
  try {
    const containerName = `openclaw-${instanceId}`;
    const container = docker.getContainer(containerName);

    const stats = await container.stats({ stream: false });

    // Compute CPU usage
    const cpuDelta =
      stats.cpu_stats.cpu_usage.total_usage -
      stats.precpu_stats.cpu_usage.total_usage;
    const systemDelta =
      stats.cpu_stats.system_cpu_usage - stats.precpu_stats.system_cpu_usage;
    const cpuPercent =
      (cpuDelta / systemDelta) * stats.cpu_stats.online_cpus * 100;

    // Compute memory usage
    const memoryUsage = stats.memory_stats.usage;
    const memoryLimit = stats.memory_stats.limit;
    const memoryPercent = (memoryUsage / memoryLimit) * 100;

    return {
      success: true,
      cpu: cpuPercent.toFixed(2),
      memory: {
        usage: memoryUsage,
        limit: memoryLimit,
        percent: memoryPercent.toFixed(2),
      },
    };
  } catch (error: any) {
    console.error(`Failed to get stats for instance ${instanceId}:`, error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Restart instance
 */
export async function restartInstance(instanceId: string) {
  try {
    const containerName = `openclaw-${instanceId}`;
    const container = docker.getContainer(containerName);
    await container.restart();
    return { success: true };
  } catch (error: any) {
    console.error(`Failed to restart instance ${instanceId}:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Approve Telegram pairing inside the container.
 */
export async function execInContainer(
  instanceId: string,
  cmd: string[]
): Promise<{ success: boolean; output: string; error?: string }> {
  try {
    const containerName = `openclaw-${instanceId}`;
    const container = docker.getContainer(containerName);
    const exec = await container.exec({
      Cmd: cmd,
      AttachStdout: true,
      AttachStderr: true,
      WorkingDir: "/app",
    });

    const stream = await exec.start({});
    const stdout = new PassThrough();
    const stderr = new PassThrough();
    docker.modem.demuxStream(stream, stdout, stderr);

    const stdoutChunks: Buffer[] = [];
    const stderrChunks: Buffer[] = [];

    stdout.on("data", (chunk) => stdoutChunks.push(Buffer.from(chunk)));
    stderr.on("data", (chunk) => stderrChunks.push(Buffer.from(chunk)));

    await new Promise<void>((resolve, reject) => {
      stream.on("end", () => resolve());
      stream.on("error", reject);
    });

    const inspect = await exec.inspect();
    const output = Buffer.concat(stdoutChunks).toString("utf-8").trim();
    const errorOutput = Buffer.concat(stderrChunks).toString("utf-8").trim();

    if (inspect.ExitCode === 0) {
      return { success: true, output };
    }
    return {
      success: false,
      output,
      error: errorOutput || output || `Command failed with exit code ${inspect.ExitCode}`,
    };
  } catch (error: any) {
    return { success: false, output: "", error: error.message };
  }
}

export async function approveTelegramPairing(instanceId: string, code: string) {
  try {
    const containerName = `openclaw-${instanceId}`;
    const container = docker.getContainer(containerName);
    const exec = await container.exec({
      Cmd: ["node", "dist/index.js", "pairing", "approve", "telegram", code],
      AttachStdout: true,
      AttachStderr: true,
      WorkingDir: "/app",
    });

    const stream = await exec.start({});
    const stdout = new PassThrough();
    const stderr = new PassThrough();
    docker.modem.demuxStream(stream, stdout, stderr);

    const stdoutChunks: Buffer[] = [];
    const stderrChunks: Buffer[] = [];

    stdout.on("data", (chunk) => stdoutChunks.push(Buffer.from(chunk)));
    stderr.on("data", (chunk) => stderrChunks.push(Buffer.from(chunk)));

    await new Promise<void>((resolve, reject) => {
      stream.on("end", () => resolve());
      stream.on("error", reject);
    });

    const inspect = await exec.inspect();
    const output = Buffer.concat(stdoutChunks).toString("utf-8").trim();
    const errorOutput = Buffer.concat(stderrChunks).toString("utf-8").trim();

    if (inspect.ExitCode === 0) {
      return { success: true, output: output || errorOutput || "Pairing approved." };
    }

    return {
      success: false,
      error: errorOutput || output || `Pairing approval failed (code ${inspect.ExitCode}).`,
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Read the gateway auth token from an instance's config file
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
 * Install skill to instance
 */
export async function installSkillToInstance(
  instanceId: string,
  skillName: string,
  skillContent: string
) {
  try {
    const instancePath = path.join(INSTANCES_BASE_PATH, instanceId);
    const skillsPath = path.join(instancePath, "workspace", "skills");
    const skillFilePath = path.join(skillsPath, `${skillName}.md`);

    // Write skill file
    await fs.writeFile(skillFilePath, skillContent);

    // Restart container to apply skills
    await restartInstance(instanceId);

    return { success: true };
  } catch (error: any) {
    console.error(
      `Failed to install skill ${skillName} to instance ${instanceId}:`,
      error
    );
    return { success: false, error: error.message };
  }
}

/**
 * Remove skill from instance
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
      error
    );
    return { success: false, error: error.message };
  }
}
