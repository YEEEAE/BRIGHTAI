# Deployment Config Archive

## Status
- Official production provider: Netlify
- Official source of truth: `netlify.toml`

## Archived legacy files
- `.htaccess.legacy`: historical Apache rules (routing, headers, caching)
- `_headers.legacy`: historical Netlify headers file before centralization

## Reason for archive
Routing, security headers, and caching rules are now maintained in one place only (`netlify.toml`) to remove conflicts and drift.
