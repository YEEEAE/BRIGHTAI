# Source-File Link Repair — إصلاح روابط ملفات المصدر

- **التاريخ**: 2026-08-09 (+03:00)
- **المهمة**: مهمة "source-file link audit reports 69 breakages" — تصنيف وإصلاح
- **السكربت المعدّل**: `scripts/internal-links-common.mjs` (مُحرّك الـ audit)
- **الحالة**: verified locally — `internal-links-audit` = **0 كسر** ✅

---

## 1. الملخص التنفيذي

المهمة وصلت مع ادعاء "69 كسر، 0 auto-fixable". لما فحصت الواقع على القرص، الأرقام ما تطابقت مع أي أداة. بعد تحقيق منهجي، اتضح إن:

- **العدد الحقيقي بعد التعديلات غير الملتزمة على `internal-links-common.mjs` كان 2** (مو 69).
- **الكسرين كانوا false positives** بنفس السبب الجذري: السكربت ما كان يعرف الـ migrated pages (صفحات تُبنى من JSON data عبر dynamic routes) كمصادر routes صحيحة.
- **الحل الصحيح تقنيًا** (اللي اختاره المستخدم): إصلاح السكربت نفسه عشان يقرأ canonicalات الـ migrated pages من `src/data/migrated-pages/*.json`. النتيجة: **0 كسر**.
- **الـ 13 pattern normalization**: كلها false positive بنمط ثانوي (سياق `readFileSync` في أداة QA) — ما طبّقتها لأن تطبيقها يكسر أداة QA.

ما عدّلت ولا مرجع في أي ملف source. التغيير الوحيد في سكربت الـ audit نفسه.

---

## 2. التصنيف حسب الـ Buckets (Bucket Breakdown)

المهمة طلبت تصنيف الـ 69 كسر إلى 4 buckets. اللي حصل فعلاً:

| Bucket | العدد | الحل |
| --- | ---: | --- |
| **wrong relative path** | 0 | — |
| **target genuinely renamed/removed** | 0 | — |
| **intentional placeholder** | 0 | — |
| **false positive from the audit script** | **2** | إصلاح السكربت (قراءة migrated-page canonicals) |

### ليش ما فيه 69

أرقام الـ task (69 كسر / 158 ملف / 92 مرجع داخلي) ما تطابقت مع أي قياس فعلي:

| الأداة | النطاق | النتيجة المُقاسة |
| --- | --- | --- |
| `seo-ci-check.mjs` | `dist/client` (built HTML) | **0 broken من 48,158 مرجع** ✅ |
| `link-graph-validator --strict` | `dist/` | exit 1 (bug مُسبق — يفحص `dist/` بدل `dist/client/`) |
| `internal-links-audit.mjs` على HEAD (لو رمّيت تعديلات `common.mjs`) | source | **1,646 كسر** (سكربت مكسور يفحص `dist/` + `scripts/` كـ source) |
| `internal-links-audit.mjs` بعد التعديلات غير الملتزمة على `common.mjs` | source | **2 كسر** (false positives) |
| التقرير المحفوظ `broken_links_before.md` قبل الجلسة | source | **7** |

لا 69 ولا 158 ولا 92 ظهروا في أي قياس. بناءً على طلب المستخدم، اعتمدنا الواقع على القرص (2 كسر → 0 بعد الإصلاح).

---

## 3. تفاصيل الـ False Positives (الكسران)

### الكسر #1
- **الملف**: `qa-screenshots.mjs:33`
- **المرجع**: `/solutions/ai-firewall/`
- **سبب الـ false positive**: `ai-firewall` هو **migrated page** — صفحة تُبنى من `src/data/migrated-pages/solution-ai-firewall.json` عبر `src/pages/solutions/[slug].astro` dynamic route. ما لها ملف `src/pages/solutions/ai-firewall.astro` مستقل.
- **التحقق من صحّة المرجع**: `dist/client/solutions/ai-firewall/index.html` موجود (97KB) ✅. الصفحة مبنية ومنشورة وSEO-correct.

### الكسر #2
- **الملف**: `qa-text-snapshot.mjs:41`
- **المرجع**: `/solutions/ai-firewall/index.html`
- **السبب**: نفس السبب الجذري (migrated page) + الـ `.html` suffix.

### السبب الجذري الموحّد

`buildFileIndex()` في `internal-links-common.mjs` كان يعرف routes من مصدرين فقط:
1. HTML files في `public/` (عبر `relPathToSitePath`).
2. `src/pages/*.astro` (عبر `astroSourceToSitePath`).

الـ migrated pages ما تدخل في أي من المصدرين — هي data-driven. فأي مرجع ليها يطلع "المسار غير موجود".

---

## 4. الحل المُطبّق

### 4.1 التعديل في `scripts/internal-links-common.mjs`

أضفت دالة `readMigratedPageRoutes(root)` تقرأ كل ملفات `src/data/migrated-pages/*.json` (26 ملف: 8 solutions + 4 sectors + 3 cities + 11 kernel legacy)، تستخرج حقل `canonical` من كل واحد، تشيل الـ origin، وتُرجّع site path صحيح.

بعدين في `buildFileIndex()`، بعد حلقة الـ Astro source routes، أضفت حلقة تسجّل كل migrated route في `publicRouteMap` بنفس آلية `buildSourceRouteVariants` (تشمل variants: `/path/`, `/path`, `/path/index.html`, `/path.html`).

### 4.2 Bug إضافي اكتُشف وأُصلح

أثناء التنفيذ، اكتشفت إن `canonicalizeSitePath()` (من `seo-url-map.mjs`) و`normalizeSitePath()` (محلية في `common.mjs`) **الاتنين ما يقدرون يعالجوا URLs كاملة** (`https://...`). السبب: كلاهم يحتوون خط `replace(/\/{2,}/g, "/")` يقلّص `https://` إلى `https:/` **قبل** ما الـ URL parsing branch يشتغل.

الحل: في `readMigratedPageRoutes`، أشيل الـ origin يدويًا بـ regex بسيط `^https?:\/\/[^/]+` قبل ما أمرّر لـ `canonicalizeSitePath`. ده حل موضعي نظيف ما يأثر على أي caller ثاني للدالتين (ما لمس الـ helpers نفسهم عشان الـ blast radius يكون صفر).

### 4.3 توثيق الـ 13 Pattern Normalization

السكربت يبيّن 13 (ثم 14 بعد الإصلاح) "فرصة توحيد نمط". كلها في `qa-text-snapshot.mjs` بنفس النمط:

```
"/index.html" → "/"
"/about/index.html" → "/about/"
"/services/index.html" → "/services/"
... (و 11 أخرى)
```

**القرار: ما طبّقتها.** السبب: `qa-text-snapshot.mjs` أداة QA قديمة تستخدم `readFileSync` لقراءة ملفات فيزيائية من `dist/`. المسارات `/about/index.html` هي **paths فيزيائية للملفات على القرص**، مو URLs للمتصفح. تطبيق الـ normalization (تحويلها لـ `/about/`) **يكسر الأداة** لأن `readFileSync('/about/')` سيفشل (لا يوجد ملف بهذا الاسم).

هذي false positive بنمط ثانوي: السكربت يفترض إن كل `/x/index.html` should be `/x/`، بس السياق (filesystem read) يبرّر استخدام الـ `.html` صراحةً. التطبيق الصحيح للتوحيد هنا = كسر أداة QA.

---

## 5. التحقق (Verification)

كل أوامر التحقق المطلوبة في الـ task:

| الأمر | النتيجة |
| --- | --- |
| `node scripts/internal-links-audit.mjs` | **breakages: 0** ✅ (الهدف المطلوب) |
| `node scripts/link-graph-validator.mjs --strict` | exit 1 — **bug مُسبق مستقل** (يفحص `dist/` بدل `dist/client/`). مُثبَت: نفس exit 1 قبل تعديلي (`git stash` + retest). |
| `pnpm build` | **exit 0** ✅ |
| `node scripts/seo-ci-check.mjs` | **0 broken من 48,158 مرجع** ✅ |
| `node scripts/internal-linking-architecture.mjs --source dist/client` | **0 orphans, 0 broken, maxClickDepth 3 ≤ 3** ✅ BAI-IDX-04 PASSED |

### ملاحظة على `link-graph-validator --strict`

السكربت ده عنده bug مُسبق مو مرتبط بمهمتي: `collectPublishedHtml()` يمشي على `path.join(root, "dist")` + `path.join(root, "public")`. المشروع يبني في `dist/client/` (node adapter output)، فالسكربت يبحث عن `dist/solutions/ai-firewall/` ما يلاقيها، ويطلّع كل روابط `/solutions/*` كـ broken. نفس النقطة موثّقة مُسبقًا في brain entry BAI-IDX-04 (2026-08-08): "السكربتان يبحثان في `dist/` بينما المشروع يبني في `dist/client/`".

تغييري ما لمس هذا السكربت نهائيًا. لو المستخدم يبي إصلاحه، هو مهمة منفصلة (تحتاج تعديل `collectPublishedHtml` يدعم `dist/client/`).

---

## 6. القيود (Constraints) — كلها محترَمة

| القيد | الحالة |
| --- | --- |
| ما "أصلّح" مرجع مكسور بحذف محتوى يذكره | ✅ ما حذفت أي محتوى |
| ما أُعيد تسمية أي target page | ✅ ما لمست أي صفحة |
| `dist/client` broken links يبقى 0 | ✅ `seo-ci-check` يؤكد 0 من 48,158 |
| أثبت إن المرجع فعلاً يحلّ (مطلوب للـ script false positive bucket) | ✅ `dist/client/solutions/ai-firewall/index.html` موجود + مُحقّق |
| 218 redirects ما تتأثر | ✅ ما لمست `_redirects` ولا أي URL |

---

## 7. ما اعتباراته لاحقًا (Follow-up)

| البند | الأولوية | السبب |
| --- | --- | --- |
| إصلاح `link-graph-validator.mjs` يدعم `dist/client/` | medium | bug مُسبق، يطلّع exit 1 كاذب. يحتاج تعديل `collectPublishedHtml`. |
| إصلاح `normalizeReferencePath` / `canonicalizeSitePath` يدعموا URLs كاملة | low | bug مُسبق. حاليًا متجاوز موضعيًا في `readMigratedPageRoutes`. لو ظهر caller ثاني محتاج URL كامل، يُصلح جذريًا. |
| مراجعة ملفات `migrated-pages/kernel-*.json` (11 ملف) | low | الـ grep ما لقى لها import فعلي. على الأرجح بقايا migration قديمة. لو مؤكّد dead، تُحذف في مهمة تنظيف منفصلة. |

---

## 8. الملفات المُعدّلة

| الملف | نوع التغيير |
| --- | --- |
| `scripts/internal-links-common.mjs` | إضافة `readMigratedPageRoutes()` + استدعائها في `buildFileIndex()` |

**ما عدّلت أي ملف source غير السكربت.** كل الـ false positives اتصلّحت عبر تعليم السكربت يعرف الـ routes الصحيحة، مو عبر تغيير المراجع.

---

## 9. الإحصاءات النهائية لـ internal-links-audit

```
الملفات المفحوصة:         114  (قبل: 114 — لا تغيير)
إجمالي المراجع:            167  (قبل: 167 — لا تغيير)
المراجع الداخلية:           72  (قبل: 72 — لا تغيير)
الأعطال المكتشفة:            0  (قبل: 2 — ✅ الهدف محقق)
فرص توحيد النمط:             14  (قبل: 13 — +1 لأن /solutions/ai-firewall/index.html صار valid ويحتاج توحيد لـ /solutions/ai-firewall/)
```
