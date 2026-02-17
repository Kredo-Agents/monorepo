-- Convert credit storage from whole credits to tenths (multiply by 10).
-- 50 credits becomes 500 stored (displayed as 50.0).
-- 0.1 display credits = 1 stored unit.
UPDATE `users` SET `credits` = `credits` * 10;
UPDATE `creditTransactions` SET `amount` = `amount` * 10, `balance` = `balance` * 10;
