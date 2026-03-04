import { bigint, integer, serial, text, timestamp } from "drizzle-orm/pg-core";

import { articles } from "./articles";
import { mediaMonitor } from "./publications";

export const articleImages = mediaMonitor.table("article_images", {
  id: serial("id").primaryKey(),
  articleId: integer("article_id")
    .notNull()
    .references(() => articles.id),
  pressreaderImageId: bigint("pressreader_image_id", { mode: "bigint" }),
  originalUrl: text("original_url"),
  r2Key: text("r2_key"),
  width: integer("width"),
  height: integer("height"),
  caption: text("caption"),
  byline: text("byline"),
  copyright: text("copyright"),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
