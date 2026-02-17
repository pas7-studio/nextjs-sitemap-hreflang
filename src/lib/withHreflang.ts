import type {
  HreflangReport,
  SitemapEntryLike,
  XDefaultStrategy,
} from "./types.js";
import { assertHreflang } from "./assertHreflang.js";
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
  languages: Record<string, string>,
  baseUrl: string | undefined,
  ensureAbsolute: boolean,
  trailingSlash: "preserve" | "always" | "never",
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(languages)) {
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
  return assertHreflang(entries, options);
}
