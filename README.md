# nextjs-sitemap-hreflang

[![CI](https://github.com/pas7-studio/nextjs-sitemap-hreflang/actions/workflows/ci.yml/badge.svg)](https://github.com/pas7-studio/nextjs-sitemap-hreflang/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/nextjs-sitemap-hreflang.svg)](https://www.npmjs.com/package/nextjs-sitemap-hreflang)
[![npm downloads](https://img.shields.io/npm/dm/nextjs-sitemap-hreflang.svg)](https://www.npmjs.com/package/nextjs-sitemap-hreflang)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

Routing-agnostic hreflang toolkit for Next.js sitemaps:
- Build hreflang alternates for App Router `MetadataRoute.Sitemap`
- Inject/fix hreflang directly in generated XML
- Validate sitemap hreflang in CI
- Support different i18n URL patterns and content pipelines (`.ts`, `.json`, `.md/.mdx`, CMS)

## Install

```bash
npm i nextjs-sitemap-hreflang
```

## Why this package

`nextjs-sitemap-hreflang` is built for real production SEO workflows where teams have mixed routing and mixed content storage:
- `next-intl`, `next-i18next`, custom i18n
- static/generated content from TypeScript, JSON manifests, Markdown/MDX, or external CMS
- need both library-time and postbuild XML-time safety

## Quick Start

### 1) App Router sitemap with routing strategy

```ts
import type { MetadataRoute } from "next";
import { withHreflangFromRouting, routingPrefixAsNeeded } from "nextjs-sitemap-hreflang";

const routing = routingPrefixAsNeeded({
  defaultLocale: "en",
  locales: ["en", "uk", "de"],
});

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [
    { url: "https://example.com/blog" },
    { url: "https://example.com/about" },
  ];

  return withHreflangFromRouting(entries, routing, {
    baseUrl: "https://example.com",
    ensureXDefault: true,
  });
}
```

### 2) Universal manifest helper (`.ts` / `.json` / `.md` compatible)

If your pipeline already produces a manifest (`slug + locales + dates`), use:

```ts
import { createSitemapEntriesFromManifest } from "nextjs-sitemap-hreflang";

const blogManifest = [
  {
    slug: "nestjs-request-context-als-2026",
    locales: ["en", "uk", "de", "it", "hr"],
    updatedAt: "2026-02-08",
  },
];

const entries = createSitemapEntriesFromManifest(blogManifest, {
  baseUrl: "https://pas7.com.ua",
  sectionPath: "/blog",
  defaultLocale: "en",
  routeStyle: "locale-segment", // /blog/en/slug, /blog/uk/slug
});
```

### 3) Postbuild XML fixer + validator

```bash
npx nextjs-sitemap-hreflang inject --in public/sitemap.xml --out public/sitemap.xml
npx nextjs-sitemap-hreflang check --in public/sitemap.xml --fail-on-missing
```

## Routing Strategies

Use built-in strategies or custom routing:
- `routingPrefixAsNeeded`
- `routingPrefixAlways`
- `routingSuffixLocale`
- `routingDomainBased`
- `routingPAS7`
- `routingCustom`

## New Universal Manifest API

`createSitemapEntriesFromManifest(items, options)` converts locale-aware manifest records into hreflang-ready entries.

Supported route styles:
- `prefix-as-needed`
- `prefix-always`
- `suffix-locale`
- `locale-segment`

You can fully override URL generation with `pathnameFor(...)`.

### Example: custom hybrid URLs

```ts
const entries = createSitemapEntriesFromManifest(manifest, {
  baseUrl: "https://example.com",
  sectionPath: "/content",
  defaultLocale: "en",
  pathnameFor: ({ slug, locale, defaultLocale }) =>
    locale === defaultLocale ? `/articles/${slug}` : `/articles/${slug}.${locale}`,
});
```

## CLI

### `inject`

Add `x-default`, normalize order, and ensure namespace in sitemap XML.

```bash
npx nextjs-sitemap-hreflang inject --in public/sitemap.xml \
  --x-default loc \
  --canonical-locale en \
  --order canonical-first \
  --trailing-slash never
```

### `check`

Validate hreflang in sitemap XML.

```bash
npx nextjs-sitemap-hreflang check --in public/sitemap.xml \
  --origin-policy same \
  --fail-on-missing
```

## CI Integration

```yaml
- name: Check sitemap hreflang
  run: npx nextjs-sitemap-hreflang check --in public/sitemap.xml --fail-on-missing
```

## Release and npm Publish

This repository uses a single CI workflow (`.github/workflows/ci.yml`) with a direct release flow:

1. Add a changeset when behavior/API changes:

```bash
npm run changeset
```

2. Push/merge to `main`.
3. Workflow runs `ci -> release`:
   - applies `changeset version`
   - commits version/changelog to `main`
   - creates git tag + GitHub release
   - publishes to npm

Required secret: `NPM_TOKEN`.

## Project Roadmap

See `docs/OPEN_SOURCE_VISION.md` for roadmap and architecture direction.

## Maintained by PAS7 Studio

- Website: https://pas7.com.ua/
- Blog: https://pas7.com.ua/blog
- Contact: https://pas7.com.ua/contact

## License

MIT, PAS7 Studio
