import { describe, expect, it } from "vitest";
import path from "node:path";
import { resolveSitemapInputPath } from "../src/cli/resolveSitemapInputPath.js";

describe("resolveSitemapInputPath", () => {
  it("uses explicit --in path with highest priority", () => {
    const resolved = resolveSitemapInputPath({
      inPath: "custom/sitemap.xml",
      cwd: "/repo",
      exists: () => false,
    });

    expect(resolved).toBe("custom/sitemap.xml");
  });

  it("auto-detects public/sitemap.xml first", () => {
    const cwd = path.resolve("repo-root-public");
    const resolved = resolveSitemapInputPath({
      inPath: null,
      cwd,
      exists: (absolutePath) => normalizePath(absolutePath).endsWith("public/sitemap.xml"),
    });

    expect(normalizePath(resolved)).toBe(`${normalizePath(cwd)}/public/sitemap.xml`);
  });

  it("falls back to out/sitemap.xml then sitemap.xml", () => {
    const cwd = path.resolve("repo-root-fallback");
    const fromOut = resolveSitemapInputPath({
      inPath: null,
      cwd,
      exists: (absolutePath) => normalizePath(absolutePath).endsWith("out/sitemap.xml"),
    });

    expect(normalizePath(fromOut)).toBe(`${normalizePath(cwd)}/out/sitemap.xml`);

    const fromRoot = resolveSitemapInputPath({
      inPath: null,
      cwd,
      exists: (absolutePath) =>
        normalizePath(absolutePath) === `${normalizePath(cwd)}/sitemap.xml`,
    });

    expect(normalizePath(fromRoot)).toBe(`${normalizePath(cwd)}/sitemap.xml`);
  });

  it("throws a clear error when no sitemap file exists", () => {
    expect(() =>
      resolveSitemapInputPath({
        inPath: null,
        cwd: path.resolve("repo-root-missing"),
        exists: () => false,
      }),
    ).toThrow("Missing --in and sitemap file not found");
  });
});

function normalizePath(value: string): string {
  return value.replaceAll("\\", "/");
}
