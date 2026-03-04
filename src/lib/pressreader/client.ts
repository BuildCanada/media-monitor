import type {
  ArticlesResponse,
  CalendarResponse,
  IssueInfoResponse,
  PageMetadata,
  Publication,
  PublicationListResponse,
} from "./types";

import { RateLimiter } from "./rate-limiter";

import {
  getArticlesUrl,
  getCalendarUrl,
  getImageUrl,
  getIssueInfoUrl,
  getPagesMetadataUrl,
  getPublicationDetailUrl,
  getPublicationsUrl,
} from "./endpoints";

const PROXY_ORIGIN = "https://www-pressreader-com.edpl.idm.oclc.org";

export class PressReaderClient {
  private token: string;
  private rateLimiter: RateLimiter;

  constructor(token: string, rateLimiter?: RateLimiter) {
    this.token = token;
    this.rateLimiter = rateLimiter ?? new RateLimiter();
  }

  private async request<T>(url: string): Promise<T> {
    await this.rateLimiter.wait();

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.token}`,
        Origin: PROXY_ORIGIN,
        Referer: `${PROXY_ORIGIN}/`,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new PressReaderError(
        `PressReader API error: ${response.status} ${response.statusText}`,
        response.status,
        body,
      );
    }

    return response.json() as Promise<T>;
  }

  async getPublications(offset: number, limit: number): Promise<PublicationListResponse> {
    const url = getPublicationsUrl(offset, limit);
    return this.request<PublicationListResponse>(url);
  }

  async getPublicationDetail(cid: string): Promise<Publication> {
    const url = getPublicationDetailUrl(cid);
    return this.request<Publication>(url);
  }

  async getIssueInfo(cid: string, issueDate?: string): Promise<IssueInfoResponse> {
    const url = getIssueInfoUrl(cid, issueDate);
    return this.request<IssueInfoResponse>(url);
  }

  async getCalendar(cid: string): Promise<CalendarResponse> {
    const url = getCalendarUrl(cid);
    return this.request<CalendarResponse>(url);
  }

  async getPagesMetadata(issueKey: string, pageNumbers: number[]): Promise<PageMetadata[]> {
    const url = getPagesMetadataUrl(issueKey, pageNumbers);
    return this.request<PageMetadata[]>(url);
  }

  async getArticles(articleIds: number[]): Promise<ArticlesResponse> {
    const url = getArticlesUrl(articleIds);
    return this.request<ArticlesResponse>(url);
  }

  async downloadImage(regionKey: string, scale = 300): Promise<ArrayBuffer | null> {
    await this.rateLimiter.wait();

    const url = getImageUrl(regionKey, scale);
    try {
      const response = await fetch(url, {
        headers: {
          Origin: PROXY_ORIGIN,
          Referer: `${PROXY_ORIGIN}/`,
        },
      });

      if (!response.ok) return null;
      return response.arrayBuffer();
    } catch {
      return null;
    }
  }
}

export class PressReaderError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public responseBody: string,
  ) {
    super(message);
    this.name = "PressReaderError";
  }

  get isRetryable(): boolean {
    return this.statusCode === 429 || this.statusCode >= 500;
  }

  get isAuthError(): boolean {
    return this.statusCode === 401 || this.statusCode === 403;
  }
}
