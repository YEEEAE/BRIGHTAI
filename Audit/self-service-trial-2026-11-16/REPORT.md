# Verified-email synthetic trial — 2026-11-16

Status: VERIFIED on isolated Neon Staging through a local Node origin; public deployment NOT RUN. Product access is a limited read-only tier, not production readiness or an approval to execute AI.

## Delivered

- Every product page and catalog entry offers “جرّب المختبر الآن بلا حساب” and “ابدأ تجربة تشغيلية 48 ساعة”. Public demos remain independent of identity and providers.
- Managed Auth signup, explicit email OTP verification, and a return path using email OTP signin. The real participant received and supplied the verification code; no emailVerified override was used for this journey. Passwordless return signin is implemented but was not separately exercised.
- Server-only atomic bootstrap: one trial per verified, non-banned identity; idempotent and serialized; a new isolated Tenant, MEMBER membership, five bounded exploration grants, a synthetic risk asset and revision, synthetic dataset metadata, and a required sanitized audit receipt. No OWNER, ADMIN, trial operator, card, subscription, provider grant, renewal, or automatic payment conversion.
- Database-owned 172800-second window and 100 read units per product. All five begin at the conservative read-only tier; escalation to operational writes remains an independent readiness/operator decision. Reloading, signing in again, changing URL/local storage, and requesting start again cannot renew the window or quota.
- Trial Home `/app/trial/`: 5/5 products, Kernel, server-derived remaining time and quotas, human-readable allowed reads, `DEMO AVAILABLE`, `TRIAL LIMITED`, and `PROVIDER APPROVAL REQUIRED`. Countdown uses elapsed monotonic client time for display; authorization and expiry remain database decisions. No background DB polling; explicit refresh and expiry revalidation.
- Opening a product requires a server permission request; every destination independently authorizes and meters the actual read. Risk read access includes its action/history/revision/treatment views; mutation/export/provider execution stays denied.

## Fresh evidence

| Check | Result |
| --- | --- |
| `npm run build` | PASS; 57 public pages; new SSR home/API built |
| Focused identity/navigation/trial unit checks | 13 PASS, zero skips |
| `node scripts/verify-exploration-local.mjs` | PASS on disposable PostgreSQL 18 with NOBYPASSRLS runtime; see `db.log` |
| Real email verification → start → Tenant → grants | PASS, managed Auth plus Neon Staging; MEMBER and five grants read back |
| Window and quotas read back | PASS: every grant exactly 172800 seconds and 100 units |
| Product reads | Firewall rules, Ledger events, Human Gate requests, Risk assets, Secure Chat models all HTTP 200 |
| Synthetic product record | Risk asset rendered from Staging, with read-only MEMBER view |
| Own versus another existing Tenant | Own Trial Home HTTP 200; other existing Tenant HTTP 403 `FORBIDDEN` |
| Real provider attempt | HTTP 403 `EXPLORATION_CAPABILITY_DENIED`; models reports available=false; no completion requested |
| Expiry | PASS locally, and on Staging via a controlled past-window fixture inside a rolled-back subtransaction; `EXPLORATION_EXPIRED` asserted under runtime role and original deadline read back unchanged |
| Concurrent start / quota / no renewal | PASS locally: one Tenant from concurrent starts, one success for last quota unit, expired start returns same Tenant |
| Audit and rollback | PASS locally: suppressed bootstrap audit rolls back all Tenant/data/grant writes; direct runtime receipt updates denied |
| Browser | Auth verification controls and Trial Home at 390/1440; 5 cards; no horizontal overflow; no trial/grant/tenant authorization keys in local storage |
| Public CTA artifacts | PASS on all five generated product pages |

Expiry evidence simulates an elapsed window; it is not a claim that 48 wall-clock hours have already elapsed. The participant's real trial remains active until **2026-11-18 16:23:24 Asia/Riyadh**. User email, OTP, password, JWT, DSN and identity UUID are intentionally absent from these artifacts.

## Staging change and runtime

- Target: project `lucky-salad-43566291`, branch `br-rough-wind-bdkmg13n`, database `neondb`; production was not accessed for writes.
- Existing ledger: all 29 rows compared to local migration hashes, zero drift. `0034_aigas_self_service_trial.sql` applied with its receipt in one guarded transaction; ledger now 30 APPLIED.
- Applied SHA-256: `3eaec85c8fd31261d8626cc117500e051294b6b2ff52630743871d43eb1318ad`.
- Existing `aigas_t03_exploration_login` switches to `aigas_runtime`; direct connection verified NOSUPERUSER/NOBYPASSRLS. Neon pooler rejects startup `options=-c role=...`; verification therefore uses the same branch's unpooled endpoint. No privileges were added to the login role.
- Local preview: `http://localhost:4428/app/trial/`. Runtime settings injected in process; temporary credential file mode 0600 removed immediately after loading; `.env*` unchanged. Reopening the preview may require email-code signin.
- Staging Auth currently does not require verification at signup/signin globally. Trial bootstrap independently requires the authoritative Auth catalog's verified email flag and a non-banned user. Global Auth settings were not weakened or changed.

Audit payloads: durable `trial.synthetic.started` and `exploration.browse.<allowlisted-product>` actions; outward diagnostics use event/code/status/operation only. Tokens, text, email, tenant selectors and provider prompts are excluded. Denials do not create successful business events.

## Limits

- No production deploy, Git commit/push, branch creation, workflow/environment-file change, paid provider request or commercial readiness claim.
- Only conservative read capabilities were approved by this implementation. No product readiness receipt, provider region/policy/cost approval or human-review integration was fabricated.
- Real Auth runs on isolated Staging; the web origin is local, not a newly deployed public service. Waiting for actual wall-clock expiry and separately testing passwordless return signin remain unperformed.
- Delivery/debugging encountered and resolved: loopback origin rejection (localhost works), a pooler startup-role rejection (direct runtime connection used), and Risk's required secondary read operation initially denied (explicit read allowlist fixed). Synthetic Human Gate seeding was rejected by its current policy-binding constraint and removed; its empty list is truthful.

References: [Neon Email OTP](https://neon.com/docs/auth/guides/plugins/email-otp); first-run flow research from [Made Good Designs](https://madegooddesigns.com/inspiration/ui/flows/first-run?platform=web&style=corporate). Existing project design tokens and layout were retained.
