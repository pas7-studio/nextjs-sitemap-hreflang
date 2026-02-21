# @pas7/nextjs-sitemap-hreflang

[![CI](https://github.com/pas7-studio/nextjs-sitemap-hreflang/actions/workflows/ci.yml/badge.svg)](https://github.com/pas7-studio/nextjs-sitemap-hreflang/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/%40pas7%2Fnextjs-sitemap-hreflang.svg)](https://www.npmjs.com/package/@pas7/nextjs-sitemap-hreflang)
[![npm downloads](https://img.shields.io/npm/dm/%40pas7%2Fnextjs-sitemap-hreflang.svg)](https://www.npmjs.com/package/@pas7/nextjs-sitemap-hreflang)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

Routing-agnostic hreflang toolkit for Next.js sitemaps:
- build hreflang alternates for App Router `MetadataRoute.Sitemap`
- inject/fix hreflang directly in generated XML
- validate sitemap hreflang in CI
- support mixed content pipelines (`.ts`, `.json`, `.md/.mdx`, CMS)

## Install

```bash
npm i @pas7/nextjs-sitemap-hreflang
```

## Migration guide (unscoped -> scoped)

```bash
npm uninstall nextjs-sitemap-hreflang
npm i @pas7/nextjs-sitemap-hreflang
```

Update imports:

```ts
// before
import { withHreflang } from "nextjs-sitemap-hreflang";

// after
import { withHreflang } from "@pas7/nextjs-sitemap-hreflang";
```

CLI binary stays the same:

```bash
npx nextjs-sitemap-hreflang check --in public/sitemap.xml --fail-on-missing
```

## Quick start: App Router

```ts
import type { MetadataRoute } from "next";
import {
  withHreflangFromRouting,
  routingPrefixAsNeeded,
} from "@pas7/nextjs-sitemap-hreflang";

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

## Next.js App Router + static export (`sitemap.xml`)

Use library generation + XML validation in CI:

```bash
next build
npx nextjs-sitemap-hreflang check --in public/sitemap.xml --fail-on-missing
```

Optional postbuild fix step:

```bash
npx nextjs-sitemap-hreflang inject --in public/sitemap.xml --out public/sitemap.xml
```

## Universal manifest helper (`.ts` / `.json` / `.md`)

If your pipeline already outputs `slug + locales + date`, use:

```ts
import { createSitemapEntriesFromManifest } from "@pas7/nextjs-sitemap-hreflang";

const entries = createSitemapEntriesFromManifest(blogManifest, {
  baseUrl: "https://pas7.com.ua",
  sectionPath: "/blog",
  defaultLocale: "en",
  routeStyle: "locale-segment", // /blog/en/slug
});
```

## routingPAS7 with `suffixPaths` and `prefixPaths`

```ts
import { routingPAS7 } from "@pas7/nextjs-sitemap-hreflang";

const routing = routingPAS7({
  defaultLocale: "en",
  locales: ["en", "uk", "de"],
  // /blog/uk, /contact/uk
  suffixPaths: ["/blog", "/projects", "/services", "/cases", "/contact", "/about", "/privacy", "/terms"],
  // /uk/about (if needed for some sections)
  prefixPaths: ["/about"],
  // keeps highest priority for locale-segment detail pages
  detailPathPattern: /^\/(blog|projects|services|cases)\//,
});
```

Routing priority inside `routingPAS7`:
1. `detailPathPattern`
2. `suffixPaths` (or legacy `hubPaths`)
3. `prefixPaths`
4. fallback prefix-as-needed

## CLI

### inject

```bash
npx nextjs-sitemap-hreflang inject --in public/sitemap.xml \
  --x-default loc \
  --canonical-locale en \
  --order canonical-first \
  --trailing-slash never
```

### check

```bash
npx nextjs-sitemap-hreflang check --in public/sitemap.xml \
  --origin-policy same \
  --fail-on-missing
```

## Release and npm publish

Single workflow in `.github/workflows/ci.yml`:
1. add changeset (`npm run changeset`)
2. push to `main`
3. workflow runs `ci -> release`
4. version/tag/release/npm publish are automated

Required secret: `NPM_TOKEN`.

## Contribution policy (required)

- Any user-facing code change must include a changeset (`.changeset/*.md`).
- Any API/feature behavior change must include `README.md` updates in the same PR.
- CI enforces both rules on pull requests.

## Maintained by PAS7 Studio

- Website: https://pas7.com.ua/
- Blog: https://pas7.com.ua/blog
- Contact: https://pas7.com.ua/contact

## License

MIT, PAS7 Studio
