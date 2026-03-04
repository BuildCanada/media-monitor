import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ key: string[] }> },
) {
  const { key } = await params;
  const r2Key = key.join("/");

  const { env } = await getCloudflareContext();
  const r2 = (env as unknown as Record<string, R2Bucket>).IMAGES;

  if (!r2) {
    return NextResponse.json({ error: "R2 not configured" }, { status: 500 });
  }

  const object = await r2.get(r2Key);
  if (!object) {
    return NextResponse.json({ error: "Image not found" }, { status: 404 });
  }

  const headers = new Headers();
  headers.set("Content-Type", object.httpMetadata?.contentType ?? "image/jpeg");
  headers.set("Cache-Control", "public, max-age=86400");

  return new NextResponse(object.body as ReadableStream, { headers });
}
