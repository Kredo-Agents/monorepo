import { defineConfig } from "vitest/config";
import path from "path";

const REPO_ROOT = path.resolve(import.meta.dirname, "../..");

export default defineConfig({
  root: REPO_ROOT,
  resolve: {
    alias: {
      "@": path.resolve(REPO_ROOT, "apps", "client", "src"),
      "@shared": path.resolve(REPO_ROOT, "packages", "shared"),
      "@db": path.resolve(REPO_ROOT, "packages", "db"),
      "@assets": path.resolve(REPO_ROOT, "attached_assets"),
    },
  },
  test: {
    environment: "node",
    include: ["apps/server/**/*.test.ts", "apps/server/**/*.spec.ts"],
  },
});
