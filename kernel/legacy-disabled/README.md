# kernel/legacy-disabled/ — Archived Inert Code (KERNEL-AUDIT-2026-07-15-BATCH-9)

> **هذه الملفات غير مستخدمة في production.** تم أرشفتها من `kernel/` بناءً على نتائج الـ audit (read-only mode 2026-07-15).

## السياق

الـ kernel feature كان في الأصل static HTML + JS في `kernel/` (Express-less). تم ترحيل الـ kernel تدريجياً إلى Astro (`src/pages/kernel/` + `src/components/kernel/` + `src/pages/api/`). الـ static-HTML legacy code بقي في `kernel/` لكن ما عاد يُحمَّل من أي Astro page (تأكد audit Phase 1 من grep عبر `src/` و `public/` — 0 references).

## الـ risks اللي تحيّدها الأرشفة

- **`kernel/sw.js`** (legacy service worker): كان يـ cache `/api/kernel/*` endpoints اللي ما تعود موجودة + يستخدم `periodicBackgroundSync` + IndexedDB queue مع PII. الـ risk: لو حد ضاف `<script src="/kernel/sw.js">` بالخطأ في Astro build، الـ SW يصير active. أرشفته يلغي الـ risk.
- **`kernel/manifest.json`** (legacy PWA manifest): `share_target` POST لـ `/kernel/chat/` (static GET page) → 404. مربك بدون فائدة.
- **`kernel/assets/js/kernel-mock-handlers.js`**: monkey-patches `window.fetch` لما `localStorage.brightai_kernel_demo_mode === 'true'`. أي XSS injection ممكن يقلب الـ flag ويستبدل data production بـ mock. أرشفته يلغي الـ attack surface.
- **`kernel/assets/js/kernel-api.js` + `kernel-demo-store.js`**: `shouldUseDemoData()` يقرأ localStorage flag. نفس الـ risk.
- **`kernel/api/mock/*.json` (8 files)**: تحتوي realistic-looking Saudi PII patterns (national IDs, IBANs). هي synthetic demo seeds، لكن وجودها في الـ repo خطر regulatory لو accidental bundled.
- **`kernel/kernel-perf.js` + `kernel-web-vitals.js`**: legacy perf instrumentation ما يُحمَّل من Astro.
- **`kernel/assets/js/*.js` (17 files)**: legacy kernel JS surface (chat, mobile, nav, aurora, notifications, إلخ). كلها inert.

## الـ grep verification (2026-07-15)

```bash
grep -rn "kernel/sw.js\|kernel/manifest\|kernel-mock-handlers\|kernel-pwa\|kernel-api\|kernel-demo-store" src/ public/
# 0 hits

grep -rn "navigator.serviceWorker" src/
# 0 hits (only public/js/sw-register.js for active /sw.js)

find dist -path "*kernel/api*"
# 0 results (mock JSONs not bundled)
```

## الـ migration path

لو احتجت أي من هذه الملفات في المستقبل (e.g. legacy reverse proxy، static export لـ subdomain قديم):

1. **Restore**: `git mv kernel/legacy-disabled/<file> kernel/<file>`
2. **Verify still inert**: run the audit grep commands again
3. **Document why restoring**: update this README with rationale
4. **Never delete without snapshot** — هذه الملفات history (pre-Astro migration) وممكن تحتاج للـ audit trail

## الـ verification CI (✅ مُطبَّق — KRN-005 + KRN-006، 2026-07-15)

سكربتين CI guards مطبّقين في `scripts/`:

- `scripts/verify-no-legacy-sw.mjs` (KRN-005) — يفشل البناء لو في `kernel/` (مو `legacy-disabled/`) أي ملف يسجّل `navigator.serviceWorker.register`، أو يربط بـ `kernel/manifest.json` / `kernel/sw.js` / `kernel/assets/js/kernel-pwa.js`. شغّله: `npm run verify:no-legacy-sw`.
- `scripts/verify-no-legacy-mock.mjs` (KRN-006) — يفشل البناء لو في `kernel/` أي ملف يذكر `window.fetch` أو الـ localStorage flag للـ demo mode. شغّله: `npm run verify:no-legacy-mock`.

الـ guards يفحصون `kernel/` recursive، يستثنون `kernel/legacy-disabled/` (الأرشيف) و `.md` (التوثيق). Pure file read + regex، < 100ms، بدون network calls. مربوطين بـ `package.json` scripts (`verify:no-legacy-sw` + `verify:no-legacy-mock`)، والـ user يقرر متى يضيفهم لـ `prebuild` أو `verify:all`.

الـ subfolder `kernel/legacy-disabled/mock/` (KRN-006) فيه الـ 3 ملفات mock المعزولة + README.md يوثّق الـ risk + الـ migration path.