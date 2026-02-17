import type { HreflangIssue, HreflangReport } from "../lib/types.js";
import { extractLoc, extractUrlBlocks, extractXhtmlLinks, hasXhtmlNamespace } from "./xml.js";

export type CheckXmlOptions = {
  requireNamespace?: boolean;
  requireXDefaultWhenMultiple?: boolean;
  requireAbsolute?: boolean;
};

export function checkSitemapXmlHreflang(xml: string, options: CheckXmlOptions): HreflangReport {
  const requireNamespace = options.requireNamespace ?? true;
  const requireXDefaultWhenMultiple = options.requireXDefaultWhenMultiple ?? true;
  const requireAbsolute = options.requireAbsolute ?? true;

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
