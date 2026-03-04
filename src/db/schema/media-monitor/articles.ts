import { bigint, integer, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";

import { issues } from "./issues";
import { mediaMonitor } from "./publications";
import { sections } from "./sections";

export const articles = mediaMonitor.table("articles", {
  id: serial("id").primaryKey(),
  issueId: integer("issue_id")
    .notNull()
    .references(() => issues.id),
  pressreaderId: bigint("pressreader_id", { mode: "bigint" }),
  title: text("title"),
  subtitle: text("subtitle"),
  byline: text("byline"),
  sectionId: integer("section_id").references(() => sections.id),
  sectionName: text("section_name"),
  page: integer("page"),
  pageName: text("page_name"),
  language: varchar("language", { length: 8 }),
  originalLanguage: varchar("original_language", { length: 8 }),
  articleType: varchar("article_type", { length: 32 }),
  textLength: integer("text_length"),
  bodyText: text("body_text"),
  bodyHtml: text("body_html"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
