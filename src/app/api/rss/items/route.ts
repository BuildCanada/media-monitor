import { count, desc, eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

import { rssEntities, rssFeeds, rssItems } from "@/db/schema/private";
import { getApiDb } from "@/lib/api-db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const publication = searchParams.get("publication");
  const category = searchParams.get("category");
  const status = searchParams.get("status");

  const db = await getApiDb();

  const conditions = [];
  if (publication) {
    conditions.push(eq(rssFeeds.publicationName, publication));
  }
  if (category) {
    conditions.push(eq(rssFeeds.category, category));
  }
  if (status) {
    conditions.push(eq(rssItems.processingStatus, status));
  }

  const items = await db
    .select({
      id: rssItems.id,
      title: rssItems.title,
      author: rssItems.author,
      pubDate: rssItems.pubDate,
      processingStatus: rssItems.processingStatus,
      publicationName: rssFeeds.publicationName,
      category: rssFeeds.category,
      entityCount: sql<number>`(SELECT COUNT(*) FROM media_monitor_private.rss_entities WHERE rss_item_id = ${rssItems.id})`.as("entity_count"),
    })
    .from(rssItems)
    .innerJoin(rssFeeds, eq(rssItems.feedId, rssFeeds.id))
    .where(conditions.length > 0 ? sql`${sql.join(conditions, sql` AND `)}` : undefined)
    .orderBy(desc(rssItems.createdAt))
    .limit(100);

  return NextResponse.json(items);
}
