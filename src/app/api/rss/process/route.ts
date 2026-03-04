import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { rssItems } from "@/db/schema/private";
import { getApiJobEnv, performLater } from "@/jobs";
import { RssProcessJob } from "@/jobs/rss-process.job";

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") || "0", 10) || 1000;

  const jobEnv = await getApiJobEnv();

  const pending = await jobEnv.db
    .select({ id: rssItems.id })
    .from(rssItems)
    .where(eq(rssItems.processingStatus, "pending"))
    .orderBy(rssItems.id)
    .limit(limit);

  if (pending.length === 0) {
    return NextResponse.json({ processed: 0, message: "No pending items" });
  }

  let processed = 0;
  for (const item of pending) {
    await performLater(jobEnv, RssProcessJob, { rssItemId: item.id, jobId: 0 });
    processed++;
  }

  return NextResponse.json({ processed, total: pending.length });
}
