import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as mediaMonitorSchema from "./schema/media-monitor";
import * as privateSchema from "./schema/private";

const schema = { ...mediaMonitorSchema, ...privateSchema };

export function getDb(connectionString: string) {
  const pool = new Pool({ connectionString, maxUses: 1 });
  return drizzle({ client: pool, schema });
}

export type Db = ReturnType<typeof getDb>;
