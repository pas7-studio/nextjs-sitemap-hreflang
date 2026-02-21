import type { HreflangIssue, HreflangReport, SitemapEntryLike } from "./types.js";

export type AssertHreflangOptions = {
  requireAbsolute?: boolean;
  requireXDefaultWhenMultiple?: boolean;
  requireSelf?: boolean;
  canonicalLocale?: string;
};

export function assertHreflang(
  entries: readonly SitemapEntryLike[],
  options: AssertHreflangOptions,
): HreflangReport {
  const requireAbsolute = options.requireAbsolute ?? true;
  const requireXDefaultWhenMultiple = options.requireXDefaultWhenMultiple ?? true;
  const requireSelf = options.requireSelf ?? false;

  const issues: HreflangIssue[] = [];

  for (const entry of entries) {
    const languages = entry.alternates?.languages;
    if (!languages) continue;

    const pairs = Object.entries(languages).filter(([, href]) => Boolean(href)) as Array<[
      string,
      string,
    ]>;

    if (pairs.length === 0) {
      issues.push({
        code: "MISSING_LANGUAGES",
        entryUrl: entry.url,
        message: "alternates.languages is empty",
      });
      continue;
    }

    if (requireXDefaultWhenMultiple && pairs.length > 1 && !languages["x-default"]) {
      issues.push({
        code: "MISSING_XDEFAULT",
        entryUrl: entry.url,
        message: "Missing x-default hreflang for a multilingual entry",
      });
    }

    if (requireSelf && options.canonicalLocale) {
      if (!languages[options.canonicalLocale]) {
        issues.push({
          code: "MISSING_SELF",
          entryUrl: entry.url,
          message: `Missing self hreflang for canonicalLocale=${options.canonicalLocale}`,
        });
      }
    }

    const hrefSeen = new Set<string>();
    for (const [locale, href] of pairs) {
      if (!isValidLocaleKey(locale)) {
        issues.push({
          code: "INVALID_LOCALE_KEY",
          entryUrl: entry.url,
          message: `Invalid locale key: ${locale}`,
        });
      }
      if (requireAbsolute && !isAbsoluteUrl(href)) {
        issues.push({
          code: "NON_ABSOLUTE_URL",
          entryUrl: entry.url,
          message: `Non-absolute hreflang href for ${locale}: ${href}`,
        });
      }
      if (hrefSeen.has(href)) {
        issues.push({
          code: "DUPLICATE_HREF",
          entryUrl: entry.url,
          message: `Duplicate hreflang href detected: ${href}`,
        });
      }
      hrefSeen.add(href);
    }
  }

  return { ok: issues.length === 0, issues };
}

function isAbsoluteUrl(url: string): boolean {
  return url.startsWith("http://") || url.startsWith("https://");
}

function isValidLocaleKey(key: string): boolean {
  if (key === "x-default") return true;
  return /^[a-z]{2}(-[A-Z]{2})?$/.test(key);
}
