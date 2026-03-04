import { desc } from "drizzle-orm";
import { NextResponse } from "next/server";

import { scrapeJobs } from "@/db/schema/private";
import { getApiDb } from "@/lib/api-db";

export async function GET() {
  const db = await getApiDb();

  const jobs = await db
    .select()
    .from(scrapeJobs)
    .orderBy(desc(scrapeJobs.createdAt))
    .limit(50);

  return NextResponse.json(jobs);
}
