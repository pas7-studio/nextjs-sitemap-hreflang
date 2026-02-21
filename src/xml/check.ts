import type { HreflangIssue, HreflangReport } from "../lib/types.js";
import { extractLoc, extractUrlBlocks, extractXhtmlLinks, hasXhtmlNamespace } from "./xml.js";

export type CheckXmlOptions = {
  requireNamespace?: boolean;
  requireXDefaultWhenMultiple?: boolean;
  requireAbsolute?: boolean;
  checkDuplicateKeys?: boolean;
  checkDuplicateHrefs?: boolean;
  checkHreflangCasing?: boolean;
  originPolicy?: "same" | "allowlist" | "off";
  allowedOrigins?: string[];
};

export function checkSitemapXmlHreflang(xml: string, options: CheckXmlOptions): HreflangReport {
  const requireNamespace = options.requireNamespace ?? true;
  const requireXDefaultWhenMultiple = options.requireXDefaultWhenMultiple ?? true;
  const requireAbsolute = options.requireAbsolute ?? true;
  const checkDuplicateKeys = options.checkDuplicateKeys ?? true;
  const checkDuplicateHrefs = options.checkDuplicateHrefs ?? true;
  const checkHreflangCasing = options.checkHreflangCasing ?? true;
  const originPolicy = options.originPolicy ?? "off";

  const issues: HreflangIssue[] = [];

  const blocks = extractUrlBlocks(xml);

  if (requireNamespace) {
    const usesXhtml = /<xhtml:link\b/.test(xml);
    if (usesXhtml && !hasXhtmlNamespace(xml)) {
      issues.push({
        code: "MISSING_LANGUAGES",
        entryUrl: "sitemap.xml",
        message: 'Missing xmlns:xhtml="http://www.w3.org/1999/xhtml" in <urlset>',
      });
    }
  }

  for (const block of blocks) {
    const loc = extractLoc(block);
    if (!loc) continue;

    const links = extractXhtmlLinks(block);
    if (links.length === 0) continue;

    const hasXDefault = links.some((l) => l.hreflang === "x-default");
    if (requireXDefaultWhenMultiple && links.length > 1 && !hasXDefault) {
      issues.push({
        code: "MISSING_XDEFAULT",
        entryUrl: loc,
        message: "Missing x-default hreflang in sitemap url block",
      });
    }

    // Check for duplicate hreflang keys
    if (checkDuplicateKeys) {
      const seenKeys = new Set<string>();
      for (const link of links) {
        if (seenKeys.has(link.hreflang)) {
          issues.push({
            code: "DUPLICATE_HREFLANG_KEY",
            entryUrl: loc,
            message: `Duplicate hreflang key: ${link.hreflang}`,
          });
        }
        seenKeys.add(link.hreflang);
      }
    }

    // Check for duplicate hrefs (excluding x-default which can share href with another locale)
    if (checkDuplicateHrefs) {
      const hrefToLocales = new Map<string, string[]>();
      for (const link of links) {
        const locales = hrefToLocales.get(link.href) ?? [];
        locales.push(link.hreflang);
        hrefToLocales.set(link.href, locales);
      }
      for (const [href, locales] of hrefToLocales) {
        // Filter out x-default - it's allowed to share href with another locale
        const nonXDefaultLocales = locales.filter((l) => l !== "x-default");
        if (nonXDefaultLocales.length > 1) {
          issues.push({
            code: "DUPLICATE_HREF",
            entryUrl: loc,
            message: `Duplicate hreflang href detected: ${href} (locales: ${nonXDefaultLocales.join(", ")})`,
          });
        }
      }
    }

    // Check hreflang casing
    if (checkHreflangCasing) {
      for (const link of links) {
        if (!isValidHreflangCasing(link.hreflang)) {
          issues.push({
            code: "INVALID_HREFLANG_CASING",
            entryUrl: loc,
            message: `Invalid hreflang casing: ${link.hreflang}. Expected format: en, pt-BR, or x-default`,
          });
        }
      }
    }

    // Check origin policy
    if (originPolicy === "same") {
      const locOrigin = getOrigin(loc);
      if (locOrigin) {
        for (const link of links) {
          const linkOrigin = getOrigin(link.href);
          if (linkOrigin && linkOrigin !== locOrigin) {
            issues.push({
              code: "INCONSISTENT_ORIGIN",
              entryUrl: loc,
              message: `Inconsistent origin for ${link.hreflang}: expected ${locOrigin}, got ${linkOrigin}`,
            });
          }
        }
      }
    } else if (originPolicy === "allowlist") {
      const allowedOrigins = options.allowedOrigins ?? [];
      for (const link of links) {
        const linkOrigin = getOrigin(link.href);
        if (linkOrigin && !allowedOrigins.includes(linkOrigin)) {
          issues.push({
            code: "INCONSISTENT_ORIGIN",
            entryUrl: loc,
            message: `Origin not in allowlist for ${link.hreflang}: ${linkOrigin}`,
          });
        }
      }
      const locOrigin = getOrigin(loc);
      if (locOrigin && !allowedOrigins.includes(locOrigin)) {
        issues.push({
          code: "INCONSISTENT_ORIGIN",
          entryUrl: loc,
          message: `Origin not in allowlist for loc: ${locOrigin}`,
        });
      }
    }

    if (requireAbsolute) {
      for (const link of links) {
        if (!isAbsolute(link.href)) {
          issues.push({
            code: "NON_ABSOLUTE_URL",
            entryUrl: loc,
            message: `Non-absolute hreflang href for ${link.hreflang}: ${link.href}`,
          });
        }
      }
      if (!isAbsolute(loc)) {
        issues.push({
          code: "NON_ABSOLUTE_URL",
          entryUrl: loc,
          message: `Non-absolute <loc>: ${loc}`,
        });
      }
    }
  }

  return { ok: issues.length === 0, issues };
}

function isAbsolute(u: string): boolean {
  return u.startsWith("http://") || u.startsWith("https://");
}

function getOrigin(url: string): string | null {
  try {
    const u = new URL(url);
    return u.origin;
  } catch {
    return null;
  }
}

function isValidHreflangCasing(key: string): boolean {
  if (key === "x-default") return true;
  // en, de, uk - only lowercase
  if (/^[a-z]{2}$/.test(key)) return true;
  // pt-BR, en-US - lowercase-UPPERCASE
  if (/^[a-z]{2}-[A-Z]{2}$/.test(key)) return true;
  return false;
}
