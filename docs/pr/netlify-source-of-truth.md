# PR: Enforce Netlify as Single Source of Truth

## Summary
This PR resolves configuration drift between `netlify.toml`, `.htaccess`, and `_headers` by making Netlify the only production source of truth for:
- Routing and redirects
- Security headers
- Caching policies

## What Changed
- Centralized production redirects/headers/caching in `netlify.toml`
- Archived root `.htaccess` and `_headers` as documentation-only files
- Preserved legacy config snapshots in `docs/deployment-archive/`
- Added automated validation script:
  - `scripts/verify-netlify-source-of-truth.mjs`
  - `npm run deploy:source-of-truth:check`
- Added CI workflow gate:
  - `.github/workflows/netlify-source-of-truth.yml`

## Why
Multiple active configuration sources caused drift risk, conflicting redirect behavior, and unclear ownership for production routing/security/cache policy.

## Validation
- Local validation command:
  - `npm run deploy:source-of-truth:check`
- Result:
  - `Source-of-truth validation passed (25 checks).`

## Risk / Impact
- Low runtime risk on Netlify (rules are centralized and validated).
- Apache/legacy files are intentionally non-active and retained for traceability.

## Rollback
- Revert commit `1c9f97f9` if needed.
- Legacy config snapshots remain available under `docs/deployment-archive/`.
