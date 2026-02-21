import type { SitemapEntryLike } from "./types.js";

export type ExpandLocalesOptions = {
  mode: "cluster-only" | "expanded";
  includeXDefault?: boolean;
  locales?: readonly string[];
};

export function expandLocaleEntries<T extends SitemapEntryLike>(
  entries: readonly T[],
  options: ExpandLocalesOptions,
): T[] {
  if (options.mode === "cluster-only") {
    return [...entries];
  }

  const result: T[] = [];

  for (const entry of entries) {
    const languages = entry.alternates?.languages;
    if (!languages || Object.keys(languages).length === 0) {
      result.push(entry);
      continue;
    }

    // Create a separate entry for each locale
    for (const [locale, href] of Object.entries(languages)) {
      if (locale === "x-default" && !options.includeXDefault) continue;

      // Filter by specific locales if provided
      if (options.locales && !options.locales.includes(locale)) continue;

      const expandedEntry: T = {
        ...entry,
        url: href,
        // alternates.languages remains the full cluster
      };
      result.push(expandedEntry);
    }
  }

  // Dedupe by url
  const seen = new Set<string>();
  return result.filter((e) => {
    if (seen.has(e.url)) return false;
    seen.add(e.url);
    return true;
  });
}
