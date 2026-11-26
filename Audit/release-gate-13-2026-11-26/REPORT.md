# بوابة الإطلاق النهائية — تدقيق مستقل (البرومبت 13)

**الدور:** release auditor مستقل. **التاريخ:** 2026-11-26. **المستودع:** BRIGHTAI / AIGAS.
**SHA المثبّت:** `961836f8010bfe6527dac75376ef15b386b1a818` (فرع `main`،working tree نظيف Before audit).
**Baseline R3:** `773fb6bc5e420ee70e811d5509aceefcaec32a8c` — `Audit/BRIGHTAI-R3-SCORECARD-2026-11-25.json`.
**المرشح المُقاس:** نفس SHA الحالي + `npm run build` المحلي (version.json = `961836f8010b`). لا ادعاء أن Render ينشر هذا SHA.

## 1. Method وحدود الادعاء
- نفس مقام الـ78 شرطًا وأوزان النطاقات الـ13 من R3: `S,C=1`， `F,U=0`； التغطية = `S+C+F`. لا تغيير مقام ولا رفع نسبة بإضافة شروط.
- أربعة مستويات منفصلة: **source / local / staging / live**. نتيجة محلية مُبلَّغ عنها لا تُحتسب تشغيلًا حيًا. التاريخ لا يُنقل كدليل حالي: كل شرط له `baseline_status` منفصل عن `remeasured`.
- اختبارات أُعيد تشغيلها على المرشح كما هي، دون تخفيف assertions. حيث احتاج الاختبار بنية تحتية محلية (PG18، Chrome، origin)، وُفرت البنية فقط ولم يُعدَّل الاختبار أو منطق التطبيق.
- ميزانية Groq **لم تُمنح**； لذلك `ORC-05` و`AI-06` `NOT_VERIFIED` وليسا PASS. لا تغيير GitHub أو Render أو Neon أو MagicPath أو DNS.

## 2. سجل MCP (الخوادم المكتشفة فعليًا)
| الخادم | الحالة | ما استُخدم | النتيجة |
|---|---|---|---|
| Neon | CONNECTED_READ_VERIFIED | `list_projects`, `list_branches`, `run_sql` (SELECT فقط) | قراءة staging/production: E11 |
| playwright | CONNECTED_READ_VERIFIED | سكربتات E2E محلية | E05,E06,E07 |
| sentry | CONNECTED_READ_VERIFIED | `find_organizations`, `search_issues`, `find_releases` | منظمة بلا issues وبدون releases: E15 |
| posthog | CONNECTED_READ_VERIFIED | `project-get` | مشروع 768444، `ingested_event=false`: E16 |
| graphify | AVAILABLE_NOT_USED | `graph_stats` | `graph.json` غير موجود؛ خريطة الحواف غير متحققة: E17 |
| magicpath | BLOCKED_BY_COST_OR_SCOPE | `get_api_quota`, `get_project` | حصة 50/50 مستنفدة؛ المرجع البصري BLOCKED: E13 |
| render | AUTH_REQUIRED | `get_selected_workspace`, `list_workspaces` | لا workspace مختار / unauthorized؛ SHA المنشور غير متحقق: E14 |
| computer-use | AVAILABLE_NOT_USED | — | لم يُحت después من أدلة Playwright |
| chrome-devtools / windsor / openseo / linear | UNAVAILABLE | — | غير موجودة في كتالوج الأدوات بهذه الجلسة |

التفاصيل الكاملة: `MCP-EXECUTION-REGISTER.json`. الاتصال ليس PASS.

## 3. إعادة تشغيل الاختبارات على المرشح
| الأمر / الاختبار | النتيجة | الدليل |
|---|---|---|
| `npm run build` | **PASS** — 67 صفحة، version.json يطابق SHA | E01 / `logs/db-tests.log` ليس؛ `logs/` |
| `npm run test:seo` | **PASS 16/16** | E02 |
| `npm run test:healthz` | **PASS 15/15 + 1 SKIP** (حالة 200 تحتاج DSN/disposable) | E03 |
| `npm run test:accessibility:smoke` (CI smoke محليًا) | **PASS**، صفر failures | E08 |
| `node --test tests/api-contract.test.mjs` | **PASS 177/177** | E20 |
| `tests/auth-browser.e2e.mjs` على PG18 نظيف | **PASS** (تسجيل/دعوة/جلسة/تنشيط/انتهاء) | E05 |
| `tests/governance-demo-browser.e2e.mjs` | **PASS** (4 منتجات + تكامل + عزل + تصدير + 320/768/1440 + axe صفر) | E06 |
| `tests/design-system-browser.e2e.mjs` | **PASS 27/27** بعد تشغيل خادم محلي بـ`AIGAS_APP_ENABLED=true` | E07 |
| 14 ملف DB على PG18.6 محلي | **16 PASS / 2 FAIL**؛ الفشل: `exploration-db` (فتاة 0045 غير مثبتة في fixture) و`secure-chat-security` (403 ثم INVALID_BODY) | E04 / `logs/db-tests.log` |
| 18 ملف وحدة مركّزة | **98 PASS / 1 FAIL / 1 SKIP**؛ الفشل `governance-packs` لغياب `Audit/governance-packs-2026-11-25/run.mjs` | E10 |
| `tests/conversion-recovery.e2e.mjs` | **FAIL** — رابط CTA مفقود من شجرة الوصول في `/demo/governance/` عند 320/375/768 | E09 |
| `tests/secure-chat-browser.e2e.mjs` | **FAIL** — تحقّق CSP يتوقع تجاور `script-src 'self'; connect-src 'self'` بينما السياسة تتضمن توجيهات إضافية | E04 / `logs/e2e-secure-chat-retry.log` |
| 4 من R3 (firewall/risk/HG/ledger) | PASS في E06، لكن **لا يُحتسب إثبات تشغيل Secure Chat** | E06,E04 |

السجلات الخام في `Audit/release-gate-13-2026-11-26/logs/`.

## 4. المسارات الحالية (source/local/live منفصلة)
- **Source:** 107 ملف route تحت `src/pages/`، منها 40 API تحت `src/pages/app/api/`； البناء ينتج 67 صفحة عامة.
- **Local:** `/healthz/` 200 و``/readyz/` 200/503؛ `/app/kernel/` 200 فقط عند `AIGAS_APP_ENABLED=true`.
- **Live:** `https://brightai.live/` 200، `/request-access/` 200، `www` 301، `/sitemap-index.xml` 200؛ لكن `/healthz/`، `/readyz/`، `/app/`، `/app/kernel/`، `/api/trial-availability/` = **404**. لا دليل أن المنشور هو SHA المثبّت (E12,E14).

## 5. Schema/constraints parity وruntime role (Neon READ ONLY)
| البند | staging `br-rough-wind-bdkmg13n` | production `br-young-bird-b43proeb` |
|---|---|---|
| جداول `aigas%` | 43 | 31 |
| RLS مفعّل | 43/43 | 31/31 (عَلَم فقط) |
| سياسات | 93 | **2** |
| دور `aigas_runtime` | موجود بلا superuser/bypassrls | **غير موجود** |
| منح جداول للدور | 92 | **0** |
| سياسات مرتبطة بالدور | 48 | **0** |
| قيود `aigas_ld_events` | 15 (تشمل previous_hash/integrity_hash/synthetic_reference) | 14 (ينقص `aigas_ld_synthetic_reference_required`) |
| `chain_guard` | 1 | **0** |
| جداول `aigas_hg_delegations/grants` | موجودة | **غائبة** |
| ترحيلات 0045/0046 | غائبتان | غائبتان |

النتيجة: **لا تكافؤ**. لا يجوز نقل PASS من staging إلى live، ولا من source إلى production.

## 6. نافذة 48 ساعة والخصوصية التحليلية
- **48h:** المصدر يضبط `expires_at=now()+interval '48 hours'` عند التنشيط (`trial-service.mjs:292`) وللاستكشاف (`operator-exploration.mjs:42\)； الاختبارات المحلية أثبتت التنشيط/الانتهاء. **حيًا** `/api/trial-availability/` 404 وجداول التجربة غائبة في production → `48H: NO-GO`.
- **Analytics privacy:** GA4 مقصور على `brightai.live/www` في `GoogleAnalytics.astro` (لا وسم في local/staging)； PostHog وSentry خلف بوابات `approvalReference` + `environment` + `ENABLED` في `observability/config.mjs`. مشروع PostHog 768444 أنشئ 2026-11-25 و`ingested_event=false`؛ Sentry بلا issues/releases. Windsor/GSC غير متاحين → **التحقق الميداني من GA4 وتدفق البيانات NOT VERIFIED**.

## 7. Hero قبل/بعد
| القياس (CSS px) | baseline 2026-11-18 (SHA 44191520) | حالي 961836f8 |
|---|---:|---:|
| صندوق الهيرو 1440 | 1200 × 802.98 | 1200 × 802.95 |
| صندوق النص 1440 | 580 × 572.98 | 580 × 572.95 |
| العنوان 1440 | 100 / 116 | 100 / 116 |
| الزر الثاني 1440 | «اطلب معلومات أو عرض سعر» 170.05 × 44 | «ناقش احتياجك ←» **102.02 × 44** |
| صندوق الهيرو 390 | 350 × 981.96 | 350 × 925.94 |
| الزر الثاني 390 | 170.05 × 44 | 102.02 × 44 |

الصور الحالية: `hero-current-1440.png` و`hero-current-390.png`. صور baseline المشار إليها في `Audit/outhers/hero-baseline-2026-11-18/REPORT.md` **غير موجودة** على القرص → المقارنة البكسلية `BLOCKED`، والمقارنة العددية أعلاه فقط. تغيير نص زر الهيرو يحتاج إذن مالك صريح حسب عقد التصميم الملزم؛ لم يُعثر على إذن في الأدوات → يُسجَّل كفجوة.

## 8.Scorecard 78 — baseline مقابل إعادة القياس
| المستوى | Score | Coverage | S | C | F | U |
|---|---:|---:|---:|---:|---:|---:|
| Baseline R3 (SHA 773fb6b) | 44.67% | 73.17% | 24 | 9 | 24 | 21 |
| **Source** (SHA 961836f8) | **36.50%** | 52.83% | 26 | 0 | 11 | 41 |
| **Local** (SHA 961836f8) | **54.00%** | 63.17% | 37 | 2 | 7 | 32 |
| **Staging** (Neon READ ONLY) | **10.00%** | 10.00% | 5 | 2 | 0 | 71 |
| **Live** (HTTPS + Neon prod) | **2.50%** | 11.83% | 0 | 3 | 8 | 67 |

المصفوفة الكاملة التي تربط كل شرط بالدليل والقيود: `SCORECARD-78-MEASURED.json`. انخفاض الدرجات يعود لرفض نقل الأدلة التاريخية/المحلية إلى المستويات الأعلى، لا لتغيير المقام.

## 9. قبول المرحلة 09 (20 شرطًا) — إعادة قياس مستقلة
| المحور | source | local | staging | live |
|---|---:|---:|---:|---:|
| BE (5) | 4/5 = 80% | 5/5 = 100% | 1/5 = 20% | 0/5 = 0% |
| API (5) | 5/5 = 100% | 5/5 = 100% | 0/5 = 0% | 0/5 = 0% |
| ORC (5) | 4/5 = 80% | 2/5 = 40% | 0/5 = 0% | 0/5 = 0% |
| E2E (5) | 5/5 = 100% | 3/5 = 60% | 0/5 = 0% | 0/5 = 0% |

`ORC-05` `NOT_VERIFIED` (بلا إذن Groq)، `ORC-02/03` غير مكتملين حتى النهاية المصرّح بها، `E2E-04` FAIL محليًا. **المرحلة 09 غير مقبولة.** الملف: `BACKEND-ACCEPTANCE-20-MEASURED.json`. كل حافة وAPI contract وruntime trace مرتبط الآن بـ`evidence_ref` وSHA وبيئة وحدود في نفس الملف.

## 10. قبول MagicPath المستقل (11 شاشة/قسم + modal)
| المستوى | النسبة | الحالة |
|---|---:|---|
| وظيفي public synthetic | 7/12 = 58.3% | PARTIAL |
| وظيفي enterprise مصادَق | 0/12 = 0% | NOT_VERIFIED |
| تكافؤ بصري public | 0/12 = 0% | BLOCKED (لا صورة مرجع) |
| تكافؤ بصري enterprise | 0/12 = 0% | BLOCKED |

الشاشات: Overview، Kernel، Firewall، Risk Engine، Human Gate، Ledger، **Secure Chat**، Registry، Policy Packs، Developer Workbench، Trust Center + modal طلب التجربة. **Secure Chat سجلت `FAILED` محليًا** (E04) وليس `NOT_VERIFIED` فقط؛ نجاح 4/4 من R3 لا يثبت تشغيلها. روابط مستقلة products incl. `/products/secure-chat/` و`/demo/secure-chat/` و`/app/api/secure-chat/models|messages` موثقة في `DESIGN-ACCEPTANCE-13.json`. اللقطات: مرشح فقط (P10 + `hero-current-*.png`)؛ مرجع MagicPath `BLOCKED` بسبب الحصة 50/50. **التصميم غير مقبول في أي مستوى.**

## 11. الاكتشافات P0 / P1 / P2
**P0 (مانعة للإطلاق):**
1. بوابات live غير منشورة: `/healthz/`, `/readyz/`, `/app/`, `/app/kernel/`, `/api/trial-availability/` = 404 (E12).
2. production schema/RLS/duty parity فاشل: لا `aigas_runtime`، 2/31 سياسات، 31 مقابل 43 جدولًا، غياب 0045/0046 وchain_guard وقيود Ledger (E11).
3. Groq/AI حي `NOT_VERIFIED`: لا إذن ميزانية، قائمتا المزود/النموذج فارغتان (E19)؛ `ORC-05` لم يُغلق.
4. Secure Chat: فشل تأكيد E2E محليًا (403 ثم INVALID_BODY) وفشل تأكيد CSP (E04).
5. Render: SHA/build logs غير متحققة (E14)؛ لا يمكن الربط بين المرشح والمنشور.
6. MagicPath مرجع `BLOCKED`； تكافؤ بصري صفر (E13).

**P1:**
7. CTA «طلب تجربة مؤسسية» مخفي عن شجرة الوصول في `/demo/governance/` عند ≤768px (E09).
8. فشل `governance-packs` لغياب fixture، وانحراف `exploration-db` عن ترحيل 0045 (E04,E10).
9. تغيير نص زر الهيرو مقابل baseline دون إذن موثق (E18).

**P2:**
10. npm 10.9.9 مقابل engine 10.9.7؛ ملف `GoogleAnalytics 2.astro` متبقٍ؛ `graphify-out/graph.json` غائب؛ PostHog بلا أحداث وSentry بلا releases؛ حالة healthz واحدة SKIP.

## 12. القرارات المستقلة المنفصلة
| البوابة | القرار | السبب المختصر |
|---|---|---|
| **PUBLIC SYNTHETIC** | **NO-GO** | 7/12 وظيفي، Secure Chat FAIL، CTA مخفي على الجوال، تكافؤ بصري صفر |
| **PUBLIC LIVE AI** | **NO-GO** | لا إذن ميزانية Groq، قوائم اعتماد فارغة، `ORC-05 NOT_VERIFIED` |
| **48H** | **NO-GO live** | المنطق المحلي 48h مثبت، لكن نقاط live 404 وجداول production غائبة |
| **COMMERCIAL** | **NO-GO** | كل ما سبق + غياب دور التشغيل والسياسات في production |

معيار 80% لكل محور **ليس بديلًا عن صفر P0**: حتى لو بلغ محور 80% (`BE_source`, `API_local`) تبقى البوابة مغلقة بسبب P0-1..6.

**الحالة النهائية: NO-GO — ليس `LIVE_VERIFIED`، وليس `READY_TO_REQUEST_DEPLOY_APPROVAL` بعد.**

## 13. ما يحتاج إذنًا قبل أي نشر
1. إذن مستقل بميزانية Groq واستدعاء حي محدد (`qwen/qwen3.8-27b`)+caps； حتى ذلك الحين يبقى `ORC-05` = `NOT_VERIFIED`.
2. اختيار Render workspace ومنح صلاحية READ على الخدمة/D deploys/logs (لا أختار workspace بنفسي).
3. MagicPath: تجديد حصة الـAPI أو تزويد صورة المرجع والكود للrevision المثبت `476467892385353728`； لا أستبدل المرجع.
4. إذن صريح بتغيير نص زر الهيرو، أو إذن بإعادته إلى نص baseline.
5. إذن بتعديل الأكواد/الفيكسات المكتشفة (CTA، fixtures، CSP assertion) وإعادة الاختبار.
6. موافقة نشر منفصلة بعد إغلاق الأدلة؛ لا commit/push/deploy/DNS/Neon write دونها.

## 14. الرجوع (ROLLBACK)
خطة الرجوع الكاملة في `ROLLBACK.md`. الخلاصة: **لم أنفّذ أي نشر أو ترحيل أو تغيير GitHub**； ما أُنتج محليًا هو تقارير/logs/l(dist) وصور، وخادم PG18 مؤقت + خادم Node محلي أُوقفا بعد القياس. الرجوع = حذف مجلد evidence فقط إن رُفض، واستعادة أي deploy سابق عبر Render بواسطة المالك، وعدم لمس DNS.

## 15. الملفات المسلّمة
- `REPORT.md` — هذا التقرير.
- `SCORECARD-78-MEASURED.json` — مصفوفة 78 مع baseline/after وتغطية الأدلة.
- `BACKEND-ACCEPTANCE-20-MEASURED.json` — قبول 09 المستقل.
- `DESIGN-ACCEPTANCE-13.json` — قبول التصميم المستقل (12 عنصرًا).
- `MCP-EXECUTION-REGISTER.json` + `generate-evidence.mjs` — السجل ومولّد الأدلة.
- `ROLLBACK.md`، `logs/`، `hero-current-*.png`.
