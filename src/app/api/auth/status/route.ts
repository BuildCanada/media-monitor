import { and, desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { authSessions } from "@/db/schema/private";
import { getApiDb } from "@/lib/api-db";

export async function GET() {
  const db = await getApiDb();

  const [jwtSession] = await db
    .select()
    .from(authSessions)
    .where(and(eq(authSessions.sessionType, "jwt"), eq(authSessions.isActive, true)))
    .orderBy(desc(authSessions.updatedAt))
    .limit(1);

  const [proxySession] = await db
    .select()
    .from(authSessions)
    .where(and(eq(authSessions.sessionType, "proxy_cookies"), eq(authSessions.isActive, true)))
    .orderBy(desc(authSessions.updatedAt))
    .limit(1);

  return NextResponse.json({
    jwt: jwtSession
      ? {
          hasToken: true,
          expiresAt: jwtSession.jwtExpiresAt,
          isExpired: jwtSession.jwtExpiresAt ? jwtSession.jwtExpiresAt < new Date() : false,
          updatedAt: jwtSession.updatedAt,
        }
      : { hasToken: false },
    proxyCookies: proxySession
      ? {
          hasCookies: true,
          updatedAt: proxySession.updatedAt,
          notes: proxySession.notes,
        }
      : { hasCookies: false },
  });
}
