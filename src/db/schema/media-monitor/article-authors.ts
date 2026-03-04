import { integer, serial, text } from "drizzle-orm/pg-core";

import { articles } from "./articles";
import { mediaMonitor } from "./publications";

export const articleAuthors = mediaMonitor.table("article_authors", {
  id: serial("id").primaryKey(),
  articleId: integer("article_id")
    .notNull()
    .references(() => articles.id),
  name: text("name").notNull(),
  sortOrder: integer("sort_order").default(0),
});
