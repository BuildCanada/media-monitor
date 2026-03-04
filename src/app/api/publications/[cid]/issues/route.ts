import { desc, eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

import { articles, issues, publications } from "@/db/schema/media-monitor";
import { scrapeTasks } from "@/db/schema/private";
import { getApiDb } from "@/lib/api-db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ cid: string }> },
) {
  const { cid } = await params;
  const db = await getApiDb();

  const [pub] = await db
    .select({ id: publications.id })
    .from(publications)
    .where(eq(publications.cid, cid))
    .limit(1);

  if (!pub) {
    return NextResponse.json({ error: "Publication not found" }, { status: 404 });
  }

  const results = await db
    .select({
      id: issues.id,
      issueKey: issues.issueKey,
      issueDate: issues.issueDate,
      pageCount: issues.pageCount,
      articleCount: issues.articleCount,
      scrapeStatus: sql<string>`COALESCE(${scrapeTasks.status}, 'none')`,
    })
    .from(issues)
    .leftJoin(
      scrapeTasks,
      sql`${scrapeTasks.publicationCid} = ${cid} AND ${scrapeTasks.issueDate} = ${issues.issueDate}`,
    )
    .where(eq(issues.publicationId, pub.id))
    .orderBy(desc(issues.issueDate));

  return NextResponse.json(results);
}
