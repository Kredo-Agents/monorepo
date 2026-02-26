import os from "node:os";

export const ENV = {
  databaseUrl: process.env.DATABASE_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  instancesBasePath:
    process.env.OPENCLAW_INSTANCES_PATH ??
    `${os.homedir()}/openclaw-instances`,
  // Kubernetes / GKE configuration for OpenClaw instances
  k8sNamespace: process.env.K8S_NAMESPACE ?? "openclaw",
  openclawImage: process.env.OPENCLAW_IMAGE ?? "openclaw:local",
  k8sInCluster: process.env.K8S_IN_CLUSTER === "true",
  clerkSecretKey: process.env.CLERK_SECRET_KEY ?? "",
  // OpenRouter API key for cheap/flash model (optional)
  openrouterApiKey: process.env.OPENROUTER_API_KEY ?? "",
  // Helio / MoonPay Commerce payment integration (optional)
  helioApiKey: process.env.HELIO_API_KEY ?? "",
  helioWebhookSecret: process.env.HELIO_WEBHOOK_SECRET ?? "",
  helioPaylinkIds: {
    tier100: process.env.HELIO_PAYLINK_100 ?? "",
    tier500: process.env.HELIO_PAYLINK_500 ?? "",
    tier1000: process.env.HELIO_PAYLINK_1000 ?? "",
  },
};

export function validateEnv() {
  const missing: string[] = [];

  if (!ENV.databaseUrl) missing.push("DATABASE_URL");
  if (!ENV.clerkSecretKey) missing.push("CLERK_SECRET_KEY");

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }
}
