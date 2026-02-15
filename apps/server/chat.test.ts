import { beforeEach, describe, expect, it, vi } from "vitest";
import { handleChatRequest } from "./chat";
import * as db from "./db";

vi.mock("./db", () => ({
  getInstanceByIdForUser: vi.fn(),
}));

const mockDb = vi.mocked(db);

describe("chat api", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects empty messages", async () => {
    await expect(
      handleChatRequest({
        userId: 123,
        instanceId: 1,
        message: " ",
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("rejects access to non-owned instance", async () => {
    mockDb.getInstanceByIdForUser.mockResolvedValue(undefined);

    await expect(
      handleChatRequest({
        userId: 123,
        instanceId: 99,
        message: "hi",
      })
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});
