import type { MetadataRoute } from "next";
import {
  routingPAS7,
  withHreflangFromRouting,
} from "@pas7/nextjs-sitemap-hreflang";

const baseUrl = "https://example.com";

const routing = routingPAS7({
  defaultLocale: "en",
  locales: ["en", "uk", "de", "it", "hr"],
  suffixPaths: [
    "/blog",
    "/projects",
    "/services",
    "/cases",
    "/contact",
    "/about",
    "/privacy",
    "/terms",
  ],
  detailPathPattern: /^\/(blog|projects|services|cases)\//,
});

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/` },
    { url: `${baseUrl}/blog` },
    { url: `${baseUrl}/contact` },
    { url: `${baseUrl}/blog/en/hello-world` },
  ];

  return withHreflangFromRouting(entries, routing, {
    baseUrl,
    ensureXDefault: true,
  });
}
