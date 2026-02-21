import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { startCreditBilling } from "../creditBilling";
import { initGatewayBridge } from "../gatewayBridge";
import { handleHelioWebhook } from "../helioWebhook";
import { initBuiltinSkills } from "../initBuiltinSkills";
import { validateEnv } from "./env";
import cors from "cors";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  validateEnv();
  const isDev = process.env.NODE_ENV === "development";
  const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";

  // Initialize built-in skills on startup
  try {
    await initBuiltinSkills();
  } catch (error) {
    console.error("[Skills] Failed to initialize built-in skills:", error);
  }

  // Start periodic credit billing for running instances
  try {
    startCreditBilling();
  } catch (error) {
    console.error("[CreditBilling] Failed to start billing:", error);
  }

  // Connect to running OpenClaw gateways via WebSocket
  try {
    await initGatewayBridge();
  } catch (error) {
    console.error("[GatewayBridge] Failed to initialize:", error);
  }

  const app = express();
  const server = createServer(app);

  // Enable CORS in development mode for Next.js dev server
  if (isDev) {
    app.use(
      cors({
        origin: clientUrl,
        credentials: true,
      })
    );
  }

  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Log API requests with status and duration
  app.use((req, res, next) => {
    const isApiCall = req.path.startsWith("/api/") || req.path === "/health";
    if (!isApiCall) {
      return next();
    }
    const startTime = Date.now();
    const shouldSkipLog =
      req.originalUrl.includes("instances.status");
    res.on("finish", () => {
      if (shouldSkipLog) return;
      const durationMs = Date.now() - startTime;
      console.log(
        `[API] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${durationMs}ms)`
      );
    });
    next();
  });

  // Basic HTTP health check for deploy platforms (e.g. Render)
  app.get("/health", (_req, res) => {
    res.status(200).json({ ok: true });
  });

  // Helio payment webhook (outside tRPC for raw Express access)
  app.post("/api/webhooks/helio", handleHelioWebhook);

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  const preferredPort = parseInt(process.env.PORT || "4000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${port}/`);
    console.log(`Local access: http://localhost:${port}/`);
    if (isDev) {
      console.log(`Next.js client: ${clientUrl}`);
    }
    if (process.env.NODE_ENV === "production") {
      console.log(`Remote access: Configure your firewall to allow port ${port}`);
    }
  });
}

if (process.env.NODE_ENV !== "test") {
  startServer().catch(console.error);
}
