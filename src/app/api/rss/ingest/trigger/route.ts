import { NextResponse } from "next/server";

import { getApiJobEnv } from "@/jobs";
import { runRssIngest } from "@/lib/rss";

export async function POST() {
  const jobEnv = await getApiJobEnv();
  const result = await runRssIngest(jobEnv.db, jobEnv);
  return NextResponse.json(result);
}
