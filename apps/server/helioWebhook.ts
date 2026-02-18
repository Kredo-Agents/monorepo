import type { Request, Response } from "express";
import { CREDIT_DIVISOR } from "@shared/const";
import { ENV } from "./_core/env";
import * as db from "./db";

/** Map a Helio paylinkId to display credits for that tier */
function getTierCredits(paylinkId: string): number | null {
  const tiers: Record<string, number> = {};
  if (ENV.helioPaylinkIds.tier100) tiers[ENV.helioPaylinkIds.tier100] = 100;
  if (ENV.helioPaylinkIds.tier500) tiers[ENV.helioPaylinkIds.tier500] = 500;
  if (ENV.helioPaylinkIds.tier1000) tiers[ENV.helioPaylinkIds.tier1000] = 1000;
  return tiers[paylinkId] ?? null;
}

/**
 * Express handler for Helio (MoonPay Commerce) payment webhooks.
 * POST /api/webhooks/helio
 *
 * Flow:
 * 1. Verify sharedToken matches HELIO_WEBHOOK_SECRET
 * 2. Only process "COMPLETED" events
 * 3. Map paylinkId -> credit tier
 * 4. Extract userId from additionalJSON (passed by client checkout widget)
 * 5. Idempotency check via referenceId
 * 6. Add credits to user account
 */
export async function handleHelioWebhook(req: Request, res: Response) {
  try {
    const body = req.body ?? {};
    const event = body.event ?? body.transactionStatus;
    const data = body.data ?? body;

    // Verify webhook authenticity
    const sharedToken =
      data?.sharedToken ||
      req.headers["x-helio-shared-token"] ||
      req.headers["authorization"]?.replace("Bearer ", "");

    if (!ENV.helioWebhookSecret) {
      console.warn("[Helio] HELIO_WEBHOOK_SECRET not configured, rejecting webhook");
      return res.status(503).json({ error: "Payments not configured" });
    }

    if (!sharedToken || sharedToken !== ENV.helioWebhookSecret) {
      console.warn("[Helio] Invalid webhook shared token");
      return res.status(401).json({ error: "Invalid shared token" });
    }

    // Only process completed payment events
    const normalizedEvent = String(event).toUpperCase();
    if (normalizedEvent !== "COMPLETED" && normalizedEvent !== "SUCCESS") {
      console.log(`[Helio] Ignoring event type: ${event}`);
      return res.status(200).json({ ok: true });
    }

    const paylinkId = data?.paylinkId ?? data?.paymentRequestId;
    const transactionId = data?.transactionId ?? data?.id ?? data?.transactionSignature;

    // Extract userId from additionalJSON (set by client checkout widget)
    let userId: number | undefined;
    try {
      const additionalJSON =
        typeof data?.customerDetails?.additionalJSON === "string"
          ? JSON.parse(data.customerDetails.additionalJSON)
          : data?.customerDetails?.additionalJSON ?? data?.meta;
      userId = parseInt(additionalJSON?.userId, 10);
    } catch {
      // fall through
    }

    if (!userId || isNaN(userId)) {
      console.error("[Helio] No valid userId in webhook payload:", JSON.stringify(data).slice(0, 500));
      return res.status(400).json({ error: "Missing userId in additionalJSON" });
    }

    const displayCredits = getTierCredits(paylinkId);
    if (!displayCredits) {
      console.error("[Helio] Unknown paylinkId:", paylinkId);
      return res.status(400).json({ error: "Unknown paylink tier" });
    }

    const storedAmount = displayCredits * CREDIT_DIVISOR;
    const refId = `helio:${transactionId}`;

    // Idempotency: check if this transaction was already processed
    const recentTxs = await db.getCreditTransactions(userId, 20, 0);
    if (recentTxs.some(tx => tx.referenceId === refId)) {
      console.log(`[Helio] Transaction ${transactionId} already processed for user ${userId}`);
      return res.status(200).json({ ok: true, duplicate: true });
    }

    // Add credits
    await db.addCredits(
      userId,
      storedAmount,
      "topup",
      `Purchased ${displayCredits} credits via Helio`,
      refId,
    );

    console.log(`[Helio] Added ${displayCredits} credits (${storedAmount} stored) to user ${userId} (tx: ${transactionId})`);
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("[Helio] Webhook error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
