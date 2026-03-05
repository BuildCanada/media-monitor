import { boolean, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";

import { mediaMonitorPrivate } from "./schema";

export const rssFeeds = mediaMonitorPrivate.table("rss_feeds", {
  id: serial("id").primaryKey(),
  publicationName: varchar("publication_name", { length: 128 }).notNull(),
  feedUrl: text("feed_url").notNull().unique(),
  category: varchar("category", { length: 64 }),
  enabled: boolean("enabled").default(true).notNull(),
  lastFetchedAt: timestamp("last_fetched_at"),
  lastFetchError: text("last_fetch_error"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
