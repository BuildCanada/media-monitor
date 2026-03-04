// Programmatic Drizzle migration runner that intercepts CREATE SCHEMA queries.
// Drizzle always runs CREATE SCHEMA IF NOT EXISTS for its tracking schema,
// which fails when the DB user lacks CREATE permission on the database.
// This wrapper silently no-ops those queries since the schemas already exist.

import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

// Intercept CREATE SCHEMA queries — they fail on locked-down Postgres users
const originalQuery = pool.query.bind(pool);
pool.query = function (...args: any[]) {
  const sql = typeof args[0] === "string" ? args[0] : args[0]?.text;
  if (typeof sql === "string" && /^CREATE SCHEMA/i.test(sql)) {
    console.log("[migrate] Skipping:", sql);
    return Promise.resolve({ rows: [], rowCount: 0 });
  }
  return originalQuery(...args);
} as typeof pool.query;

const db = drizzle(pool);

await migrate(db, {
  migrationsFolder: "./drizzle",
  migrationsSchema: "media_monitor_private",
});

await pool.end();
console.log("[migrate] Done");
