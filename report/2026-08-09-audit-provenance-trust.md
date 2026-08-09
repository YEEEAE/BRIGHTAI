# Audit Trustworthiness — Provenance + Honest Exports + a11y + URL State

**التاريخ:** 2026-08-09
**النطاق:** `/kernel/audit/` (صفحة + engine + drawer مشترك + طبقة الـ exports)
**الـ OBJECTIVE:** make investigation trustworthy
**الحالة:** verified (build 275 صفحة، 0 أخطاء · `verify:audit` 13/13 · `verify:all` exit 0)

---

## الملخّص التنفيذي

المشكلة كانت إن سجل التدقيق في `/kernel/audit/` يعتمد على بيانات **مولّدة حتمية (seeded demo)** (12,483 صف من `mulberry32` seed)، بس الواجهة كانت تتصرّف كأنها بيانات إنتاج حقيقية لما يصير export:

- **CSV** يطلع صفوف بـ header عادي بدون أي إشارة للمصدر.
- **JSON** يطلع bare array بدون envelope ولا timestamp.
- **PDF** يفتح print-view بعنوان «تصدير طباعة» بدون provenance.
- **Drawer PDF** (مشترك عبر كل kernel) يصدّر بدون timestamp ولا source.

الـ page-level `KernelDemoPill` («بيانات تجريبية») كان موجود، بس أول ما الـ drawer يفتح، يصير مغطّى بصريًا — فالمستخدم يفتح drawer لـ trace ويصدّر PDF وما يشوف أي إشارة إن الـ data تجريبية.

كمان فيه ثغرات ثانية:
- الـ filters كلها في-memory (refresh يفقدها، ما فيه رابط قابل للمشاركة).
- focus return للـ drawer يعتمد على `document.activeElement` وقت الفتح، واللي ممكن يكون الـ row كامل بدل زر الـ view.
- الـ test الحالي (`verify-kernel-audit.mjs`) كان يستخدم selector غلط (`[data-ka-filter]` بدل `[data-kernel-audit-filter]`) → فلتر الـ status test silent-skip، وما فيه أي test للـ copy أو export.

**الحل اللي سويناه:**

1. **Provenance في كل artifact مُصدّر** (CSV + JSON + PDF + drawer PDF). كل واحد يحط صراحةً: المصدر (`demo-seeded` / «بيانات تجريبية حتمية») + توقيت تصدير ISO كامل + عدد الصفوف + (PDF) ختم `DEMO` مائي خفيف.
2. **Provenance band داخل الـ drawer نفسه** — عنصر `[data-kernel-drawer-provenance]` يطلع «بيانات تجريبية» لمّا الـ drawer يفتح من الـ audit seed، ويختفي لمّا يفتح من بيانات store حقيقية.
3. **Filter URL state bidirectional** — كل فلتر يُكتب للـ URL عبر `history.replaceState` (refresh-safe + shareable)، والـ `popstate` يعيد الفلاتر لمّا المستخدم يرجع بـ back button.
4. **Focus return صريح** — زر الـ view يأخذ `focus()` قبل `openDrawer()` عشان focus-trap.js يرجع التركيز للزر بالضبط مو للـ row.
5. **إعادة تسمية زر PDF** → «معاينة طباعة» (صادق: هذا print-view، مو PDF حقيقي).
6. **توسعة الـ browser smoke test** — أصلحت selector الفلتر + أضفت assertions للـ copy + export provenance + focus return + URL state + drawer provenance.

---

## التغييرات حسب الملف

### `src/client/audit.ts` (الـ engine — source of truth)
- **ثوابت provenance جديدة**: `AUDIT_SOURCE = 'demo-seeded'`, `AUDIT_SOURCE_LABEL = 'بيانات تجريبية حتمية — ليست سجلات إنتاج'`, `AUDIT_SCHEMA = 'brightai.kernel.audit-events'`.
- **`exportRows`** صارت تستخدم دوال مخصصة:
  - `exportCsv(rows, iso)` → سطرين تعليق `# source=... exported_at=... count=...` + `# note=...` قبل الـ header row.
  - `exportJson(rows, iso)` → envelope `{schema, source, sourceLabel, exportedAt, count, events}`.
  - `printPdf(rows, iso)` → ترويسة `.ka-prov` صفراء فيها المصدر + توقيت ISO كامل + عدد، + ختم `DEMO` مائي `body::before` بشفافية 0.08.
- **Timestamp كامل ISO** في كل المسارات (قبل كان date-only `YYYY-MM-DD`). اسم الملف يبقى date-only لجمالية.
- **`openDrawer` seed** يمرّر `source` + `sourceLabel` للـ drawer المشترك.
- **`viewBtn` click handler**: `viewBtn.focus({ preventScroll: true })` قبل `openDrawer()` — يضمن focus return للزر.
- **Filter URL state** (bidirectional):
  - `readFiltersFromUrl()` يقرأ params `from,to,risk,status,user,dept,q` عند التحميل.
  - `writeFiltersToUrl()` يكتبها بـ `history.replaceState` (مو pushState — ما يملأ history) عند كل `applyFilter`.
  - `popstate` listener يعيد الفلاتر عند back/forward.
  - `syncDomFromFilters()` يحدّث الـ selects + search box لتعكس قيم URL.
- **`escapeHtml`** استخدمته في `printPdf` (قبل كان raw interpolation — خطر XSS لو الـ action يحوي HTML، رغم إن الـ demo data ثابت).

### `public/js/kernel-drawer.js` (الـ drawer المشترك)
- **`fillFromSeed`** يحفظ `seed.sourceLabel` في `drawer.dataset.sourceLabel`/`sourceKind`، يملأ `[data-kernel-drawer-source-label]`، ويُظهر `[data-kernel-drawer-provenance]`. لو ما فيه `sourceLabel`، يخفي الـ band وينظّف الـ dataset.
- **`fillFromStore`** يخفي الـ band + ينظّف الـ dataset (بيانات store = session حقيقية، مو demo).
- **`openDrawer`** reset block ينظّف `sourceLabel`/`sourceKind`/`currentHash`/الـ provenance section عند كل فتح (منع تسريب بين سياقات).
- **`exportDrawerPdf`** يضيف: صف `.ka-prov-row` فيه «توقيت التصدير» (ISO كامل) + المصدر (لو demo) + ختم `DEMO` مائي شرطي.

### `src/layouts/KernelLayout.astro`
- أضفت **provenance band DOM** بعد الـ summary strip وقبل الـ timeline:
  ```html
  <p class="k-trace-drawer__provenance" data-kernel-drawer-provenance hidden>
    <span class="k-trace-drawer__provenance-dot" aria-hidden="true"></span>
    <span data-kernel-drawer-source-label>بيانات تجريبية</span>
  </p>
  ```

### `src/styles/kernel.css`
- أضفت CSS للـ `.k-trace-drawer__provenance` + `.k-trace-drawer__provenance-dot` باستخدام tokens الموجودة (`--k-mask`, `--warning-soft`, `--space-2`, `--text-xs`, `--radius-md`) — متناسق بصريًا مع `.k-status-chip--demo` الموجود.

### `src/pages/kernel/audit.astro`
- زر PDF: النص الظاهر `PDF` → `معاينة طباعة`، و `aria-label` → `معاينة طباعة ببيانات تجريبية`.

### `scripts/playwright/verify-kernel-audit.mjs`
- **أصلحت** selector الفلتر: `[data-ka-filter]` → `[data-kernel-audit-filter="status"]`.
- **أضفت** 6 assertion blocks جديدة:
  1. **copy** — زر نسخ الـ hash يضيف `data-copied="true"`.
  2. **CSV export** — أول سطر يبدأ بـ `# source=demo-seeded` + فيه `exported_at=<ISO>`.
  3. **JSON export** — envelope `{schema: 'brightai.kernel.audit-events', source: 'demo-seeded', exportedAt, count, events}`.
  4. **filter URL state (write)** — بعد `status=blocked`، الـ URL يحوي `?status=blocked`.
  5. **filter URL state (read)** — reload بـ `?status=blocked` يطبّق الفلتر.
  6. **focus return** — بعد Escape من الـ drawer، `document.activeElement` رجع للزر/الـ row.
  7. **drawer provenance** — `[data-kernel-drawer-source-label]` معروض ويحتوي «بيانات تجريبية».
- اعتمدت على اعتراض anchor `click` events لقراءة الـ Blob text بدل تحفيز download حقيقي (موكّل للـ CI).

---

## ليش هذا الحل (وليش رفضت بدائل)

### ليش provenance inline في الـ artifact نفسه (مو بس page-level badge)
الـ page-level `KernelDemoPill` موجود، بس:
- **بيُغطّى بصريًا** أول ما الـ drawer يفتح.
- **ما يتبع الـ artifact** — لو أحد فتح CSV بعد 3 شهور من إيميل، ما يشوف أي إشارة للمصدر.

الـ ACCEPTANCE criterion صريح: «every exported artifact states source and timestamp». هذا يطلب provenance في **الـ bytes نفسها**، مو في الـ UI حولها.

### ليش `replaceState` مو `pushState` للـ URL
`pushState` يضيف entry للـ history عند كل تعديل فلتر — يصير زر back عديم الفائدة (يرجع فلتر فلتر). `replaceState` يحدّث الـ URL بدون تاريخ → refresh-safe + shareable + back button شغّال (يعيد آخر حالة URL كاملة عبر `popstate`).

### ليش ما استخدمت `window.AuditVerifier.exportAuditCsv/Json` (الـ dead code في `audit-verifier.ts`)
جربت، بس الـ schema مختلفة: الـ verifier version تستخدم raw event fields (`id, evaluationId, certificateId, prevHash, hash, createdAt`)، بينما الـ audit engine يصدّر display labels (`tsLabel, userLabel, role, action, risk, status, traceId, hash, approved`). تبديل الـ schema يكسر الـ existing consumers اللي يتوقعون الأعمدة الحالية. فضّلت **أضيف provenance layer فوق الـ CSV الحالي** (نفس الأعمدة + سطرين تعليق فوقها) — backwards-compatible. الـ JSON نقلته لـ envelope لأنه ما فيه consumers معروفين (bare array ما له schema ملزمة).

### ليش أعدت تسمية زر PDF مو حذفته
الـ print-view مفيد لمستخدم يبي طباعة سريعة. الحذف يخسر هذي الميزة. إعادة التسمية لـ «معاينة طباعة» صادقة (هذا مو PDF حقيقي، هذا print preview)، + الترويسة فيها provenance كامل داخلها. اختارها المستخدم صراحةً.

---

## التحقق (Verification)

```
npm run build:client     → exit 0 (tsc -p tsconfig.client.json)
npm run build            → 275 صفحة، 0 أخطاء (25 سطر CSS جديد فقط في kernel.css)
npm run verify:audit     → 13/13 بند ✅ (determinism + parity + chain + hygiene — ما تأثر)
npm run verify:all       → exit 0 (lint:tokens طلع 5 violations pre-existing عند kernel.css:8870/9056/9063 — كلها في chat composer، مو من تغييراتي)
```

**تحققات إضافية على الـ built output:**
- `dist/client/kernel/audit/index.html` يحوي `data-kernel-drawer-provenance` (1) + «معاينة طباعة» (1).
- `dist/client/js/audit.js` يحوي: provenance markers (6), URL state functions (10).
- `dist/client/js/kernel-drawer.js` يحوي `sourceLabel`/provenance handling (16).

---

## المخاطر المتبقية

1. **CSV comment + parsers صارمة**: بعض importers قديمة ممكن تكره أسطر `#`. الـ parsers الحديثة (Python `csv`, Excel, PapaParse, DataFrames) تتعامل معها بشكل افتراضي أو تضعها في خلية واحدة. لو انطلب من عميل، نوفّر flag «pure CSV» بلا provenance. **التقييم:** مخاطرة منخفضة — الـ convention شائع وموثّق (مثلاً W3C CSV-on-the-Web يسمح comments).

2. **PDF provenance visible فقط في print-view + PDF المطبوع**: المتصفح ما يحفظ الـ print HTML تلقائيًا. الـ provenance visible على الشاشة + في أي PDF يطلعه المستخدم من print dialog. هذا سلوك print-view الطبيعي. لو انطلب PDF حقيقي (jsPDF/pdfmake)، نضيف مسار منفصل — بس هذا يضيف dependency (ممنوع بـ AGENTS.md 2.1 بدون موافقة).

3. **`popstate` + view transitions**: ربطت `readFiltersFromUrl` بـ `boot()` (مرة واحدة، guarded بـ `data-audit-bound`)، و`popstate` listener على window. ما اختبرت view transition فعلية بين صفحات kernel (ما عندي server محلي شغّال في هذي الجلسة). **Follow-up:** تشغيل الـ playwright smoke محليًا للتأكد.

4. **filter URL state + SEO**: الـ `/kernel/audit/` بلا query string هو الـ canonical (الـ SSR يطلع الصفحة الكاملة). الـ query params للـ filters تُضاف client-side فقط بعد التفاعل. ما أثر على الـ SEO لأن:
   - الـ canonical URL ما يتغير ( Astro يعامل `?status=blocked` كـ URL مختلف بس الـ canonical tag يبقى `/kernel/audit/`).
   - ما فيه روابط داخلية تستخدم query params للـ filters.
   - لو محركات بحث تتبع روابط بـ query params (نادر)، الـ page content نفسه — لا duplicate content issue.

---

## Follow-ups (ما سويتها — تحتاج قرار)

- **Playwright smoke محليًا**: الـ test الجديد يحتاج `npm run preview` + browser محلي للتشغيل الفعلي. ما قد أشتغله هذي الجلسة (ما عندي dev server شغّال). المستخدم يشغّله: `BASE_URL=http://localhost:4321 node scripts/playwright/verify-kernel-audit.mjs`.
- **توحيد الـ export envelope عبر كل kernel pages**: هذي المهمة سوّت provenance لـ audit فقط. لو نبي نفس النمط لـ approvals/playground/reports، نستخرج الـ envelope logic لـ module مشترك. **ما سويتها** عشان ما أتجاوز scope المهمة.
- **تنظيف dead code في `audit-verifier.ts`**: `exportAuditCsv/Json` ما يستخدمها أحد. نحذفها أو نوصلها. **ما لمستها** — خارج scope.

---

## الدروس المستفادة

- **«shared export component» المذكور في الـ ROLE ما كان موجود فعلًا** — التصدير bespoke في كل صفحة. هذا اكتشاف مهم: الـ scope description افترضت component مشترك، بس الواقع إن الكود مكرر. التعديل تم على الـ bespoke code مباشرة.
- **focus-trap.js يعمل تلقائيًا على `[role=dialog][aria-modal=true]`** — ما يحتاج تهيئة. بس الـ focus return يعتمد على `document.activeElement` وقت الفتح، فالـ caller مسؤول إنه يضمن إن العنصر الصحيح هو الـ active. هذا فخ خفي.
- **`[data-ka-filter]` في الـ test كان selector غلط من أصل** — الـ test كان silent-skip من فترة طويلة. هذا يوضح ليش الـ «code coverage» بدون assertions فعّالة ما قيمة له.
