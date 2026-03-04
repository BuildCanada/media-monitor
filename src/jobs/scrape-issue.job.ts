import { eq } from "drizzle-orm";

import {
  articleAuthors,
  articleImages,
  articleTags,
  articles,
  issues,
  publications,
  sections,
} from "@/db/schema/media-monitor";
import { scrapeJobs, scrapeTasks } from "@/db/schema/private";
import type { PressReaderClient, ScrapeTaskMessage } from "@/lib/pressreader";
import { getValidToken, parseArticleBody, PressReaderClient as PRClient, RateLimiter } from "@/lib/pressreader";
import { downloadAndStoreImage } from "@/lib/scraper/image-downloader";

import type { Job, JobEnv } from "./runner";
import { register } from "./runner";

const ARTICLE_BATCH_SIZE = 20;

export const ScrapeIssueJob: Job<ScrapeTaskMessage> = {
  type: "scrape-issue",

  async perform(env: JobEnv, payload) {
    const { taskId, jobId, cid, issueDate } = payload;
    const { db } = env;

    console.log(`[task-processor] Processing ${cid} ${issueDate} (task ${taskId})`);

    // Build PressReader client
    const token = await getValidToken(db);
    if (!token) {
      throw new Error("No valid auth token available");
    }
    const client: PressReaderClient = new PRClient(token, new RateLimiter());
    const r2 = env.images!;

    // Update task status
    await db
      .update(scrapeTasks)
      .set({ status: "running", startedAt: new Date(), attempt: 1 })
      .where(eq(scrapeTasks.id, taskId));

    try {
      // 1. Get issue info
      const issueInfo = await client.getIssueInfo(cid, issueDate);
      const issueKey = issueInfo.Issue.Issue;
      const pageCount = issueInfo.Pages;

      // Update task with issue key
      await db.update(scrapeTasks).set({ issueKey }).where(eq(scrapeTasks.id, taskId));

      // Get publication for FK
      const [pub] = await db
        .select({ id: publications.id })
        .from(publications)
        .where(eq(publications.cid, cid))
        .limit(1);

      if (!pub) {
        throw new Error(`Publication not found for cid: ${cid}`);
      }

      // 2. Upsert issue
      const [issue] = await db
        .insert(issues)
        .values({
          publicationId: pub.id,
          pressreaderIssueId: issueInfo.Issue.IssueId,
          issueKey,
          cid,
          issueDate,
          version: issueInfo.Issue.IssueVersion,
          pageCount,
        })
        .onConflictDoUpdate({
          target: [issues.cid, issues.issueDate],
          set: {
            issueKey,
            version: issueInfo.Issue.IssueVersion,
            pageCount,
            updatedAt: new Date(),
          },
        })
        .returning();

      // 3. Fetch page metadata to get all article IDs
      const pageNumbers = Array.from({ length: pageCount }, (_, i) => i + 1);
      const pagesMetadata = await client.getPagesMetadata(issueKey, pageNumbers);

      const articleIds: number[] = [];
      for (const page of pagesMetadata) {
        for (const article of page.Articles) {
          if (!articleIds.includes(article.ArticleId)) {
            articleIds.push(article.ArticleId);
          }
        }
      }

      console.log(`[task-processor] Found ${articleIds.length} articles in ${cid} ${issueDate}`);

      // 4. Fetch articles in batches
      let articlesSaved = 0;
      let imagesFound = 0;
      let imagesSaved = 0;

      for (let i = 0; i < articleIds.length; i += ARTICLE_BATCH_SIZE) {
        const batch = articleIds.slice(i, i + ARTICLE_BATCH_SIZE);
        const response = await client.getArticles(batch);

        for (const article of response.Articles ?? []) {
          try {
            // Upsert section
            let sectionId: number | null = null;
            if (article.Section) {
              const [section] = await db
                .insert(sections)
                .values({ name: article.Section, publicationId: pub.id })
                .onConflictDoNothing()
                .returning();

              if (section) {
                sectionId = section.id;
              } else {
                // Already exists, fetch it
                const [existing] = await db
                  .select({ id: sections.id })
                  .from(sections)
                  .where(eq(sections.name, article.Section))
                  .limit(1);
                sectionId = existing?.id ?? null;
              }
            }

            // Parse body
            const { text, html } = parseArticleBody(article);

            // Insert article
            const [savedArticle] = await db
              .insert(articles)
              .values({
                issueId: issue.id,
                pressreaderId: BigInt(article.ArticleId),
                title: article.Title,
                subtitle: article.Subtitle,
                byline: article.Byline,
                sectionId,
                sectionName: article.Section,
                page: article.Page,
                pageName: article.PageName,
                language: article.Language,
                originalLanguage: article.OriginalLanguage,
                articleType: article.ArticleType,
                textLength: article.TextLength,
                bodyText: text,
                bodyHtml: html,
              })
              .returning();

            // Insert authors
            if (article.Bylines?.length) {
              await db.insert(articleAuthors).values(
                article.Bylines.map((b, idx) => ({
                  articleId: savedArticle.id,
                  name: b.Name,
                  sortOrder: idx,
                })),
              );
            }

            // Insert tags
            if (article.Classifications?.length) {
              await db.insert(articleTags).values(
                article.Classifications.map((c) => ({
                  articleId: savedArticle.id,
                  pressreaderTagId: c.Id,
                  displayName: c.DisplayName,
                  weight: c.Weight,
                })),
              );
            }

            // Download images
            for (let imgIdx = 0; imgIdx < (article.Images?.length ?? 0); imgIdx++) {
              const img = article.Images[imgIdx];
              imagesFound++;

              const r2Key = await downloadAndStoreImage(
                client,
                r2,
                img.RegionKey,
                cid,
                issueDate,
              );

              if (r2Key) imagesSaved++;

              await db.insert(articleImages).values({
                articleId: savedArticle.id,
                pressreaderImageId: BigInt(img.RegionKey.replace(/\D/g, "") || "0"),
                originalUrl: `https://t.prcdn.co/img?regionKey=${encodeURIComponent(img.RegionKey)}&scale=300`,
                r2Key,
                width: img.Width,
                height: img.Height,
                caption: img.Caption,
                byline: img.Byline,
                copyright: img.Copyright,
                sortOrder: imgIdx,
              });
            }

            articlesSaved++;
          } catch (error) {
            console.error(
              `[task-processor] Error saving article ${article.ArticleId}:`,
              error,
            );
          }
        }
      }

      // 5. Update issue article count
      await db
        .update(issues)
        .set({ articleCount: articlesSaved, updatedAt: new Date() })
        .where(eq(issues.id, issue.id));

      // 6. Update task status
      await db
        .update(scrapeTasks)
        .set({
          status: "completed",
          completedAt: new Date(),
          articlesFound: articleIds.length,
          articlesSaved,
          imagesFound,
          imagesSaved,
        })
        .where(eq(scrapeTasks.id, taskId));

      // 7. Update job counters
      await db
        .update(scrapeJobs)
        .set({
          issuesScraped: (
            await db
              .select({ count: scrapeTasks.id })
              .from(scrapeTasks)
              .where(eq(scrapeTasks.jobId, jobId))
          ).length,
          articlesScraped: articlesSaved,
        })
        .where(eq(scrapeJobs.id, jobId));

      console.log(
        `[task-processor] Completed ${cid} ${issueDate}: ${articlesSaved} articles, ${imagesSaved}/${imagesFound} images`,
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`[task-processor] Failed ${cid} ${issueDate}:`, errorMessage);

      await db
        .update(scrapeTasks)
        .set({ status: "failed", completedAt: new Date(), errorMessage })
        .where(eq(scrapeTasks.id, taskId));

      throw error;
    }
  },
};

register(ScrapeIssueJob);
