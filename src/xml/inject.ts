import { getOriginFromAbsoluteUrl, resolveAbsoluteUrl } from "../lib/url.js";
import type { XDefaultStrategy } from "../lib/types.js";
import {
  ensureXhtmlNamespace,
  extractLoc,
  extractUrlBlocks,
  extractXhtmlLinks,
  hasXDefault,
  insertXhtmlLink,
  normalizeTrailingSlashInBlock,
  reorderXhtmlLinks,
  xmlEscape,
} from "./xml.js";

export type InjectOptions = {
  baseUrl?: string;
  xDefaultStrategy?: XDefaultStrategy;
  ensureNamespace?: boolean;
  canonicalLocale?: string;
  order?: "canonical-first" | "preserve";
  trailingSlash?: "preserve" | "always" | "never";
};

export function injectXDefaultIntoSitemapXml(xml: string, options: InjectOptions): string {
  const ensureNamespace = options.ensureNamespace ?? true;
  const xDefaultStrategy = options.xDefaultStrategy ?? { type: "loc" };
  const order = options.order ?? "preserve";
  const trailingSlash = options.trailingSlash ?? "preserve";

  const xmlWithNs = ensureNamespace ? ensureXhtmlNamespace(xml) : xml;

  const blocks = extractUrlBlocks(xmlWithNs);
  if (blocks.length === 0) return xmlWithNs;

  let out = xmlWithNs;

  for (const block of blocks) {
    const loc = extractLoc(block);
    if (!loc) continue;

    const links = extractXhtmlLinks(block);
    if (links.length === 0) continue;

    let nextBlock = block;

    if (!hasXDefault(block)) {
      const href = resolveXDefaultHref({
        loc,
        links,
        ...(options.baseUrl ? { baseUrl: options.baseUrl } : {}),
        strategy: xDefaultStrategy,
      });

      const linkXml = `<xhtml:link rel="alternate" hreflang="x-default" href="${xmlEscape(href)}" />`;
      nextBlock = insertXhtmlLink(nextBlock, linkXml);
    }

    // Apply reordering if needed
    if (order === "canonical-first") {
      nextBlock = reorderXhtmlLinks(nextBlock, {
        ...(options.canonicalLocale ? { canonicalLocale: options.canonicalLocale } : {}),
        order: "canonical-first",
      });
    }

    // Apply trailing slash normalization
    if (trailingSlash !== "preserve") {
      nextBlock = normalizeTrailingSlashInBlock(nextBlock, trailingSlash);
    }

    out = out.replace(block, nextBlock);
  }

  return out;
}

function resolveXDefaultHref(args: {
  loc: string;
  links: Array<{ hreflang: string; href: string }>;
  baseUrl?: string;
  strategy: XDefaultStrategy;
}): string {
  const { loc, links, baseUrl, strategy } = args;

  const locAbs = baseUrl ? resolveAbsoluteUrl(loc, baseUrl) : loc;
  const origin = isAbsolute(locAbs) ? getOriginFromAbsoluteUrl(locAbs) : baseUrl;

  if (strategy.type === "loc") return locAbs;
  if (strategy.type === "root") {
    if (!origin) return locAbs;
    return resolveAbsoluteUrl("/", origin);
  }
  if (strategy.type === "custom") {
    if (!origin) return strategy.url;
    return resolveAbsoluteUrl(strategy.url, origin);
  }
  if (strategy.type === "locale") {
    const found = links.find((l) => l.hreflang === strategy.locale)?.href;
    if (found) return baseUrl ? resolveAbsoluteUrl(found, baseUrl) : found;
    return locAbs;
  }
  const computed = strategy.resolve({ url: locAbs });
  if (!origin) return computed;
  return resolveAbsoluteUrl(computed, origin);
}

function isAbsolute(u: string): boolean {
  return u.startsWith("http://") || u.startsWith("https://");
}
