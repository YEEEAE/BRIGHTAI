# Risk Assist — G-10 — 2026-11-17

Status: PARTIAL LOCAL (implementation complete; real authenticated/provider journey not verified).

- POST `/app/api/risk-engine/assist/`: authenticated identity, same-origin JSON, streamed 8KB limit, private/no-store, tenantGuard + product access (`assist`) + OWNER/ADMIN. No public demo route or persistence.
- Requires exact request fields `purpose`, `data_classification`, `synthetic:true`; protects purpose and classification before gateway dispatch. Only tenant-approved, unexpired model entries from the existing registry are eligible; registry remains empty. No key or model approval inferred from environment.
- Groq gateway retains existing budget, concurrency, timeout and circuit gates. No real provider request made in this task.
- Exact output keys: `scenarios`, `suggestedControls`, `reviewQuestions`; each 1–3 strings, 2–100 characters. Rejects missing/extra fields, numeric/nested items, malformed/fenced JSON, controls, oversized reply; protects output strings. No score or acceptance fields.
- Operational editor appends a labelled advisory draft to data-context description only, preserving existing text. No automatic save or change to purpose, classification, matrix axes, rationale, status, or acceptance. Oversized combined description rejected without truncation. Session/context changes suppress insertion.
- `core.mjs`, `evaluate` and `acceptanceDecision` unchanged. Draft content is untrusted advisory text requiring human review; schema validation is not semantic verification of model prose.

## Evidence

- `node --test tests/risk-engine.test.mjs tests/risk-assist.test.mjs`: 11 PASS / 0 FAIL.
- Includes OWNER/ADMIN success; MEMBER/tenant denial; missing approval; synthetic, secret, classification and unknown-field rejection; each missing output key; score/acceptance injection; immutable 3×3 score=9 and high-risk self-acceptance denial; output redaction; provider failure; HTTP auth/origin/content-type/size/cache.
- `npm run build`: PASS, 57 public pages; `git diff --check`: PASS.
- Chrome local `/app/risk-engine/`: assistant button present, hidden before authentication; no horizontal overflow at current browser viewport. `/demo/risk-engine/`: 0 assistant buttons, no operational root. No authenticated insertion/mobile/keyboard acceptance claim.
- Initial local server failed sandbox EPERM; elevated local-only dev server succeeded. One browser evaluate approval review timed out; subsequent read-only DOM checks succeeded. No rejection or bypass.
- No deployment, paid provider execution, migrations, commit or push. REQ-38/REQ-23/REQ-24 mapping remains unverified; no percentage/coverage claim updated.

## Rollback

Remove assist route and its optional editor button/listener (or leave route unavailable: editor reports failure and manual entry remains usable). No new database state or migration to reverse; already human-saved description text remains ordinary versioned text.
