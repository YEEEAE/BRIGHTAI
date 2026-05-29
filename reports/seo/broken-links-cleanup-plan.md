# Broken Links Cleanup Plan

## Baseline

- Baseline command: `npm run internal-links:audit`
- Baseline broken references: 859
- Baseline files scanned: 6179
- Baseline internal references checked: 2828
- Primary high-impact sources: `services/index.html`, `docs/docs.html`, `about/index.html`, `demo/index.html`, `pricing/index.html`, `sitemap/index.html`, and shared frontend JS.

## Classification

### روابط يجب إصلاحها إلى صفحة موجودة

- Legacy service slugs مثل `/ai-agent/`, `/smart-automation/`, `/data-analysis/`, `/machine-learning/`, and service-specific `/services/<slug>/` variants were consolidated to `/services/`.
- Consultation CTAs were consolidated to `/contact/`.
- Missing docs paths were consolidated to `/docs/`.
- Missing demo detail paths were consolidated to `/demo/`.
- Missing sector/location paths were consolidated to `/services/` or `/contact/`.

### روابط يجب إنشاء صفحة لها

- No new page was created in this cleanup phase.
- `/solutions/` was intentionally not created after owner direction that this removed hub should stay removed.

### روابط يجب حذفها

- Removed obsolete internal references to removed legacy routes:
  - `/consultation/`
  - `/ai-agent/`
  - `/smart-automation/`
  - `/ai-bots/`
  - related removed docs variants.

### روابط legacy تحتاج Redirect

- Legacy redirect entries pointing to removed routes were removed instead of preserved, per owner direction.
- Existing canonical pages remain stable: `/services/`, `/contact/`, `/docs/`, `/demo/`, and the five solution pages.

### روابط خارجية تحتاج استبدال أو حذف

- No external broken-link source was kept as a blocking production issue in this pass.
- The main cleanup focused on internal IA and sitemap safety.

## Repair Order

1. Header and shared navigation references.
2. Homepage links and solution cards.
3. Services, docs, pricing, sitemap page, and footer links.
4. Shared search/catalog/runtime JS route references.
5. Sitemap generation and canonical/hreflang validation.
6. Production guard cleanup for robots, metadata, H1, and invalid frontend path exposure.

## Sitemap Policy

- Keep only indexable public marketing URLs.
- Exclude dashboard/admin/auth-like pages from primary sitemap unless they are public marketing experiences.
- Keep `/solutions/ai-governance-platform/`, `/solutions/ai-firewall/`, `/solutions/ai-audit-trail/`, `/solutions/human-approval-layer/`, and `/solutions/ai-evidence-file/`.
- Do not include removed hub `/solutions/`.

## Deferred Items

- Architecture report still lists orphan/canonical observations that are not broken links.
- `sitemap-images.xml` was not treated as the canonical marketing sitemap for this task.
