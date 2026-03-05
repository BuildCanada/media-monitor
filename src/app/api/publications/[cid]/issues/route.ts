import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { issues, publications } from "@/db/schema/media-monitor";
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
    })
    .from(issues)
    .where(eq(issues.publicationId, pub.id))
    .orderBy(desc(issues.issueDate));

  return NextResponse.json(results);
}
