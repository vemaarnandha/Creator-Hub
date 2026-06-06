CREATE TABLE `invoice_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`invoice_id` integer,
	`creator_id` integer,
	`creator_name` text NOT NULL,
	`role` text DEFAULT 'creator',
	`fee` integer DEFAULT 0 NOT NULL,
	`description` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`creator_id`) REFERENCES `creators`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_invoices` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`project_id` integer,
	`client_id` integer,
	`invoice_number` text NOT NULL,
	`amount` integer NOT NULL,
	`description` text,
	`issue_date` text NOT NULL,
	`due_date` text,
	`status` text DEFAULT 'pending',
	`auto_generated` integer DEFAULT false,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_invoices`("id", "project_id", "client_id", "invoice_number", "amount", "description", "issue_date", "due_date", "status", "auto_generated", "created_at") SELECT "id", "project_id", "client_id", "invoice_number", "amount", "description", "issue_date", "due_date", "status", "auto_generated", "created_at" FROM `invoices`;--> statement-breakpoint
DROP TABLE `invoices`;--> statement-breakpoint
ALTER TABLE `__new_invoices` RENAME TO `invoices`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `invoices_invoice_number_unique` ON `invoices` (`invoice_number`);--> statement-breakpoint
CREATE TABLE `__new_project_creators` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`project_id` integer,
	`creator_id` integer,
	`assigned_at` text DEFAULT CURRENT_TIMESTAMP,
	`fee` integer DEFAULT 0,
	`role` text DEFAULT 'creator',
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`creator_id`) REFERENCES `creators`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_project_creators`("id", "project_id", "creator_id", "assigned_at", "fee", "role") SELECT "id", "project_id", "creator_id", "assigned_at", "fee", "role" FROM `project_creators`;--> statement-breakpoint
DROP TABLE `project_creators`;--> statement-breakpoint
ALTER TABLE `__new_project_creators` RENAME TO `project_creators`;--> statement-breakpoint
CREATE TABLE `__new_ratings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`project_id` integer,
	`creator_id` integer,
	`client_id` integer,
	`rating` integer NOT NULL,
	`review_text` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`creator_id`) REFERENCES `creators`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_ratings`("id", "project_id", "creator_id", "client_id", "rating", "review_text", "created_at") SELECT "id", "project_id", "creator_id", "client_id", "rating", "review_text", "created_at" FROM `ratings`;--> statement-breakpoint
DROP TABLE `ratings`;--> statement-breakpoint
ALTER TABLE `__new_ratings` RENAME TO `ratings`;--> statement-breakpoint
ALTER TABLE `creators` ADD `rate` integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE `creators` ADD `rate_type` text DEFAULT 'per_project';--> statement-breakpoint
ALTER TABLE `schedules` ADD `auto_generated` integer DEFAULT false;You stopped after 22m 16s