import { beforeEach, describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import * as db from "./db";
import * as k8s from "./kubernetes";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "clerk",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as unknown as TrpcContext["res"],
  };

  return { ctx };
}

vi.mock("./db", () => ({
  getInstancesByUserId: vi.fn(),
  getInstanceByIdForUser: vi.fn(),
  createInstance: vi.fn(),
  updateInstance: vi.fn(),
  deleteInstance: vi.fn(),
}));

vi.mock("./kubernetes", () => ({
  createInstance: vi.fn(),
  deleteInstance: vi.fn(),
  stopInstance: vi.fn(),
  startInstance: vi.fn(),
  restartInstance: vi.fn(),
  getInstanceStatus: vi.fn(),
  getInstanceLogs: vi.fn(),
  getInstanceStats: vi.fn(),
  getGatewayAddress: vi.fn(),
  readGatewayToken: vi.fn(),
  getPodIp: vi.fn(),
}));

const mockDb = vi.mocked(db);
const mockK8s = vi.mocked(k8s);

describe("instances", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should list instances for authenticated user", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    mockDb.getInstancesByUserId.mockResolvedValue([]);

    const instances = await caller.instances.list();
    expect(Array.isArray(instances)).toBe(true);
  });

  it("should create a new instance", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const userId = ctx.user!.id;

    mockDb.createInstance.mockResolvedValue({
      id: 1,
      userId,
      name: "Test Instance",
      description: "A test instance",
      status: "stopped",
      llmProvider: null,
      llmApiKey: null,
      llmModel: null,
      config: { provider: "google", authToken: "token" },
      port: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    mockK8s.createInstance.mockResolvedValue({
      success: true,
      containerId: "openclaw-1",
      gatewayToken: "gateway-token-1",
      podIp: "10.0.1.5",
    });
    mockDb.updateInstance.mockResolvedValue();

    const instance = await caller.instances.create({
      name: "Test Instance",
      description: "A test instance",
      config: { provider: "google", authToken: "token" },
    });

    expect(instance).toHaveProperty("id");
    expect(instance.name).toBe("Test Instance");
    expect(instance.description).toBe("A test instance");
    expect(instance.status).toBe("stopped");
  });

  it("retries instance creation when K8s fails", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const userId = ctx.user!.id;

    mockDb.createInstance
      .mockResolvedValueOnce({
        id: 1,
        userId,
        name: "Retry Instance",
        description: null,
        status: "stopped",
        llmProvider: null,
        llmApiKey: null,
        llmModel: null,
        config: { provider: "google", authToken: "token" },
        port: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .mockResolvedValueOnce({
        id: 2,
        userId,
        name: "Retry Instance",
        description: null,
        status: "stopped",
        llmProvider: null,
        llmApiKey: null,
        llmModel: null,
        config: { provider: "google", authToken: "token" },
        port: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    mockK8s.createInstance
      .mockResolvedValueOnce({ success: false, error: "pod scheduling failed" })
      .mockResolvedValueOnce({
        success: true,
        containerId: "openclaw-2",
        gatewayToken: "gateway-token-2",
        podIp: "10.0.1.6",
      });
    mockDb.updateInstance.mockResolvedValue();
    mockDb.deleteInstance.mockResolvedValue();
    mockK8s.deleteInstance.mockResolvedValue({ success: true });

    const instance = await caller.instances.create({
      name: "Retry Instance",
      config: { provider: "google", authToken: "token" },
    });

    expect(instance.id).toBe(2);
    expect(mockDb.createInstance).toHaveBeenCalledTimes(2);
    expect(mockDb.deleteInstance).toHaveBeenCalledTimes(1);
  });

  it("should update an instance", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const userId = ctx.user!.id;

    mockDb.getInstanceByIdForUser.mockResolvedValue({
      id: 1,
      userId,
      name: "Test Instance",
      description: null,
      status: "running",
      llmProvider: null,
      llmApiKey: null,
      llmModel: null,
      config: {},
      port: 18790,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    mockDb.updateInstance.mockResolvedValue();
    mockK8s.restartInstance.mockResolvedValue({ success: true });

    // Update the instance
    const result = await caller.instances.update({
      id: 1,
      name: "Updated Instance",
      status: "running",
    });

    expect(result.success).toBe(true);
  });

  it("should delete an instance", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const userId = ctx.user!.id;

    mockDb.getInstanceByIdForUser.mockResolvedValue({
      id: 1,
      userId,
      name: "Test Instance",
      description: null,
      status: "stopped",
      llmProvider: null,
      llmApiKey: null,
      llmModel: null,
      config: {},
      port: 18790,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    mockK8s.deleteInstance.mockResolvedValue({ success: true });
    mockDb.deleteInstance.mockResolvedValue();

    // Delete the instance
    const result = await caller.instances.delete({ id: 1 });
    expect(result.success).toBe(true);
  });

  it("rejects instance access when unauthenticated", async () => {
    const ctx: TrpcContext = {
      user: null,
      req: { headers: {} } as TrpcContext["req"],
      res: { clearCookie: () => {} } as unknown as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);

    await expect(caller.instances.list()).rejects.toThrow("Please login");
  });

  it("rejects instance access when not owned", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    mockDb.getInstanceByIdForUser.mockResolvedValue(undefined);

    await expect(caller.instances.get({ id: 999 })).rejects.toThrow("Instance not found");
  });
});
