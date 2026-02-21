import { describe, expect, it } from "vitest";
import { withHreflang, withHreflangFromRouting } from "../src/lib/withHreflang.js";
import {
  routingPrefixAsNeeded,
  routingPrefixAlways,
  routingSuffixLocale,
  routingDomainBased,
  routingPAS7,
} from "../src/lib/routing.js";
import type { SitemapEntryLike } from "../src/lib/types.js";

describe("withHreflang", () => {
  it("adds x-default when missing", () => {
    const entries = [
      {
        url: "https://example.com/blog",
        alternates: {
          languages: {
            en: "https://example.com/blog",
            uk: "https://example.com/blog/uk",
          },
        },
      },
    ];

    const out = withHreflang(entries, { ensureXDefault: true, xDefaultStrategy: { type: "loc" } });
    expect(out.length).toBe(1);
    const first = out[0]!;
    const languages = first.alternates!.languages as Record<string, string>;
    expect(languages["x-default"]).toBe("https://example.com/blog");
  });

  it("ensures self when canonicalLocale provided", () => {
    const entries = [
      {
        url: "https://example.com/blog",
        alternates: { languages: { uk: "https://example.com/blog/uk" } },
      },
    ];

    const out = withHreflang(entries, { ensureSelf: true, canonicalLocale: "en" });
    expect(out.length).toBe(1);
    const first = out[0]!;
    const languages = first.alternates!.languages as Record<string, string>;
    expect(languages["en"]).toBe("https://example.com/blog");
  });
});

describe("routing strategies", () => {
  describe("routingPrefixAsNeeded", () => {
    it("generates correct URLs for default locale without prefix", () => {
      const strategy = routingPrefixAsNeeded({
        defaultLocale: "en",
        locales: ["en", "uk", "de"],
      });

      const entries: SitemapEntryLike[] = [{ url: "https://example.com/about" }];
      const result = withHreflangFromRouting(entries, strategy, {
        baseUrl: "https://example.com",
      });

      expect(result[0]?.alternates?.languages?.en).toBe("https://example.com/about");
      expect(result[0]?.alternates?.languages?.uk).toBe("https://example.com/uk/about");
      expect(result[0]?.alternates?.languages?.de).toBe("https://example.com/de/about");
      expect(result[0]?.alternates?.languages?.["x-default"]).toBe("https://example.com/about");
    });
  });

  describe("routingPrefixAlways", () => {
    it("generates correct URLs with all locale prefixes", () => {
      const strategy = routingPrefixAlways({
        defaultLocale: "en",
        locales: ["en", "uk", "de"],
      });

      const entries: SitemapEntryLike[] = [{ url: "https://example.com/about" }];
      const result = withHreflangFromRouting(entries, strategy, {
        baseUrl: "https://example.com",
      });

      expect(result[0]?.alternates?.languages?.en).toBe("https://example.com/en/about");
      expect(result[0]?.alternates?.languages?.uk).toBe("https://example.com/uk/about");
      expect(result[0]?.alternates?.languages?.de).toBe("https://example.com/de/about");
    });
  });

  describe("routingSuffixLocale", () => {
    it("generates correct URLs with locale as suffix", () => {
      const strategy = routingSuffixLocale({
        defaultLocale: "en",
        locales: ["en", "uk", "de"],
      });

      const entries: SitemapEntryLike[] = [{ url: "https://example.com/blog" }];
      const result = withHreflangFromRouting(entries, strategy, {
        baseUrl: "https://example.com",
      });

      expect(result[0]?.alternates?.languages?.en).toBe("https://example.com/blog");
      expect(result[0]?.alternates?.languages?.uk).toBe("https://example.com/blog/uk");
      expect(result[0]?.alternates?.languages?.de).toBe("https://example.com/blog/de");
    });
  });

  describe("routingDomainBased", () => {
    it("generates correct URLs with different domains", () => {
      const strategy = routingDomainBased({
        defaultLocale: "en",
        locales: ["en", "de", "uk"],
        localeToDomain: {
          en: "https://example.com",
          de: "https://example.de",
          uk: "https://example.ua",
        },
      });

      const entries: SitemapEntryLike[] = [{ url: "https://example.com/about" }];
      const result = withHreflangFromRouting(entries, strategy, {
        baseUrl: "https://example.com",
      });

      expect(result[0]?.alternates?.languages?.en).toBe("https://example.com/about");
      expect(result[0]?.alternates?.languages?.de).toBe("https://example.de/about");
      expect(result[0]?.alternates?.languages?.uk).toBe("https://example.ua/about");
    });
  });

  describe("routingPAS7", () => {
    it("generates correct URLs for home pages", () => {
      const strategy = routingPAS7({
        defaultLocale: "en",
        locales: ["en", "uk", "de"],
      });

      const entries: SitemapEntryLike[] = [{ url: "https://example.com/" }];
      const result = withHreflangFromRouting(entries, strategy, {
        baseUrl: "https://example.com",
      });

      expect(result[0]?.alternates?.languages?.en).toBe("https://example.com/");
      expect(result[0]?.alternates?.languages?.uk).toBe("https://example.com/uk");
      expect(result[0]?.alternates?.languages?.de).toBe("https://example.com/de");
    });

    it("generates correct URLs for hub pages (suffix pattern)", () => {
      const strategy = routingPAS7({
        defaultLocale: "en",
        locales: ["en", "uk", "de"],
        hubPaths: ["/blog", "/projects"],
      });

      const entries: SitemapEntryLike[] = [{ url: "https://example.com/blog" }];
      const result = withHreflangFromRouting(entries, strategy, {
        baseUrl: "https://example.com",
      });

      expect(result[0]?.alternates?.languages?.en).toBe("https://example.com/blog");
      expect(result[0]?.alternates?.languages?.uk).toBe("https://example.com/blog/uk");
      expect(result[0]?.alternates?.languages?.de).toBe("https://example.com/blog/de");
    });

    it("generates correct URLs for detail pages (segment pattern)", () => {
      const strategy = routingPAS7({
        defaultLocale: "en",
        locales: ["en", "uk", "de"],
      });

      const entries: SitemapEntryLike[] = [{ url: "https://example.com/blog/en/my-article" }];
      const result = withHreflangFromRouting(entries, strategy, {
        baseUrl: "https://example.com",
      });

      expect(result[0]?.alternates?.languages?.en).toBe("https://example.com/blog/en/my-article");
      expect(result[0]?.alternates?.languages?.uk).toBe("https://example.com/blog/uk/my-article");
      expect(result[0]?.alternates?.languages?.de).toBe("https://example.com/blog/de/my-article");
    });
  });
});
