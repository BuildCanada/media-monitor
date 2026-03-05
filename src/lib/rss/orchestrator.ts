import { and, eq, lt, or } from "drizzle-orm";

import type { Db } from "@/db";
import { rssFeeds, rssIngestJobs, rssItems } from "@/db/schema/private";
import type { JobEnv } from "@/jobs";
import { performLater } from "@/jobs";
import { RssProcessJob } from "@/jobs/rss-process.job";

import { fetchFeed } from "./feed-fetcher";

const MAX_RETRIES = 3;

export async function retryFailedItems(
  db: Db,
  env: JobEnv,
): Promise<{ retried: number }> {
  const failedItems = await db
    .select({ id: rssItems.id, retryCount: rssItems.retryCount })
    .from(rssItems)
    .where(
      and(
        eq(rssItems.processingStatus, "failed"),
        lt(rssItems.retryCount, MAX_RETRIES),
      ),
    );

  if (failedItems.length === 0) {
    console.log("[rss-retry] No failed items eligible for retry.");
    return { retried: 0 };
  }

  console.log(`[rss-retry] Retrying ${failedItems.length} failed items...`);

  for (const item of failedItems) {
    await db
      .update(rssItems)
      .set({
        processingStatus: "pending",
        processingError: null,
        retryCount: item.retryCount + 1,
      })
      .where(eq(rssItems.id, item.id));

    await performLater(env, RssProcessJob, { rssItemId: item.id, jobId: 0 });
  }

  console.log(`[rss-retry] Queued ${failedItems.length} items for retry.`);
  return { retried: failedItems.length };
}

export async function runRssIngest(
  db: Db,
  env: JobEnv,
): Promise<{ jobId: number; newItems: number } | null> {
  console.log("[rss-orchestrator] Starting RSS ingest...");

  const enabledFeeds = await db
    .select()
    .from(rssFeeds)
    .where(eq(rssFeeds.enabled, true));

  if (enabledFeeds.length === 0) {
    console.log("[rss-orchestrator] No enabled feeds, skipping.");
    return null;
  }

  const [job] = await db
    .insert(rssIngestJobs)
    .values({ status: "running", startedAt: new Date() })
    .returning();

  let feedsFetched = 0;
  let totalNewItems = 0;
  let jobError: string | undefined;

  try {
    for (const feed of enabledFeeds) {
      console.log(`[rss-orchestrator] Fetching ${feed.publicationName} - ${feed.category || "main"} (${feed.feedUrl})`);

      try {
        const items = await fetchFeed(feed.feedUrl);
        feedsFetched++;

        await db
          .update(rssFeeds)
          .set({ lastFetchedAt: new Date(), lastFetchError: null })
          .where(eq(rssFeeds.id, feed.id));

        for (const item of items) {
          if (!item.guid || !item.link) continue;

          // Deduplicate by guid or link
          const [existing] = await db
            .select({ id: rssItems.id })
            .from(rssItems)
            .where(or(eq(rssItems.guid, item.guid), eq(rssItems.link, item.link)))
            .limit(1);

          if (existing) continue;

          const [inserted] = await db
            .insert(rssItems)
            .values({
              feedId: feed.id,
              guid: item.guid,
              link: item.link,
              title: item.title,
              author: item.author,
              pubDate: item.pubDate,
              description: item.description,
              categories: item.categories.length > 0 ? item.categories : null,
              processingStatus: "pending",
            })
            .returning();

          await performLater(env, RssProcessJob, { rssItemId: inserted.id, jobId: job.id });
          totalNewItems++;
        }
      } catch (error) {
        console.error(`[rss-orchestrator] Error fetching feed ${feed.feedUrl}:`, error);
        try {
          await db
            .update(rssFeeds)
            .set({ lastFetchError: error instanceof Error ? error.message : String(error) })
            .where(eq(rssFeeds.id, feed.id));
        } catch (updateError) {
          console.error(`[rss-orchestrator] Failed to record feed error:`, updateError);
        }
      }
    }
  } catch (error) {
    jobError = error instanceof Error ? error.message : String(error);
    console.error(`[rss-orchestrator] Ingest failed:`, error);
  } finally {
    try {
      await db
        .update(rssIngestJobs)
        .set({
          status: jobError ? "failed" : "completed",
          feedsFetched,
          newItems: totalNewItems,
          completedAt: new Date(),
          ...(jobError ? { errorMessage: jobError } : {}),
        })
        .where(eq(rssIngestJobs.id, job.id));
    } catch (updateError) {
      console.error(`[rss-orchestrator] Failed to update job status:`, updateError);
    }
  }

  console.log(
    `[rss-orchestrator] Ingest complete: ${feedsFetched} feeds, ${totalNewItems} new items`,
  );

  if (jobError) throw new Error(jobError);
  return { jobId: job.id, newItems: totalNewItems };
}
