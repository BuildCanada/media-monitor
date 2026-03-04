import { integer, real, serial, text } from "drizzle-orm/pg-core";

import { articles } from "./articles";
import { mediaMonitor } from "./publications";

export const articleTags = mediaMonitor.table("article_tags", {
  id: serial("id").primaryKey(),
  articleId: integer("article_id")
    .notNull()
    .references(() => articles.id),
  pressreaderTagId: integer("pressreader_tag_id"),
  displayName: text("display_name").notNull(),
  weight: real("weight"),
});
