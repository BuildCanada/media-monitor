import { integer, numeric, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";

import { rssItems } from "./rss-items";
import { mediaMonitorPrivate } from "./schema";

export const socialSuggestions = mediaMonitorPrivate.table("social_suggestions", {
  id: serial("id").primaryKey(),
  rssItemId: integer("rss_item_id")
    .notNull()
    .references(() => rssItems.id),
  memoRssItemId: integer("memo_rss_item_id")
    .notNull()
    .references(() => rssItems.id),
  searchQuery: text("search_query").notNull(),
  matchScore: numeric("match_score", { precision: 6, scale: 4 }).notNull(),
  matchedChunkText: text("matched_chunk_text").notNull(),
  articleTitle: text("article_title").notNull(),
  memoTitle: text("memo_title").notNull(),
  memoUrl: text("memo_url").notNull(),
  suggestedComment: text("suggested_comment").notNull(),
  status: varchar("status", { length: 16 })
    .notNull()
    .default("pending"), // pending | approved | posted | dismissed
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
