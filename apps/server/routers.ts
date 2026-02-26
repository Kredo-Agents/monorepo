import { COOKIE_NAME, INSTANCE_DAILY_COST, CREDIT_DIVISOR, PLANS, DEFAULT_PLAN, type PlanTier } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { ENV } from "./_core/env";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { handleChatRequest } from "./chat";
import * as cron from "./cron";
import * as db from "./db";
import { syncSkills } from "./skillsSync";
import * as docker from "./docker";
import * as gatewayBridge from "./gatewayBridge";

const BASE_INSTANCE_PORT = 18790;

async function getOwnedInstanceOrThrow(instanceId: number, userId: number) {
  const instance = await db.getInstanceByIdForUser(instanceId, userId);
  if (!instance) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Instance not found" });
  }
  return instance;
}

async function getOwnedCollectionOrThrow(collectionId: number, userId: number) {
  const collection = await db.getSkillCollectionByIdForUser(collectionId, userId);
  if (!collection) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Collection not found" });
  }
  return collection;
}

async function getNextAvailableInstancePort(): Promise<number> {
  const usedPorts = new Set(await db.getUsedInstancePorts());
  let port = BASE_INSTANCE_PORT;
  while (usedPorts.has(port)) {
    port += 1;
  }
  return port;
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  instances: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const instances = await db.getInstancesByUserId(ctx.user.id);
      return Promise.all(
        instances.map(async (instance) => {
          if (instance.status !== "running") {
            return {
              ...instance,
              runtimeStatus: instance.status,
              openclawReady: false,
            };
          }

          const runtime = await docker.getInstanceStatus(instance.id.toString());
          if (!runtime.success) {
            return {
              ...instance,
              runtimeStatus: "error",
              openclawReady: false,
            };
          }

          let gatewayReady = false;
          let gatewayStatus: string | undefined;
          if (instance.port && runtime.running) {
            const gateway = await docker.getGatewayStatus(instance.port);
            gatewayReady = Boolean(gateway.ready);
            gatewayStatus = gateway.status;
          }

          const resolvedStatus = gatewayReady
            ? "ready"
            : runtime.openclawStatus === "error"
            ? "error"
            : runtime.openclawStatus || "starting";

          return {
            ...instance,
            runtimeStatus: resolvedStatus,
            openclawReady: gatewayReady,
            gatewayStatus,
            containerStatus: runtime.status,
            healthStatus: runtime.healthStatus,
          };
        })
      );
    }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        return getOwnedInstanceOrThrow(input.id, ctx.user.id);
      }),

    create: protectedProcedure
      .input(z.object({
        name: z.string(),
        description: z.string().optional(),
        llmProvider: z.string().optional(),
        llmApiKey: z.string().optional(),
        llmModel: z.string().optional(),
        config: z.object({
          provider: z.string().optional().default("google"),
          model: z.string().optional(),
          authToken: z.string().optional(),
          telegram: z.object({
            botToken: z.string(),
            chatId: z.string().optional(),
          }).optional(),
          discord: z.object({
            token: z.string(),
            guildId: z.string().optional(),
            channelId: z.string().optional(),
          }).optional(),
          slack: z.object({
            botToken: z.string(),
            appToken: z.string(),
          }).optional(),
          matrix: z.object({
            homeserverUrl: z.string(),
            accessToken: z.string(),
            roomId: z.string().optional(),
            dmPolicy: z.enum(["pairing", "open", "allowlist", "disabled"]).optional(),
          }).optional(),
          whatsapp: z.object({
            phoneNumberId: z.string(),
            accessToken: z.string(),
            verifyToken: z.string().optional(),
            webhookUrl: z.string().optional(),
          }).optional(),
        }).superRefine((config, ctx) => {
          const envGoogleApiKey = process.env.GOOGLE_API_KEY;
          if (!config.authToken?.trim() && !envGoogleApiKey?.trim()) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Google API key is required.",
              path: ["authToken"],
            });
          }
        }),
      }))
      .mutation(async ({ ctx, input }) => {
        let lastError: string | undefined;
        const existingInstances = await db.getInstancesByUserId(ctx.user.id);
        if (existingInstances.length > 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Only one assistant is allowed per user.",
          });
        }

        // Check credits before creating instance
        const userCredits = await db.getUserCredits(ctx.user.id);
        if (userCredits < INSTANCE_DAILY_COST) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Insufficient credits to create an instance. Running instances cost 7.5 credits/day.",
          });
        }

        const envGoogleApiKey = process.env.GOOGLE_API_KEY;
        const resolvedAuthToken = input.config.authToken || envGoogleApiKey;
        const resolvedConfig = {
          ...input.config,
          provider: "google",
          authToken: resolvedAuthToken,
        };

        for (let attempt = 0; attempt < 3; attempt += 1) {
          const nextPort = await getNextAvailableInstancePort();

          const instance = await db.createInstance({
            userId: ctx.user.id,
            name: input.name,
            description: input.description ?? undefined,
            llmProvider: input.llmProvider ?? undefined,
            llmApiKey: input.llmApiKey ?? undefined,
            llmModel: input.llmModel ?? undefined,
            config: resolvedConfig,
            status: "stopped",
            port: nextPort,
          });

          try {
            const dockerResult = await docker.createInstance({
              instanceId: instance.id.toString(),
              name: input.name,
              port: nextPort,
              model: input.config.model,
              authToken: resolvedAuthToken,
              telegramToken: input.config.telegram?.botToken,
              telegramChatId: input.config.telegram?.chatId,
              discordToken: input.config.discord?.token,
              discordGuildId: input.config.discord?.guildId,
              discordChannelId: input.config.discord?.channelId,
              slackBotToken: input.config.slack?.botToken,
              slackAppToken: input.config.slack?.appToken,
              matrixHomeserverUrl: input.config.matrix?.homeserverUrl,
              matrixAccessToken: input.config.matrix?.accessToken,
              matrixRoomId: input.config.matrix?.roomId,
              matrixDmPolicy: input.config.matrix?.dmPolicy,
              whatsappPhoneNumberId: input.config.whatsapp?.phoneNumberId,
              whatsappAccessToken: input.config.whatsapp?.accessToken,
              whatsappVerifyToken: input.config.whatsapp?.verifyToken,
              whatsappWebhookUrl: input.config.whatsapp?.webhookUrl,
            });

            if (!dockerResult.success) {
              lastError = dockerResult.error || "Failed to create instance";
              await db.deleteInstance(instance.id);
              await docker.deleteInstance(instance.id.toString());
              continue;
            }

            await db.updateInstance(instance.id, { status: "running" });

            // Schedule WS pairing with the gateway (non-blocking)
            if (dockerResult.gatewayToken) {
              gatewayBridge.scheduleConnect(
                instance.id.toString(),
                nextPort,
                dockerResult.gatewayToken,
              );
            }

            return instance;
          } catch (error) {
            lastError = error instanceof Error ? error.message : String(error);
            await db.deleteInstance(instance.id);
            await docker.deleteInstance(instance.id.toString());
          }
        }

        throw new Error(lastError || "Failed to create instance");
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        llmProvider: z.string().optional(),
        llmApiKey: z.string().optional(),
        llmModel: z.string().optional(),
        status: z.enum(["running", "stopped", "error"]).optional(),
        config: z.record(z.string(), z.unknown()).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...updates } = input;
        
        // Get current instance
        const instance = await getOwnedInstanceOrThrow(id, ctx.user.id);
        
        // Update database
        if (Object.keys(updates).length > 0) {
          await db.updateInstance(id, updates);
        }
        
        // If instance is running, restart it to apply changes
        if (instance.status === "running") {
          await docker.stopInstance(id.toString());
          await docker.startInstance(id.toString());
        }
        
        return { success: true };
      }),

    approveTelegramPairing: protectedProcedure
      .input(z.object({
        id: z.number(),
        code: z.string().min(1),
      }))
      .mutation(async ({ ctx, input }) => {
        const instance = await getOwnedInstanceOrThrow(input.id, ctx.user.id);
        if (instance.status !== "running") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Instance is not running",
          });
        }
        const result = await docker.approveTelegramPairing(
          instance.id.toString(),
          input.code.trim()
        );
        if (!result.success) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: result.error || "Failed to approve pairing",
          });
        }
        return result;
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await getOwnedInstanceOrThrow(input.id, ctx.user.id);
        // Disconnect WS bridge, then delete Docker container
        gatewayBridge.disconnectGateway(input.id.toString());
        await docker.deleteInstance(input.id.toString());
        // Then delete from database
        await db.deleteInstance(input.id);
        return { success: true };
      }),

    start: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        // Get instance config from database
        const instance = await getOwnedInstanceOrThrow(input.id, ctx.user.id);
        if (!instance.port) {
          return { success: false, error: "Instance port not configured" };
        }

        // Check credits before starting instance
        const startCredits = await db.getUserCredits(ctx.user.id);
        if (startCredits < INSTANCE_DAILY_COST) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Insufficient credits to start an instance. Running instances cost 7.5 credits/day.",
          });
        }

        // Prepare config for container recreation
        const config = instance.config as any;
        const envGoogleApiKey = process.env.GOOGLE_API_KEY;
        const resolvedAuthToken = config.authToken || envGoogleApiKey;
        const instanceConfig = {
          instanceId: instance.id.toString(),
          name: instance.name,
          port: instance.port,
          model: instance.llmModel || config.model,
          authToken: resolvedAuthToken,
          telegramToken: config.telegram?.botToken,
          telegramChatId: config.telegram?.chatId,
          discordToken: config.discord?.token,
          discordGuildId: config.discord?.guildId,
          discordChannelId: config.discord?.channelId,
          slackBotToken: config.slack?.botToken,
          slackAppToken: config.slack?.appToken,
          matrixHomeserverUrl: config.matrix?.homeserverUrl,
          matrixAccessToken: config.matrix?.accessToken,
          matrixRoomId: config.matrix?.roomId,
          matrixDmPolicy: config.matrix?.dmPolicy,
          whatsappPhoneNumberId: config.whatsapp?.phoneNumberId,
          whatsappAccessToken: config.whatsapp?.accessToken,
          whatsappVerifyToken: config.whatsapp?.verifyToken,
          whatsappWebhookUrl: config.whatsapp?.webhookUrl,
        };
        
        const result = await docker.startInstance(instance.id.toString(), instanceConfig);
        if (result.success) {
          await db.updateInstance(input.id, { status: "running" });

          // Schedule WS pairing with the gateway (non-blocking)
          const token = await docker.readGatewayToken(instance.id.toString());
          if (token && instance.port) {
            gatewayBridge.scheduleConnect(
              instance.id.toString(),
              instance.port,
              token,
            );
          }
        }
        return result;
      }),

    stop: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await getOwnedInstanceOrThrow(input.id, ctx.user.id);
        gatewayBridge.disconnectGateway(input.id.toString());
        const result = await docker.stopInstance(input.id.toString());
        if (result.success) {
          await db.updateInstance(input.id, { status: "stopped" });
        }
        return result;
      }),

    status: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const instance = await getOwnedInstanceOrThrow(input.id, ctx.user.id);
        const runtime = await docker.getInstanceStatus(input.id.toString());
        if (!runtime.success) {
          return {
            ...runtime,
            gatewayStatus: undefined,
          };
        }

        const wsStatus = gatewayBridge.getConnectionStatus(input.id.toString());

        if (instance.port && runtime.running) {
          const gateway = await docker.getGatewayStatus(instance.port);
          return {
            ...runtime,
            gatewayReady: gateway.ready,
            gatewayStatus: gateway.status,
            openclawReady: Boolean(gateway.ready),
            openclawStatus: gateway.ready ? "ready" : runtime.openclawStatus,
            wsPaired: wsStatus?.state === "connected",
            wsState: wsStatus?.state ?? null,
          };
        }

        return {
          ...runtime,
          gatewayStatus: undefined,
        };
      }),

    logs: protectedProcedure
      .input(z.object({ 
        id: z.number(),
        tail: z.number().optional(),
      }))
      .query(async ({ ctx, input }) => {
        await getOwnedInstanceOrThrow(input.id, ctx.user.id);
        return docker.getInstanceLogs(input.id.toString(), input.tail);
      }),

    stats: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        await getOwnedInstanceOrThrow(input.id, ctx.user.id);
        return docker.getInstanceStats(input.id.toString());
      }),
  }),

  chat: router({
    history: protectedProcedure
      .input(z.object({
        instanceId: z.number(),
        limit: z.number().min(1).max(500).optional(),
      }))
      .query(async ({ ctx, input }) => {
        await getOwnedInstanceOrThrow(input.instanceId, ctx.user.id);
        return db.getChatHistory(ctx.user.id, input.instanceId, input.limit ?? 100);
      }),

    send: protectedProcedure
      .input(z.object({
        instanceId: z.number(),
        message: z.string(),
        model: z.enum(["premium", "cheap"]).optional().default("premium"),
        history: z.array(
          z.object({
            role: z.enum(["user", "assistant", "system"]),
            content: z.string(),
          })
        ).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return handleChatRequest({
          userId: ctx.user.id,
          instanceId: input.instanceId,
          message: input.message,
          history: input.history,
          model: input.model,
        });
      }),
  }),

  skills: router({
    list: publicProcedure.query(async () => {
      return db.getAllSkills();
    }),

    search: publicProcedure
      .input(z.object({
        query: z.string().optional(),
        category: z.string().optional(),
        provider: z.string().optional(),
      }))
      .query(async ({ input }) => {
        const allSkills = await db.getAllSkills();
        return allSkills.filter((skill) => {
          if (input.query) {
            const query = input.query.toLowerCase();
            if (
              !skill.displayName.toLowerCase().includes(query) &&
              !skill.description?.toLowerCase().includes(query)
            ) {
              return false;
            }
          }
          if (input.category && skill.category !== input.category) {
            return false;
          }
          if (input.provider && skill.provider !== input.provider) {
            return false;
          }
          return true;
        });
      }),

    get: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getSkillById(input.id);
      }),

    getInstalled: protectedProcedure
      .input(z.object({ instanceId: z.number() }))
      .query(async ({ ctx, input }) => {
        await getOwnedInstanceOrThrow(input.instanceId, ctx.user.id);
        return db.getInstalledSkillsByInstanceId(input.instanceId);
      }),

    install: protectedProcedure
      .input(z.object({
        instanceId: z.number(),
        skillId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        await getOwnedInstanceOrThrow(input.instanceId, ctx.user.id);
        const installed = await db.createInstalledSkill({
          instanceId: input.instanceId,
          skillId: input.skillId,
          status: "installing",
        });

        try {
          // Get skill details
          const skill = await db.getSkillById(input.skillId);
          if (!skill) {
            throw new Error("Skill not found");
          }

          // Install skill to Docker instance
          // Get skill content from metadata or create a simple SKILL.md file
          const skillContent = (skill.metadata as any)?.content || `# ${skill.displayName}\n\n${skill.description || ""}\n\nCategory: ${skill.category || "Unknown"}\nAuthor: ${skill.author || "Unknown"}\nSource: ${skill.sourceUrl || "N/A"}`;
          
          const result = await docker.installSkillToInstance(
            input.instanceId.toString(),
            skill.name,
            skillContent
          );

          if (!result.success) {
            throw new Error(result.error || "Failed to install skill");
          }

          // Restart container to apply skills
          const instance = await db.getInstanceById(input.instanceId);
          if (instance && instance.status === "running") {
            // Stop and start to reload skills
            await docker.stopInstance(input.instanceId.toString());
            await docker.startInstance(input.instanceId.toString());
          }

          // Mark as installed
          await db.updateInstalledSkill(installed.id, {
            status: "installed",
          });

          await db.incrementSkillDownloadCount(input.skillId);
          return { success: true };
        } catch (error) {
          // Mark as failed
          await db.updateInstalledSkill(installed.id, {
            status: "failed",
          });
          throw error;
        }
      }),

    installBatch: protectedProcedure
      .input(z.object({
        instanceId: z.number(),
        skillIds: z.array(z.number()),
      }))
      .mutation(async ({ ctx, input }) => {
        await getOwnedInstanceOrThrow(input.instanceId, ctx.user.id);
        const results = [];
        for (const skillId of input.skillIds) {
          try {
            const installed = await db.createInstalledSkill({
              instanceId: input.instanceId,
              skillId,
              status: "installing",
            });
            await db.incrementSkillDownloadCount(skillId);
            await db.updateInstalledSkill(installed.id, { status: "installed" });
            results.push({ skillId, success: true });
          } catch (error) {
            results.push({ skillId, success: false, error: String(error) });
          }
        }
        return { results };
      }),

    uninstall: protectedProcedure
      .input(z.object({
        instanceId: z.number(),
        skillId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        await getOwnedInstanceOrThrow(input.instanceId, ctx.user.id);
        const installed = await db.getInstalledSkill(input.instanceId, input.skillId);
        if (!installed) {
          throw new Error("Skill not installed");
        }

        await db.updateInstalledSkill(installed.id, { status: "uninstalling" });
        
        try {
          const skill = await db.getSkillById(input.skillId);
          if (!skill) {
            throw new Error("Skill not found");
          }

          const result = await docker.removeSkillFromInstance(
            input.instanceId.toString(),
            skill.name
          );
          if (!result.success) {
            throw new Error(result.error || "Failed to uninstall skill");
          }

          await db.deleteInstalledSkill(installed.id);
          return { success: true };
        } catch (error) {
          await db.updateInstalledSkill(installed.id, { status: "failed" });
          throw error;
        }
      }),

    updateConfig: protectedProcedure
      .input(z.object({
        instanceId: z.number(),
        skillId: z.number(),
        config: z.record(z.string(), z.unknown()),
      }))
      .mutation(async ({ ctx, input }) => {
        await getOwnedInstanceOrThrow(input.instanceId, ctx.user.id);
        const installed = await db.getInstalledSkill(input.instanceId, input.skillId);
        if (!installed) {
          throw new Error("Skill not installed");
        }

        await db.updateInstalledSkill(installed.id, { config: input.config });
        return { success: true };
      }),

    sync: publicProcedure.mutation(async () => {
      try {
        await syncSkills();
        return { success: true };
      } catch (error) {
        throw new Error(`Failed to sync skills: ${String(error)}`);
      }
    }),

    createCustom: publicProcedure
      .input(z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        content: z.string().min(1),
        category: z.string().optional(),
        tags: z.array(z.string()).optional(),
      }))
      .mutation(async ({ input }) => {
        // Create custom skill with provider='custom'
        const skill = await db.createSkill({
          name: input.name,
          displayName: input.name,
          description: input.description ?? '',
          provider: 'custom',
          author: 'Custom',
          category: input.category ?? 'general',
          sourceUrl: '',
          downloadCount: 0,
          rating: 0,
          tags: input.tags ?? [],
          metadata: { content: input.content },
        });
        return skill;
      }),

    updateCustom: publicProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        content: z.string().min(1).optional(),
        category: z.string().optional(),
        tags: z.array(z.string()).optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...updates } = input;
        const skill = await db.getSkillById(id);
        if (!skill || skill.provider !== 'custom') {
          throw new Error('Skill not found or not a custom skill');
        }

        const metadata = skill.metadata || {};
        if (input.content) {
          metadata.content = input.content;
        }

        await db.updateSkill(id, {
          name: updates.name,
          displayName: updates.name,
          description: updates.description,
          category: updates.category,
          tags: updates.tags,
          metadata,
        });
        return { success: true };
      }),

    importCustom: publicProcedure
      .input(z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        content: z.string().min(1),
        category: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        // Check if skill with same name already exists
        const allSkills = await db.getAllSkills();
        const existing = allSkills.find(s => s.name === input.name && s.provider === 'custom');
        
        if (existing) {
          throw new Error(`A custom skill with name "${input.name}" already exists`);
        }

        // Create custom skill
        const skill = await db.createSkill({
          name: input.name,
          displayName: input.name,
          description: input.description ?? '',
          provider: 'custom',
          author: 'Custom',
          category: input.category ?? 'general',
          sourceUrl: '',
          downloadCount: 0,
          rating: 0,
          metadata: { content: input.content },
        });
        return skill;
      }),

    deleteCustom: publicProcedure
      .input(z.object({
        id: z.number(),
      }))
      .mutation(async ({ input }) => {
        const skill = await db.getSkillById(input.id);
        if (!skill || skill.provider !== 'custom') {
          throw new Error('Skill not found or not a custom skill');
        }

        await db.deleteSkill(input.id);
        return { success: true };
      }),

    recordUsage: publicProcedure
      .input(z.object({
        id: z.number(),
      }))
      .mutation(async ({ input }) => {
        await db.recordSkillUsage(input.id);
        return { success: true };
      }),

  updateTags: publicProcedure
    .input(z.object({
      id: z.number(),
      tags: z.array(z.string()),
    }))
    .mutation(async ({ input }) => {
      const skill = await db.getSkillById(input.id);
      if (!skill || skill.provider !== 'custom') {
        throw new Error('Skill not found or not a custom skill');
      }

      await db.updateSkill(input.id, { tags: input.tags });
      return { success: true };
    }),

}),

  collections: router({
    list: publicProcedure.query(async ({ ctx }) => {
      // If user is logged in, return their collections; otherwise return empty array
      if (!ctx.user) return [];
      return db.getSkillCollectionsByUserId(ctx.user.id);
    }),

  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      return getOwnedCollectionOrThrow(input.id, ctx.user.id);
    }),

  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      skillIds: z.array(z.number()),
    }))
    .mutation(async ({ ctx, input }) => {
      return db.createSkillCollection({
        userId: ctx.user.id,
        name: input.name,
        description: input.description ?? undefined,
        skillIds: input.skillIds,
      });
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().min(1).optional(),
      description: z.string().optional(),
      skillIds: z.array(z.number()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...updates } = input;
      if (Object.keys(updates).length > 0) {
        await getOwnedCollectionOrThrow(id, ctx.user.id);
        await db.updateSkillCollectionForUser(id, ctx.user.id, updates);
      }
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await getOwnedCollectionOrThrow(input.id, ctx.user.id);
      await db.deleteSkillCollectionForUser(input.id, ctx.user.id);
      return { success: true };
    }),
}),

  credits: router({
    /** Get the current user's credit balance (raw = tenths, displayCredits = human-readable) */
    balance: protectedProcedure.query(async ({ ctx }) => {
      const credits = await db.getUserCredits(ctx.user.id);
      return { credits, displayCredits: credits / CREDIT_DIVISOR };
    }),

    /** Get plan info + credits for the credit popover */
    planInfo: protectedProcedure.query(async ({ ctx }) => {
      const data = await db.getUserWithPlan(ctx.user.id);
      const credits = data?.credits ?? 0;
      const plan = (data?.plan ?? DEFAULT_PLAN) as PlanTier;
      const planConfig = PLANS[plan] || PLANS.free;
      return {
        plan,
        planDisplayName: planConfig.displayName,
        credits,
        displayCredits: credits / CREDIT_DIVISOR,
        dailyRefreshCredits: planConfig.dailyRefreshCredits,
        dailyRefreshDisplay: planConfig.dailyRefreshCredits / CREDIT_DIVISOR,
      };
    }),

    /** List credit transactions for the current user */
    transactions: protectedProcedure
      .input(z.object({
        limit: z.number().min(1).max(200).optional(),
        offset: z.number().min(0).optional(),
      }).optional())
      .query(async ({ ctx, input }) => {
        return db.getCreditTransactions(
          ctx.user.id,
          input?.limit ?? 50,
          input?.offset ?? 0,
        );
      }),

    /** Get a single credit transaction by id */
    getTransaction: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const tx = await db.getCreditTransactionById(input.id, ctx.user.id);
        if (!tx) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Transaction not found" });
        }
        return tx;
      }),

    /** Get payment tier configuration for the client checkout */
    paymentConfig: publicProcedure.query(() => {
      return {
        tiers: [
          { id: "tier100", credits: 100, priceUsd: 5, paylinkId: ENV.helioPaylinkIds.tier100 },
          { id: "tier500", credits: 500, priceUsd: 20, paylinkId: ENV.helioPaylinkIds.tier500 },
          { id: "tier1000", credits: 1000, priceUsd: 35, paylinkId: ENV.helioPaylinkIds.tier1000 },
        ].filter(t => t.paylinkId),
        enabled: Boolean(ENV.helioApiKey),
      };
    }),

    /** Add credits (topup / refund) — admin only. Amount is in display credits (converted to tenths internally). */
    add: adminProcedure
      .input(z.object({
        userId: z.number(),
        amount: z.number().int().positive(),
        type: z.enum(["topup", "refund", "adjustment"]),
        description: z.string().optional(),
        referenceId: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const storedAmount = input.amount * CREDIT_DIVISOR;
        return db.addCredits(
          input.userId,
          storedAmount,
          input.type,
          input.description,
          input.referenceId,
        );
      }),

    /** Deduct credits — admin only. Amount is in display credits (converted to tenths internally). */
    deduct: adminProcedure
      .input(z.object({
        userId: z.number(),
        amount: z.number().int().positive(),
        description: z.string().optional(),
        referenceId: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const storedAmount = input.amount * CREDIT_DIVISOR;
        return db.deductCredits(
          input.userId,
          storedAmount,
          input.description,
          input.referenceId,
        );
      }),
  }),

  automations: router({
    list: protectedProcedure
      .input(z.object({ instanceId: z.number() }))
      .query(async ({ ctx, input }) => {
        await getOwnedInstanceOrThrow(input.instanceId, ctx.user.id);
        return cron.listJobs(input.instanceId, ctx.user.id);
      }),

    add: protectedProcedure
      .input(z.object({
        instanceId: z.number(),
        name: z.string().min(1),
        description: z.string().optional(),
        schedule: z.union([
          z.object({ kind: z.literal("at"), at: z.string() }),
          z.object({ kind: z.literal("every"), everyMs: z.number().int().positive() }),
          z.object({ kind: z.literal("cron"), expr: z.string(), tz: z.string().optional() }),
        ]),
        sessionTarget: z.enum(["main", "isolated"]).default("main"),
        payload: z.union([
          z.object({ kind: z.literal("systemEvent"), text: z.string() }),
          z.object({
            kind: z.literal("agentTurn"),
            message: z.string(),
            model: z.string().optional(),
            timeoutSeconds: z.number().optional(),
          }),
        ]),
        delivery: z.object({
          mode: z.enum(["announce", "webhook", "none"]),
          channel: z.string().optional(),
          to: z.string().optional(),
          bestEffort: z.boolean().optional(),
        }).optional(),
        deleteAfterRun: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { instanceId, ...job } = input;
        await getOwnedInstanceOrThrow(instanceId, ctx.user.id);
        return cron.addJob(instanceId, ctx.user.id, job);
      }),

    toggle: protectedProcedure
      .input(z.object({
        instanceId: z.number(),
        jobId: z.string(),
        enabled: z.boolean(),
      }))
      .mutation(async ({ ctx, input }) => {
        await getOwnedInstanceOrThrow(input.instanceId, ctx.user.id);
        return cron.updateJob(input.instanceId, ctx.user.id, input.jobId, { enabled: input.enabled });
      }),

    remove: protectedProcedure
      .input(z.object({
        instanceId: z.number(),
        jobId: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        await getOwnedInstanceOrThrow(input.instanceId, ctx.user.id);
        return cron.removeJob(input.instanceId, ctx.user.id, input.jobId);
      }),

    run: protectedProcedure
      .input(z.object({
        instanceId: z.number(),
        jobId: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        await getOwnedInstanceOrThrow(input.instanceId, ctx.user.id);
        return cron.runJob(input.instanceId, ctx.user.id, input.jobId);
      }),

    runs: protectedProcedure
      .input(z.object({
        instanceId: z.number(),
        jobId: z.string(),
      }))
      .query(async ({ ctx, input }) => {
        await getOwnedInstanceOrThrow(input.instanceId, ctx.user.id);
        return cron.getJobRuns(input.instanceId, ctx.user.id, input.jobId);
      }),
  }),
});

export type AppRouter = typeof appRouter;
