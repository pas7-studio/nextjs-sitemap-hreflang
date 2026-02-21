import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { injectXDefaultIntoSitemapXml } from "../src/xml/inject.js";
import { checkSitemapXmlHreflang } from "../src/xml/check.js";
import { normalizeTrailingSlashInBlock, reorderXhtmlLinks } from "../src/xml/xml.js";

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

    const report = checkSitemapXmlHreflang(out, {
      requireXDefaultWhenMultiple: true,
      checkDuplicateKeys: true,
      checkDuplicateHrefs: true,
      checkHreflangCasing: true,
    });
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

describe("fixtures", () => {
  it("injects x-default into pas7-sitemap-snippet without breaking image:image", () => {
    const fixturePath = path.join(__dirname, "fixtures/pas7-sitemap-snippet.xml");
    const xml = fs.readFileSync(fixturePath, "utf8");

    const out = injectXDefaultIntoSitemapXml(xml, { xDefaultStrategy: { type: "loc" } });

    // Check that x-default is added
    expect(out.includes(`hreflang="x-default"`)).toBe(true);

    // Check that image:image is not broken
    expect(out.includes("<image:image>")).toBe(true);
    expect(out.includes("<image:loc>https://example.com/images/blog-hero.jpg</image:loc>")).toBe(true);
    expect(out.includes("<image:title>Blog Hero Image</image:title>")).toBe(true);

    // Check that check passes
    const report = checkSitemapXmlHreflang(out, {
      requireXDefaultWhenMultiple: true,
      checkDuplicateKeys: true,
      checkDuplicateHrefs: true,
      checkHreflangCasing: true,
    });
    expect(report.ok).toBe(true);
  });

  it("detects duplicate hreflang keys", () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <url>
    <loc>https://example.com/page</loc>
    <xhtml:link rel="alternate" hreflang="en" href="https://example.com/page" />
    <xhtml:link rel="alternate" hreflang="en" href="https://example.com/page/en" />
  </url>
</urlset>`;

    const report = checkSitemapXmlHreflang(xml, { checkDuplicateKeys: true });
    expect(report.ok).toBe(false);
    expect(report.issues.some((i) => i.code === "DUPLICATE_HREFLANG_KEY")).toBe(true);
  });

  it("detects invalid hreflang casing", () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <url>
    <loc>https://example.com/page</loc>
    <xhtml:link rel="alternate" hreflang="EN" href="https://example.com/page" />
    <xhtml:link rel="alternate" hreflang="uk-UA" href="https://example.com/page/uk" />
  </url>
</urlset>`;

    const report = checkSitemapXmlHreflang(xml, { checkHreflangCasing: true });
    expect(report.ok).toBe(false);
    expect(report.issues.some((i) => i.code === "INVALID_HREFLANG_CASING")).toBe(true);
  });
});

describe("trailing slash normalization", () => {
  it("adds trailing slash when policy is always", () => {
    const block = `<url>
    <loc>https://example.com/page</loc>
    <xhtml:link rel="alternate" hreflang="en" href="https://example.com/page" />
    <xhtml:link rel="alternate" hreflang="uk" href="https://example.com/page/uk" />
  </url>`;

    const result = normalizeTrailingSlashInBlock(block, "always");
    expect(result.includes(`<loc>https://example.com/page/</loc>`)).toBe(true);
    expect(result.includes(`href="https://example.com/page/"`)).toBe(true);
    expect(result.includes(`href="https://example.com/page/uk/"`)).toBe(true);
  });

  it("removes trailing slash when policy is never", () => {
    const block = `<url>
    <loc>https://example.com/page/</loc>
    <xhtml:link rel="alternate" hreflang="en" href="https://example.com/page/" />
    <xhtml:link rel="alternate" hreflang="uk" href="https://example.com/page/uk/" />
  </url>`;

    const result = normalizeTrailingSlashInBlock(block, "never");
    expect(result.includes(`<loc>https://example.com/page</loc>`)).toBe(true);
    expect(result.includes(`href="https://example.com/page"`)).toBe(true);
    expect(result.includes(`href="https://example.com/page/uk"`)).toBe(true);
  });

  it("preserves trailing slash when policy is preserve", () => {
    const block = `<url>
    <loc>https://example.com/page/</loc>
    <xhtml:link rel="alternate" hreflang="en" href="https://example.com/page/" />
  </url>`;

    const result = normalizeTrailingSlashInBlock(block, "preserve");
    expect(result).toBe(block);
  });
});

describe("reorder xhtml links", () => {
  it("places canonical first and x-default last", () => {
    const block = `<url>
    <loc>https://example.com/page</loc>
    <xhtml:link rel="alternate" hreflang="uk" href="https://example.com/page/uk" />
    <xhtml:link rel="alternate" hreflang="x-default" href="https://example.com/page" />
    <xhtml:link rel="alternate" hreflang="en" href="https://example.com/page" />
  </url>`;

    const result = reorderXhtmlLinks(block, { canonicalLocale: "en", order: "canonical-first" });

    // en should be first after loc
    const enIdx = result.indexOf('hreflang="en"');
    const ukIdx = result.indexOf('hreflang="uk"');
    const xDefaultIdx = result.indexOf('hreflang="x-default"');

    expect(enIdx).toBeLessThan(ukIdx);
    expect(ukIdx).toBeLessThan(xDefaultIdx);
  });

  it("preserves order when order is preserve", () => {
    const block = `<url>
    <loc>https://example.com/page</loc>
    <xhtml:link rel="alternate" hreflang="uk" href="https://example.com/page/uk" />
    <xhtml:link rel="alternate" hreflang="en" href="https://example.com/page" />
  </url>`;

    const result = reorderXhtmlLinks(block, { order: "preserve" });
    expect(result).toBe(block);
  });
});

describe("origin policy", () => {
  it("detects inconsistent origins with same policy", () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <url>
    <loc>https://example.com/page</loc>
    <xhtml:link rel="alternate" hreflang="en" href="https://example.com/page" />
    <xhtml:link rel="alternate" hreflang="uk" href="https://other.com/page/uk" />
  </url>
</urlset>`;

    const report = checkSitemapXmlHreflang(xml, { originPolicy: "same" });
    expect(report.ok).toBe(false);
    expect(report.issues.some((i) => i.code === "INCONSISTENT_ORIGIN")).toBe(true);
  });

  it("allows only whitelisted origins with allowlist policy", () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <url>
    <loc>https://example.com/page</loc>
    <xhtml:link rel="alternate" hreflang="en" href="https://example.com/page" />
    <xhtml:link rel="alternate" hreflang="uk" href="https://allowed.com/page/uk" />
    <xhtml:link rel="alternate" hreflang="x-default" href="https://example.com/page" />
  </url>
</urlset>`;

    const report = checkSitemapXmlHreflang(xml, {
      originPolicy: "allowlist",
      allowedOrigins: ["https://example.com", "https://allowed.com"],
      requireXDefaultWhenMultiple: true,
    });
    expect(report.ok).toBe(true);
  });
});
