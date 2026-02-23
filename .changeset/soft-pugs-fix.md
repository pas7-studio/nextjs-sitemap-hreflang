---
"@pas7/nextjs-sitemap-hreflang": patch
---

Add `imagesFor` to `createSitemapEntriesFromManifest` so nested content schemas can include multiple sitemap images per entry (for example hero + section screenshots) without pre-flattening to `item.images`.
