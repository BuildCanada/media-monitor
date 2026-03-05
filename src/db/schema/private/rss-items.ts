import { integer, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";

import { rssFeeds } from "./rss-feeds";
import { mediaMonitorPrivate } from "./schema";

export const rssItems = mediaMonitorPrivate.table("rss_items", {
  id: serial("id").primaryKey(),
  feedId: integer("feed_id")
    .notNull()
    .references(() => rssFeeds.id),
  guid: text("guid").notNull().unique(),
  link: text("link").notNull().unique(),
  title: text("title").notNull(),
  author: text("author"),
  pubDate: timestamp("pub_date"),
  description: text("description"),
  categories: text("categories").array(),
  contentMarkdown: text("content_markdown"),
  contentHash: varchar("content_hash", { length: 64 }),
  defuddleTitle: text("defuddle_title"),
  defuddleAuthor: text("defuddle_author"),
  defuddleDescription: text("defuddle_description"),
  defuddleDomain: text("defuddle_domain"),
  defuddlePublished: text("defuddle_published"),
  defuddleWordCount: integer("defuddle_word_count"),
  processingStatus: varchar("processing_status", { length: 16 })
    .notNull()
    .default("pending"), // pending | extracting | embedding | completed | failed
  retryCount: integer("retry_count").notNull().default(0),
  processingError: text("processing_error"),
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
