ALTER TABLE `plugins` MODIFY COLUMN `type` enum('channel','deployment','monitoring','skill-provider','infrastructure','other') NOT NULL;--> statement-breakpoint
ALTER TABLE `plugins` ADD `dockerImage` varchar(255);--> statement-breakpoint
ALTER TABLE `plugins` ADD `dockerTag` varchar(100) DEFAULT 'latest';--> statement-breakpoint
ALTER TABLE `plugins` ADD `containerId` varchar(100);--> statement-breakpoint
ALTER TABLE `plugins` ADD `containerStatus` enum('running','stopped','error','not_installed') DEFAULT 'not_installed';--> statement-breakpoint
ALTER TABLE `plugins` ADD `hostPort` int;--> statement-breakpoint
ALTER TABLE `plugins` ADD `pluginConfig` json;--> statement-breakpoint
ALTER TABLE `skills` ADD `usage_count` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `skills` ADD `last_used_at` timestamp;--> statement-breakpoint
ALTER TABLE `skills` DROP COLUMN `usageCount`;--> statement-breakpoint
ALTER TABLE `skills` DROP COLUMN `lastUsedAt`;