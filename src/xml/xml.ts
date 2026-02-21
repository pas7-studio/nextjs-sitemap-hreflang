export function xmlEscape(input: string): string {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export function hasXhtmlNamespace(xml: string): boolean {
  return /<urlset[^>]*\sxmlns:xhtml="http:\/\/www\.w3\.org\/1999\/xhtml"[^>]*>/.test(xml);
}

export function ensureXhtmlNamespace(xml: string): string {
  if (hasXhtmlNamespace(xml)) return xml;
  return xml.replace(
    /<urlset(\s[^>]*?)?>/m,
    (m) => (m.includes("xmlns:xhtml=") ? m : m.replace("<urlset", '<urlset xmlns:xhtml="http://www.w3.org/1999/xhtml"')),
  );
}

export function extractUrlBlocks(xml: string): string[] {
  return xml.match(/<url>[\s\S]*?<\/url>/g) ?? [];
}

export function extractLoc(urlBlock: string): string | null {
  return urlBlock.match(/<loc>([^<]+)<\/loc>/)?.[1]?.trim() ?? null;
}

export function extractXhtmlLinks(urlBlock: string): Array<{ hreflang: string; href: string }> {
  const out: Array<{ hreflang: string; href: string }> = [];
  const re = /<xhtml:link[^>]*\shreflang="([^"]+)"[^>]*\shref="([^"]+)"[^>]*\/>/g;
  for (const m of urlBlock.matchAll(re)) {
    if (m[1] !== undefined && m[2] !== undefined) {
      out.push({ hreflang: m[1], href: m[2] });
    }
  }
  return out;
}

export function hasXDefault(urlBlock: string): boolean {
  return /<xhtml:link[^>]*\shreflang="x-default"[^>]*\/>/.test(urlBlock);
}

export function insertXhtmlLink(urlBlock: string, linkXml: string): string {
  const lastLinkIdx = urlBlock.lastIndexOf("<xhtml:link");
  if (lastLinkIdx === -1) {
    const locEnd = urlBlock.indexOf("</loc>");
    if (locEnd === -1) return urlBlock;
    const insertPos = locEnd + "</loc>".length;
    return `${urlBlock.slice(0, insertPos)}\n    ${linkXml}${urlBlock.slice(insertPos)}`;
  }
  const lineEnd = urlBlock.indexOf("\n", lastLinkIdx);
  if (lineEnd === -1) return `${urlBlock}\n    ${linkXml}`;
  return `${urlBlock.slice(0, lineEnd)}\n    ${linkXml}${urlBlock.slice(lineEnd)}`;
}

export type ReorderOptions = {
  canonicalLocale?: string;
  order: "canonical-first" | "preserve";
};

export function reorderXhtmlLinks(urlBlock: string, options: ReorderOptions): string {
  if (options.order === "preserve") return urlBlock;

  const links = extractXhtmlLinks(urlBlock);
  if (links.length === 0) return urlBlock;

  const loc = extractLoc(urlBlock);

  // Determine canonical
  let canonical: { hreflang: string; href: string } | undefined;
  if (options.canonicalLocale) {
    canonical = links.find((l) => l.hreflang === options.canonicalLocale);
  }
  if (!canonical && loc) {
    canonical = links.find((l) => l.href === loc);
  }

  // Split into groups
  const canonicalLinks = canonical ? [canonical] : [];
  const otherLinks = links.filter((l) => l !== canonical && l.hreflang !== "x-default");
  const xDefaultLinks = links.filter((l) => l.hreflang === "x-default");

  // Build new order
  const orderedLinks = [...canonicalLinks, ...otherLinks, ...xDefaultLinks];

  // Remove all existing xhtml:link and insert in new order
  const newBlock = urlBlock.replace(/<xhtml:link[^>]*\/>\s*/g, "");

  // Find position after </loc>
  const locEnd = newBlock.indexOf("</loc>");
  if (locEnd === -1) return urlBlock;

  const insertPos = locEnd + "</loc>".length;
  const linksXml = orderedLinks
    .map((l) => `\n    <xhtml:link rel="alternate" hreflang="${xmlEscape(l.hreflang)}" href="${xmlEscape(l.href)}" />`)
    .join("");

  return `${newBlock.slice(0, insertPos)}${linksXml}\n  ${newBlock.slice(insertPos).trimStart()}`;
}

export function normalizeTrailingSlashInBlock(
  urlBlock: string,
  policy: "preserve" | "always" | "never",
): string {
  if (policy === "preserve") return urlBlock;

  // Normalize <loc>
  let result = urlBlock.replace(/<loc>([^<]+)<\/loc>/g, (_, url: string) => {
    return `<loc>${applyTrailingSlashPolicy(url, policy)}</loc>`;
  });

  // Normalize href in xhtml:link
  result = result.replace(
    /(<xhtml:link[^>]*href=")([^"]+)("[^>]*\/>)/g,
    (_, prefix: string, url: string, suffix: string) => {
      return `${prefix}${applyTrailingSlashPolicy(url, policy)}${suffix}`;
    },
  );

  return result;
}

function applyTrailingSlashPolicy(url: string, policy: "always" | "never"): string {
  try {
    const u = new URL(url);
    if (policy === "always" && !u.pathname.endsWith("/")) {
      u.pathname += "/";
    } else if (policy === "never" && u.pathname !== "/" && u.pathname.endsWith("/")) {
      u.pathname = u.pathname.slice(0, -1);
    }
    return u.toString();
  } catch {
    return url;
  }
}
