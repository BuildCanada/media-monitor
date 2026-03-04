import { getCloudflareContext } from "@opennextjs/cloudflare";

import type { Db } from "@/db";
import { getDb } from "@/db";

export interface JobEnv {
  db: Db;
  queue?: Queue;
  ai?: unknown;
  turbopufferApiKey?: string;
  glinerContainer?: unknown;
  images?: R2Bucket;
}

/**
 * Build a JobEnv from Cloudflare bindings (for use in API routes).
 * All env vars come from getCloudflareContext (wrangler bindings / .dev.vars).
 */
export async function getApiJobEnv(): Promise<JobEnv> {
  const { env } = await getCloudflareContext();
  const cfEnv = env as unknown as Record<string, unknown>;

  let glinerContainer: unknown;
  const glinerBinding = cfEnv.GLINER_CONTAINER as DurableObjectNamespace | undefined;
  if (glinerBinding) {
    glinerContainer = glinerBinding.get(glinerBinding.idFromName("gliner-singleton"));
  }

  return {
    db: getDb(cfEnv.DATABASE_URL as string),
    queue: cfEnv.TASK_QUEUE as Queue | undefined,
    ai: cfEnv.AI,
    turbopufferApiKey: cfEnv.TURBOPUFFER_API_KEY as string | undefined,
    glinerContainer,
    images: cfEnv.IMAGES as R2Bucket | undefined,
  };
}

export interface Job<T> {
  type: string;
  perform(env: JobEnv, payload: T): Promise<void>;
}

// Rails-style performLater: queue in production, fire-and-forget in development.
// Inline mode dispatches onto the event loop — returns immediately like a real queue.
export async function performLater<T>(
  env: JobEnv,
  job: Job<T>,
  payload: T,
): Promise<void> {
  if (process.env.NODE_ENV === "production" && env.queue) {
    await env.queue.send({ type: job.type, payload });
  } else {
    job.perform(env, payload).catch((error) => {
      console.error(`[jobs] ${job.type} failed:`, error instanceof Error ? error.message : error);
    });
  }
}

// Used by queue consumer to dispatch messages
export async function performFromMessage(
  env: JobEnv,
  message: { type: string; payload: unknown },
): Promise<void> {
  const job = registry[message.type];
  if (!job) throw new Error(`Unknown job type: ${message.type}`);
  await job.perform(env, message.payload);
}

// Convention-based registry — import all jobs
const registry: Record<string, Job<any>> = {};

export function register(job: Job<any>) {
  registry[job.type] = job;
}
