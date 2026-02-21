import fs from "node:fs";
import path from "node:path";

export type ResolveSitemapInputOptions = {
  inPath: string | null;
  prefer?: AutoDetectPreference;
  cwd?: string;
  exists?: (absolutePath: string) => boolean;
};

export type AutoDetectPreference = "public" | "out" | "root";

const DEFAULT_CANDIDATES = [
  path.join("public", "sitemap.xml"),
  path.join("out", "sitemap.xml"),
  "sitemap.xml",
] as const;

export function resolveSitemapInputPath(options: ResolveSitemapInputOptions): string {
  if (options.inPath) return options.inPath;

  const cwd = options.cwd ?? process.cwd();
  const exists = options.exists ?? fs.existsSync;
  const candidates = orderedCandidates(options.prefer ?? "public");

  for (const candidate of candidates) {
    const absolutePath = path.resolve(cwd, candidate);
    if (exists(absolutePath)) return absolutePath;
  }

  throw new Error(
    `Missing --in and sitemap file not found. Tried: ${candidates.join(", ")}`,
  );
}

function orderedCandidates(prefer: AutoDetectPreference): readonly string[] {
  if (prefer === "out") {
    return [
      path.join("out", "sitemap.xml"),
      path.join("public", "sitemap.xml"),
      "sitemap.xml",
    ];
  }

  if (prefer === "root") {
    return [
      "sitemap.xml",
      path.join("public", "sitemap.xml"),
      path.join("out", "sitemap.xml"),
    ];
  }

  return DEFAULT_CANDIDATES;
}
