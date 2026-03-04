import { and, eq } from "drizzle-orm";

import type { Db } from "@/db";
import { issues, publications } from "@/db/schema/media-monitor";
import { scrapeJobs, scrapeTasks } from "@/db/schema/private";
import type { JobEnv } from "@/jobs";
import { performLater } from "@/jobs";
import { ScrapeIssueJob } from "@/jobs/scrape-issue.job";
import type { PressReaderClient } from "@/lib/pressreader";
import { extractIssueDates, filterRecentDates } from "@/lib/pressreader";

export async function runDailyScrape(
  db: Db,
  client: PressReaderClient,
  env: JobEnv,
): Promise<void> {
  console.log("[orchestrator] Starting daily scrape...");

  const [job] = await db
    .insert(scrapeJobs)
    .values({ jobType: "daily", status: "running", startedAt: new Date() })
    .returning();

  try {
    const enabledPubs = await db
      .select()
      .from(publications)
      .where(eq(publications.enabled, true));

    let issuesTotal = 0;

    for (const pub of enabledPubs) {
      console.log(`[orchestrator] Processing ${pub.name} (${pub.cid})...`);

      try {
        const calendar = await client.getCalendar(pub.cid);
        const allDates = extractIssueDates(calendar);
        const recentDates = filterRecentDates(allDates, 7);

        for (const dateStr of recentDates) {
          // Check if already scraped
          const [existing] = await db
            .select({ id: issues.id })
            .from(issues)
            .where(and(eq(issues.cid, pub.cid), eq(issues.issueDate, dateStr)))
            .limit(1);

          if (existing) {
            console.log(`[orchestrator] Skipping ${pub.cid} ${dateStr} (already scraped)`);
            continue;
          }

          const [task] = await db
            .insert(scrapeTasks)
            .values({
              jobId: job.id,
              publicationCid: pub.cid,
              issueDate: dateStr,
              status: "pending",
            })
            .returning();

          await performLater(env, ScrapeIssueJob, { taskId: task.id, jobId: job.id, cid: pub.cid, issueDate: dateStr });

          await db
            .update(scrapeTasks)
            .set({ status: "queued" })
            .where(eq(scrapeTasks.id, task.id));

          issuesTotal++;
        }

        // Pause between publications
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`[orchestrator] Error processing ${pub.name}:`, error);
      }
    }

    await db
      .update(scrapeJobs)
      .set({ publicationsTotal: enabledPubs.length, issuesTotal })
      .where(eq(scrapeJobs.id, job.id));

    console.log(
      `[orchestrator] Daily scrape queued: ${enabledPubs.length} publications, ${issuesTotal} issues`,
    );
  } catch (error) {
    await db
      .update(scrapeJobs)
      .set({
        status: "failed",
        completedAt: new Date(),
        errorMessage: error instanceof Error ? error.message : String(error),
      })
      .where(eq(scrapeJobs.id, job.id));
    throw error;
  }
}

export async function runBackfillScrape(
  db: Db,
  client: PressReaderClient,
  env: JobEnv,
  cid: string,
  from: string,
  to: string,
): Promise<number> {
  console.log(`[orchestrator] Starting backfill for ${cid}: ${from} to ${to}`);

  const [job] = await db
    .insert(scrapeJobs)
    .values({ jobType: "backfill", status: "running", startedAt: new Date() })
    .returning();

  const calendar = await client.getCalendar(cid);
  const allDates = extractIssueDates(calendar);
  const targetDates = allDates.filter((d) => d >= from && d <= to);

  let queued = 0;
  for (const dateStr of targetDates) {
    const [existing] = await db
      .select({ id: issues.id })
      .from(issues)
      .where(and(eq(issues.cid, cid), eq(issues.issueDate, dateStr)))
      .limit(1);

    if (existing) continue;

    const [task] = await db
      .insert(scrapeTasks)
      .values({
        jobId: job.id,
        publicationCid: cid,
        issueDate: dateStr,
        status: "pending",
      })
      .returning();

    await performLater(env, ScrapeIssueJob, { taskId: task.id, jobId: job.id, cid, issueDate: dateStr });

    await db.update(scrapeTasks).set({ status: "queued" }).where(eq(scrapeTasks.id, task.id));
    queued++;
  }

  await db
    .update(scrapeJobs)
    .set({ publicationsTotal: 1, issuesTotal: queued })
    .where(eq(scrapeJobs.id, job.id));

  return job.id;
}
