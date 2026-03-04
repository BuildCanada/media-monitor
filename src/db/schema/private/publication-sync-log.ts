import { integer, serial, timestamp } from "drizzle-orm/pg-core";

import { mediaMonitorPrivate } from "./scrape-jobs";

export const publicationSyncLog = mediaMonitorPrivate.table("publication_sync_log", {
  id: serial("id").primaryKey(),
  totalFound: integer("total_found").default(0),
  newAdded: integer("new_added").default(0),
  updated: integer("updated").default(0),
  syncedAt: timestamp("synced_at").defaultNow().notNull(),
});
