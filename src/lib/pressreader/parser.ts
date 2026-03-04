import type { Article, CalendarResponse, Publication } from "./types";

// Soft hyphen character used by PressReader in text
const SOFT_HYPHEN = /\u00AD/g;

export function stripSoftHyphens(text: string): string {
  return text.replace(SOFT_HYPHEN, "");
}

export function parseArticleBody(article: Article): { text: string; html: string } {
  const textParts: string[] = [];
  const htmlParts: string[] = [];

  for (const block of article.TextBlocks ?? []) {
    const cleanContent = stripSoftHyphens(block.Content);
    textParts.push(cleanContent.replace(/<[^>]*>/g, ""));
    htmlParts.push(cleanContent);
  }

  return {
    text: textParts.join("\n\n"),
    html: htmlParts.join(""),
  };
}

export function toPublicationInsert(pub: Publication) {
  return {
    pressreaderId: pub.id,
    cid: pub.cid,
    type: pub.type,
    name: pub.name,
    displayName: pub.displayName,
    issn: pub.issn,
    slug: pub.slug,
    language: pub.language,
    countries: pub.countries,
    publisherName: pub.publisher?.name,
    schedule: pub.schedule,
    isFree: pub.isFree,
    categories: pub.categories?.map(String),
    rank: pub.rank,
  };
}

/**
 * Extract dates that have issues from the calendar response.
 * Returns dates as YYYY-MM-DD strings.
 */
export function extractIssueDates(calendar: CalendarResponse): string[] {
  const dates: string[] = [];

  for (const [year, months] of Object.entries(calendar.Years ?? {})) {
    for (const [month, days] of Object.entries(months)) {
      for (const day of Object.keys(days)) {
        const y = year;
        const m = month.padStart(2, "0");
        const d = day.padStart(2, "0");
        dates.push(`${y}-${m}-${d}`);
      }
    }
  }

  return dates.sort();
}

/**
 * Filter calendar dates to only those within the last N days from today.
 */
export function filterRecentDates(dates: string[], daysBack = 7): string[] {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - daysBack);
  const cutoffStr = cutoff.toISOString().slice(0, 10);

  return dates.filter((d) => d >= cutoffStr);
}
