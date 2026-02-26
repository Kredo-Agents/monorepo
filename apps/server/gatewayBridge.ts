import * as db from "./db";
import * as k8s from "./kubernetes";

const TAG = "[GatewayBridge]";

// ─── Types ────────────────────────────────────────────────────────────────────

type ConnectionState =
  | "connecting"
  | "handshaking"
  | "connected"
  | "disconnected";

interface GatewayConnection {
  instanceId: string;
  /** Gateway address in the form "ip:port" (pod IP for K8s, or localhost:port for legacy) */
  address: string;
  gatewayToken: string;
  ws: WebSocket | null;
  state: ConnectionState;
  /** Token returned by the gateway after successful handshake */
  deviceToken: string | null;
  /** Request ID of the connect frame, used to match the handshake response */
  connectRequestId: string | null;
  reconnectTimer: ReturnType<typeof setTimeout> | null;
  reconnectAttempts: number;
  lastError: string | null;
  /** Set to true when disconnectGateway is called explicitly */
  intentionalClose: boolean;
}

// ─── Connection registry ──────────────────────────────────────────────────────

const connections = new Map<string, GatewayConnection>();

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Establish a WebSocket connection to an OpenClaw gateway and perform the
 * operator handshake.  Non-blocking: returns immediately and connects in the
 * background.
 */
export function connectToGateway(
  instanceId: string,
  address: string,
  gatewayToken: string,
): void {
  // Tear down any existing connection for this instance first
  if (connections.has(instanceId)) {
    disconnectGateway(instanceId);
  }

  const conn: GatewayConnection = {
    instanceId,
    address,
    gatewayToken,
    ws: null,
    state: "connecting",
    deviceToken: null,
    connectRequestId: null,
    reconnectTimer: null,
    reconnectAttempts: 0,
    lastError: null,
    intentionalClose: false,
  };

  connections.set(instanceId, conn);
  openWebSocket(conn);
}

/**
 * Schedule a gateway connection after a delay (for newly created containers
 * that need time to boot).
 */
export function scheduleConnect(
  instanceId: string,
  address: string,
  gatewayToken: string,
  delayMs = 10_000,
): void {
  const timer = setTimeout(() => {
    connectToGateway(instanceId, address, gatewayToken);
  }, delayMs);

  // Store a placeholder so we can cancel the scheduled connect on stop/delete
  if (!connections.has(instanceId)) {
    connections.set(instanceId, {
      instanceId,
      address,
      gatewayToken,
      ws: null,
      state: "connecting",
      deviceToken: null,
      connectRequestId: null,
      reconnectTimer: timer,
      reconnectAttempts: 0,
      lastError: null,
      intentionalClose: false,
    });
  }
}

/**
 * Cleanly disconnect from a gateway and remove it from the registry.
 */
export function disconnectGateway(instanceId: string): void {
  const conn = connections.get(instanceId);
  if (!conn) return;

  conn.intentionalClose = true;

  if (conn.reconnectTimer) clearTimeout(conn.reconnectTimer);

  if (conn.ws && conn.ws.readyState === WebSocket.OPEN) {
    conn.ws.close(1000, "kredo shutdown");
  }

  connections.delete(instanceId);
}

/**
 * Disconnect all active gateway connections (for graceful server shutdown).
 */
export function disconnectAll(): void {
  connections.forEach((_, instanceId) => {
    disconnectGateway(instanceId);
  });
}

/**
 * Return the current connection state for an instance.
 */
export function getConnectionStatus(instanceId: string) {
  const conn = connections.get(instanceId);
  if (!conn) return null;
  return {
    state: conn.state,
    lastError: conn.lastError,
    reconnectAttempts: conn.reconnectAttempts,
    hasPaired: conn.deviceToken !== null,
  };
}

/**
 * Initialize the gateway bridge at server startup.  Reconnects to all
 * running instances.
 */
export async function initGatewayBridge(): Promise<void> {
  console.log(`${TAG} Initializing — reconnecting to running instances`);
  try {
    const allInstances = await db.getAllInstances();
    const running = allInstances.filter((i) => i.status === "running");

    if (running.length === 0) {
      console.log(`${TAG} No running instances to reconnect`);
      return;
    }

    for (const instance of running) {
      const token = await k8s.readGatewayToken(instance.id.toString());
      if (!token) {
        console.warn(
          `${TAG} No gateway token found for instance ${instance.id}, skipping`,
        );
        continue;
      }

      // Resolve pod IP for K8s-based instances
      const address = await k8s.getGatewayAddress(instance.id.toString());
      if (!address) {
        console.warn(
          `${TAG} No pod IP found for instance ${instance.id}, skipping`,
        );
        continue;
      }

      // Stagger connections slightly to avoid a thundering-herd on restart
      scheduleConnect(instance.id.toString(), address, token, 5_000);
    }

    console.log(
      `${TAG} Scheduled reconnection to ${running.length} running instance(s)`,
    );
  } catch (error) {
    console.error(`${TAG} Failed to initialize:`, error);
  }
}

// ─── Internals ────────────────────────────────────────────────────────────────

function openWebSocket(conn: GatewayConnection): void {
  try {
    const url = `ws://${conn.address}`;
    const ws = new WebSocket(url);
    conn.ws = ws;
    conn.state = "connecting";

    ws.onopen = () => {
      conn.state = "handshaking";
      // Don't send connect yet — wait for the connect.challenge event
    };

    ws.onmessage = (event) => {
      const data =
        typeof event.data === "string"
          ? event.data
          : event.data?.toString?.() ?? "";
      handleMessage(conn, data);
    };

    ws.onclose = (event) => {
      const prev = conn.state;
      conn.state = "disconnected";

      if (conn.intentionalClose) return;

      if (prev === "connected") {
        console.warn(
          `${TAG} [${conn.instanceId}] Connection lost (code=${event.code} reason=${event.reason || "none"}), reconnecting`,
        );
      }
      scheduleReconnect(conn);
    };

    ws.onerror = () => {
      // onclose fires after onerror, so reconnect logic is handled there
      conn.lastError = "WebSocket error";
    };
  } catch (error) {
    conn.lastError = String(error);
    conn.state = "disconnected";
    scheduleReconnect(conn);
  }
}

function sendConnectFrame(conn: GatewayConnection): void {
  const id = `kredo-connect-${Date.now()}`;
  conn.connectRequestId = id;

  const frame = {
    type: "req",
    id,
    method: "connect",
    params: {
      minProtocol: 3,
      maxProtocol: 3,
      client: {
        id: "cli",
        version: "1.0.0",
        platform: process.platform,
        mode: "node",
      },
      role: "operator",
      scopes: ["operator.read", "operator.write", "operator.admin"],
      auth: { token: conn.gatewayToken },
    },
  };

  try {
    conn.ws?.send(JSON.stringify(frame));
  } catch {
    conn.lastError = "Failed to send connect frame";
  }
}

function handleMessage(conn: GatewayConnection, raw: string): void {
  let msg: any;
  try {
    msg = JSON.parse(raw);
  } catch {
    return; // ignore non-JSON frames
  }

  if (msg.type === "res") {
    handleResponse(conn, msg);
  } else if (msg.type === "event") {
    handleEvent(conn, msg);
  }
}

function handleResponse(conn: GatewayConnection, msg: any): void {
  const isHandshake = msg.id === conn.connectRequestId;

  if (msg.ok && msg.payload?.type === "hello-ok") {
    // Successful handshake
    conn.state = "connected";
    conn.reconnectAttempts = 0;
    conn.lastError = null;

    if (msg.payload.auth?.deviceToken) {
      conn.deviceToken = msg.payload.auth.deviceToken;
    }

    console.log(`${TAG} [${conn.instanceId}] Connected and paired`);

    // Auto-approve any pending node pairing requests
    void checkAndApprovePendingNodes(conn);
    return;
  }

  if (!msg.ok) {
    const errorMsg =
      msg.error?.message || msg.error?.code || JSON.stringify(msg.error);

    if (isHandshake) {
      conn.lastError = `Handshake rejected: ${errorMsg}`;
      console.error(`${TAG} [${conn.instanceId}] ${conn.lastError}`);
      // Don't reconnect on auth rejection — it won't improve on retry
      if (
        errorMsg?.includes("auth") ||
        errorMsg?.includes("token") ||
        errorMsg?.includes("unauthorized")
      ) {
        conn.state = "disconnected";
        conn.intentionalClose = true; // prevent reconnect
      }
    }
  }
}

function handleEvent(conn: GatewayConnection, msg: any): void {
  if (msg.event === "connect.challenge" && conn.state === "handshaking") {
    sendConnectFrame(conn);
    return;
  }

  // If we receive a node pairing event, try to auto-approve
  if (
    msg.event === "node.pair.requested" ||
    msg.event === "node.pending"
  ) {
    void checkAndApprovePendingNodes(conn);
  }
}

function scheduleReconnect(conn: GatewayConnection): void {
  if (conn.intentionalClose) return;
  if (conn.reconnectTimer) clearTimeout(conn.reconnectTimer);

  const BASE_DELAY = 2_000;
  const MAX_DELAY = 60_000;
  const delay = Math.min(
    BASE_DELAY * Math.pow(2, conn.reconnectAttempts),
    MAX_DELAY,
  );

  conn.reconnectAttempts += 1;
  conn.reconnectTimer = setTimeout(async () => {
    // Re-resolve pod IP on reconnect — it may have changed after pod restart
    const newAddress = await k8s.getGatewayAddress(conn.instanceId);
    if (newAddress) {
      conn.address = newAddress;
    }
    openWebSocket(conn);
  }, delay);
}

async function checkAndApprovePendingNodes(
  conn: GatewayConnection,
): Promise<void> {
  try {
    const result = await k8s.execInContainer(conn.instanceId, [
      "node",
      "dist/index.js",
      "nodes",
      "pending",
    ]);

    if (!result.success || !result.output.trim()) return;

    // Parse pending node IDs from the CLI output.
    // The output format may vary, so we try to extract lines that look like IDs.
    const lines = result.output
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    for (const line of lines) {
      // Try to extract a request/node ID from the output.
      // Common formats: "req-abc123  kredo-1  192.168.1.1  pending"
      // or just a plain ID per line.
      const match = line.match(/^(\S+)/);
      if (!match) continue;
      const requestId = match[1];

      // Skip header lines or non-ID output
      if (
        requestId.toLowerCase() === "id" ||
        requestId.toLowerCase() === "name" ||
        requestId.startsWith("-")
      )
        continue;

      const approveResult = await k8s.execInContainer(conn.instanceId, [
        "node",
        "dist/index.js",
        "nodes",
        "approve",
        requestId,
      ]);

      if (approveResult.success) {
        console.log(
          `${TAG} [${conn.instanceId}] Auto-approved node pairing: ${requestId}`,
        );
      }
    }
  } catch (error) {
    // Non-fatal — pairing approval is best-effort
    console.warn(
      `${TAG} [${conn.instanceId}] Failed to check/approve pending nodes:`,
      error,
    );
  }
}
