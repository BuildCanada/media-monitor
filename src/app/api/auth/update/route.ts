import { NextResponse } from "next/server";

import { getApiDb } from "@/lib/api-db";
import { storeJwtToken, storeProxyCookies } from "@/lib/pressreader";

export async function POST(request: Request) {
  const body = await request.json();
  const { type, token, cookies, expiresAt, notes } = body as {
    type: "jwt" | "proxy_cookies";
    token?: string;
    cookies?: Record<string, string>;
    expiresAt?: string;
    notes?: string;
  };

  const db = await getApiDb();

  if (type === "jwt") {
    if (!token) {
      return NextResponse.json({ error: "JWT token is required" }, { status: 400 });
    }
    await storeJwtToken(db, token, expiresAt ? new Date(expiresAt) : undefined);
    return NextResponse.json({ ok: true, type: "jwt" });
  }

  if (type === "proxy_cookies") {
    if (!cookies || typeof cookies !== "object") {
      return NextResponse.json({ error: "Cookies object is required" }, { status: 400 });
    }
    await storeProxyCookies(db, cookies, notes);
    return NextResponse.json({ ok: true, type: "proxy_cookies" });
  }

  return NextResponse.json({ error: "Invalid type. Use 'jwt' or 'proxy_cookies'" }, { status: 400 });
}
