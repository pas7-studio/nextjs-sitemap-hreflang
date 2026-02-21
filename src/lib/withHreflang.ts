import type {
  HreflangReport,
  SitemapEntryLike,
  XDefaultStrategy,
  RoutingStrategy,
} from "./types.js";
import { assertHreflang as assertHreflangImpl } from "./assertHreflang.js";
import { buildLanguagesMap, resolveXDefaultForLanguages } from "./buildLanguagesMap.js";
import { normalizeUrl, resolveAbsoluteUrl } from "./url.js";

export { normalizeUrl, resolveAbsoluteUrl };
export { buildLanguagesMap };

export type WithHreflangOptions = {
  baseUrl?: string;
  trailingSlash?: "preserve" | "always" | "never";
  ensureAbsolute?: boolean;
  ensureXDefault?: boolean;
  ensureSelf?: boolean;
  canonicalLocale?: string;
  xDefaultStrategy?: XDefaultStrategy;
  shouldApply?: (entry: SitemapEntryLike) => boolean;
};

export function withHreflang<T extends SitemapEntryLike>(
  entries: readonly T[],
  options: WithHreflangOptions,
): T[] {
  const trailingSlash = options.trailingSlash ?? "preserve";
  const ensureAbsolute = options.ensureAbsolute ?? true;
  const ensureXDefault = options.ensureXDefault ?? true;
  const ensureSelf = options.ensureSelf ?? false;

  return entries.map((entry) => {
    if (options.shouldApply && !options.shouldApply(entry)) return entry;

    const url = normalizeEntryUrl(entry.url, options.baseUrl, ensureAbsolute, trailingSlash);

    const languages = entry.alternates?.languages
      ? normalizeLanguages(entry.alternates.languages, options.baseUrl, ensureAbsolute, trailingSlash)
      : undefined;

    if (!languages) {
      return { ...entry, url } as T;
    }

    const nextLanguages = { ...languages };

    if (ensureSelf && options.canonicalLocale) {
      if (!nextLanguages[options.canonicalLocale]) nextLanguages[options.canonicalLocale] = url;
    }

    if (ensureXDefault) {
      if (!nextLanguages["x-default"]) {
        const xDefault = resolveXDefaultForLanguages({
          canonical: url,
          languages: nextLanguages,
          baseUrl: options.baseUrl ?? url,
          strategy: options.xDefaultStrategy ?? { type: "loc" },
          trailingSlash,
        });
        nextLanguages["x-default"] = xDefault;
      }
    }

    const alternates = { ...(entry.alternates ?? {}), languages: nextLanguages };

    return { ...entry, url, alternates } as T;
  });
}

function normalizeEntryUrl(
  url: string,
  baseUrl: string | undefined,
  ensureAbsolute: boolean,
  trailingSlash: "preserve" | "always" | "never",
): string {
  const abs = ensureAbsolute ? resolveAbsoluteUrl(url, baseUrl ?? url) : url;
  return normalizeUrl(abs, trailingSlash);
}

function normalizeLanguages(
  languages: Record<string, string | undefined>,
  baseUrl: string | undefined,
  ensureAbsolute: boolean,
  trailingSlash: "preserve" | "always" | "never",
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(languages)) {
    if (!v) continue;
    const abs = ensureAbsolute ? resolveAbsoluteUrl(v, baseUrl ?? v) : v;
    out[k] = normalizeUrl(abs, trailingSlash);
  }
  return out;
}

export type AssertHreflangOptions = {
  requireAbsolute?: boolean;
  requireXDefaultWhenMultiple?: boolean;
  requireSelf?: boolean;
  canonicalLocale?: string;
};

export function assertHreflangExport(entries: readonly SitemapEntryLike[], options: AssertHreflangOptions): HreflangReport {
  return assertHreflangImpl(entries, options);
}

/**
 * Build hreflang entries using a routing strategy.
 * This is the recommended way to use withHreflang with i18n routing.
 */
export function withHreflangFromRouting<T extends SitemapEntryLike>(
  entries: readonly T[],
  strategy: RoutingStrategy,
  options: {
    baseUrl: string;
    trailingSlash?: "preserve" | "always" | "never";
    ensureAbsolute?: boolean;
    ensureXDefault?: boolean;
    ensureSelf?: boolean;
    shouldApply?: (entry: SitemapEntryLike) => boolean;
  },
): T[] {
  const trailingSlash = options.trailingSlash ?? "preserve";
  const ensureAbsolute = options.ensureAbsolute ?? true;
  const ensureXDefault = options.ensureXDefault ?? true;
  const ensureSelf = options.ensureSelf ?? false;

  return entries.map((entry) => {
    if (options.shouldApply && !options.shouldApply(entry)) return entry;

    // Extract pathname from URL
    let pathname: string;
    try {
      const url = new URL(entry.url, options.baseUrl);
      pathname = url.pathname;
    } catch {
      pathname = entry.url;
    }

    // Build languages map from routing strategy
    const languages: Record<string, string> = {};
    for (const locale of strategy.locales) {
      const href = strategy.hrefFor({ pathname, locale });
      const abs = ensureAbsolute ? resolveAbsoluteUrl(href, options.baseUrl) : href;
      languages[locale] = normalizeUrl(abs, trailingSlash);
    }

    // Add x-default if needed
    if (ensureXDefault && !languages["x-default"]) {
      const canonical =
        languages[strategy.canonicalLocale] ?? normalizeUrl(entry.url, trailingSlash);
      const xDefault = resolveXDefaultForLanguages({
        canonical,
        languages,
        baseUrl: options.baseUrl,
        strategy: strategy.xDefault ?? { type: "loc" },
        trailingSlash,
      });
      languages["x-default"] = xDefault;
    }

    // Ensure self for canonical locale
    if (ensureSelf && !languages[strategy.canonicalLocale]) {
      const url = normalizeEntryUrl(entry.url, options.baseUrl, ensureAbsolute, trailingSlash);
      languages[strategy.canonicalLocale] = url;
    }

    const alternates = { ...(entry.alternates ?? {}), languages };

    return { ...entry, alternates } as T;
  });
}
