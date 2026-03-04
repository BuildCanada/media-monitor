import { eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

import { issues, publications } from "@/db/schema/media-monitor";
import { getApiDb } from "@/lib/api-db";

export async function GET() {
  const db = await getApiDb();

  const results = await db
    .select({
      id: publications.id,
      cid: publications.cid,
      type: publications.type,
      name: publications.name,
      displayName: publications.displayName,
      language: publications.language,
      schedule: publications.schedule,
      enabled: publications.enabled,
      rank: publications.rank,
      countries: publications.countries,
      latestIssueDate: sql<string>`MAX(${issues.issueDate})`,
      issueCount: sql<number>`COUNT(${issues.id})`,
    })
    .from(publications)
    .leftJoin(issues, eq(publications.id, issues.publicationId))
    .groupBy(publications.id)
    .orderBy(publications.name);

  return NextResponse.json(results);
}
