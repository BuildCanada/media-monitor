import { getCloudflareContext } from "@opennextjs/cloudflare";

import { getDb } from "@/db";

export async function getApiDb() {
  const { env } = await getCloudflareContext();
  return getDb((env as unknown as Record<string, string>).DATABASE_URL);
}
