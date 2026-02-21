export type {
  ChangeFrequency,
  HreflangIssue,
  HreflangReport,
  SitemapAlternates,
  SitemapEntry,
  SitemapEntryLike,
  XDefaultStrategy,
  HreflangIssueCode,
  // Routing strategies
  RoutingStrategy,
  RoutingPrefixAsNeededOptions,
  RoutingPrefixAlwaysOptions,
  RoutingDomainBasedOptions,
  RoutingSuffixLocaleOptions,
  RoutingPAS7Options,
} from "./lib/types.js";

export type {
  ManifestRouteStyle,
  LocalizedManifestItem,
  CreateSitemapEntriesFromManifestOptions,
} from "./lib/fromManifest.js";

export {
  assertHreflangExport as assertHreflang,
  withHreflang,
  withHreflangFromRouting,
  buildLanguagesMap,
  normalizeUrl,
  resolveAbsoluteUrl,
} from "./lib/withHreflang.js";

export {
  routingPrefixAsNeeded,
  routingPrefixAlways,
  routingDomainBased,
  routingSuffixLocale,
  routingCustom,
  routingPAS7,
} from "./lib/routing.js";

export { expandLocaleEntries } from "./lib/expandLocales.js";
export type { ExpandLocalesOptions } from "./lib/expandLocales.js";

export { createSitemapEntriesFromManifest } from "./lib/fromManifest.js";

export { injectXDefaultIntoSitemapXml } from "./xml/inject.js";
export type { InjectOptions } from "./xml/inject.js";

export { checkSitemapXmlHreflang } from "./xml/check.js";
export type { CheckXmlOptions } from "./xml/check.js";
