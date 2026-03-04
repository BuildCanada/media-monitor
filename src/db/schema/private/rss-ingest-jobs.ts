import { integer, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";

import { mediaMonitorPrivate } from "./scrape-jobs";

export const rssIngestJobs = mediaMonitorPrivate.table("rss_ingest_jobs", {
  id: serial("id").primaryKey(),
  status: varchar("status", { length: 16 }).notNull().default("pending"), // pending | running | completed | failed
  feedsFetched: integer("feeds_fetched").default(0),
  newItems: integer("new_items").default(0),
  itemsProcessed: integer("items_processed").default(0),
  itemsFailed: integer("items_failed").default(0),
  errorMessage: text("error_message"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
