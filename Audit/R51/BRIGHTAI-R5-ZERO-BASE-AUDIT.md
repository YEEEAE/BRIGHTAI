# BRIGHT AI / AIGAS — R5.1 | التدقيق التشغيلي الموحّد بعد التحقق المعزول

**26 نوفمبر 2026 · SHA `5387cdf6282cc3775f73ade30c82f199967d9409` · المرشح المعزول READY · الإنتاج التجاري NO-GO**

هذه مقدمة الحالة الأحدث وهي المرجع الحاكم لجميع التعارضات مع اللقطات التاريخية المحفوظة أدناه. لا يُعاد احتساب نسب الإنتاج من نجاح بيئة معزولة. طلب المالك: اختبار اصطناعي فقط، Groq بميزانية صفر دولار، GitHub قراءة فقط، لا تعديل للإنتاج أو الدومين. تم التنفيذ ضمن هذا النطاق؛ الإصلاحات المصدرية في البرومبتات فقط.

## 1 | الملخص التنفيذي

| النطاق | حالة مثبتة | حدود النتيجة |
|---|---|---|
| Node candidate | **LIVE / healthz=200 / readyz=200** | deploy متطابق؛ portal DISABLED؛ الإنتاج static |
| Neon PostgreSQL 18 | **42/42 fresh migrations** | مشروع جديد من الصفر؛ 47 جدولًا، 98 سياسة، كل الجداول لديها RLS وسياسات |
| RLS isolation | **8/8 scoped cases passed** | اختبارات قاعدة البيانات بعينتين، ليست HTTP/JWT أو جميع الجداول |
| Neon Auth | **READY + active JWKS probe** | حسابان اصطناعيان؛ لم يتم sign-in حقيقي أو تحقق بريد |
| 48h DB trial | **PASS scoped** | 48h/idempotency/expiry بالأزمنة الاصطناعية؛ لا E2E حقيقي |
| Browser Use | **MIXED** | 7 صفحات، رحلة خماسية ناجحة؛ عيبان قابلان للتكرار |
| Redirects | **159/159 candidate؛ 0/159 production** | 327 URL مكتشفًا: 75 HTTP200 و252 HTTP404؛ ليست كلها أخطاء |
| Groq live AI | **BLOCKED / 0 calls / $0 audit spend** | لا callable tool ولا ضمان مجانية الطلب ولا نموذج معتمد |
| Multi-agent | **FAIL/NOT_VERIFIED** | لم يتغير المصدر؛ يلزم تنفيذ الوكلاء والأدوات والأمان |
| Production | **NO-GO** | لا تغيير في المصدر أو DNS أو بيانات الإنتاج |

## 2 | قاعدة Neon المعزولة

[المشروع الجديد](https://console.neon.tech/app/projects/raspy-surf-09603889) `raspy-surf-09603889`، branch `br-noisy-frog-bdwi4d6d`، PostgreSQL 18، AWS Ohio. بدأ public schema بصفر جدول، مع Neon Auth Better Auth. رفضت المنصة تغيير suspend interval في الخطة الحالية، فأُنشئ المشروع بالإعدادات الافتراضية؛ لا استنتاج لتكلفة موارد Neon من هذا الدليل. لم تُنسخ أي بيانات من Production أو Staging.

طبقنا ترتيب fresh المعتمد في `scripts/migration-order.mjs`: 42 من أصل 46 ملفًا. استبعدت 0011 و0012 و0013 و0019 لأنها upgrade-only/superseded. تمت تجزئة SQL باستخدام محلل يحترم dollar quotes والتعليقات، بعد رفض connector multiple commands in prepared statement (42601)، مع معاملة مستقلة لكل ملف وإيصال SHA-256 في ledger في نفس المعاملة. كل الـ42 حالة APPLIED؛ كل البصمات 64 خانة. `NEON-MIGRATION-RECEIPTS-42.csv` نقلٌ لسجل قاعدة البيانات، لا ملف raw export. مدة الترحيل `duration_ms=0` placeholder غير مقاسة. لم تُنشأ client-role stubs الاختيارية؛ owner `audit_owner` غير الافتراضي، لذلك فروع 0018 الخاصة بـneondb_owner/stubs تحتاج rehearsal منفصل. لا يُعاد تنفيذ الترحيلات في البيئة نفسها بلا مطابقة السجل.

| الكتالوج | Production (سابق) | Staging (سابق) | Audit isolated (فعلي) |
|---|---:|---:|---:|
| public tables | 31 | 43 | 47 |
| RLS enabled | 31 | 43 | 47 |
| tables with policies | 2 | 43 | 47 |
| policies | 2 | 93 | 98 |
| FORCE RLS | 0 | 2 | 2 |
| start/read trial(uuid) | ناقصة | ناقصة | موجودة ومختبرة |

### اكتشاف صلاحية PostgreSQL 18 وإصلاحها في المرشح

الدور `audit_owner` عضو بـadmin option في `aigas_runtime` لكن `set_option=false`؛ تنفيذ SET LOCAL ROLE أعاد 42501. نُفّذ GRANT مع SET TRUE في المشروع المعزول فنجح. أنشأنا `r51_app_login` كدور تسجيل دخول محدود، read-only ضمن schema فارغة مخصصة، ثم GRANT aigas_runtime WITH INHERIT FALSE, SET TRUE. النتيجة: superuser=false، bypassrls=false، لا صلاحيات مباشرة SELECT أو write على جداول public (0)، can SET=true، inherited=false. الـeffective runtime `aigas_runtime` لا يتجاوز RLS. تم ربط هذا الحساب لا حساب المالك بـRender، عبر تمرير سر الاتصال مباشرة بين الأدوات دون طباعته أو حفظه في التقارير. لا تعديل للأدوار الإنتاجية. دليل E54–E56.

### 8 حالات عزل

| الحالة | الملاحظة |
|---|---|
| A own | 5 منتجات A، صفر B، عضوية A فقط |
| A forged B | صفر منتجات A/B، لا عضوية B |
| B own | 5 منتجات B، صفر A، عضوية B فقط |
| B forged A | صفر منتجات A/B، لا عضوية A |
| no actor/tenant | صفر صفوف في العينة |
| cross-tenant UPDATE | صفر صفوف محدثة |
| forged membership INSERT | 42501 RLS violation |
| ledger UPDATE | 42501 permission denied |

هذي عينات ضمن effective aigas_runtime عبر SQL؛ ليست إثباتًا شاملاً لكل الجداول/الأدوار/المسارات أو JWT. حسابان ومؤسستان اصطناعيان تم إنشاؤهما، ثم مؤسستا تجربة منفصلتان للـtrial fixtures.

## 3 | جاهزية Render الفعلية

[الخادم المعزول](https://brightai-r51-audit.onrender.com) · [readyz JSON](https://brightai-r51-audit.onrender.com/readyz/) · [Render dashboard](https://dashboard.render.com/web/srv-dc400fk9v7es73df3cc0).

- `service=srv-dc400fk9v7es73df3cc0`, `deploy=dep-dc40a2t6e07s73dpro4g`, live at 2026-11-26T10:09:10.248048Z، exact commit أعلاه.
- `readyz` بعد الربط: HTTP200، schema=1، status/state=ready، database=READY، auth=READY، authProbe=ACTIVE، portal=DISABLED، release.consistent=true، checkedAt 10:09:21.058 UTC.
- `healthz` HTTP200 pinned SHA؛ `/api/trial-availability/` HTTP200 available=false؛ `/app/` HTTP503 APP_UNAVAILABLE (إقفال متعمد).
- أسماء env المستخدمة فقط: DATABASE_URL، NEON_AUTH_BASE_URL، NEON_AUTH_JWKS_URL، AIGAS_REQUIRE_RLS=true، AIGAS_DB_RUNTIME_ROLE=aigas_runtime، AIGAS_HEALTH_AUTH_PROBE=true، AIGAS_APP_ENABLED=false. لم يضبط Groq. المنصة المجانية/Ohio للبيانات الاصطناعية فقط، لا تصريح لاستضافة بيانات العملاء أو SLA؛ لم يثبت إعداد HTTP health-check path في Render.

## 4 | دورة التجربة 48 ساعة — SQL فعلي، لا ادعاء Auth E2E

1. حساب Neon Auth اصطناعي غير موثق: `aigas_start_self_service_trial(NULL)` يرفض بـ`IDENTITY_NOT_VERIFIED`، SQLSTATE 42501.
2. حُدد `emailVerified=true` مباشرة فقط لحساب اصطناعي داخل القاعدة المعزولة لاختبار الدالة (fixture، ليس تحقق بريد فعلي). بدء التجربة ACTIVE، فرق الوقت بين started/expires 48.000000 ساعة؛ تكرار البدء أعاد نفس المعرّف.
3. التحقق من `aigas_self_service_dependencies()` أعاد ready=true لكل الستة: Kernel والخمسة منتجات.
4. حساب اصطناعي ثانٍ وُثق كـfixture، ثم تم تحريك started_at/expiry إلى -49h/-1h. Access state=EXPLORATION_EXPIRED، قراءتان متتاليتان EXPIRED، عدد حدث انتهاء التجربة=1.

لا تسجيل دخول حقيقي أو تحقق JWT أو مرور 48 ساعة فعلية. لا إثبات لحدود الحصص والإلغاء والـenterprise workflow الحقيقي. Portal يبقى مغلقًا. الحالتان الاصطناعيتان محفوظتان للمراجعة؛ لا بيانات مستخدمين حقيقية. دليل E59.

## 5 | Browser Use: نتيجة وظيفية مباشرة

Run `48cfda62-8d12-4ebc-8606-fcaaaaa1983f` completed. [Governance](https://brightai-r51-audit.onrender.com/demo/governance/)، [Secure Chat](https://brightai-r51-audit.onrender.com/demo/secure-chat/)، وصفحات الشكاوى [Firewall](https://brightai-r51-audit.onrender.com/products/firewall/complaint/)، [Secure Chat](https://brightai-r51-audit.onrender.com/products/secure-chat/complaint/)، [Risk](https://brightai-r51-audit.onrender.com/products/risk-engine/complaint/)، [Human Gate](https://brightai-r51-audit.onrender.com/products/human-gate/complaint/)، [Ledger](https://brightai-r51-audit.onrender.com/products/ledger/complaint/).

| الملاحظة | الحكم |
|---|---|
| Firewall allowed/blocked، Risk 3×2=6 ورفض blank input | PASS local |
| Human Gate approve/reject، registry asset add وpolicy version advance | PASS local |
| Ledger record/verify، unsigned consistency only | PASS local |
| Secure Chat general/redaction/block/reset | PASS local |
| Complaint chain: redaction → fixed draft → high risk → supervisor return → 5 linked events | PASS local |
| Desktop 1920 و390px، 7 صفحات، لا تجاوز أفقي أو console/runtime errors مرصودة | PASS sample |
| Governance reset hides details but counters stay 2/2 until new session | FAIL؛ P12 |
| Ledger empty-state message remains alongside recorded evidence | FAIL؛ P09/P12 |
| Modal open/close: GET availability only؛ لا submit | PASS scoped، availability ليست مثبتة |
| MagicPath same-state parity، كل 12 screen/modal، full WCAG، real auth وlive AI | NOT_VERIFIED/BLOCKED |

المحاكاة تعمل في المتصفح؛ لا يصح اعتمادها كأداء وكلاء AI أو سجل تشفيري موقّع. مرجع MagicPath الأصلي غير متاح، النسخة المحددة لا تثبت تطابق الأصل. لا تعديل للواجهة في المصدر.

## 6 | الروابط والتسويق وGroq

159 تحويلًا في المصدر اختُبرت على مضيفين (318 طلب GET)، 159/159 exact 301+Location في candidate مقابل صفر في production. إعادة فحص 327 رابطًا مكتشفًا من Firecrawl: 75 HTTP200، 252 HTTP404؛ بعض الـ404 قد يكون مقصودًا لتقاعد المحتوى. لم تثبت صحة كل canonical أو indexation أو قيمة backlinks؛ لا redirect عشوائي إلى الصفحة الرئيسية. لا تغيير على بيانات GA4/GSC السابقة. نتيجة E60.

Groq Cloud Connector v1.0.0 موجود لكنه لم يصدّر دوال قابلة للاستدعاء للجلسة. لم تُجرَ أي inference أو model call، ولا يثبت هذا فشل المزود نفسه. **تكلفة Groq الناتجة من هذه الجولة صفر دولار**؛ لا ضمان بأن أي طلب لاحق مجاني؛ لا إعادة استخدام مفتاح مكشوف ولا إخراج سر. في المصدر سجل النماذج فارغ والـGateway text-only وعقد agent tools غير مكتمل. P03–P10 تعالج التنفيذ، وإثبات live provider يبقى مشروطًا بمسار مجاني مثبت أو تفويض ميزانية جديد. لا مفتاح Groq في المرشح. E61.

## 7 | سجل الموانع المحدث وقرار الإطلاق

| ID | الحالة | الدليل/الإجراء المتبقي |
|---|---|---|
| F01 | PARTIAL_ISOLATED_VERIFIED | 47 tables/98 RLS policies; 8 scoped isolation tests; dedicated login؛ E54 E55 E56؛ Production/Staging untouched; full 47-table/HTTP auth/backup/security acceptance pending. |
| F02 | PARTIAL_ISOLATED_READY | Node candidate readyz=200, auth active; production static؛ E48 E57؛ Canonical-domain cutover not authorized; verify platform health-check, SLA, rollback. |
| F03 | OPEN | Groq approved registry empty on pinned source; no live provider call؛ E61؛ Approve provider/model, source changes, prove free quota/connector or obtain budget. |
| F04 | OPEN | Prior failed CI evidence unchanged؛ E43؛ Source/CI fixes and successful same-SHA checks. |
| F05 | OPEN | Isolated Ohio environment synthetic only; no production residency approval؛ E54 E57؛ Explicit residency decision, branch protections, restore exercise. |
| F06 | PARTIAL | Browser synthetic actions and responsive checks; two defects; MagicPath same-state parity not verified؛ E51 E58؛ Fix UI defects, same-state reference screenshots and full accessibility checks. |
| F07 | OPEN | 327 discovered URLs tested: 75 200; 252 404؛ E60؛ Classify retired pages, GSC sitemap error, canonicals and link value. |
| F08 | PARTIAL_DB_TRIAL_AND_LOCAL_UI | Synthetic local flow works; DB trial 48h and expiry pass; portal closed؛ E58 E59 E57؛ Real login/JWT and protected E2E, quotas/cancel/enterprise activation, inquiry availability. |
| F09 | PARTIAL_ISOLATED_VERIFIED | Required start/read(uuid) functions present, exercised in isolated branch؛ E54 E59؛ Reconcile production and prior staging migrations with approvals. |
| F10 | OPEN_SOURCE_CHANGE | No agent implementation or live tool loop؛ E61 E62؛ P03–P10 implement deterministic governed agent runtime; independent proof. |
| F11 | OPEN_SOURCE_CHANGE | No Groq key on candidate; conflicting source secret names retained؛ E61؛ Canonical protected name, safe migration; no exposed key reuse. |
| F12 | OPEN | RLS sample verified; agent memory/coordination/budget not implemented or tested؛ E56 E61 E62؛ Durable scoped agent run/tool/FinOps/recovery evidence. |
| F13 | PARTIAL_ISOLATED_VERIFIED | 159/159 redirects in candidate; 0/159 in production; status route candidate 200؛ E50 E57 E60؛ Safe canonical deployment and validate all targets and indexation. |
| F14 | OPEN | Prior disabled ruleset and failed CI unchanged؛ E43؛ Enforce release protection with approval; pass current candidate CI. |
| F15 | PARTIAL | Local reject path works in complaint chain; Developer Workbench still unavailable on prior live; enum gap unmodified؛ E51 E58 E62؛ Source contract parity; real reject/binding and workbench route; no fabricated endpoints. |
| F16 | PARTIAL | All 327 discovered URLs GET checked; 7 browser pages exercised; authenticated/visual completeness not verified؛ E58 E60؛ Full auth/role-based HTTP tests, full MagicPath parity, comprehensive crawl/indexation scope. |

**بوابات الإصدار:** Node infrastructure candidate = PASS scoped؛ Local synthetic = MIXED (عيبان)؛ Authenticated enterprise trial = NOT_VERIFIED؛ Public Live AI = NO-GO؛ Commercial production = NO-GO؛ Deploy authorization = منفصل. لا توجد نسبة جاهزية نهائية: مصفوفة الـ83 معيارًا السابقة مقام جزئي غير شامل، والنتائج الحالية طبقة تشغيلية مستقلة. لا استنتاج بأن جميع P0 أغلقت في الإنتاج. يبقى المعيار النهائي ≥80% لكل محور ومنتج، 100% للضوابط الحرجة، صفر P0 مؤثر، وآثار اختبار حقيقية في البيئة الهدف.

**ما تغير فعليًا:** إنشاء مشروع Neon معزول وAuth ودور اتصال واختبارات synthetic وتغيير env لخدمة Render المعزولة فقط. تم حفظ DB fixtures. لم يُكتب أو يُدفع أي ملف GitHub، ولا تعديل Production/Staging أو DNS أو MagicPath. لا تنفيذ إصلاحات الكود أو فتح البوابة العامة. لم تُختبر الاستعادة وSSO/MFA أو كل عقود HTTP. لا يدعي التقرير انتهاء R5.1 كله.

## 8 | الملفات والأدلة

- `LATEST-OPERATIONAL-EVIDENCE-E54-E62.json` — سجل أحدث الأدلة، نقل من نتائج الأدوات لا captures خام.
- `NEON-MIGRATION-RECEIPTS-42.csv` — بصمات سجل الترحيل.
- `R51-ISOLATED-TEST-RESULTS.csv` — الحالات والحدود حسب طبقة التنفيذ.
- `OPERATIONAL-BLOCKER-OVERLAY.csv` — أحدث موقف من جميع F01–F16؛ الأصل المجمد محفوظ.
- `BRIGHTAI-R5-FINAL-LAUNCH-EXECUTION-PROMPTS.md` — 15 برومبت فقط، أحدث حالة، تظل إصلاحات المصدر لوكيل التنفيذ المفوض.

---

# اللقطات التاريخية المحفوظة (ليست الحالة الحالية)

**تنبيه:** كل عبارات «readiness 503»، «لا DB أو Auth»، «الأفعال لم تُنفّذ» و«الزحف لم يكتمل» في الجزء التاريخي أدناه تصف أزمنة سابقة. الحالة الأحدث فوقها، E54–E62، هي الحاكمة. لم تُمح نتائج أو نسب تاريخية ولم تُحوّل إلى نجاحات تشغيلية جديدة.

# BRIGHT AI / AIGAS — R5.1 | تحديث التدقيق التشغيلي الموحّد

**26 نوفمبر 2026 · SHA `5387cdf6282cc3775f73ade30c82f199967d9409` · قرار الإنتاج المؤسسي: NO-GO · التشغيل المعزول: مثبت جزئيًا**

هذا الإصدار يدمج نتائج التفويض الجديد مع التقرير السابق والبرومبتات الـ15. لا يغيّر المصفوفة المجمدة أو يمنح PASS للإنتاج بسبب نجاح مرشح معزول. لا يُعد تدقيقًا تشغيليًا شاملًا منتهيًا.

## أ | نتائج الجولة الجديدة

| نطاق | نتيجة | قيد الإثبات |
|---|---|---|
| Render Node | LIVE، بناء ناجح، نفس SHA | خدمة معزولة مجانية في Ohio؛ لا قاعدة بيانات أو مفاتيح؛ autoDeploy off |
| Liveness | HTTP 200، commit مطابق | تشغيل الخادم فقط |
| Readiness | HTTP 503 | لا جاهزية مؤسسية؛ البوابة مغلقة |
| Status / availability | HTTP 200 | trial وenterprise inquiry كلاهما false؛ measurement enabled لا يثبت ingest |
| التحويلات المعرّفة | 159/159 مرشح؛ 0/159 إنتاج | GET دون follow، تحقق 301 وLocation، وليس فحص كامل بقية التاريخ |
| Browser Use | اكتمل فحص العرض في مقاسين | ليست مطابقة MagicPath ولا E2E؛ لم تنفذ عناصر المنتجات |
| Groq | الإضافة موجودة؛ الاستدعاء محجوب | لا أداة Groq ظاهرة، لا نموذج أو completion أو usage مثبت |
| Enterprise E2E | BLOCKED | لا حسابات اختبار مخولة ولا اتصال قاعدة معزولة مهيأ |

**Render:** [مرشح Node](https://brightai-r51-audit.onrender.com)، [لوحة Render](https://dashboard.render.com/web/srv-dc400fk9v7es73df3cc0)؛ service `srv-dc400fk9v7es73df3cc0`، deploy `dep-dc400g49v7es73df3dq0`؛ live في 09:48:49.765226 UTC. الإنتاج `srv-d7m5bcjbc2fs73826v20` بقي على Static Site ولم يجر تغيير DNS أو GitHub أو قاعدة بيانات. اخترنا عزله وحصره بالخطة المجانية وOhio لمقاربة منطقة Neon المعروفة، دون اعتماد المنطقة لمعالجة بيانات العملاء. لا أسرار أو بيانات حقيقية في المرشح. Free plan ليس SLA إنتاج. Health-check HTTP path غير مضبوط في استجابة إنشاء الخدمة؛ لا يفترض readiness platform gate.

## ب | إثبات HTTP والتحويلات

| المسار | إنتاج سابق | مرشح | تفسير |
|---|---:|---:|---|
| `/healthz/` | 404 | 200 | status=ok; exact commit verified |
| `/readyz/` | 404 | 503 | SERVICE_UNAVAILABLE; dependencies not ready; no detailed raw readiness report |
| `/api/trial-availability/` | 404 | 200 | available=false |
| `/api/measurement-status/` | 404 | 200 | enabled=true; analytics ingestion not proven |
| `/api/enterprise-inquiry/` | 404 | 200 | available=false |
| `/status/` | 404 | 200 | portal closed |
| `/app/` | 404 | 503 | APP_UNAVAILABLE; expected closed flag; prior 404 from earlier live evidence |
| `/sitemap.xml` | 404 | 200 | final path /sitemap-index.xml; direct 301 separately verified |

جميع **159** قواعد المصدر فحصت على المضيفين؛ **318 GET** دون اتباع التحويل. الإنتاج: 68 HTTP200 دون Location و91 HTTP404؛ المرشح: 159 HTTP301 مع Location المطابق. سجل `REDIRECT-REPLAY-159.csv` منقول من ترتيب المصدر ونتائج الأداة، وليس capture خام. لا يجوز تسمية 200 في alias نجاحًا للتحويل. بقي فحص الروابط المكتشفة خارج القواعد والـcanonical النهائي والفهرسة غير مكتمل. محاولة الاستكمال انقطعت بانتهاء جلسة Code Mode ولم ترجع نتيجة terminal.

## ج | Browser Use / MagicPath

المصدر الحي [مختبر الحوكمة](https://brightai.live/demo/governance/)، [Secure Chat](https://brightai.live/demo/secure-chat/)، [Developer Workbench](https://brightai.live/demo/developer-workbench/)، [Trust](https://brightai.live/trust/)، [PNG المرجعي](https://storage.googleapis.com/storage.magicpath.ai/component-previews/59a9def5-3eac-49fe-b849-5a0bae086247.png). Run `7d82467c-7dd3-4841-a95d-6588a9e3ac8f` completed. Desktop 1440×1000 وmobile 390×844؛ لم يظهر تجاوز أفقي في المقاسات المفحوصة. فتحت قائمة الجوال ونافذة الطلب محليًا؛ لم تنفذ إجراءات المنتجات أو ترسل طلبات.

| القسم | الملاحظة | الحالة |
|---|---|---|
| overview | initial state 1 synthetic asset, 0 events/risks/referrals | RENDER_OBSERVED |
| kernel | deterministic reader/manager; local only | VISIBLE_NOT_EXECUTED |
| firewall | sample and local scan controls | VISIBLE_NOT_EXECUTED |
| risk-engine | likelihood and impact 1–3; replay available | VISIBLE_NOT_EXECUTED |
| human-gate | local approve/reject controls; no external execution | VISIBLE_NOT_EXECUTED |
| ledger | unsigned local evidence chain; record and verify controls | VISIBLE_NOT_EXECUTED |
| secure-chat | separate public demo; local browser replies only | VISIBLE_NOT_EXECUTED |
| registry | synthetic asset controls; no persistence proven | VISIBLE_NOT_EXECUTED |
| policy-packs | synthetic privacy and supervision packs | VISIBLE_NOT_EXECUTED |
| developer-workbench | rendered 404 desktop and mobile | FAIL_VERIFIED |
| trust-center | public 200; no operational or certification claims verified | RENDER_OBSERVED |
| enterprise-request-modal | opened locally; electronic reception unavailable; no form submission | FAIL_VERIFIED_AVAILABILITY |

لا قبول بصري نهائي: الصورة المرجعية 1200×630 ثابتة بحالة Kernel، والموقع يبدأ Overview؛ لا مقارنة same-state أو screenshots للمرجع الأصلي الكامل. لا دليل للـHero/Header parity أو WCAG الكامل. سجل الأفعال البصرية `BROWSER-OBSERVATIONS.csv`.

## د | Groq والوكلاء

وجدت Groq Cloud Connector الخاص بالمستخدم v1.0.0 في قائمة الإضافات المملوكة؛ وفحصت هيكل إعداد الاتصال دون إظهار أسرار. **لم تتوفر أي دالة تنفيذ Groq في هذه الجلسة**؛ لم أختبر `/models` أو inference، ولم أضع مفتاحًا على Render. لا يمكن اعتبار metadata أو وجود plugin دليلاً على نجاح الاتصال. التفويض الحالي يسمح باستدعاء اصطناعي محدود عند توفر الأداة الفعلية؛ الوصول التقني غير متحقق. ربط المزود بالـBackend يجب إثباته مستقلاً؛ الوكلاء الخمسة وKernel orchestrator لا يصبحون مكتملين لمجرد نشر الكود الحالي. استخدم سرًا جديدًا آمنًا إذا كان المفتاح السابق قد ظهر في محادثة؛ لا تدرجه في GitHub أو التقرير.

## هـ | أثر الجولة على سجل الموانع

| المانع | حالة الإغلاق | نتيجة جديدة | المطلوب |
|---|---|---|---|
| F02 | PARTIAL | Node candidate live exact SHA and liveness passed; production still static; readiness 503 | Complete isolated auth/DB/readiness; approved cutover only after gates. |
| F03 | OPEN | Groq callable tool unavailable; provider/model registry not changed | Enable actual connector and run bounded synthetic proof; verify model/registry in candidate. |
| F06 | PARTIAL | Browser rendered live desktop/mobile and preview image; full same-state parity and actions not proven | Same reference revision and matched states; execute all local synthetic controls. |
| F08 | OPEN | Browser controls visible; trial availability and reception false; no authenticated workflow | Synthetic role-separated staging accounts; trial lifecycle and safe CTA. |
| F10 | OPEN | No new source code; agentic tool loop still not demonstrated | Implement and verify governed agent runtime and five agents. |
| F11 | OPEN | No Groq secret configured on candidate; connector not callable | Inject approved server-side secret through protected configuration; no disclosure. |
| F13 | PARTIAL | 159/159 candidate redirect contract, status 200; production 0/159 correct 301 | Retest on canonical domain after approved cutover. |
| F16 | PARTIAL | 159 configured aliases complete; browser rendering evidence available; historical URL follow-up interrupted, functional and auth E2E unexecuted | Resume remaining URLs and actual interactions; matched visual parity and auth E2E. |

بقية F01–F16 تبقى على حالات السجل السابق، بما فيها فجوات Neon، الدور، وظائف UUID، CI والأمان. لم تتغير درجات الإنتاج ولم يُحسب score جديد. لا GO قبل صفر P0، 100% critical و≥80% لكل محور/منتج بعد تجميد مقام ذري صالح. قرار المرشح: liveness PASS / readiness FAIL. Public synthetic: render observed / functional NOT_VERIFIED. Public live AI، 48H enterprise، commercial: NO-GO.

## و | سجلات الجولة المضافة

- `OPERATIONAL-UPDATE-EVIDENCE.json`: E48–E53.
- `NODE-CANDIDATE-HTTP.csv`: 8 صفوف.
- `REDIRECT-REPLAY-159.csv`: 159 صفًا × مضيفين.
- `BROWSER-OBSERVATIONS.csv`: 12 سطحًا.
- `OPERATIONAL-BLOCKER-OVERLAY.csv`: تحديثات ثمانية موانع، لا يحل محل المصفوفة المجمدة.

---

# الجزء التاريخي المحفوظ — نتيجة التدقيق قبل التشغيل المعزول

**تنبيه:** كل عبارات عدم نشر Node وعدم اتصال المتصفح وعدم اكتمال التحويلات في الجزء التالي تصف الجولة السابقة، لا الحالة الحالية؛ يُرجع للتحديث أعلاه للحالة التشغيلية الأحدث. أرقام المصفوفة والتاريخ محفوظة بدون تعديل.

# BRIGHT AI / AIGAS — R5.1 UNIFIED AGENTIC CLOSURE AUDIT

**26 نوفمبر 2026 | قراءة فقط | SHA `5387cdf6282cc3775f73ade30c82f199967d9409` | قرار إطلاق NO-GO**

هذا التقرير يحل محل مسودة التقرير الموحد السابقة. اكتمل جرد مسارات المصدر وعقود API على مستوى registry/wrappers، وفحص كل صفحات Sitemap الحالية، ومقارنة صفوف R4 الأصلية، وتشغيل replay محلي محدود. **التدقيق التشغيلي الكامل غير مكتمل**: لا خادم Node منشور، لا حسابات اختبار مؤسسية مخولة، ولا وصول بصري موثوق للمرجع الأصلي. لذلك البرومبتات خطة إغلاق محدثة للأدلة وليست إثبات إغلاق الفجوات أو تصريح إطلاق.

## 01 | الحكم التنفيذي

| المؤشر | نتيجة مثبتة | حدود الإثبات |
|---|---:|---|
| ملفات مسارات المصدر | 107/107 | 56 Astro + 51 TS؛ جرد وليس تشغيل |
| API wrappers | 51/51 | 64 route patterns و108 method rows، تشمل HEAD وSSO |
| صفحات Sitemap الحالية | 67/67 | HTTP 200 ومحتوى، لا فهرسة أو وظيفة |
| إجمالي GET الفريدة في الجولة الحالية | 93 | 84 HTTP200، 9 HTTP404؛ 1 منها blog تاريخي غير محسوم |
| وحدات replay اصطناعية محلية | 16/16 | Git blob matched، Node 22.16.0، لا IO/DB/Groq |
| أقسام MagicPath في كود النسخة | 12/12 | لا screenshot أو E2E مثبت |
| المقام التاريخي R4 | 78/78 صفًا مسترجعًا | 21 حالة مقابلة مباشرة عبر طبقات مختلفة؛ لا score delta |
| مصفوفة العمل الحالية | 83 صفًا | 19 PASS، 21 FAIL، 24 NOT_VERIFIED، 19 BLOCKED |
| سجل الموانع | 16 | 3 P0، 12 P1، 1 P2 |
| الأدلة | 47 | 45 في freeze + 2 post-freeze؛ ليست 47 اختبارًا مستقلاً |

**لا درجة إطلاق كلية:** 83 شرطًا تشمل شروطًا مركبة ومتداخلة جُمعت بعد قراءة جزء من الأدلة، وليست المقام الذري المستقل الشامل. لا نحسب نسبة من هذه الصفوف. الأوزان 15 محورًا ومجموعها 100% محفوظة. لا تُخلط نسبة الصفحات مع نسبة جاهزية النظام. 

HEAD الجديد أضاف ملفين فقط تحت `.manus/mcp-results/` مقارنة بـ`9ad3c57e0ed9da265fb99955b04c5637eeadd998`؛ لا تغيّر تطبيقي في diff المرصود. شجرة 8019 entries، 5886 blobs، 337 src، 83 server، 46 migrations، 75 test files. Render deployment `dep-dc3uplgae00c73cukvcg` LIVE 08:25:17.016Z (11:25:17 Riyadh) مطابق للـSHA. خدمة `srv-d7m5bcjbc2fs73826v20` لا تزال static_site تنشر dist/client. Cloudflare origin السابق موثق؛ لم أغير أي إعداد.

| Release scope | القرار | شرط الإغلاق |
|---|---|---|
| Local candidate | NO-GO | build/suite/security/CI على مرشح واحد |
| Public synthetic | NOT_VERIFIED | 16 replay ناجحة، يلزم browser/CTA/negative checks |
| Public live AI | NO-GO | خادم Node + registry + tool loop + approved provider |
| 48H enterprise trial | NO-GO | DB parity، UUID functions، role، auth، quotas/expiry |
| Commercial production | NO-GO | صفر P0، 100% critical، ≥80% كل محور/منتج، أدلة كاملة |
| Deploy authorization | REQUIRED | لا نشر أو كتابة ضمن التفويض الحالي |

## 02 | ما تمت إعادة معاينته في هذه الجولة

### API وRoute census

51 wrapper TS قُرئت من المصدر. 48 pattern مركزي +14 auth operations +2 SSO =64؛ 108 صفوف method/route، HEAD ضمن العقد حيث يضاف آليًا. `routes.mjs` 5–116؛ `boundary.mjs` 34–79 يعالج 404/405/400 والتحقق من query وidempotency وcorrelation؛ request/response schemas مقروءة. لا دليل تشغيل لكل mapping/handler؛ خمس GET عامة من الخادم تعيد 404 HTML (`healthz`, `readyz`, `trial-availability`, `measurement-status`, `enterprise-inquiry`). 107 source rows في SOURCE-ROUTE-INVENTORY؛ أسماء wrapper المعروضة كمسارات منطقية حيث مسار الملف الكامل لم يُحفظ. سجل 159 redirect aliases من redirects.json لا يعني أنها مطبقة. ملفا preview يشبهان بعضهما لكن كلاهما dev-only؛ لا دعوى build collision.

### HTTPS وSEO

67 صفحة من sitemap الفعلية كلها 200؛ 7 مختبرات، 5 complaint routes، request-access وdesign-system ترجع 200. `/status/` (SSR non-prerender) 404 بينما روابط المختبرات تشير إليه. `/sitemap.xml` و`/solutions/ai-firewall/` معلنان كتحويلات ويعيدان 404؛ `/blog/ai-governance/` 404 وقد يكون مقصودًا كمسار متقاعد. `robots.txt` و`/sitemap-index.xml` و`/sitemap-0.xml` تعمل. 327 URL discovery لا يمثل مقام الموقع؛ الزحف العام انتهت مهلته دون نتائج terminal، لم أعتبر المتبقي ناجحًا أو فاشلًا. سجل graph جزئي. لا إرسال POST أو تعبئة نموذج أو signup.

### Neon / CI / ضوابط النشر

43/31 جداول public، 93/2 policies، FORCE 2/0؛ 12 جدولًا موجودة في Staging فقط؛ 29/31 في Production بلا سياسات. Staging دور NOBYPASSRLS، Production لا دور؛ الدالتان start/read(uuid) مطلوبتان وغير موجودتين في القراءات السابقة، لم يثبت سجل تنفيذ migrations. هذا لا يثبت تسربًا. GitHub Actions الحالي 45782955105 انتهى failure؛ job 139782608686 steps فارغة، سبب الفشل غير محسوم. main غير protected، ruleset disabled. لا اعتماد إصلاح من تحديث CI دون مرور checks.

### Replay وظيفي محدود بعد التجميد

تمت قراءة `src/demo/engine.mjs` ومطابقة bytes مع Git blob `2462b23568e4463ee10d2722103e17f5fbcb38c6` ثم تشغيل الملف المعزول عبر Node v22.16.0. 12 حالات عادية (allow/block, valid/tampered, approve/reject, low/high, reply/block, deny/permit) و4 غير صالحة (scenario مجهول، فارغ، طول 501، risk خارج النطاق)؛ **16/16**. نتيجة `DEMO-UNIT-REPLAY.json`؛ لا خادم، لا network، لا كتابة DB، لا Groq. لا تدخل النتيجة في scorecard المجمد ولا تعوض عن E2E.

### MagicPath

النسخة 476546341477171200/component 476546341477171202/revision 476546341477171201. جردنا 12 قسمًا في TSX (382 سطرًا)، مع خط تحكم ووظيفة في MAGICPATH-ACTION-REGISTER.csv. الأصل غير متاح؛ لا screenshots مقارنة، Opera disconnected. حالات خاصة: developer endpoint غير مسجل، risk residual محلي، Human Gate stage label يحتاج negative test، Ledger digest محلي، Secure Chat send مغلق في النسخة. لا اعتبار ذلك إخفاقًا في إنتاج غير مختبر أو تطابقًا بصريًا. Hero/header/Constellation محفوظان بلا تعديل.

## 03 | المعمارية والمنتجات

## 02 | البيانات الفعلية والتفريق بين البيئات

| البند | Production | Staging |
|---|---:|---:|
| public tables | 31 | 43 |
| RLS enabled | 31 | 43 |
| tables with policies | 2 | 43 |
| total policies | 2 | 93 |
| FORCE RLS | 0 | 2 |
| aigas_runtime | absent | present, NOLOGIN/NOBYPASSRLS |
| start(uuid) / read(uuid) | absent / absent | absent / absent |
| legacy start() | absent | present |
| protected Neon branch | false | false |
| region | aws-us-east-2 | aws-us-east-2 |

تغطية السياسات: 2/31 = 6.45% مقابل 43/43 = 100%؛ ليست درجة أمان أو إثبات تسريب. مالك قاعدة البيانات BYPASSRLS في البيئتين؛ لا يُستنتج منه دور التطبيق الفعلي. منطقتا Ohio لا تحققان افتراض إقامة سعودية دون مسار معتمد؛ الموافقة غير مثبتة. لا توجد ربط بيئة Node→Neon فعلي مثبت حتى الآن. الاستعلامات كانت على الكتالوج فقط. لا تشغيل SQL تعديلًا.

## 03 | المعمارية AS-IS وTARGET

AS-IS المرصود: Browser → Cloudflare → Render Static (dist/client). مصدر GitHub يحتوي SSR/API → Kernel → services → PostgreSQL / Groq، لكن هذا لا يعني نشر الخادم. 83 ملف server و46 SQL migration و75 ملف tests و337 ملف src و5886 blobs جُردت أسماءها؛ لا ادعاء قراءة جميع الملفات. Groq الحالي يستخدم approved registry فارغ وميزانية ملف؛ Firewall registry مزودين فارغة؛ Risk Assist موجود كمساعد صياغة؛ Secure Chat text adapter؛ Human Gate وLedger منطق حتمي موجود. E01–E07 E17–E31 E34 E35 E36.

TARGET (اقتراح تنفيذ لا وصف قائم): Browser/Arabic RTL → SSR routes/auth boundary → Kernel Orchestrator + policy/entitlements → 5 agents → shared tool executor & Groq gateway → approved Groq model. Neon stores tenant-scoped runs, steps, grants, asset versions, bounded memory, reservations and evidence references. Deterministic Firewall pre/post checks, Human Gate review and Ledger evidence surround **every applicable action**, including actions proposed by Firewall Agent itself. Kernel not a paid sixth product. No microservices migration required by evidence. Prefer local tool calling, which Groq documents as application-owned execution/orchestration; actual account capability and approval not tested. E32 E33.

| Agent | وظيفة مستقلة | أمثلة أدوات مقترحة (ليست أسماء APIs موجودة) | السلطة الممنوعة |
|---|---|---|---|
| Firewall | شرح القرار، تحليل التهديد، اقتراح قاعدة | read_effective_policy / evaluate_synthetic_request / draft_rule_proposal | تجاوز DENY أو تعديل policy |
| Risk Engine | تحليل أصل، مسودة معالجة، تفسير تقييم | read_asset_revision / calculate_risk / propose_treatment | تغيير الحساب أو قبول الخطر |
| Human Gate | تلخيص سياق الموافقة والتوصية للمراجع | read_review_context / explain_policy / draft_review_note | اعتماد/رفض أو تزوير grant |
| Ledger | البحث في الدليل وتحليل التناقض والتقرير | read_evidence / verify_chain / draft_report | صنع hash أو تعديل سجل |
| Secure Chat | محادثة محكومة وتوجيه مهام مسموحة | read_conversation / request_agent_handoff / summarize_result | تجاوز صلاحيات أو إرسال بيانات ممنوعة |
| Kernel Orchestrator | routing, context, permission, state, handoff | resolve_context / authorize_tool / schedule_step (داخل الخادم) | تغيير السياسة أو منح سلطة ذاتية |

### تعريف «وكيل حقيقي» وشروط التوقف

الـLLM يقترح tool call من schema محدد، والخادم يتحقق من هوية المستخدم والمستأجر، والمنتج المرخص، ونسخة الأصل والسياسة والأداة، ونوع العملية والحصة. الأداة تنفذ محليًا ضمن صلاحية ضيقة وتعيد نتيجة منقحة؛ model receives result ويمكنه اقتراح خطوة أخرى ضمن حد. تنتهي الحالة بنتيجة أو توقف للموافقة أو منع أو انتهاء مهلة أو فشل؛ ليس مجرد system prompt مختلف. التخطيط يُحفظ كخطة إجراءات مختصرة قابلة للتدقيق، لا hidden chain-of-thought. لا shell/SQL/URL عامة، لا MCP خارجي أو web access تلقائيًا، لا تمرير أسرار أو tenant من النموذج، لا وثوق بمحتوى الأداة. Tool calls ليست تفويضًا. لا حاجة لاستدعاء Groq في قرار حتمي لا يحتاجه.

**State machine مقترحة:** CREATED → AUTHORIZED → RUNNING → WAITING_HUMAN (عند الانطباق) → RUNNING بعد إعادة فحص grant → COMPLETED. حالات نهائية FAILED / DENIED / CANCELLED / EXPIRED / BUDGET_EXHAUSTED. إعادة فحص السياسة/العضوية/الحصة قبل كل خطوة. حدود max_steps/max_depth/fanout/time/tokens/cost يقرها المالك وفق قياس معزول؛ لا أرقام مفترضة. نفس idempotency key لا يكرر أثرًا؛ عدم تأكيد نتيجة خارجية لا يعني إعادة التنفيذ. Outbox/compensation حيث يلزم؛ لا transaction مفتوحة أثناء انتظار Groq.

**Agent run contract مقترح:** run_id، tenant_id/actor_id (server-derived)، agent_id/version، asset_id/version، policy_version، trace_id/parent_run_id، step_no، tool_id/version، idempotency_key، input_digest/minimized metadata، decision، approval_ref (optional)، state، timestamps، model_id، token usage، reservation/settlement refs، evidence_event_id. تخزين الذاكرة لكل tenant/actor/agent/session وscope/TTL/retention، تمرير سياق منقح فقط، منع تسريب بيانات عميل لآخر. لا raw prompt أو مفاتيح أو reasoning مخفي في سجل الدليل. تحقق من استقلالية المنتجات وتكاملها اختياريًا، دون تكرار المنطق أو الالتفاف على Kernel.

### Groq والـ.env — عقد واحد

`.env.example` يحتوي `GROQ_API_KEY` و`AIGAS_SC_GROQ_API_KEY` و`GROQ_MODEL` و`AIGAS_GROQ_*`. `resolveProviderSecret` يقبل نمط AIGAS_SC_*_API_KEY، بينما Render blueprint يعلن GROQ_API_KEY؛ فرق أسماء مثبت. المقترح استخدام `AIGAS_SC_GROQ_API_KEY` كاسم canonical مراعاة للتوافق الحالي، مع alias انتقالي واضح إذا كان المفتاح المحلي باسم GROQ_API_KEY، ورفض تعارض القيم دون تسجيلها. الاختيار النهائي بعد فحص presence-only في بيئة مخولة؛ **لم أقرأ .env الفعلي أو قيمة مفتاح**. لا خمسة مفاتيح، لا مفتاح client، لا بديل صامت. النموذج المرجعي qwen/qwen3.8-27b بحسب التكليف الأصلي؛ موثق دعم tools في Groq docs، لا إثبات وصول الحساب أو موافقة استخدامه. السجل الحالي APPROVED_MODELS فارغ. اعتماد per tenant/model/region/expiry/retention/no-training قبل Live؛ شروط Groq المنشورة لا تعني موافقة العميل أو قبول إقامة البيانات. Shared gateway مع provider abstraction لخيارات on-prem مستقبلًا؛ لا ادعاء air-gap عند اتصال Groq الخارجي. الميزانية لكل run/agent/user/tenant + global، reserve/settle ذرّي مشترك، لا double charge بسبب retry، circuit breaker/429/cancel/timeout/reconcile بعد crash. حفظ text-only adapter القديم للخدمات غير agentic ومنفصل عن عقد tools الجديد. E06 E17 E22 E23 E28 E32 E33.

## 04 | حالة المنتجات ومسارات الربط

| المنتج | المصدر المقروء | حالة الوكيل المطلوبة | إثبات التشغيل |
|---|---|---|---|
| Firewall | deterministic/synthetic registry + advisory، provider registry فارغة | tool loop وعزل مطلوبان | BLOCKED للإتاحة الحية |
| Risk Engine | Groq advisory JSON + role/idempotency | agent tool plan/calc/treatment غير متحقق | BLOCKED |
| Human Gate | state machine وbinding | agent review assistant غير متحقق | BLOCKED |
| Ledger | service وappend/query | agent query/verify/report غير متحقق | BLOCKED |
| Secure Chat | text adapter يرفض tool_calls | عقد agent الحالي غير مستوفى | BLOCKED |
| Kernel | tenant guard/dashboard وpolicy foundations | handoff/run orchestration غير متحقق | BLOCKED |

لا نسبة منتج نهائية: لا جرد feature-level كامل ولا مقام منطبق مجمد. لا يكفي اسم Agent في ملف أو UI. لا نعلن أن كامل المصدر خالٍ من أي orchestration اعتمادًا على أسماء الملفات.

| Edge مطلوب | الحالة/الدليل |
|---|---|
| Registry → policy pack → Risk | synthetic evidence E27؛ production NOT_VERIFIED |
| Policy → Firewall → Human Gate | fixture binding E26 E27 E29؛ runtime BLOCKED |
| Human Gate → Guarded execution | state/one-use design E29؛ real E2E BLOCKED |
| Firewall/Risk/Secure Chat → Groq | source advisory/text موجود E22–E25؛ live BLOCKED |
| Model → typed tool executor → next model step | FAIL_VERIFIED على عقد gateway المقروء E22 E23؛ target مطلوب |
| Kernel → 5 agents → Kernel handoff | NOT_VERIFIED، E34 جرد أسماء لا نفي كامل |
| كل agent/run/tool → Ledger | NOT_VERIFIED؛ fixture evidence E27 E30 لا production proof |
| Ledger evidence → Risk/Chat report | NOT_VERIFIED |
| trial expiry/revocation → block all actions | BLOCKED؛ E20 E21 |
| output check → response | source contract يحتاج تتبع كامل؛ live BLOCKED |

مسار قبول مركزي: synthetic asset → registry/approved policy → risk assessment → Firewall input/tool check → escalation إن لزم → human grant binding/revalidation → Groq/tool execution → output check → Ledger evidence/export. الاستقلال: تشغيل Agent منفرد عبر Kernel، ثم رحلة تكامل دون شراء كل المنتجات حين يسمح الترخيص. لا E2E مؤسسي مثبت حتى الآن.


## 04 | مصفوفة العمل وتغطية الأدلة

| المجال | الوزن | PASS | FAIL | NOT_VERIFIED | BLOCKED |
|---|---:|---:|---:|---:|---:|
| BE Backend & API | 10 | 2 | 3 | 1 | 2 |
| KE Kernel & orchestration | 10 | 1 | 0 | 2 | 1 |
| DB Neon / RLS / migrations | 9 | 0 | 4 | 2 | 1 |
| SE Security / identity / privacy | 10 | 1 | 1 | 1 | 3 |
| RG Registry & Policy Packs | 6 | 1 | 1 | 2 | 1 |
| FW Firewall Agent | 6 | 1 | 1 | 1 | 1 |
| HG Human Gate Agent | 5 | 1 | 0 | 1 | 2 |
| RE Risk Engine Agent | 7 | 1 | 0 | 2 | 1 |
| LD Ledger Agent | 6 | 1 | 0 | 2 | 1 |
| SC Secure Chat & Groq / FinOps | 7 | 1 | 3 | 0 | 1 |
| UX MagicPath / RTL / A11y | 7 | 2 | 0 | 4 | 1 |
| PJ Public journey / trial / commercial | 5 | 2 | 2 | 1 | 1 |
| IN Infrastructure / deploy / recovery | 5 | 3 | 2 | 1 | 0 |
| QA Performance / dependencies / quality | 4 | 0 | 2 | 1 | 3 |
| SEO SEO/GEO / analytics / observability | 3 | 2 | 2 | 3 | 0 |

لا نسب مجال/منتج لأن المقامات الذرية غير مكتملة. شروط الصفوف كاملة في CSV/JSON، وتجميد هذه اللقطة فقط سبق قراءة R4. لا نعيد وزنها لإخفاء الفشل.

## 05 | المقارنة التاريخية R4 بعد تجميد R5 الجزئي

تم استرجاع R4 من GitHub بعد PRE-R4-SCOPED-FREEZE.json: 78 صفًا و13 محورًا، كل محور 6 شروط. أُعيد الحساب بطريقة S,C=1، F,U=0، الأوزان التاريخية. ليست طريقة R5 الجديدة، ولا نقارن البيئات المختلفة كتحسن سببي.

| القياس التاريخي | الدرجة المعاد حسابها | التغطية المعاد حسابها |
|---|---:|---:|
| R31 | 44.67% | 73.17% |
| R4_source | 36.50% | 52.83% |
| R4_local | 54.00% | 63.17% |
| R4_staging | 10.00% | 10.00% |
| R4_live | 2.50% | 11.83% |

R4 يستند إلى قياس محفوظ عند `961836f8…` وليس HEAD الحالي. جدول 78 صفًا بالنص والحالات السابقة والحالية موجود في R4-78-HISTORICAL-COMPARISON.csv. تم ربط 21 صفًا بدليل حالي مباشر في طبقات SOURCE/CATALOG/HTTP/CI؛ باقي 57 صفًا لا يحمل دليلًا كافيًا. لا حساب نسبة حالية تاريخية على أساس مختلط. أهم الاستمرارية: static Site، RLS gap، role absent، نموذج/مزود فارغ، عدم تحقق العزل والمطابقة. التطور المثبت: SHA deployment حديث مطابق، فحص 67/67 sitemap، واسترجاع نسخة MagicPath. تاريخيًا كانت 7/12 وظائف عامة مثبتة في R13 فقط؛ لا ننقلها إلى الحالي.

## 06 | SEO والتحليلات والمنافسون

GSC 27 أكتوبر–23 نوفمبر 2026: 779 impressions، 12 clicks، CTR 1.54%، average position 15.36؛ sitemap.xml السابق 264 submitted و1 error. GA4: 190 sessions و1642 views؛ hostname/تحويل غير مثبتين؛ لا ادعاء أمان أو نمو. E12 E13.

### مقارنة السوق — القدرات المعلنة فقط، 26 نوفمبر 2026

هذه مراجعة مكتبية مختصرة للمصادر الرسمية التسع، لم نختبر خدمات المنافسين ولا نفترض تسعيرهم أو deployment model إلا إن أعلن صراحة. لا نسبة تفوق. عدم ظهور ميزة في الصفحة لا يعني غيابها. لا نسخ واجهاتهم.

| منافس | قدرات معلنة في المصدر الرسمي | دلالة لـAIGAS |
|---|---|---|
| [Credo AI](https://www.credo.ai/product) | registry، policy packs، workflows، evidence؛ [agent/MCP governance](https://www.credo.ai/blog/agentic-ai-governance-govern-agents-mcp-servers-and-platforms) | ربط أصل/agent/tool بسياسة ودليل واحد |
| [Holistic AI](https://www.holisticai.com/ai-governance-platform) | discovery/inventory، risk monitoring، enforcement | لا يكفي سجل يدوي لإثبات اكتشاف وتشغيل مستمر |
| [Trustible](https://trustible.ai/platform-overview/) | intake، risk/lifecycle، regulatory mapping، inventory | رحلة intake → review → reporting قابلة للقياس |
| [Enzai](https://www.enz.ai/product/agentic-ai-governance) | autonomy classification، allowlists، escalation، multi-agent coordination | حوكمة الإجراء وقت التنفيذ |
| [Saidot](https://www.saidot.ai/product) | agent inventory، risks/controls inheritance، governance APIs | agent owner/mandate ونسخ السياسات |
| [Lumenova AI](https://www.lumenova.ai/) | discovery/enforcement، evaluations، experiments | تقييم الوكلاء وrelease gates |
| [Monitaur](https://www.monitaur.ai/platform) | model lifecycle، policy، evidence، validation/monitoring | دليل دورة الحياة ومصداقية القياس |
| [Asenion](https://asenion.ai/ai-control-system) | machine-executable controls، assessment/verification/runtime evidence | requirement→control→execution→witness |
| [VerifyWise](https://verifywise.ai/user-guide/getting-started/welcome) | inventory، vendor oversight، risk، policy؛ source-available/self-hosted | إثبات خيار نشر داخل العميل لا مجرد شعار |

ميزة AIGAS المستهدفة: وكلاء عربية + kernel policy-controlled tools + evidence وموافقة بشرية + خيارات نشر. هذه فرضية قيمة وليست تفوقًا مثبتًا. PoV المقترح: نفس حالة اصطناعية (طلب تلخيص/معالجة خطر) يدويًا ومقابل AIGAS؛ قياس زمن الحصول على دليل قابل للتحقق، اكتمال trace، عدد الإجراءات غير المصرح بها المحجوبة، وزمن المراجعة وتكلفة run. لا هدف رقمي مخترع ولا ضمان مبيعات. البدائل: منصة جاهزة، أدوات داخلية، source-available بحسب الترخيص، إجراء يدوي، نطاق اصطناعي أضيق؛ يتحدد الاختيار بالسعر/الأمان/التكامل/الوقت وإثبات القيمة.

## 07 | الموانع وملكية الإغلاق

| ID | الأولوية | الحالة | الفجوة | الأدلة | البرومبت |
|---|---|---|---|---|---|
| F01 | P0 | FAIL_VERIFIED | Production/Staging drift + absent least-privilege role | E03, E04, E05, E20, E21, E40 | P02 |
| F02 | P0 | FAIL_VERIFIED | Render static_site بدل Node SSR؛ SHA مطابق | E10, E18, E19, E31, E35, E36, E39 | P01, P14, P15 |
| F03 | P1 | FAIL_VERIFIED | سجل النماذج والمزودين فارغ في المصدر | E06, E24, E32, E33 | P04 |
| F04 | P1 | FAIL_VERIFIED | آخر CI accessibility/performance فاشل؛ سبب الفشل مجهول | E07, E43 | P13 |
| F05 | P1 | NOT_VERIFIED | فرعا Neon غير محميين؛ Ohio، لا دليل موافقة الإقامة/الاستعادة | E04 | P02, P14 |
| F06 | P1 | NOT_VERIFIED | نسخة MagicPath مقروءة؛ الأصل والمطابقة البصرية والوظيفية غير مثبتة | E08, E15, E16, E41, E44 | P12 |
| F07 | P2 | FAIL_VERIFIED | خطأ sitemap مسجل؛ حالة الفهرسة التفصيلية غير متحققة | E12, E38, E45 | P13 |
| F08 | P1 | NOT_VERIFIED | المختبرات تظهر؛ التشغيل التفاعلي والتجربة والتحويل غير مثبتة | E09, E10, E13, E16, E38, E39, E44 | P11, P12, P15 |
| F09 | P0 | FAIL_VERIFIED | حتى Staging تفتقد start(uuid) وread(uuid) المطلوبتين | E20, E21 | P02 |
| F10 | P1 | FAIL_VERIFIED | عقد Groq الحالي text-only وSecure Chat يرفض tool calls؛ شرط agentic loop الجديد غير مستوفى عبر المسار المقروء | E22, E23, E26, E27, E32 | P03, P04, P05, P10 |
| F11 | P1 | FAIL_VERIFIED | اختلاف أسماء اعتماد Groq في عقد التشغيل وRender blueprint؛ وجود السر الحقيقي غير متحقق | E28, E31 | P04, P14 |
| F12 | P1 | NOT_VERIFIED | مشاركة الميزانية متعددة العمال وذاكرة الوكلاء والعزل والتنسيق الفعلي لم تثبت | E17, E22, E25, E29, E30, E34 | P03, P04, P05, P06, P07, P08, P09, P10, P14 |
| F13 | P1 | FAIL_VERIFIED | Live status route and two declared redirects 404; static service lacks SSR/redirect execution | E39, E45 | P01, P11, P13, P14 |
| F14 | P1 | FAIL_VERIFIED | main ruleset disabled; branch unprotected; current same-SHA CI failed | E43 | P13, P14, P15 |
| F15 | P1 | NOT_VERIFIED | Governance product enum omits Secure Chat; developer example route not registered; local Human Gate status label needs negative validation | E37, E41, E42 | P03, P05, P08, P10, P12 |
| F16 | P1 | NOT_VERIFIED | Full crawl/visual/functional verification incomplete; no authenticated running backend or browser available | E44, E39, E41 | P11, P12, P13, P15 |

ملكية ومعيار إغلاق كل finding في RELEASE-BLOCKERS.csv وJSON. ليس هذا ادعاء أن الموانع أغلقت.

## 09 | IDEA DESTROYER — دورتان، Self-review مستقل المنطق لا وكيل بشري مستقل

### Cycle 1: المشروع الحالي مع نطاق Agentic

**Surface scan:** 1. Static Site رغم SSR (F02). 2. قاعدة البيانات حتى Staging لا تفي بالدوال المطلوبة (F01/F09). 3. Gateway text-only مع اعتماد فارغ؛ إطلاق Agentic كأنه متاح سيكون ادعاء غير مثبت (F03/F10/F11).

**Assumption hunt:** نفس المفتاح لا يجعل كل منتج agent. وجود fixtures لا يثبت أدوات حية؛ 93 سياسة لا تثبت tenant isolation. كون الموقع يعمل 200 لا يعني تشغيل الخادم. الطلب السوقي غير مثبت من 12 نقرة. **Worst case:** تحويل DNS قبل DB parity يؤدي لتعطل تجربة العميل؛ وكيل متعدد الخطوات يكرر أدوات أو يستهلك quota ويُسجل نجاحًا كاذبًا؛ بيانات حساسة تنتقل في tool result؛ احتواء عبر flags, default deny, budget/step caps, review, evidence, rollback. **Competition/alternatives:** تسعة منافسين يعلنون حوكمة فعلية متفاوتة؛ الأفضل إثبات PoV محدد بدل مطاردة المزايا. **Resource reality:** لا ميزانية مثبتة أو حساب Groq معتمد أو SLA؛ احسب تكلفة run بعد usage الفعلي وعالج fan-out. **Second-order:** نمو الطلب يضاعف الاستدعاءات، reservations العالقة، سجلات الحوادث والخصوصية؛ مالك SRE/FinOps يراقب quota/timeout/recovery، ويغلق المسار عند الفشل.

Q1: هل تريد agent live في 48h trial أم تجربة اصطناعية مستقلة حتى اعتماد Groq؟ الأثر: scope والتكلفة؛ دليل approval وentitlements.

Q2: هل موقع معالجة البيانات Ohio/Groq مسموح للعميل المستهدف، أم يجب تقديم تشغيل داخل بيئته؟ الأثر: residency/provider؛ دليل موافقة وتعهدات معالجة.

Q3: ما أول رحلة مشتركة قابلة للشراء تثبت القيمة مقارنة بحوكمة يدوية؟ الأثر: PoV والأولويات؛ دليل مقابلات/تقييم اصطناعي.

**VERDICT: WOUNDED** — إصلاحان غير قابلين للتفاوض: توافق قاعدة البيانات وخادم Node، وفرض boundary حتمي للأدوات قبل أي agent live. لا إطلاق تجاري.

### Cycle 2: خطة الإغلاق والبرومبتات الموحّدة

**Surface scan:** 1. تنفيذ البوابة قبل تثبيت scope/DB قد يكرر الفجوات؛ 2. استخدام alias تلقائي بلا فحص قد يخلق تعارض مفتاح؛ 3. الإطلاق قبل إثبات tool executor والـagent-specific permissions يؤدي إلى مخاطر أوسع.

**Assumption hunt:** لا إذن تعديل أو Groq فعلي؛ لا نفترض الوصول للـ.env؛ عدم اكتمال المقام يمنع اعتماد التقرير الكامل. **Worst case:** migration غير قابلة للرجوع ثم قطع DNS؛ العلاج candidate منفصل وrestore مثبت قبل القطع. **Competition:** عدم استبدال MagicPath أو بناء microservices لسبب تسويقي. **Resource reality:** P01–P15 ليست تقدير ساعات، لا وعد بتكلفة أو اكتمال. **Second-order:** shared key يوحّد billing لا يمنح quotas معزولة؛ per-agent budgets وcorrelation والمصالحة إلزامية. التحسينات في الصياغة: P01 يمنع نشرًا مبكرًا؛ P02 يثبت 0040 وعقود DB؛ P04 يفصل text/agentic؛ P15 يفصل GO وإذن النشر.

Q1: هل توجد بيئة معزولة وأدوار اختبار مصرح بها لرحلات agent/tool؟ الأثر: إمكانية إثبات E2E؛ دليل التفويض/حسابات synthetic.

Q2: ما اسم الاعتماد الفعلي داخل .env دون كشف قيمته، ومن يملك اعتماد النموذج والحصص؟ الأثر: secret migration وFinOps؛ دليل presence-only وmodel approval.

Q3: ما سياسة الميزانية وحدود الاستقلال والتوقف وSLA المقبولة للوكيل؟ الأثر: caps وrelease scope؛ دليل قرار مالك واعتماد تشغيلي.

**VERDICT: WOUNDED** — خطة مشروطة بالإثبات والتفويض؛ لا تغيير درجات أو إخفاء P0، ولا claims اكتمال من البرومبتات.

## 10 | ترتيب الإغلاق والـRollback

P01 تثبيت بيئة النشر (خطة فقط) → P02 مطابقة Neon وعقد persistence → P03 Kernel runtime/tool executor → P04 Groq gateway → P05 registry/policy → P06 Firewall → P07 Risk → P08 Human Gate → P09 Ledger → P10 Secure Chat/handoffs → P11 رحلة trial/commercial → P12 UI → P13 QA/SEO → P14 مرشح Node وأمن واستعادة → P15 re-audit + موافقة منفصلة. يمكن موازاة أعمال القراءة لا تجاوز dependencies. كل مرحلة لها owner وتوقف وrollback. عدم نشر Node الآن؛ حفظ Static Site والـdeploy السابق كاستمرارية. لا تنفيذ migration أو تغيير DNS حتى مرشح معزول وbackup/restore/rollback مثبت، schema compatible، موافقة منفصلة؛ أي فشل critical يعيد حالة NO-GO ويغلق الوظائف الحية. لا تكفي نسبة مرتفعة لتجاوز الموانع.


**مراجعة إضافية على الدورتين:** الـ16 replay ليست أداة تسويقية للإعلان عن AI؛ التغطية الحقيقية تحتاج authenticated Node وapproved Groq. الإصدار الجديد يضيف F13–F16 إلى مسارات P01/P03/P05/P08/P10/P11/P12/P13/P14/P15؛ لا تكرار وزن لموانع مشتركة.

## 08 | سجلات الدليل والحدود

- لم يكتمل فحص كل URL قديمة أو 159 تحويلًا، أو كل ربط داخلي وحالة UI؛ Firecrawl full crawl انتهت مهلة الأداة وOpera غير متصل. لا إثبات E2E مؤسسي، provider call، CI ناجح، أو visual parity.
- لا أسرار، لا customer rows، لا GitHub commit/push، لا تغيير Render/Neon/Cloudflare/MagicPath. استُخدمت حصص القراءة، لم يُجر استدعاء Groq مدفوع.
- تغيير SHA لاحق يبطل نقل الأدلة التشغيلية دون تحقق. ما تبقى لا يُغلق بإعادة صياغة البرومبتات؛ يحتاج بيئة اختبار Node معزولة، أدوار synthetic معتمدة، browser ومرجع بصري، وموافقات المزود/البيانات والميزانية.
- هذا تسليم مكتمل للتوثيق الذي أمكن إنتاجه، وليس ادعاء اكتمال المهمة الأصلية 100%.

| سجل | الوظيفة |
|---|---|
| `SOURCE-ROUTE-INVENTORY.csv` | 107 source rows |
| `API-OPERATION-REGISTER.csv` | 108 method rows |
| `ROUTE-VERIFICATION.csv` | 93 GET observations |
| `NEON-CATALOG-PARITY.csv` | 43 catalog rows |
| `MAGICPATH-ACTION-REGISTER.csv` | 12 source sections |
| `INTEGRATION-MATRIX.csv` | 11 source edges |
| `LINK-GRAPH-PARTIAL.json` | directly observed examples only |
| `R4-78-HISTORICAL-COMPARISON.csv` | 78 historical rows |
| `R4-HISTORICAL-RECONCILIATION.json` | historical calculation |
| `DEMO-UNIT-REPLAY.json` | 16 replay results |
| `R5-REQUIREMENTS-BASELINE.json` | scoped requirements |
| `R5-INDEPENDENT-SCORECARD.json` | scoped freeze; no total score |
| `PRE-R4-SCOPED-FREEZE.json` | hashes before opening R4 |
| `REQUIREMENTS-TRACKER.csv` | 83 scoped checks |
| `RELEASE-BLOCKERS.csv` | 16 findings |
| `EVIDENCE-REGISTER.json` | 45 evidence records |
| `POST-FREEZE-EVIDENCE.json` | 2 addendum records |



---



---

# البرومبتات التنفيذية الـ15 — نسخة واحدة محدثة

# BRIGHT AI / AIGAS — R5.1 UNIFIED CLOSURE EXECUTION PACK

**15 برومبتًا موحدة بعد التحقق التشغيلي المعزول — الأدلة E01–E62.** نتائج E54–E62 مقدمة على الأوصاف التاريخية. لا تكرر ما ثبت في البيئة المعزولة، ولا تعتبره إغلاقًا للإنتاج. الميزانية الحالية لـGroq صفر دولار؛ لا استدعاء مدفوع ولا تعديل GitHub إلا بواسطة وكيل تنفيذ مفوض لاحقًا.

## P01 — Release topology & baseline

**Delta التدقيق الحالي / مطلوب إغلاقه:** E48/E57/E60: مرشح Render Node قائم، service srv-dc400fk9v7es73df3cc0، deploy dep-dc40a2t6e07s73dpro4g، SHA 5387cdf6282cc3775f73ade30c82f199967d9409، healthz=200 وreadyz=200 وDB/Auth READY مع portal DISABLED. لا تعِد إنشاء الخدمة ولا تستخدم production DSN. الإنتاج ما زال Static Site و159/159 تحويلًا نجحت في المرشح لا الإنتاج. أثبت platform health-check ثم cutover/rollback بعد التصريح المستقل.

**Owner:** SRE / release architect · **Dependencies:** none · **Findings/Evidence:** F02; E01 E02 E10 E18 E19 E31

ROLE: Principal engineer + security/release reviewer for BRIGHT AI / AIGAS. Repo https://github.com/YEEEAE/BRIGHTAI ; reference SHA `5387cdf6282cc3775f73ade30c82f199967d9409` (verify current candidate, do not silently carry scores across SHA); site https://brightai.live/ ; approved working MagicPath copy project `476546341477171200`, component `476546341477171202`, revision `476546341477171201` (original equality not verified). Objective: R5.1 unified release with five real specialized agents and Kernel orchestrator, one server-side Groq credential via .env/secret manager, deterministic security engines. Retain Astro/Node modular monolith unless evidence requires a different choice. Preserve Hero/header/Constellation, text, layout, animations, links and section order; no redesign or visual replacement of MagicPath. All work defaults to READ-ONLY: inspect first, propose exact diff and evidence; implement only with separate explicit permission in isolated checkout. No commit/push/merge, production edits, DNS, deploy, SQL migration, secret display/export, customer data, live/paid Groq or external mutation without explicit scope approval. Never weaken auth/RLS/policy/test assertions to pass. Report actual statuses (PASS_VERIFIED/FAIL_VERIFIED/NOT_VERIFIED/BLOCKED), exact SHA, environment, file:line, safe evidence IDs, limitations, owners, residual risks. If an approval/dependency is missing, STOP that operation, continue independent read-only analysis. Do not claim 100% from code, screenshots or HTTP200. Use synthetic fixtures and mocks by default. No changes authorized by this prompt alone.

**TASK:** Freeze source tree, route methods, actual Render service and exact deploy ID. Compare render.yaml/node adapter/scripts/server.mjs with current static_site. Verify the already-created candidate Node service E48 (npm ci && npm run build; npm start); re-verify the already-passed isolated readiness and complete rollback/platform health-check evidence; do not repoint apex or remove static site. Inventory public/SSR/API/auth routes and middleware. Read actual current CI and advisories before proposing any change. Keep public content and synthetic route stable.

**ACCEPTANCE:** Exact SHA and Render service mapping; candidate service architecture and endpoint expectations documented; static site stays live; build/runtime plan covers dist/server entry. No domain cutover before P02/P03/P04/P13/P14/P15 and approval.

**ROLLBACK / STOP:** Existing static service and current live deploy ID retained; the isolated candidate deployment E48 exists. Do not remove or redeploy it without a reason and authorization.

**DELIVER:** evidence register, proposed file paths and exact acceptance matrix; list remaining BLOCKED/NOT_VERIFIED and authorization needed.

---

## P02 — Database parity, least privilege, agent persistence

**Delta التدقيق الحالي / مطلوب إغلاقه:** E54–E59: مشروع raspy-surf-09603889/branch br-noisy-frog-bdwi4d6d مستقل: 42/42 fresh migrations، 47 جدولًا/98 سياسة، 8/8 حالات عزل، دالتا trial(uuid) تعملان، login r51_app_login لا صلاحيات مباشرة على public ويملك SET TRUE/INHERIT FALSE إلى aigas_runtime. أصلح/وثق PG18 SET option في مسار provisioning. لا تعِد تشغيل 0011/0012/0013/0019 على fresh. افحص 0018 مع owner غير neondb_owner وclient role stubs في rehearsal منفصل. خطط إصلاح Production/Staging دون تنفيذ قبل موافقة منفصلة، مع hash ledger/backup/restore وHTTP auth tests.

**Owner:** PostgreSQL/security · **Dependencies:** P01 · **Findings/Evidence:** F01 F05 F09 F12; E03 E04 E05 E20 E21

ROLE: Principal engineer + security/release reviewer for BRIGHT AI / AIGAS. Repo https://github.com/YEEEAE/BRIGHTAI ; reference SHA `5387cdf6282cc3775f73ade30c82f199967d9409` (verify current candidate, do not silently carry scores across SHA); site https://brightai.live/ ; approved working MagicPath copy project `476546341477171200`, component `476546341477171202`, revision `476546341477171201` (original equality not verified). Objective: R5.1 unified release with five real specialized agents and Kernel orchestrator, one server-side Groq credential via .env/secret manager, deterministic security engines. Retain Astro/Node modular monolith unless evidence requires a different choice. Preserve Hero/header/Constellation, text, layout, animations, links and section order; no redesign or visual replacement of MagicPath. All work defaults to READ-ONLY: inspect first, propose exact diff and evidence; implement only with separate explicit permission in isolated checkout. No commit/push/merge, production edits, DNS, deploy, SQL migration, secret display/export, customer data, live/paid Groq or external mutation without explicit scope approval. Never weaken auth/RLS/policy/test assertions to pass. Report actual statuses (PASS_VERIFIED/FAIL_VERIFIED/NOT_VERIFIED/BLOCKED), exact SHA, environment, file:line, safe evidence IDs, limitations, owners, residual risks. If an approval/dependency is missing, STOP that operation, continue independent read-only analysis. Do not claim 100% from code, screenshots or HTTP200. Use synthetic fixtures and mocks by default. No changes authorized by this prompt alone.

**TASK:** Compare both Neon branches via catalog SELECT only: tables/columns/constraints/indexes/triggers/functions/signatures/security definer/search_path/ACL/RLS/role membership and migration checksums vs 0001–0046. Confirm actual start/read(uuid) gap; identify full migration dependencies, including 0040, rather than blindly replaying. Plan additive, reversible migrations for agent runs/steps/tool calls/checkpoints/budget reservations/consent/tenant-bound memory and correlation to existing ledger only if not present. Design RLS and grants for NOBYPASSRLS runtime; no raw model hidden reasoning or secrets; transactional reservation/outbox and recovery. Establish residency decision, encrypted backup/restore, and separate staging/prod approval.

**ACCEPTANCE:** Catalog parity with candidate contract, both uuid functions and execute grants, least-privilege role, isolated cross-tenant negative evidence, replay/concurrency and recovery evidence, backup and restore verified; no owner bypass in runtime. Prioritize staging then production only after independent approval.

**ROLLBACK / STOP:** Versioned backup/restore and compatibility plan; if migrations irreversible, stop before production; keep flags closed.

**DELIVER:** evidence register, proposed file paths and exact acceptance matrix; list remaining BLOCKED/NOT_VERIFIED and authorization needed.

---

## P03 — Kernel agent runtime & secure tool executor

**Delta التدقيق الحالي / مطلوب إغلاقه:** استخدم INTEGRATION-MATRIX.csv ومسارات tenantGuard/requireProductAccess/lockGovernance/ledger writer الحالية. ضع عقد tools/run APIs في central registry وschemas؛ اختبر method/HEAD/error contract وrevocation وoutbox. أصلح تكامل enum لتغطية Secure Chat؛ لا تخلق endpoint مزيف.

**Owner:** Backend/Kernal architect · **Dependencies:** P01 P02 design · **Findings/Evidence:** F10 F12; E22 E26 E27 E29 E30 E34

ROLE: Principal engineer + security/release reviewer for BRIGHT AI / AIGAS. Repo https://github.com/YEEEAE/BRIGHTAI ; reference SHA `5387cdf6282cc3775f73ade30c82f199967d9409` (verify current candidate, do not silently carry scores across SHA); site https://brightai.live/ ; approved working MagicPath copy project `476546341477171200`, component `476546341477171202`, revision `476546341477171201` (original equality not verified). Objective: R5.1 unified release with five real specialized agents and Kernel orchestrator, one server-side Groq credential via .env/secret manager, deterministic security engines. Retain Astro/Node modular monolith unless evidence requires a different choice. Preserve Hero/header/Constellation, text, layout, animations, links and section order; no redesign or visual replacement of MagicPath. All work defaults to READ-ONLY: inspect first, propose exact diff and evidence; implement only with separate explicit permission in isolated checkout. No commit/push/merge, production edits, DNS, deploy, SQL migration, secret display/export, customer data, live/paid Groq or external mutation without explicit scope approval. Never weaken auth/RLS/policy/test assertions to pass. Report actual statuses (PASS_VERIFIED/FAIL_VERIFIED/NOT_VERIFIED/BLOCKED), exact SHA, environment, file:line, safe evidence IDs, limitations, owners, residual risks. If an approval/dependency is missing, STOP that operation, continue independent read-only analysis. Do not claim 100% from code, screenshots or HTTP200. Use synthetic fixtures and mocks by default. No changes authorized by this prompt alone.

**TASK:** Implement-design shared agent contract, registry, typed tool definitions, state machine and bounded orchestrator using existing Kernel context. Each of five product agents is independently invokable when entitled; optional inter-agent coordination via Kernel only. Server-owned identity/tenant/role/asset/policy/version, tool schema strict allowlist, action/risk classification, capability mapping, pre/post policy checks, correlation/causation/idempotency, timeout/cancel, max steps/depth/fan-out, cycle detection. Use durable checkpoints without holding DB transaction across Groq; outbox/compensate external side effects; fail closed on policy/evidence/budget failure. No arbitrary shell/SQL/URL, network or autonomous permission escalation. Map old synthetic registry and keep deterministic engines reusable.

**ACCEPTANCE:** Prove tool call→validation→authorization→deterministic execution→redacted result→model/final with stub; reject forged tenant/tool/version, recursion, oversize args, stale policy and repeated writes; agent state survives crash safely; no unbounded loops. Evidence by agent/run/step, not just text completion.

**ROLLBACK / STOP:** Feature flags default off; retain current deterministic service adapters; disable agent dispatch without destroying records.

**DELIVER:** evidence register, proposed file paths and exact acceptance matrix; list remaining BLOCKED/NOT_VERIFIED and authorization needed.

---

## P04 — Shared Groq provider gateway and FinOps

**Delta التدقيق الحالي / مطلوب إغلاقه:** E61: الميزانية الصريحة $0، connector Groq مملوك لكن أدواته غير ظاهرة، 0 calls و0 إنفاق Groq من التدقيق؛ لا تستخدم المفتاح الذي ظهر سابقًا، لا تخترع نجاح inference. اربط credential جديدًا في secret store بعد موافقة تشغيل، مع allowlist وموديل معتمد وإثبات free quota؛ إذا لا يمكن ضمان عدم التكلفة فاعتمد stub tests واترك live provider BLOCKED. سجل المصدر APPROVED_MODELS فارغ وtext-only؛ لا تتجاوز approval أو budget.

**Owner:** AI/security/FinOps · **Dependencies:** P02 P03 · **Findings/Evidence:** F03 F10 F11 F12; E06 E17 E22 E23 E24 E28 E32 E33

ROLE: Principal engineer + security/release reviewer for BRIGHT AI / AIGAS. Repo https://github.com/YEEEAE/BRIGHTAI ; reference SHA `5387cdf6282cc3775f73ade30c82f199967d9409` (verify current candidate, do not silently carry scores across SHA); site https://brightai.live/ ; approved working MagicPath copy project `476546341477171200`, component `476546341477171202`, revision `476546341477171201` (original equality not verified). Objective: R5.1 unified release with five real specialized agents and Kernel orchestrator, one server-side Groq credential via .env/secret manager, deterministic security engines. Retain Astro/Node modular monolith unless evidence requires a different choice. Preserve Hero/header/Constellation, text, layout, animations, links and section order; no redesign or visual replacement of MagicPath. All work defaults to READ-ONLY: inspect first, propose exact diff and evidence; implement only with separate explicit permission in isolated checkout. No commit/push/merge, production edits, DNS, deploy, SQL migration, secret display/export, customer data, live/paid Groq or external mutation without explicit scope approval. Never weaken auth/RLS/policy/test assertions to pass. Report actual statuses (PASS_VERIFIED/FAIL_VERIFIED/NOT_VERIFIED/BLOCKED), exact SHA, environment, file:line, safe evidence IDs, limitations, owners, residual risks. If an approval/dependency is missing, STOP that operation, continue independent read-only analysis. Do not claim 100% from code, screenshots or HTTP200. Use synthetic fixtures and mocks by default. No changes authorized by this prompt alone.

**TASK:** One canonical server-side credential using current AIGAS_SC_GROQ_API_KEY as compatibility-first proposal; if owner .env uses GROQ_API_KEY, define explicit single-value alias/transition, reject conflicting values without logging, choose canonical after local presence-only check. Keep GROQ_MODEL and approved tenant/model/region/expiry/no-training/retention/capability registry; model reference qwen/qwen3.8-27b subject to account entitlement and approval (no silent fallback). Extend gateway with separate typed agent completion contract tools/tool_choice/tool results, strict JSON/tool_call validation, model-specific parameters and token accounting including tool schemas. Preserve current strict text-only path for non-agent callers. Local tool calling; no default remote MCP/built-ins/web access. Reserve per-step and per-run budget atomically across instances; limits per tenant/agent/user plus global, deadline, concurrency, bounded retry/429/reconcile unknown usage, circuit breaker. No provider call on deny or invalid approval; no secrets in clients or traces. Review Groq docs and data agreement.

**ACCEPTANCE:** Mock contract supports safe tool calls, malformed or unexpected responses rejected; no tool call bypass; rate-limit, cancel, retry, stale reservation and multi-worker budget verified; approval expiry/deny invokes zero external calls. Actual provider proof with synthetic data only after explicit cost and data approval; report model/latency/token counts from result, never invent.

**ROLLBACK / STOP:** Keep live provider disabled; revert to prior text adapter and approved deterministic mode; preserve reservations for reconciliation.

**DELIVER:** evidence register, proposed file paths and exact acceptance matrix; list remaining BLOCKED/NOT_VERIFIED and authorization needed.

---

## P05 — Registry, policy packs & agent identity

**Delta التدقيق الحالي / مطلوب إغلاقه:** افحص governance/contract.mjs product enum الناقص، وثبت policy versions وpack applicability؛ ربط PDPL/SDAIA/ISO وفق مصادر معتمدة ومراجعة بشرية دون ادعاء شهادة. registry/packs في MagicPath محلية فلا تُحسب persistence.

**Owner:** Governance architect · **Dependencies:** P02 P03 · **Findings/Evidence:** F08 F12; E26 E27 E34

ROLE: Principal engineer + security/release reviewer for BRIGHT AI / AIGAS. Repo https://github.com/YEEEAE/BRIGHTAI ; reference SHA `5387cdf6282cc3775f73ade30c82f199967d9409` (verify current candidate, do not silently carry scores across SHA); site https://brightai.live/ ; approved working MagicPath copy project `476546341477171200`, component `476546341477171202`, revision `476546341477171201` (original equality not verified). Objective: R5.1 unified release with five real specialized agents and Kernel orchestrator, one server-side Groq credential via .env/secret manager, deterministic security engines. Retain Astro/Node modular monolith unless evidence requires a different choice. Preserve Hero/header/Constellation, text, layout, animations, links and section order; no redesign or visual replacement of MagicPath. All work defaults to READ-ONLY: inspect first, propose exact diff and evidence; implement only with separate explicit permission in isolated checkout. No commit/push/merge, production edits, DNS, deploy, SQL migration, secret display/export, customer data, live/paid Groq or external mutation without explicit scope approval. Never weaken auth/RLS/policy/test assertions to pass. Report actual statuses (PASS_VERIFIED/FAIL_VERIFIED/NOT_VERIFIED/BLOCKED), exact SHA, environment, file:line, safe evidence IDs, limitations, owners, residual risks. If an approval/dependency is missing, STOP that operation, continue independent read-only analysis. Do not claim 100% from code, screenshots or HTTP200. Use synthetic fixtures and mocks by default. No changes authorized by this prompt alone.

**TASK:** Map assets/models/agents/use-cases/vendors to tenant-owned stable versioned records, owner/mandate/approved tool scopes and autonomy levels. Distinguish product agents that conduct governance from third-party agents being governed. Use reviewed policy packs with source/reference/version/applicability and deterministic hierarchy/hard deny. Map requirement→control→check→finding→review→evidence. No model-generated policy auto-publication. Include agent/tool versions, approval expiry, revocation/kill switch and impact invalidation. Map every internal edge and product grant; distinguish public synthetic, live AI, 48h trial and paid scope.

**ACCEPTANCE:** Unregistered/expired agent blocked; policies and grants versioned and reproducible; ownership and scope validated; policy mutation requires authorized review; cross-tenant and revocation checks; no loss of product independence.

**ROLLBACK / STOP:** Retain prior policy versions; disable new agents; roll back configuration by approved version only.

**DELIVER:** evidence register, proposed file paths and exact acceptance matrix; list remaining BLOCKED/NOT_VERIFIED and authorization needed.

---

## P06 — Firewall Agent

**Delta التدقيق الحالي / مطلوب إغلاقه:** تحقق من decisions الخمسة في core لا من regex demo وحده. خريطة أدوات وtool results تحت policy؛ حالات DENY/ESCALATE وعدم إرسال Groq، input/output checks، idempotency. لا اعتماد مزود فارغ.

**Owner:** Firewall/AI security · **Dependencies:** P03 P04 P05 · **Findings/Evidence:** F03 F10 F12; E22 E24 E26 E27

ROLE: Principal engineer + security/release reviewer for BRIGHT AI / AIGAS. Repo https://github.com/YEEEAE/BRIGHTAI ; reference SHA `5387cdf6282cc3775f73ade30c82f199967d9409` (verify current candidate, do not silently carry scores across SHA); site https://brightai.live/ ; approved working MagicPath copy project `476546341477171200`, component `476546341477171202`, revision `476546341477171201` (original equality not verified). Objective: R5.1 unified release with five real specialized agents and Kernel orchestrator, one server-side Groq credential via .env/secret manager, deterministic security engines. Retain Astro/Node modular monolith unless evidence requires a different choice. Preserve Hero/header/Constellation, text, layout, animations, links and section order; no redesign or visual replacement of MagicPath. All work defaults to READ-ONLY: inspect first, propose exact diff and evidence; implement only with separate explicit permission in isolated checkout. No commit/push/merge, production edits, DNS, deploy, SQL migration, secret display/export, customer data, live/paid Groq or external mutation without explicit scope approval. Never weaken auth/RLS/policy/test assertions to pass. Report actual statuses (PASS_VERIFIED/FAIL_VERIFIED/NOT_VERIFIED/BLOCKED), exact SHA, environment, file:line, safe evidence IDs, limitations, owners, residual risks. If an approval/dependency is missing, STOP that operation, continue independent read-only analysis. Do not claim 100% from code, screenshots or HTTP200. Use synthetic fixtures and mocks by default. No changes authorized by this prompt alone.

**TASK:** Design specialized agent to explain policy decisions, inspect safe metadata and suggest rules via tools such as read_effective_policy, evaluate_synthetic_request, draft_rule_proposal. Keep existing deterministic matcher, decisions ALLOW/WARN/REDACT/ESCALATE/DENY (BLOCK display alias only), pre/post PII/secrets/injection/egress checks; no model override or raw text before redaction. Review provider/tool registry, guarded execution binding, review escalation, output validation, rule versions and false-positive/false-negative methodology. Treat internal tool content as untrusted. If Firewall Agent is unavailable, deterministic Firewall remains functional and fail-closed.

**ACCEPTANCE:** Each action path proven with synthetic fixtures, DENY zero provider calls, REDACT before provider, ESCALATE no action until valid bound human grant, post-check blocks bad output; suggested rule not active until approved; tool calls logged and constrained. No claim of perfect injection detection.

**ROLLBACK / STOP:** Disable AI advisory while retaining deterministic firewall and guard decisions.

**DELIVER:** evidence register, proposed file paths and exact acceptance matrix; list remaining BLOCKED/NOT_VERIFIED and authorization needed.

---

## P07 — Risk Engine Agent

**Delta التدقيق الحالي / مطلوب إغلاقه:** تأكد من الفرق بين demo حساب 5×5 وrisk acceptance الحقيقي؛ استخدم عقد المنهج المحدد وأدلة versioned assessment. اختبر zero denominator وsample size وmetrics وdrift دون اختلاق بيانات.

**Owner:** Model risk specialist · **Dependencies:** P03 P04 P05 P06 · **Findings/Evidence:** F10 F12; E25 E27

ROLE: Principal engineer + security/release reviewer for BRIGHT AI / AIGAS. Repo https://github.com/YEEEAE/BRIGHTAI ; reference SHA `5387cdf6282cc3775f73ade30c82f199967d9409` (verify current candidate, do not silently carry scores across SHA); site https://brightai.live/ ; approved working MagicPath copy project `476546341477171200`, component `476546341477171202`, revision `476546341477171201` (original equality not verified). Objective: R5.1 unified release with five real specialized agents and Kernel orchestrator, one server-side Groq credential via .env/secret manager, deterministic security engines. Retain Astro/Node modular monolith unless evidence requires a different choice. Preserve Hero/header/Constellation, text, layout, animations, links and section order; no redesign or visual replacement of MagicPath. All work defaults to READ-ONLY: inspect first, propose exact diff and evidence; implement only with separate explicit permission in isolated checkout. No commit/push/merge, production edits, DNS, deploy, SQL migration, secret display/export, customer data, live/paid Groq or external mutation without explicit scope approval. Never weaken auth/RLS/policy/test assertions to pass. Report actual statuses (PASS_VERIFIED/FAIL_VERIFIED/NOT_VERIFIED/BLOCKED), exact SHA, environment, file:line, safe evidence IDs, limitations, owners, residual risks. If an approval/dependency is missing, STOP that operation, continue independent read-only analysis. Do not claim 100% from code, screenshots or HTTP200. Use synthetic fixtures and mocks by default. No changes authorized by this prompt alone.

**TASK:** Extend existing Risk Assist into actual bounded agent using read_asset_revision, read_approved_method, calculate_risk (deterministic), propose_treatment and draft_assessment tools. Context synthetic or approved minimized, owner/asset/policy versions and findings. Preserve documented scoring matrix (3x3 or 5x5 by approved method), residual risk calculations, treatment revisions, human acceptance and review binding; no fixed deduction or LLM scoring authority. Include eval datasets, versioned replay, FPR/FNR/precision/recall/denominators, small-sample and drift limits. No model-generated risk acceptance.

**ACCEPTANCE:** Agent plans, invokes allowed tools, produces source-linked draft; arithmetic agrees with engine; no fabricated measurements; invalid method and missing assets stop; human review needed before final acceptance; evidence links to policy and Ledger.

**ROLLBACK / STOP:** Retain manual scoring and review; disable AI drafts.

**DELIVER:** evidence register, proposed file paths and exact acceptance matrix; list remaining BLOCKED/NOT_VERIFIED and authorization needed.

---

## P08 — Human Gate Agent

**Delta التدقيق الحالي / مطلوب إغلاقه:** أعد اختبار رفض Human Gate خصوصًا stage===5 APPROVED label في المرجع. اربط grant بالطلب/policy/tenant/actor/expiry، افحص separation of duties/replay/revoke. لا تجعل النموذج مراجعًا مخولًا.

**Owner:** Authorization engineer · **Dependencies:** P02 P03 P05 P06 P07 · **Findings/Evidence:** F09 F10 F12; E20 E29

ROLE: Principal engineer + security/release reviewer for BRIGHT AI / AIGAS. Repo https://github.com/YEEEAE/BRIGHTAI ; reference SHA `5387cdf6282cc3775f73ade30c82f199967d9409` (verify current candidate, do not silently carry scores across SHA); site https://brightai.live/ ; approved working MagicPath copy project `476546341477171200`, component `476546341477171202`, revision `476546341477171201` (original equality not verified). Objective: R5.1 unified release with five real specialized agents and Kernel orchestrator, one server-side Groq credential via .env/secret manager, deterministic security engines. Retain Astro/Node modular monolith unless evidence requires a different choice. Preserve Hero/header/Constellation, text, layout, animations, links and section order; no redesign or visual replacement of MagicPath. All work defaults to READ-ONLY: inspect first, propose exact diff and evidence; implement only with separate explicit permission in isolated checkout. No commit/push/merge, production edits, DNS, deploy, SQL migration, secret display/export, customer data, live/paid Groq or external mutation without explicit scope approval. Never weaken auth/RLS/policy/test assertions to pass. Report actual statuses (PASS_VERIFIED/FAIL_VERIFIED/NOT_VERIFIED/BLOCKED), exact SHA, environment, file:line, safe evidence IDs, limitations, owners, residual risks. If an approval/dependency is missing, STOP that operation, continue independent read-only analysis. Do not claim 100% from code, screenshots or HTTP200. Use synthetic fixtures and mocks by default. No changes authorized by this prompt alone.

**TASK:** Build specialized review assistant with read_review_context, summarize_bound_request, explain_policy, draft_review_note; only authorized users see minimized evidence. Agent may prepare review and suggest routing, never approve/reject on behalf of reviewer, never consume grant or act as independent reviewer. Enforce existing separation of duties, role/delegation scope, payload digest, expiry/cancel, policy/asset version, one-time grant atomic consumption and revalidation at resume. Escalate uncertainty; no automated override even if LLM calls a tool.

**ACCEPTANCE:** Requestor cannot self-approve, replay/cross-tenant/stale payload denied, timeout cancels, retry does not duplicate execution, approval bound to exact action; model tool cannot approve or forge grant. Show both human decision and agent advisory separately.

**ROLLBACK / STOP:** Disable assistant; preserve pending requests and human review engine; no automatic re-execution.

**DELIVER:** evidence register, proposed file paths and exact acceptance matrix; list remaining BLOCKED/NOT_VERIFIED and authorization needed.

---

## P09 — Ledger Agent & independent evidence

**Delta التدقيق الحالي / مطلوب إغلاقه:** E58/E56: تحقق ترابط 5 أحداث اصطناعية في رحلة الشكاوى؛ رفض SQL لتعديل Ledger بـ42501. هذا ليس توقيعًا أو إثبات سلسلة مؤسسية مستقلة. أصلح رسالة empty-state التي تبقى بعد التسجيل (P12)، واختبر append/verify/export والتلاعب والتزامن تحت tenant scope.

**Owner:** Evidence integrity engineer · **Dependencies:** P02 P03 P05 P06 P07 P08 · **Findings/Evidence:** F08 F12; E27 E30

ROLE: Principal engineer + security/release reviewer for BRIGHT AI / AIGAS. Repo https://github.com/YEEEAE/BRIGHTAI ; reference SHA `5387cdf6282cc3775f73ade30c82f199967d9409` (verify current candidate, do not silently carry scores across SHA); site https://brightai.live/ ; approved working MagicPath copy project `476546341477171200`, component `476546341477171202`, revision `476546341477171201` (original equality not verified). Objective: R5.1 unified release with five real specialized agents and Kernel orchestrator, one server-side Groq credential via .env/secret manager, deterministic security engines. Retain Astro/Node modular monolith unless evidence requires a different choice. Preserve Hero/header/Constellation, text, layout, animations, links and section order; no redesign or visual replacement of MagicPath. All work defaults to READ-ONLY: inspect first, propose exact diff and evidence; implement only with separate explicit permission in isolated checkout. No commit/push/merge, production edits, DNS, deploy, SQL migration, secret display/export, customer data, live/paid Groq or external mutation without explicit scope approval. Never weaken auth/RLS/policy/test assertions to pass. Report actual statuses (PASS_VERIFIED/FAIL_VERIFIED/NOT_VERIFIED/BLOCKED), exact SHA, environment, file:line, safe evidence IDs, limitations, owners, residual risks. If an approval/dependency is missing, STOP that operation, continue independent read-only analysis. Do not claim 100% from code, screenshots or HTTP200. Use synthetic fixtures and mocks by default. No changes authorized by this prompt alone.

**TASK:** Build agent to query authorized evidence, verify chain using deterministic verify tool, explain gaps, produce structured report with event references. No model-generated hash/signature or rewriting history. Every agent run/step/tool decision, provider model/version/usage and approval correlates to append-only evidence with minimal metadata; enforce tenant scope, canonical serialization, SHA-256 sequence/prev chain, clock and integrity checks, outbox/required evidence fail-closed, export/verify independent. Distinguish local demo checksum from signed production proof. No raw prompts, tool secrets or private chain-of-thought in evidence.

**ACCEPTANCE:** Tampered fixture detected by deterministic engine; event references reproducible; append/verify/export and mandatory evidence behavior demonstrated; no mutation via agent; sensitive fields redacted and read grants checked.

**ROLLBACK / STOP:** Disable AI summarizer; retain evidence verification and export; never truncate audit chain to roll back.

**DELIVER:** evidence register, proposed file paths and exact acceptance matrix; list remaining BLOCKED/NOT_VERIFIED and authorization needed.

---

## P10 — Secure Chat Agent and inter-agent handoffs

**Delta التدقيق الحالي / مطلوب إغلاقه:** أثبت أن Secure Chat لا يرفض tool_calls في عقد agentic الجديد فقط؛ حافظ على text-only legacy للطلبات الأخرى. أظهر agent handoff لهوية tenant وصلاحيات مستقلة؛ إلغاء/حذف/retention ومنع تعارض النتيجة. لا ترسل live إلا بموافقة.

**Owner:** Agent integration engineer · **Dependencies:** P03 P04 P05 P06 P07 P08 P09 · **Findings/Evidence:** F03 F10 F12; E06 E22 E23 E25 E27

ROLE: Principal engineer + security/release reviewer for BRIGHT AI / AIGAS. Repo https://github.com/YEEEAE/BRIGHTAI ; reference SHA `5387cdf6282cc3775f73ade30c82f199967d9409` (verify current candidate, do not silently carry scores across SHA); site https://brightai.live/ ; approved working MagicPath copy project `476546341477171200`, component `476546341477171202`, revision `476546341477171201` (original equality not verified). Objective: R5.1 unified release with five real specialized agents and Kernel orchestrator, one server-side Groq credential via .env/secret manager, deterministic security engines. Retain Astro/Node modular monolith unless evidence requires a different choice. Preserve Hero/header/Constellation, text, layout, animations, links and section order; no redesign or visual replacement of MagicPath. All work defaults to READ-ONLY: inspect first, propose exact diff and evidence; implement only with separate explicit permission in isolated checkout. No commit/push/merge, production edits, DNS, deploy, SQL migration, secret display/export, customer data, live/paid Groq or external mutation without explicit scope approval. Never weaken auth/RLS/policy/test assertions to pass. Report actual statuses (PASS_VERIFIED/FAIL_VERIFIED/NOT_VERIFIED/BLOCKED), exact SHA, environment, file:line, safe evidence IDs, limitations, owners, residual risks. If an approval/dependency is missing, STOP that operation, continue independent read-only analysis. Do not claim 100% from code, screenshots or HTTP200. Use synthetic fixtures and mocks by default. No changes authorized by this prompt alone.

**TASK:** Build Secure Chat specialized assistant with conversation state and constrained handoff to Firewall/Risk/Human Gate/Ledger agents through Kernel. Preserve protected message context, input/output checks, permissions, session cancellation, per-user quotas, redaction, model approval, deterministic fallback explicitly labelled, and privacy deletion. No raw universal memory or secret-sharing; memory per tenant/actor/agent/session with scoped read permission and bounded TTL; agent handoff includes sanitized structured context and correlation, not untrusted authority. Define /agent run status/results/cancel contracts only after checking existing API routing; no invented existing endpoints. Verify standalone execution of each agent and multi-agent journey without multiplying costs for deterministic steps.

**ACCEPTANCE:** Each of five agents independently reaches real permitted tool execution under mock, and cross-agent flow completes with shared IDs. Unauthorized handoffs, stale grants, wrong tenant, malicious tool output, timeout/cancel, budget cap and dependency failure tested in isolated authorized environment; no fake canned live responses. Provider-backed E2E remains BLOCKED until explicit approval.

**ROLLBACK / STOP:** Revert chat to existing text adapter/read-only workflows; stop new runs and reconcile active operations.

**DELIVER:** evidence register, proposed file paths and exact acceptance matrix; list remaining BLOCKED/NOT_VERIFIED and authorization needed.

---

## P11 — Public synthetic, 48h trial & commercial product journey

**Delta التدقيق الحالي / مطلوب إغلاقه:** E58/E59/E57: رحلة الشكاوى الخماسية المحلية تعمل؛ DB trial رفض حساب غير موثق، 48 ساعة بدقة، idempotent start، dependencies 6/6، expiry محاكى مع EXPIRED وحدث واحد. تحقق البريد الحقيقي/JWT/browser E2E والحصص والإلغاء وenterprise inquiry لا يزال مطلوبًا؛ لا تعتبر admin-set emailVerified أو timestamps المحولة مصادقة أو مرور 48 ساعة حقيقيًا. Portal مغلق وtrial-availability=false. لا تفتح البوابة العامة حتى تكتمل حماية الوصول للمرشح.

**Owner:** Product/release · **Dependencies:** P02 P03 P05 P06 P07 P08 P09 P10 · **Findings/Evidence:** F01 F02 F08 F09 F12; E09 E10 E16 E18 E20

ROLE: Principal engineer + security/release reviewer for BRIGHT AI / AIGAS. Repo https://github.com/YEEEAE/BRIGHTAI ; reference SHA `5387cdf6282cc3775f73ade30c82f199967d9409` (verify current candidate, do not silently carry scores across SHA); site https://brightai.live/ ; approved working MagicPath copy project `476546341477171200`, component `476546341477171202`, revision `476546341477171201` (original equality not verified). Objective: R5.1 unified release with five real specialized agents and Kernel orchestrator, one server-side Groq credential via .env/secret manager, deterministic security engines. Retain Astro/Node modular monolith unless evidence requires a different choice. Preserve Hero/header/Constellation, text, layout, animations, links and section order; no redesign or visual replacement of MagicPath. All work defaults to READ-ONLY: inspect first, propose exact diff and evidence; implement only with separate explicit permission in isolated checkout. No commit/push/merge, production edits, DNS, deploy, SQL migration, secret display/export, customer data, live/paid Groq or external mutation without explicit scope approval. Never weaken auth/RLS/policy/test assertions to pass. Report actual statuses (PASS_VERIFIED/FAIL_VERIFIED/NOT_VERIFIED/BLOCKED), exact SHA, environment, file:line, safe evidence IDs, limitations, owners, residual risks. If an approval/dependency is missing, STOP that operation, continue independent read-only analysis. Do not claim 100% from code, screenshots or HTTP200. Use synthetic fixtures and mocks by default. No changes authorized by this prompt alone.

**TASK:** Keep synthetic public lab no external provider by default, label simulated tools and results. Distinguish optional public live AI, authenticated 48h trial and paid production; no automatic payment/renewal. Link five product pages and demos, app, request access and contact, deep links, expiry/revocation, synthetic read-only workspace, entitlements, quotas, proof of value report, data deletion and escalation. User identity only from server. Do not expose agent commands during trial beyond allowed capability. Commercial docs include actual licensing, support/SLA, procurement, deployment modes and data exit; no unsupported compliance claims. Compare integrated journey with manually completed synthetic PoV.

**ACCEPTANCE:** All eligible links and controls mapped; local synthetic flows work without provider; trial starts only when runtime and entitlement gates valid, expires after approved 48h contract with no automatic conversion; cancellation prevents subsequent operations; no real customer request submitted during audit.

**ROLLBACK / STOP:** Keep account trial/live features closed; public lab and contact remain; no real customer conversion changes.

**DELIVER:** evidence register, proposed file paths and exact acceptance matrix; list remaining BLOCKED/NOT_VERIFIED and authorization needed.

---

## P12 — MagicPath fidelity and functional RTL UX

**Delta التدقيق الحالي / مطلوب إغلاقه:** E51/E58: عرض فعلي desktop و390px بلا تجاوز أفقي في العينة، 7 صفحات تفاعلية اصطناعية. أصلح reset العدادات (تبقى 2/2 حتى جلسة جديدة) وLedger empty-state المتزامن مع دليل مسجل. Developer Workbench 404 في الفحص السابق، inquiry unavailable. قارن نفس حالة 12 شاشة/modal مع revision المرجعي؛ PNG ثابتة وليست إثبات parity؛ لا تغير Hero/Header المحميين.

**Owner:** Design/A11y · **Dependencies:** P03 P05 P06 P07 P08 P09 P10 P11 · **Findings/Evidence:** F06 F08 F12; E08 E15 E16 E23

ROLE: Principal engineer + security/release reviewer for BRIGHT AI / AIGAS. Repo https://github.com/YEEEAE/BRIGHTAI ; reference SHA `5387cdf6282cc3775f73ade30c82f199967d9409` (verify current candidate, do not silently carry scores across SHA); site https://brightai.live/ ; approved working MagicPath copy project `476546341477171200`, component `476546341477171202`, revision `476546341477171201` (original equality not verified). Objective: R5.1 unified release with five real specialized agents and Kernel orchestrator, one server-side Groq credential via .env/secret manager, deterministic security engines. Retain Astro/Node modular monolith unless evidence requires a different choice. Preserve Hero/header/Constellation, text, layout, animations, links and section order; no redesign or visual replacement of MagicPath. All work defaults to READ-ONLY: inspect first, propose exact diff and evidence; implement only with separate explicit permission in isolated checkout. No commit/push/merge, production edits, DNS, deploy, SQL migration, secret display/export, customer data, live/paid Groq or external mutation without explicit scope approval. Never weaken auth/RLS/policy/test assertions to pass. Report actual statuses (PASS_VERIFIED/FAIL_VERIFIED/NOT_VERIFIED/BLOCKED), exact SHA, environment, file:line, safe evidence IDs, limitations, owners, residual risks. If an approval/dependency is missing, STOP that operation, continue independent read-only analysis. Do not claim 100% from code, screenshots or HTTP200. Use synthetic fixtures and mocks by default. No changes authorized by this prompt alone.

**TASK:** Use exact copy revision as owner-designated working reference; flag original inaccessible. Validate all 12: Overview, Kernel, Firewall, Risk Engine, Human Gate, Ledger, Secure Chat, Registry, Policy Packs, Developer Workbench, Trust Center, Enterprise Request Modal. Preserve main Hero/header/Constellation and approved site section content/order; no new design concept. Add agent run state, tool-step summary (not hidden reasoning), approvals, sources, errors, cancel and evidence controls within existing visual system where needed. Map every UI action→route/API/auth/schema/state/result/error/export. Compare desktop/mobile RTL IBM Plex Sans Arabic, keyboard/focus/dialog semantics/contrast/reduced motion. Capture real before/after only; no claim screenshot parity from source.

**ACCEPTANCE:** 12 screen/modal rows with actual screenshots and action evidence; Hero/header unchanged; all controls function or are clearly unavailable; RTL/accessibility checks pass; no hidden failure masquerading as success. Reference blocked remains explicit.

**ROLLBACK / STOP:** Revert only new scoped agent UI changes; preserve original visual shell and protected regions.

**DELIVER:** evidence register, proposed file paths and exact acceptance matrix; list remaining BLOCKED/NOT_VERIFIED and authorization needed.

---

## P13 — QA, route census, SEO/GEO, analytics and market evidence

**Delta التدقيق الحالي / مطلوب إغلاقه:** E50/E60: 159 قاعدة × مضيفين =318 GET، المرشح 159/159 301 exact Location، الإنتاج 0/159. فحص 327 URL مكتشفًا: 75 HTTP200 و252 HTTP404؛ صنّف 404 تاريخية مقصودة مقابل قيمة SEO قبل التحويل. لا تتعامل مع الروابط المكتشفة كمقام كامل. أعد فحص CI على SHA الناتج، GSC sitemap/canonical/indexation وCWV وWCAG، واختبر عيبي reset/Ledger.

**Owner:** QA/SEO/observability · **Dependencies:** P01 P11 P12 · **Findings/Evidence:** F04 F07 F08; E01 E07 E09 E10 E12 E13

ROLE: Principal engineer + security/release reviewer for BRIGHT AI / AIGAS. Repo https://github.com/YEEEAE/BRIGHTAI ; reference SHA `5387cdf6282cc3775f73ade30c82f199967d9409` (verify current candidate, do not silently carry scores across SHA); site https://brightai.live/ ; approved working MagicPath copy project `476546341477171200`, component `476546341477171202`, revision `476546341477171201` (original equality not verified). Objective: R5.1 unified release with five real specialized agents and Kernel orchestrator, one server-side Groq credential via .env/secret manager, deterministic security engines. Retain Astro/Node modular monolith unless evidence requires a different choice. Preserve Hero/header/Constellation, text, layout, animations, links and section order; no redesign or visual replacement of MagicPath. All work defaults to READ-ONLY: inspect first, propose exact diff and evidence; implement only with separate explicit permission in isolated checkout. No commit/push/merge, production edits, DNS, deploy, SQL migration, secret display/export, customer data, live/paid Groq or external mutation without explicit scope approval. Never weaken auth/RLS/policy/test assertions to pass. Report actual statuses (PASS_VERIFIED/FAIL_VERIFIED/NOT_VERIFIED/BLOCKED), exact SHA, environment, file:line, safe evidence IDs, limitations, owners, residual risks. If an approval/dependency is missing, STOP that operation, continue independent read-only analysis. Do not claim 100% from code, screenshots or HTTP200. Use synthetic fixtures and mocks by default. No changes authorized by this prompt alone.

**TASK:** Reconcile all 107 source route patterns and all discovered URLs/sitemaps/redirects/internal links; continue bounded GET checks, exact expected status/content/auth/canonical/indexability and browser render/console. Never submit real forms or POST against production. Diagnose CI failure from actual logs; inspect lockfile/advisories incl GHSA-qh8j-hqjv-7m4x applicability, build and existing accessibility/performance checks without weakening them. Isolated checks only when authorized. Review agent fault cases, response latency/cost/usage and cancellation. GSC sitemap recorded one error, GA4/GSC actual period; reconcile hosts, consent, conversion definitions, Sentry/PostHog project/release, PII redaction/no automatic capture. Compare nine competitors using official current docs; distinguish claims from verified operations.

**ACCEPTANCE:** Complete route/API inventory with per-row evidence and resume queue; CI cause/green result and known dependency posture; no broken critical route, measured budgets and no invented thresholds; sitemap/canonical reconciliation and truthful commercial copy. Separate source/runtime metrics.

**ROLLBACK / STOP:** Rollback SEO/UI/config by version only; do not submit sitemap or activate telemetry without explicit authorization.

**DELIVER:** evidence register, proposed file paths and exact acceptance matrix; list remaining BLOCKED/NOT_VERIFIED and authorization needed.

---

## P14 — Enterprise hardening, deployment readiness and recovery

**Delta التدقيق الحالي / مطلوب إغلاقه:** E54–E57/E59: خدمة Node جاهزة وموصولة بـNeon Auth وDB isolated عبر login محدود. AIGAS_REQUIRE_RLS=true وAIGAS_DB_RUNTIME_ROLE=aigas_runtime وhealth auth probe active. AIGAS_APP_ENABLED=false؛ لا تفتحها أو تحول DNS/production قبل الموافقة. Free Ohio synthetic only؛ لا اعتماد استضافة العملاء. تحقق من platform health path، backup/restore وMFA/SSO وlogin JWT E2E في بيئة وصول مقيدة، دون تعطيل الضوابط.

**Owner:** Security/SRE/DB · **Dependencies:** P01 P02 P03 P04 P10 P13 · **Findings/Evidence:** F01 F02 F03 F05 F09 F11 F12; E03 E04 E18 E19 E20 E28 E31 E33

ROLE: Principal engineer + security/release reviewer for BRIGHT AI / AIGAS. Repo https://github.com/YEEEAE/BRIGHTAI ; reference SHA `5387cdf6282cc3775f73ade30c82f199967d9409` (verify current candidate, do not silently carry scores across SHA); site https://brightai.live/ ; approved working MagicPath copy project `476546341477171200`, component `476546341477171202`, revision `476546341477171201` (original equality not verified). Objective: R5.1 unified release with five real specialized agents and Kernel orchestrator, one server-side Groq credential via .env/secret manager, deterministic security engines. Retain Astro/Node modular monolith unless evidence requires a different choice. Preserve Hero/header/Constellation, text, layout, animations, links and section order; no redesign or visual replacement of MagicPath. All work defaults to READ-ONLY: inspect first, propose exact diff and evidence; implement only with separate explicit permission in isolated checkout. No commit/push/merge, production edits, DNS, deploy, SQL migration, secret display/export, customer data, live/paid Groq or external mutation without explicit scope approval. Never weaken auth/RLS/policy/test assertions to pass. Report actual statuses (PASS_VERIFIED/FAIL_VERIFIED/NOT_VERIFIED/BLOCKED), exact SHA, environment, file:line, safe evidence IDs, limitations, owners, residual risks. If an approval/dependency is missing, STOP that operation, continue independent read-only analysis. Do not claim 100% from code, screenshots or HTTP200. Use synthetic fixtures and mocks by default. No changes authorized by this prompt alone.

**TASK:** Prepare Render Node candidate, exact deploy SHA, startup secret presence-only checklist, health/readiness dependencies, feature flags fail closed; validate Cloudflare DNS target/HTTPS/cache/no-store and CSP, reverse proxy/CSRF/origin, SSO/MFA/RBAC as approved. Confirm country/region and data processor approval, provider terms, retention/deletion, encryption and backup/restore. Design separate local/on-prem provider option without claiming air-gap while using Groq. Ensure agent runs, tool rights, budgets and observability durable under restart and concurrency. Establish RTO/RPO/SLA based on owner-approved targets, rollback DNS/previous service and compatible schema; no infrastructure change now.

**ACCEPTANCE:** Candidate SSR readiness and least-privilege role evidence; no production content sent to unapproved region; no secret logging; prove restore and rollback; no cutover until P15 independently approves and owner authorizes. Confirm flags only for passed scope.

**ROLLBACK / STOP:** Retain old static service/live deploy and backup; revert routing only after explicit approval and safe schema compatibility.

**DELIVER:** evidence register, proposed file paths and exact acceptance matrix; list remaining BLOCKED/NOT_VERIFIED and authorization needed.

---

## P15 — Final independent re-audit, Idea Destroyer & release handoff

**Delta التدقيق الحالي / مطلوب إغلاقه:** E01–E62 + OPERATIONAL-BLOCKER-OVERLAY.csv. المرشح isolated READY، local synthetic tests mixed (عيبان)، DB trial and scoped RLS pass. Production NO-GO؛ Groq $0 وBLOCKED، actual JWT E2E / full MagicPath parity / agent runtime missing. لا تعِد احتساب مقام 83 الجزئي كنسبة نهائية. أعد تجميد نطاق ذري كامل بعد التنفيذ، احسب ≥80% لكل محور/منتج و100% critical وصفر P0، وافصل cutover authorization.

**Owner:** Independent evidence reviewer + release manager · **Dependencies:** P01–P14 · **Findings/Evidence:** F01–F12; E01–E34

ROLE: Principal engineer + security/release reviewer for BRIGHT AI / AIGAS. Repo https://github.com/YEEEAE/BRIGHTAI ; reference SHA `5387cdf6282cc3775f73ade30c82f199967d9409` (verify current candidate, do not silently carry scores across SHA); site https://brightai.live/ ; approved working MagicPath copy project `476546341477171200`, component `476546341477171202`, revision `476546341477171201` (original equality not verified). Objective: R5.1 unified release with five real specialized agents and Kernel orchestrator, one server-side Groq credential via .env/secret manager, deterministic security engines. Retain Astro/Node modular monolith unless evidence requires a different choice. Preserve Hero/header/Constellation, text, layout, animations, links and section order; no redesign or visual replacement of MagicPath. All work defaults to READ-ONLY: inspect first, propose exact diff and evidence; implement only with separate explicit permission in isolated checkout. No commit/push/merge, production edits, DNS, deploy, SQL migration, secret display/export, customer data, live/paid Groq or external mutation without explicit scope approval. Never weaken auth/RLS/policy/test assertions to pass. Report actual statuses (PASS_VERIFIED/FAIL_VERIFIED/NOT_VERIFIED/BLOCKED), exact SHA, environment, file:line, safe evidence IDs, limitations, owners, residual risks. If an approval/dependency is missing, STOP that operation, continue independent read-only analysis. Do not claim 100% from code, screenshots or HTTP200. Use synthetic fixtures and mocks by default. No changes authorized by this prompt alone.

**TASK:** Re-inventory current approved candidate including every product agent and tool. Freeze exhaustive atomic requirements and weights before new scoring (retain 15 domain weights unless documented approval); each agent/tool acceptance belongs to its product, shared controls counted once. Complete route, backend/API, integration, design, security, local/staging/live and product evidence; compute weighted pass/evidence coverage with raw denominators and unknown/blocked; no score if exhaustive denominator missing. Recheck Idea Destroyer cycle 1 on project, freeze score/gates, then read R4 outputs and compare only original 78 criteria and compatible evidence; cycle 2 challenges prompts/cutover. Validate all findings and mapping, record residual risks. Candidate release plan: backup/restore, staging migration, candidate Node/secret names, isolated synthetic E2E, explicit owner approval for production migration/cutover, scoped smoke and monitoring, rollback. No automatic execution or deploy.

**ACCEPTANCE:** ≥80% every applicable domain and product, 100% critical security controls, zero open relevant P0, core E2E in target, no critical unknown/blocked. Independent GO/NO-GO/NOT_VERIFIED for local candidate/public synthetic/public live AI/48h trial/commercial; deploy authorization distinct. All 15 prompts and original R5 scope + new agentic scope traceable; absence of evidence is NOT_VERIFIED, not PASS.

**ROLLBACK / STOP:** Abort release if any critical gate fails; preserve existing static site, disable live flags, use reviewed restore/rollback plan only with separate explicit authorization.

**DELIVER:** evidence register, proposed file paths and exact acceptance matrix; list remaining BLOCKED/NOT_VERIFIED and authorization needed.

---

