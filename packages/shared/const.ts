export const COOKIE_NAME = "app_session_id";
export const ONE_YEAR_MS = 1000 * 60 * 60 * 24 * 365;
export const AXIOS_TIMEOUT_MS = 30_000;
export const UNAUTHED_ERR_MSG = 'Please login (10001)';
export const NOT_ADMIN_ERR_MSG = 'You do not have required permission (10002)';

// Credit system constants (values stored as tenths — 1 stored unit = 0.1 display credits)
export const CREDIT_DIVISOR = 10;
export const CHAT_MESSAGE_COST = 1;      // 0.1 display credits per message
export const INSTANCE_DAILY_COST = 50;   // 5.0 display credits per day
export const LOW_CREDIT_THRESHOLD = 50;  // 5.0 display credits — warn user
export const INSUFFICIENT_CREDITS_MSG = 'Insufficient credits (10003)';

// --- Plan system ---
export type PlanTier = 'free' | 'pro';

export interface PlanConfig {
  name: PlanTier;
  displayName: string;
  dailyRefreshCredits: number; // stored tenths refreshed to daily
  maxCredits: number;          // cap for the plan
}

export const PLANS: Record<PlanTier, PlanConfig> = {
  free: {
    name: 'free',
    displayName: 'Free',
    dailyRefreshCredits: 3000, // refresh to 300.0 display credits
    maxCredits: 3000,
  },
  pro: {
    name: 'pro',
    displayName: 'Pro',
    dailyRefreshCredits: 10000, // refresh to 1000.0 display credits
    maxCredits: 50000,
  },
};

export const DEFAULT_PLAN: PlanTier = 'free';

// --- Model system ---
export type ModelId = 'premium' | 'cheap';

export interface ModelConfig {
  id: ModelId;
  displayName: string;
  gatewayModel: string;  // model string sent to gateway
  creditCost: number;    // stored tenths per message
}

export const MODELS: Record<ModelId, ModelConfig> = {
  premium: {
    id: 'premium',
    displayName: 'Claude Opus 4.6',
    gatewayModel: 'openclaw:main',
    creditCost: 1, // 0.1 display credits
  },
  cheap: {
    id: 'cheap',
    displayName: 'Step 3.5 Flash',
    gatewayModel: 'openclaw:flash',
    creditCost: 1, // 0.1 display credits (same for now; gateway model is cheaper to run)
  },
};
