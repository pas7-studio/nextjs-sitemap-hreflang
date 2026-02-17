import { describe, expect, it } from "vitest";
import { injectXDefaultIntoSitemapXml } from "../src/xml/inject.js";
import { checkSitemapXmlHreflang } from "../src/xml/check.js";

describe("xml inject/check", () => {
  it("injects x-default into url blocks that have hreflang links", () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <url>
    <loc>https://example.com/blog</loc>
    <xhtml:link rel="alternate" hreflang="en" href="https://example.com/blog" />
    <xhtml:link rel="alternate" hreflang="uk" href="https://example.com/blog/uk" />
    <lastmod>2026-02-01</lastmod>
  </url>
</urlset>`;

    const out = injectXDefaultIntoSitemapXml(xml, { xDefaultStrategy: { type: "loc" } });
    expect(out.includes(`hreflang="x-default"`)).toBe(true);

    const report = checkSitemapXmlHreflang(out, {});
    expect(report.ok).toBe(true);
  });

  it("fails check when x-default missing and multiple hreflang links exist", () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <url>
    <loc>https://example.com/blog</loc>
    <xhtml:link rel="alternate" hreflang="en" href="https://example.com/blog" />
    <xhtml:link rel="alternate" hreflang="uk" href="https://example.com/blog/uk" />
  </url>
</urlset>`;

    const report = checkSitemapXmlHreflang(xml, { requireXDefaultWhenMultiple: true });
    expect(report.ok).toBe(false);
  });
});
