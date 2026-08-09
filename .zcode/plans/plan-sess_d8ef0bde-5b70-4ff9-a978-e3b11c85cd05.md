## خطة العمل — Audit Trustworthiness (provenance + honest exports + a11y + URL state)

### السياق اللي اكتشفته (يحكم باقي الخطة)

- **ما في "shared export component" فعلي** — التصدير bespoke في `src/client/audit.ts`. الـ `audit-verifier.ts` فيه `exportAuditCsv/Json` جاهزة بـ provenance (`exportedAt`, `schema`) بس **dead code** (ما يستخدمها أحد).
- **`public/js/audit.js` = compiled output** من `tsc -p tsconfig.client.json` (`build:client`). أعدّل `src/client/audit.ts` فقط، والـ build يولّد الـ shipped JS. **ما أمس الـ `.js` يدويًا.**
- **focus-trap.js يعمل تلقائيًا** على `#k-trace-drawer` (لأنه `role=dialog aria-modal=true`) ويعيد التركيز تلقائيًا لـ `document.activeElement` وقت الفتح. المشكلة: (أ) الـ test ما يتحقق من focus return، (ب) لو الـ click أتى من keyboard `Enter` على row كامل (مو زر الـ view)، الـ activeElement قبل الفتح يكون الـ row نفسه — وهذا **يعمل**، بس لازم أتأكد إن زر الـ view داخل الـ row يأخذ focus صريح قبل الفتح عشان الـ return يكون دقيق.
- **ما في URL state نهائيًا** للفلاتر (grep أكد). audit يكون أول صفحة kernel ت-sync فلتر live للـ URL. لا يوجد `pushState`/`popstate` في أي صفحة kernel — audit يكون الأولى.
- **`[data-ka-filter]` في الـ test الحالي ما يطابق `[data-kernel-audit-filter]`** الفعلي → الفلتر test silent skip. لازم أصلحه.
- **الـ drawer ما فيه أي provenance/demo banner داخله** — عند الفتح، الـ page-level `KernelDemoPill` مغطى بصريًا.
- **الـ verify-audit.mjs** يفحص determinism/parity/chain/hygiene فقط — ما يفحص exports. الـ provenance header الجديد ما يكسره (ما يلمس row generation).

### الـ ACCEPTANCE criterion
> "every exported artifact states source and timestamp."

نطبّقه على 4 مسارات تصدير: **CSV (engine)** + **JSON (engine)** + **PDF (engine)** + **PDF (drawer)**.

---

## المرحلة 1: Provenance في الـ engine exports (`src/client/audit.ts`)

### 1أ. CSV — سطر تعليق أول بـ provenance
قبل الـ header row الحالي، أضيف سطر (أو سطرين) تعليق RFC 4180-compatible:
```
# source=demo-seeded exported_at=2026-08-09T14:30:00.000Z count=382 schema=kernel-audit-demo
# note=بيانات تجريبية حتمية — ليست سجلات إنتاج. BrightAI Kernel Demo.
ts,user,department,action,risk,status,traceId,hash,approved
"...",...
```
Excel/LibreOffice تتجاهل أسطر `#` (تعتبرها نص/تضعها في خلية واحدة لو مفصولة، بس لأنها سطر كامل قبل الـ comma header، الأدوات السليمة تتعامل معها). أوافق اختيار المستخدم: **"CSV: تعليق"**.

### 1ب. JSON — envelope كامل
أستبدل `JSON.stringify(rows, null, 2)` بـ envelope يطابق `audit-verifier.ts:545-556`:
```js
{
  schema: 'brightai.kernel.audit-events',
  source: 'demo-seeded',
  sourceLabel: 'بيانات تجريبية حتمية — ليست سجلات إنتاج',
  exportedAt: new Date().toISOString(),   // FULL ISO (مو date-only)
  count: rows.length,
  events: rows
}
```
أوافق اختيار المستخدم: **"JSON: envelope كامل"**. أنوّع المفاتيح مع الموجود (`exportedAt`, `schema`) + أضيف `source`/`sourceLabel` الجديد.

### 1ج. PDF — ترويسة provenance ثابتة + إعادة تسمية
أعيد تسمية زر `PDF` → `معاينة طباعة` (visible text + aria-label)، وأعدّل `printPdf` يضيف ترويسة ثابتة:
- العنوان: `BrightAI Kernel — سجل تدقيق (عرض توضيحي)` (بدل "تصدير طباعة")
- سطر `المصدر: بيانات تجريبية حتمية`
- سطر `توقيت التصدير: <full ISO>`
- سطر `عدد السجلات: N`
- ختم مائي `DEMO` خفيف في الـ body (CSS `::before` بشفافية منخفضة)

أوافق اختيار المستخدم: **"أعد تسميته + provenance كترويسة"**.

### 1د. timestamp كامل (مو date-only)
في كل المسارات، أغيّر `stamp = new Date().toISOString().slice(0, 10)` لـ timestamp كامل ISO في الـ provenance (مع إبقاء date-only في **اسم الملف** فقط لجمالية الاسم).

---

## المرحلة 2: Drawer PDF provenance (`public/js/kernel-drawer.js`)

الـ drawer مشترك عبر كل صفحات kernel. أضيف provenance لـ `exportDrawerPdf`:
- سطر `المصدر: <sourceLabel>` — يقرأه من `drawer.dataset.sourceLabel` (يُملأ من الـ seed عند الفتح).
- سطر `توقيت التصدير: <full ISO>`.
- ختم `DEMO` بشفافية لو الـ source = demo.

### 2ب. تمرير source عبر الـ seed (`src/client/audit.ts` → drawer)
في `openDrawer()`, أضيف لـ `seed`:
```js
source: 'demo-seeded',
sourceLabel: 'بيانات تجريبية حتمية',
```
وفي `kernel-drawer.js fillFromSeed()` أحفظه: `drawer.dataset.sourceLabel = seed.sourceLabel`.

---

## المرحلة 3: Provenance label داخل الـ drawer DOM (`src/layouts/KernelLayout.astro`)

أضيف **band صغير أعلى الـ timeline** داخل `#k-trace-drawer` يبيّن المصدر. عنصر جديد:
```html
<p class="k-trace-drawer__provenance" data-kernel-drawer-provenance hidden>
  <span class="k-trace-drawer__provenance-dot" aria-hidden="true"></span>
  <span data-kernel-drawer-source-label>بيانات تجريبية</span>
</p>
```
- `fillFromSeed` يملأ `[data-kernel-drawer-source-label]` من `seed.sourceLabel` ويعرض الـ band (`hidden=false`).
- `fillFromStore` يخفي الـ band (`hidden=true`) لأن بيانات الـ store حقيقية (مو demo).
- CSS: أعيد استخدام نمط `.kernel-source-badge[data-source='demo']` الموجود في `kernel.css:9005` (dot ملوّن) عبر class مشترك، عشان ما أنشئ تصميم جديد.

هذا يحل مشكلة "الـ page-level demo pill مغطى بصريًا عند فتح الـ drawer".

---

## المرحلة 4: Focus trap/return تحقق صريح (`src/client/audit.ts`)

focus-trap.js يعمل تلقائيًا، بس أتأكد من **return صريح للزر الصحيح**:

في `buildRowNode()`, زر الـ view (`viewBtn`) عند الـ click يفتح الـ drawer. لأن `document.activeElement` وقت الفتح هو الـ row (مو الزر) لو الـ click أتى على الزر داخل الـ row (الـ row عنده listener كامل)، الـ focus return يروح للـ row. هذا مقبول، بس أحسن: في `viewBtn` click handler أعمل `e.stopPropagation()` ثم `viewBtn.focus()` ثم `openDrawer()`. هذا يضمن إن الـ activeElement قبل الفتح = الزر، فالـ return يكون للزر بالضبط.

كذلك لـ row keydown handler (Enter/Space): أتأكد إن `document.activeElement` = الـ row قبل `openDrawer()` (هذا يصير طبيعيًا لأن الـ row `tabindex=0`).

**ما ألمس focus-trap.js** — يعمل صح. أنما فقط أضمن إن الـ opener الصحيح مسجّل.

---

## المرحلة 5: Filter URL state — bidirectional (`src/client/audit.ts`)

أضيف 3 دوال + integration:

```js
// اقرأ الفلاتر من URL عند التحميل (بعد boot، قبل أول applyFilter)
function readFiltersFromUrl() {
  const params = new URLSearchParams(location.search);
  // كل فلتر له param: from, to, risk, status, user, dept, q
  if (params.get('from')) filters.dateFrom = params.get('from');
  // ... إلخ لكل 7 فلاتر
  // حدّث عناصر الـ DOM (selects + date inputs + search) لتعكس القيم
  syncDomFromFilters();
}

// اكتب الفلاتر للـ URL عند كل تغيير (replaceState — مو pushState عشان ما نملأ الـ history)
function writeFiltersToUrl() {
  const params = new URLSearchParams();
  if (filters.dateFrom) params.set('from', filters.dateFrom);
  // ... إلخ
  const qs = params.toString();
  const url = qs ? `${location.pathname}?${qs}` : location.pathname;
  history.replaceState(null, '', url);
}

// استمع لـ popstate (زر الرجوع في المتصفح)
window.addEventListener('popstate', readFiltersFromUrl);
```

- **استدعي `readFiltersFromUrl()` في `boot()`** قبل `applyFilter()` الأولى.
- **استدعي `writeFiltersToUrl()` داخل `applyFilter()`** (بعد ما الفلاتر تتحدّث).
- **param names قصيرة**: `from, to, risk, status, user, dept, q` (مو `dateFrom` إلخ — URL أنظف).
- **`replaceState` مو `pushState`** — كل تعديل فلتر ما يضيف entry للـ history (مزعج)، بس الـ URL يتحدث → refresh-safe + shareable. لو رجع المستخدم للـ URL سابق (زر back)، `popstate` يعيد الفلاتر. هذا يطابق اختيار المستخدم: **"Bidirectional"**.

**ما أكسر الـ determinism** — URL state للـ filters فقط، مو للبيانات. الـ `verify-audit.mjs` source hygiene يفحص `fetch(` و `Date.now` و `Math.random` و `toLocaleString` — ما يفحص `history`/`URLSearchParams`/`location`. آمن.

---

## المرحلة 6: تحديث الـ TESTS (`scripts/playwright/verify-kernel-audit.mjs`)

الـ TESTS criterion: **"filters, copy, drawer, export, no results"**. الـ test الحالي يفحص filters (بـ selector غلط!) + drawer + no-results + verifier + tamper. **ناقص: copy + export.** أضيف:

1. **أصلح selector الفلتر**: `[data-ka-filter]` → `[data-kernel-audit-filter="status"]` (الـ status select الفعلي). حاليًا الـ filter test silent-skip.

2. **Copy test جديد**: أضغط زر نسخ الهاش في أول row، أتحقق إن `navigator.clipboard.writeText` اتنادى (mock clipboard عبر `page.evaluate` بـ `Object.defineProperty`). أو أبسط: أتحقق إن زر الـ copy يضيف `data-copied="true"` (الـ `flash()` function تسويها) — هذا التحقق المضمون.

3. **Export test جديد**: أعمل `page.on('download')` listener، أضغط زر CSV، أتحقق إن ملف نزل بـ filename يطابق `/kernel-audit-.*\.csv/`، وأقرأ أول سطر وأتأكد إنه يبدأ بـ `# source=demo-seeded`. نفس الشيء لـ JSON (أتأكد إن الـ JSON يبدأ بـ `{\n  "schema"`). PDF أصعب (print window) — أتخطاه أو أتحقق فقط إن `window.open` اتنادى.

4. **focus return test جديد** (للـ focus trap criterion): قبل فتح الـ drawer، أعمل focus على زر view معيّن، أحفظ `document.activeElement`, أفتح الـ drawer، أعمل Escape، أتأكد إن `document.activeElement` رجع للزر (أو على الأقل لـ row).

5. **URL state test جديد** (للـ filter URL state): أختار status=blocked، أتأكد إن `location.search` يحتوي `status=blocked`. أعمل `page.goto(url?status=allowed)` reload، أتأكد إن الفلاتر تطبّقت.

6. **provenance drawer test**: أفتح drawer، أتأكد إن `[data-kernel-drawer-source-label]` معروض ويحتوي "بيانات تجريبية".

---

## المرحلة 7: توثيق + report + brain update

1. **report/**`2026-08-09-audit-provenance-trust.md` — تقرير بالعامية السعودية (per AGENTS.md 0.5.4): ملخص، المخاطر، الـ verification، follow-ups.
2. **worklog.md** append (per AGENTS.md 0.5.7).
3. **brain.md** update (إن وُجد) — change ledger entry.

---

## الملفات اللي بتتعدّل (8 ملفات)

| # | الملف | التغيير |
|---|---|---|
| 1 | `src/client/audit.ts` | CSV provenance header + JSON envelope + PDF header + drawer seed source + focus return fix + URL state (read/write/popstate) |
| 2 | `public/js/kernel-drawer.js` | `exportDrawerPdf` provenance + `fillFromSeed` يحفظ `sourceLabel` + يملأ `[data-kernel-drawer-source-label]` |
| 3 | `src/layouts/KernelLayout.astro` | إضافة provenance band DOM داخل `#k-trace-drawer` |
| 4 | `src/styles/kernel.css` | (إن لزم) أعيد استخدام `.kernel-source-badge` pattern للـ provenance dot — أو scoped style في KernelLayout |
| 5 | `src/pages/kernel/audit.astro` | إعادة تسمية زر PDF → "معاينة طباعة" (visible + aria-label) |
| 6 | `scripts/playwright/verify-kernel-audit.mjs` | إصلاح selector + إضافة copy/export/focus/URL/provenance assertions |
| 7 | `report/2026-08-09-audit-provenance-trust.md` | تقرير جديد |
| 8 | `worklog.md` | append session log |

**ملفات محمية ما ألمسها** (per AGENTS.md 2.1): `public/_redirects`, `_headers`, `astro.config.mjs`, `src/data/kernel-audit.ts` (الـ seed حتمي — ما أغيّر بياناته)، `src/data/site.ts`, `frontend/**`.

---

## التحقق (Verification) — بعد التنفيذ

```bash
npm run build:client          # يولّد /js/audit.js من audit.ts
npm run build                 # 125 صفحة، 0 أخطاء
npm run verify:audit          # determinism/parity/chain/hygiene — ما يتأثر
npm run verify:all            # exit 0
npx playwright test scripts/playwright/verify-kernel-audit.mjs  # الـ browser smoke (إن اشتغل locally)
```

**Rollback**: `git revert HEAD` — كل التغييرات في commit واحد atomic.

---

## المخاطر المتبقية

1. **CSV comment line + أدوات parsing صارمة**: بعض importers قديمة ممكن تكره `#`. **Mitigation**: السطر يبدأ بـ `#` (convention شائعة)، والـ CSV parser الحديث (Python `csv`, Excel, PapaParse) يتعامل معها. لو انطلب، نوفّر flag لـ "pure CSV".
2. **URL state + view transitions**: `popstate` مع `astro:page-load` ممكن يتداخلون. **Mitigation**: أربط `readFiltersFromUrl` بـ `boot()` فقط (مرة واحدة)، مو بكل `astro:page-load`.
3. **focus return للـ row بدل الزر**: مقبول a11y (الـ row `tabindex=0`)، بس أفضّل الزر. **Mitigation**: `viewBtn.focus()` صريح قبل `openDrawer()`.
4. **PDF print window provenance**: المتصفح ما يحفظ الـ print HTML، فالـ provenance visible فقط على الشاشة + في الـ PDF المطبوع (لو المستخدم يحفظ PDF من print dialog). هذا سلوك print-view الطبيعي.

---

**ثقتي: 90%.** قرأت كل الملفات المعنية، تتبّعت dependencies (forward + reverse)، الـ verification path واضح، rollback سهل. الـ unknown الوحيد: سلوك `popstate` مع view transitions — أختباره في المرحلة 5 وأتعامل معه.

**أبدأ بالمرحلة 1؟**