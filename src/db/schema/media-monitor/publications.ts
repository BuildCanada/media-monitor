import { boolean, integer, pgSchema, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const mediaMonitor = pgSchema("media_monitor");

export const publications = mediaMonitor.table("publications", {
  id: serial("id").primaryKey(),
  pressreaderId: integer("pressreader_id"),
  cid: varchar("cid", { length: 32 }).notNull().unique(),
  type: varchar("type", { length: 32 }),
  name: text("name").notNull(),
  displayName: text("display_name"),
  issn: varchar("issn", { length: 16 }),
  slug: varchar("slug", { length: 255 }),
  language: varchar("language", { length: 8 }),
  countries: text("countries").array(),
  publisherName: text("publisher_name"),
  schedule: varchar("schedule", { length: 32 }),
  isFree: boolean("is_free").default(false),
  categories: text("categories").array(),
  rank: integer("rank"),
  enabled: boolean("enabled").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
