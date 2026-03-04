import { count, desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { rssFeeds, rssItems } from "@/db/schema/private";
import { getApiDb } from "@/lib/api-db";

export async function GET() {
  const db = await getApiDb();

  const feeds = await db
    .select({
      id: rssFeeds.id,
      publicationName: rssFeeds.publicationName,
      feedUrl: rssFeeds.feedUrl,
      category: rssFeeds.category,
      enabled: rssFeeds.enabled,
      lastFetchedAt: rssFeeds.lastFetchedAt,
      lastFetchError: rssFeeds.lastFetchError,
      createdAt: rssFeeds.createdAt,
      updatedAt: rssFeeds.updatedAt,
      itemCount: count(rssItems.id),
    })
    .from(rssFeeds)
    .leftJoin(rssItems, eq(rssItems.feedId, rssFeeds.id))
    .groupBy(rssFeeds.id)
    .orderBy(desc(rssFeeds.publicationName));

  return NextResponse.json(feeds);
}

export async function POST(request: Request) {
  const db = await getApiDb();
  const body = await request.json();

  const { publicationName, feedUrl, category } = body as {
    publicationName: string;
    feedUrl: string;
    category?: string;
  };

  if (!publicationName || !feedUrl) {
    return NextResponse.json(
      { error: "publicationName and feedUrl are required" },
      { status: 400 },
    );
  }

  const [feed] = await db
    .insert(rssFeeds)
    .values({ publicationName, feedUrl, category: category || null })
    .returning();

  return NextResponse.json(feed, { status: 201 });
}
