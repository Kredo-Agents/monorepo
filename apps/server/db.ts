import { eq, and, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  User,
  users,
  instances,
  Instance,
  InsertInstance,
  skills,
  Skill,
  InsertSkill,
  installedSkills,
  InstalledSkill,
  InsertInstalledSkill,
  skillCollections,
  SkillCollection,
  InsertSkillCollection,
  chatMessages,
  ChatMessage,
  InsertChatMessage,
  creditTransactions,
  CreditTransaction,
  InsertCreditTransaction,
} from "@db/drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ===== User Functions =====

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    // Check if user already exists (to know if we need to initialize credits)
    const existing = await getUserByOpenId(user.openId);

    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });

    // Initialize credits for new users, or existing users who somehow have 0
    if (!existing) {
      const newUser = await getUserByOpenId(user.openId);
      if (newUser) {
        await initializeUserCredits(newUser.id);
      }
    } else if (existing.credits === 0) {
      // Existing user with 0 credits — check if they ever received initial credits
      const txs = await getCreditTransactions(existing.id, 1, 0);
      const hasInitialTx = txs.some(tx => tx.type === 'initial');
      if (!hasInitialTx) {
        await initializeUserCredits(existing.id);
      }
    }
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ===== Instance Functions =====

export async function createInstance(instance: InsertInstance): Promise<Instance> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(instances).values(instance);
  const insertId = Number((result as any)[0]?.insertId ?? (result as any).insertId);
  if (!insertId || isNaN(insertId)) {
    throw new Error("Failed to get insert ID");
  }
  const [created] = await db.select().from(instances).where(eq(instances.id, insertId));
  if (!created) throw new Error("Failed to create instance");
  return created;
}

export async function getAllInstances(): Promise<Instance[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(instances).orderBy(desc(instances.createdAt));
}

export async function getInstancesByUserId(userId: number): Promise<Instance[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(instances).where(eq(instances.userId, userId)).orderBy(desc(instances.createdAt));
}

export async function getInstanceById(id: number): Promise<Instance | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(instances).where(eq(instances.id, id)).limit(1);
  return result[0];
}

export async function getInstanceByIdForUser(id: number, userId: number): Promise<Instance | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(instances)
    .where(and(eq(instances.id, id), eq(instances.userId, userId)))
    .limit(1);
  return result[0];
}

export async function getUsedInstancePorts(): Promise<number[]> {
  const db = await getDb();
  if (!db) return [];

  const result = await db.select({ port: instances.port }).from(instances);
  return result
    .map(row => row.port)
    .filter((port): port is number => typeof port === "number");
}

export async function updateInstance(id: number, updates: Partial<Omit<Instance, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(instances).set({ ...updates, updatedAt: new Date() }).where(eq(instances.id, id));
}

export async function deleteInstance(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(instances).where(eq(instances.id, id));
}

// ===== Chat Functions =====

export async function createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(chatMessages).values(message);
  const insertId = Number((result as any)[0]?.insertId ?? (result as any).insertId);
  if (!insertId || isNaN(insertId)) {
    throw new Error("Failed to get insert ID");
  }
  const [created] = await db
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.id, insertId));
  if (!created) throw new Error("Failed to create chat message");
  return created;
}

export async function getChatHistory(
  userId: number,
  instanceId: number,
  limit: number = 100
): Promise<ChatMessage[]> {
  const db = await getDb();
  if (!db) return [];

  const results = await db
    .select()
    .from(chatMessages)
    .where(and(eq(chatMessages.userId, userId), eq(chatMessages.instanceId, instanceId)))
    .orderBy(desc(chatMessages.createdAt), desc(chatMessages.id))
    .limit(limit);

  return results.reverse();
}

// ===== Skill Functions =====

export async function getAllSkills(): Promise<Skill[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(skills).orderBy(desc(skills.downloadCount));
}

export async function getSkillsByCategory(category: string): Promise<Skill[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(skills).where(eq(skills.category, category)).orderBy(desc(skills.downloadCount));
}

export async function getSkillById(id: number): Promise<Skill | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(skills).where(eq(skills.id, id)).limit(1);
  return result[0];
}

export async function getSkillByName(name: string): Promise<Skill | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(skills).where(eq(skills.name, name)).limit(1);
  return result[0];
}

export async function createSkill(skill: InsertSkill): Promise<Skill> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(skills).values(skill);
  const insertId = (result as any).insertId;
  if (!insertId || isNaN(Number(insertId))) {
    // Fallback: find by name if insertId is not available
    const [created] = await db.select().from(skills).where(eq(skills.name, skill.name)).limit(1);
    if (!created) throw new Error("Failed to create skill");
    return created;
  }
  const [created] = await db.select().from(skills).where(eq(skills.id, Number(insertId)));
  if (!created) throw new Error("Failed to create skill");
  return created;
}

export async function updateSkill(id: number, updates: Partial<Omit<Skill, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(skills).set({ ...updates, updatedAt: new Date() }).where(eq(skills.id, id));
}

export async function deleteSkill(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(skills).where(eq(skills.id, id));
}

export async function incrementSkillDownloadCount(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const skill = await getSkillById(id);
  if (skill) {
    await updateSkill(id, { downloadCount: (skill.downloadCount || 0) + 1 });
  }
}

export async function recordSkillUsage(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const skill = await getSkillById(id);
  if (skill) {
    await updateSkill(id, { 
      usage_count: (skill.usage_count || 0) + 1,
      last_used_at: new Date()
    });
  }
}

// ===== Installed Skill Functions =====

export async function getInstalledSkillsByInstanceId(instanceId: number): Promise<InstalledSkill[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(installedSkills).where(eq(installedSkills.instanceId, instanceId));
}

export async function getInstalledSkill(instanceId: number, skillId: number): Promise<InstalledSkill | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(installedSkills)
    .where(and(eq(installedSkills.instanceId, instanceId), eq(installedSkills.skillId, skillId)))
    .limit(1);
  return result[0];
}

export async function createInstalledSkill(installedSkill: InsertInstalledSkill): Promise<InstalledSkill> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(installedSkills).values(installedSkill);
  const insertId = (result as any).insertId;
  if (!insertId || isNaN(Number(insertId))) {
    const [created] = await db.select().from(installedSkills)
      .where(and(
        eq(installedSkills.instanceId, installedSkill.instanceId),
        eq(installedSkills.skillId, installedSkill.skillId)
      ))
      .limit(1);
    if (!created) throw new Error("Failed to create installed skill");
    return created;
  }
  const [created] = await db.select().from(installedSkills).where(eq(installedSkills.id, Number(insertId)));
  if (!created) throw new Error("Failed to create installed skill");
  return created;
}

export async function updateInstalledSkill(id: number, updates: Partial<Omit<InstalledSkill, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(installedSkills).set({ ...updates, updatedAt: new Date() }).where(eq(installedSkills.id, id));
}

export async function deleteInstalledSkill(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(installedSkills).where(eq(installedSkills.id, id));
}

// ===== Skill Collection Functions =====

export async function getSkillCollectionsByUserId(userId: number): Promise<SkillCollection[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(skillCollections).where(eq(skillCollections.userId, userId)).orderBy(desc(skillCollections.createdAt));
}

export async function getSkillCollectionById(id: number): Promise<SkillCollection | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(skillCollections).where(eq(skillCollections.id, id)).limit(1);
  return result[0];
}

export async function getSkillCollectionByIdForUser(
  id: number,
  userId: number
): Promise<SkillCollection | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(skillCollections)
    .where(and(eq(skillCollections.id, id), eq(skillCollections.userId, userId)))
    .limit(1);
  return result[0];
}

export async function createSkillCollection(collection: InsertSkillCollection): Promise<SkillCollection> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(skillCollections).values(collection);
  const insertId = (result as any).insertId;
  if (!insertId || isNaN(Number(insertId))) {
    const [created] = await db.select().from(skillCollections)
      .where(and(
        eq(skillCollections.userId, collection.userId),
        eq(skillCollections.name, collection.name)
      ))
      .limit(1);
    if (!created) throw new Error("Failed to create skill collection");
    return created;
  }
  const [created] = await db.select().from(skillCollections).where(eq(skillCollections.id, Number(insertId)));
  if (!created) throw new Error("Failed to create skill collection");
  return created;
}

export async function updateSkillCollection(id: number, updates: Partial<Omit<SkillCollection, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(skillCollections).set({ ...updates, updatedAt: new Date() }).where(eq(skillCollections.id, id));
}

export async function updateSkillCollectionForUser(
  id: number,
  userId: number,
  updates: Partial<Omit<SkillCollection, "id" | "createdAt" | "updatedAt">>
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(skillCollections)
    .set({ ...updates, updatedAt: new Date() })
    .where(and(eq(skillCollections.id, id), eq(skillCollections.userId, userId)));
}

export async function deleteSkillCollection(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(skillCollections).where(eq(skillCollections.id, id));
}

export async function deleteSkillCollectionForUser(id: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .delete(skillCollections)
    .where(and(eq(skillCollections.id, id), eq(skillCollections.userId, userId)));
}

// ===== Credit Functions =====

const DEFAULT_CREDITS = 1250; // stored as tenths; 1250 = 125.0 display credits (~7 days trial)

export async function getUserCredits(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const result = await db.select({ credits: users.credits }).from(users).where(eq(users.id, userId)).limit(1);
  return result[0]?.credits ?? 0;
}

export async function addCredits(
  userId: number,
  amount: number,
  type: InsertCreditTransaction["type"],
  description?: string,
  referenceId?: string
): Promise<{ credits: number; transaction: CreditTransaction }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get current balance
  const currentCredits = await getUserCredits(userId);
  const newBalance = currentCredits + amount;

  if (newBalance < 0) {
    throw new Error("Insufficient credits");
  }

  // Update the user's credit balance
  await db.update(users).set({ credits: newBalance, updatedAt: new Date() }).where(eq(users.id, userId));

  // Record the transaction
  const result = await db.insert(creditTransactions).values({
    userId,
    amount,
    balance: newBalance,
    type,
    description: description ?? null,
    referenceId: referenceId ?? null,
  });

  const insertId = Number((result as any)[0]?.insertId ?? (result as any).insertId);
  const [transaction] = await db
    .select()
    .from(creditTransactions)
    .where(eq(creditTransactions.id, insertId));

  if (!transaction) throw new Error("Failed to record credit transaction");

  return { credits: newBalance, transaction };
}

export async function deductCredits(
  userId: number,
  amount: number,
  description?: string,
  referenceId?: string
): Promise<{ credits: number; transaction: CreditTransaction }> {
  if (amount <= 0) throw new Error("Deduction amount must be positive");
  return addCredits(userId, -amount, "deduction", description, referenceId);
}

export async function initializeUserCredits(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  // Set credits to default and record an initial transaction
  await db.update(users).set({ credits: DEFAULT_CREDITS, updatedAt: new Date() }).where(eq(users.id, userId));

  await db.insert(creditTransactions).values({
    userId,
    amount: DEFAULT_CREDITS,
    balance: DEFAULT_CREDITS,
    type: "initial",
    description: "Welcome credits",
  });
}

export async function getCreditTransactions(
  userId: number,
  limit: number = 50,
  offset: number = 0
): Promise<CreditTransaction[]> {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(creditTransactions)
    .where(eq(creditTransactions.userId, userId))
    .orderBy(desc(creditTransactions.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function getCreditTransactionById(
  id: number,
  userId: number
): Promise<CreditTransaction | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(creditTransactions)
    .where(and(eq(creditTransactions.id, id), eq(creditTransactions.userId, userId)))
    .limit(1);
  return result[0];
}

export async function hasTransactionWithReference(
  userId: number,
  referenceId: string
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const result = await db
    .select({ id: creditTransactions.id })
    .from(creditTransactions)
    .where(
      and(
        eq(creditTransactions.userId, userId),
        eq(creditTransactions.referenceId, referenceId)
      )
    )
    .limit(1);
  return result.length > 0;
}

// ===== Plan & Refresh Functions =====

export async function getAllUsers(): Promise<User[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users);
}

export async function updateUserLastDailyRefresh(userId: number, date: Date): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ lastDailyRefresh: date }).where(eq(users.id, userId));
}

export async function getUserWithPlan(userId: number): Promise<{ credits: number; plan: string } | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select({ credits: users.credits, plan: users.plan })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return result[0];
}
