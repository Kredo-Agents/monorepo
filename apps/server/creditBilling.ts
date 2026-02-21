import { INSTANCE_DAILY_COST } from "@shared/const";
import * as db from "./db";
import * as docker from "./docker";

const BILLING_INTERVAL_MS = 60 * 60 * 1000; // check every hour

function todaysBillingRef(): string {
  return `billing:daily:${new Date().toISOString().split("T")[0]}`;
}

export function startCreditBilling() {
  console.log("[CreditBilling] Starting periodic billing loop (every 1h)");
  // Run first cycle after a short delay to let the server finish starting
  setTimeout(() => void runBillingCycle(), 10_000);
  setInterval(() => void runBillingCycle(), BILLING_INTERVAL_MS);
}

async function runBillingCycle() {
  try {
    const allInstances = await db.getAllInstances();
    const runningInstances = allInstances.filter(i => i.status === "running");

    if (runningInstances.length === 0) return;

    // Group by userId
    const byUser = new Map<number, typeof runningInstances>();
    for (const instance of runningInstances) {
      const list = byUser.get(instance.userId) || [];
      list.push(instance);
      byUser.set(instance.userId, list);
    }

    const ref = todaysBillingRef();

    for (const [userId, userInstances] of byUser) {
      // Check the database (not in-memory) to see if already billed today
      const alreadyBilled = await db.hasTransactionWithReference(userId, ref);
      if (alreadyBilled) continue;

      const totalCost = userInstances.length * INSTANCE_DAILY_COST;
      const userCredits = await db.getUserCredits(userId);

      if (userCredits >= totalCost) {
        await db.deductCredits(
          userId,
          totalCost,
          `Daily instance billing (${userInstances.length} instance(s))`,
          ref,
        );
        console.log(`[CreditBilling] Billed user ${userId}: ${totalCost} tenths for ${userInstances.length} instance(s)`);
      } else {
        // Insufficient credits — stop all running instances for this user
        console.log(`[CreditBilling] User ${userId} has insufficient credits (${userCredits}). Stopping instances.`);
        for (const instance of userInstances) {
          try {
            await docker.stopInstance(instance.id.toString());
            await db.updateInstance(instance.id, { status: "stopped" });
          } catch (err) {
            console.error(`[CreditBilling] Failed to stop instance ${instance.id}:`, err);
          }
        }
        // Drain remaining credits as partial charge
        if (userCredits > 0) {
          await db.deductCredits(
            userId,
            userCredits,
            "Partial daily billing - instances stopped due to insufficient credits",
            `billing:daily:partial:${new Date().toISOString().split("T")[0]}`,
          );
        }
      }
    }
  } catch (error) {
    console.error("[CreditBilling] Error in billing cycle:", error);
  }
}
