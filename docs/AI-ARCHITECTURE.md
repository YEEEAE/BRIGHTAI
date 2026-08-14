# Groq AI Architecture

## Provider and model

QC Task Manager uses the Groq API through the `llama-3.3-70b-versatile` model. The API key is read only from the server environment variable `GROQ_API_KEY`. The model is overridden server-side with `GROQ_MODEL`; `AI_MODEL` remains a backwards-compatible generic override, and the fixed default is used otherwise.

## Environment

The only committed QC example value is:

```dotenv
GROQ_API_KEY=
```

Set the real key in `apps/qc-task-manager/.env` or the hosting provider's server environment. `.env` is ignored by Git. Do not use `PUBLIC_GROQ_API_KEY` or `VITE_GROQ_API_KEY`.

## Data flow

```text
Feature -> AI Service -> Groq Provider -> Groq API
                    -> Zod schema + guardrails
                    -> sanitized AI audit row
```

Features must call `runStructuredAi()`. They must not call `fetch` or the Groq provider directly. AI output is advisory and cannot authorize users, mutate tasks, change workflow state, or create task audit events.

## Security and privacy

- The provider is server-only and no API key is returned to Astro page data, React props, public assets, storage, or browser bundles.
- Authorization headers, API keys, prompts, completions, and raw provider errors are never logged.
- Structured responses are parsed and validated with Zod. Invalid output is rejected and the caller receives a generic error.
- AI audit rows store only `user_id`, feature, model, timestamp, request reference, response reference, success/failure, and a sanitized failure category.
- Prompts should contain the minimum task data needed for the feature. Do not send secrets, passwords, session tokens, or unnecessary personal data.

## Failure handling

Requests have a bounded timeout (15 seconds by default, configurable with `AI_TIMEOUT_MS`) and at most two retries by default (`AI_MAX_RETRIES`). Retries are limited to transient failures such as timeout, 408, 409, 429, and 5xx responses. Invalid structured output is rejected without an unbounded retry loop.

The service applies an in-memory per-user/per-feature rate limit of 10 requests per minute. This protects a single process from abuse; production deployments with multiple instances should add a shared limiter at the edge or in Redis.

## Audit and integrity boundary

AI audit records are separate from `task_activity_log`. The task activity chain detects changes to task events, while the AI audit records whether an AI request succeeded. Neither mechanism makes SQLite physically immutable; database permissions, backups, and external retention remain necessary.

## Live verification

**2026-08-14** — One live Groq request was attempted via `apps/qc-task-manager/scripts/smoke-ai-live.mjs` (uncommitted). It ran a controlled task fixture (`QC_DATABASE_PATH=/tmp/...` temp DB) through the real provider path: `analyzeTask` → `runStructuredAi` → `createGroqProvider()` reading `GROQ_API_KEY` / `GROQ_MODEL` from the environment only (the key is never printed or committed).

**Outcome: FAILED — not a pass.** The single live request failed with `AiServiceError` (`AI request could not be completed.`), i.e. the existing safe error contract held: no raw provider response body, key, Authorization header, or prompt was surfaced or logged. The root cause is deliberately hidden by the contract — the key may be invalid/expired, the account quota may be exhausted, or outbound network may be restricted in this environment. It was **not re-run** (explicit single-call approval). The local-only checks that ran before the call passed: a Saudi mobile number (`0551234567`) and an email (`person@example.com`) were redacted from the prompt inside `<untrusted_qc_data>` before the request. The remaining assertions (Zod parse, audit no-leak, mocked 429/5xx → safe error mapping) are already covered by the existing `test-ai-foundation.mjs` / `test-ai-features.mjs` suites, and `pnpm --filter @brightai/qc-task-manager test` still passes **265/0** after the attempt.
