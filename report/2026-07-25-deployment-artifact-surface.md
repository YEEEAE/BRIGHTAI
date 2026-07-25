# P0 — Deployment Artifact Surface

**Date**: 2026-07-25  
**Task**: إغلاق نشر ملفات الـ build/source غير المقصودة على خدمة Render.  
**Status**: verified locally — بانتظار deploy.

---

## Verification Status (BAI-PROC-12)

- **verified_local**: yes
  - `pnpm run build` (locally on macOS) — 196 pages, 0 errors
  - `pnpm run verify:all` (locally) — 5/5 checks pass
  - `pnpm run seo:schema` (locally) — 55 schema pages
  - `pnpm run verify:deployment-surface` (locally, against local preview server) — `/` 200, `/client/index.html` 404, `/frontend/server.js` 404
- **verified_production**: no
- **verified_production_blocker**: awaiting user commit + Render auto-deploy + `pnpm run cloudflare:purge` per BAI-DEPLOY-11 (2026-07-25). Without these three steps, the live brightai.site still serves the artifact from the prior build.

> The PASS marks below are LOCAL verification only. They do not prove the fix reached production. Production verification requires `pnpm run verify:production` after the deploy + Cloudflare purge, and this report's `verified_production` field updated accordingly.

## وش تغيّر

- `scripts/sync-dist-flat.mjs` صار guard فقط: يتحقق من `dist/client/` و`dist/server/entry.mjs` بدون نسخ ملفات العميل إلى جذر `dist/`.
- `render.yaml` يشغّل `pnpm run verify:deployment-surface` قبل deploy، ويُبقي `node ./dist/server/entry.mjs` كما هو.
- أضفنا `scripts/verify-deployment-surface.mjs` عشان يشغل الـ standalone server محليًا ويتأكد من `/` وpaths الممنوعة.
- سكربتات sitemap/schema/SEO/CSS صارت تقرأ وتعدّل `dist/client/` مباشرة. قبل كذا كانت تعتمد على نسخة مسطّحة قديمة في `dist/`.

## اللي ما لمسناه

- `startCommand: node ./dist/server/entry.mjs`.
- روابط canonical العامة ذات trailing slash.
- أي نص عربي منشور.
- `frontend/` نفسه؛ صار فقط غير قابل للوصول من سطح الـ HTTP للـ standalone server.

## التحقق (محلياً فقط — راجع Verification Status فوق)

- `pnpm run build` — PASS (local)
- `pnpm run verify:all` — PASS (local)
- `pnpm run seo:schema` — PASS (local). صار يفحص 55 صفحة schema بدل 0 صفحة صامتة.
- `pnpm run verify:deployment-surface` — PASS (local).
  - `/` → 200
  - `/client/index.html` → 404
  - `/frontend/server.js` → 404
- جذر `dist/` ما عاد يحتوي `index.html` أو `_astro/`؛ الـ static files في `dist/client/` والـ SSR entry في `dist/server/entry.mjs`.

## المخاطر والخطوة بعد deploy

التحقق هنا محلي، لذلك لازم نعيد curl على `https://brightai.site` بعد ما Render يبني artifact الجديد. لو طلع regression، الـ rollback هو revert للـ PR commit الواحد ثم redeploy حسب طلب المهمة.

