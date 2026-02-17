export type ChangeFrequency =
  | "always"
  | "hourly"
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly"
  | "never";

export type SitemapAlternates = {
  languages?: Record<string, string>;
};

export type SitemapEntryLike = {
  url: string;
  lastModified?: string | Date;
  changeFrequency?: ChangeFrequency;
  priority?: number;
  alternates?: SitemapAlternates;
  images?: string[];
};

export type SitemapEntry = SitemapEntryLike;

export type XDefaultStrategy =
  | { type: "loc" }
  | { type: "root" }
  | { type: "locale"; locale: string }
  | { type: "custom"; url: string }
  | { type: "fn"; resolve: (entry: SitemapEntryLike) => string };

export type HreflangIssueCode =
  | "MISSING_LANGUAGES"
  | "MISSING_XDEFAULT"
  | "MISSING_SELF"
  | "NON_ABSOLUTE_URL"
  | "INVALID_LOCALE_KEY"
  | "DUPLICATE_HREF";

export type HreflangIssue = {
  code: HreflangIssueCode;
  entryUrl: string;
  message: string;
};

export type HreflangReport = {
  ok: boolean;
  issues: HreflangIssue[];
};
