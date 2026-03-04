// --- Publication types ---

export interface PublicationRoute {
  cid: string;
  country: string;
  publication: string;
  prn: string;
}

export interface PublicationLatestIssue {
  id: number;
  key: string;
  cid: string;
  issueDate: string;
  version: number;
  expungeVersion: number;
  firstPage: { width: number; height: number };
  issueVer: number;
  layoutVersion: number;
  activationTime: string;
  articleCount: number;
  listenActive: boolean;
}

export interface PublicationPublisher {
  id: number;
  name: string;
  slug: string;
}

export interface Publication {
  id: number;
  cid: string;
  type: string;
  name: string;
  displayName: string;
  issn: string | null;
  alternateNames: string[];
  slug: string;
  language: string;
  isSupplement: boolean;
  isFree: boolean;
  isSmart: boolean;
  isVirtual: boolean;
  categories: number[];
  countries: string[];
  rank: number;
  latestIssue: PublicationLatestIssue;
  countrySlug: string;
  publicationCountry: string;
  publisher: PublicationPublisher;
  maxBackIssues: number | null;
  media: string;
  schedule: string;
}

export interface PublicationListResponse {
  totalCount: number;
  publications: Publication[];
}

// --- Issue types ---

export interface IssueInfoResponse {
  Issue: {
    IssueId: number;
    IssueVersion: number;
    CID: string;
    ExpungeVersion: number | null;
    ImagesEngineVersion: number;
    Issue: string; // issue key
    IssueDateDisplayName: string;
    IssueDate: string;
    ProfileId: number;
  };
  Pages: number;
  PagesInfo: Array<{
    MaxUnrestrictedScale: number;
    PageNumber: number;
  }>;
  Newspaper: {
    Culture: string;
    EnableSmart: boolean;
    ISOLanguage: string;
    IsRightToLeft: boolean;
    Name: string;
  };
  Layout: {
    LayoutAvailable: boolean;
    LayoutVersion: number;
    PartialLayoutAvailable: boolean;
    ValidForSmartFlow: boolean;
  };
  LastIssue: string;
  Sponsor: {
    Name: string;
    LogoUrl: string;
  } | null;
}

// --- Calendar types ---

export interface CalendarDayEntry {
  Dis: number;
  P: number;
  V: string;
}

export interface CalendarResponse {
  EnableHighlihtPaidIssues: boolean;
  EnableCalendarView: boolean;
  EnableListView: boolean;
  EnableFullDateView: boolean;
  Years: Record<string, Record<string, Record<string, CalendarDayEntry>>>;
}

// --- Page metadata types ---

export interface PageArticle {
  ArticleId: number;
  Comments: number;
  HateIt: number;
  LikeIt: number;
  RegionId: number;
  RootArticleId: number;
  Subtitle: string | null;
  Title: string;
  Interests: unknown | null;
}

export interface PageMetadata {
  Issue: string;
  PageNumber: number;
  Articles: PageArticle[];
}

// --- Article types ---

export interface ArticleTextBlock {
  Class: string;
  Content: string;
}

export interface ArticleByline {
  Name: string;
  Title: string | null;
}

export interface ArticleClassification {
  Id: number;
  DisplayName: string;
  Weight: number;
}

export interface ArticleImage {
  RegionKey: string;
  Width: number;
  Height: number;
  Caption: string | null;
  Byline: string | null;
  Copyright: string | null;
}

export interface Article {
  ArticleId: number;
  Title: string;
  Subtitle: string | null;
  Byline: string | null;
  Bylines: ArticleByline[];
  Section: string | null;
  Page: number;
  PageName: string | null;
  Language: string;
  OriginalLanguage: string;
  ArticleType: string;
  TextLength: number;
  TextBlocks: ArticleTextBlock[];
  Classifications: ArticleClassification[];
  Images: ArticleImage[];
}

export interface ArticlesResponse {
  Articles: Article[];
}

// --- Queue message type ---

export interface ScrapeTaskMessage {
  taskId: number;
  jobId: number;
  cid: string;
  issueDate: string; // YYYY-MM-DD
}
