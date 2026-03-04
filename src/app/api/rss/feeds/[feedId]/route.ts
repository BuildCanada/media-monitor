import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { rssFeeds } from "@/db/schema/private";
import { getApiDb } from "@/lib/api-db";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ feedId: string }> },
) {
  const { feedId } = await params;
  const db = await getApiDb();
  const body = (await request.json()) as Record<string, unknown>;

  const updates: Record<string, unknown> = {};
  if (typeof body.enabled === "boolean") updates.enabled = body.enabled;
  if (typeof body.publicationName === "string") updates.publicationName = body.publicationName;
  if (typeof body.feedUrl === "string") updates.feedUrl = body.feedUrl;
  if (typeof body.category === "string") updates.category = body.category;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  updates.updatedAt = new Date();

  const [updated] = await db
    .update(rssFeeds)
    .set(updates)
    .where(eq(rssFeeds.id, Number(feedId)))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Feed not found" }, { status: 404 });
  }

  return NextResponse.json(updated);
}
