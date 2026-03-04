import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: ["./src/db/schema/media-monitor/*.ts", "./src/db/schema/private/*.ts"],
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  migrations: {
    schema: "media_monitor_private",
  },
});
