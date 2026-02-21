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
        // Default locale - no prefix
        return `${base}${normalizedPath}`;
      }
      // Other locales - add prefix
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
        // Fallback to default domain with prefix
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
      // Remove trailing slash for consistent handling
      const path =
        normalizedPath.endsWith("/") && normalizedPath !== "/"
          ? normalizedPath.slice(0, -1)
          : normalizedPath;
      const base = basePath || "";

      if (locale === defaultLocale) {
        // Default locale - no suffix
        return `${base}${path}`;
      }
      // Other locales - add suffix
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
 * - Home: / (en), /uk, /de, /it, /hr
 * - Hubs: /blog (en), /blog/uk, /blog/de
 * - Details: /blog/en/<slug>, /blog/uk/<slug>
 *
 * This is a hybrid routing scheme where:
 * - Home pages use prefix pattern for non-default locales
 * - Hub pages (listing pages) use suffix pattern for non-default locales
 * - Detail pages have locale as a segment after the section
 */
export function routingPAS7(options: RoutingPAS7Options): RoutingStrategy {
  const {
    defaultLocale,
    locales,
    hubPaths = ["/blog", "/projects", "/services", "/cases"],
    detailPathPattern = /^\/(blog|projects|services|cases)\//,
  } = options;

  return {
    locales,
    canonicalLocale: defaultLocale,
    hrefFor: ({ pathname, locale }) => {
      // Normalize pathname
      const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;

      // Home page
      if (normalizedPath === "/" || normalizedPath === "") {
        if (locale === defaultLocale) return "/";
        return `/${locale}`;
      }

      // Detail pages - locale is segment after section
      // /blog/en/slug → /blog/uk/slug
      if (detailPathPattern.test(normalizedPath)) {
        const parts = normalizedPath.split("/").filter(Boolean);
        if (parts.length >= 3) {
          // parts[0] = section, parts[1] = locale, parts[2+] = slug
          const section = parts[0];
          const slug = parts.slice(2).join("/");
          return `/${section}/${locale}/${slug}`;
        }
      }

      // Hub pages - locale as suffix
      // /blog → /blog/uk
      const matchingHub = hubPaths.find((hub) => {
        const normalizedHub = hub.startsWith("/") ? hub : `/${hub}`;
        return normalizedPath === normalizedHub || normalizedPath === `${normalizedHub}/`;
      });
      if (matchingHub) {
        const normalizedHub = matchingHub.startsWith("/")
          ? matchingHub.replace(/\/$/, "")
          : `/${matchingHub.replace(/\/$/, "")}`;
        if (locale === defaultLocale) return normalizedHub;
        return `${normalizedHub}/${locale}`;
      }

      // Fallback: prefix-as-needed style
      if (locale === defaultLocale) return normalizedPath;
      return `/${locale}${normalizedPath}`;
    },
  };
}
