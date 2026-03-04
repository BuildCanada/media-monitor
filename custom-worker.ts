// @ts-nocheck — This file is built by wrangler, not Next.js
import handler from "./.open-next/worker.js";
import { getDb } from "./src/db";
import type { JobEnv } from "./src/jobs";
import { performFromMessage } from "./src/jobs";
import { getValidToken, PressReaderClient, RateLimiter } from "./src/lib/pressreader";
import { runDailyScrape } from "./src/lib/scraper";
import { runRssIngest } from "./src/lib/rss";

function buildJobEnv(env: CloudflareEnv): JobEnv {
  const db = getDb((env as unknown as Record<string, string>).DATABASE_URL);
  const queue = (env as unknown as Record<string, Queue>).TASK_QUEUE;
  const ai = (env as unknown as Record<string, unknown>).AI;
  const turbopufferApiKey = (env as unknown as Record<string, string>).TURBOPUFFER_API_KEY;
  const images = (env as unknown as Record<string, R2Bucket>).PUBLIC_BUCKET;

  let glinerContainer: any = null;
  const glinerBinding = (env as unknown as Record<string, DurableObjectNamespace | undefined>).GLINER_CONTAINER;
  if (glinerBinding) {
    glinerContainer = glinerBinding.get(glinerBinding.idFromName("gliner-singleton"));
  }

  return { db, queue, ai, turbopufferApiKey, glinerContainer, images };
}

export default {
  fetch: handler.fetch,

  async queue(
    batch: MessageBatch,
    env: CloudflareEnv,
    ctx: ExecutionContext,
  ): Promise<void> {
    const jobEnv = buildJobEnv(env);

    for (const message of batch.messages) {
      try {
        await performFromMessage(jobEnv, message.body as { type: string; payload: unknown });
        message.ack();
      } catch (error) {
        console.error(`[queue] Task ${message.id} failed:`, error);
        message.retry();
      }
    }
  },

  async scheduled(
    controller: ScheduledController,
    env: CloudflareEnv,
    ctx: ExecutionContext,
  ): Promise<void> {
    switch (controller.cron) {
      case "0 6 * * *": {
        console.log("[cron] Starting daily jobs:", new Date(controller.scheduledTime).toISOString());

        const jobEnv = buildJobEnv(env);

        // PressReader scrape
        const token = await getValidToken(jobEnv.db);
        if (token) {
          const client = new PressReaderClient(token, new RateLimiter());
          await runDailyScrape(jobEnv.db, client, jobEnv);
        } else {
          console.error("[cron] No valid auth token. Skipping PressReader scrape.");
        }

        // RSS ingest
        await runRssIngest(jobEnv.db, jobEnv);

        break;
      }
      default:
        console.log("[cron] Unknown cron pattern:", controller.cron);
    }
  },
} satisfies ExportedHandler<CloudflareEnv>;
