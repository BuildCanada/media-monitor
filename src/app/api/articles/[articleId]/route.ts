import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { articleAuthors, articleImages, articleTags, articles } from "@/db/schema/media-monitor";
import { getApiDb } from "@/lib/api-db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ articleId: string }> },
) {
  const { articleId } = await params;
  const db = await getApiDb();
  const id = parseInt(articleId, 10);

  const [article] = await db.select().from(articles).where(eq(articles.id, id)).limit(1);
  if (!article) {
    return NextResponse.json({ error: "Article not found" }, { status: 404 });
  }

  const authors = await db
    .select()
    .from(articleAuthors)
    .where(eq(articleAuthors.articleId, id))
    .orderBy(articleAuthors.sortOrder);

  const tags = await db
    .select()
    .from(articleTags)
    .where(eq(articleTags.articleId, id));

  const images = await db
    .select()
    .from(articleImages)
    .where(eq(articleImages.articleId, id))
    .orderBy(articleImages.sortOrder);

  return NextResponse.json({ ...article, authors, tags, images });
}
