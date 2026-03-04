import { date, integer, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";

import { mediaMonitorPrivate } from "./scrape-jobs";
import { scrapeJobs } from "./scrape-jobs";

export const scrapeTasks = mediaMonitorPrivate.table("scrape_tasks", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id")
    .notNull()
    .references(() => scrapeJobs.id),
  publicationCid: varchar("publication_cid", { length: 32 }).notNull(),
  issueDate: date("issue_date").notNull(),
  issueKey: varchar("issue_key", { length: 64 }),
  status: varchar("status", { length: 16 }).notNull().default("pending"), // pending | queued | running | completed | failed | skipped
  attempt: integer("attempt").default(0),
  maxAttempts: integer("max_attempts").default(3),
  errorMessage: text("error_message"),
  articlesFound: integer("articles_found").default(0),
  articlesSaved: integer("articles_saved").default(0),
  imagesFound: integer("images_found").default(0),
  imagesSaved: integer("images_saved").default(0),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
