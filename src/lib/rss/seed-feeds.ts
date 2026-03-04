import { eq } from "drizzle-orm";

import type { Db } from "@/db";
import { rssFeeds } from "@/db/schema/private";

interface FeedSeed {
  publicationName: string;
  feedUrl: string;
  category: string | null;
}

const SEED_FEEDS: FeedSeed[] = [
  // Build Canada
  { publicationName: "Build Canada", feedUrl: "https://www.buildcanada.com/memos/rss.xml", category: "Memos" },

  // National Post
  { publicationName: "National Post", feedUrl: "https://nationalpost.com/feed", category: null },
  { publicationName: "National Post", feedUrl: "https://nationalpost.com/category/news/feed", category: "News" },
  { publicationName: "National Post", feedUrl: "https://nationalpost.com/category/opinion/feed", category: "Opinion" },
  { publicationName: "National Post", feedUrl: "https://nationalpost.com/category/business/feed", category: "Business" },
  { publicationName: "National Post", feedUrl: "https://nationalpost.com/category/sports/feed", category: "Sports" },
  { publicationName: "National Post", feedUrl: "https://nationalpost.com/category/entertainment/feed", category: "Entertainment" },
  { publicationName: "National Post", feedUrl: "https://nationalpost.com/category/life/feed", category: "Life" },

  // Globe and Mail
  { publicationName: "Globe and Mail", feedUrl: "https://www.theglobeandmail.com/arc/outboundfeeds/rss/category/canada/", category: null },
  { publicationName: "Globe and Mail", feedUrl: "https://www.theglobeandmail.com/arc/outboundfeeds/rss/category/politics/", category: "Politics" },
  { publicationName: "Globe and Mail", feedUrl: "https://www.theglobeandmail.com/arc/outboundfeeds/rss/category/business/", category: "Business" },
  { publicationName: "Globe and Mail", feedUrl: "https://www.theglobeandmail.com/arc/outboundfeeds/rss/category/opinion/", category: "Opinion" },
  { publicationName: "Globe and Mail", feedUrl: "https://www.theglobeandmail.com/arc/outboundfeeds/rss/category/sports/", category: "Sports" },
  { publicationName: "Globe and Mail", feedUrl: "https://www.theglobeandmail.com/arc/outboundfeeds/rss/category/arts/", category: "Arts" },
  { publicationName: "Globe and Mail", feedUrl: "https://www.theglobeandmail.com/arc/outboundfeeds/rss/category/life/", category: "Life" },
];

export async function seedFeeds(db: Db): Promise<{ inserted: number; skipped: number }> {
  let inserted = 0;
  let skipped = 0;

  for (const feed of SEED_FEEDS) {
    const [existing] = await db
      .select({ id: rssFeeds.id })
      .from(rssFeeds)
      .where(eq(rssFeeds.feedUrl, feed.feedUrl))
      .limit(1);

    if (existing) {
      skipped++;
      continue;
    }

    await db.insert(rssFeeds).values({
      publicationName: feed.publicationName,
      feedUrl: feed.feedUrl,
      category: feed.category,
    });

    inserted++;
  }

  return { inserted, skipped };
}
