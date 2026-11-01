# Firewall — local policy evaluation and guarded execution

Status: **IMPLEMENTED_NOT_VERIFIED / PARTIAL**, 2026-11-01. Current changes have not been built or exercised, at the owner's explicit request. Earlier local results concern earlier source only. No deployment, provider approval or Neon migration is implied.

## Current routes and authorization

`/app/firewall/` uses AppLayout and the shared Kernel session/institution selector. Every API authenticates the existing Neon Auth bearer JWT, loads the user's membership and rechecks Firewall access through Kernel's administrative grant. OWNER/ADMIN manage rules; MEMBER can read and evaluate. Other product licenses are not required.

- `GET /app/api/firewall/rules/?workspace=<membership>`: rules, all-time counts, provider status and decision history, 12 entries per page. Optional `action`, `reason`, `mode=LAB|GUARD`, `from`/`to` inclusive UTC dates and `page=1..10000` filter the history, not counts. Times display in Asia/Riyadh. Only decision-time rule ID/version are displayed; a renamed rule does not rewrite the historical label.
- `POST /app/api/firewall/rules/`: `{template}` or `{name,pattern,action,priority}`. The 25-rule limit includes disabled rules. Names are unique within the institution. Custom rules are editable; protected server templates are toggle-only.
- `PATCH /app/api/firewall/rules/`: `{id,version,enabled?}` and custom rule fields. Updates increment the version; concurrent changes return `409 RULE_CHANGED`.
- `POST /app/api/firewall/evaluate/`: `{text,synthetic:true}`. Evaluates and persists metadata, returns a transient output, `execution_status=NOT_EXECUTED`, and never calls a provider. No match remains `ALLOW / NO_MATCH_LAB_ONLY`, explicitly not a safety judgment.
- `POST /app/api/firewall/guarded-executions/`: `{text,synthetic:true,request_id:<new UUID>}`. Evaluates and saves the decision plus mandatory Kernel audit in one transaction, then invokes the server guard only after COMMIT. No client decision, destination URL, provider override or alternate text is accepted.

All requests use JSON; body size is capped at 18000 bytes and input at 4000 characters. Browser mutations require the same Origin. The guarded endpoint also permits an absent Origin for bearer-authenticated application integrations; it does not support service credentials, CORS or cookie authentication. `workspace` selects an actual membership and grants no authority. Authenticated responses are private/no-store/noindex. No content is sent to Analytics or logging.

## Enforcement boundary

BLOCK wins over REDACT, which wins over ALLOW, regardless of numeric priority. Priority selects the cited rule within the winning action. Rules match escaped, case-insensitive literals, never arbitrary regular expressions. Redaction merges matching spans from the original text, including overlapping matches, before replacement with `[نص منقّح]`.

The guard blocks missing/invalid policy and unmatched input (`NO_MATCH_ENFORCED`). For BLOCK it returns 403 `POLICY_BLOCKED` without a provider call. For REDACT only the evaluator's redacted output is available to the adapter. For ALLOW only evaluated output is forwarded. Evaluation/saving/COMMIT failure prevents invocation.

`src/server/firewall/provider.mjs` deliberately contains an empty approved registry. Consequently a permitted policy decision returns **503 PROVIDER_NOT_CONFIGURED**, `persisted=true`, and `external_action_executed=false`. A key in the environment is not provider approval. A future reviewed entry must bind exact institutions, model, processing region, approval reference/expiry, no-training terms and a bounded server adapter. It must not obtain destination or alternate content from the client. No adapter or provider has been approved or connected in this change.

The guard has no automatic retry or provider fallback. A request UUID is consumed when its decision commits; reusing it returns 409 and never invokes a provider again. If an eventual approved adapter fails after invocation, the response reports `execution_status=UNKNOWN` and `external_action_executed=null`, since a timeout cannot prove non-delivery. A process crash after COMMIT can leave a saved decision without execution; the decision history is a policy history, not a delivery receipt.

This boundary governs **input on this endpoint only**. It does not intercept direct provider calls from other applications, inspect provider output, support streaming, implement full DLP or semantic prompt-injection detection, or enable WARN/human approval/commercial trials.

## Persistence and setup

`0002_aigas_firewall.sql` is a revised **fresh-install migration**, not an upgrade for a database already carrying an earlier 0002. It requires 0001; the current runtime also requires separately reviewed Kernel administration 0006. It adds protected-template constraints, metadata/action/reason consistency, LAB/GUARD mode, opaque per-institution request UUID uniqueness, history indexes and an append-only row trigger. No prompt, output, prompt hash or matched value is stored in decisions. The trigger does not prevent a DB owner from changing DDL.

Neon MCP read-only inspection on 2026-11-01 found only the default, unprotected `production` branch (`br-young-bird-b43proeb`) in project `young-frog-60183055`, database `neondb`, with the four public Kernel tables and no Firewall tables. **No approved isolated development target exists; no SQL was applied and no resources or sample data were created.** Existing local environment files were not changed.

Missing tables return `FIREWALL_SCHEMA_MISSING`; missing columns return `FIREWALL_SCHEMA_OUTDATED`; missing privileges return `FIREWALL_DB_PRIVILEGE`; mandatory decision/audit write errors return `REQUIRED_AUDIT_UNAVAILABLE`. Driver details and secrets are not returned. Review runtime-role grants/RLS, approve an isolated target and provider conditions before application or release. Hosting/DNS/Node publication remain outside this local change.
