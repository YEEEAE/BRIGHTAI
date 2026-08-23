# BrightAI — Saudi SEO Authority Master Plan
**التاريخ:** 2026-08-24  
**النطاق:** Owner URL model + cannibalization audit + claims audit + P0 fixes (local only)  
**الإنتاج:** غير مُعدّل — لا commit ولا push ولا deploy من قبل الوكيل (المستخدم التزم يدويًا خلال الجلسة في `bbb9e4fb`)  
**مصدر الحقيقة:** كود `src/` + بناء `dist/client/` المحلي (276 HTML / sitemap 259 URL)

---

## 1. Executive Summary

- النموذج الاستراتيجي المعتمد: **`/` = Brand + Saudi Category Owner**، **`/solutions/ai-governance-platform/` = Commercial Product Owner**، **`/hub/ai-governance/` = Informational Pillar Owner**. الفصل بين النوايا الثلاث موجود فعلًا في الكود (titles/H1 مختلفة) — التداخل الحقيقي جاي من الصفحات الداعمة (blog/docs/answer/kernel) مو من الثلاثي الأساسي.
- **P0 منفّذة:** (أ) الرئيسية ما كانت تربط إطلاقًا بـ `/hub/ai-governance/` — أُضيفت بطاقتان وصفتان بأنكورات وصفية. (ب) ادعاءات امتثال مطلقة ومتناقضة (99.7% امتثال عملاء، متوافق PDPL من اليوم الأول، نضمن الامتثال التام، شهادات SOC 2/ISO 27001، 99.95% uptime، المنصة الأولى، شراكات تنظيمية مفترضة) — كلها لُيّنت أو استُبدلت بحقائق قابلة للتحقق من الريبو، لأنها كانت تناقض `ai.txt` و`llms.txt` وصفحة الأسعار نفسها.
- **أخطر اكتشاف غير SEO:** دراسة حالة حكومية بنتيجة مفبركة («اجتازت مراجعة NCA السنوية بدون مخالفات» + 98%) — حُوّلت لسيناريو توضيحي معلن.
- الكلمات Agentic AI Governance / Agentic AI Security: **صفر تغطية** في الموقع كله (فرصة محتوى مستقبلية).
- GSC غير متاح — كل قرارات keyword/ranking معلّمة **تحتاج GSC** قبل التنفيذ.

## 2. Verified Current Baseline (2026-08-24)

| البند | القيمة المتحققة |
|---|---|
| البناء | `pnpm build` Complete → 276 HTML (بعد استكمال خطوات post-build يدويًا بسبب اختفاء مؤقت لـ dist على filesystem — انظر §27) |
| sitemap | 259 URL (أعيد توليده بعد سباق أول أنتج 121) |
| seo:check | PASS (legacy 4/4 + content 4/4) |
| seo:schema | PASS (62 صفحة schema + 263 speakable) |
| seo:gate | PASS — 0 canonical issues / 0 bad slugs |
| seo:hreflang | PASS 260 sets / 0 errors |
| internal-links | PASS — 0 orphans / 0 broken / depth ≤ 3 |
| redirects:check | PASS (0 مشاكل) |
| seo:word-count | PASS 96/96 |
| firewall contract test | 2/2 |
| LHCI | **N/A محليًا** (لا Chrome) — per brain |
| GSC / CrUX / live HTTP | **N/A** (لا connector، DNS محجوب) |
| GA4 | 156 مستخدم/28 يوم، direct مهيمن، Google organic=1 (الظهور هو المشكلة مو الفهرسة) |

## 3. Homepage Ownership — `/`

| العنصر | القيمة |
|---|---|
| title | `حوكمة الذكاء الاصطناعي السعودية \| BrightAI` |
| H1 (SplitHero) | `حوكمة الذكاء الاصطناعي للشركات السعودية بجرد AI ومالك مسؤول — Saudi AI Safety OS` |
| meta | `حوكمة الذكاء الاصطناعي في السعودية مع BrightAI — منصة سعودية تجمع AI Firewall وسجلات تدقيق وموافقات بشرية وفق PDPL وNCA...` |
| canonical / robots / hreflang | self `/` · index,follow · ar-SA / en-SA(/en/) / x-default |
| Schema | Organization + WebSite + LocalBusiness(Riyadh) + WebPage(speakable) + SoftwareApplication(Kernel) + FAQPage(9 ظاهرة 1:1) + DefinedTermSet(9 مصطلحات) |

**تملك `/`:** BrightAI (الكيان) · Saudi AI Safety OS · حوكمة الذكاء الاصطناعي السعودية · حوكمة الذكاء الاصطناعي للشركات السعودية · Saudi AI Governance / AI Governance Saudi Arabia (نية الفئة العريضة بالسياق السعودي) · فئة Enterprise AI Governance في السياق السعودي.

**توزيع الثقة من `/` (بعد الإصلاح):** 7 روابط → `/solutions/*` (منها platform ×3 وfirewall ×3) · 9 → `/kernel/*` · 1 → `/assessment/` · 6 → `/docs/*` · **2 → `/hub/ai-governance/` (جديدة — كانت صفرًا)** · روابط ثقة → `/pdpl-statement/` `/trust/` عبر عناصر أخرى.

## 4. Solution Ownership — `/solutions/ai-governance-platform/`

- title: `منصة حوكمة الذكاء الاصطناعي التشغيلية للمؤسسات السعودية | BrightAI` — H1 نفسه بدون اللاحقة.
- التسلسل التجاري: `Regulation → Risk → Control → Enforcement → Evidence` + CTA أساسي → `/assessment/ai-governance-readiness/` وثانوي → `/docs/ai-governance-platform/`.
- Schema: Service + FAQPage (7 أسئلة ظاهرة) + Breadcrumb.
- **تملك:** منصة حوكمة الذكاء الاصطناعي · AI Governance Platform/Software (نية شراء المنتج) · Enterprise AI Governance Platform في السعودية.
- فجوة ملاحظة: ما عندها sector cards عكسية (`getRelatedSectors` فاضي) — P2.

## 5. Hub Ownership — `/hub/ai-governance/`

- title: `وش هي حوكمة الذكاء الاصطناعي؟ | دليل سعودي عملي` — H1 سؤال مباشر + إجابة اقتباسية في أول 60 كلمة + مصادر رسمية (SDAIA/PDPL/NCA) + محدّث 23 أغسطس 2026.
- 12 قسمًا تعليميًا (تعريف/فروق/دورة حياة/أدوار/مخاطر/إشراف/ضوابط/أدلة/نماذج ووكلاء/roadmap/FAQ/مصادر).
- رابط تجاري واحد ناعم → platform (بأنكور `منصة حوكمة الذكاء الاصطناعي`) — نموذج صحيح لصفحة تعليمية.
- **تملك:** وش هي حوكمة الذكاء الاصطناعي؟ · AI Governance Framework (تعليميًا) · best practices · implementation guidance بالسياق السعودي.
- ملاحظة: `hub-content-inline.ts` يحتفظ بنسخة HTML ميتة لـ ai-governance (لا تُعرض) — مصدر تشويش مستقبلي؛ يُنصح بحذفها في P2.

## 6. Complete Owner URL Map

| Cluster | Search Intent | Owner URL | Supporting URLs |
|---|---|---|---|
| Brand | BrightAI | `/` | `/about/` `/trust/` `/contact/` |
| Category (Saudi) | حوكمة الذكاء الاصطناعي السعودية | `/` | `/hub/ai-governance/` `/blog/ai-governance/` `/docs/ai-governance-saudi-arabia/` |
| Commercial platform | منصة حوكمة الذكاء الاصطناعي | `/solutions/ai-governance-platform/` | `/docs/ai-governance-platform/` `/kernel/` `/blog/best-ai-governance-platforms-2026/` |
| Informational | وش هي حوكمة الذكاء الاصطناعي؟ | `/hub/ai-governance/` | `/answer/ai-governance-framework/` `/blog/what-is-ai-governance-saudi-companies/` |
| AI Firewall | AI Firewall / جدار حماية AI | `/solutions/ai-firewall/` (صفحة تجارية مخصصة 2026-08-23) | `/docs/ai-firewall/` `/blog/ai-firewall-why-you-need-it/` `/answer/ai-firewall-saudi{,-ar}/` |
| AI Risk | تصنيف/إدارة مخاطر AI | `/solutions/ai-risk-classification/` (تجاري) | `/docs/ai-risk-management/` `/hub/sdaia-ai-risk-management/` (تنظيمي) `/blog/iso-42001-risk-assessment-saudi/` |
| Audit Trail | سجل تدقيق AI | `/solutions/ai-audit-trail/` | `/kernel/audit/` `/docs/ai-audit-trail/` `/answer/audit-trail-saudi-ar/` |
| Human Approval | موافقات بشرية | `/solutions/human-approval-layer/` | `/kernel/approvals/` `/docs/human-approval-layer/` |
| Evidence | ملف أدلة AI | `/solutions/ai-evidence-file/` | `/kernel/evidence/` `/docs/ai-evidence-file/` |
| Shadow AI | اكتشاف استخدامات AI | `/solutions/ai-use-case-discovery/` | `/blog/shadow-ai-discovery-saudi-company/` |
| PDPL | امتثال PDPL وAI | `/lp/pdpl/` (تحويلي) | `/docs/pdpl-ai-governance/` `/pdpl-statement/` + 18 مقال PDPL |
| NCA ECC | ضوابط NCA وAI | `/lp/ecc/` (تحويلي) | `/docs/nca-ecc-ai-governance/` `/answer/nca-ecc-controls/` + 13 مقال |
| SDAIA | إرشادات سدايا | `/answer/sdaia-generative-ai/` + `/docs/sdaia-generative-ai-guidelines/` (تداخل — انظر §7) | `/hub/sdaia-ai-risk-management/` + 8 مقالات |
| SAMA/Banking | حوكمة AI مصرفية | `/solutions/banking-ai-governance/` | `/lp/banking/` `/solutions/banking-ai-governance/riyadh/` + 6 مقالات |
| Healthcare | حوكمة AI صحية | `/solutions/healthcare-ai-governance/` | `/lp/healthcare/` + city pages + 2 مقالات |
| Assessment | تقييم جاهزية | `/assessment/ai-governance-readiness/` | روابط من platform + hub |
| Agentic AI | Agentic Governance/Security | **لا يوجد مالك — صفر تغطية** | — |

## 7. Cannibalization Matrix

| Keyword Cluster | URLs Competing | Intended Owner | Severity | Action |
|---|---|---|---|---|
| حوكمة الذكاء الاصطناعي السعودية (head) | `/` · `/blog/ai-governance/` (desc) · `/docs/ai-governance-saudi-arabia/` (title variant) · `/answer/ai-governance-saudi-arabia-ar/` | `/` | P1 | CHANGE INTRO/محتوى الداعمة لتخدم `/`؛ `/answer/` تربط المحور بالفعل (furtherReading) |
| منصة حوكمة الذكاء الاصطناعي | platform · `/kernel/` (title منصة حوكمة!) · `/docs/ai-governance-platform/` (metaTitle دليل منصة) · 3 `/lp/*` descriptions | platform | P1 | CHANGE TITLE لـ `/kernel/` → «غرفة تشغيل BrightAI Kernel» (يلغي «منصة حوكمة» من title) — يحتاج قرار |
| وش هي حوكمة AI | hub (owner) · `/blog/what-is-ai-governance-saudi-companies/` (2430 كلمة) · `/blog/ai-governance/` (3528) | hub | P2 | المدونتان مربوطتان سياقيًا بالمحور (إصلاح 2026-08-23) — DO NOTHING الآن + GSC |
| سجل تدقيق AI | solution · `/kernel/audit/` · `/docs/ai-audit-trail/` (metaTitle مطابق تقريبًا) · `/answer/audit-trail-saudi-ar/` · مقالان | solution | P2 | وضّح دور kernel كواجهة منتج والـ docs كتوثيق — canonicals سليمة؛ راقب GSC |
| تصنيف مخاطر AI | solution · `/docs/ai-risk-management/` (إدارة variant — نية مختلفة) · `/hub/sdaia-ai-risk-management/` (SDAIA-P145 — نية تنظيمية مختلفة) | solution (تجاري) / docs (إدارة عامة) | P3 | نوايا منفصلة فعلًا — DO NOTHING |
| حوكمة AI للبنوك | `/lp/banking/` · sector · riyadh · khobar · `/answer/ai-banking/` · `/answer/sama-ai/` · 6 مقالات · `/customers/bank/` | sector | P1 | `/lp/banking/` vs sector نية متقاربة جدًا؛ قرار redirect مشروط بـ GSC + backlinks (قرار ANSWER-AUDIT-001 سابق) |
| حوكمة AI للقطاع الصحي | `/lp/healthcare/` · sector · jeddah · mecca · `/answer/ai-healthcare/` (**H1 مطابق حرفيًا لـ /lp/healthcare/**) | sector | P1 | CHANGE TITLE/H1 لـ `/answer/ai-healthcare/` إلى صيغة سؤال (P1 قادم) أو دمج حسب GSC |
| إرشادات سدايا التوليدي | `/answer/sdaia-generative-ai/` vs `/docs/sdaia-generative-ai-guidelines/` — محتوى شبه مكرر | answer (سريعة) | P1 | MERGE محتمل: docs تُعمّق وanswer تختصر + تربط — يحتاج GSC |
| ISO 42001 | `/answer/iso-42001/` + 10 مقالات متخصصة | answer + مقالات (نوايا فرعية مختلفة: cost/checklist/risk...) | P3 | DO NOTHING — topical coverage صحي |
| امتثال PDPL | `/lp/pdpl/` · `/answer/pdpl-ai-compliance{,-ar}/` · `/hub/compliance/` | lp (تحويلي) | P2 | النسختان EN/AR للـ answer بلا hreflang صحيح وlang ثابت `ar` — خلل تقني P1 موثق في ANSWER-AUDIT-001 |

**الحكم على الثلاثي الأساسي:** Google يقدر يميّز `/` (فئة سعودية عريضة) عن platform (منتج تشغيلي) عن hub (تعليمي) — الـ titles والـ H1 والـ intros منفصلة بوضوح. الخطر الحقيقي كان غياب رابط homepage→hub (انحل) وkernel/docs اللي تسرق عبارات «منصة/دليل» (P1 قادم).

## 8. Topic Cluster Architecture

13 عنقود محددة؛ التغطية الحالية: AI Governance ✅ (platform+hub+docs+blog) · AI Risk ✅ · AI Security ⚠️ (ما فيه owner تجاري مستقل — firewall يغطي الجزء العملي و`/hub/security/` تعليمي) · AI Compliance ✅ · Audit & Evidence ✅ · Human Oversight ✅ · Responsible AI ⚠️ (متناثر) · Enterprise AI Ops ✅ (kernel) · **Agentic AI Governance ❌ صفر** · **Agentic AI Security ❌ صفر** · Saudi AI Regulation ✅ (قوي: SDAIA-P145 + PDPL + NCA + SAMA + ISO 42001) · Sector ✅ (4 قطاعات + 6 مدن) · Assessments ✅.

## 9. Money Page Priorities

1. `/solutions/ai-governance-platform/` — قوية؛ ناقصها sector backlinks
2. `/solutions/ai-firewall/` — أُعيد بناؤها أمس بمقارنات firewall-vs-DLP ✅
3. `/solutions/ai-risk-classification/` — typo أُصلح اليوم؛ title المعروض من migrated JSON (انتبه: تعديل solutions.ts لن يظهر)
4. `/solutions/ai-audit-trail/` — description فيه «توافق PDPL وNCA» (متوسط الخطورة — نسية متبقية P2)
5. `/solutions/human-approval-layer/` — description «متوافقة مع NCA ECC» (متبقية P2)
6. `/solutions/policy-to-control-mapping/` — description «توافق NCA ECC» (متبقية P2)
7. `/assessment/ai-governance-readiness/` — محدثة 2026-08-23 ✅
8. `/hub/ai-governance/` — حصلت اليوم على 2 رابط من الرئيسية + control matrix (جلسة موازية)

## 10. Saudi Information Gain — الموجود والمفقود

✅ موجود: أمثلة سعودية (سلة/زد غير مستغلة)، سياق PDPL/NCA/SDAIA/SAMA/SFDA/ZATCA، ربط ISO 42001 بالسعودية، إطار SDAIA-P145، حزم امتثال قطاعية، مصادر رسمية مباشرة في الرئيسية والمحور.
❌ مفقود (فرص RESEARCH REQUIRED): بيانات Shadow AI سعودية أصلية · benchmark جاهزية حوكمة AI للمؤسسات السعودية · دليل PDPL↔AI mapping بصيغة قابلة للتنزيل · Agentic AI بالسياق السعودي.

## 11. Internal Linking Changes (منفذة اليوم)

| From | To | Anchor | Reason |
|---|---|---|---|
| `/` (أدلة مهمة — بطاقة 6) | `/hub/ai-governance/` | «مركز معرفة حوكمة الذكاء الاصطناعي» + «ابدأ من المركز» | صوّت رئيسي للمالك التعليمي — كانت يتيمة من الرئيسية |
| `/` (اكتشف المزيد — بطاقة أولى) | `/hub/ai-governance/` | «مركز معرفة حوكمة AI» | توزيع سلطة topical من أقوى صفحة |

## 12. Claims Audit (المنفذ اليوم)

| Claim (قبل) | File/URL | Status | Action |
|---|---|---|---|
| «99.7% نسبة الامتثال في عملاء BrightAI» | index.astro stats | CONTRADICTORY (يناقض pricing «لا ندّعي امتثالاً كاملاً») | استُبدلت بـ«9 حلول حوكمة وتشغيل متكاملة» (قابلة للتحقق) |
| «متوافقة مع PDPL من اليوم الأولى» (FAQ) | index.astro | RISKY | «صُممت لدعم جاهزية الامتثال لـ PDPL...» + مسؤولية الامتثال النهائية على المؤسسة |
| «متوافق PDPL/NCA من اليوم الأول» (جدول) | index.astro | RISKY | «جاهزية امتثال PDPL/NCA من اليوم الأول» |
| صف «الشهادات» ISO 27001/SOC 2 | index.astro | CONTRADICTORY (ai.txt ينفي الشهادات) | aria-label → «معايير نعمل وفق مبادئها» + سطر إيضاح «لسنا جهة اعتماد» |
| «AES-256 · ISO 27001 · SOC 2» chip | index.astro | CONTRADICTORY | → «AES-256 · TLS 1.3 · Zero Trust» (موثقة في /trust/) |
| +١٥ عميل / +٣٦٥ يوم / +١٢K نقطة | index.astro + about | UNVERIFIED | استُبدلت بـ +٩ حلول / +٣٠ وثيقة / ٣ أوضاع نشر / ١٠٠٪ توثيق الطلبات — **إذا عندك أرقام حقيقية رجّعها** |
| «دعم سعودي 24/7» | index.astro (FAQ+جدول) | CONTRADICTORY (24/7 = باقة Enterprise فقط) | «دعم سعودي مؤسسي» |
| «المنصة السعودية الأولى» / «الشريك التقني الأول» / «رائد» | about + solutions.ts | CONTRADICTORY (ai.txt يمنع superlatives) | حُذفت صيغ التفوق |
| «SOC 2 Type II» بطاقة شهادات | about | CONTRADICTORY | «ممارسات الأمان والتدقيق المؤسسية» |
| «نضمن الامتثال التام» / «امتثال كامل» ×4 | trust | RISKY | «ندعم جاهزية الامتثال...» |
| «99.95% وقت التشغيل الفعلي» / «120ms» | trust | CONTRADICTORY/UNVERIFIED | «99.5% الحد الأدنى لـ SLA» (يطابق pricing) + RBAC+ABAC |
| «تخضع لشهادة NCA ECC» | trust | CONTRADICTORY | «مصممة لدعم متطلبات... وفق ضوابط NCA ECC» |
| «شراكاتنا... حلول معتمدة» (SDAIA/NCA/SFDA/ZATCA شركاء) | about §شراكاتنا | RISKY (يوحي باعتماد تنظيمي) | «نعمل وفق ضوابط الجهات... بدون ادعاء شراكة أو اعتماد» |
| «ضمان التوافق» / «التوافق الكامل» / «متوافق مع» (leads) | solutions-content-generated.ts ×7 | RISKY | «دعم جاهزية الامتثال لـ...» |
| «امتثال كامل... اجتازت مراجعة NCA بدون مخالفات» (حالة حكومية) | solutions.ts | **RISKY عالية** (نتيجة تنظيمية مفبركة) | سيناريو توضيحي معلن + نتيجة واقعية |
| «متوافق مع نظام/ضوابط/متطلبات/إرشادات» | landing-pages.ts ×6 | RISKY | «دعم جاهزية الامتثال لـ...» |
| tooltips «امتثال لـ...» | TrustBadges ×4 | RISKY | «دعم جاهزية الامتثال لـ...» |
| نص مكسور «بيانات الشركةمن... BRIGHT AI» + «بلا مخاطر» | SplitHero | BUG/RISKY | أُصلح النص + «ذكاء اصطناعي آمن» |
| typos «مؤسستكتحتاج» ×2 + «الحوكمة الحقيقيةلا» ×2 | solutions-content-generated | BUG | أُصلحت المسافات |
| «امتثال كامل لمتطلبات SAMA/PDPL/NCA» (نتائج قصصية) | landing-pages ×3 | RISKY | «جاهزية امتثال موثّقة» |

**متبقٍ بلا إصلاح (P2 — قرار مستخدم):** DPA «شهادة آيزو 27001» (legal-content-inline.ts:612) — مستند تعاقدي · «استضافة سيادية داخل المملكة» بلا دليل بنية تحتية بالريبو · descriptions حلول audit-trail/human-approval/policy-mapping «توافق/متوافقة» · فريق عن personales بلا صفحات مؤلفين تدعمها · `/customers/` meta «جهات حكومية» بلا حالة حكومية فعلية.

## 13. Entity SEO

- Organization + LocalBusiness (Riyadh, روّيب الفيحاء) + founder يزيد البديوي موحّدة عبر Schema.astro — متسقة.
- ai.txt/llms.txt/llms-full.txt تتطابق مع الوضع الجديد بعد الإصلاحات (كانت تناقض الصفحات قبلها).
- فجوة: نفس العنوان «Saudi AI Safety OS» مستخدم باستمرار ✅؛ يُنصح بترسيخ sameAs بحسابات فعلية عند توفرها.

## 14. E-E-A-T Plan

موجود: مؤسس مسمّى + تواريخ تحديث بالمحور + مصادر رسمية + إخلاء «ليست استشارة قانونية» متكرر + صفحة trust/about/pricing.
ناقص (P2/P3): صفحات مؤلفين حقيقية تدعم أسماء الفريق · methodology page للتقارير · سياسة مصادر معلنة · مراجع مراجَعة من طرف ثالث.

## 15. GEO/AEO Plan

✅ قوي فعلًا: direct answers في أول 40-60 كلمة (hub + solutions + answer) · FAQ مرئية مطابقة للـ schema · تعريف قابل للاقتباس بالرئيسية (home-citable-definition + speakable) · جداول مقارنة · robots مفتوح لكل زواحف AI.
تحسين P2: خلي السؤال H2 صريحًا في المدونات الكبرى · agentic AI coverage (محركات AI تسأل عنه).

## 16. Crawl/Indexation Status

كل Owner URLs: 200 محلي · index,follow · self-canonical · في sitemap 259 · أقصى عمق 3 · صفر orphans · robots مفتوح بالكامل بقرار المستخدم. الفهرسة الحية غير مثبتة (GSC N/A).

## 17. Schema Alignment

- الرئيسية: Organization+WebSite+WebPage+SoftwareApplication+FAQPage(ظاهرة)+DefinedTermSet ✅
- Solutions: Service+FAQPage (متزامنة — schema:solutions:sync حدّثت 19 ملف اليوم) ✅
- Hub: CollectionPage فقط — مقبول تعليميًا؛ FAQ الظاهرة بلا FAQPage schema (آمن — ما نضيف schema بلا لزوم)
- Known: `pnpm exec astro check` فيه 127 خطأ قديم خارج نطاق الموقع العام (kernel/middleware) — غير حاجز

## 18. Content Consolidation

| URL | القرار |
|---|---|
| `/answer/*` (17) | KEEP مشروط + تحويل القالب lightweight حسب ANSWER-AUDIT-001 (قائم) |
| `/answer/ai-healthcare/` | CHANGE TITLE/H1 (تطابق حرفي مع /lp/healthcare/) — P1 قادم |
| `/docs/sdaia-generative-ai-guidelines/` vs `/answer/sdaia-generative-ai/` | MERGE محتمل بعد GSC |
| hub-content-inline (ai-governance الميت) | DELETE من مصدر البيانات — P2 |
| 26 route-collision warnings قديمة | تحتاج قرار consolidation مصدر الروابط — P2 |

## 19. Pages We Should NOT Create

AI Governance Saudi Arabia/Riyadh/Jeddah/Dammam (تملكها `/`) · Saudi AI Governance Platform (تملكها platform) · صفحات مرادفات/معاجم رقيقة · نسخ city إلا إذا جاءت ببيانات فريدة · أي صفحة agentic قبل ما تنضبط نية ورقم بحث.

## 20. Off-Page Authority Strategy (30→90 يوم)

أصول قابلة للربط (RESEARCH REQUIRED قبل النشر): تقرير جاهزية حوكمة AI السعودية · checklist مؤسسات · PDPL+AI mapping guide · SDAIA-P145 عملي (موجود hub — روّج له) · إطار تصنيف مخاطر سعودي. قنوات: منشات تقنية/أعمال سعودية، بودكاست أمن، مؤتمرات AI السعودية، تعليق خبير. ممنوع: بيانات مختلقة أو سبام أوتوماتيكي.

## 21. Authority Scorecard

المنهجية: 0-100 لكل بُعد بناء على أدلة الريبو فقط (بنية/محتوى/روابط داخلية)، والبُعد الخارجي (backlinks/GSC) = تقدير متحفظ لغياب البيانات.

| Cluster | Current | Target | Main Weakness | Highest-Leverage Action |
|---|---|---|---|---|
| AI Governance | 74 | 90 | تداخل blog/answer قديم | ترسيخ روابط الرئيسية→hub (تم اليوم) + GSC |
| AI Firewall | 72 | 85 | نوعية anchors الواردة | مقالات comparison إضافية تربط بالـ owner |
| AI Risk | 68 | 85 | فصل إدارة/تصنيف غير معلن | H2 توضيحي بالصفحة التجارية |
| Saudi Regulation | 80 | 92 | تكرار answer/docs لسدايا | دمج sdaia-generative بعد GSC |
| Audit/Evidence | 70 | 85 | kernel يشارك العنوان | تغيير title الـ kernel |
| Agentic AI | 0 | 60 | صفر تغطية | قرار إنشاء بعد بحث طلب |
| Banking/Healthcare | 60 | 80 | 12/8 صفحات متنافسة | حل lp-vs-sector بعد GSC |

## 22. 30/60/90 Plan

**30 يوم:** ربط GSC وتصدير 90 يوم · مراجعة الظهور لكل owner · تنفيذ باقي P1 (kernel title، answer/ai-healthcare title، hreflang للـ answer EN/AR) · مراقبة ترتيب الثلاثي الأساسي بعد روابط اليوم · تقرير أسبوعي GSC.
**60 يوم:** تحسين money pages حسب استعلامات GSC الفعلية · حل قرارات lp/sector وanswer/docs المشروطة · أصول قابلة للربط أول واحد · مراجعة canonical المختار من Google مقابل المخصص.
**90 يوم:** digital PR + بحث أصلي (Shadow AI السعودية) · توسيع agentic إذا ثبت الطلب · بناء backlinks استراتيجية للـ hub.

## 23. KPIs

GSC: impressions/clicks/CTR/position للـ owner URLs · استعلامات 4-15 أولوية · Saudi organic clicks · non-brand · cannibalization (عدة URLs لنفس الاستعلام). GA4: Saudi organic users · assessment starts/completions · demo CTA · conversion. تقني: 0 canonical/hreflang/broken/orphan (محقق محليًا) · CWV من CrUX عند توفره. Authority: referring domains · branded search. **كلها N/A حاليًا حتى ربط GSC.**

## 24-27. Files Inspected / Changed / Commands / Validation

**Files Inspected (أهمها):** `01-mind-latest.md` كاملًا · package.json · astro.config.mjs · robots.txt · index.astro · SplitHero.astro · TrustBadges.astro · SEOHead/Schema/schema-helpers · solutions.ts · solutions-content-generated.ts · navigation.ts · landing-pages.ts · hub/[slug].astro + AiGovernancePillar + SdaiaAiRiskManagementGuide · answers.ts · cities.ts · about/trust/pricing/customers/sales-deck/kernel pages · blog/docs content (عبر وكيل فحص شامل) · ai.txt/llms.txt/llms-full.txt · hreflang-pairs.ts · migrated-pages JSONs.

**Files Changed (كلها محلية — المستخدم التزم بها في `bbb9e4fb` مع شغل جلسة موازية):**
`src/pages/index.astro` · `src/components/SplitHero.astro` · `src/components/TrustBadges.astro` · `src/pages/about/index.astro` · `src/pages/trust/index.astro` · `src/data/solutions.ts` · `src/data/solutions-content-generated.ts` · `src/data/landing-pages.ts` · (+ ملفات build المولدة: sitemap ×2، schema-saudi-seo، 19 FAQ artifact).

**Commands Run:** `pnpm build` (+ استكمال sync:dist:flat/schema:sync/purge:css/patch-entry) · `sitemap:generate` (مرتين) · `seo:check` · `seo:schema` · `seo:gate` · `seo:hreflang` · `internal-links:audit` · `redirects:check` · `seo:word-count` · `node --test scripts/ai-firewall-commercial-page.test.mjs` · grep تحقق HTML مبني.

**Validation Results:** build Complete ✅ · seo:check PASS ✅ · seo:schema PASS ✅ (62/263) · seo:gate PASS ✅ (0 errors) · hreflang 260/0 ✅ · internal-links 0/0/3 ✅ · redirects PASS ✅ · word-count 96/96 ✅ · firewall test 2/2 ✅ · HTML مبني يحوي الروابط الجديدة والنصوص المصححة ✅ · LHCI N/A · live production N/A.

## 28. N/A Items

LHCI/CrUX/CWV حقيقية · GSC كامل · live HTTP headers · backlinks · GA4 بعد إصلاح gtag (يحتاج بيانات جديدة).

## 29. Remaining Risks

1. `dist/client` اختفى مؤقتًا أثناء البناء (Desktop filesystem sync محتمل) — سبب فشل sync-dist-flat أول مرة وتوليد sitemap ناقص (121)؛ أُعيد التوليد (259). إذا تكرر: شغّل البناء من مسار خارج Desktop.
2. `/kernel/` title «منصة حوكمة الذكاء الاصطناعي للمنشآت» يظل منافسًا مباشرًا للـ platform.
3. migrated-pages JSONs تتقدم على solutions.ts في الـ titles — تعديل solutions.ts لوحده ما يظهر (فخ تشغيلي).
4. أرقام العملاء المستبدلة: إذا كانت حقيقية عند المالك فقرار إرجاعها له (توثيق مطلوب).
5. DPA (ISO 27001) و«استضافة سيادية» بلا إصلاح — مستندات تعاقدية تحتاج قرار مالك.

## 30. GSC Data Needed

تصدير 90 يوم (country=Saudi Arabia أولًا): query/page/clicks/impressions/CTR/position/device/date + Coverage (crawled-not-indexed) + Google-selected canonical. تركيز: owner URLs الثلاثة · استعلامات 4-15 · impressions عالية/CTR منخفض · استعلام واحد بعدة صفحات.

## 31. Recommended Next Prompt

> «صدر بيانات GSC 90 يوم (query+page+position، فلتر السعودية) وحطها في audit/gsc/، ثم: (1) قارن Google canonical مقابل المخصص لكل owner URL، (2) حل قرارات lp/banking-vs-sector وanswer/ai-healthcare وdocs/answer-sdaيا المعلمة مشروطة، (3) غيّر title صفحة /kernel/ لإزالة «منصة حوكمة»، (4) اقترح خطة محتوى agentic AI مبنية على الطلب الفعلي.»

---
*No commit, push, PR, or production change was performed by the agent. Local changes were reviewed by the user and committed manually (`bbb9e4fb`) during the session.*
