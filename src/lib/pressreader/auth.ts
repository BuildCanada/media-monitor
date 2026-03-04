import { and, desc, eq } from "drizzle-orm";

import type { Db } from "@/db";
import { authSessions } from "@/db/schema/private";

const PROXY_BASE_URL = "https://www-pressreader-com.edpl.idm.oclc.org";

export async function getValidToken(db: Db): Promise<string | null> {
  // Check for an active JWT that hasn't expired
  const [session] = await db
    .select()
    .from(authSessions)
    .where(and(eq(authSessions.sessionType, "jwt"), eq(authSessions.isActive, true)))
    .orderBy(desc(authSessions.updatedAt))
    .limit(1);

  if (session?.jwtToken) {
    if (!session.jwtExpiresAt || session.jwtExpiresAt > new Date()) {
      return session.jwtToken;
    }
  }

  // Try refreshing via proxy cookies
  const [proxySession] = await db
    .select()
    .from(authSessions)
    .where(and(eq(authSessions.sessionType, "proxy_cookies"), eq(authSessions.isActive, true)))
    .orderBy(desc(authSessions.updatedAt))
    .limit(1);

  if (proxySession?.cookiesJson) {
    const token = await refreshTokenFromProxy(db, proxySession.cookiesJson);
    if (token) return token;
  }

  return null;
}

async function refreshTokenFromProxy(db: Db, cookiesJson: string): Promise<string | null> {
  try {
    const cookies = JSON.parse(cookiesJson) as Record<string, string>;
    const cookieHeader = Object.entries(cookies)
      .map(([k, v]) => `${k}=${v}`)
      .join("; ");

    const response = await fetch(PROXY_BASE_URL, {
      headers: { Cookie: cookieHeader },
      redirect: "follow",
    });

    if (!response.ok) return null;

    const html = await response.text();
    const token = extractTokenFromHtml(html);
    if (!token) return null;

    // Store the new JWT
    await storeJwtToken(db, token);
    return token;
  } catch {
    return null;
  }
}

export function extractTokenFromHtml(html: string): string | null {
  // PressReader embeds the token in JS on the page
  // Look for patterns like: "accessToken":"eyJ..."  or  token = "eyJ..."
  const patterns = [
    /"accessToken"\s*:\s*"(eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)"/,
    /bearer\s+(eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)/i,
    /"token"\s*:\s*"(eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)"/,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return match[1];
  }

  return null;
}

export async function storeJwtToken(db: Db, token: string, expiresAt?: Date): Promise<void> {
  // Deactivate existing JWT sessions
  await db
    .update(authSessions)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(authSessions.sessionType, "jwt"));

  // Insert new active JWT
  await db.insert(authSessions).values({
    sessionType: "jwt",
    jwtToken: token,
    jwtExpiresAt: expiresAt ?? new Date(Date.now() + 2 * 60 * 60 * 1000), // default 2h
    isActive: true,
  });
}

export async function storeProxyCookies(
  db: Db,
  cookies: Record<string, string>,
  notes?: string,
): Promise<void> {
  // Deactivate existing proxy sessions
  await db
    .update(authSessions)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(authSessions.sessionType, "proxy_cookies"));

  await db.insert(authSessions).values({
    sessionType: "proxy_cookies",
    cookiesJson: JSON.stringify(cookies),
    isActive: true,
    notes,
  });
}
