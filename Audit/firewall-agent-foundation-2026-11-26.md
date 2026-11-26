# Firewall agent foundation — 2026-11-26

Status: PARTIAL. Local source and tests only; no target environment verification.

- Five read-only Firewall handlers are registered with the Kernel agent runtime. They load tenant rules inside the runtime transaction and return bounded decision metadata; no provider or external tool is called.
- Kernel policy is checked before and after each tool. Unknown tools, malformed arguments and missing rules storage fail closed. Authenticated `POST /app/api/firewall/agent/` invokes the bounded metadata-only model tool loop; it does not authorize execution or send the submitted text to Groq.
- Local API contract: 200 PASS; disposable PostgreSQL 18 review integration: 5 PASS, including changed payload and product grant. Agent, runtime and Groq tool tests: 27 PASS on the preceding version; the current focused run is recorded in the task response.
- Injection-only fixture, four manually labeled examples: false positives 1/1 negative; false negatives 1/3 positive. This tiny synthetic sample describes neither general accuracy nor production traffic.
- A configured review requires `AIGAS_FIREWALL_REVIEW_BINDING_KEY`, a stable secret of at least 32 bytes, and an active administrative Firewall grant. Provision a high-entropy secret through the approved runtime secret store; never commit or log it. Missing key/grant stops review creation. Rotating the key invalidates pending reviews; legacy reviews without the grant commitment fail closed. The outer fingerprint binds the request payload and grant; Human Gate rechecks the current grant before a decision. Trial/exploration-only grants are not supported by this review path.
- Open: approved provider/model and actual external provider verification, integrated approval-to-execution (still intentionally blocked), and target-environment evidence. Both provider and model registries are empty. Synthetic tests cover replay, provider rejection and changed verdict for the loop, not a live provider or an authenticated end-to-end endpoint.
- FW-01, FW-03 and FW-04: target PASS_VERIFIED NOT VERIFIED. Existing synthetic default-deny registry and local tests are not target-environment evidence.
