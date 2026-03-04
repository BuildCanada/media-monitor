import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { scrapeTasks } from "@/db/schema/private";
import { getApiDb } from "@/lib/api-db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const { jobId } = await params;
  const db = await getApiDb();

  const tasks = await db
    .select()
    .from(scrapeTasks)
    .where(eq(scrapeTasks.jobId, parseInt(jobId, 10)))
    .orderBy(scrapeTasks.issueDate);

  return NextResponse.json(tasks);
}
