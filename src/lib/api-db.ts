import { getCloudflareContext } from "@opennextjs/cloudflare";
import { cache } from "react";

import { getDb } from "@/db";

export const getApiDb = cache(async () => {
  const { env } = await getCloudflareContext({ async: true });
  return getDb((env as unknown as Record<string, string>).DATABASE_URL);
});
