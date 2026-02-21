import fs from "node:fs";
import path from "node:path";

export type ResolveSitemapInputOptions = {
  inPath: string | null;
  cwd?: string;
  exists?: (absolutePath: string) => boolean;
};

const DEFAULT_CANDIDATES = [
  path.join("public", "sitemap.xml"),
  path.join("out", "sitemap.xml"),
  "sitemap.xml",
] as const;

export function resolveSitemapInputPath(options: ResolveSitemapInputOptions): string {
  if (options.inPath) return options.inPath;

  const cwd = options.cwd ?? process.cwd();
  const exists = options.exists ?? fs.existsSync;

  for (const candidate of DEFAULT_CANDIDATES) {
    const absolutePath = path.resolve(cwd, candidate);
    if (exists(absolutePath)) return absolutePath;
  }

  throw new Error(
    `Missing --in and sitemap file not found. Tried: ${DEFAULT_CANDIDATES.join(", ")}`,
  );
}
