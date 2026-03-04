import { NextResponse } from "next/server";

import { getApiDb } from "@/lib/api-db";
import { getValidToken, PressReaderClient, RateLimiter } from "@/lib/pressreader";
import { syncCatalog } from "@/lib/scraper";

export async function POST() {
  const db = await getApiDb();

  const token = await getValidToken(db);
  if (!token) {
    return NextResponse.json({ error: "No valid auth token. Update in Settings." }, { status: 401 });
  }

  const client = new PressReaderClient(token, new RateLimiter());
  await syncCatalog(db, client);

  return NextResponse.json({ ok: true });
}
