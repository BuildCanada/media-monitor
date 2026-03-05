import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";

import { rssItems } from "@/db/schema/private";
import { getApiJobEnv, performLater } from "@/jobs";
import { RssProcessJob } from "@/jobs/rss-process.job";

export async function POST() {
  const jobEnv = await getApiJobEnv();

  // Reset all completed/failed items back to pending
  const reset = await jobEnv.db
    .update(rssItems)
    .set({
      processingStatus: "pending",
      processingError: null,
      processedAt: null,
    })
    .where(sql`${rssItems.processingStatus} IN ('completed', 'failed')`)
    .returning({ id: rssItems.id });

  // Queue each for reprocessing
  for (const item of reset) {
    await performLater(jobEnv, RssProcessJob, { rssItemId: item.id, jobId: 0 });
  }

  return NextResponse.json({ queued: reset.length });
}
