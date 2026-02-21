# Next.js App Router static export example

This example demonstrates a full SEO stack with:
- `app/sitemap.ts` using `routingPAS7` + `withHreflangFromRouting`
- `app/robots.ts` pointing to `sitemap.xml`
- CI-style command to validate generated hreflang

## Run

```bash
npm install
npm run seo:ci
```

## Expected output paths

After `next build` with `output: "export"`:
- `out/sitemap.xml`
- `out/robots.txt`

Then the CLI command below is enough (no explicit `--in`):

```bash
npx nextjs-sitemap-hreflang check --fail-on-missing
```

The CLI auto-detect order is:
1. `public/sitemap.xml`
2. `out/sitemap.xml`
3. `sitemap.xml`
