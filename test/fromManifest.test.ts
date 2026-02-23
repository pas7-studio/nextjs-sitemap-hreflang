import { describe, expect, it } from "vitest";
import { createSitemapEntriesFromManifest } from "../src/lib/fromManifest.js";

describe("createSitemapEntriesFromManifest", () => {
  const items = [
    {
      slug: "nestjs-request-context-als-2026",
      locales: ["en", "uk", "de"],
      updatedAt: "2026-02-08",
    },
  ];

  it("builds locale-segment style entries for manifest-driven blogs", () => {
    const result = createSitemapEntriesFromManifest(items, {
      baseUrl: "https://pas7.com.ua",
      sectionPath: "/blog",
      defaultLocale: "en",
      routeStyle: "locale-segment",
    });

    expect(result).toHaveLength(1);
    expect(result[0]?.url).toBe("https://pas7.com.ua/blog/en/nestjs-request-context-als-2026");
    expect(result[0]?.alternates?.languages?.en).toBe(
      "https://pas7.com.ua/blog/en/nestjs-request-context-als-2026",
    );
    expect(result[0]?.alternates?.languages?.uk).toBe(
      "https://pas7.com.ua/blog/uk/nestjs-request-context-als-2026",
    );
    expect(result[0]?.alternates?.languages?.["x-default"]).toBe(
      "https://pas7.com.ua/blog/en/nestjs-request-context-als-2026",
    );
  });

  it("supports suffix-locale style and preserves default locale without suffix", () => {
    const result = createSitemapEntriesFromManifest(items, {
      baseUrl: "https://example.com",
      sectionPath: "blog",
      defaultLocale: "en",
      routeStyle: "suffix-locale",
    });

    expect(result[0]?.alternates?.languages?.en).toBe(
      "https://example.com/blog/nestjs-request-context-als-2026",
    );
    expect(result[0]?.alternates?.languages?.uk).toBe(
      "https://example.com/blog/nestjs-request-context-als-2026/uk",
    );
  });

  it("supports custom pathname resolver for JSON/MD/TS hybrid projects", () => {
    const result = createSitemapEntriesFromManifest(items, {
      baseUrl: "https://example.com",
      sectionPath: "/content",
      defaultLocale: "en",
      pathnameFor: ({ slug, locale, defaultLocale }) =>
        locale === defaultLocale ? `/articles/${slug}` : `/articles/${slug}.${locale}`,
    });

    expect(result[0]?.alternates?.languages?.en).toBe(
      "https://example.com/articles/nestjs-request-context-als-2026",
    );
    expect(result[0]?.alternates?.languages?.uk).toBe(
      "https://example.com/articles/nestjs-request-context-als-2026.uk",
    );
  });

  it("supports extracting multiple sitemap images from nested content objects", () => {
    const richItems = [
      {
        slug: "nodejs-25-whats-new",
        locales: ["en", "uk"],
        updatedAt: "2026-02-22",
        hero: {
          cover: { src: "/images/blog/nodejs-25-whats-new/cover.webp" },
        },
        sections: [
          {
            screenshots: [
              { src: "/images/blog/nodejs-25-whats-new/a.webp" },
              { src: "/images/blog/nodejs-25-whats-new/b.webp" },
            ],
          },
          {
            screenshots: [{ src: "/images/blog/nodejs-25-whats-new/b.webp" }],
          },
        ],
      },
    ];

    const result = createSitemapEntriesFromManifest(richItems, {
      baseUrl: "https://pas7.com.ua",
      sectionPath: "/blog",
      defaultLocale: "en",
      routeStyle: "locale-segment",
      imagesFor: (item) => [
        item.hero.cover.src,
        ...item.sections.flatMap((section) => section.screenshots.map((shot) => shot.src)),
      ],
    });

    expect(result[0]?.images).toEqual([
      "/images/blog/nodejs-25-whats-new/cover.webp",
      "/images/blog/nodejs-25-whats-new/a.webp",
      "/images/blog/nodejs-25-whats-new/b.webp",
    ]);
  });
});
