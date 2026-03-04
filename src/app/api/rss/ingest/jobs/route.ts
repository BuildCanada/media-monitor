import { desc } from "drizzle-orm";
import { NextResponse } from "next/server";

import { rssIngestJobs } from "@/db/schema/private";
import { getApiDb } from "@/lib/api-db";

export async function GET() {
  const db = await getApiDb();

  const jobs = await db
    .select()
    .from(rssIngestJobs)
    .orderBy(desc(rssIngestJobs.createdAt))
    .limit(50);

  return NextResponse.json(jobs);
}
