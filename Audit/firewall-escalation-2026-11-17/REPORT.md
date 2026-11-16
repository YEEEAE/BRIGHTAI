# Firewall escalation — local implementation

Status: PARTIAL. No shared database migration, commit, push or deployment.

- 0037 adds `FIREWALL_ESCALATION_REVIEW` and default-off `aigas_hg_policies.firewall_escalation_enabled`. Application to a shared database requires owner approval. Policy activation remains an operator database action under separate authorization.
- The server creates a metadata-only PENDING Human Gate request in the Firewall transaction. Any failure rolls back both. Payload has exactly decision_id, rule_id, rule_version, request_fingerprint; title/description/reason are fixed server literals. No submitted request text is passed to the adapter or advisory.
- Human Gate supports listing/decision/digest checks and unconditional independent review for this operation, including database guards. Policy revision, rule revision/disable and integration disable invalidate eligibility. Execution stays blocked; the generic note executor cannot consume this approval or claim provider execution.
- Provider replies pass full-output deterministic rules plus protectText; missing rules, >4000 characters, WARN/ESCALATE/DENY, secrets or invalid policy withhold the reply. No streaming.
- Advisory function uses the governed Groq gateway with only action/reason metadata and an exact tenant-bound model; it returns a separate advisory object, cannot update a verdict, and is not wired as a UI/runtime governing path. No external advisory call was made.

Verification:
- PostgreSQL 18.6 disposable localhost fresh schema including 0037: PASS.
- Requested pair `node --test tests/firewall-review-binding.test.mjs tests/human-gate-db.test.mjs`: original binding test + existing DB journey PASS (2/2); expanded Firewall review suite separately PASS 5/5 including real runtime role, pending binding/202, list visibility, self-review denial with SoD disabled, independent rejection, approval invalidation after rule version change, atomic rollback and disabled fallback.
- Firewall/Human Gate/Groq focused unit suites: 20 PASS.
- Astro build: PASS (57 public pages). Final text/dashboard follow-up build and 20 focused tests also PASS.

Limits/open work:
- No authenticated browser journey, real provider response, shared migration, or owner-approved tenant activation verified.
- No approved provider-execution/resume adapter exists: even an APPROVED review does not send a request. A future resume contract must re-evaluate current Kernel/rules, bind the actual resubmitted content without storing raw text, and atomically consume an independently approved single-use permit. Existing request fingerprint covers request UUID and decision metadata, not request text. Do not advertise this as a complete approve-and-send workflow.
- req_ref REQ-18/22/38 remain unverified; metadata-only advisory cannot interpret ambiguous raw text by design.

Test harness note: parallel fresh-schema installation in separate databases on one PostgreSQL cluster raced on global role DDL (`tuple concurrently updated`). Run DB suites with `--test-concurrency=1`; do not treat this setup race as an application failure.

Final combined run: `node --test --test-concurrency=1 tests/firewall-review-binding.test.mjs tests/human-gate-db.test.mjs` with two fresh localhost DBs: 6 PASS, 0 FAIL, 0 SKIP (61.75s). Final focused unit suites: 20 PASS. Final build: PASS. `git diff --check`: PASS.
