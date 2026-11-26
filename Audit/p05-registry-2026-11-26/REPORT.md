# P05 — Registry foundation (2026-11-26)

Status: PARTIAL. Local implementation only; no deployment or target database migration.

- 0048 adds append-only tenant-scoped versioned registry records and approval/revocation decisions with FORCE RLS. Kernel validates membership, role, revision, independent approval, expiry and revocation. Secure Chat is included; governing and third-party agents have distinct kinds.
- Kernel API provides read, create, revision, approval and revocation. The Kernel screen reads current records; it does not provide a registry editor. Revision replaces destructive deletion; history is retained in PostgreSQL, but no history API is exposed.
- Pack source and requirement/control/finding/evidence references are stored as metadata. They are not linked to existing policy versions or evaluated by the policy engine. Registry decisions do not authorize agent execution, model use, or product access. Existing Kernel policy lifecycle and deny resolution remain separate. There is no commercial licence issuer.
- Local PostgreSQL 18: fresh migrations through 0048 and isolated synthetic lifecycle test PASS, covering tenant separation, member write rejection, independent review, expired approval, revocation and stale revision. This is not exhaustive RLS or concurrency coverage.
- API contract 198/198 PASS on localhost; focused governance/identity tests 13/13 PASS; build PASS. Authenticated UI and target environment NOT VERIFIED.
- RG-01–RG-05 remain PARTIAL / NOT VERIFIED in required target environment. P19, P20 and P27 specialist work remains open.
