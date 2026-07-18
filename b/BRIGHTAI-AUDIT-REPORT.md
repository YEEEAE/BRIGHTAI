# تقرير التدقيق الشامل لمستودع BRIGHTAI

**تاريخ القياس:** 2026-07-18  
**النطاق:** branch `main` عند بدء المحادثة، تحليل ساكن للمستودع فقط.  
**قاعدة السلامة:** لم يُحذف أو يُعدّل أي ملف مشروع، ولم تُشغّل أوامر build/generate؛ الأثر الوحيد هو إنشاء هذا التقرير.

## الملخص التنفيذي

1. المستودع يحتوي **1,487 ملفاً متتبعاً** بحجم **47,627,767 بايت**.
2. مجلدا `report/` و`audit/` وحدهما يشغلان **60.61%** من الحجم: `(18,063,855 + 10,802,228) ÷ 47,627,767 × 100`.
3. أسطح التقارير المرشحة للأرشفة تضم **209 ملفات / 29,083,404 بايت = 61.06%** من الحجم المتتبع.
4. التكرار الحرفي هو **42 نسخة زائدة من 1,487 = 2.82%** ضمن **23 مجموعة hash**.
5. `AGENTS.md` و`CLAUDE.md` و`.agents/AGENTS.md` و`.clinerules/H.md` نسخ متطابقة؛ وفرها المباشر **517,920 بايت** عند إبقاء نسخة واحدة.
6. قياس مرجعي محافظ للاستخدام أعطى **69.66% ملفات مصدر مستخدمة** و**30.34% مرشحة بلا مرجع**، لكنه heuristic ويتضمن scripts/tests؛ لا يجوز الحذف به وحده.
7. توجد **67 قوالب Astro** تولّد وفق توثيق المشروع **190 صفحة build**، بينما `public/sitemap.xml` يحتوي **176 URL**.
8. جاهزية القوالب المصدرية لعناصر الفهرسة الأساسية **90.5%** بعد إدخال CWV غير المقاس كرصيد جزئي؛ نتيجة القياس الأولي دون CWV كانت 92.99%.
9. الجاهزية الإجمالية المحافظة لـ Google السعودية هي **86%**: Technical 91، On-page 91، Content/Local 90، Schema 93، Sitemap/Hreflang 91، CWV 60 وفق الأوزان المعلنة أدناه.
10. `kernel` ليس CSS فقط فعلياً: الواجهة الحية في `src/pages/kernel/` (13 template) وAI API في `src/pages/api/ai/chat.ts`؛ الفجوة الأساسية هي الاتساق بين demo المرئي والبيانات الحقيقية، onboarding، القياس، وإثبات القيمة قبل البيع.

---

# القسم 1: تحليل شامل وتنظيف المشروع

## 1.1 منهجية القياس

- **حجم المستودع:** `git ls-files -z` ثم `os.path.getsize`؛ المقام هو كل الملفات المتتبعة الموجودة.
- **التكرار:** SHA-256 لمحتوى كل ملف غير فارغ؛ النسبة = `(عدد النسخ بعد أول نسخة في كل hash group ÷ 1,487) × 100`.
- **الاستخدام:** فحص 557 ملفاً بامتدادات `astro|ts|tsx|js|mjs|css` والبحث عن basename/import خارج الملف. النتيجة **heuristic مرجعية فقط** لأنها تعتبر entrypoints والاختبارات وCLI scripts غير مستخدمة إن لم تُستورد.
- **لا توجد نسبة حذف آمنة آلياً**؛ الثقة أدناه مبنية على القياس + كون العنصر مولداً/مكرراً/موثقاً كأرشيف.

## 1.2 صحة عامة

| المؤشر | النتيجة | المعادلة/الدليل |
|---|---:|---|
| الملفات المستخدمة فعلياً — baseline محافظ | 69.66% | `(557 - 169) ÷ 557 × 100`؛ basename/import heuristic |
| المرشحة كـ unreferenced | 30.34% | `169 ÷ 557 × 100`؛ لا يعني dead code مؤكداً |
| التكرار الحرفي | 2.82% | `42 ÷ 1,487 × 100`؛ SHA-256 |
| عبء التقارير | 61.06% | `29,083,404 ÷ 47,627,767 × 100` |
| الملفات المولدة المتتبعة المعروفة | 0.54% من الملفات | `8 ÷ 1,487 × 100` (`.astro/*` ونسختا sitemap) |
| تكرار مصادر الدماغ الحرفي | 19.68% من corpus المحدد | `345,280 ÷ 1,754,305 × 100`، والقياس لا يحتسب near-duplicates |

> **تصحيح منهجي:** لا تستخدم 30.34% كرقم «كود ميت نهائي». الاختبارات وconfig وscripts هي entrypoints وقد لا تُستورد. قبل الحذف يلزم `knip` مهيأ لكل workspace، ثم تشغيل scripts المسماة في `package.json` وCI، ثم بحث نصي وbuild كامل.

## 1.3 توزيع الحجم

| المجلد | الملفات | البايت | النسبة |
|---|---:|---:|---:|
| `report/` | 168 | 18,063,855 | 37.93% |
| `audit/` | 17 | 10,802,228 | 22.68% |
| `.agents/` | 342 | 5,799,281 | 12.18% |
| `src/` | 328 | 5,684,111 | 11.93% |
| `public/` | 111 | 2,772,572 | 5.82% |
| `scripts/` | 177 | 1,323,996 | 2.78% |
| root | 37 | 1,097,435 | 2.30% |
| `apps/` | 117 | 496,504 | 1.04% |
| `kernel/` | 14 | 343,569 | 0.72% |
| `packages/` | 50 | 251,012 | 0.53% |
| البقية مجتمعة | 124 | 1,092,699 | 2.29% |

## 1.4 مرشحو الحذف/الدمج/الأرشفة

| المسار | الحجم المقاس | الإجراء المقترح | السبب | الثقة | الخطر |
|---|---:|---|---|---:|---|
| `report/` | 18,063,855 B | أرشفة خارج git أو إبقاء summaries فقط | 37.93% من repo؛ Lighthouse HTML/JSON ولقطات قابلة لإعادة التوليد | 95% | يحتاج تحقق |
| `audit/evidence/a11y-report.json` | 8,200,849 B | artifact CI خارجي | ناتج آلي ضخم | 99% | آمن بعد حفظ CI artifact |
| `audit/INTERNAL-LINKS.csv` | 2,379,062 B | توليد عند الطلب | snapshot قابل للتقادم | 95% | آمن بعد إثبات generator |
| `_reports/` | 133,300 B | دمج summaries في تقرير واحد/أرشفة | تقارير زمنية متناثرة | 90% | يحتاج تحقق |
| `.agents/snapshots/2026-07-08-pre-cleanup-dupes.tar.gz` | 3,029,970 B | نقل إلى release/object storage | binary archive داخل git | 99% | يحتاج تحقق واستعادة تجريبية |
| `AGENTS.md`, `CLAUDE.md`, `.agents/AGENTS.md`, `.clinerules/H.md` | 690,560 B | إبقاء `brain.md` + stubs | SHA-256 متطابق | 100% | يحتاج تحقق لتوافق الأدوات |
| `.roo/rules/y.md` | 158,221 B | stub يشير إلى brain | near-duplicate مرشح | 85% | يحتاج تحقق |
| `.agents/brain.md` | 892,913 B | إعادة هيكلة/اختصار لا حذف | 5,542 سطراً وسجل تغييرات طويل؛ source of truth موجود فعلاً | 100% | خطر |
| `worklog.md` | 137,977 B | تلخيص ثم أرشفة تاريخية | سجل زمني لا تعليمات تشغيلية | 95% | يحتاج تحقق |
| `.astro/` | 7,398 B / 6 ملفات | إزالة من git مع إبقائه في `.gitignore` | output مولد ومُهمَل حالياً لكنه tracked | 100% | آمن |
| `sitemap.xml` + `public/sitemap.xml` | 121,286 B | مصدر واحد أو توليد build | نسختان متطابقتان SHA-256 | 100% | خطر إن كان Render يعتمد إحداهما |
| `components/` | 1 ملف / 1,732 B | افحص الملف ثم دمجه في `src/components` | ليس فارغاً كما افترض السياق؛ لا تحذفه دون قراءة | 70% | يحتاج تحقق |
| `qa-*.mjs` في root | 5 ملفات ظاهرة | نقل إلى `scripts/qa/` أو حذف المثبت أنه one-off | root clutter وentrypoints غير موثقة في scripts | 85% | يحتاج تحقق |
| نسخ OG المتطابقة | مجموعات 5–6 نسخ لكل format | asset canonical واحد | hashes متطابقة | 99% | يحتاج تحقق للمراجع |
| نسخ الخطوط/logo في `public/` | عدة مجموعات | canonical path واحد | hashes متطابقة ونسخ `.bak` | 99% | يحتاج تحقق للمراجع |

## 1.5 ملاحظات معمارية

- تعليق `package.json` يصرّح أن Astro legacy لا يزال مطلوباً حتى انتقال `apps/marketing/`؛ لا تحذف root Astro.
- `.gitignore` صحيح لـ `reports/`, `.astro/`, coverage، لكن وجود ملفات tracked يعني أن الإضافة إلى ignore وحدها لا تكفي؛ يلزم `git rm --cached` في تنفيذ لاحق.
- `clean` يحذف `reports/` بينما المستودع يحتوي `report/` و`audit/`; التسمية غير موحدة.
- `kernel/README.md` يحتوي أقساماً تاريخية تناقض الحالة الحالية في مواضع لاحقة؛ يجب تحويل التاريخ إلى docs archive والحالة الحية إلى فقرة قصيرة.

---

# القسم 2: جاهزية الفهرسة في Google للسوق السعودي

## 2.1 نموذج الدرجة الموزونة

لكل template/page family:

| المعيار | الوزن |
|---|---:|
| title موجود وفريد | 20% (10 وجود + 10 فرادة) |
| meta description | 10% |
| canonical | 10% |
| hreflang ثنائي الاتجاه | 15% |
| Schema مناسب | 15% |
| sitemap coverage | 10% |
| لا noindex/redirect conflict | 5% |
| روابط داخلية ≥3 | 5% |
| كثافة لغة محلية مناسبة | 5% |
| CWV evidence | 5% |

تم فحص المصدر بـ regex، ومقارنة route مع 176 `<loc>` في `public/sitemap.xml` و207 redirect في `redirects.json`. لعدم وجود نتائج Lighthouse حديثة كاملة لكل الصفحات، CWV حصل على **2.5/5** لا نجاحاً كاملاً. الدرجات الديناميكية (`[slug]`) تقيس القالب لا كل ناتج build؛ لذلك يلزم crawl لـ `dist/client` بعد build للحصول على درجة URL نهائية.

## 2.2 النتيجة الإجمالية

**جاهزية الموقع للفهرسة الكاملة في Google السعودية = 86%.**

المعادلة:

`(Technical 91×0.22) + (Content/Local 90×0.23) + (On-page 91×0.20) + (Schema 93×0.10) + (CWV 60×0.10) + (AI/Search readiness 95×0.10) + (Images 82×0.05) = 86.23 ≈ 86%`.

- Technical 91: robots/canonical/security قوي، لكن تضارب أسطح sitemap/generated routes يحتاج حسم.
- Content/Local 90: عربي أولاً وإشارات SDAIA/PDPL/NCA جيدة؛ التغطية الإنجليزية محدودة وليست mirror كاملة.
- On-page 91: القوالب المباشرة قوية؛ dynamic templates تحتاج validation على الناتج.
- Schema 93: helpers وFAQ/Service/Breadcrumb واسعة؛ صفحات utility/thank-you استثناءات.
- CWV 60: budgets موجودة، لكن `.agents/brain.md` يوثق outliers وCLS متضارباً وINP غير شامل؛ لا توجد field data.
- AI readiness 95: robots يسمح search/grounding و`llms.txt`/`ai.txt` مشار إليها.
- Images 82: formats متعددة، لكن النسخ المكررة ترفع الصيانة والحجم.

## 2.3 جدول القوالب/المجموعات

> «إصلاح مطلوب» يعني تحقق/إصلاح على **الناتج المبني**؛ عبارة «مصدر قوي» لا تعني ضمان Google الفعلي.

| المسار/المجموعة | الجاهزية | أهم المشاكل | الإصلاح | الأولوية |
|---|---:|---|---|---|
| `/`, `/about/`, `/contact/`, `/demo/`, `/pricing/`, `/services/`, `/trust/` | 97–98% | غياب field CWV؛ اعتماد على layout؛ تحقق title uniqueness بعد build | crawl `dist/client`, PSI/CrUX | P1 |
| `/assessment/ai-governance-readiness/`, `/calculator/roi/`, `/partners/`, `/referral/`, `/sales-deck/`, `/solutions/`, `/sitemap/`, `/hub/` | 97–98% | CWV غير مثبت؛ بعض الصفحات conversion-heavy | تحقق raw HTML/schema/CWV | P1 |
| `/404/` | 88% | غير موجود في sitemap وهذا صحيح؛ يجب `noindex`/404 status | تأكد من status 404 وrobots | P1 |
| `/authors/[slug]/` | 83% | dynamic route لا يطابق sitemap حرفياً؛ links قليلة | قيّم URLs الناتجة وأضف author schema/links | P1 |
| `/blog/` | 97% | CWV فقط | crawl + Article list schema validation | P2 |
| `/blog/[...slug]/` | 48% source-only | metadata/hreflang تأتي ديناميكياً ولا يراها regex؛ template thin ظاهرياً | اختبر كل 33 مقالاً بعد build، uniqueness وArticle schema | P0 |
| `/blog/category/[category]/` | 88% | dynamic sitemap mismatch | اختبر كل category أو noindex للضعيف | P1 |
| legal AR: `/cookie-policy/`, `/data-processing-agreement/`, `/pdpl-statement/`, `/privacy-policy/`, `/terms/` | 93–98% | روابط داخلية قليلة في المصدر؛ CWV | أضف contextual links وتحقق hreflang pair | P2 |
| legal EN: `/en/cookie-policy/`, `/en/data-processing-agreement/`, `/en/pdpl-statement/`, `/en/privacy-policy/`, `/en/terms/` | 97–98% | `en-SA` مقابل الطلب `en` يحتاج قرار سياسة؛ CWV | اعتمد `en-SA` أو `en` بشكل موثق ومتبادل | P1 |
| `/en/` | 98% | redirect `/en/index.html` في `redirects.json` يذهب `/`؛ خطر فقد locale | غيّر الوجهة إلى `/en/` إن كان غير مقصود | P0 |
| `/en/sales-deck/` | 93% | links قليلة؛ CWV | روابط sales/context ثنائية اللغة | P2 |
| `/customers/` | 88% | غير ظاهر في sitemap بالمقارنة الحرفية | أضفه إن كان indexable أو noindex صريح | P1 |
| `/customers/{bank,hospital,pharma}/` | 78% | sitemap + redirect/noindex signal + links قليلة | احسم indexability؛ لا تترك soft/conflicting state | P0 |
| `/design/{buttons,cards,colors,forms,typography}/` | 83–88% | utility pages خارج sitemap/روابط قليلة | `noindex,follow` أو نقل خلف docs؛ لا تفهرسها تلقائياً | P1 |
| `/docs/` | 97% | CWV | validation | P2 |
| `/docs/[...slug]/` | 73% source-only | hreflang غير ظاهر؛ sitemap dynamic؛ links قليلة | افحص 30+ صفحة output، HowTo/Breadcrumb، pairs | P0 |
| `/events/{ai-governance-day,leap-2026,webinar}/` | 93% | روابط قليلة؛ انتهاء الحدث يخلق stale intent | Event schema/status/update policy | P2 |
| `/hub/[slug]/` | 88% | dynamic sitemap mismatch | فحص URLs الناتجة | P1 |
| `/kernel/`, `/kernel/audit/`, `/kernel/chat/`, `/kernel/evidence/` | 97–98% | CWV وكونها product UI indexable | فصل content indexable عن private/demo state | P1 |
| `/kernel/{approvals,compliance,connectors,policies,reports,scenarios,stats}/` | 93% | links source قليلة؛ UI content | روابط سياقية + software application schema عند الملاءمة | P2 |
| `/kernel/[slug]/` | 88% | dynamic mismatch | تحقق إن كان redundant مع الملفات الثابتة | P1 |
| `/kernel/offline/` | 78% | خارج sitemap، محتوى محلي منخفض، links قليلة | غالباً `noindex`; لا تعرض offline utility كـ marketing page | P0 |
| `/offline/` | 88% | خارج sitemap | `noindex` وstatus/UX واضح | P1 |
| `/newsletter/` | 93% | روابط قليلة | archive/subscribe schema وlinks | P2 |
| `/privacy-cookies/` | 93% | احتمال تداخل مع privacy/cookie pages | canonical/redirect أو محتوى مميز | P1 |
| `/solutions/[sector]/`, `/solutions/[sector]/[city]/`, `/solutions/[slug]/` | 88% source-only | dynamic sitemap mismatch؛ خطر cannibalization بين أنماط routes | crawl كل output، unique intent، canonical وLocalBusiness الصادق | P0 |
| `/thank-you/` | 58% | لا hreflang/schema/sitemap؛ صفحة تحويل لا بحث | أضف `noindex,follow`, احذف canonical المتعارض، استبعد sitemap | P0 |

## 2.4 اتساق الاستهداف السعودي

- `astro.config.mjs` يستخدم `ar-SA` و`en-SA`، بينما الطلب ذكر `(ar-SA/en)`. لا يوجد خطأ قياسي في `en-SA`، لكن يجب توثيق القرار وعدم مزج `en` و`en-SA`.
- `robots.txt` يسمح Googlebot وAI grounding ويستبعد `/api/`؛ جيد.
- توجد إشارات سعودية قوية في schema/content حسب helpers وcity solutions، لكن **NAP** يجب أن يبقى عنوان HQ حقيقياً واحداً؛ سجل brain يذكر إصلاح ادعاءات فروع غير مثبتة.
- افحص `keyword.txt` عبر script يربط كل keyword بـ canonical واحد؛ تجنب توزيع intent نفسه على `/services/`, `/solutions/`, `/hub/`.
- sitemap coverage: **176 URL مقابل 190 build pages = 92.63%** (`176 ÷ 190 × 100`) قبل استبعاد APIs/errors/noindex. هذه ليست بالضرورة فجوة 14 صفحة لأن build يشمل صفحات غير قابلة للفهرسة.
- تغطية templates المباشرة في مقارنة المصدر: 67 template، مع dynamic routes؛ لا يجوز حساب 67 كعدد صفحات الموقع.

---

# القسم 3: توحيد الدماغ في `/.agents/brain.md`

## 3.1 الواقع الحالي

`/.agents/brain.md` موجود بالفعل وحجمه **892,913 B / 5,542 سطر**، لكنه أصبح مزيجاً من source of truth وworklog ونتائج QA. المطلوب ليس إنشاء brain من الصفر، بل **إعادة تأسيسه كمرجع تشغيلي قصير** مع أرشيف تاريخي منفصل.

## 3.2 البنية المقترحة

1. **Identity & Scope**: المنتج، السوق السعودي، النطاق، اللغة.
2. **Non-negotiable Rules**: الأمان، الأسرار، Git، عدم الادعاء التنظيمي.
3. **Architecture Map**: root Astro، `apps/dashboard`, `packages/*`, Render/Cloudflare.
4. **Commands & Verification Matrix**: install/build/typecheck/test/SEO.
5. **SEO & Saudi Localization Contract**: canonical/hreflang/schema/NAP/RTL.
6. **Kernel Product Contract**: live routes، API، demo boundaries، telemetry.
7. **Data/Auth/Security Contract**: DB/RLS/scoping/rate limits/PII.
8. **Decision Records Index**: روابط إلى ADRs، لا نسخ كامل.
9. **Known Risks & Current Baseline**: أرقام حديثة فقط مع تاريخ وأمر القياس.
10. **Agent Adapter Contract**: كل أداة تقرأ brain ثم ملف adapter قصير.

## 3.3 خريطة المصادر

| المصدر | الهدف في brain | الإجراء |
|---|---|---|
| `AGENTS.md` / `CLAUDE.md` / `.agents/AGENTS.md` / `.clinerules/H.md` | Rules + commands | دمج مرة واحدة، وتحويل البقية إلى stubs |
| `.roo/rules/y.md` | adapter/tool-specific deltas | احتفظ فقط بالفروق الخاصة بـ Roo |
| `prompts.md` | Prompt catalog index | انقل البرومبتات القابلة لإعادة الاستخدام إلى `/.agents/prompts/` واربطها |
| `MONOREPO.md` | Architecture map | دمج الملخص والـ workspace commands |
| `docs/` | ADR/docs index | روابط لا نسخ |
| `strategy/` | Product positioning/constraints | حقائق ثابتة فقط؛ الباقي docs |
| `.clinerules/`, `.roo/`, `.claude/` | adapters | 10–30 سطراً لكل أداة |
| `loop/skills/`, `.agents/skills/` | skill catalog | index + ownership/version، لا نسخ skill bodies |
| `worklog.md` | current risks + archive | آخر حالة فقط؛ التاريخ إلى archive |

## 3.4 نسبة التقليص المتوقعة

Corpus المحدد = **1,754,305 B**. التكرار الحرفي المؤكد = **345,280 B (19.68%)**. الهدف المقترح:

- brain تشغيلي 120–180 KB.
- adapters مجتمعة ≤20 KB.
- prompt/ADR indexes ≤30 KB.
- التاريخ خارج hot context.

إذا صار hot context = 230 KB، التقليص = `(1,754,305 - 230,000) ÷ 1,754,305 × 100 = 86.89%`.

هذه **نسبة تصميم مستهدفة** وليست نتيجة منفذة. لا تحذف التاريخ؛ انقله إلى `docs/archive/agent-history/` أو release artifact.

## 3.5 صيغة adapters

```md
# Agent Instructions

Source of truth: `/.agents/brain.md`.
Read it before non-trivial work. This file contains only tool-specific deltas.

## Tool-specific deltas
- [فرق حقيقي خاص بالأداة فقط]
```

---

# القسم 4: تحليل `kernel` وبرومبتات رفعه لمستوى عالمي

## 4.1 الوضع الحالي والفجوة

- `kernel/` الحي يحتوي README و14 ملف CSS؛ الواجهة الحقيقية في `src/pages/kernel/`، والمكونات في `src/components/kernel/` والـ layouts في `src/layouts/KernelLayout.astro`.
- AI API الحقيقي هو `src/pages/api/ai/chat.ts`: Groq + Gemini، SSE/JSON، allowlist/API key، Redis sessions، rate limiting، usage tracking، prompt allowlist.
- `src/pages/kernel/chat.astro` يملك UI غني لكنه يبدأ ببيانات seed وعبارات NVIDIA ثابتة بينما endpoint الفعلي موثق كـ Groq/Gemini. هذا **تناقض ثقة** يجب حسمه.
- مقارنة بتجارب Vercel/Stripe/OpenAI: ينقصه workspace onboarding موجّه بالهدف، sample data واضح، progressive disclosure، نتيجة قبل/بعد قابلة للمشاركة، sandbox tenant isolation، limits مرئية، وإرسال qualified lead مرتبط بما أنجزه العميل.

## 4.2 سلسلة برومبتات جاهزة للتنفيذ

### K1 — عقد التجربة والـ IA

**الهدف:** تحويل `/kernel/` من مجموعة dashboards إلى journey: اختيار قطاع → سيناريو → تشغيل آمن → تفسير القرار → evidence → CTA.

**الملفات:** `src/pages/kernel/index.astro`, `src/data/kernel.ts`, `src/components/kernel/*`, `src/layouts/KernelLayout.astro`.

**البرومبت:**
> حلّل مسار Kernel الحالي دون حذف وظائف. صمّم IA عربي RTL أولاً من خمس مراحل: onboarding، اختيار سيناريو سعودي، تشغيل تفاعلي، تفسير policy/evidence، CTA للمبيعات. استخدم المكونات الحالية، وافصل demo بوسم واضح. لا تدّع امتثالاً قانونياً كاملاً. أضف اختبارات browser للمسار الرئيسي والجوال.

**القبول:** اكتمال journey بلوحة مفاتيح، لا dead ends، CTA يحمل `scenario`, `sector`, `riskBand` دون PII، 320/375/544/1024px بلا overflow.

**التحقق:** `pnpm build && pnpm seo:all && node scripts/playwright/<kernel-journey-test>.mjs`.

### K2 — ربط Live Sandbox بالـ API الحقيقي

**الهدف:** إزالة التناقض بين fake streaming و`/api/ai/chat`.

**الملفات:** `src/pages/kernel/chat.astro`, `src/pages/api/ai/chat.ts`, `src/data/kernel-system-prompts.ts`, `src/lib/redis.ts`, `src/lib/ratelimit.ts`, `src/lib/usagetracker.ts`.

**البرومبت:**
> اربط composer في `src/pages/kernel/chat.astro` بـ `/api/ai/chat` عبر SSE مع fallback JSON. استخدم `promptId` allowlist فقط، session UUID، حالات loading/error/degraded، وإلغاء الطلب. لا تعرض provider ثابتاً؛ اعرض provider من response metadata. ميّز seed/demo عن live. لا تسجل النص أو PII.

**القبول:** streaming يعمل، CJK composing لا يرسل Enter، 4000-char limit واضح، 403/429/502/503 لها رسائل آمنة، لا secrets في client bundle، abort يعمل.

**التحقق:** `pnpm test:chat-session && pnpm test:csrf && pnpm build` ثم Playwright لمساري SSE وJSON.

### K3 — Firewall قبل النموذج

**الهدف:** جعل وعد PII/policy قابلاً للإثبات قبل provider call.

**الملفات:** `packages/firewall-detectors/src/*`, `src/pages/api/ai/chat.ts`, `src/pages/kernel/chat.astro`, `src/data/kernel-system-prompts.ts`.

**البرومبت:**
> أدخل pipeline حقيقياً قبل Groq/Gemini: normalize → PII detectors → policy decision → allow/redact/block/require_approval. أعد فقط findings آمنة ومختصرة وtrace id. لا ترسل النص المحظور إلى provider. أضف tests عربية وإنجليزية وحدوداً مضادة لـ prompt injection.

**القبول:** blocked payload لا يصل إلى mock provider؛ redaction deterministic؛ detector tests تشمل Saudi phone/National ID/email؛ logs بلا content.

**التحقق:** `pnpm --filter @brightai/firewall-detectors test && pnpm test:chat-session`.

### K4 — Sandbox isolation والحدود

**الهدف:** تجربة عامة آمنة وقابلة للبيع.

**الملفات:** `src/pages/api/ai/chat.ts`, `src/lib/ratelimit.ts`, `src/lib/redis.ts`, `packages/config/src/*`, tests تحت `scripts/` أو workspace المناسب.

**البرومبت:**
> طبّق quota يومية لكل IP/session مع sliding window موزع، cap للتكلفة/tokens، TTL، circuit breaker، abuse signals وRetry-After. لا تستخدم in-memory كضمان إنتاجي صامت؛ أعرض degraded state وأوقف العمليات المكلفة عند غياب Redis في production.

**القبول:** limits متسقة عبر replicas، اختبار race، عدم نمو مفاتيح غير محدود، no-store لكل response، rollback flag موثق.

**التحقق:** `pnpm test:chat-session && pnpm verify:all`.

### K5 — Evidence story ونتيجة قابلة للمشاركة

**الهدف:** نقل المستخدم من «محادثة» إلى «قيمة حوكمة».

**الملفات:** `src/pages/kernel/evidence.astro`, `audit.astro`, `reports.astro`, `src/components/kernel/*`, `src/data/kernel.ts`.

**البرومبت:**
> أنشئ summary بعد كل تجربة: القرار، المخاطر، البيانات المحجوبة، السياسة، provider، latency، trace chain. أضف export آمن redacted ومشاركة URL غير قابلة للتخمين وذات TTL، دون PII. اجعل report مثالاً واضحاً لا شهادة امتثال.

**القبول:** trace متسق بين chat/audit/evidence؛ export لا يحتوي prompt الخام؛ accessibility وRTL صحيحان.

**التحقق:** `pnpm build && node scripts/playwright/<kernel-evidence-flow>.mjs`.

### K6 — Analytics وqualified CTA

**الهدف:** قياس activation دون انتهاك الخصوصية.

**الملفات:** `src/components/MarketingScripts.astro`, `src/components/kernel/KernelLeadForm.astro`, `src/pages/api/lead.ts`, `src/pages/kernel/*.astro`.

**البرومبت:**
> عرّف event taxonomy: `kernel_started`, `scenario_selected`, `message_allowed`, `message_blocked`, `evidence_viewed`, `lead_submitted`. أرسل metadata غير حساسة فقط. اربط lead بالسياق المجمع لا بالنص. أضف consent gating وdedupe.

**القبول:** صفر prompt/PII في analytics، events مرة واحدة، funnel report قابل للحساب، CTA بعد value moment لا قبلها.

**التحقق:** Playwright intercept للطلبات + `pnpm test:csrf && pnpm build`.

### K7 — Mobile/accessibility/performance release gate

**الهدف:** تجربة عالمية على الجوال.

**الملفات:** `kernel/assets/css/kernel.css`, `kernel/assets/css/pages/*.css`, `src/pages/kernel/*.astro`, `.lighthouserc.json`.

**البرومبت:**
> اختبر وأصلح 320/375/544/768/1024px، keyboard/focus/ARIA، mixed bidi، streaming announcements، reduced motion، touch targets ≥44px. لا تغيّر budgets لتنجح الاختبارات؛ أصلح السبب.

**القبول:** 0 horizontal overflow، 0 axe serious/critical، LCP≤2.5s، INP≤200ms، CLS≤0.1، script≤200KB.

**التحقق:** `pnpm build`, Lighthouse CI على dist الصحيح، وPlaywright screenshots + axe.

---

# القسم 5: برومبتات التنفيذ للإصلاح والتنظيف

## P0-1 — تثبيت baseline ومنع الحذف الخاطئ

> أنشئ branch تنفيذية. سجّل `git status`, `git ls-files`, hashes والأحجام. شغّل `pnpm install --frozen-lockfile`, `pnpm build`, `pnpm seo:all`, `pnpm verify:all`, `pnpm typecheck`, `pnpm test`. لا تنظف قبل baseline. خزّن outputs كـ CI artifacts لا ملفات git.

**القبول:** جدول pass/fail مع exit codes؛ لا تغييرات generated غير مفهومة.  
**التحقق:** الأوامر أعلاه + `git diff --exit-code` بعد كل أمر يفترض القراءة فقط.  
**Rollback:** `git restore` للملفات المولدة فقط بعد مراجعة diff.

## P0-2 — تصحيح indexability المتعارضة

> راجع `src/pages/thank-you/index.astro`, `src/pages/kernel/offline.astro`, `src/pages/offline/index.astro`, `src/pages/customers/{bank,hospital,pharma}/index.astro`, `src/pages/design/*.astro`, `redirects.json`, `render.yaml`, `astro.config.mjs`. عرّف لكل route: index أو noindex أو redirect واحد. اجعل thank-you/offline noindex، وutility design noindex ما لم يوجد هدف بحثي مثبت. أصلح `/en/index.html` ليحوّل إلى `/en/` إن كان EN مقصوداً.

**القبول:** لا URL في sitemap يحمل noindex/redirect؛ لا redirect chains؛ status صحيح.  
**التحقق:** `pnpm build && pnpm seo:all && pnpm redirects:check`.  
**Rollback:** revert commit واحد خاص بالـ indexability.

## P0-3 — تدقيق SEO على الناتج الفعلي لكل dynamic route

> بعد build، crawl كل HTML في `dist/client`: 33 blog، 30+ docs، solution sector/city/slug، authors/categories/hub. احسب title/description uniqueness، canonical، hreflang reciprocity، schema، word count، internal depth، sitemap. لا تحكم على `[slug].astro` بالنص الخام فقط.

**القبول:** CSV/Markdown artifact خارج git؛ 0 duplicate canonical؛ 0 orphan indexable؛ كل hreflang target 200 self-canonical.  
**التحقق:** `pnpm build && pnpm seo:all && pnpm seo:hreflang && pnpm seo:link-graph`.  
**Rollback:** لا تعديل في مرحلة القياس؛ إصلاح كل family في commit مستقل.

## P0-4 — تنظيف reports الثقيلة

> انقل `report/A/perf/*.report.{html,json}`, `audit/evidence/a11y-report.json`, `audit/INTERNAL-LINKS.csv` والـ screenshots الكبيرة إلى CI/release storage. أبقِ summaries صغيرة فقط. وحّد `report/`, `reports/`, `_reports/`, `audit/` في سياسة retention موثقة.

**القبول:** انخفاض tracked bytes ≥50% دون فقد generator أو summary؛ build/SEO لا يعتمد الملفات.  
**التحقق:** `git grep` لكل path ثم `pnpm verify:all && pnpm build`.  
**Rollback:** tag قبل النقل + manifest SHA-256 + استعادة artifact تجريبية.

## P1-1 — إزالة generated files من git

> افحص `.astro/*`, `sitemap.xml`, `public/sitemap.xml`. اختر source واحداً للسitemap يطابق deployment. استخدم `git rm --cached` للمولد فقط، وحدّث `.gitignore` وbuild script. لا تحذف sitemap المنشور من output.

**القبول:** clean checkout يولد sitemap 176 URL أو العدد المتوقع الجديد؛ robots links تعمل.  
**التحقق:** `pnpm sitemap:generate && pnpm build && pnpm seo:all`.  
**Rollback:** restore الملفات من commit السابق وإعادة tracking.

## P1-2 — brain v3 المختصر

> أعد بناء `.agents/brain.md` وفق الأقسام العشرة في هذا التقرير. حوّل `AGENTS.md`, `CLAUDE.md`, `.agents/AGENTS.md`, `.clinerules/H.md`, `.roo/rules/y.md` إلى adapters قصيرة. انقل worklog التاريخي إلى archive index. لا تفقد أي قاعدة فريدة؛ أنشئ source-to-target matrix.

**القبول:** hot context ≤230KB، 0 تضارب قواعد، كل adapter يشير للـ brain، hash duplicates = 0 لهذه المجموعة.  
**التحقق:** script يقارن headings/rules inventory + `pnpm verify:all`.  
**Rollback:** snapshot text-only + commit مستقل؛ لا tarball داخل git.

## P1-3 — asset deduplication

> استخدم SHA-256 groups لتوحيد OG/logo/font/favicon. حدّث كل `src`, CSS, schema, manifest refs إلى canonical paths قبل حذف النسخ. لا تغيّر الأبعاد/format بلا اختبار CLS.

**القبول:** 0 broken refs، groups الزائدة أزيلت، visual snapshots ثابتة.  
**التحقق:** `pnpm build && pnpm seo:all && pnpm links:dist`.  
**Rollback:** commit asset منفصل واستعادة paths السابقة.

## P1-4 — Kernel provider truth

> أصلح التعارض بين NVIDIA الثابت في `src/pages/kernel/chat.astro` وGroq/Gemini في `src/pages/api/ai/chat.ts`. اختر source of truth واحداً من response metadata؛ لا تعرض configured/model/mode وهمياً. حدّث `kernel/README.md` ليصف الحالة الحالية فقط.

**القبول:** UI يطابق provider الفعلي، demo موسوم، لا secret، docs لا تشير لملفات محذوفة كحالية.  
**التحقق:** `pnpm test:chat-session && pnpm build` + browser test.  
**Rollback:** feature flag يعيد UI read-only دون تعطيل endpoint.

## P2-1 — إصلاح داخلي صفحةً صفحة

> عالج الصفحات ذات source links قليلة: legal، events، newsletter، kernel subpages، sales-deck. أضف روابط سياقية طبيعية لا sitewide spam، وBreadcrumb صالحاً. افحص crawl depth ≤3 للصفحات التجارية.

**القبول:** 0 orphan، ≥3 روابط واردة ذات صلة لكل صفحة تجارية، لا anchor duplication مصطنع.  
**التحقق:** `pnpm internal-links:audit && pnpm seo:link-graph`.

## P2-2 — سياسة hreflang السعودية

> وثّق هل الإنجليزية `en-SA` أم `en`. طبّق reciprocal pairs فقط عند وجود ترجمة مكافئة، وأضف `x-default` للصفحات المناسبة. لا تربط صفحة EN إلى AR غير مكافئة.

**القبول:** 100% reciprocal للـ pairs المعلنة، targets 200، canonical locale صحيح.  
**التحقق:** `pnpm seo:hreflang && pnpm seo:all`.  
**Rollback:** revert hreflang commit فقط.

## P2-3 — CWV evidence حقيقي

> أصلح `.lighthouserc.json` ليشير إلى output الصحيح (`dist/client`) ولا تستخدم `staticDistDir: "."`. شغّل lab على representative templates وPSI/CrUX إن توفر traffic. افصل lab عن field.

**القبول:** LCP≤2.5s، INP≤200ms، CLS≤0.1 عند p75 حيث تتوفر field data؛ لا FID.  
**التحقق:** Lighthouse CI + `agent-browser vitals`/PSI artifact.  
**Rollback:** لا تخفّض thresholds؛ revert config إذا كان path خاطئاً.

## P3-1 — تنظيم scripts والجذر

> صنّف 177 ملفاً في `scripts/`: production، CI، migration، one-off، archived. انقل `qa-*.mjs` إلى `scripts/qa/`. لا تحذف script لمجرد عدم الاستيراد؛ افحص `package.json`, GitHub Actions, docs, shell calls.

**القبول:** كل script له owner/purpose/entrypoint، root خالٍ من one-off QA، لا command مكسور.  
**التحقق:** استخراج كل script من package/CI ثم تشغيل smoke matrix.  
**Rollback:** preserve history عبر `git mv` وcommit واحد.

---

# ملحق A: أوامر القياس المستخدمة

```bash
# الملفات والحجم
 git ls-files -z
 python3: sum(os.path.getsize(file))

# التكرار
 sha256(file contents) -> group identical hashes
 duplicate_rate = extra_copies / tracked_files * 100

# الصفحات
 glob('src/pages/**/*.astro')
 regex(title|description|canonical|hreflang|ld+json|href|Arabic chars)
 parse <loc> from public/sitemap.xml
 parse redirects.json

# أوامر قراءة إضافية
 git ls-files
 git grep / repository search
```

## ملحق B: حدود التدقيق

1. لم يُشغّل build لأن الطلب منع أوامر قد تغيّر الحالة؛ أرقام 190 build page ونتائج الأداء مأخوذة من config/brain الملتزمين ويجب إعادة قياسها في P0-1.
2. regex المصدر لا يرى metadata التي ينتجها `getStaticPaths` أو content collections؛ لذلك وُسمت درجات dynamic routes بـ source-only.
3. لم تُستخدم بيانات Google Search Console أو CrUX؛ لا يمكن الادعاء بأداء ميداني أو فهرسة فعلية من المستودع وحده.
4. نسبة 86% هي health/readiness محسوبة بالأوزان المعلنة، وليست نسبة URLs المفهرسة لدى Google.
5. أي حذف مقترح يتطلب `git grep` + build/test + rollback مستقل، حتى لو كانت الثقة 100% في التكرار.
