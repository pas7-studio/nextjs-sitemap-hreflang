export type {
  ChangeFrequency,
  HreflangIssue,
  HreflangReport,
  SitemapAlternates,
  SitemapEntry,
  SitemapEntryLike,
  XDefaultStrategy,
} from "./lib/types.js";

export {
  assertHreflangExport as assertHreflang,
  withHreflang,
  buildLanguagesMap,
  normalizeUrl,
  resolveAbsoluteUrl,
} from "./lib/withHreflang.js";

export { injectXDefaultIntoSitemapXml } from "./xml/inject.js";
export { checkSitemapXmlHreflang } from "./xml/check.js";
