import { NextResponse } from "next/server";

import { getApiJobEnv } from "@/jobs";
import { getValidToken, PressReaderClient, RateLimiter } from "@/lib/pressreader";
import { runBackfillScrape, runDailyScrape } from "@/lib/scraper";

export async function POST(request: Request) {
  const body = await request.json();
  const { type = "daily", cid, from, to } = body as {
    type?: string;
    cid?: string;
    from?: string;
    to?: string;
  };

  const jobEnv = await getApiJobEnv();

  const token = await getValidToken(jobEnv.db);
  if (!token) {
    return NextResponse.json(
      { error: "No valid auth token. Update in Settings." },
      { status: 401 },
    );
  }

  const client = new PressReaderClient(token, new RateLimiter());

  if (type === "backfill") {
    if (!cid || !from || !to) {
      return NextResponse.json(
        { error: "Backfill requires cid, from, and to dates" },
        { status: 400 },
      );
    }
    const jobId = await runBackfillScrape(jobEnv.db, client, jobEnv, cid, from, to);
    return NextResponse.json({ jobId });
  }

  await runDailyScrape(jobEnv.db, client, jobEnv);
  return NextResponse.json({ ok: true });
}
