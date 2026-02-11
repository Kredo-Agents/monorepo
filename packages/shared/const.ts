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
