import { beforeEach, describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import * as db from "./db";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 42,
    openId: "collection-user",
    email: "collection@example.com",
    name: "Collection User",
    loginMethod: "clerk",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: { headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as TrpcContext["res"],
  };

  return { ctx };
}

vi.mock("./db", () => ({
  getSkillCollectionsByUserId: vi.fn(),
  getSkillCollectionByIdForUser: vi.fn(),
  updateSkillCollectionForUser: vi.fn(),
  deleteSkillCollectionForUser: vi.fn(),
}));

const mockDb = vi.mocked(db);

describe("collections", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists collections for authenticated user", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    mockDb.getSkillCollectionsByUserId.mockResolvedValue([]);

    const collections = await caller.collections.list();
    expect(Array.isArray(collections)).toBe(true);
  });

  it("blocks access to collections not owned by user", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    mockDb.getSkillCollectionByIdForUser.mockResolvedValue(undefined);

    await expect(caller.collections.get({ id: 999 })).rejects.toThrow("Collection not found");
  });

  it("updates owned collection", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    mockDb.getSkillCollectionByIdForUser.mockResolvedValue({
      id: 1,
      userId: ctx.user.id,
      name: "My Collection",
      description: null,
      skillIds: [1],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    mockDb.updateSkillCollectionForUser.mockResolvedValue();

    const result = await caller.collections.update({ id: 1, name: "Updated" });
    expect(result.success).toBe(true);
  });
});
