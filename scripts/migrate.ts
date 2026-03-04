// Programmatic Drizzle migration runner that intercepts CREATE SCHEMA queries.
// Drizzle always runs CREATE SCHEMA IF NOT EXISTS for its tracking schema,
// which fails when the DB user lacks CREATE permission on the database.
// This wrapper silently no-ops those queries since the schemas already exist.

import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

  const originalQuery = pool.query.bind(pool);
  // @ts-expect-error — patching overloaded method signature
  pool.query = function (...args: unknown[]) {
    const sql = typeof args[0] === "string" ? args[0] : (args[0] as any)?.text;
    if (typeof sql === "string" && /^CREATE SCHEMA/i.test(sql)) {
      console.log("[migrate] Skipping:", sql.trim());
      return Promise.resolve({ rows: [], rowCount: 0 });
    }
    return (originalQuery as Function).apply(null, args);
  };

  const db = drizzle(pool);

  await migrate(db, {
    migrationsFolder: "./drizzle",
    migrationsSchema: "media_monitor_private",
  });

  await pool.end();
  console.log("[migrate] Done");
}

main().catch((err) => {
  console.error("[migrate] Failed:", err);
  process.exit(1);
});
