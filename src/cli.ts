import fs from "node:fs";
import path from "node:path";

import type { XDefaultStrategy } from "./lib/types.js";
import { injectXDefaultIntoSitemapXml } from "./xml/inject.js";
import { checkSitemapXmlHreflang } from "./xml/check.js";
import {
  ensureXhtmlNamespace,
  extractUrlBlocks,
  normalizeTrailingSlashInBlock,
  reorderXhtmlLinks,
} from "./xml/xml.js";

type Args = {
  command: "inject" | "check" | "transform" | null;
  inPath: string | null;
  outPath: string | null;
  baseUrl: string | null;
  xDefault: string | null;
  ensureNamespace: boolean;
  json: boolean;
  failOnMissing: boolean;
  // Inject options
  canonicalLocale: string | null;
  order: "canonical-first" | "preserve";
  trailingSlash: "preserve" | "always" | "never";
  // Check options
  checkDuplicateKeys: boolean;
  checkDuplicateHrefs: boolean;
  checkHreflangCasing: boolean;
  originPolicy: "same" | "allowlist" | "off";
  allowedOrigins: string[];
  // Transform options
  expandLocales: boolean;
};

function parseArgs(argv: string[]): Args {
  const args: Args = {
    command: null,
    inPath: null,
    outPath: null,
    baseUrl: null,
    xDefault: null,
    ensureNamespace: true,
    json: false,
    failOnMissing: false,
    canonicalLocale: null,
    order: "preserve",
    trailingSlash: "preserve",
    checkDuplicateKeys: true,
    checkDuplicateHrefs: true,
    checkHreflangCasing: true,
    originPolicy: "off",
    allowedOrigins: [],
    expandLocales: false,
  };

  const [cmd, ...rest] = argv;
  if (cmd === "inject" || cmd === "check" || cmd === "transform") args.command = cmd;

  for (let i = 0; i < rest.length; i += 1) {
    const a = rest[i];
    const v = rest[i + 1];

    if (a === "--in" && v) {
      args.inPath = v;
      i += 1;
      continue;
    }
    if (a === "--out" && v) {
      args.outPath = v;
      i += 1;
      continue;
    }
    if (a === "--base-url" && v) {
      args.baseUrl = v;
      i += 1;
      continue;
    }
    if (a === "--x-default" && v) {
      args.xDefault = v;
      i += 1;
      continue;
    }
    if (a === "--no-ensure-namespace") {
      args.ensureNamespace = false;
      continue;
    }
    if (a === "--json") {
      args.json = true;
      continue;
    }
    if (a === "--fail-on-missing") {
      args.failOnMissing = true;
      continue;
    }
    if (a === "--canonical-locale" && v) {
      args.canonicalLocale = v;
      i += 1;
      continue;
    }
    if (a === "--order" && v) {
      if (v === "canonical-first" || v === "preserve") {
        args.order = v;
      }
      i += 1;
      continue;
    }
    if (a === "--trailing-slash" && v) {
      if (v === "preserve" || v === "always" || v === "never") {
        args.trailingSlash = v;
      }
      i += 1;
      continue;
    }
    if (a === "--no-check-duplicate-keys") {
      args.checkDuplicateKeys = false;
      continue;
    }
    if (a === "--no-check-duplicate-hrefs") {
      args.checkDuplicateHrefs = false;
      continue;
    }
    if (a === "--no-check-hreflang-casing") {
      args.checkHreflangCasing = false;
      continue;
    }
    if (a === "--origin-policy" && v) {
      if (v === "same" || v === "allowlist" || v === "off") {
        args.originPolicy = v;
      }
      i += 1;
      continue;
    }
    if (a === "--allowed-origins" && v) {
      args.allowedOrigins = v.split(",").map((s) => s.trim());
      i += 1;
      continue;
    }
    if (a === "--expand-locales") {
      args.expandLocales = true;
      continue;
    }
    if (a === "--help") {
      printHelp();
      process.exit(0);
    }
  }

  return args;
}

function printHelp(): void {
  const text = [
    "nextjs-sitemap-hreflang",
    "",
    "Commands:",
    "  inject --in <path> [--out <path>] [options]",
    "  check  --in <path> [--json] [--fail-on-missing] [options]",
    "  transform --in <path> --out <path> [options]",
    "",
    "Inject options:",
    "  --x-default loc|root|locale:en|custom:https://example.com/path",
    "  --base-url https://example.com",
    "  --canonical-locale <locale>    Canonical locale for ordering",
    "  --order canonical-first|preserve",
    "  --trailing-slash preserve|always|never",
    "  --no-ensure-namespace",
    "",
    "Check options:",
    "  --no-check-duplicate-keys     Disable duplicate key check",
    "  --no-check-duplicate-hrefs    Disable duplicate href check",
    "  --no-check-hreflang-casing    Disable hreflang casing check",
    "  --origin-policy same|allowlist|off",
    "  --allowed-origins <comma-separated>",
    "",
    "Transform options:",
    "  --expand-locales              Expand locale entries",
    "  --trailing-slash preserve|always|never",
    "  --order canonical-first|preserve",
    "  --canonical-locale <locale>",
    "",
  ].join("\n");
  process.stdout.write(text);
}

function parseXDefaultStrategy(raw: string | null): XDefaultStrategy | undefined {
  if (!raw) return undefined;
  if (raw === "loc") return { type: "loc" };
  if (raw === "root") return { type: "root" };
  if (raw.startsWith("locale:")) return { type: "locale", locale: raw.slice("locale:".length) };
  if (raw.startsWith("custom:")) return { type: "custom", url: raw.slice("custom:".length) };
  return undefined;
}

function readFileUtf8(p: string): string {
  return fs.readFileSync(p, "utf8");
}

function writeFileUtf8(p: string, content: string): void {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content, "utf8");
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  if (!args.command) {
    printHelp();
    process.exit(1);
  }

  if (!args.inPath) {
    process.stderr.write("Missing --in\n");
    process.exit(1);
  }

  const xml = readFileUtf8(args.inPath);

  if (args.command === "inject") {
    const strategy = parseXDefaultStrategy(args.xDefault) ?? { type: "loc" };

    const next = injectXDefaultIntoSitemapXml(xml, {
      ...(args.baseUrl ? { baseUrl: args.baseUrl } : {}),
      xDefaultStrategy: strategy,
      ensureNamespace: args.ensureNamespace,
      ...(args.canonicalLocale ? { canonicalLocale: args.canonicalLocale } : {}),
      order: args.order,
      trailingSlash: args.trailingSlash,
    });

    const outPath = args.outPath ?? args.inPath;
    writeFileUtf8(outPath, next);
    process.stdout.write(`ok: injected\n`);
    return;
  }

  if (args.command === "transform") {
    let result = args.ensureNamespace ? ensureXhtmlNamespace(xml) : xml;

    // Apply trailing slash normalization
    if (args.trailingSlash !== "preserve") {
      const blocks = extractUrlBlocks(result);
      for (const block of blocks) {
        const transformed = normalizeTrailingSlashInBlock(block, args.trailingSlash);
        result = result.replace(block, transformed);
      }
    }

    // Apply reordering
    if (args.order === "canonical-first") {
      const blocks = extractUrlBlocks(result);
      for (const block of blocks) {
        const transformed = reorderXhtmlLinks(block, {
          ...(args.canonicalLocale ? { canonicalLocale: args.canonicalLocale } : {}),
          order: "canonical-first",
        });
        result = result.replace(block, transformed);
      }
    }

    const outPath = args.outPath;
    if (!outPath) {
      process.stderr.write("Missing --out for transform\n");
      process.exit(1);
    }
    writeFileUtf8(outPath, result);
    process.stdout.write(`ok: transformed\n`);
    return;
  }

  const report = checkSitemapXmlHreflang(xml, {
    requireNamespace: true,
    requireAbsolute: true,
    requireXDefaultWhenMultiple: true,
    checkDuplicateKeys: args.checkDuplicateKeys,
    checkDuplicateHrefs: args.checkDuplicateHrefs,
    checkHreflangCasing: args.checkHreflangCasing,
    originPolicy: args.originPolicy,
    allowedOrigins: args.allowedOrigins,
  });

  if (args.json) {
    process.stdout.write(JSON.stringify(report, null, 2));
    process.stdout.write("\n");
  } else {
    if (report.ok) {
      process.stdout.write("ok: sitemap hreflang check passed\n");
    } else {
      process.stdout.write(`fail: ${report.issues.length} issue(s)\n`);
      for (const issue of report.issues) {
        process.stdout.write(`- ${issue.code} ${issue.entryUrl}: ${issue.message}\n`);
      }
    }
  }

  if (!report.ok && args.failOnMissing) process.exit(1);
}

void main();
