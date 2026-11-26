# Firewall Groq registry — pending evidence

Status: BLOCKED for live provider enrollment; local review only. No credentials are recorded here.

- Local `.env` specifies `qwen/qwen3.8-27b`. Presence does not establish access, product approval, privacy terms or current pricing.
- Local `AIGAS_SC_GROQ_API_KEY` now matches the owner-selected `GROQ_API_KEY`; `resolveProviderSecret` accepts the pair. This checks configuration consistency only, not credential validity or provider approval.
- Firewall `approvedProviders` and Secure Chat `APPROVED_MODELS` are empty. Their required fields include tenant scope, approval reference and dates, model and region, account-specific retention and no-training evidence, rate and token limits, prices and references. A provider entry also needs a reviewed adapter.
- The Groq budget file, daily limit and monthly limit are absent from the local environment. A durable shared budget store and approved limits are required by the gateway before network calls.
- Required owner input: authorized tenant, validity period, approved region, account-specific retention/no-training references and spending limits. Verify current model availability, limits and pricing from the provider before recording them. Do not include secrets in the registry or evidence.
- Review binding secret is present locally; local `.env` is not evidence of staging or production configuration. Existing review approvals fail closed when the binding key is missing or changed.
- No registry entries were fabricated, no provider request was sent and no spend was incurred. Target-environment PASS_VERIFIED is not established.
