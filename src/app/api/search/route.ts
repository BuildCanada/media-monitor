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
  const turbopufferApiKey = (env as unknown as Record<string, string>).TURBOPUFFER_API_KEY;

  // Embed query for vector search modes
  let queryVector: number[] | undefined;
  if (mode === "hybrid" || mode === "semantic") {
    const result = await ai.run("@cf/baai/bge-base-en-v1.5", { text: [query] });
    queryVector = result.data[0].values;
  }

  const results = await searchArticles(turbopufferApiKey, {
    query,
    queryVector,
    mode,
    filters,
    limit,
  });

  return NextResponse.json({ results, query, mode });
}
