import { integer, numeric, serial, text, varchar } from "drizzle-orm/pg-core";

import { rssItems } from "./rss-items";
import { mediaMonitorPrivate } from "./schema";

export const rssEntities = mediaMonitorPrivate.table("rss_entities", {
  id: serial("id").primaryKey(),
  rssItemId: integer("rss_item_id")
    .notNull()
    .references(() => rssItems.id),
  entityType: varchar("entity_type", { length: 16 }).notNull(), // person | organization | location | topic
  entityValue: text("entity_value").notNull(),
  confidence: numeric("confidence", { precision: 4, scale: 3 }),
});
