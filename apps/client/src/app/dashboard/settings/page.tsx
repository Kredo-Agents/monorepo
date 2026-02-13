"use client";

import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Boxes, MessageCircle, MessageSquare, Save, Send, Slack, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

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
  const deleteMutation = trpc.instances.delete.useMutation({
    onSuccess: () => {
      router.push("/setup");
    },
  });

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

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 mt-4">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-50">
          Settings
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2">
          Manage your assistant platforms or remove it entirely.
        </p>
      </div>

      {isLoading && (
        <div className="text-sm text-zinc-600 dark:text-zinc-400">
          Loading settings...
        </div>
      )}

      {!isLoading && instance && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-zinc-200/70 dark:border-zinc-800/70 bg-white dark:bg-zinc-900/40 p-6">
            <div className="space-y-4">
              <div>
                <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  Platforms
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  Enable or update Slack, Telegram, WhatsApp, Discord, and Matrix integrations.
                </p>
              </div>
              <div className="space-y-3">
                <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 transition-all hover:border-zinc-300 dark:hover:border-zinc-700">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Boxes className="h-6 w-6 text-blue-500" aria-hidden="true" />
                      <div>
                        <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Matrix</h3>
                        <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">Connect to Matrix/Element</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.matrixEnabled}
                        onChange={(e) => setConfig({ ...config, matrixEnabled: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-12 h-6 bg-zinc-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-zinc-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  {config.matrixEnabled && (
                    <div className="space-y-3 mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                      <input
                        type="text"
                        value={config.matrixHomeserver}
                        onChange={(e) => setConfig({ ...config, matrixHomeserver: e.target.value })}
                        placeholder="https://matrix.org"
                        className="w-full px-4 py-3 text-sm sm:text-base rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all placeholder:text-zinc-400"
                      />
                      <div className="relative">
                        <input
                          type={showTokens.matrixAccessToken ? "text" : "password"}
                          value={config.matrixAccessToken}
                          onChange={(e) => setConfig({ ...config, matrixAccessToken: e.target.value })}
                          placeholder="Matrix access token"
                          className="w-full pr-16 px-4 py-3 text-sm sm:text-base rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all font-mono placeholder:text-zinc-400"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowTokens((prev) => ({
                              ...prev,
                              matrixAccessToken: !prev.matrixAccessToken,
                            }))
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                        >
                          {showTokens.matrixAccessToken ? "Hide" : "Show"}
                        </button>
                      </div>
                      {storedTokens.matrixAccessToken && !config.matrixAccessToken.trim() && (
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          Existing token saved. Enter a new one to replace it.
                        </p>
                      )}
                      {validationErrors.matrix && (
                        <p className="text-xs text-red-600 dark:text-red-400">{validationErrors.matrix}</p>
                      )}
                    </div>
                  )}
                </div>

                <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 transition-all hover:border-zinc-300 dark:hover:border-zinc-700">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <MessageSquare className="h-6 w-6 text-indigo-500" aria-hidden="true" />
                      <div>
                        <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Discord</h3>
                        <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">Connect to Discord servers</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.discordEnabled}
                        onChange={(e) => setConfig({ ...config, discordEnabled: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-12 h-6 bg-zinc-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-zinc-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  {config.discordEnabled && (
                    <div className="space-y-3 mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                      <div className="relative">
                        <input
                          type={showTokens.discordToken ? "text" : "password"}
                          value={config.discordToken}
                          onChange={(e) => setConfig({ ...config, discordToken: e.target.value })}
                          placeholder="Discord bot token"
                          className="w-full pr-16 px-4 py-3 text-sm sm:text-base rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all font-mono placeholder:text-zinc-400"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowTokens((prev) => ({
                              ...prev,
                              discordToken: !prev.discordToken,
                            }))
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                        >
                          {showTokens.discordToken ? "Hide" : "Show"}
                        </button>
                      </div>
                      {storedTokens.discordToken && !config.discordToken.trim() && (
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          Existing token saved. Enter a new one to replace it.
                        </p>
                      )}
                      <input
                        type="text"
                        value={config.discordGuildId}
                        onChange={(e) => setConfig({ ...config, discordGuildId: e.target.value })}
                        placeholder="Guild ID (optional)"
                        className="w-full px-4 py-3 text-sm sm:text-base rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all placeholder:text-zinc-400"
                      />
                      <input
                        type="text"
                        value={config.discordChannelId}
                        onChange={(e) => setConfig({ ...config, discordChannelId: e.target.value })}
                        placeholder="Channel IDs (comma-separated, optional)"
                        className="w-full px-4 py-3 text-sm sm:text-base rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all placeholder:text-zinc-400"
                      />
                      {validationErrors.discord && (
                        <p className="text-xs text-red-600 dark:text-red-400">{validationErrors.discord}</p>
                      )}
                    </div>
                  )}
                </div>

                <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 transition-all hover:border-zinc-300 dark:hover:border-zinc-700">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Slack className="h-6 w-6 text-emerald-500" aria-hidden="true" />
                      <div>
                        <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Slack</h3>
                        <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">Connect to Slack workspaces</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.slackEnabled}
                        onChange={(e) => setConfig({ ...config, slackEnabled: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-12 h-6 bg-zinc-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-zinc-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  {config.slackEnabled && (
                    <div className="space-y-3 mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                      <div className="relative">
                        <input
                          type={showTokens.slackBotToken ? "text" : "password"}
                          value={config.slackBotToken}
                          onChange={(e) => setConfig({ ...config, slackBotToken: e.target.value })}
                          placeholder="Slack bot token"
                          className="w-full pr-16 px-4 py-3 text-sm sm:text-base rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all font-mono placeholder:text-zinc-400"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowTokens((prev) => ({
                              ...prev,
                              slackBotToken: !prev.slackBotToken,
                            }))
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                        >
                          {showTokens.slackBotToken ? "Hide" : "Show"}
                        </button>
                      </div>
                      {storedTokens.slackBotToken && !config.slackBotToken.trim() && (
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          Existing token saved. Enter a new one to replace it.
                        </p>
                      )}
                      <div className="relative">
                        <input
                          type={showTokens.slackAppToken ? "text" : "password"}
                          value={config.slackAppToken}
                          onChange={(e) => setConfig({ ...config, slackAppToken: e.target.value })}
                          placeholder="Slack app token (xapp-...)"
                          className="w-full pr-16 px-4 py-3 text-sm sm:text-base rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all font-mono placeholder:text-zinc-400"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowTokens((prev) => ({
                              ...prev,
                              slackAppToken: !prev.slackAppToken,
                            }))
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                        >
                          {showTokens.slackAppToken ? "Hide" : "Show"}
                        </button>
                      </div>
                      {storedTokens.slackAppToken && !config.slackAppToken.trim() && (
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          Existing token saved. Enter a new one to replace it.
                        </p>
                      )}
                      {validationErrors.slack && (
                        <p className="text-xs text-red-600 dark:text-red-400">{validationErrors.slack}</p>
                      )}
                    </div>
                  )}
                </div>

                <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 transition-all hover:border-zinc-300 dark:hover:border-zinc-700">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Send className="h-6 w-6 text-sky-500" aria-hidden="true" />
                      <div>
                        <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Telegram</h3>
                        <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">Connect to Telegram bots</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.telegramEnabled}
                        onChange={(e) => setConfig({ ...config, telegramEnabled: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-12 h-6 bg-zinc-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-zinc-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  {config.telegramEnabled && (
                    <div className="space-y-3 mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                      <div className="relative">
                        <input
                          type={showTokens.telegramBotToken ? "text" : "password"}
                          value={config.telegramBotToken}
                          onChange={(e) => setConfig({ ...config, telegramBotToken: e.target.value })}
                          placeholder="Telegram bot token"
                          className="w-full pr-16 px-4 py-3 text-sm sm:text-base rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all font-mono placeholder:text-zinc-400"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowTokens((prev) => ({
                              ...prev,
                              telegramBotToken: !prev.telegramBotToken,
                            }))
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                        >
                          {showTokens.telegramBotToken ? "Hide" : "Show"}
                        </button>
                      </div>
                      {storedTokens.telegramBotToken && !config.telegramBotToken.trim() && (
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          Existing token saved. Enter a new one to replace it.
                        </p>
                      )}
                      <input
                        type="text"
                        value={config.telegramChatId}
                        onChange={(e) => setConfig({ ...config, telegramChatId: e.target.value })}
                        placeholder="Allowed chat IDs (comma-separated, optional)"
                        className="w-full px-4 py-3 text-sm sm:text-base rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all placeholder:text-zinc-400"
                      />
                      {validationErrors.telegram && (
                        <p className="text-xs text-red-600 dark:text-red-400">{validationErrors.telegram}</p>
                      )}
                    </div>
                  )}
                </div>

                <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 transition-all hover:border-zinc-300 dark:hover:border-zinc-700">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <MessageCircle className="h-6 w-6 text-green-500" aria-hidden="true" />
                      <div>
                        <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">WhatsApp</h3>
                        <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">Connect WhatsApp Business</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.whatsappEnabled}
                        onChange={(e) => setConfig({ ...config, whatsappEnabled: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-12 h-6 bg-zinc-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-zinc-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  {config.whatsappEnabled && (
                    <div className="space-y-3 mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                      <input
                        type="text"
                        value={config.whatsappPhoneNumberId}
                        onChange={(e) => setConfig({ ...config, whatsappPhoneNumberId: e.target.value })}
                        placeholder="Phone Number ID"
                        className="w-full px-4 py-3 text-sm sm:text-base rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all placeholder:text-zinc-400"
                      />
                      <div className="relative">
                        <input
                          type={showTokens.whatsappAccessToken ? "text" : "password"}
                          value={config.whatsappAccessToken}
                          onChange={(e) => setConfig({ ...config, whatsappAccessToken: e.target.value })}
                          placeholder="Access token"
                          className="w-full pr-16 px-4 py-3 text-sm sm:text-base rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all font-mono placeholder:text-zinc-400"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowTokens((prev) => ({
                              ...prev,
                              whatsappAccessToken: !prev.whatsappAccessToken,
                            }))
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                        >
                          {showTokens.whatsappAccessToken ? "Hide" : "Show"}
                        </button>
                      </div>
                      {storedTokens.whatsappAccessToken && !config.whatsappAccessToken.trim() && (
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          Existing token saved. Enter a new one to replace it.
                        </p>
                      )}
                      <input
                        type="text"
                        value={config.whatsappVerifyToken}
                        onChange={(e) => setConfig({ ...config, whatsappVerifyToken: e.target.value })}
                        placeholder="Verify token (optional)"
                        className="w-full px-4 py-3 text-sm sm:text-base rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all placeholder:text-zinc-400"
                      />
                      <input
                        type="text"
                        value={config.whatsappWebhookUrl}
                        onChange={(e) => setConfig({ ...config, whatsappWebhookUrl: e.target.value })}
                        placeholder="Webhook URL (optional)"
                        className="w-full px-4 py-3 text-sm sm:text-base rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all placeholder:text-zinc-400"
                      />
                      {validationErrors.whatsapp && (
                        <p className="text-xs text-red-600 dark:text-red-400">{validationErrors.whatsapp}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={handleSave}
                disabled={updateMutation.isPending}
                className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 transition-colors"
              >
                <Save className="h-4 w-4" aria-hidden="true" />
                Save Changes
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-red-200/70 dark:border-red-800/70 bg-white dark:bg-zinc-900/40 p-6">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Delete Assistant
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2">
              This will permanently remove your assistant and its data.
            </p>
            <button
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              Delete Assistant
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
