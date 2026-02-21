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
  | "DUPLICATE_HREFLANG_KEY"
  | "DUPLICATE_HREF"
  | "INVALID_HREFLANG_CASING"
  | "INCONSISTENT_ORIGIN";

export type HreflangIssue = {
  code: HreflangIssueCode;
  entryUrl: string;
  message: string;
};

export type HreflangReport = {
  ok: boolean;
  issues: HreflangIssue[];
};

/**
 * Routing strategy for generating hreflang URLs.
 * This makes the package routing-agnostic.
 */
export type RoutingStrategy = {
  /** Supported locales */
  readonly locales: readonly string[];
  /** Default/canonical locale */
  readonly canonicalLocale: string;
  /** Generate URL for a given pathname and locale */
  readonly hrefFor: (args: { pathname: string; locale: string }) => string;
  /** x-default strategy (optional) */
  readonly xDefault?: XDefaultStrategy;
};

/**
 * Options for prefix-as-needed routing (like next-intl)
 */
export type RoutingPrefixAsNeededOptions = {
  readonly defaultLocale: string;
  readonly locales: readonly string[];
  readonly basePath?: string;
};

/**
 * Options for prefix-always routing
 */
export type RoutingPrefixAlwaysOptions = {
  readonly defaultLocale: string;
  readonly locales: readonly string[];
  readonly basePath?: string;
};

/**
 * Options for domain-based routing
 */
export type RoutingDomainBasedOptions = {
  readonly defaultLocale: string;
  readonly locales: readonly string[];
  readonly localeToDomain: Record<string, string>;
};

/**
 * Options for suffix-locale routing (like /blog/uk)
 */
export type RoutingSuffixLocaleOptions = {
  readonly defaultLocale: string;
  readonly locales: readonly string[];
  readonly basePath?: string;
};

/**
 * Options for PAS7 custom routing scheme
 */
export type RoutingPAS7Options = {
  readonly defaultLocale: string;
  readonly locales: readonly string[];
  readonly hubPaths?: readonly string[];
  readonly detailPathPattern?: RegExp;
};
