import { integer, serial, text, uniqueIndex } from "drizzle-orm/pg-core";

import { mediaMonitor } from "./publications";
import { publications } from "./publications";

export const sections = mediaMonitor.table(
  "sections",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    publicationId: integer("publication_id")
      .notNull()
      .references(() => publications.id),
  },
  (table) => [uniqueIndex("sections_name_publication_idx").on(table.name, table.publicationId)],
);
