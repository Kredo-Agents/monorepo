"use client";

import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Boxes, Check, ChevronRight, MessageCircle, MessageSquare, Pause, Play, RotateCw, Save, Send, Slack, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import LogoLoader from "@/components/LogoLoader";

export default function SettingsPage() {
  const router = useRouter();
  const { data: instances, isLoading } = trpc.instances.list.useQuery();
  const instance = instances?.[0];
  const utils = trpc.useUtils();

  const updateMutation = trpc.instances.update.useMutation({
    onSuccess: async () => {
      await utils.instances.list.invalidate();
    },
  });
  const stopMutation = trpc.instances.stop.useMutation({
    onSuccess: () => utils.instances.list.invalidate(),
  });
  const startMutation = trpc.instances.start.useMutation({
    onSuccess: () => utils.instances.list.invalidate(),
  });
  const deleteMutation = trpc.instances.delete.useMutation({
    onSuccess: () => {
      router.push("/setup");
    },
  });
  const [isRestarting, setIsRestarting] = useState(false);

  const [config, setConfig] = useState({
    matrixEnabled: false,
    matrixHomeserver: "",
    matrixAccessToken: "",
    discordEnabled: false,
    discordToken: "",
    discordGuildId: "",
    discordChannelId: "",
    slackEnabled: false,
    slackBotToken: "",
    slackAppToken: "",
    telegramEnabled: false,
    telegramBotToken: "",
    telegramChatId: "",
    whatsappEnabled: false,
    whatsappPhoneNumberId: "",
    whatsappAccessToken: "",
    whatsappVerifyToken: "",
    whatsappWebhookUrl: "",
  });
  const [storedTokens, setStoredTokens] = useState({
    matrixAccessToken: "",
    discordToken: "",
    slackBotToken: "",
    slackAppToken: "",
    telegramBotToken: "",
    whatsappAccessToken: "",
  });
  const [showTokens, setShowTokens] = useState({
    matrixAccessToken: false,
    discordToken: false,
    slackBotToken: false,
    slackAppToken: false,
    telegramBotToken: false,
    whatsappAccessToken: false,
  });
  const statusQuery = trpc.instances.status.useQuery(
    { id: instance?.id ?? 0 },
    { enabled: !!instance?.id, refetchInterval: 5000 }
  );
  const statusData = statusQuery.data;
  const statusOk = !(statusData && 'success' in statusData && statusData.success === false);
  const runtimeStatus = statusOk
    ? (statusData as any)?.openclawStatus ?? instance?.runtimeStatus ?? instance?.status
    : instance?.runtimeStatus ?? instance?.status;
  const isStopped = (runtimeStatus ?? instance?.status) === 'stopped' || instance?.status === 'stopped';

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!instance) return;
    const instanceConfig = (instance.config || {}) as Record<string, any>;
    setConfig({
      matrixEnabled: Boolean(instanceConfig.matrix),
      matrixHomeserver: instanceConfig.matrix?.homeserverUrl ?? "",
      matrixAccessToken: "",
      discordEnabled: Boolean(instanceConfig.discord),
      discordToken: "",
      discordGuildId: instanceConfig.discord?.guildId ?? "",
      discordChannelId: instanceConfig.discord?.channelId ?? "",
      slackEnabled: Boolean(instanceConfig.slack),
      slackBotToken: "",
      slackAppToken: "",
      telegramEnabled: Boolean(instanceConfig.telegram),
      telegramBotToken: "",
      telegramChatId: instanceConfig.telegram?.chatId ?? "",
      whatsappEnabled: Boolean(instanceConfig.whatsapp),
      whatsappPhoneNumberId: instanceConfig.whatsapp?.phoneNumberId ?? "",
      whatsappAccessToken: "",
      whatsappVerifyToken: instanceConfig.whatsapp?.verifyToken ?? "",
      whatsappWebhookUrl: instanceConfig.whatsapp?.webhookUrl ?? "",
    });
    setStoredTokens({
      matrixAccessToken: instanceConfig.matrix?.accessToken ?? "",
      discordToken: instanceConfig.discord?.token ?? "",
      slackBotToken: instanceConfig.slack?.botToken ?? "",
      slackAppToken: instanceConfig.slack?.appToken ?? "",
      telegramBotToken: instanceConfig.telegram?.botToken ?? "",
      whatsappAccessToken: instanceConfig.whatsapp?.accessToken ?? "",
    });
    setValidationErrors({});
    setShowTokens({
      matrixAccessToken: false,
      discordToken: false,
      slackBotToken: false,
      slackAppToken: false,
      telegramBotToken: false,
      whatsappAccessToken: false,
    });
  }, [instance]);

  const handleSave = () => {
    if (!instance) return;
    const nextErrors: Record<string, string> = {};
    const requireValue = (value: string, fallback: string) =>
      Boolean(value.trim() || fallback.trim());

    if (config.matrixEnabled) {
      if (!config.matrixHomeserver.trim()) {
        nextErrors.matrix = "Matrix homeserver is required.";
      } else if (!requireValue(config.matrixAccessToken, storedTokens.matrixAccessToken)) {
        nextErrors.matrix = "Matrix access token is required.";
      }
    }
    if (config.discordEnabled && !requireValue(config.discordToken, storedTokens.discordToken)) {
      nextErrors.discord = "Discord bot token is required.";
    }
    if (config.slackEnabled) {
      if (!requireValue(config.slackBotToken, storedTokens.slackBotToken)) {
        nextErrors.slack = "Slack bot token is required.";
      } else if (!requireValue(config.slackAppToken, storedTokens.slackAppToken)) {
        nextErrors.slack = "Slack app token is required.";
      }
    }
    if (config.telegramEnabled && !requireValue(config.telegramBotToken, storedTokens.telegramBotToken)) {
      nextErrors.telegram = "Telegram bot token is required.";
    }
    if (config.whatsappEnabled) {
      if (!config.whatsappPhoneNumberId.trim()) {
        nextErrors.whatsapp = "WhatsApp phone number ID is required.";
      } else if (!requireValue(config.whatsappAccessToken, storedTokens.whatsappAccessToken)) {
        nextErrors.whatsapp = "WhatsApp access token is required.";
      }
    }
    setValidationErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const instanceConfig = (instance.config || {}) as Record<string, any>;
    const nextConfig = { ...instanceConfig };
    if (config.matrixEnabled) {
      nextConfig.matrix = {
        homeserverUrl: config.matrixHomeserver.trim(),
        accessToken: config.matrixAccessToken.trim() || storedTokens.matrixAccessToken,
        ...(instanceConfig.matrix?.dmPolicy ? { dmPolicy: instanceConfig.matrix.dmPolicy } : {}),
      };
    } else {
      delete nextConfig.matrix;
    }
    if (config.discordEnabled) {
      nextConfig.discord = {
        token: config.discordToken.trim() || storedTokens.discordToken,
        ...(config.discordGuildId.trim() ? { guildId: config.discordGuildId.trim() } : {}),
        ...(config.discordChannelId.trim() ? { channelId: config.discordChannelId.trim() } : {}),
      };
    } else {
      delete nextConfig.discord;
    }
    if (config.slackEnabled) {
      nextConfig.slack = {
        botToken: config.slackBotToken.trim() || storedTokens.slackBotToken,
        appToken: config.slackAppToken.trim() || storedTokens.slackAppToken,
      };
    } else {
      delete nextConfig.slack;
    }
    if (config.telegramEnabled) {
      nextConfig.telegram = {
        botToken: config.telegramBotToken.trim() || storedTokens.telegramBotToken,
        ...(config.telegramChatId.trim() ? { chatId: config.telegramChatId.trim() } : {}),
      };
    } else {
      delete nextConfig.telegram;
    }
    if (config.whatsappEnabled) {
      nextConfig.whatsapp = {
        phoneNumberId: config.whatsappPhoneNumberId.trim(),
        accessToken: config.whatsappAccessToken.trim() || storedTokens.whatsappAccessToken,
        ...(config.whatsappVerifyToken.trim()
          ? { verifyToken: config.whatsappVerifyToken.trim() }
          : {}),
        ...(config.whatsappWebhookUrl.trim()
          ? { webhookUrl: config.whatsappWebhookUrl.trim() }
          : {}),
      };
    } else {
      delete nextConfig.whatsapp;
    }
    updateMutation.mutate({
      id: instance.id,
      config: nextConfig,
    });
  };

  const handleDelete = () => {
    if (!instance) return;
    const confirmed = window.confirm("Delete this assistant? This cannot be undone.");
    if (!confirmed) return;
    deleteMutation.mutate({ id: instance.id });
  };

  const statusLabel = isStopped ? 'Stopped' : runtimeStatus === 'ready' ? 'Running' : runtimeStatus ?? 'Running';
  const statusColor = isStopped
    ? 'bg-red-500'
    : runtimeStatus === 'ready' || !runtimeStatus
      ? 'bg-emerald-500'
      : 'bg-amber-500';

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-6 pt-2 pb-6 md:py-12 md:mt-4 animate-fade-in">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-50">
          Settings
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Manage platforms and your assistant instance.
        </p>
      </div>

      {isLoading && (
        <LogoLoader text="Loading settings..." className="py-12" />
      )}

      {!isLoading && instance && (
        <div className="space-y-7">

          {/* ── PLATFORMS ── */}
          <section>
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 px-4 mb-2">
              Platforms
            </h2>
            <div className="rounded-2xl bg-white dark:bg-zinc-900/60 border border-zinc-200/70 dark:border-zinc-800/70 overflow-hidden divide-y divide-zinc-200/70 dark:divide-zinc-800/70">

              {/* Telegram — active platform */}
              <div>
                <div className="flex items-center justify-between px-4 py-3 min-h-[44px]">
                  <div className="flex items-center gap-3">
                    <Send className="h-5 w-5 text-sky-500 shrink-0" aria-hidden="true" />
                    <div>
                      <span className="text-[15px] font-medium text-zinc-900 dark:text-zinc-50">Telegram</span>
                      <p className="text-[12px] text-zinc-500 dark:text-zinc-400 leading-tight">Connect to Telegram bots</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={config.telegramEnabled}
                      onChange={(e) => setConfig({ ...config, telegramEnabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-[51px] h-[31px] bg-zinc-200 rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-[27px] after:w-[27px] after:shadow-sm after:transition-all peer-checked:bg-emerald-500 dark:peer-checked:bg-emerald-500" />
                  </label>
                </div>
                {config.telegramEnabled && (
                  <div className="px-4 pb-4 space-y-3 border-t border-zinc-200/70 dark:border-zinc-800/70">
                    <div className="pt-3">
                      <label className="text-[12px] font-medium text-zinc-500 dark:text-zinc-400 mb-1.5 block">Bot Token</label>
                      <div className="relative">
                        <input
                          type={showTokens.telegramBotToken ? "text" : "password"}
                          value={config.telegramBotToken}
                          onChange={(e) => setConfig({ ...config, telegramBotToken: e.target.value })}
                          placeholder="Paste your bot token"
                          className="w-full pr-16 px-3.5 py-2.5 text-[16px] sm:text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/80 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all placeholder:text-zinc-400"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowTokens((prev) => ({
                              ...prev,
                              telegramBotToken: !prev.telegramBotToken,
                            }))
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-blue-500 dark:text-blue-400 min-h-[44px] flex items-center"
                        >
                          {showTokens.telegramBotToken ? "Hide" : "Show"}
                        </button>
                      </div>
                      {storedTokens.telegramBotToken && !config.telegramBotToken.trim() && (
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1.5">
                          Existing token saved. Enter a new one to replace it.
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="text-[12px] font-medium text-zinc-500 dark:text-zinc-400 mb-1.5 block">Allowed Chat IDs</label>
                      <input
                        type="text"
                        value={config.telegramChatId}
                        onChange={(e) => setConfig({ ...config, telegramChatId: e.target.value })}
                        placeholder="Comma-separated (optional)"
                        className="w-full px-3.5 py-2.5 text-[16px] sm:text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/80 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all placeholder:text-zinc-400"
                      />
                    </div>
                    {validationErrors.telegram && (
                      <p className="text-[12px] text-red-600 dark:text-red-400">{validationErrors.telegram}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Matrix — coming soon */}
              <div className="flex items-center justify-between px-4 py-3 min-h-[44px] opacity-40">
                <div className="flex items-center gap-3">
                  <Boxes className="h-5 w-5 text-blue-500 shrink-0" aria-hidden="true" />
                  <span className="text-[15px] font-medium text-zinc-900 dark:text-zinc-50">Matrix</span>
                </div>
                <span className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500">Coming soon</span>
              </div>

              {/* Discord — coming soon */}
              <div className="flex items-center justify-between px-4 py-3 min-h-[44px] opacity-40">
                <div className="flex items-center gap-3">
                  <MessageSquare className="h-5 w-5 text-indigo-500 shrink-0" aria-hidden="true" />
                  <span className="text-[15px] font-medium text-zinc-900 dark:text-zinc-50">Discord</span>
                </div>
                <span className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500">Coming soon</span>
              </div>

              {/* Slack — coming soon */}
              <div className="flex items-center justify-between px-4 py-3 min-h-[44px] opacity-40">
                <div className="flex items-center gap-3">
                  <Slack className="h-5 w-5 text-emerald-500 shrink-0" aria-hidden="true" />
                  <span className="text-[15px] font-medium text-zinc-900 dark:text-zinc-50">Slack</span>
                </div>
                <span className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500">Coming soon</span>
              </div>

              {/* WhatsApp — coming soon */}
              <div className="flex items-center justify-between px-4 py-3 min-h-[44px] opacity-40">
                <div className="flex items-center gap-3">
                  <MessageCircle className="h-5 w-5 text-green-500 shrink-0" aria-hidden="true" />
                  <span className="text-[15px] font-medium text-zinc-900 dark:text-zinc-50">WhatsApp</span>
                </div>
                <span className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500">Coming soon</span>
              </div>
            </div>
          </section>

          {/* ── INSTANCE ── */}
          <section>
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 px-4 mb-2">
              Instance
            </h2>
            <div className="rounded-2xl bg-white dark:bg-zinc-900/60 border border-zinc-200/70 dark:border-zinc-800/70 overflow-hidden divide-y divide-zinc-200/70 dark:divide-zinc-800/70">

              {/* Status row */}
              <div className="flex items-center justify-between px-4 py-3 min-h-[44px]">
                <span className="text-[15px] text-zinc-900 dark:text-zinc-50">Status</span>
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${statusColor}`} />
                  <span className="text-[15px] text-zinc-500 dark:text-zinc-400 capitalize">{statusLabel}</span>
                </div>
              </div>

              {/* Start / Stop row */}
              <button
                type="button"
                onClick={() =>
                  isStopped
                    ? startMutation.mutate({ id: instance!.id })
                    : stopMutation.mutate({ id: instance!.id })
                }
                disabled={stopMutation.isPending || startMutation.isPending || isRestarting}
                className="w-full flex items-center justify-between px-4 py-3 min-h-[44px] active:bg-zinc-50 dark:active:bg-zinc-800/40 transition-colors disabled:opacity-50"
              >
                <div className="flex items-center gap-3">
                  {isStopped ? (
                    <Play className="h-5 w-5 text-emerald-500 shrink-0" aria-hidden="true" />
                  ) : (
                    <Pause className="h-5 w-5 text-amber-500 shrink-0" aria-hidden="true" />
                  )}
                  <span className="text-[15px] text-zinc-900 dark:text-zinc-50">
                    {isStopped ? 'Start Instance' : 'Pause Instance'}
                  </span>
                </div>
                <ChevronRight className="h-4 w-4 text-zinc-300 dark:text-zinc-600 shrink-0" aria-hidden="true" />
              </button>

              {/* Restart row */}
              <button
                type="button"
                onClick={async () => {
                  if (!instance) return;
                  setIsRestarting(true);
                  try {
                    await stopMutation.mutateAsync({ id: instance.id });
                    await startMutation.mutateAsync({ id: instance.id });
                  } finally {
                    setIsRestarting(false);
                  }
                }}
                disabled={isRestarting || stopMutation.isPending || startMutation.isPending}
                className="w-full flex items-center justify-between px-4 py-3 min-h-[44px] active:bg-zinc-50 dark:active:bg-zinc-800/40 transition-colors disabled:opacity-50"
              >
                <div className="flex items-center gap-3">
                  <RotateCw className={`h-5 w-5 text-blue-500 shrink-0 ${isRestarting ? 'animate-spin' : ''}`} aria-hidden="true" />
                  <span className="text-[15px] text-zinc-900 dark:text-zinc-50">
                    {isRestarting ? 'Restarting...' : 'Restart Instance'}
                  </span>
                </div>
                <ChevronRight className="h-4 w-4 text-zinc-300 dark:text-zinc-600 shrink-0" aria-hidden="true" />
              </button>
            </div>
          </section>

          {/* ── DELETE ── */}
          <section>
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-red-400 dark:text-red-500 px-4 mb-2">
              Danger Zone
            </h2>
            <div className="rounded-2xl bg-white dark:bg-zinc-900/60 border border-zinc-200/70 dark:border-zinc-800/70 overflow-hidden mb-10">
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="w-full flex items-center justify-between px-4 py-3 min-h-[44px] active:bg-red-50 dark:active:bg-red-950/20 transition-colors disabled:opacity-50"
              >
                <div className="flex items-center gap-3">
                  <Trash2 className="h-5 w-5 text-red-500 shrink-0" aria-hidden="true" />
                  <span className="text-[15px] text-red-600 dark:text-red-400">Delete Assistant</span>
                </div>
                <ChevronRight className="h-4 w-4 text-zinc-300 dark:text-zinc-600 shrink-0" aria-hidden="true" />
              </button>
            </div>
            <p className="text-[12px] text-zinc-400 dark:text-zinc-500 px-4 mt-2">
              This will permanently remove your assistant and all its data.
            </p>
          </section>

          {/* ── Save button ── */}
          <section className="px-4">
            <button
              onClick={handleSave}
              disabled={updateMutation.isPending}
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-2xl sm:rounded-xl bg-zinc-900 dark:bg-zinc-50 px-5 py-3.5 sm:py-2.5 text-[15px] sm:text-sm font-semibold text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-200 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed transition-all min-h-[50px] sm:min-h-0"
            >
              {updateMutation.isSuccess ? (
                <>
                  <Check className="h-5 w-5 sm:h-4 sm:w-4" aria-hidden="true" />
                  Saved
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" aria-hidden="true" />
                  {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                </>
              )}
            </button>
          </section>
        </div>
      )}
    </div>
  );
}
