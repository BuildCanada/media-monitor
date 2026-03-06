CREATE TABLE "media_monitor_private"."social_suggestions" (
	"id" serial PRIMARY KEY NOT NULL,
	"rss_item_id" integer NOT NULL,
	"memo_rss_item_id" integer NOT NULL,
	"search_query" text NOT NULL,
	"match_score" numeric(6, 4) NOT NULL,
	"matched_chunk_text" text NOT NULL,
	"article_title" text NOT NULL,
	"memo_title" text NOT NULL,
	"memo_url" text NOT NULL,
	"suggested_comment" text NOT NULL,
	"status" varchar(16) DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "media_monitor_private"."social_suggestions" ADD CONSTRAINT "social_suggestions_rss_item_id_rss_items_id_fk" FOREIGN KEY ("rss_item_id") REFERENCES "media_monitor_private"."rss_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_monitor_private"."social_suggestions" ADD CONSTRAINT "social_suggestions_memo_rss_item_id_rss_items_id_fk" FOREIGN KEY ("memo_rss_item_id") REFERENCES "media_monitor_private"."rss_items"("id") ON DELETE no action ON UPDATE no action;