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
