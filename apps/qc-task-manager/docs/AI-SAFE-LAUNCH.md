# AI Safe Launch — Operator Checklist (QC Task Manager)

Audience: the operator who enables (or re-enables) the advisory AI provider for
the QC Task Manager deployment. Read the whole checklist before setting any
credential.

## ⚠️ MANDATORY FIRST STEP

> **ROTATE THE PROVIDER KEY OUTSIDE THE REPOSITORY BEFORE ENABLEMENT.**
>
> A provider credential tied to this project must be treated as compromised
> until proven otherwise. Code cannot rotate a key. Generate a **fresh** key in
> the provider console (Groq — <https://console.groq.com/keys>), and never reuse
> any key that has ever appeared in a repository, ticket, screenshot, or chat.

## 1. Before enablement

- [ ] **ROTATE THE PROVIDER KEY OUTSIDE THE REPOSITORY BEFORE ENABLEMENT.**
      Create a brand-new key in the provider console; discard any older key.
- [ ] Confirm the repository is clean: no provider key in code, docs, tests, or
      history snippets (`grep -rE "gsk_[A-Za-z0-9]{20,}" .` must return nothing
      outside `node_modules`).
- [ ] Confirm `.env` files are untracked and `.env.example` keeps the empty
      `GROQ_API_KEY=` placeholder.
- [ ] Confirm the model allowlist is intentional (`GROQ_MODEL`, default
      `llama-3.3-70b-versatile`) — the model name is not a secret and shows in
      `/admin/system-health`.

## 2. Enabling the provider

- [ ] Set `GROQ_API_KEY` **only** in the hosting dashboard environment settings
      (Render service → Environment). Never in the repository, never in a
      build log, never in a commit.
- [ ] Redeploy / restart the service so the process picks up the variable.
- [ ] Open `/admin/system-health` → **AI provider** section and confirm:
      `Configured: Yes`, `Provider: groq`, and the expected model. The API key
      itself is never displayed anywhere in the app — by design.
- [ ] Run one advisory feature in the UI (e.g. task analysis) and confirm a
      result arrives and an `ai_audit_log` row is written.

## 3. Disabling the provider

- [ ] Remove `GROQ_API_KEY` from the hosting environment and redeploy.
- [ ] Confirm `/admin/system-health` shows `Configured: No`.
- [ ] Confirm the UI panels show the controlled unavailable state
      ("AI advisory features are not configured for this deployment") and that
      all core QC workflows keep working without AI.

## 4. Non-negotiables (always true, with or without a provider)

- AI is **advisory only**. It never authorizes users, mutates tasks, or changes
  workflow state. Every core QC workflow must complete with AI absent.
- No provider secret is ever written to code, docs, tests, logs, or the
  project brain. The value lives only in the hosting environment.
- Requests are rate-limited per user; failures fail safely and are audited in
  `ai_audit_log` without the prompt/response payloads.
- If a credential has ever leaked: rotate it at the provider FIRST, then
  investigate, then re-enable. Code changes cannot rotate a key.

## 5. Related operator note — first-login password lifecycle

Seeded pilot accounts and admin-created/reset accounts are flagged
`must_change_password` and are forced through `/account/security` on first
login. The only opt-out is the environment variable
`QC_SEED_MUST_CHANGE_PASSWORD=0`, which exists **exclusively** for the E2E
fixture harness (`scripts/e2e-acceptance.mjs` sets it for disposable test
databases). NEVER set `QC_SEED_MUST_CHANGE_PASSWORD=0` on a real deployment.
