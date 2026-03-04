import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { articles, issues } from "@/db/schema/media-monitor";
import { getApiDb } from "@/lib/api-db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ issueKey: string }> },
) {
  const { issueKey } = await params;
  const db = await getApiDb();

  const [issue] = await db
    .select({ id: issues.id })
    .from(issues)
    .where(eq(issues.issueKey, issueKey))
    .limit(1);

  if (!issue) {
    return NextResponse.json({ error: "Issue not found" }, { status: 404 });
  }

  const results = await db
    .select({
      id: articles.id,
      pressreaderId: articles.pressreaderId,
      title: articles.title,
      subtitle: articles.subtitle,
      byline: articles.byline,
      sectionName: articles.sectionName,
      page: articles.page,
      pageName: articles.pageName,
      language: articles.language,
      articleType: articles.articleType,
      textLength: articles.textLength,
    })
    .from(articles)
    .where(eq(articles.issueId, issue.id))
    .orderBy(articles.page, articles.id);

  return NextResponse.json(results);
}
