# Deployment Governance Runbook

## Production Provider
- Official production provider: **Netlify**
- Official source of truth for routing/security headers/caching: **`/netlify.toml`**

## Active vs Archived Config Files
| File | Status | Purpose |
|---|---|---|
| `netlify.toml` | Active | All production redirects, headers, and caching policy |
| `.htaccess` | Archived | Documentation pointer only (no active directives) |
| `_headers` | Archived | Documentation pointer only (no active directives) |
| `docs/deployment-archive/.htaccess.legacy` | Archive snapshot | Historical Apache rules |
| `docs/deployment-archive/_headers.legacy` | Archive snapshot | Historical headers rules |

## Change Policy
1. Any production routing/header/cache change must be done in `netlify.toml` only.
2. `.htaccess` and `_headers` must remain non-active archived files.
3. Every change must pass:
   - `npm run deploy:source-of-truth:check`
4. PR must include a short note describing:
   - Redirects changed
   - Security headers changed
   - Cache policy changed

## CI Enforcement
- Workflow: `.github/workflows/netlify-source-of-truth.yml`
- Required check name: **`Validate Netlify Source of Truth`**

## Branch Protection (GitHub)
Configure branch protection for `main` and require:
1. Status check: `Validate Netlify Source of Truth`
2. Require pull request before merge
3. Dismiss stale approvals when new commits are pushed
4. Restrict direct pushes to `main` (recommended)

## Local Validation Command
```bash
npm run deploy:source-of-truth:check
```

## Incident / Rollback
If redirect/header/caching regression is detected:
1. Revert the latest deployment-governance commit(s).
2. Re-run `npm run deploy:source-of-truth:check`.
3. Redeploy from a known-good commit.
