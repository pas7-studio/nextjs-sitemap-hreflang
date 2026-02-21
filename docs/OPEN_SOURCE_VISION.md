# Open Source Vision and Roadmap

## Project Goal
Build a production-ready, routing-agnostic sitemap hreflang toolkit for Next.js that is easy to integrate across different content sources and i18n strategies.

## Product Principles
- Universal input model: work with content coming from TypeScript modules, JSON manifests, Markdown/MDX frontmatter, CMS exports, or generated metadata files.
- Safe defaults: valid hreflang clusters, x-default support, and deterministic URL normalization.
- Incremental adoption: can be used as an in-app library, postbuild XML fixer, or validation-only CI gate.
- Low integration cost: minimal required config, clear recipes for common routing styles.

## Current Maturity Gaps
- Release management was manual.
- README lacked production-grade setup guidance and release badges.
- No dedicated helper for turning content manifests into sitemap entries.

## Delivery Plan
1. Release Operations
- Add Changesets-based versioning.
- Add GitHub Actions release workflow with npm publish.
- Keep CI checks as release gate.

2. API Ergonomics
- Add a source-agnostic helper to create hreflang-ready sitemap entries from manifest-like content collections.
- Support common route styles: prefix-as-needed, prefix-always, suffix-locale, and locale-segment.
- Keep escape hatch through custom pathname resolver.

3. Documentation
- Rewrite README with clear architecture, badges, integration recipes, and release workflow.
- Include a practical PAS7-style recipe and migration notes from manual generators.

4. Quality Guardrails
- Add unit tests for the new manifest helper.
- Keep lint/typecheck/test/build in CI matrix.

## Definition of Done
- CI green on pull requests and main.
- Release workflow can create version PR and publish to npm with `NPM_TOKEN`.
- README provides enough guidance to integrate from TS/JSON/MD sources.
- New helper API covered by tests and exported from package root.
