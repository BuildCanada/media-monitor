// Standalone Cloudflare Worker for queue consumers and cron triggers.
// Runs independently from the Next.js app — no OpenNext dependency.
// No HTTP endpoints — queue-only architecture.
// Local dev: `npm run worker:dev`
// Deploy:    `npm run worker:deploy`

import { getDb } from "../src/db";
import type { JobEnv } from "../src/jobs";
import { performFromMessage } from "../src/jobs";
import { retryFailedItems, runRssIngest } from "../src/lib/rss";

interface Env {
  DATABASE_URL: string;
  TURBOPUFFER_API_KEY: string;
  TURBOPUFFER_NAMESPACE: string;
  TASK_QUEUE: Queue;
  PUBLIC_BUCKET: R2Bucket;
  AI: Ai;
  GLINER_CONTAINER?: DurableObjectNamespace;
}

function buildJobEnv(env: Env): JobEnv {
  const db = getDb(env.DATABASE_URL);
  let glinerContainer: any = null;
  if (env.GLINER_CONTAINER) {
    glinerContainer = env.GLINER_CONTAINER.get(
      env.GLINER_CONTAINER.idFromName("gliner-singleton"),
    );
  }

  return {
    db,
    queue: env.TASK_QUEUE,
    ai: env.AI,
    turbopufferApiKey: env.TURBOPUFFER_API_KEY,
    turbopufferNamespace: env.TURBOPUFFER_NAMESPACE,
    glinerContainer,
    images: env.PUBLIC_BUCKET,
  };
}

export default {
  async queue(
    batch: MessageBatch,
    env: Env,
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
    env: Env,
    ctx: ExecutionContext,
  ): Promise<void> {
    const jobEnv = buildJobEnv(env);

    switch (controller.cron) {
      case "*/5 * * * *": {
        // RSS ingest every 5 minutes
        console.log("[cron] RSS ingest:", new Date(controller.scheduledTime).toISOString());
        await runRssIngest(jobEnv.db, jobEnv);
        break;
      }
      case "0 * * * *": {
        // Retry failed extractions every hour
        console.log("[cron] Retry failed items:", new Date(controller.scheduledTime).toISOString());
        await retryFailedItems(jobEnv.db, jobEnv);
        break;
      }
      default:
        console.log("[cron] Unknown cron pattern:", controller.cron);
    }
  },
} satisfies ExportedHandler<Env>;
