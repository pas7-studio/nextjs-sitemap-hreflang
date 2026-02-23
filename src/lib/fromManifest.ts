import type { ChangeFrequency, SitemapEntry, XDefaultStrategy } from "./types.js";
import { withHreflang } from "./withHreflang.js";
import { normalizeUrl, resolveAbsoluteUrl } from "./url.js";

export type ManifestRouteStyle =
  | "prefix-as-needed"
  | "prefix-always"
  | "suffix-locale"
  | "locale-segment";

export type LocalizedManifestItem = {
  slug: string;
  locales: readonly string[];
  updatedAt?: string | Date;
  publishedAt?: string | Date;
  lastModified?: string | Date;
  date?: string | Date;
  changeFrequency?: ChangeFrequency;
  priority?: number;
  images?: string[];
};

export type CreateSitemapEntriesFromManifestOptions<T extends LocalizedManifestItem = LocalizedManifestItem> = {
  baseUrl: string;
  sectionPath: string;
  defaultLocale: string;
  canonicalLocale?: string;
  routeStyle?: ManifestRouteStyle;
  trailingSlash?: "preserve" | "always" | "never";
  ensureXDefault?: boolean;
  xDefaultStrategy?: XDefaultStrategy;
  includeLocales?: readonly string[];
  pathnameFor?: (args: {
    slug: string;
    locale: string;
    defaultLocale: string;
    sectionPath: string;
    routeStyle: ManifestRouteStyle;
  }) => string;
  imagesFor?: (item: T) => readonly string[] | undefined;
};

export function createSitemapEntriesFromManifest<T extends LocalizedManifestItem>(
  items: readonly T[],
  options: CreateSitemapEntriesFromManifestOptions<T>,
): SitemapEntry[] {
  const routeStyle = options.routeStyle ?? "locale-segment";
  const includeXDefault = options.ensureXDefault ?? true;
  const trailingSlash = options.trailingSlash ?? "preserve";
  const includeLocales = options.includeLocales ? new Set(options.includeLocales) : null;

  const entries: SitemapEntry[] = [];

  for (const item of items) {
    const slug = normalizeSlug(item.slug);
    if (!slug) continue;

    const locales = unique(item.locales).filter((locale) => (includeLocales ? includeLocales.has(locale) : true));
    if (locales.length === 0) continue;

    const configuredCanonical = options.canonicalLocale ?? options.defaultLocale;
    const effectiveCanonicalLocale =
      locales.includes(configuredCanonical) ? configuredCanonical : locales[0] ?? configuredCanonical;

    const languages: Record<string, string> = {};
    for (const locale of locales) {
      const pathname =
        options.pathnameFor?.({
          slug,
          locale,
          defaultLocale: options.defaultLocale,
          sectionPath: options.sectionPath,
          routeStyle,
        }) ??
        buildPathname({
          slug,
          locale,
          defaultLocale: options.defaultLocale,
          sectionPath: options.sectionPath,
          routeStyle,
        });

      const href = normalizeUrl(resolveAbsoluteUrl(pathname, options.baseUrl), trailingSlash);
      languages[locale] = href;
    }

    const canonicalUrl =
      languages[effectiveCanonicalLocale] ??
      normalizeUrl(resolveAbsoluteUrl("/", options.baseUrl), trailingSlash);

    const lastModified = pickLastModified(item);
    const images = pickImages(item, options);

    const baseEntry: SitemapEntry = {
      url: canonicalUrl,
      alternates: { languages },
      ...(lastModified ? { lastModified } : {}),
      ...(item.changeFrequency ? { changeFrequency: item.changeFrequency } : {}),
      ...(typeof item.priority === "number" ? { priority: item.priority } : {}),
      ...(images ? { images } : {}),
    };

    const [entryWithHreflang] = withHreflang([baseEntry], {
      baseUrl: options.baseUrl,
      trailingSlash,
      ensureAbsolute: true,
      ensureXDefault: includeXDefault,
      ensureSelf: true,
      canonicalLocale: effectiveCanonicalLocale,
      ...(options.xDefaultStrategy ? { xDefaultStrategy: options.xDefaultStrategy } : {}),
    });

    if (entryWithHreflang) entries.push(entryWithHreflang);
  }

  return entries;
}

function buildPathname(args: {
  slug: string;
  locale: string;
  defaultLocale: string;
  sectionPath: string;
  routeStyle: ManifestRouteStyle;
}): string {
  const section = normalizeSection(args.sectionPath);

  if (args.routeStyle === "prefix-as-needed") {
    if (args.locale === args.defaultLocale) return joinPath(section, args.slug);
    return joinPath(`/${args.locale}`, section, args.slug);
  }

  if (args.routeStyle === "prefix-always") {
    return joinPath(`/${args.locale}`, section, args.slug);
  }

  if (args.routeStyle === "suffix-locale") {
    if (args.locale === args.defaultLocale) return joinPath(section, args.slug);
    return joinPath(section, args.slug, args.locale);
  }

  return joinPath(section, args.locale, args.slug);
}

function normalizeSlug(slug: string): string {
  return slug.trim().replace(/^\/+/, "").replace(/\/+$/, "");
}

function normalizeSection(sectionPath: string): string {
  const normalized = sectionPath.trim();
  if (!normalized || normalized === "/") return "";
  return `/${normalized.replace(/^\/+/, "").replace(/\/+$/, "")}`;
}

function joinPath(...parts: string[]): string {
  const cleaned = parts
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => part.replace(/^\/+/, "").replace(/\/+$/, ""));

  if (cleaned.length === 0) return "/";
  return `/${cleaned.join("/")}`;
}

function unique(values: readonly string[]): string[] {
  return [...new Set(values)];
}

function pickLastModified(item: LocalizedManifestItem): string | Date | undefined {
  return item.lastModified ?? item.updatedAt ?? item.publishedAt ?? item.date;
}

function pickImages<T extends LocalizedManifestItem>(
  item: T,
  options: CreateSitemapEntriesFromManifestOptions<T>,
): string[] | undefined {
  const raw = options.imagesFor?.(item) ?? item.images;
  if (!raw || raw.length === 0) return undefined;

  const images = unique(
    raw
      .map((image) => image.trim())
      .filter(Boolean),
  );

  return images.length > 0 ? images : undefined;
}
