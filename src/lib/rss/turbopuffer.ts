import { Turbopuffer } from "@turbopuffer/turbopuffer";

const NAMESPACE = "media-monitor-articles";

export interface ArticleChunkVector {
  rssItemId: number;
  chunkSeq: number;
  vector: number[];
  title: string;
  author: string | null;
  publication: string;
  pubDate: string | null;
  category: string | null;
  articleUrl: string;
  chunkText: string;
  entitiesPeople: string[];
  entitiesOrganizations: string[];
  entitiesLocations: string[];
  entitiesTopics: string[];
}

export interface SearchOptions {
  query?: string;
  queryVector?: number[];
  mode: "hybrid" | "semantic" | "keyword";
  filters?: {
    publication?: string;
    dateFrom?: string;
    dateTo?: string;
    entityType?: string;
    entityValue?: string;
  };
  limit?: number;
}

export interface SearchResult {
  rssItemId: number;
  chunkSeq: number;
  title: string;
  author: string | null;
  publication: string;
  pubDate: string | null;
  category: string | null;
  articleUrl: string;
  chunkText: string;
  score: number;
  entitiesPeople: string[];
  entitiesOrganizations: string[];
  entitiesLocations: string[];
  entitiesTopics: string[];
}

function getClient(apiKey: string) {
  return new Turbopuffer({
    apiKey,
    baseURL: "https://gcp-northamerica-northeast2.turbopuffer.com",
  });
}

export async function upsertChunks(
  apiKey: string,
  chunks: ArticleChunkVector[],
): Promise<void> {
  const client = getClient(apiKey);
  const ns = client.namespace(NAMESPACE);

  await ns.write({
    distance_metric: "cosine_distance",
    upsert_columns: {
      id: chunks.map((c) => `rss-${c.rssItemId}-chunk-${c.chunkSeq}`),
      vector: chunks.map((c) => c.vector),
      title: chunks.map((c) => c.title),
      author: chunks.map((c) => c.author ?? ""),
      publication: chunks.map((c) => c.publication),
      pub_date: chunks.map((c) => c.pubDate ?? ""),
      category: chunks.map((c) => c.category ?? ""),
      article_url: chunks.map((c) => c.articleUrl),
      rss_item_id: chunks.map((c) => c.rssItemId),
      chunk_seq: chunks.map((c) => c.chunkSeq),
      chunk_text: chunks.map((c) => c.chunkText),
      entities_people: chunks.map((c) => c.entitiesPeople),
      entities_organizations: chunks.map((c) => c.entitiesOrganizations),
      entities_locations: chunks.map((c) => c.entitiesLocations),
      entities_topics: chunks.map((c) => c.entitiesTopics),
    },
    schema: {
      chunk_text: { type: "string", full_text_search: true },
    },
  });
}

export async function searchArticles(
  apiKey: string,
  options: SearchOptions,
): Promise<SearchResult[]> {
  const client = getClient(apiKey);
  const ns = client.namespace(NAMESPACE);

  const limit = options.limit || 20;

  // Build filters
  type FilterExpr = [string, string, unknown];
  const filterExprs: FilterExpr[] = [];
  if (options.filters?.publication) {
    filterExprs.push(["publication", "Eq", options.filters.publication]);
  }
  if (options.filters?.dateFrom) {
    filterExprs.push(["pub_date", "Gte", options.filters.dateFrom]);
  }
  if (options.filters?.dateTo) {
    filterExprs.push(["pub_date", "Lte", options.filters.dateTo]);
  }
  if (options.filters?.entityType && options.filters?.entityValue) {
    const attrKey = `entities_${options.filters.entityType.toLowerCase()}s`;
    filterExprs.push([attrKey, "ContainsAny", [options.filters.entityValue]]);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const queryParams: Record<string, any> = {
    top_k: limit * 3, // Fetch extra for dedup
    include_attributes: [
      "title", "author", "publication", "pub_date", "category",
      "article_url", "rss_item_id", "chunk_seq", "chunk_text",
      "entities_people", "entities_organizations", "entities_locations", "entities_topics",
    ],
  };

  if (filterExprs.length > 0) {
    queryParams.filters = filterExprs.length === 1
      ? filterExprs[0]
      : ["And", ...filterExprs];
  }

  if (options.mode === "semantic" && options.queryVector) {
    queryParams.rank_by = ["CosineSimilarity", "vector", options.queryVector];
  } else if (options.mode === "keyword" && options.query) {
    queryParams.rank_by = ["BM25", "chunk_text", options.query];
  } else if (options.mode === "hybrid" && options.queryVector && options.query) {
    queryParams.rank_by = [
      "Sum",
      ["CosineSimilarity", "vector", options.queryVector],
      ["*", 0.5, ["BM25", "chunk_text", options.query]],
    ];
  }

  const response = await ns.query(queryParams);

  const rows = response.rows || [];

  // Deduplicate by rss_item_id — keep best-scoring chunk per article
  const bestByArticle = new Map<number, SearchResult>();

  for (const row of rows) {
    const rssItemId = row.rss_item_id as number;
    const score = row.$dist ?? 0;

    if (!bestByArticle.has(rssItemId) || score > bestByArticle.get(rssItemId)!.score) {
      bestByArticle.set(rssItemId, {
        rssItemId,
        chunkSeq: row.chunk_seq as number,
        title: row.title as string,
        author: (row.author as string) || null,
        publication: row.publication as string,
        pubDate: (row.pub_date as string) || null,
        category: (row.category as string) || null,
        articleUrl: row.article_url as string,
        chunkText: row.chunk_text as string,
        score,
        entitiesPeople: (row.entities_people as string[]) || [],
        entitiesOrganizations: (row.entities_organizations as string[]) || [],
        entitiesLocations: (row.entities_locations as string[]) || [],
        entitiesTopics: (row.entities_topics as string[]) || [],
      });
    }
  }

  return Array.from(bestByArticle.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
