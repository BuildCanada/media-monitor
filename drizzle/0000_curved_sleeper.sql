CREATE SCHEMA "media_monitor";
--> statement-breakpoint
CREATE SCHEMA "media_monitor_private";
--> statement-breakpoint
CREATE TABLE "media_monitor"."article_authors" (
	"id" serial PRIMARY KEY NOT NULL,
	"article_id" integer NOT NULL,
	"name" text NOT NULL,
	"sort_order" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "media_monitor"."article_images" (
	"id" serial PRIMARY KEY NOT NULL,
	"article_id" integer NOT NULL,
	"pressreader_image_id" bigint,
	"original_url" text,
	"r2_key" text,
	"width" integer,
	"height" integer,
	"caption" text,
	"byline" text,
	"copyright" text,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "media_monitor"."article_tags" (
	"id" serial PRIMARY KEY NOT NULL,
	"article_id" integer NOT NULL,
	"pressreader_tag_id" integer,
	"display_name" text NOT NULL,
	"weight" real
);
--> statement-breakpoint
CREATE TABLE "media_monitor"."articles" (
	"id" serial PRIMARY KEY NOT NULL,
	"issue_id" integer NOT NULL,
	"pressreader_id" bigint,
	"title" text,
	"subtitle" text,
	"byline" text,
	"section_id" integer,
	"section_name" text,
	"page" integer,
	"page_name" text,
	"language" varchar(8),
	"original_language" varchar(8),
	"article_type" varchar(32),
	"text_length" integer,
	"body_text" text,
	"body_html" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "media_monitor"."issues" (
	"id" serial PRIMARY KEY NOT NULL,
	"publication_id" integer NOT NULL,
	"pressreader_issue_id" integer,
	"issue_key" varchar(64) NOT NULL,
	"cid" varchar(32) NOT NULL,
	"issue_date" date NOT NULL,
	"version" integer,
	"page_count" integer,
	"article_count" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "media_monitor"."publications" (
	"id" serial PRIMARY KEY NOT NULL,
	"pressreader_id" integer,
	"cid" varchar(32) NOT NULL,
	"type" varchar(32),
	"name" text NOT NULL,
	"display_name" text,
	"issn" varchar(16),
	"slug" varchar(255),
	"language" varchar(8),
	"countries" text[],
	"publisher_name" text,
	"schedule" varchar(32),
	"is_free" boolean DEFAULT false,
	"categories" text[],
	"rank" integer,
	"enabled" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "publications_cid_unique" UNIQUE("cid")
);
--> statement-breakpoint
CREATE TABLE "media_monitor"."sections" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"publication_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "media_monitor_private"."auth_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_type" varchar(16) NOT NULL,
	"cookies_json" text,
	"jwt_token" text,
	"jwt_expires_at" timestamp,
	"is_active" boolean DEFAULT true NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "media_monitor_private"."publication_sync_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"total_found" integer DEFAULT 0,
	"new_added" integer DEFAULT 0,
	"updated" integer DEFAULT 0,
	"synced_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "media_monitor_private"."rss_entities" (
	"id" serial PRIMARY KEY NOT NULL,
	"rss_item_id" integer NOT NULL,
	"entity_type" varchar(16) NOT NULL,
	"entity_value" text NOT NULL,
	"confidence" numeric(4, 3)
);
--> statement-breakpoint
CREATE TABLE "media_monitor_private"."rss_feeds" (
	"id" serial PRIMARY KEY NOT NULL,
	"publication_name" varchar(128) NOT NULL,
	"feed_url" text NOT NULL,
	"category" varchar(64),
	"enabled" boolean DEFAULT true NOT NULL,
	"last_fetched_at" timestamp,
	"last_fetch_error" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "rss_feeds_feed_url_unique" UNIQUE("feed_url")
);
--> statement-breakpoint
CREATE TABLE "media_monitor_private"."rss_ingest_jobs" (
	"id" serial PRIMARY KEY NOT NULL,
	"status" varchar(16) DEFAULT 'pending' NOT NULL,
	"feeds_fetched" integer DEFAULT 0,
	"new_items" integer DEFAULT 0,
	"items_processed" integer DEFAULT 0,
	"items_failed" integer DEFAULT 0,
	"error_message" text,
	"started_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "media_monitor_private"."rss_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"feed_id" integer NOT NULL,
	"guid" text NOT NULL,
	"link" text NOT NULL,
	"title" text NOT NULL,
	"author" text,
	"pub_date" timestamp,
	"description" text,
	"categories" text[],
	"content_markdown" text,
	"content_hash" varchar(64),
	"defuddle_title" text,
	"defuddle_author" text,
	"defuddle_description" text,
	"defuddle_domain" text,
	"defuddle_published" text,
	"defuddle_word_count" integer,
	"processing_status" varchar(16) DEFAULT 'pending' NOT NULL,
	"processing_error" text,
	"processed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "rss_items_guid_unique" UNIQUE("guid"),
	CONSTRAINT "rss_items_link_unique" UNIQUE("link")
);
--> statement-breakpoint
CREATE TABLE "media_monitor_private"."scrape_jobs" (
	"id" serial PRIMARY KEY NOT NULL,
	"job_type" varchar(16) NOT NULL,
	"status" varchar(16) DEFAULT 'pending' NOT NULL,
	"started_at" timestamp,
	"completed_at" timestamp,
	"error_message" text,
	"publications_total" integer DEFAULT 0,
	"issues_total" integer DEFAULT 0,
	"issues_scraped" integer DEFAULT 0,
	"articles_scraped" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "media_monitor_private"."scrape_tasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"job_id" integer NOT NULL,
	"publication_cid" varchar(32) NOT NULL,
	"issue_date" date NOT NULL,
	"issue_key" varchar(64),
	"status" varchar(16) DEFAULT 'pending' NOT NULL,
	"attempt" integer DEFAULT 0,
	"max_attempts" integer DEFAULT 3,
	"error_message" text,
	"articles_found" integer DEFAULT 0,
	"articles_saved" integer DEFAULT 0,
	"images_found" integer DEFAULT 0,
	"images_saved" integer DEFAULT 0,
	"started_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "media_monitor"."article_authors" ADD CONSTRAINT "article_authors_article_id_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "media_monitor"."articles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_monitor"."article_images" ADD CONSTRAINT "article_images_article_id_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "media_monitor"."articles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_monitor"."article_tags" ADD CONSTRAINT "article_tags_article_id_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "media_monitor"."articles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_monitor"."articles" ADD CONSTRAINT "articles_issue_id_issues_id_fk" FOREIGN KEY ("issue_id") REFERENCES "media_monitor"."issues"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_monitor"."articles" ADD CONSTRAINT "articles_section_id_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "media_monitor"."sections"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_monitor"."issues" ADD CONSTRAINT "issues_publication_id_publications_id_fk" FOREIGN KEY ("publication_id") REFERENCES "media_monitor"."publications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_monitor"."sections" ADD CONSTRAINT "sections_publication_id_publications_id_fk" FOREIGN KEY ("publication_id") REFERENCES "media_monitor"."publications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_monitor_private"."rss_entities" ADD CONSTRAINT "rss_entities_rss_item_id_rss_items_id_fk" FOREIGN KEY ("rss_item_id") REFERENCES "media_monitor_private"."rss_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_monitor_private"."rss_items" ADD CONSTRAINT "rss_items_feed_id_rss_feeds_id_fk" FOREIGN KEY ("feed_id") REFERENCES "media_monitor_private"."rss_feeds"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_monitor_private"."scrape_tasks" ADD CONSTRAINT "scrape_tasks_job_id_scrape_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "media_monitor_private"."scrape_jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "issues_cid_issue_date_idx" ON "media_monitor"."issues" USING btree ("cid","issue_date");--> statement-breakpoint
CREATE UNIQUE INDEX "sections_name_publication_idx" ON "media_monitor"."sections" USING btree ("name","publication_id");