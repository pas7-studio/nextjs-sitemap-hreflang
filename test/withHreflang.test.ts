import { describe, expect, it } from "vitest";
import { withHreflang } from "../src/lib/withHreflang.js";

describe("withHreflang", () => {
  it("adds x-default when missing", () => {
    const entries = [
      {
        url: "https://example.com/blog",
        alternates: {
          languages: {
            en: "https://example.com/blog",
            uk: "https://example.com/blog/uk",
          },
        },
      },
    ];

    const out = withHreflang(entries, { ensureXDefault: true, xDefaultStrategy: { type: "loc" } });
    expect(out.length).toBe(1);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const first = out[0]!;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const languages = first.alternates!.languages as Record<string, string>;
    expect(languages["x-default"]).toBe("https://example.com/blog");
  });

  it("ensures self when canonicalLocale provided", () => {
    const entries = [
      {
        url: "https://example.com/blog",
        alternates: { languages: { uk: "https://example.com/blog/uk" } },
      },
    ];

    const out = withHreflang(entries, { ensureSelf: true, canonicalLocale: "en" });
    expect(out.length).toBe(1);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const first = out[0]!;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const languages = first.alternates!.languages as Record<string, string>;
    expect(languages["en"]).toBe("https://example.com/blog");
  });
});
