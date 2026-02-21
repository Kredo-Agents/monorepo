import { TRPCError } from "@trpc/server";
import { CHAT_MESSAGE_COST, INSUFFICIENT_CREDITS_MSG } from "@shared/const";
import * as db from "./db";
import { readGatewayToken } from "./docker";

export type ChatHistoryMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

type ChatRequest = {
  userId: number;
  instanceId: number;
  message: string;
  history?: ChatHistoryMessage[];
};

export async function handleChatRequest({
  userId,
  instanceId,
  message,
  history,
}: ChatRequest) {
  if (!message?.trim()) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Message is required" });
  }

  const instance = await db.getInstanceByIdForUser(instanceId, userId);
  if (!instance) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Instance not found" });
  }

  if (instance.status !== "running") {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Instance is not running" });
  }

  if (!instance.port) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Instance port not configured" });
  }

  // Check and deduct credits before processing
  const userCredits = await db.getUserCredits(userId);
  if (userCredits < CHAT_MESSAGE_COST) {
    throw new TRPCError({ code: "FORBIDDEN", message: INSUFFICIENT_CREDITS_MSG });
  }

  await db.deductCredits(userId, CHAT_MESSAGE_COST, "Chat message", `chat:${instanceId}`);

  await db.createChatMessage({
    userId,
    instanceId,
    role: "user",
    content: message,
  });

  // Get gateway token from config file
  const gatewayToken = await readGatewayToken(instanceId.toString()) ?? "";

  // Call OpenClaw Gateway OpenAI-compatible Chat Completions endpoint.
  const gatewayUrl = `http://localhost:${instance.port}/v1/chat/completions`;
  const messages = [...(history || []), { role: "user", content: message }];

  let fetchResponse: Response;
  try {
    fetchResponse = await fetch(gatewayUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(gatewayToken ? { "Authorization": `Bearer ${gatewayToken}` } : {}),
      },
      body: JSON.stringify({
        model: "openclaw:main",
        messages,
        user: `user-${userId}`,
      }),
    });
  } catch (err) {
    console.error("Gateway chat request failed:", err);
    // Refund the credit since the request never reached the gateway
    await db.addCredits(userId, CHAT_MESSAGE_COST, "refund", "Chat message failed - refund", `chat:${instanceId}`);
    throw new TRPCError({
      code: "SERVICE_UNAVAILABLE",
      message:
        "Unable to reach the gateway. Ensure the instance is running and the gateway is accessible.",
    });
  }

  if (!fetchResponse.ok) {
    // Refund on gateway error
    await db.addCredits(userId, CHAT_MESSAGE_COST, "refund", "Chat message failed - refund", `chat:${instanceId}`);
    if (fetchResponse.status === 404) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message:
          "Gateway chat completions endpoint is disabled. Enable gateway.http.endpoints.chatCompletions.enabled=true and restart the instance.",
      });
    }
    const errorText = await fetchResponse.text();
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Gateway chat request failed (${fetchResponse.status}): ${errorText || fetchResponse.statusText}`,
    });
  }

  let response: { choices?: Array<{ message?: { content?: string } }> };
  try {
    response = await fetchResponse.json();
  } catch (err) {
    console.error("Failed to parse gateway response:", err);
    await db.addCredits(userId, CHAT_MESSAGE_COST, "refund", "Chat message failed - refund", `chat:${instanceId}`);
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Gateway chat response was not valid JSON.",
    });
  }
  const assistantResponse = response?.choices?.[0]?.message?.content;

  if (!assistantResponse) {
    await db.addCredits(userId, CHAT_MESSAGE_COST, "refund", "Chat message failed - refund", `chat:${instanceId}`);
    throw new TRPCError({ code: "BAD_REQUEST", message: "Gateway chat response was empty." });
  }

  await db.createChatMessage({
    userId,
    instanceId,
    role: "assistant",
    content: assistantResponse,
  });

  return {
    response: assistantResponse,
    instanceId,
  };
}
