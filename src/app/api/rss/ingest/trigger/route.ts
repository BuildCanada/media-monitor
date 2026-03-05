import { NextResponse } from "next/server";

import { getApiJobEnv } from "@/jobs";
import { runRssIngest } from "@/lib/rss";

export async function POST() {
  const jobEnv = await getApiJobEnv();
  const result = await runRssIngest(jobEnv.db, jobEnv);
  if (!result) {
    return NextResponse.json({ skipped: true, reason: "no enabled feeds" });
  }
  return NextResponse.json(result);
}
