'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { trpc } from '@/lib/trpc';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  Boxes,
  MessageCircle,
  MessageSquare,
  Send,
  Slack,
  Sparkles,
} from 'lucide-react';

type SetupStep = 1 | 2 | 3 | 4;

interface SetupConfig {
  instanceName: string;
  description: string;
  llmApiKey: string;
  llmModel: string;
  matrixEnabled: boolean;
  matrixHomeserver: string;
  matrixAccessToken: string;
  discordEnabled: boolean;
  discordToken: string;
  discordGuildId: string;
  discordChannelId: string;
  slackEnabled: boolean;
  slackBotToken: string;
  slackAppToken: string;
  telegramEnabled: boolean;
  telegramBotToken: string;
  telegramChatId: string;
  whatsappEnabled: boolean;
  whatsappPhoneNumberId: string;
  whatsappAccessToken: string;
  whatsappVerifyToken: string;
  whatsappWebhookUrl: string;
}

type PairingInfo = {
  platform?: string;
  userId?: string;
  code?: string;
  command?: string;
  status?: 'needed' | 'auto-approved';
  deviceId?: string;
  role?: string;
  raw?: string;
};

function extractPairingInfo(logs: string): PairingInfo | null {
  if (!logs) return null;
  const marker = logs.lastIndexOf('OpenClaw: access not configured');
  const relevant = marker >= 0 ? logs.slice(marker) : logs;
  if (!/access not configured/i.test(relevant)) return null;

  const userMatch = relevant.match(/Your\s+([A-Za-z0-9_-]+)\s+user id:\s*([^\n\r]+)/i);
  const codeMatch = relevant.match(/Pairing code:\s*([A-Z0-9]+)/i);
  const commandMatch = relevant.match(/openclaw pairing approve[^\n\r]*/i);

  return {
    status: 'needed',
    platform: userMatch?.[1],
    userId: userMatch?.[2]?.trim(),
    code: codeMatch?.[1],
    command: commandMatch?.[0]?.trim(),
    raw: relevant.trim(),
  };
}

export default function SetupPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<SetupStep>(1);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentError, setDeploymentError] = useState<string | null>(null);
  const [createdInstanceId, setCreatedInstanceId] = useState<number | null>(null);
  const [isBooting, setIsBooting] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [pairingInfo, setPairingInfo] = useState<PairingInfo | null>(null);
  const [pairingCode, setPairingCode] = useState('');
  const [pairingError, setPairingError] = useState<string | null>(null);
  const [pairingSuccess, setPairingSuccess] = useState<string | null>(null);
  const [showPlatformDetails, setShowPlatformDetails] = useState(false);
  const [showDeployHoldNotice, setShowDeployHoldNotice] = useState(false);

  const storageKey = user ? `openclaw.setup.${user.id}` : null;

  const [config, setConfig] = useState<SetupConfig>({
    instanceName: '',
    description: '',
    llmApiKey: '',
    llmModel: 'claude-opus-4-6',
    matrixEnabled: false,
    matrixHomeserver: '',
    matrixAccessToken: '',
    discordEnabled: false,
    discordToken: '',
    discordGuildId: '',
    discordChannelId: '',
    slackEnabled: false,
    slackBotToken: '',
    slackAppToken: '',
    telegramEnabled: false,
    telegramBotToken: '',
    telegramChatId: '',
    whatsappEnabled: false,
    whatsappPhoneNumberId: '',
    whatsappAccessToken: '',
    whatsappVerifyToken: '',
    whatsappWebhookUrl: '',
  });

  const existingInstancesQuery = trpc.instances.list.useQuery(undefined, {
    enabled: isLoaded && !!user,
  });

  const createInstanceMutation = trpc.instances.create.useMutation();
  const approvePairingMutation = trpc.instances.approveTelegramPairing.useMutation();
  const statusQuery = trpc.instances.status.useQuery(
    { id: createdInstanceId ?? 0 },
    {
      enabled: createdInstanceId !== null,
      refetchInterval: isBooting && !isReady ? 3000 : false,
    }
  );
  const logsQuery = trpc.instances.logs.useQuery(
    { id: createdInstanceId ?? 0, tail: 200 },
    {
      enabled: createdInstanceId !== null && (isBooting || (isReady && !pairingInfo)),
      refetchInterval: isBooting || (isReady && !pairingInfo) ? 4000 : false,
    }
  );
  const runtimeGatewayStatus =
    (statusQuery.data as { gatewayStatus?: string } | undefined)?.gatewayStatus;

  const defaultInstanceName = useMemo(() => {
    if (user?.firstName) return `${user.firstName}'s Assistant`;
    if (user?.username) return `${user.username}'s Assistant`;
    return 'OpenClaw Assistant';
  }, [user?.firstName, user?.username]);

  // Redirect to dashboard if user already has an instance
  useEffect(() => {
    if (existingInstancesQuery.data && existingInstancesQuery.data.length > 0) {
      router.replace('/dashboard');
    }
  }, [existingInstancesQuery.data, router]);

  useEffect(() => {
    if (!isLoaded || !user) return;
    if (!config.instanceName.trim()) {
      setConfig((prev) => ({
        ...prev,
        instanceName: defaultInstanceName,
      }));
    }
  }, [config.instanceName, defaultInstanceName, isLoaded, user]);

  useEffect(() => {
    if (!isLoaded || !user || !storageKey) return;
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as Partial<{
        currentStep: SetupStep;
        config: Partial<SetupConfig>;
        createdInstanceId: number | null;
      }>;
      if (parsed?.config) {
        setConfig((prev) => ({ ...prev, ...parsed.config }));
      }
      if (typeof parsed?.createdInstanceId === 'number') {
        setCreatedInstanceId(parsed.createdInstanceId);
      }
      if (parsed?.currentStep) {
        const hasAnyPlatform =
          !!parsed.config?.matrixEnabled ||
          !!parsed.config?.discordEnabled ||
          !!parsed.config?.slackEnabled ||
          !!parsed.config?.telegramEnabled ||
          !!parsed.config?.whatsappEnabled;
        let nextStep = parsed.currentStep as SetupStep;
        if (parsed.currentStep === 1 && hasAnyPlatform) {
          nextStep = 2;
        } else if (parsed.currentStep === 2 && parsed.createdInstanceId) {
          nextStep = 3;
        } else if (parsed.currentStep === 3) {
          nextStep = 4;
        }
        setCurrentStep(nextStep);
      }
    } catch {
      // Ignore corrupted or legacy saved state.
    }
  }, [isLoaded, storageKey, user]);

  useEffect(() => {
    if (!isLoaded || !user || !storageKey) return;
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({
        currentStep,
        config,
        createdInstanceId,
      })
    );
  }, [config, createdInstanceId, currentStep, isLoaded, storageKey, user]);

  useEffect(() => {
    if (!statusQuery.data) return;
    if ('success' in statusQuery.data && statusQuery.data.success === false) {
      setDeploymentError(statusQuery.data.error || 'Failed to check instance status');
      setIsDeploying(false);
      setIsBooting(false);
      return;
    }
    if (statusQuery.data.openclawStatus === 'error') {
      setDeploymentError('OpenClaw failed to start. Check logs and try again.');
      setIsDeploying(false);
      setIsBooting(false);
      return;
    }
    if (statusQuery.data.openclawReady || statusQuery.data.openclawStatus === 'ready') {
      setIsReady(true);
      setIsDeploying(false);
      setIsBooting(false);
    }
  }, [statusQuery.data]);

  useEffect(() => {
    if (!logsQuery.data?.success || !logsQuery.data.logs) return;
    const parsed = extractPairingInfo(logsQuery.data.logs);
    if (parsed) {
      setPairingInfo(parsed);
    }
  }, [logsQuery.data]);

  useEffect(() => {
    if (pairingInfo?.code && !pairingCode.trim()) {
      setPairingCode(pairingInfo.code);
    }
  }, [pairingInfo, pairingCode]);

  useEffect(() => {
    if (currentStep !== 3 || isReady) {
      setShowDeployHoldNotice(false);
    }
  }, [currentStep, isReady]);

  const handleApprovePairing = async () => {
    if (!createdInstanceId) return;
    const code = pairingCode.trim();
    if (!code) return;
    setPairingError(null);
    setPairingSuccess(null);
    try {
      const result = await approvePairingMutation.mutateAsync({
        id: createdInstanceId,
        code,
      });
      setPairingSuccess(result.output || 'Pairing approved.');
    } catch (error: any) {
      setPairingError(error?.message || 'Failed to approve pairing.');
    }
  };

  const needsPairing = config.telegramEnabled;
  const showPairingStep = needsPairing;
  const selectedPlatform = config.matrixEnabled
    ? 'matrix'
    : config.discordEnabled
      ? 'discord'
      : config.slackEnabled
        ? 'slack'
        : config.telegramEnabled
          ? 'telegram'
          : config.whatsappEnabled
            ? 'whatsapp'
            : null;

  useEffect(() => {
    if (currentStep === 4 && !isReady) {
      setCurrentStep(3);
    }
  }, [currentStep, isReady]);

  useEffect(() => {
    if (currentStep === 3 && isReady && showPairingStep) {
      setCurrentStep(4);
    }
  }, [currentStep, isReady, showPairingStep]);

  const steps = [
    { id: 1, title: 'Welcome', description: 'Name your assistant' },
    { id: 2, title: 'Connected App', description: 'Pick one app to connect' },
    { id: 3, title: 'Deploy', description: 'Review and launch' },
    ...(showPairingStep ? [{ id: 4, title: 'Pairing', description: 'Connect your account' }] : []),
  ];

  if (!isLoaded || (existingInstancesQuery.isLoading && !existingInstancesQuery.data)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zinc-900 dark:border-zinc-50 mx-auto mb-4"></div>
          <p className="text-zinc-600 dark:text-zinc-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    router.push('/sign-in');
    return null;
  }

  // Prevent rendering setup form while redirecting
  if (existingInstancesQuery.data && existingInstancesQuery.data.length > 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zinc-900 dark:border-zinc-50 mx-auto mb-4"></div>
          <p className="text-zinc-600 dark:text-zinc-400">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  const updateConfig = (updates: Partial<SetupConfig>) => {
    setConfig({ ...config, ...updates });
  };

  const canProceedToStep2 = true;
  const canDeploy = true;

  const handleDeploy = async () => {
    if (!canDeploy) return;

    setIsDeploying(true);
    setDeploymentError(null);
    setIsBooting(false);
    setIsReady(false);
    setPairingInfo(null);
    setPairingCode('');
    setPairingError(null);
    setPairingSuccess(null);

    try {
      const resolvedInstanceName =
        config.instanceName.trim() || defaultInstanceName || 'OpenClaw Assistant';

      const resolvedKey = config.llmApiKey || undefined;

      const result = await createInstanceMutation.mutateAsync({
        name: resolvedInstanceName,
        description: config.description || undefined,
        llmProvider: 'anthropic',
        llmModel: config.llmModel || undefined,
        config: {
          provider: 'anthropic',
          model: config.llmModel || undefined,
          authToken: resolvedKey,
          matrix: config.matrixEnabled && config.matrixHomeserver && config.matrixAccessToken ? {
            homeserverUrl: config.matrixHomeserver,
            accessToken: config.matrixAccessToken,
          } : undefined,
          discord: config.discordEnabled && config.discordToken ? {
            token: config.discordToken,
            guildId: config.discordGuildId || undefined,
            channelId: config.discordChannelId || undefined,
          } : undefined,
          slack: config.slackEnabled && config.slackBotToken && config.slackAppToken ? {
            botToken: config.slackBotToken,
            appToken: config.slackAppToken,
          } : undefined,
          telegram: config.telegramEnabled && config.telegramBotToken ? {
            botToken: config.telegramBotToken,
            chatId: config.telegramChatId || undefined,
          } : undefined,
          whatsapp: config.whatsappEnabled && config.whatsappPhoneNumberId && config.whatsappAccessToken ? {
            phoneNumberId: config.whatsappPhoneNumberId,
            accessToken: config.whatsappAccessToken,
            verifyToken: config.whatsappVerifyToken || undefined,
            webhookUrl: config.whatsappWebhookUrl || undefined,
          } : undefined,
        },
      });

      setCreatedInstanceId(result.id);
      setIsBooting(true);
    } catch (error: any) {
      console.error('Deployment error:', error);
      setDeploymentError(error.message || 'Failed to deploy assistant');
      setIsDeploying(false);
      setIsBooting(false);
    }
  };

  return (
    <main className="min-h-screen bg-zinc-50/80 dark:bg-black py-10 sm:py-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="mb-8 sm:mb-10 text-left sm:text-center">
          <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400 mb-3">
            <span className="h-1.5 w-1.5 rounded-full bg-zinc-400 dark:bg-zinc-600" />
            OpenClaw Setup
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-[44px] leading-tight font-semibold text-zinc-900 dark:text-zinc-50 mb-3 tracking-tight">
            Set up your assistant
          </h1>
          <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl sm:mx-auto">
            A calm, two‑minute setup. You can change everything later.
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-6 sm:mb-8 animate-in fade-in slide-in-from-top-3 duration-500">
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-5">
            {steps.map((step, index) => {
              const isActive = currentStep === step.id;
              const isComplete = currentStep > step.id;
              return (
                <div key={step.id} className="flex items-center gap-3">
                  <div
                    className={`relative flex h-7 w-7 items-center justify-center rounded-full border text-[11px] font-semibold transition-colors ${
                      isActive
                        ? 'border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-100'
                        : isComplete
                        ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900'
                        : 'border-zinc-200 bg-white text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-500'
                    }`}
                  >
                    {step.id}
                  </div>
                  <div
                    className={`text-sm font-semibold transition-colors ${
                      isActive
                        ? 'text-zinc-900 dark:text-zinc-50'
                        : isComplete
                        ? 'text-zinc-900 dark:text-zinc-50'
                        : 'text-zinc-500 dark:text-zinc-400'
                    }`}
                  >
                    {step.title}
                  </div>
                  {index < steps.length - 1 && (
                    <div className="hidden sm:block h-px w-8 bg-zinc-200 dark:bg-zinc-800" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <div className="rounded-3xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-900/70 backdrop-blur overflow-hidden">
          <div className="px-6 sm:px-10 py-5 border-b border-zinc-200/70 dark:border-zinc-800/70 bg-zinc-50/70 dark:bg-zinc-900/50 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                Step {currentStep} of {steps.length}
              </p>
              <h2 className="text-lg sm:text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                {steps[currentStep - 1]?.title}
              </h2>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
              <span className="inline-flex h-2 w-2 rounded-full bg-zinc-400 dark:bg-zinc-600" />
              In progress
            </div>
          </div>

          <div
            key={currentStep}
            className="p-6 sm:p-10 min-h-[380px] animate-in fade-in slide-in-from-bottom-6 duration-500"
          >
            {currentStep === 1 && <Step1Welcome />}
            {currentStep === 2 && (
              <Step3Platforms
                config={config}
                updateConfig={updateConfig}
                showDetails={showPlatformDetails}
                onShowDetails={setShowPlatformDetails}
              />
            )}
            {currentStep === 3 && (
              <Step4Review
                config={config}
                isDeploying={isDeploying}
                isReady={isReady}
                error={deploymentError}
                bootStatus={statusQuery.data?.openclawStatus}
                gatewayStatus={runtimeGatewayStatus}
                showPairingStep={showPairingStep}
                showDeployHoldNotice={showDeployHoldNotice}
              />
            )}
            {currentStep === 4 && (
              <Step5Pairing
                pairingInfo={pairingInfo}
                pairingCode={pairingCode}
                onPairingCodeChange={setPairingCode}
                onApprovePairing={handleApprovePairing}
                pairingError={pairingError}
                pairingSuccess={pairingSuccess}
                isApproving={approvePairingMutation.isPending}
                isReady={isReady}
              />
            )}
          </div>

          <div className="px-6 sm:px-10 pb-6 sm:pb-10">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:justify-between">
              <button
                onClick={() => {
                  if (currentStep > 1) {
                    setCurrentStep((currentStep - 1) as SetupStep);
                  } else {
                    router.push('/');
                  }
                }}
                disabled={isDeploying}
                className="w-full sm:w-auto px-6 py-3.5 text-sm sm:text-base font-semibold text-zinc-900 dark:text-zinc-50 border border-zinc-300/80 dark:border-zinc-700/80 rounded-xl hover:border-zinc-900 dark:hover:border-zinc-200 hover:bg-white dark:hover:bg-zinc-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {currentStep === 1 ? 'Cancel' : 'Back'}
              </button>

              {currentStep < steps.length ? (
                <button
                  onClick={() => {
                    if (currentStep === 2 && selectedPlatform && !showPlatformDetails) {
                      setShowPlatformDetails(true);
                      return;
                    }
                    if (currentStep === 3 && !isDeploying && !isReady) {
                      handleDeploy();
                      return;
                    }
                    if (currentStep === 3 && showPairingStep && !isReady) {
                      setShowDeployHoldNotice(true);
                      return;
                    }
                    setCurrentStep((currentStep + 1) as SetupStep);
                  }}
                  disabled={currentStep === 1 && !canProceedToStep2}
                  className="w-full sm:w-auto px-6 py-3.5 text-sm sm:text-base font-semibold text-white bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 rounded-xl hover:bg-zinc-800 dark:hover:bg-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {currentStep === 1 ? 'Get started →' : 'Continue →'}
                </button>
              ) : isReady ? (
                <button
                  onClick={() => router.push('/dashboard')}
                  className="w-full sm:w-auto px-6 py-3.5 text-sm sm:text-base font-semibold text-white bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 rounded-xl hover:bg-zinc-800 dark:hover:bg-white transition-all"
                >
                  Go to dashboard →
                </button>
              ) : (
                <button
                  onClick={handleDeploy}
                  disabled={!canDeploy || isDeploying}
                  className="w-full sm:w-auto px-6 py-3.5 text-sm sm:text-base font-semibold text-white bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 rounded-xl hover:bg-zinc-800 dark:hover:bg-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDeploying ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Deploying...
                    </span>
                  ) : (
                    'Deploy Instance'
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function Step3Platforms({
  config,
  updateConfig,
  showDetails,
  onShowDetails,
}: {
  config: SetupConfig;
  updateConfig: (updates: Partial<SetupConfig>) => void;
  showDetails: boolean;
  onShowDetails: (next: boolean) => void;
}) {
  const selectPlatform = (
    platform: 'matrix' | 'discord' | 'slack' | 'telegram' | 'whatsapp',
    enabled: boolean
  ) => {
    const reset = {
      matrixEnabled: false,
      discordEnabled: false,
      slackEnabled: false,
      telegramEnabled: false,
      whatsappEnabled: false,
    };
    if (!enabled) {
      onShowDetails(false);
      updateConfig({ [`${platform}Enabled`]: false } as Partial<SetupConfig>);
      return;
    }
    onShowDetails(false);
    updateConfig({ ...reset, [`${platform}Enabled`]: true } as Partial<SetupConfig>);
  };

  const selectedPlatform = config.matrixEnabled
    ? 'matrix'
    : config.discordEnabled
      ? 'discord'
      : config.slackEnabled
        ? 'slack'
        : config.telegramEnabled
          ? 'telegram'
          : config.whatsappEnabled
            ? 'whatsapp'
            : null;

  const platforms = [
    { id: 'telegram', name: 'Telegram', description: 'Telegram bots', Icon: Send },
    // Other platforms disabled for now:
    // { id: 'matrix', name: 'Matrix', description: 'Matrix/Element', Icon: Boxes },
    // { id: 'discord', name: 'Discord', description: 'Discord servers', Icon: MessageSquare },
    // { id: 'slack', name: 'Slack', description: 'Slack workspaces', Icon: Slack },
    // { id: 'whatsapp', name: 'WhatsApp', description: 'WhatsApp Business', Icon: MessageCircle },
  ] as const;

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-2xl sm:text-3xl font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
          Connect an app
        </h2>
        <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400">
          Pick one connected app to start. We will show the exact steps and token inputs below.
        </p>
        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-2">
          Your agent will reach you there, you will also be able to talk to it directly in the app.
        </p>
      </div>

      {!showDetails && (
        <div className="grid gap-3 sm:grid-cols-2">
          {platforms.map((platform) => {
            const isSelected = selectedPlatform === platform.id;
            return (
              <button
                key={platform.id}
                type="button"
                onClick={() => selectPlatform(platform.id, !isSelected)}
                className={`rounded-2xl border p-4 sm:p-5 text-left transition-all ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/30'
                    : 'border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700'
                }`}
                aria-pressed={isSelected}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <platform.Icon
                      className={`h-5 w-5 ${isSelected ? 'text-blue-600 dark:text-blue-300' : 'text-zinc-500'}`}
                      aria-hidden="true"
                    />
                    <div>
                      <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                        {platform.name}
                      </h3>
                      <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
                        {platform.description}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      isSelected
                        ? 'bg-blue-600 text-white'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300'
                    }`}
                  >
                    {isSelected ? 'Selected' : 'Choose'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {selectedPlatform && !showDetails ? (
        <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-6 text-center space-y-2">
          <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400">
            Great — press Continue to view the setup steps for{' '}
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
              {platforms.find((platform) => platform.id === selectedPlatform)?.name}
            </span>
            .
          </p>
          <button
            type="button"
            onClick={() => selectPlatform(selectedPlatform, false)}
            className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
          >
            Choose a different connected app
          </button>
        </div>
      ) : selectedPlatform ? (
        <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-5 sm:p-6 space-y-4">
          {selectedPlatform === 'matrix' && (
            <>
              <div className="flex items-center gap-3">
                <Boxes className="h-5 w-5 text-zinc-500" aria-hidden="true" />
                <div>
                  <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Matrix setup</h3>
                  <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
                    Create an access token and add your homeserver.
                  </p>
                </div>
              </div>
              <div className="text-sm text-zinc-600 dark:text-zinc-400 space-y-1">
                <p>1) Sign in to your homeserver (Element or another client).</p>
                <p>2) Create an access token in Settings or Security.</p>
                <p>3) Paste the homeserver URL and token below.</p>
              </div>
              <div className="space-y-3">
                <input
                  type="text"
                  value={config.matrixHomeserver}
                  onChange={(e) => updateConfig({ matrixHomeserver: e.target.value })}
                  placeholder="https://matrix.org"
                  className="w-full px-4 py-3 text-sm sm:text-base rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all placeholder:text-zinc-400"
                />
                <input
                  type="password"
                  value={config.matrixAccessToken}
                  onChange={(e) => updateConfig({ matrixAccessToken: e.target.value })}
                  placeholder="Matrix access token"
                  className="w-full px-4 py-3 text-sm sm:text-base rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all placeholder:text-zinc-400"
                />
              </div>
            </>
          )}

          {selectedPlatform === 'discord' && (
            <>
              <div className="flex items-center gap-3">
                <MessageSquare className="h-5 w-5 text-zinc-500" aria-hidden="true" />
                <div>
                  <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Discord setup</h3>
                  <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
                    Create a bot and paste its token.
                  </p>
                </div>
              </div>
              <div className="text-sm text-zinc-600 dark:text-zinc-400 space-y-1">
                <p>1) Open the Discord Developer Portal and create a bot.</p>
                <p>2) Copy the bot token and add the bot to your server.</p>
                <p>3) Optional: add a Guild ID or Channel IDs to scope access.</p>
              </div>
              <div className="space-y-3">
                <input
                  type="password"
                  value={config.discordToken}
                  onChange={(e) => updateConfig({ discordToken: e.target.value })}
                  placeholder="Discord bot token"
                  className="w-full px-4 py-3 text-sm sm:text-base rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all placeholder:text-zinc-400"
                />
                <input
                  type="text"
                  value={config.discordGuildId}
                  onChange={(e) => updateConfig({ discordGuildId: e.target.value })}
                  placeholder="Guild ID (optional)"
                  className="w-full px-4 py-3 text-sm sm:text-base rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all placeholder:text-zinc-400"
                />
                <input
                  type="text"
                  value={config.discordChannelId}
                  onChange={(e) => updateConfig({ discordChannelId: e.target.value })}
                  placeholder="Channel IDs (comma-separated, optional)"
                  className="w-full px-4 py-3 text-sm sm:text-base rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all placeholder:text-zinc-400"
                />
              </div>
            </>
          )}

          {selectedPlatform === 'slack' && (
            <>
              <div className="flex items-center gap-3">
                <Slack className="h-5 w-5 text-zinc-500" aria-hidden="true" />
                <div>
                  <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Slack setup</h3>
                  <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
                    Create a Slack app with bot and Socket Mode.
                  </p>
                </div>
              </div>
              <div className="text-sm text-zinc-600 dark:text-zinc-400 space-y-1">
                <p>1) Create a Slack app and enable Socket Mode.</p>
                <p>2) Install the app to your workspace.</p>
                <p>3) Paste the bot token and app-level token below.</p>
              </div>
              <div className="space-y-3">
                <input
                  type="password"
                  value={config.slackBotToken}
                  onChange={(e) => updateConfig({ slackBotToken: e.target.value })}
                  placeholder="Slack bot token"
                  className="w-full px-4 py-3 text-sm sm:text-base rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all placeholder:text-zinc-400"
                />
                <input
                  type="password"
                  value={config.slackAppToken}
                  onChange={(e) => updateConfig({ slackAppToken: e.target.value })}
                  placeholder="Slack app token (xapp-...)"
                  className="w-full px-4 py-3 text-sm sm:text-base rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all placeholder:text-zinc-400"
                />
              </div>
            </>
          )}

          {selectedPlatform === 'telegram' && (
            <>
              <div className="flex items-center gap-3">
                <Send className="h-5 w-5 text-zinc-500" aria-hidden="true" />
                <div>
                  <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Telegram setup</h3>
                  <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
                    Create a bot with BotFather and paste the token.
                  </p>
                </div>
              </div>
              <div className="text-sm text-zinc-600 dark:text-zinc-400 space-y-1">
                <p>1) Message @BotFather and create a new bot.</p>
                <p>2) Copy the bot token.</p>
                <p>3) Optional: restrict access to chat IDs.</p>
              </div>
              <div className="space-y-3">
                <input
                  type="password"
                  value={config.telegramBotToken}
                  onChange={(e) => updateConfig({ telegramBotToken: e.target.value })}
                  placeholder="Telegram bot token"
                  className="w-full px-4 py-3 text-sm sm:text-base rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all placeholder:text-zinc-400"
                />
                <input
                  type="text"
                  value={config.telegramChatId}
                  onChange={(e) => updateConfig({ telegramChatId: e.target.value })}
                  placeholder="Allowed chat IDs (comma-separated, optional)"
                  className="w-full px-4 py-3 text-sm sm:text-base rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all placeholder:text-zinc-400"
                />
              </div>
            </>
          )}

          {selectedPlatform === 'whatsapp' && (
            <>
              <div className="flex items-center gap-3">
                <MessageCircle className="h-5 w-5 text-zinc-500" aria-hidden="true" />
                <div>
                  <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">WhatsApp setup</h3>
                  <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
                    Set up a Meta app and copy the API credentials.
                  </p>
                </div>
              </div>
              <div className="text-sm text-zinc-600 dark:text-zinc-400 space-y-1">
                <p>1) Create a Meta app and add WhatsApp to it.</p>
                <p>2) Copy the Phone Number ID and access token.</p>
                <p>3) Optional: set a verify token and webhook URL.</p>
              </div>
              <div className="space-y-3">
                <input
                  type="text"
                  value={config.whatsappPhoneNumberId}
                  onChange={(e) => updateConfig({ whatsappPhoneNumberId: e.target.value })}
                  placeholder="Phone Number ID"
                  className="w-full px-4 py-3 text-sm sm:text-base rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all placeholder:text-zinc-400"
                />
                <input
                  type="password"
                  value={config.whatsappAccessToken}
                  onChange={(e) => updateConfig({ whatsappAccessToken: e.target.value })}
                  placeholder="Access token"
                  className="w-full px-4 py-3 text-sm sm:text-base rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all placeholder:text-zinc-400"
                />
                <input
                  type="text"
                  value={config.whatsappVerifyToken}
                  onChange={(e) => updateConfig({ whatsappVerifyToken: e.target.value })}
                  placeholder="Verify token (optional)"
                  className="w-full px-4 py-3 text-sm sm:text-base rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all placeholder:text-zinc-400"
                />
                <input
                  type="text"
                  value={config.whatsappWebhookUrl}
                  onChange={(e) => updateConfig({ whatsappWebhookUrl: e.target.value })}
                  placeholder="Webhook URL (optional)"
                  className="w-full px-4 py-3 text-sm sm:text-base rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all placeholder:text-zinc-400"
                />
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 p-6 text-center text-sm text-zinc-600 dark:text-zinc-400">
          Select a connected app to see setup steps and token inputs.
        </div>
      )}
    </div>
  );
}

function Step1Welcome() {
  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <h2 className="text-2xl sm:text-3xl font-semibold text-zinc-900 dark:text-zinc-50">
          Welcome to Kredo
        </h2>
        <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400">
          You’re a minute away from getting your very own AI assistant.
        </p>
        <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400">
          This setup wizard will guide you through the process.
        </p>
      </div>
    </div>
  );
}

function Step4Review({
  config,
  isDeploying,
  isReady,
  error,
  bootStatus,
  gatewayStatus,
  showPairingStep,
  showDeployHoldNotice,
}: {
  config: SetupConfig;
  isDeploying: boolean;
  isReady: boolean;
  error: string | null;
  bootStatus?: string;
  gatewayStatus?: string;
  showPairingStep: boolean;
  showDeployHoldNotice: boolean;
}) {
  const enabledPlatforms = [];
  if (config.matrixEnabled) enabledPlatforms.push({ name: 'Matrix', Icon: Boxes });
  if (config.discordEnabled) enabledPlatforms.push({ name: 'Discord', Icon: MessageSquare });
  if (config.slackEnabled) enabledPlatforms.push({ name: 'Slack', Icon: Slack });
  if (config.telegramEnabled) enabledPlatforms.push({ name: 'Telegram', Icon: Send });
  if (config.whatsappEnabled) enabledPlatforms.push({ name: 'WhatsApp', Icon: MessageCircle });

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500">
      {!isDeploying && (
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <h2 className="text-2xl sm:text-3xl font-semibold text-zinc-900 dark:text-zinc-50">
          Review and deploy
        </h2>
        <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400">
          One last look. Then we’ll quietly launch your assistant.
        </p>
      </div>
      )
      }

      {error && (
        <div className="p-5 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/60">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-300" aria-hidden="true" />
            <div>
              <h4 className="font-semibold text-red-900 dark:text-red-200 mb-1">Deployment Error</h4>
              <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
            </div>
          </div>
        </div>
      )}

      {isDeploying && !isReady ? (
        <div className="text-center py-10 sm:py-16">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-zinc-100 dark:bg-zinc-900 mb-4">
            <svg className="animate-spin h-7 w-7 text-zinc-700 dark:text-zinc-300" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
          <h3 className="text-xl sm:text-2xl font-semibold text-zinc-900 dark:text-zinc-50 mb-2">Starting your OpenClaw instance…</h3>
          <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400">
            This takes a minute. Pairing appears as soon as we’re ready.
          </p>
          {showDeployHoldNotice && (
            <p className="mt-3 text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
              We will unlock Continue as soon as deployment finishes.
            </p>
          )}
          {(bootStatus || gatewayStatus) && (
            <p className="mt-3 text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
              Status: {bootStatus || gatewayStatus}
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-4 max-w-2xl mx-auto">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 sm:p-6 border border-zinc-200/80 dark:border-zinc-800/80">
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
              Connected App
            </p>
            {enabledPlatforms.length > 0 ? (
              <div className="mt-3 flex items-center justify-between rounded-xl border border-zinc-200/70 dark:border-zinc-800/70 px-4 py-3 bg-zinc-50/60 dark:bg-zinc-900/40">
                <div className="flex items-center gap-3">
                  {(() => {
                    const platform = enabledPlatforms[0];
                    const Icon = platform.Icon;
                    return <Icon className="h-5 w-5 text-zinc-600 dark:text-zinc-300" aria-hidden="true" />;
                  })()}
                  <div>
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {enabledPlatforms[0].name}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">Awaiting Agent</p>
                  </div>
                </div>
              </div>
            ) : (
            <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">No connected app selected</p>
            )}
          </div>

          <div className="bg-zinc-50 dark:bg-zinc-900/60 rounded-2xl p-5 sm:p-6 border border-zinc-200/80 dark:border-zinc-800/80">
            <div className="flex items-start gap-3">
              <Sparkles className="h-6 w-6 text-zinc-700 dark:text-zinc-300" aria-hidden="true" />
              <div>
                <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
                  {isReady ? 'Deployed' : 'Ready to deploy'}
                </h4>
                <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
                  {isReady
                    ? 'Your assistant is live. Continue when you are ready.'
                    : 'We will launch your assistant and take you to the dashboard.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Step5Pairing({
  pairingInfo,
  pairingCode,
  onPairingCodeChange,
  onApprovePairing,
  pairingError,
  pairingSuccess,
  isApproving,
  isReady,
}: {
  pairingInfo: PairingInfo | null;
  pairingCode: string;
  onPairingCodeChange: (value: string) => void;
  onApprovePairing: () => void;
  pairingError: string | null;
  pairingSuccess: string | null;
  isApproving: boolean;
  isReady: boolean;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const normalizedCode = pairingCode.replace(/[^a-z0-9]/gi, '').toUpperCase().slice(0, 8);
  const codeChars = normalizedCode.padEnd(8, ' ').split('');

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500">
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <h2 className="text-2xl sm:text-3xl font-semibold text-zinc-900 dark:text-zinc-50">
          Pair Telegram
        </h2>
        <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400">
          <span className="block">
            1) Send <span>/start</span> to your Telegram bot.
          </span>
          <span className="block">
            2) Copy the 8‑character code (example: <span>TVBEQND5</span>).
          </span>
          <span className="block">3) Paste it below.</span>
        </p>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 sm:p-8 border border-zinc-200/80 dark:border-zinc-800/80 max-w-2xl mx-auto">
        {!isReady ? (
          <div className="text-center space-y-2">
            <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400">
              Pairing becomes available as soon as deployment finishes.
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-500">
              We’ll bring you back here automatically.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <label className="text-xs uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
              Pairing code
            </label>
            <div
              className="flex flex-wrap justify-center items-center gap-2 sm:gap-3"
              onClick={() => inputRef.current?.focus()}
              role="presentation"
            >
              {codeChars.map((char, index) => (
                <div
                  key={`pair-${index}`}
                  className="h-12 w-10 sm:h-14 sm:w-12 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 text-lg sm:text-xl font-semibold text-zinc-900 dark:text-zinc-50 flex items-center justify-center"
                >
                  {char.trim() || '\u00A0'}
                </div>
              ))}
              <input
                ref={inputRef}
                type="text"
                value={normalizedCode}
                onChange={(event) => onPairingCodeChange(event.target.value)}
                inputMode="text"
                autoComplete="one-time-code"
                maxLength={8}
                className="sr-only"
                aria-label="Pairing code"
              />
            </div>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 text-center">
              Paste your code or type it — we’ll auto-format.
            </p>
            <div className="flex flex-col items-center gap-3">
              <button
                onClick={onApprovePairing}
                disabled={!normalizedCode.trim() || isApproving}
                className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isApproving ? 'Approving...' : 'Approve pairing'}
              </button>
              {pairingError && (
                <p className="text-xs text-red-700 dark:text-red-300">{pairingError}</p>
              )}
              {pairingSuccess && (
                <p className="text-xs text-emerald-700 dark:text-emerald-300">{pairingSuccess}</p>
              )}
            </div>
          </div>
        )}
      </div>

      {pairingInfo && (
        <div className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 space-y-1">
          <p>OpenClaw: access not configured.</p>
          {pairingInfo.userId && (
            <p>
              Your {pairingInfo.platform || 'connected app'} user id: {pairingInfo.userId}
            </p>
          )}
          {pairingInfo.code && <p>Pairing code: {pairingInfo.code}</p>}
          {pairingInfo.command && (
            <p className="bg-zinc-100 dark:bg-zinc-800 rounded px-2 py-1 inline-block">
              {pairingInfo.command}
            </p>
          )}
          {!pairingInfo.command && pairingInfo.code && (
            <p className="bg-zinc-100 dark:bg-zinc-800 rounded px-2 py-1 inline-block">
              openclaw pairing approve {pairingInfo.platform?.toLowerCase() || 'telegram'} {pairingInfo.code}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
