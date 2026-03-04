import { integer, pgSchema, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const mediaMonitorPrivate = pgSchema("media_monitor_private");

export const scrapeJobs = mediaMonitorPrivate.table("scrape_jobs", {
  id: serial("id").primaryKey(),
  jobType: varchar("job_type", { length: 16 }).notNull(), // daily | backfill
  status: varchar("status", { length: 16 }).notNull().default("pending"), // pending | running | completed | failed
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  errorMessage: text("error_message"),
  publicationsTotal: integer("publications_total").default(0),
  issuesTotal: integer("issues_total").default(0),
  issuesScraped: integer("issues_scraped").default(0),
  articlesScraped: integer("articles_scraped").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
