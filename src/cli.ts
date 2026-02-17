import fs from "node:fs";
import path from "node:path";

import type { XDefaultStrategy } from "./lib/types.js";
import { injectXDefaultIntoSitemapXml } from "./xml/inject.js";
import { checkSitemapXmlHreflang } from "./xml/check.js";

type Args = {
  command: "inject" | "check" | null;
  inPath: string | null;
  outPath: string | null;
  baseUrl: string | null;
  xDefault: string | null;
  ensureNamespace: boolean;
  json: boolean;
  failOnMissing: boolean;
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
  };

  const [cmd, ...rest] = argv;
  if (cmd === "inject" || cmd === "check") args.command = cmd;

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
    "  inject --in <path> [--out <path>] [--base-url <url>] [--x-default <strategy>]",
    "  check  --in <path> [--json] [--fail-on-missing]",
    "",
    "Options:",
    "  --x-default loc|root|locale:en|custom:https://example.com/path",
    "  --base-url https://example.com",
    "  --no-ensure-namespace",
    "  --json",
    "  --fail-on-missing",
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
    });

    const outPath = args.outPath ?? args.inPath;
    writeFileUtf8(outPath, next);
    process.stdout.write(`ok: injected\n`);
    return;
  }

  const report = checkSitemapXmlHreflang(xml, {
    requireNamespace: true,
    requireAbsolute: true,
    requireXDefaultWhenMultiple: true,
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
