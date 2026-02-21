import type {
  RoutingStrategy,
  RoutingPrefixAsNeededOptions,
  RoutingPrefixAlwaysOptions,
  RoutingDomainBasedOptions,
  RoutingSuffixLocaleOptions,
  RoutingPAS7Options,
} from "./types.js";

/**
 * Prefix-as-needed routing: default locale has no prefix, others have /locale
 * Example: /about (en), /uk/about (uk), /de/about (de)
 *
 * Compatible with next-intl's prefix-as-needed strategy.
 */
export function routingPrefixAsNeeded(
  options: RoutingPrefixAsNeededOptions,
): RoutingStrategy {
  const { defaultLocale, locales, basePath = "" } = options;

  return {
    locales,
    canonicalLocale: defaultLocale,
    hrefFor: ({ pathname, locale }) => {
      const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
      const base = basePath || "";

      if (locale === defaultLocale) {
        return `${base}${normalizedPath}`;
      }
      return `${base}/${locale}${normalizedPath}`;
    },
  };
}

/**
 * Prefix-always routing: all locales have /locale prefix
 * Example: /en/about, /uk/about, /de/about
 *
 * Compatible with next-intl's prefix-always strategy.
 */
export function routingPrefixAlways(
  options: RoutingPrefixAlwaysOptions,
): RoutingStrategy {
  const { defaultLocale, locales, basePath = "" } = options;

  return {
    locales,
    canonicalLocale: defaultLocale,
    hrefFor: ({ pathname, locale }) => {
      const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
      const base = basePath || "";
      return `${base}/${locale}${normalizedPath}`;
    },
  };
}

/**
 * Domain-based routing: each locale has its own domain
 * Example: example.com (en), example.de (de), example.ua (uk)
 *
 * Compatible with next-intl's domain-based routing.
 */
export function routingDomainBased(
  options: RoutingDomainBasedOptions,
): RoutingStrategy {
  const { defaultLocale, locales, localeToDomain } = options;

  return {
    locales,
    canonicalLocale: defaultLocale,
    hrefFor: ({ pathname, locale }) => {
      const domain = localeToDomain[locale];
      if (!domain) {
        const defaultDomain = localeToDomain[defaultLocale] || "";
        const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
        return `${defaultDomain}/${locale}${normalizedPath}`;
      }
      const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
      return `${domain}${normalizedPath}`;
    },
  };
}

/**
 * Suffix-locale routing: locale added as suffix to path
 * Example: /blog (en), /blog/uk (uk), /blog/de (de)
 *
 * Common for blogs and content sections.
 */
export function routingSuffixLocale(
  options: RoutingSuffixLocaleOptions,
): RoutingStrategy {
  const { defaultLocale, locales, basePath = "" } = options;

  return {
    locales,
    canonicalLocale: defaultLocale,
    hrefFor: ({ pathname, locale }) => {
      const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
      const path =
        normalizedPath.endsWith("/") && normalizedPath !== "/"
          ? normalizedPath.slice(0, -1)
          : normalizedPath;
      const base = basePath || "";

      if (locale === defaultLocale) {
        return `${base}${path}`;
      }
      return `${base}${path}/${locale}`;
    },
  };
}

/**
 * Custom routing with user-defined function
 */
export function routingCustom(options: {
  locales: readonly string[];
  canonicalLocale: string;
  hrefFor: (args: { pathname: string; locale: string }) => string;
  xDefault?: RoutingStrategy["xDefault"];
}): RoutingStrategy {
  if (options.xDefault !== undefined) {
    return {
      locales: options.locales,
      canonicalLocale: options.canonicalLocale,
      hrefFor: options.hrefFor,
      xDefault: options.xDefault,
    };
  }
  return {
    locales: options.locales,
    canonicalLocale: options.canonicalLocale,
    hrefFor: options.hrefFor,
  };
}

/**
 * PAS7 custom routing strategy:
 * - Home: / (en), /uk, /de
 * - Suffix pages: /blog (en), /blog/uk
 * - Detail pages: /blog/en/slug, /blog/uk/slug
 * - Prefix pages: /about (en), /uk/about
 *
 * Priority: detailPathPattern > suffixPaths > prefixPaths > fallback.
 */
export function routingPAS7(options: RoutingPAS7Options): RoutingStrategy {
  const {
    defaultLocale,
    locales,
    hubPaths = ["/blog", "/projects", "/services", "/cases"],
    suffixPaths,
    prefixPaths = [],
    detailPathPattern = /^\/(blog|projects|services|cases)\//,
  } = options;

  const normalizedSuffixPaths = uniquePaths(suffixPaths ?? hubPaths);
  const normalizedPrefixPaths = uniquePaths(prefixPaths);
  const localeSet = new Set(locales);

  return {
    locales,
    canonicalLocale: defaultLocale,
    hrefFor: ({ pathname, locale }) => {
      const normalizedPath = normalizeInputPath(pathname);

      if (normalizedPath === "/") {
        if (locale === defaultLocale) return "/";
        return `/${locale}`;
      }

      if (detailPathPattern.test(normalizedPath)) {
        const parts = normalizedPath.split("/").filter(Boolean);
        if (parts.length >= 3 && localeSet.has(parts[1] ?? "")) {
          const section = parts[0];
          const slug = parts.slice(2).join("/");
          return `/${section}/${locale}/${slug}`;
        }
      }

      const suffixBase = findSuffixBasePath(normalizedPath, normalizedSuffixPaths, localeSet);
      if (suffixBase) {
        if (locale === defaultLocale) return suffixBase;
        return `${suffixBase}/${locale}`;
      }

      const prefixBase = findPrefixBasePath(normalizedPath, normalizedPrefixPaths, localeSet);
      if (prefixBase) {
        if (locale === defaultLocale) return prefixBase;
        return `/${locale}${prefixBase}`;
      }

      if (locale === defaultLocale) return normalizedPath;
      return `/${locale}${normalizedPath}`;
    },
  };
}

function normalizeInputPath(pathname: string): string {
  const withLeadingSlash = pathname.startsWith("/") ? pathname : `/${pathname}`;
  if (withLeadingSlash.length > 1 && withLeadingSlash.endsWith("/")) {
    return withLeadingSlash.slice(0, -1);
  }
  return withLeadingSlash;
}

function uniquePaths(paths: readonly string[]): string[] {
  return [...new Set(paths.map(normalizeInputPath))];
}

function findSuffixBasePath(
  pathname: string,
  suffixPaths: readonly string[],
  localeSet: ReadonlySet<string>,
): string | null {
  for (const suffixPath of suffixPaths) {
    if (pathname === suffixPath) return suffixPath;

    if (!pathname.startsWith(`${suffixPath}/`)) continue;
    const rest = pathname.slice(`${suffixPath}/`.length);
    if (!rest) continue;

    const [maybeLocale, ...tail] = rest.split("/");
    if (tail.length === 0 && localeSet.has(maybeLocale ?? "")) {
      return suffixPath;
    }
  }
  return null;
}

function findPrefixBasePath(
  pathname: string,
  prefixPaths: readonly string[],
  localeSet: ReadonlySet<string>,
): string | null {
  for (const prefixPath of prefixPaths) {
    if (pathname === prefixPath) return prefixPath;

    const withoutLeadingSlash = pathname.replace(/^\/+/, "");
    const [maybeLocale, ...tail] = withoutLeadingSlash.split("/");
    if (!localeSet.has(maybeLocale ?? "")) continue;

    const candidate = normalizeInputPath(tail.join("/"));
    if (candidate === prefixPath) return prefixPath;
  }
  return null;
}
