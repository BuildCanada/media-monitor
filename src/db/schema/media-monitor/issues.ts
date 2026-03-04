import { date, integer, serial, timestamp, uniqueIndex, varchar } from "drizzle-orm/pg-core";

import { mediaMonitor } from "./publications";
import { publications } from "./publications";

export const issues = mediaMonitor.table(
  "issues",
  {
    id: serial("id").primaryKey(),
    publicationId: integer("publication_id")
      .notNull()
      .references(() => publications.id),
    pressreaderIssueId: integer("pressreader_issue_id"),
    issueKey: varchar("issue_key", { length: 64 }).notNull(),
    cid: varchar("cid", { length: 32 }).notNull(),
    issueDate: date("issue_date").notNull(),
    version: integer("version"),
    pageCount: integer("page_count"),
    articleCount: integer("article_count"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [uniqueIndex("issues_cid_issue_date_idx").on(table.cid, table.issueDate)],
);
