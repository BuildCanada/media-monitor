import { boolean, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";

import { mediaMonitorPrivate } from "./scrape-jobs";

export const authSessions = mediaMonitorPrivate.table("auth_sessions", {
  id: serial("id").primaryKey(),
  sessionType: varchar("session_type", { length: 16 }).notNull(), // proxy_cookies | jwt
  cookiesJson: text("cookies_json"),
  jwtToken: text("jwt_token"),
  jwtExpiresAt: timestamp("jwt_expires_at"),
  isActive: boolean("is_active").default(true).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
