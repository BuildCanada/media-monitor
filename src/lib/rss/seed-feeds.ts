import { eq } from "drizzle-orm";

import type { Db } from "@/db";
import { rssFeeds } from "@/db/schema/private";

interface FeedSeed {
  publicationName: string;
  feedUrl: string;
  category: string | null;
  enabled?: boolean; // defaults to true
}

const SEED_FEEDS: FeedSeed[] = [
  // Build Canada
  { publicationName: "Build Canada", feedUrl: "https://www.buildcanada.com/memos/rss.xml", category: "Memos" },

  // CBC News
  { publicationName: "CBC News", feedUrl: "https://www.cbc.ca/cmlink/rss-topstories", category: "Top Stories" },
  { publicationName: "CBC News", feedUrl: "http://rss.cbc.ca/lineup/canada.xml", category: "Canada" },
  { publicationName: "CBC News", feedUrl: "http://rss.cbc.ca/lineup/world.xml", category: "World" },
  { publicationName: "CBC News", feedUrl: "http://rss.cbc.ca/lineup/politics.xml", category: "Politics" },
  { publicationName: "CBC News", feedUrl: "http://rss.cbc.ca/lineup/business.xml", category: "Business" },
  { publicationName: "CBC News", feedUrl: "http://rss.cbc.ca/lineup/health.xml", category: "Health" },
  { publicationName: "CBC News", feedUrl: "http://rss.cbc.ca/lineup/arts.xml", category: "Arts & Entertainment" },
  { publicationName: "CBC News", feedUrl: "http://rss.cbc.ca/lineup/technology.xml", category: "Technology & Science" },
  { publicationName: "CBC News", feedUrl: "http://rss.cbc.ca/lineup/sports.xml", category: "Sports" },
  // DISABLED: RSS returns HTTP 400
  { publicationName: "CBC News", feedUrl: "https://www.cbc.ca/cmlink/rss-cbcaboriginal", category: "Indigenous", enabled: false },

  // Global News
  { publicationName: "Global News", feedUrl: "https://globalnews.ca/feed/", category: "All Stories" },
  { publicationName: "Global News", feedUrl: "https://globalnews.ca/national/feed/", category: "National" },
  { publicationName: "Global News", feedUrl: "https://globalnews.ca/world/feed/", category: "World" },
  { publicationName: "Global News", feedUrl: "https://globalnews.ca/politics/feed/", category: "Politics" },
  { publicationName: "Global News", feedUrl: "https://globalnews.ca/money/feed/", category: "Money" },
  { publicationName: "Global News", feedUrl: "https://globalnews.ca/entertainment/feed/", category: "Entertainment" },
  { publicationName: "Global News", feedUrl: "https://globalnews.ca/sports/feed/", category: "Sports" },
  { publicationName: "Global News", feedUrl: "https://globalnews.ca/health/feed/", category: "Health" },
  { publicationName: "Global News", feedUrl: "https://globalnews.ca/tech/feed/", category: "Tech" },
  { publicationName: "Global News", feedUrl: "https://globalnews.ca/environment/feed/", category: "Environment" },

  // The Globe and Mail
  // DISABLED: RSS returns empty feed
  { publicationName: "The Globe and Mail", feedUrl: "https://www.theglobeandmail.com/arc/outboundfeeds/rss/category/homepage/", category: "Homepage", enabled: false },
  { publicationName: "The Globe and Mail", feedUrl: "https://www.theglobeandmail.com/arc/outboundfeeds/rss/category/canada/", category: null },
  { publicationName: "The Globe and Mail", feedUrl: "https://www.theglobeandmail.com/arc/outboundfeeds/rss/category/world/", category: "World" },
  { publicationName: "The Globe and Mail", feedUrl: "https://www.theglobeandmail.com/arc/outboundfeeds/rss/category/politics/", category: "Politics" },
  { publicationName: "The Globe and Mail", feedUrl: "https://www.theglobeandmail.com/arc/outboundfeeds/rss/category/business/", category: "Business" },
  { publicationName: "The Globe and Mail", feedUrl: "https://www.theglobeandmail.com/arc/outboundfeeds/rss/category/opinion/", category: "Opinion" },
  { publicationName: "The Globe and Mail", feedUrl: "https://www.theglobeandmail.com/arc/outboundfeeds/rss/category/sports/", category: "Sports" },
  { publicationName: "The Globe and Mail", feedUrl: "https://www.theglobeandmail.com/arc/outboundfeeds/rss/category/arts/", category: "Arts" },
  { publicationName: "The Globe and Mail", feedUrl: "https://www.theglobeandmail.com/arc/outboundfeeds/rss/category/life/", category: "Life" },

  // National Post
  { publicationName: "National Post", feedUrl: "https://nationalpost.com/feed", category: null },
  { publicationName: "National Post", feedUrl: "https://nationalpost.com/category/news/feed", category: "News" },
  { publicationName: "National Post", feedUrl: "https://nationalpost.com/category/opinion/feed", category: "Opinion" },
  { publicationName: "National Post", feedUrl: "https://nationalpost.com/category/business/feed", category: "Business" },
  { publicationName: "National Post", feedUrl: "https://nationalpost.com/category/sports/feed", category: "Sports" },
  { publicationName: "National Post", feedUrl: "https://nationalpost.com/category/entertainment/feed", category: "Entertainment" },
  { publicationName: "National Post", feedUrl: "https://nationalpost.com/category/life/feed", category: "Life" },

  // Financial Post
  { publicationName: "Financial Post", feedUrl: "https://financialpost.com/feed/", category: null },

  // Toronto Star
  { publicationName: "Toronto Star", feedUrl: "https://www.thestar.com/search/?f=rss&t=article&c=news*&l=50&s=start_time&sd=desc", category: null },

  // Toronto Sun
  { publicationName: "Toronto Sun", feedUrl: "https://torontosun.com/category/news/feed", category: null },

  // Montreal Gazette
  { publicationName: "Montreal Gazette", feedUrl: "https://montrealgazette.com/feed/", category: null },

  // Ottawa Citizen
  { publicationName: "Ottawa Citizen", feedUrl: "https://ottawacitizen.com/feed/", category: null },

  // Vancouver Sun
  { publicationName: "Vancouver Sun", feedUrl: "https://vancouversun.com/feed/", category: null },

  // Calgary Herald
  { publicationName: "Calgary Herald", feedUrl: "https://calgaryherald.com/feed/", category: null },

  // Edmonton Journal
  { publicationName: "Edmonton Journal", feedUrl: "https://edmontonjournal.com/feed/", category: null },

  // The Province
  { publicationName: "The Province", feedUrl: "https://theprovince.com/feed/", category: null },

  // Winnipeg Free Press
  { publicationName: "Winnipeg Free Press", feedUrl: "https://www.winnipegfreepress.com/rss/", category: null },

  // La Presse
  { publicationName: "La Presse", feedUrl: "https://www.lapresse.ca/actualites/rss", category: null },

  // Radio-Canada
  { publicationName: "Radio-Canada", feedUrl: "https://ici.radio-canada.ca/rss/4159", category: "Nouvelles" },
  // DISABLED: defuddle returns empty content (first items are video pages)
  { publicationName: "Radio-Canada", feedUrl: "https://ici.radio-canada.ca/rss/96", category: "International", enabled: false },
  // DISABLED: defuddle returns empty content (first items are video pages)
  { publicationName: "Radio-Canada", feedUrl: "https://ici.radio-canada.ca/rss/4175", category: "Politique", enabled: false },

  // BNN Bloomberg
  // DISABLED: RSS returns empty feed
  { publicationName: "BNN Bloomberg", feedUrl: "https://www.bnnbloomberg.ca/arc/outboundfeeds/rss/category/news/", category: null, enabled: false },

  // iPolitics
  { publicationName: "iPolitics", feedUrl: "https://www.ipolitics.ca/feed/", category: null },

  // The Tyee
  { publicationName: "The Tyee", feedUrl: "https://thetyee.ca/rss2.xml", category: null },

  // The Narwhal
  { publicationName: "The Narwhal", feedUrl: "https://thenarwhal.ca/feed", category: "Most Recent" },
  { publicationName: "The Narwhal", feedUrl: "https://thenarwhal.ca/category/investigation/feed", category: "Investigations" },

  // The Conversation Canada (Atom format)
  { publicationName: "The Conversation Canada", feedUrl: "https://theconversation.com/ca/articles.atom", category: null },

  // Canada's National Observer
  // DISABLED: RSS returns HTTP 403
  { publicationName: "Canada's National Observer", feedUrl: "https://www.nationalobserver.com/feed", category: null, enabled: false },

  // Canadaland
  { publicationName: "Canadaland", feedUrl: "https://www.canadaland.com/feed/", category: null },

  // The Logic
  { publicationName: "The Logic", feedUrl: "https://thelogic.co/feed/", category: null },

  // The Walrus
  { publicationName: "The Walrus", feedUrl: "https://thewalrus.ca/feed/", category: null },

  // Daily Hive
  { publicationName: "Daily Hive", feedUrl: "https://dailyhive.com/feed", category: null },

  // CityNews Toronto
  { publicationName: "CityNews Toronto", feedUrl: "https://toronto.citynews.ca/feed/", category: null },

  // The Hub
  { publicationName: "The Hub", feedUrl: "https://thehub.ca/feed/", category: null },

  // True North Centre
  { publicationName: "True North Centre", feedUrl: "https://tnc.news/feed/", category: null },

  // Western Standard
  { publicationName: "Western Standard", feedUrl: "https://www.westernstandard.news/feed", category: null },

  // Rebel News
  { publicationName: "Rebel News", feedUrl: "https://www.rebelnews.com/rss", category: null },

  // Ricochet Media
  { publicationName: "Ricochet Media", feedUrl: "https://ricochet.media/feed", category: null },

  // Rabble.ca
  { publicationName: "Rabble.ca", feedUrl: "https://rabble.ca/feed/", category: null },

  // Canada.com
  { publicationName: "Canada.com", feedUrl: "https://o.canada.com/feed", category: null },

  // Edmonton Sun
  { publicationName: "Edmonton Sun", feedUrl: "https://edmontonsun.com/category/news/feed", category: null },

  // Saskatoon StarPhoenix
  { publicationName: "Saskatoon StarPhoenix", feedUrl: "https://thestarphoenix.com/feed/", category: null },

  // Regina Leader-Post
  { publicationName: "Regina Leader-Post", feedUrl: "https://leaderpost.com/feed/", category: null },

  // London Free Press
  { publicationName: "London Free Press", feedUrl: "https://lfpress.com/category/news/feed", category: null },

  // Victoria Times Colonist
  { publicationName: "Victoria Times Colonist", feedUrl: "https://www.timescolonist.com/rss/", category: null },
];

export async function seedFeeds(db: Db): Promise<{ inserted: number; updated: number }> {
  let inserted = 0;
  let updated = 0;

  for (const feed of SEED_FEEDS) {
    const enabled = feed.enabled ?? true;

    const [existing] = await db
      .select({ id: rssFeeds.id, publicationName: rssFeeds.publicationName, category: rssFeeds.category, enabled: rssFeeds.enabled })
      .from(rssFeeds)
      .where(eq(rssFeeds.feedUrl, feed.feedUrl))
      .limit(1);

    if (existing) {
      const needsUpdate =
        existing.publicationName !== feed.publicationName ||
        existing.category !== feed.category ||
        existing.enabled !== enabled;

      if (needsUpdate) {
        await db
          .update(rssFeeds)
          .set({
            publicationName: feed.publicationName,
            category: feed.category,
            enabled,
            updatedAt: new Date(),
          })
          .where(eq(rssFeeds.id, existing.id));
        updated++;
      }
      continue;
    }

    await db.insert(rssFeeds).values({
      publicationName: feed.publicationName,
      feedUrl: feed.feedUrl,
      category: feed.category,
      enabled,
    });

    inserted++;
  }

  return { inserted, updated };
}
