# BrightAI Entity Consistency Implementation Plan

**Goal:** Make BrightAI’s Organization identity, social profiles, descriptions, trust presentation, and article metadata resolve to one truthful source of record.

**Architecture:** `src/data/site.ts` owns brand descriptions, logo, market, and the owner-confirmed official profile URLs. `src/data/schema-helpers.ts` consumes that source for the runtime Organization node; `public/schema-saudi-seo.json` and the AI discovery files mirror the same contract. About/contact pages reference the Organization by `@id` and use methodology/source/update signals instead of unsupported credentials.

**Verification:** Run the entity consistency contract, date audit, `pnpm build`, SEO/schema checks available in the repository, and inspect generated HTML for the canonical Organization and metadata.

## Tasks

- [x] Add a failing contract test covering canonical identity, profile allowlist, metadata, and trust-copy boundaries.
- [x] Centralize descriptions, logo, market, and official profiles in `SITE`.
- [x] Make runtime and static Organization schema consume the same values and remove stale/placeholder fields.
- [x] Normalize Open Graph/Twitter/X metadata and content discovery files.
- [x] Repair About/contact schema and trust copy without inventing credentials or people.
- [x] Audit article dates and add reviewer support only where an actual role is present.
- [x] Run the full local verification set and update `01-mind-latest.md`.
