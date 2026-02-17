import type { XDefaultStrategy } from "./types.js";
import { normalizeUrl, resolveAbsoluteUrl } from "./url.js";

export type BuildLanguagesMapInput = {
  baseUrl: string;
  locales: readonly string[];
  canonicalLocale: string;
  resolveHref: (locale: string) => string;
  includeXDefault: boolean;
  xDefaultStrategy?: XDefaultStrategy;
  trailingSlash?: "preserve" | "always" | "never";
};

export type BuildLanguagesMapOutput = {
  canonical: string;
  languages: Record<string, string>;
};

export function buildLanguagesMap(input: BuildLanguagesMapInput): BuildLanguagesMapOutput {
  const trailingSlash = input.trailingSlash ?? "preserve";
  const languages: Record<string, string> = {};

  for (const locale of input.locales) {
    const href = input.resolveHref(locale);
    const abs = resolveAbsoluteUrl(href, input.baseUrl);
    languages[locale] = normalizeUrl(abs, trailingSlash);
  }

  const canonical = languages[input.canonicalLocale] ?? normalizeUrl(input.baseUrl, trailingSlash);

  if (input.includeXDefault) {
    const xDefault = resolveXDefaultForLanguages({
      canonical,
      languages,
      baseUrl: input.baseUrl,
      strategy: input.xDefaultStrategy ?? { type: "loc" },
      trailingSlash,
    });
    languages["x-default"] = xDefault;
  }

  return { canonical, languages };
}

export function resolveXDefaultForLanguages(args: {
  canonical: string;
  languages: Record<string, string>;
  baseUrl: string;
  strategy: XDefaultStrategy;
  trailingSlash: "preserve" | "always" | "never";
}): string {
  const { canonical, languages, baseUrl, strategy, trailingSlash } = args;

  if (strategy.type === "loc") return normalizeUrl(canonical, trailingSlash);
  if (strategy.type === "root") return normalizeUrl(resolveAbsoluteUrl("/", baseUrl), trailingSlash);
  if (strategy.type === "custom") return normalizeUrl(resolveAbsoluteUrl(strategy.url, baseUrl), trailingSlash);
  if (strategy.type === "locale") {
    const href = languages[strategy.locale];
    if (href) return normalizeUrl(href, trailingSlash);
    return normalizeUrl(canonical, trailingSlash);
  }
  const href = strategy.resolve({ url: canonical });
  return normalizeUrl(resolveAbsoluteUrl(href, baseUrl), trailingSlash);
}
