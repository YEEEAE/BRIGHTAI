# D01 — solutions: الأصل والهوية والادعاءات

- **التاريخ:** 2026-11-11 (قياس 06:35–06:39 +03:00)
- **البيئة:** محلي macOS (darwin)، Node v22.22.2، npm 10.9.7
- **الفرع:** `main`، working tree كان نظيفًا قبل التعديل
- **خط الأساس المذكور في البرومبت:** `6a3d53f41b5bd1af59eb320245745498765bd320`
- **HEAD عند التنفيذ:** `cbd8d42df6e9793f4e1944b629594148b94562e6` (9 commits بعده)
- **إعادة فحص الانحراف قبل التنفيذ:** العيب ما زال مفتوحًا. لا يوجد `src/pages/solutions/index.astro` ولا مُخرج بناء له، والمحتوى الحي ما زال الأثر القديم. لذلك نُفِّذ الإصلاح ولم يُسلَّم كإغلاق شكلي.

## 1. سبب التباين (مثبت)

`/solutions/` الحي يعيد 200 ببصمة أصول لا تُنتجها الشجرة الحالية:

| المؤشر | الصفحة الحيـة | البناء الحالي |
|---|---|---|
| الأصول | `/_astro/BaseLayout.*`, `/assets/images/logo.png`, `/fonts/IBMPlexSansArabic-*`, `/js/sw-register.js` | `/images/brightai-logo.webp`, `/fonts/plex-arabic-400.ttf`, `/_astro/Footer.*` |
| الشعار | `logo.png` 400×400 — `2ece775a…` | `brightai-logo.png` 1536×1024 — `61ce2901…` |
| التحليلات | لا يوجد GA4 | `G-9LMB4PGTWJ` |
| العنوان | «حلول حوكمة AI \| AI Firewall + سجل تدقيق + ملف أدلة» | لا مسار مطابق |

**الأصل:** ملف Static قديم ما زال منشورًا في جذر الموقع (`solutions/index.html` + 19 رابطًا فرعيًا + `/assets`, `/js`, `/logo-96.webp`, `/sw.js`). المصدر الحالي لا يحتوي أي مسار ينتج هذه الصفحة، والبناء المحلي لا ينتج `solutions/index.html` إطلاقًا؛ أي أن إعادة النشر لا تستطيع إعادة إنتاج هذا HTML. هذا يفسر بقاء الصفحة رغم كل عمليات `update site`.

**أثر النشر:** الأثر لا يقتصر على صفحة واحدة — 19 رابطًا فرعيًا يعيد 200 بالهوية القديمة، و`/sw.js` القديم (`CACHE_VERSION 2026-06-29-1`) ما زال يُخدَّم ويُسجَّل من تلك الصفحة. لا يثبّت الـSW صفحة HTML (network-first) لكنه يُبقي ذاكرات أصول قديمة مسجلة لمن زار الصفحة القديمة.

## 2. ما نُفِّذ (أقل تغيير)

| الملف | التغيير | السبب |
|---|---|---|
| `src/pages/solutions/index.astro` (جديد) | مركز قطاعات بهوية `PageShell` الحالية، 4 مسارات قطاعية، طبقات المنتجات كـ«Planned»، حدود صريحة للادعاءات | لا مسار مطابق؛ الهوية والادعاءات القديمة لا تُصحَّح من مكان آخر |
| `src/pages/solutions/[sector].astro` | breadcrumb «القطاعات» → `/solutions/` بدل `/#solutions` | يجعل المركز قابلًا للوصول (لا صفحة يتيمة) ويوحّد مسار التنقل؛ لم يُمسّ الهيدر/الهيرو |
| `redirects.json` | +21 قاعدة: `/solutions.html` و`/solutions/index.html`، و19 رابطًا قديمًا إلى أقرب صفحة حالية | يحفظ الروابط والـSEO، ويشيل الادعاءات القديمة من مساراتها بدل تركها 200 |
| `public/llms.txt` | سطر واحد مولَّد بالبناء للمسار الجديد | مخرج `seoBuild` المتعمد في الشجرة |

الادعاءات القديمة غير المثبتة (توقيع PDF رقمي، احتفاظ «مدى الحياة»، تجربة بدون تسجيل، «سرية مضمونة»، امتثال SAMA/NCA/ISO كنعت) لم تُنقل إلى الصفحة الجديدة. الجديدة تقول صراحة: أسئلة تخطيط، لا شهادة امتثال، والإتاحة التشغيلية لمنتجات AIGAS غير متحققة — وهو نفس موقف `/products/` و`/pillars/` الحالي.

### خريطة التحويلات (19)

| من | إلى |
|---|---|
| `/solutions/ai-governance-platform/` | `/products/` |
| `/solutions/ai-firewall/` | `/products/firewall/` |
| `/solutions/ai-audit-trail/`, `/solutions/ai-evidence-file/` | `/products/ledger/` |
| `/solutions/human-approval-layer/` | `/products/human-gate/` |
| `/solutions/ai-risk-classification/`, `/solutions/continuous-ai-governance/` | `/products/risk-engine/` |
| `/solutions/ai-use-case-discovery/` | `/products/` |
| `/solutions/policy-to-control-mapping/` | `/kernel/` |
| `/solutions/banking-ai-governance/` + `khobar/` + `riyadh/` | `/solutions/finance/` |
| `/solutions/government-ai-governance/` + `dammam/` + `madinah/` | `/solutions/government/` |
| `/solutions/healthcare-ai-governance/` + `jeddah/` + `mecca/` | `/solutions/healthcare/` |
| `/solutions/manufacturing-ai-governance/` | `/solutions/enterprise/` |

## 3. التحقق (على النسخة النهائية)

| الفحص | الأمر | النتيجة |
|---|---|---|
| بناء + فهرسة + aliases | `npm run build` | **PASS** — `57 public pages in sitemap and llms.txt; HTML aliases covered` (كانت 56) |
| صفحة المركز | `GET /solutions/` محليًا | **PASS** — 200، canonical `https://brightai.live/solutions/`، h1 واحد، robots `index, follow`، بصمة الهوية الحالية فقط، لا أثر لأصول قديمة |
| الروابط المباشرة | 24 رابطًا داخليًا من الصفحة | **PASS** — صفر مكسور |
| تحويلات قديمة | 19 مصدرًا × GET/HEAD مع query | **PASS** — 38/38 = 301 مع `Location` مطابق وquery محفوظ؛ 19/19 هدفًا 200 |
| aliases المركز | `/solutions.html`, `/solutions/index.html` | **PASS** — 301 إلى `/solutions/` |
| حلقات | فحص الجدول كاملًا | **PASS** — 138 تحويلًا، صفر سلسلة/حلقة، صفر تكرار source |
| sitemap + llms | قراءة `sitemap-0.xml` و`llms.txt` | **PASS** — المسار الجديد موجود في الاثنين |
| الصفحة غير يتيمة | `/` → `/solutions/{slug}/` → `/solutions/` | **PASS** — breadcrumb القطاعات يشير للمركز |
| بصري | Chrome headless 1440 | **PASS** — قبل/بعد محفوظان (انظر الأسفل) |

لم يُشغَّل: `verify-routes.mjs` الكامل، E2E، فحص مقاسات متعددة، نشر. التغيير تحريري/مساري، والفحص أعلاه يخص السلوك المتأثر فقط.

## 4. الحدود والمانع

- **المنشور:** لم يتغيّر. القرار الحي يحتاج **تفويض نشر**، وتطبيق تحويلات `/solutions/*` على الاستضافة الـStatic يحتاج **تعديل edge/Render redirects** بتفويض مستقل. هذا المانع مالكه: DevOps/النشر.
- **حذف الأثر القديم:** لا حذف ولا تعديل DNS/CDN هنا. الأثر القديم يزول من `/solutions/` عند أول نشر للبناء الجديد؛ الـ19 رابطًا تحتاج تفعيل جدول التحويل على الحافة.
- **Service worker:** `/sw.js` القديم ما زال على الحافة. لم يُضف بديل محلي (خارج نطاق هذه المهمة وخطر تغيير سلوك كاش عام) — يُسجَّل كمهمة منفصلة.
- **Aliases `.html` للروابط القديمة الـ19:** لم تُضف (المصدر المعلن هو المسار النظيف)؛ تُغطى عند تعديل الحافة إذا لزم.
- **Internal:** centroids جاهز محليًا. **Public:** لا تغيير حتى النشر. **Commercial:** لا علاقة؛ لا ادعاء إتاحة تشغيلية.

## 5. التراجع

- حذف `src/pages/solutions/index.astro`، وإرجاع breadcrumb إلى `/#solutions`، وحذف الـ21 قاعدة من `redirects.json`. لا بيانات أو migrations.

## 6. الصور

- `before-live-solutions.png` — الحي: هوية خضراء/فيروزية، شعار 400×400، تنقل قديم، بانر كوكيز قديم.
- `after-local-solutions.png` — المحلي: هوية BRIGHT AI الحالية، شعار 1536×1024، هيدر/فوتر الحاليان، ملاحظة حدود الادعاء.
