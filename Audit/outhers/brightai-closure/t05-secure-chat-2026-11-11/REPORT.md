# T05 — Secure Chat policy integration

**PARTIAL — live product send remains BLOCKED_BY_DEPENDENCY.**

2026-11-11, Asia/Riyadh. Initial/final HEAD: `dcd52eac9f14465a32cfc166a44b5387edf5a636`, branch `main`, plus this working tree. Requested baseline `6a3d53f41b5bd1af59eb320245745498765bd320` had drifted; the three cited defects remained present. HEAD/tree rechecked before editing. Existing changes to `opencode.json` and Project Mind preserved; concurrent changes to OpenCode were not edited by this task.

## Source change

- Replaced the unconditional integration error with a tenant-scoped transaction: recheck Chat access, lock the tenant, evaluate the real Kernel policy (`secure-chat.send`, synthetic classification, server-selected provider/model/region), load the tenant Firewall rules and inspect every outgoing user/assistant turn.
- Baseline secret blocking and redaction remain mandatory. Firewall DENY/ESCALATE/WARN/unmatched input stops dispatch; REDACT must pass a second enforced check. No Human Gate approval is fabricated. No Firewall AI provider or separate Firewall product licence is required to run these local rules.
- Kernel policy evidence and a metadata-only audit bind to the request correlation ID. Refusals commit their audit before throwing; a failed evidence write stops dispatch. No content, rule literal or conversation hash is persisted by this integration.
- Model availability now derives from model/key/approval, approved quota function availability, actual send permission, Kernel ALLOW and valid Firewall rules including an enabled ALLOW. Browsing remains independent. Request-specific policy and quotas are rechecked on sending.
- Final provider bytes are bounded again after Firewall redaction; replacement markers cannot silently exceed the reviewed input/reservation ceiling. Existing provider timeout, reservation, settlement and UNKNOWN behavior retained; cancellation is checked again after the policy transaction.
- Each turn now has the existing Firewall limit of 4000 UTF-16 code units. Longer assistant history is refused, without truncation or partial inspection. Existing aggregate/model bounds still apply.

`APPROVED_MODELS` remains empty. No provider/model/privacy approval was fabricated and no key was copied or aliased. `GROQ_API_KEY` is distinct from the required product adapter key `AIGAS_SC_<PROVIDER>_API_KEY`.

## Owner decisions and missing configuration

Owner explicitly selected **BRIGHT AI**, **5 requests per institution per day**, **30,000 tokens per institution per day**, **48-hour access window** in this chat. These are approved ceilings, not provider/privacy approval. Owner confirmed no supporting privacy document exists.

These limits were used only for the disposable cancellation scenario and documented here; they are **not activated in a persistent institution**. Read-only lookup of the current `.env` database returned no case-insensitive exact `BRIGHT AI` tenant match at `2026-11-11T03:03:55.775Z`. This proves only absence of that exact name in this connection. No other tenant was selected; no tenant or grant was created remotely. A real tenant UUID and approved 48-hour grant are still needed. No `AIGAS_SC_*` names were configured in the inspected process; only names, never secret values, were emitted.

## Current checks

Environment: macOS, Node `v22.22.2`; PostgreSQL18 disposable loopback cluster on55438, current migrations, `aigas_runtime` NOSUPERUSER/NOBYPASSRLS. Synthetic Auth catalog/identities are local fixtures, not managed Auth. DB test runner never loads `.env` and blocks external sockets. Cluster stopped and removed.

| Time (2026-11-11) | Check | Evidence |
|---|---|---|
| ~06:01–06:02 Riyadh session interval | Single authorized Groq models-list GET after sandbox network restriction | PASS: HTTP200, selected `qwen/qwen3.8-27b` present. No completion request, content or usage. Confirms models API authentication/visibility, not inference permission, ZDR or product readiness. |
| 06:03:55.775 Riyadh | Read-only tenant lookup, current configured DB | PASS query, target name absent; no writes. |
| 06:03:02 Riyadh | First focused unit run | PASS10/10; no external sockets. |
| 06:05:13 Riyadh | First local DB launch | BLOCKED: sandbox `shmget` permission; isolated launch subsequently allowed. [Output](local-db-sandbox-blocked.txt). |
| 06:05–06:06 Riyadh session interval | Initial DB scenario | FAIL1: test compared PostgreSQL bigint string with JS number. Assertion converted explicitly; application unchanged. [Output](local-db-initial-failure.tap). |
| 06:06:10.588 Riyadh | Corrected DB scenario | PASS1; superseded by final run below after a readiness check was tightened. |
| 06:07:02 Riyadh command completion | Final focused unit run | PASS10/10, FAIL0, SKIP0. [Output](unit.tap). |
| 06:07:05.594 Riyadh scenario readback | Final isolated DB scenario | PASS1, FAIL0, SKIP0. [Output](local-db.tap). Real Kernel ALLOW and unavailable-policy refusal, Firewall redaction/history denial, sensitive refusal, unauthorized/expired grant refusal, durable audit and conservative cancellation. |
| 06:07:24 Riyadh | Final source diff check | PASS `git diff --check`; reviewed protected UI and secret/config exclusions. |

Commands: `node --import ./tests/helpers/no-egress.mjs --test tests/secure-chat.test.mjs tests/secure-chat-policy.test.mjs`; `node scripts/verify-chat-policy-local.mjs`.

Final local policy correlation `945d3ac9-235d-4eed-9da3-0f468a76025b`; denied-history correlation `07c5d772-7e1a-4cd7-94a3-ab4f900a9cff`; cancellation correlation `c3a6ac11-b78a-44e6-88e8-7c922a9ca1f1`. Provider status **NOT_CALLED**, usage **null**, conservative quota charge **4096** after reserve/cancel/settle; no claim of provider consumption or zero cost. These are local policy/cancellation evidence, **not** the required live completion correlation/status/usage/quota delta.

Live completion inside product, authenticated Browser journey, successful usage settlement, real provider-unavailable response, live quota and persistent 48-hour grant: **NOT RUN / BLOCKED**. No fake model answer, provider fixture response or bypass was used. Build/E2E/full suite not run; no UI changes.

## Official provider contract evidence

- [Groq models](https://console.groq.com/docs/models): selected Qwen model listed as preview; preview availability can change. Current account models GET above is separate evidence.
- [OpenAI compatibility](https://console.groq.com/docs/openai): base URL `https://api.groq.com/openai/v1`; `n`, if supplied, must equal1. Existing adapter uses a single completion without redirects/retries/fallback.
- [Groq data handling](https://console.groq.com/docs/your-data): usage metadata retained; reliability/abuse input-output logs may be retained up to30 days; ZDR is an organization setting. Retained customer data is located in US GCP buckets. Neither account ZDR nor inference processing region nor a no-training approval was verified. **No Saudi residency claim.** Public documentation is not approval of this institution's settings.

## Blockers, owners and decisions

- **Identity/Operations + DBA (T03):** identify/create the intended institution through the authorized operator channel, establish a real runtime connection and grant the approved48h window; current configured connection has no exact target.
- **AI Systems / Privacy / owner:** bind model approval to that tenant UUID and expiry, document applicable no-training/retention/region terms and account controls. Owner authorized integration and the ceilings above; missing evidence was not converted into approval.
- **AI Systems / Operations:** configure the product adapter and approved daily ceilings without conflating the generic Groq key. `.env*` modification remains separately scoped; none occurred.
- **QA:** after dependencies, perform one real synthetic product completion and capture correlation, provider status, validated usage and quota delta; confirm sensitive refusal before egress. Local gate tests do not close this acceptance criterion.
- **DevOps (T01):** publication remains outside this task.

Source: policy integration implemented, model registry closed. Local: focused policy/DB/cancellation PASS. Published: unchanged, not verified. Approval: ceilings/window approved; model/privacy/tenant configuration incomplete.

**Internal shared: NOT READY. Public: NO-GO. Commercial: NO-GO.**

Rollback: keep the selected provider absent from `APPROVED_MODELS` (current state) or remove its future approved entry; reads/settings remain available under their existing access grants. Preserve audit and UNKNOWN/reserved quota records. No schema migration required by this change.

Hero/header/logo/Constellation/copy/buttons/links/shared CSS, `.env*`, workflows and external data were not changed. No branch, commit, push, PR, merge, deploy or DNS action. Graphify graph/executable absent. Skills used: `karpathy-guidelines`, `verification-before-completion`.
