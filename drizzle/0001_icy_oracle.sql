DROP TABLE "media_monitor_private"."auth_sessions" CASCADE;--> statement-breakpoint
DROP TABLE "media_monitor_private"."publication_sync_log" CASCADE;--> statement-breakpoint
DROP TABLE "media_monitor_private"."scrape_jobs" CASCADE;--> statement-breakpoint
DROP TABLE "media_monitor_private"."scrape_tasks" CASCADE;--> statement-breakpoint
ALTER TABLE "media_monitor"."article_images" DROP COLUMN "pressreader_image_id";--> statement-breakpoint
ALTER TABLE "media_monitor"."article_tags" DROP COLUMN "pressreader_tag_id";--> statement-breakpoint
ALTER TABLE "media_monitor"."articles" DROP COLUMN "pressreader_id";--> statement-breakpoint
ALTER TABLE "media_monitor"."issues" DROP COLUMN "pressreader_issue_id";--> statement-breakpoint
ALTER TABLE "media_monitor"."publications" DROP COLUMN "pressreader_id";