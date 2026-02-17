# nextjs-sitemap-hreflang

Add and validate `hreflang` alternates + `x-default` for Next.js sitemaps (App Router / MetadataRoute) with a tiny library + CLI postbuild fixer.

## Install

```bash
npm i nextjs-sitemap-hreflang
```

## Next.js App Router usage (app/sitemap.ts)

```typescript
import type { MetadataRoute } from "next";
import { withHreflang } from "nextjs-sitemap-hreflang";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [
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

  return withHreflang(entries, {
    ensureXDefault: true,
    xDefaultStrategy: { type: "loc" },
    ensureAbsolute: true,
  });
}
```

## CLI postbuild (inject/check)

Inject x-default into an existing sitemap.xml:

```bash
npx nextjs-sitemap-hreflang inject --in public/sitemap.xml --x-default loc
```

Check in CI:

```bash
npx nextjs-sitemap-hreflang check --in public/sitemap.xml --fail-on-missing
```
