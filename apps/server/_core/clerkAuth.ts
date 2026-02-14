import { createClerkClient, verifyToken } from "@clerk/backend";
import type { Request } from "express";
import { ForbiddenError } from "@shared/_core/errors";
import type { User } from "@db/drizzle/schema";
import * as db from "../db";
import { ENV } from "./env";

const clerkClient = createClerkClient({ secretKey: ENV.clerkSecretKey });

const getBearerToken = (req: Request): string | null => {
  const header = req.headers.authorization;
  if (!header) return null;
  if (!header.startsWith("Bearer ")) return null;
  return header.slice("Bearer ".length).trim() || null;
};

const buildDisplayName = (user: {
  firstName?: string | null;
  lastName?: string | null;
  fullName?: string | null;
  username?: string | null;
}): string | null => {
  if (user.fullName) return user.fullName;
  const composed = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  if (composed) return composed;
  return user.username || null;
};

export async function authenticateRequest(req: Request): Promise<User> {
  const token = getBearerToken(req);
  if (!token) {
    throw ForbiddenError("Missing Clerk session token");
  }

  const { sub } = await verifyToken(token, {
    secretKey: ENV.clerkSecretKey,
  });

  if (!sub) {
    throw ForbiddenError("Invalid Clerk session token");
  }

  const signedInAt = new Date();
  let user = await db.getUserByOpenId(sub);

  if (!user) {
    const clerkUser = await clerkClient.users.getUser(sub);
    await db.upsertUser({
      openId: sub,
      name: buildDisplayName(clerkUser),
      email: clerkUser.primaryEmailAddress?.emailAddress ?? null,
      loginMethod: "clerk",
      lastSignedIn: signedInAt,
    });
    user = await db.getUserByOpenId(sub);
  }

  if (!user) {
    throw ForbiddenError("User not found");
  }

  await db.upsertUser({
    openId: user.openId,
    lastSignedIn: signedInAt,
  });

  return user;
}
