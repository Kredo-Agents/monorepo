ALTER TABLE `creditTransactions` MODIFY COLUMN `type` enum('initial','topup','deduction','refund','adjustment','daily_refresh') NOT NULL;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `credits` int NOT NULL DEFAULT 500;--> statement-breakpoint
ALTER TABLE `users` ADD `plan` varchar(20) DEFAULT 'free' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `lastDailyRefresh` timestamp;