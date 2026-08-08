import { XMLParser } from "fast-xml-parser";

export interface RssFeedItem {
  guid: string;
  link: string;
  title: string;
  author: string | null;
  pubDate: Date | null;
  description: string | null;
  categories: string[];
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  isArray: (name) => name === "item" || name === "category",
});

// Bounds for the wait a publisher asks for with a Retry-After header. We never
// wait less than the minimum (avoid hammering) or more than the maximum (avoid
// silencing a feed for too long), and we fall back to the default when the
// header is absent or unparseable.
const MIN_RETRY_AFTER_MS = 60_000; // 1 minute
const MAX_RETRY_AFTER_MS = 3_600_000; // 1 hour
const DEFAULT_RETRY_AFTER_MS = 900_000; // 15 minutes

// Raised when a publisher rate limits us (HTTP 429). Carries the wait the
// publisher asked for so the caller can honour it instead of a fixed schedule.
export class FeedRateLimitError extends Error {
  readonly retryAfterMs: number;

  constructor(feedUrl: string, retryAfterMs: number) {
    super(
      `Rate limited fetching feed ${feedUrl}: retry after ${Math.round(retryAfterMs / 1000)}s`,
    );
    this.name = "FeedRateLimitError";
    this.retryAfterMs = retryAfterMs;
  }
}

// Parse an HTTP Retry-After header into a clamped wait in milliseconds. The
// header is either a delta in seconds or an HTTP date.
export function parseRetryAfter(headerValue: string | null): number {
  let ms = DEFAULT_RETRY_AFTER_MS;

  if (headerValue) {
    const seconds = Number(headerValue);
    if (Number.isFinite(seconds)) {
      ms = seconds * 1000;
    } else {
      const date = new Date(headerValue);
      if (!isNaN(date.getTime())) ms = date.getTime() - Date.now();
    }
  }

  return Math.min(Math.max(ms, MIN_RETRY_AFTER_MS), MAX_RETRY_AFTER_MS);
}

function extractString(val: unknown): string | null {
  if (!val) return null;
  if (typeof val === "string") return val;
  if (typeof val === "object") {
    const obj = val as Record<string, unknown>;
    // fast-xml-parser may parse <dc:creator> as { "#text": "Name" }
    if ("#text" in obj) return String(obj["#text"]);
    // Or as { __cdata: "Name" }
    if ("__cdata" in obj) return String(obj["__cdata"]);
  }
  return null;
}

export async function fetchFeed(feedUrl: string): Promise<RssFeedItem[]> {
  const response = await fetch(feedUrl, {
    headers: { "User-Agent": "MediaMonitor/1.0" },
    signal: AbortSignal.timeout(10_000),
  });

  if (response.status === 429) {
    throw new FeedRateLimitError(
      feedUrl,
      parseRetryAfter(response.headers.get("retry-after")),
    );
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch feed ${feedUrl}: ${response.status}`);
  }

  const xml = await response.text();
  const parsed = parser.parse(xml);

  const channel = parsed?.rss?.channel;
  if (!channel) {
    throw new Error(`Invalid RSS feed structure from ${feedUrl}`);
  }

  const items: unknown[] = channel.item || [];

  return items.map((item: unknown) => {
    const entry = item as Record<string, unknown>;
    const categories = (entry.category as string[] | undefined) || [];

    let pubDate: Date | null = null;
    if (entry.pubDate) {
      const d = new Date(entry.pubDate as string);
      if (!isNaN(d.getTime())) pubDate = d;
    }

    const guidVal = entry.guid;
    const guidStr = typeof guidVal === "object" && guidVal !== null
      ? String((guidVal as Record<string, unknown>)["#text"] ?? "")
      : String(guidVal ?? entry.link ?? "");

    return {
      guid: guidStr,
      link: String(entry.link ?? ""),
      title: String(entry.title ?? ""),
      author: extractString(entry["dc:creator"]) || extractString(entry.author) || null,
      pubDate,
      description: entry.description ? String(entry.description) : null,
      categories: categories.map(String),
    };
  });
}
