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
npx nextjs-sitemap-hreflang check --fail-on-missing
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
npx nextjs-sitemap-hreflang check --fail-on-missing
```

Optional postbuild fix step:

```bash
npx nextjs-sitemap-hreflang inject --out public/sitemap.xml
```

Auto-detect order when `--in` is not provided:
1. `public/sitemap.xml`
2. `out/sitemap.xml`
3. `sitemap.xml`

Prefer explicit source when needed:

```bash
npx nextjs-sitemap-hreflang check --fail-on-missing --prefer out
npx nextjs-sitemap-hreflang inject --prefer public --out public/sitemap.xml
```

Generate machine-readable CI report:

```bash
npx nextjs-sitemap-hreflang check --fail-on-missing --prefer out --json > report.json
```

## Next.js Full SEO Stack (App Router)

`app/sitemap.ts`:

```ts
import type { MetadataRoute } from "next";
import { routingPAS7, withHreflangFromRouting } from "@pas7/nextjs-sitemap-hreflang";

const baseUrl = "https://example.com";

const routing = routingPAS7({
  defaultLocale: "en",
  locales: ["en", "uk", "de", "it", "hr"],
  suffixPaths: ["/blog", "/projects", "/services", "/cases", "/contact", "/about", "/privacy", "/terms"],
  detailPathPattern: /^\/(blog|projects|services|cases)\//,
});

export default function sitemap(): MetadataRoute.Sitemap {
  return withHreflangFromRouting(
    [
      { url: `${baseUrl}/` },
      { url: `${baseUrl}/blog` },
      { url: `${baseUrl}/blog/en/hello-world` },
      { url: `${baseUrl}/contact` },
    ],
    routing,
    { baseUrl, ensureXDefault: true },
  );
}
```

`app/robots.ts`:

```ts
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: "https://example.com/sitemap.xml",
  };
}
```

CI script:

```bash
next build
npx nextjs-sitemap-hreflang check --fail-on-missing
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

If your content keeps images in nested fields (for example `hero.cover` + section screenshots), pass `imagesFor` so the sitemap entry includes all image URLs:

```ts
const entries = createSitemapEntriesFromManifest(posts, {
  baseUrl: "https://pas7.com.ua",
  sectionPath: "/blog",
  defaultLocale: "en",
  routeStyle: "locale-segment",
  imagesFor: (post) => [
    post.hero.cover.src,
    ...post.sections.flatMap((section) => section.screenshots?.map((s) => s.src) ?? []),
  ],
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

Hybrid recipes:
- Home pages: prefix-as-needed (`/`, `/uk`, `/de`)
- Content hubs and static pages: suffix locale (`/blog/uk`, `/contact/uk`)
- Detail pages: locale segment (`/blog/en/slug`, `/blog/uk/slug`)
- Optional mixed prefix pages via `prefixPaths` (`/uk/about`)

Routing priority inside `routingPAS7`:
1. `detailPathPattern`
2. `suffixPaths` (or legacy `hubPaths`)
3. `prefixPaths`
4. fallback prefix-as-needed

## CLI

### inject

```bash
npx nextjs-sitemap-hreflang inject \
  --x-default loc \
  --canonical-locale en \
  --prefer public \
  --order canonical-first \
  --trailing-slash never
```

### check

```bash
npx nextjs-sitemap-hreflang check \
  --prefer out \
  --origin-policy same \
  --fail-on-missing
```

### JSON report format

`--json` output is stable and includes:
- `ok`
- `issues[]` (with `code`, `entryUrl`, `message`, `suggestion`)
- `summary.byCode`
- `inputPath`
- `timingMs`

### Exit codes

- `0`: OK
- `2`: validation errors (`--fail-on-missing`)
- `4`: input not found
- `5`: invalid XML input

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
