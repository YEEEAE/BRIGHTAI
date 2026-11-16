# Human Gate public simulation — 2026-11-16
Status: DONE locally; deployment NOT RUN.

- Public product lab and /demo/human-gate/ share a memory-only synthetic queue; no API, Auth, database, production grants, or storage writes.
- Persona switches only a closure variable. All output uses textContent. Reason fields are excluded from capture via ph-no-capture/data-private.
- Lifecycle follows src/server/human-gate/core.mjs and migrations 0007/0014: PENDING → APPROVED/REJECTED/EXPIRED/CANCELLED; APPROVED → EXECUTED/EXPIRED/CANCELLED. decided is a queue filter, never a request state.
- Clarification is explicitly local commentary, remains PENDING, creates neither server decision nor Ledger event.
- Approval records a human decision; only requester can consume ACTIVE permit once. Timeout and authority change prevent execution while preserving recorded decisions.
- Firewall ESCALATE link loads a fixed fixture with no input transfer. Ledger event is an in-page synthetic metadata preview; real Firewall registry/adapter remains unverified.
- PASS: six Node tests including server lifecycle parity, SoD, clarification, one-use execution, terminal rejection, reason requirement, isolation; npm run build (57 public pages); git diff --check.
- PASS Browser: self-approval denied with reason; clarification PENDING; reviewer approval ACTIVE; requester execution EXECUTED and synthetic event. Mobile 390px no horizontal overflow.
- Reference discovery: Made Good Designs approval queue (https://madegooddesigns.com/inspiration/ui/approval-queue-web-minimal-721f5b505bf6); implementation retains project tokens and uses no copied UI code.
- Additional Browser PASS: rejection/cancellation/timeout/lost delegation all block execution; desktop 1440px no horizontal overflow; legacy demo contains the shared queue.
- Dev console limitations: legacy page CSP intentionally blocks Vite WebSocket (connect-src none); favicon.ico 404. Queue interaction passed; these are not API calls or workflow failures.
