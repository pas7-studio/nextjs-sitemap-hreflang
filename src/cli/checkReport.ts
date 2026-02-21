export type CliIssue = {
  code: string;
  entryUrl: string;
  message: string;
  suggestion: string;
};

export type CliCheckJsonReport = {
  ok: boolean;
  issues: CliIssue[];
  summary: {
    byCode: Record<string, number>;
  };
  inputPath: string;
  timingMs: number;
};

export function detectXmlInputError(xml: string): string | null {
  if (!xml.trim()) return "Invalid XML: file is empty";
  if (!xml.includes("<urlset")) return "Invalid XML: missing <urlset>";
  if (!xml.includes("</urlset>")) return "Invalid XML: missing </urlset>";

  const openingUrlTags = xml.match(/<url>/g)?.length ?? 0;
  const closingUrlTags = xml.match(/<\/url>/g)?.length ?? 0;
  if (openingUrlTags !== closingUrlTags) {
    return "Invalid XML: mismatched <url> tags";
  }

  return null;
}

export function issueSuggestion(code: string): string {
  if (code === "MISSING_LANGUAGES") {
    return "Add alternates.languages and ensure xmlns:xhtml exists on <urlset> when using xhtml:link.";
  }
  if (code === "MISSING_XDEFAULT") {
    return "Add x-default hreflang (use `inject` with default strategy or configure xDefaultStrategy).";
  }
  if (code === "MISSING_SELF") {
    return "Include canonical locale URL in alternates.languages for each entry.";
  }
  if (code === "NON_ABSOLUTE_URL") {
    return "Convert all loc/hreflang href values to absolute URLs (https://...).";
  }
  if (code === "INVALID_LOCALE_KEY") {
    return "Use valid locale keys like en or pt-BR, plus x-default.";
  }
  if (code === "DUPLICATE_HREFLANG_KEY") {
    return "Remove duplicate hreflang keys in the same <url> block.";
  }
  if (code === "DUPLICATE_HREF") {
    return "Ensure each non-x-default locale points to a unique localized URL.";
  }
  if (code === "INVALID_HREFLANG_CASING") {
    return "Use lowercase language and uppercase region (en, pt-BR, x-default).";
  }
  if (code === "INCONSISTENT_ORIGIN") {
    return "Align origins with loc or update allowed origins policy.";
  }
  return "Review sitemap hreflang configuration for this entry.";
}

export function toCliIssues(
  issues: Array<{ code: string; entryUrl: string; message: string }>,
): CliIssue[] {
  return issues.map((issue) => ({
    ...issue,
    suggestion: issueSuggestion(issue.code),
  }));
}

export function summarizeByCode(issues: CliIssue[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const issue of issues) {
    out[issue.code] = (out[issue.code] ?? 0) + 1;
  }
  return out;
}

export function buildCliCheckJsonReport(args: {
  ok: boolean;
  issues: CliIssue[];
  inputPath: string;
  timingMs: number;
}): CliCheckJsonReport {
  return {
    ok: args.ok,
    issues: args.issues,
    summary: {
      byCode: summarizeByCode(args.issues),
    },
    inputPath: args.inputPath,
    timingMs: args.timingMs,
  };
}
