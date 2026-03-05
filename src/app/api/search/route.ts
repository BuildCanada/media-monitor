import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextResponse } from "next/server";

import { searchArticles } from "@/lib/rss";

export async function POST(request: Request) {
  const body = await request.json();

  const {
    query,
    mode = "hybrid",
    filters,
    limit = 20,
  } = body as {
    query: string;
    mode?: "hybrid" | "semantic" | "keyword";
    filters?: {
      publication?: string;
      dateFrom?: string;
      dateTo?: string;
      entityType?: string;
      entityValue?: string;
    };
    limit?: number;
  };

  if (!query) {
    return NextResponse.json({ error: "query is required" }, { status: 400 });
  }

  const { env } = await getCloudflareContext();
  const ai = (env as unknown as Record<string, unknown>).AI as {
    run: (model: string, input: { text: string[] }) => Promise<{ data: Array<{ values: number[] }> }>;
  };
  const cfEnv = env as unknown as Record<string, string>;
  const turbopufferApiKey = cfEnv.TURBOPUFFER_API_KEY;
  const turbopufferNamespace = cfEnv.TURBOPUFFER_NAMESPACE;

  // Embed query for vector search modes
  let queryVector: number[] | undefined;
  if (mode === "hybrid" || mode === "semantic") {
    const result = await ai.run("@cf/baai/bge-base-en-v1.5", { text: [query] });
    const raw = result.data[0];
    queryVector = Array.isArray(raw) ? raw : Array.from(raw.values);
  }

  const results = await searchArticles(turbopufferApiKey, turbopufferNamespace, {
    query,
    queryVector,
    mode,
    filters,
    limit,
  });

  return NextResponse.json({ results, query, mode });
}
