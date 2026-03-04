const BASE_URL = "https://ingress.pressreader.com/services";

// Category 142606336 = "Canada", 615 = another relevant filter
const CANADA_CATEGORIES = "142606336";
const COUNTRY_FILTER = "615";

export function getPublicationsUrl(offset: number, limit: number): string {
  const params = new URLSearchParams({
    offset: String(offset),
    limit: String(limit),
    orderBy: "searchrank desc",
    supplement: "0",
    cre: "0",
  });
  params.append("has", CANADA_CATEGORIES);
  params.append("in[]", COUNTRY_FILTER);
  return `${BASE_URL}/catalog/publications?${params}`;
}

export function getPublicationDetailUrl(cid: string): string {
  return `${BASE_URL}/catalog/v2/publications/${cid}`;
}

export function getIssueInfoUrl(cid: string, issueDate?: string): string {
  const params = new URLSearchParams({ cid });
  if (issueDate) {
    // API expects YYYYMMDD
    params.set("issueDate", issueDate.replace(/-/g, ""));
  }
  return `${BASE_URL}/IssueInfo/GetIssueInfoByCid?${params}`;
}

export function getCalendarUrl(cid: string): string {
  return `${BASE_URL}/calendar/?cid=${cid}`;
}

export function getPagesMetadataUrl(issueKey: string, pageNumbers: number[]): string {
  const params = new URLSearchParams({
    issue: issueKey,
    pageNumbers: pageNumbers.join(","),
  });
  return `${BASE_URL}/pagesMetadata/?${params}`;
}

export function getArticlesUrl(articleIds: number[]): string {
  const params = new URLSearchParams({
    articles: articleIds.join(","),
    viewType: "text",
    comment: "LatestByAll",
    IsHyphenated: "true",
    options: "1",
  });
  return `${BASE_URL}/articles/GetItems?${params}`;
}

export function getImageUrl(regionKey: string, scale = 300): string {
  return `https://t.prcdn.co/img?regionKey=${encodeURIComponent(regionKey)}&scale=${scale}`;
}
