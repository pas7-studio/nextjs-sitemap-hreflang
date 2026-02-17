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
