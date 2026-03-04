import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { publications } from "@/db/schema/media-monitor";
import { getApiDb } from "@/lib/api-db";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ cid: string }> },
) {
  const { cid } = await params;
  const body = (await request.json()) as { enabled?: boolean };
  const db = await getApiDb();

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (typeof body.enabled === "boolean") {
    updates.enabled = body.enabled;
  }

  const [updated] = await db
    .update(publications)
    .set(updates)
    .where(eq(publications.cid, cid))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Publication not found" }, { status: 404 });
  }

  return NextResponse.json(updated);
}
