import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";

import * as mediaMonitorSchema from "./schema/media-monitor";
import * as privateSchema from "./schema/private";

const schema = { ...mediaMonitorSchema, ...privateSchema };

let pool: pg.Pool | null = null;

export function getDb(databaseUrl?: string) {
  const url = databaseUrl || process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is required");
  }

  if (!pool) {
    pool = new pg.Pool({ connectionString: url, max: 5 });
  }

  return drizzle(pool, { schema });
}

export type Db = ReturnType<typeof getDb>;
