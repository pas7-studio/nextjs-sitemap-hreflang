import { describe, expect, it } from "vitest";
import {
  buildCliCheckJsonReport,
  detectXmlInputError,
  issueSuggestion,
  summarizeByCode,
  toCliIssues,
} from "../src/cli/checkReport.js";

describe("cli check report", () => {
  it("builds stable json format", () => {
    const issues = toCliIssues([
      {
        code: "MISSING_XDEFAULT",
        entryUrl: "https://example.com/blog",
        message: "Missing x-default hreflang in sitemap url block",
      },
      {
        code: "MISSING_XDEFAULT",
        entryUrl: "https://example.com/about",
        message: "Missing x-default hreflang in sitemap url block",
      },
    ]);

    const report = buildCliCheckJsonReport({
      ok: false,
      issues,
      inputPath: "out/sitemap.xml",
      timingMs: 12,
    });

    expect(report.ok).toBe(false);
    expect(report.issues.length).toBe(2);
    expect(report.summary.byCode.MISSING_XDEFAULT).toBe(2);
    expect(report.inputPath).toBe("out/sitemap.xml");
    expect(report.timingMs).toBe(12);
  });

  it("adds human suggestion for known issue codes", () => {
    const suggestion = issueSuggestion("INVALID_HREFLANG_CASING");
    expect(suggestion.length).toBeGreaterThan(5);
  });

  it("returns fallback suggestion for unknown code", () => {
    const suggestion = issueSuggestion("SOMETHING_NEW");
    expect(suggestion).toContain("Review sitemap hreflang");
  });
});

describe("xml input validation", () => {
  it("returns null for valid sitemap shape", () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset><url><loc>https://example.com</loc></url></urlset>`;
    expect(detectXmlInputError(xml)).toBeNull();
  });

  it("detects missing urlset", () => {
    const xml = `<root></root>`;
    expect(detectXmlInputError(xml)).toContain("missing <urlset>");
  });

  it("detects mismatched url tags", () => {
    const xml = `<urlset><url><loc>https://example.com</loc></urlset>`;
    expect(detectXmlInputError(xml)).toContain("mismatched <url> tags");
  });

  it("summarizes by issue code", () => {
    const summary = summarizeByCode([
      {
        code: "MISSING_XDEFAULT",
        entryUrl: "a",
        message: "a",
        suggestion: "a",
      },
      {
        code: "NON_ABSOLUTE_URL",
        entryUrl: "b",
        message: "b",
        suggestion: "b",
      },
      {
        code: "NON_ABSOLUTE_URL",
        entryUrl: "c",
        message: "c",
        suggestion: "c",
      },
    ]);

    expect(summary.MISSING_XDEFAULT).toBe(1);
    expect(summary.NON_ABSOLUTE_URL).toBe(2);
  });
});
