import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { rssIngestJobs } from "@/db/schema/private";
import { getApiDb } from "@/lib/api-db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const { jobId } = await params;
  const db = await getApiDb();

  const [job] = await db
    .select()
    .from(rssIngestJobs)
    .where(eq(rssIngestJobs.id, Number(jobId)))
    .limit(1);

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  return NextResponse.json(job);
}
