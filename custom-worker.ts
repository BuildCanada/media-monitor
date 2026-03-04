// @ts-nocheck — This file is built by wrangler, not Next.js
import handler from "./.open-next/worker.js";

export default {
  fetch: handler.fetch,
} satisfies ExportedHandler<CloudflareEnv>;
