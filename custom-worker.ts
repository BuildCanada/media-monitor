// @ts-nocheck — This file is built by wrangler, not Next.js
import handler from "./.open-next/worker.js";

export default {
  fetch: handler.fetch,
  async queue(_batch: MessageBatch, _env: CloudflareEnv, _ctx: ExecutionContext) {
    // No-op — actual queue consumer runs in media-monitor-worker.
    // This handler exists because Cloudflare requires one when a queue binding is present.
  },
} satisfies ExportedHandler<CloudflareEnv>;
