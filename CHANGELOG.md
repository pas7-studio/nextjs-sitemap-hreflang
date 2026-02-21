# @pas7/nextjs-sitemap-hreflang

## 0.6.1

### Patch Changes

- 27cdde5: Add `--prefer <public|out|root>` CLI option to control sitemap auto-detect priority for `check` and `inject` while keeping backward-compatible default behavior.

## 0.6.0

### Minor Changes

- 95c1fa7: Improve DX for static export and mixed routing by adding CLI sitemap auto-detection (`public/sitemap.xml`, `out/sitemap.xml`, `sitemap.xml`), expanding App Router full-stack documentation, and adding a runnable `examples/next-app-router-static-export` project.

## 0.5.0

### Minor Changes

- f62acfd: Improve Next.js MetadataRoute compatibility by accepting optional hreflang values, add `NextMetadataSitemapEntryCompatible`, extend `routingPAS7` with `suffixPaths` and `prefixPaths` (with deterministic priority), and refresh README for scoped package usage and static export integration.

## 0.3.0

### Minor Changes

- 98157ce: Add production release automation (Changesets + GitHub Actions publish workflow), introduce `createSitemapEntriesFromManifest` for source-agnostic manifest integration, and rewrite README with badges, CI/release setup, and integration recipes.
