# nextjs-sitemap-hreflang

Add and validate `hreflang` alternates + `x-default` for Next.js sitemaps (App Router / MetadataRoute) with a tiny library + CLI postbuild fixer.

**Features:**
- 🔄 Routing-agnostic: works with any i18n setup (next-intl, next-i18next, custom)
- 📦 Library for Next.js App Router sitemap (`app/sitemap.ts`)
- 🛠️ CLI for postbuild processing (`inject` and `check` commands)
- ✅ Comprehensive validation (duplicates, casing, origin policy)
- 🎯 Multiple routing presets (prefix-as-needed, prefix-always, domain-based, suffix-locale)

## Install

```bash
npm i nextjs-sitemap-hreflang
```

## Quick Start

### Next.js App Router (app/sitemap.ts)

#### Option 1: With routing strategy (recommended)

```typescript
import type { MetadataRoute } from "next";
import { withHreflangFromRouting, routingPrefixAsNeeded } from "nextjs-sitemap-hreflang";

// Define your routing strategy
const routing = routingPrefixAsNeeded({
  defaultLocale: "en",
  locales: ["en", "uk", "de", "it"],
});

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [
    { url: "https://example.com/blog", lastModified: new Date() },
    { url: "https://example.com/about", lastModified: new Date() },
  ];

  return withHreflangFromRouting(entries, routing, {
    baseUrl: "https://example.com",
    ensureXDefault: true,
  });
}
```

#### Option 2: Manual alternates

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
          de: "https://example.com/blog/de",
        },
      },
    },
  ];

  return withHreflang(entries, {
    ensureXDefault: true,
    xDefaultStrategy: { type: "loc" },
  });
}
```

## Routing Strategies

### prefix-as-needed (next-intl compatible)

Default locale has no prefix, others have `/locale` prefix:

```typescript
import { routingPrefixAsNeeded } from "nextjs-sitemap-hreflang";

const routing = routingPrefixAsNeeded({
  defaultLocale: "en",
  locales: ["en", "uk", "de"],
});
// /about → en: /about, uk: /uk/about, de: /de/about
```

### prefix-always

All locales have `/locale` prefix:

```typescript
import { routingPrefixAlways } from "nextjs-sitemap-hreflang";

const routing = routingPrefixAlways({
  defaultLocale: "en",
  locales: ["en", "uk", "de"],
});
// /about → en: /en/about, uk: /uk/about, de: /de/about
```

### suffix-locale

Locale added as suffix (common for blogs):

```typescript
import { routingSuffixLocale } from "nextjs-sitemap-hreflang";

const routing = routingSuffixLocale({
  defaultLocale: "en",
  locales: ["en", "uk", "de"],
});
// /blog → en: /blog, uk: /blog/uk, de: /blog/de
```

### domain-based

Each locale has its own domain:

```typescript
import { routingDomainBased } from "nextjs-sitemap-hreflang";

const routing = routingDomainBased({
  defaultLocale: "en",
  locales: ["en", "de", "uk"],
  localeToDomain: {
    en: "https://example.com",
    de: "https://example.de",
    uk: "https://example.ua",
  },
});
// /about → en: example.com/about, de: example.de/about, uk: example.ua/about
```

### Custom routing

```typescript
import { routingCustom } from "nextjs-sitemap-hreflang";

const routing = routingCustom({
  locales: ["en", "uk"],
  canonicalLocale: "en",
  hrefFor: ({ pathname, locale }) => {
    // Your custom logic
    if (locale === "en") return pathname;
    return `/uk${pathname}`;
  },
});
```

### PAS7 routing (custom scheme)

For PAS7-style routing with mixed prefix/suffix patterns:

```typescript
import { routingPAS7 } from "nextjs-sitemap-hreflang";

const routing = routingPAS7({
  defaultLocale: "en",
  locales: ["en", "uk", "de", "it", "hr"],
  hubPaths: ["/blog", "/projects", "/services", "/cases"],
});
// Home: / (en), /uk, /de
// Hubs: /blog (en), /blog/uk, /blog/de
// Details: /blog/en/slug, /blog/uk/slug
```

## CLI Usage

### inject - Add x-default to sitemap

```bash
# Basic usage
npx nextjs-sitemap-hreflang inject --in public/sitemap.xml

# With options
npx nextjs-sitemap-hreflang inject --in public/sitemap.xml --out public/sitemap.xml \
  --x-default loc \
  --canonical-locale en \
  --order canonical-first \
  --trailing-slash never
```

**Options:**
- `--in <path>` - Input sitemap file (required)
- `--out <path>` - Output file (default: same as input)
- `--base-url <url>` - Base URL for resolving relative URLs
- `--x-default <strategy>` - Strategy: `loc`, `root`, `locale:en`, `custom:/path`
- `--canonical-locale <locale>` - Locale for canonical URL
- `--order canonical-first|preserve` - Order of hreflang links
- `--trailing-slash always|never|preserve` - URL normalization
- `--no-ensure-namespace` - Skip xmlns:xhtml injection

### check - Validate sitemap hreflang

```bash
# Basic validation
npx nextjs-sitemap-hreflang check --in public/sitemap.xml

# With all checks
npx nextjs-sitemap-hreflang check --in public/sitemap.xml \
  --check-duplicate-keys \
  --check-duplicate-hrefs \
  --check-hreflang-casing \
  --origin-policy same \
  --fail-on-missing
```

**Options:**
- `--in <path>` - Input sitemap file (required)
- `--json` - Output as JSON
- `--fail-on-missing` - Exit with code 1 on issues
- `--check-duplicate-keys` - Check for duplicate hreflang keys
- `--check-duplicate-hrefs` - Check for duplicate href values
- `--check-hreflang-casing` - Validate hreflang format (en, pt-BR, x-default)
- `--origin-policy same|allowlist|off` - Origin consistency check
- `--allowed-origins <list>` - Comma-separated allowed origins

## API Reference

### withHreflang(entries, options)

Adds x-default and normalizes hreflang entries.

```typescript
import { withHreflang } from "nextjs-sitemap-hreflang";

const result = withHreflang(entries, {
  baseUrl: "https://example.com",
  ensureXDefault: true,
  xDefaultStrategy: { type: "loc" },
  ensureAbsolute: true,
  trailingSlash: "preserve",
});
```

### withHreflangFromRouting(entries, routing, options)

Builds hreflang using routing strategy.

```typescript
import { withHreflangFromRouting, routingPrefixAsNeeded } from "nextjs-sitemap-hreflang";

const routing = routingPrefixAsNeeded({
  defaultLocale: "en",
  locales: ["en", "uk", "de"],
});

const result = withHreflangFromRouting(entries, routing, {
  baseUrl: "https://example.com",
  ensureXDefault: true,
});
```

### expandLocaleEntries(entries, options)

Expands entries to separate URL blocks per locale.

```typescript
import { expandLocaleEntries } from "nextjs-sitemap-hreflang";

const expanded = expandLocaleEntries(entries, {
  mode: "expanded",
  includeXDefault: true,
});
```

### injectXDefaultIntoSitemapXml(xml, options)

Injects x-default into XML string.

```typescript
import { injectXDefaultIntoSitemapXml } from "nextjs-sitemap-hreflang";

const result = injectXDefaultIntoSitemapXml(xml, {
  xDefaultStrategy: { type: "loc" },
  canonicalLocale: "en",
  order: "canonical-first",
  trailingSlash: "never",
});
```

### checkSitemapXmlHreflang(xml, options)

Validates sitemap XML hreflang.

```typescript
import { checkSitemapXmlHreflang } from "nextjs-sitemap-hreflang";

const report = checkSitemapXmlHreflang(xml, {
  requireXDefaultWhenMultiple: true,
  checkDuplicateKeys: true,
  checkDuplicateHrefs: true,
  checkHreflangCasing: true,
  originPolicy: "same",
});

console.log(report.ok); // true/false
console.log(report.issues); // array of issues
```

## x-default Strategies

| Strategy | Description |
|----------|-------------|
| `{ type: "loc" }` | Use the `<loc>` URL (default) |
| `{ type: "root" }` | Use the site root `/` |
| `{ type: "locale", locale: "en" }` | Use a specific locale's URL |
| `{ type: "custom", url: "/path" }` | Use a custom path |
| `{ type: "fn", resolve: (entry) => ... }` | Custom function |

## CI Integration

Add to your CI pipeline:

```yaml
# .github/workflows/ci.yml
- name: Check sitemap hreflang
  run: npx nextjs-sitemap-hreflang check --in public/sitemap.xml --fail-on-missing
```

## 🤝 Support

For support, please:
- [Open an issue](https://github.com/pas7-studio/nextjs-sitemap-hreflang/issues)
- [Contact us via PAS7](https://pas7.com.ua/contact)

## 🏢 Maintained by

**PAS7** — [https://pas7.com.ua/](https://pas7.com.ua/)

## 📄 License

MIT © PAS7 Studio
