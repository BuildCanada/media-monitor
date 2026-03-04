import { NextResponse } from "next/server";

import { getApiDb } from "@/lib/api-db";
import { seedFeeds } from "@/lib/rss";

export async function POST() {
  const db = await getApiDb();
  const result = await seedFeeds(db);
  return NextResponse.json(result);
}
