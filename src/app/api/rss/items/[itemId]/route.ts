import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { rssEntities, rssFeeds, rssItems } from "@/db/schema/private";
import { getApiDb } from "@/lib/api-db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ itemId: string }> },
) {
  const { itemId } = await params;
  const db = await getApiDb();

  const [item] = await db
    .select({
      id: rssItems.id,
      title: rssItems.title,
      author: rssItems.author,
      link: rssItems.link,
      pubDate: rssItems.pubDate,
      description: rssItems.description,
      processingStatus: rssItems.processingStatus,
      processingError: rssItems.processingError,
      processedAt: rssItems.processedAt,
      contentMarkdown: rssItems.contentMarkdown,
      defuddleTitle: rssItems.defuddleTitle,
      defuddleAuthor: rssItems.defuddleAuthor,
      defuddleDescription: rssItems.defuddleDescription,
      defuddleDomain: rssItems.defuddleDomain,
      defuddlePublished: rssItems.defuddlePublished,
      defuddleWordCount: rssItems.defuddleWordCount,
      publicationName: rssFeeds.publicationName,
      category: rssFeeds.category,
    })
    .from(rssItems)
    .innerJoin(rssFeeds, eq(rssItems.feedId, rssFeeds.id))
    .where(eq(rssItems.id, Number(itemId)))
    .limit(1);

  if (!item) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  const entities = await db
    .select({
      entityType: rssEntities.entityType,
      entityValue: rssEntities.entityValue,
      confidence: rssEntities.confidence,
    })
    .from(rssEntities)
    .where(eq(rssEntities.rssItemId, Number(itemId)));

  return NextResponse.json({ ...item, entities });
}
