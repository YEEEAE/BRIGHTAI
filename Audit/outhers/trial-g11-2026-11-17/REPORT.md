# G-11 — PARTIAL

- OTP success now requires a fresh verified session before navigation.
- Trial HTTP 401 offers explicit 15-minute token expiry guidance and sign-in link; mutations are not automatically replayed.
- Build: PASS (57 public pages).
- Exploration local PostgreSQL harness: PASS, 1/1 top-level integration test; not 112/112. Includes concurrent/idempotent start, five grants, quota/window and isolation assertions.
- Trial local harness: failures observed; full suite not accepted. See local console evidence; no claim of 112/112.
- HTTPS journey, screenshots, synthetic-account approval, OTP return, localStorage clearing and published security headers: NOT VERIFIED. Render connector initialization failed; public DNS lookup failed in sandbox. No deployment performed.
- No secrets, real email, OTP or JWT recorded. No external account created.
- Exit criterion remains OPEN. No public enablement. No new E2E file presented as a verified journey.
