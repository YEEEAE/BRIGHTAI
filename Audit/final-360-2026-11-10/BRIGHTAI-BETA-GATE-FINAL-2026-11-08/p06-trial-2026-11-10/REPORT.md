# P06 — دورة Trial الخادمية وتفعيل المنتجات المتحققة

**التاريخ:** 2026-11-10 (الرياض) — **الحالة العامة:** `P06-A DONE (LOCAL)` / `P06-B BLOCKED`
**HEAD:** `7d7be0047f430b174a4480c4f6d44521663e12e9` + working tree غير مرفوع
**المرجع:** `7b1f533f71c7b1f41884790366a4d5967c85a87b`، `Audit/final-360-2026-11-10/FINAL-360-AUDIT.md`، `REAL-TRIAL-SPEC.md`
**النطاق:** TR01–TR06؛ `kernel/trial` و`access`، `migrations/0030` (إضافة إلى `0023` دون تعديله)، API/UI المشغّل.
**غير مشمول:** التصدير/الحذف/الاحتفاظ التنفيذي (P20)، الدفع/الفواتير/التجديد، والإطلاق التجاري.

---

## 1. الانحراف عن المرجع

- المرجع `7b1f533` → HEAD `7d7be00`: ستة commits (`5725727`, `60777c9`, `9f70334`, `655a8b9`, `7954bb6`, `7d7be00`) تخص P02–P05/الموقع.
- `src/server/kernel/trial.mjs` و`migrations/0023_aigas_enterprise_trial_lifecycle.sql` **لم يتغيرا** بين المرجع وHEAD (`git diff --stat` فارغ).
- `access.mjs` تغيّر بثلاثة أسطر فقط من P05 (استبدال `FOR SHARE` بدالتي `aigas_locked_product_grants`/`aigas_lock_member`)؛ لم يتغير منطق قرار الوصول أو التجربة.
- لم يُعد التقرير القديم حقيقة حالية: أُعيد فحص الكود والترحيلات والاختبارات على HEAD الحالي.

## 2. ما نُفذ (P06-A)

| العنصر | التنفيذ |
|---|---|
| المخطط | `migrations/0030_aigas_trial_server_cycle.sql`: قناة مشغّل مسماة، سجل جاهزية لكل منتج/إصدار/بيئة، حدود حصص معتمدة، استخدام وحجوزات idempotent. لم يُعدّل `0023`. |
| فصل الخطوات | الطلب (`REQUESTED`) من المالك/المدير فقط؛ الإحالة (`ELIGIBILITY_REVIEW`) من المؤسسة؛ القرار (`APPROVED`/`REJECTED`) من مشغّل مستقل؛ التفعيل من مشغّل مستقل فقط. |
| 172800 ثانية | من `activated_at` فقط؛ `expires_at = activated_at + 48h` مقيّد في `0023` ومُثبت في الاختبار. الطلب/الموافقة/فتح الصفحة لا تبدأ العداد. |
| قناة المشغّل | `aigas_trial_operators` (يمنحها مالك القاعدة، لا JWT claim ولا واجهة)، ومسارات `POST /app/api/operator/trials/{id}/{decide,activate,expire,close}` و`GET /app/api/operator/trials`، وصفحة `/app/operator/trials/`. |
| التفعيل المغلق | الخادم يفحص: بيئة + SHA إصدار + جاهزية `PASS` حديثة لكل منتج + حصة معتمدة + إقرار عميل + مشغّل ≠ مقدّم الطلب. وtrigger قاعدة بيانات يعيد الفحص نفسه، فحتى SQL المباشر لا يفعّل بلا جاهزية/حصة. |
| RLS أدق | أُزيلت سياسة `0025` العامة (`FOR ALL`) عن جداول التجربة واستُبدلت بسياسة قراءة للمؤسسة/المشغّل، وإنشاء طلب فقط، وتحديث للمشغّل فقط. المؤسسة تكتب انتقالاتها عبر دالة `aigas_trial_tenant_transition` ولا تملك تحديثًا مباشرًا. لا يمكن تزوير حدث `OPERATOR` من نطاق المؤسسة. |
| الحصص | `aigas_trial_consume_quota`: نافذة + استحقاق + حد معتمد + قفل صف + idempotency. غياب الحد = `QUOTA_NOT_APPROVED` وليس «غير محدود». القيم نفسها غير معتمدة ولم تُخترع. |
| الانتهاء | `deriveTrialState` يعرض `EXPIRED` فور تجاوز النافذة، والتحويل `ACTIVATED→EXPIRED` يغلق الاستحقاقات ويكتب حدث `SYSTEM`. `EXPIRED` لا يعود إلى `ACTIVATED`. |

## 3. الدليل المنفذ

**البيئة:** macOS، Node `22.22.2`، PostgreSQL `18.6` محلي معزول (cluster تحت `$TMPDIR`، loopback فقط)، دور تشغيل `aigas_runtime` بـ`NOBYPASSRLS`. لا `.env`، لا Neon كتابة، لا شبكة خارجية.

| # | الأمر | النتيجة |
|---|---|---|
| 1 | `P06_PG_PORT=55437 node scripts/verify-trial-local.mjs` | **PASS** — 46/46 اختبارًا، 0 FAIL، 0 SKIP، 8 قواعد disposable |
| 2 | `node scripts/db-migration-rehearsal.mjs` | **PASS** — `0030` `APPLIED` في fresh وdelta، وسلبيات الترحيل كما هي |
| 3 | `pnpm build` | **PASS** — `version.json: 7d7be0047f43` |
| 4 | `node scripts/verify-routes.mjs http://127.0.0.1:4387` | **PASS** — 55 صفحة، 2880 مرجعًا، 0 مكسور |
| 5 | Neon قراءة فقط (staging `br-rough-wind-bdkmg13n`) | `applied=25`, `applied_0030=0`, `has_0023=true`؛ `trial_operators/trial_quota` غير موجودين |

### 3.1 حالات سلبية مقيسة (tests/trial-db.test.mjs)

- عضو `MEMBER` لا ينشئ طلبًا (`403`)، ومنتج غير معروف/هدف قصير/حقل غير مسموح → `400`.
- `dataMode=CUSTOMER` → `SYNTHETIC_DATA_ONLY`؛ لا بيانات عميل.
- طلب ثانٍ لمؤسسة لديها طلب مفتوح → `TRIAL_ALREADY_OPEN` مع صف واحد فقط.
- مؤسسة أخرى لا ترى التجربة (`state=NONE`) ولا تستطيع إحالتها (`404`).
- غير المشغّل لا يقرر (`OPERATOR_REQUIRED`)، ولا يرى سجل المشغّلين (0 صف).
- المشغّل = مقدّم الطلب → `OPERATOR_SEPARATION_REQUIRED`.
- تفعيل بلا إقرار → `400`؛ بلا جاهزية → `ACTIVATION_READINESS_REQUIRED`؛ مع جاهزية بلا حصة → `ACTIVATION_QUOTA_REQUIRED`.
- تحديث مباشر إلى `ACTIVATED` من مالك القاعدة بلا جاهزية → يرفضه trigger.
- جلسة runtime بنطاق مؤسسة: `UPDATE` على حالة التجربة = 0 صفوف؛ إدخال حدث `OPERATOR` = `42501`.
- حصة: replay بنفس المفتاح لا يضاعف؛ تجاوز الحد `QUOTA_EXCEEDED`؛ طلب منتج بلا حصة `QUOTA_NOT_APPROVED`؛ تزامنان على حد 3 بوحدتين → نجاح واحد فقط والاستخدام 2.
- بعد الانتهاء: العرض `EXPIRED`، الاستحقاقات `EXPIRED`، حدث `SYSTEM`، والحصة `TRIAL_WINDOW_ENDED`، ولا رجوع إلى `ACTIVATED`.
- الإغلاق `CLOSED` يحفظ الصفوف والأحداث؛ لا حذف.

### 3.2 لم يُفحص

- **Runtime/UI حي:** صفحة المشغّل بُنيت (`pnpm build` PASS) لكن لم تُختبر في متصفح حي؛ ذلك يحتاج Auth + DB + بوابة مفعّلة، ولم تُستخدم شبكة أو أسرار محلية.
- **Staging/الإنتاج:** `0030` غير مطبق، ولم يُنشأ مشغّل أو حصة أو جاهزية هناك.
- **PoV/التصدير/الحذف/الاحتفاظ:** لم تُنفذ؛ خارج P06-A.

## 4. P06-B — BLOCKED

المرحلة B تتطلب نجاح المنتج المحدد من P07–P11 لنفس النسخة والبيئة، ثم اعتماد الحصص والمدة والاحتفاظ. الحالة الفعلية:

- لا نتيجة جاهزية `PASS` لأي منتج على أي إصدار/بيئة (الجدول فارغ).
- لا حصة معتمدة (`aigas_trial_quota_limits` فارغ).
- P07–P11 غير مكتملة، ولا اعتماد سياسة للحصص/الاحتفاظ.
- لذلك **لم يُفعّل أي منتج** ولم يُنشأ استحقاق تجربة حقيقي، ولم يُنتج PoV.

## 5. حالة المتطلبات

| المتطلب | الحالة | ملاحظة |
|---|---|---|
| TR01 مسار الطلب وحفظ المنتج | PARTIAL | API للطلب يحفظ المنتجات ضمن قائمة سماح؛ لم تُضف CTA للتسويق لأن التفعيل مغلق. |
| TR02 طلب/أهلية/اعتماد/تفعيل | DONE LOCAL | دورة كاملة مع فصل الفاعلين؛ التفعيل مغلق. |
| TR03 48 ساعة وحصص وصلاحيات | DONE LOCAL | نافذة دقيقة + حصص fail-closed؛ القيم التجارية غير معتمدة. |
| TR04 تصدير/إغلاق/حذف اصطناعي | PARTIAL | الإغلاق والانتهاء منفذان؛ التصدير/الحذف في P20. |
| TR05 لا بطاقة/تحويل/تجديد | DONE | لا حقول أو مسارات دفع؛ لا تجديد تلقائي. |
| TR06 PoV ثم اشتراك | PARTIAL | مولّد PoV مسودة قائم؛ لا PoV تشغيلي قبل P06-B. |

## 6. الملفات

- `migrations/0030_aigas_trial_server_cycle.sql` (جديد)
- `src/server/kernel/trial-service.mjs` (جديد)، `src/server/kernel/core.mjs` (تسميات تدقيق)
- `src/pages/app/api/kernel/trials/**`، `src/pages/app/api/operator/trials/**`، `src/pages/app/operator/trials/index.astro`، `src/scripts/operator-trials.ts`
- `tests/trial.test.mjs`، `tests/trial-db.test.mjs`، `scripts/verify-trial-local.mjs`
- `scripts/verify-contracts-local.mjs`، `scripts/migration-order.mjs`، `scripts/db-migration-rehearsal.mjs` (إضافة قاعدة/ترحيل)
- `tests/identity-runtime-db.test.mjs` (fixture التفعيل يمر ببوابة الجاهزية/الحصة المحلية)
- `docs/TRIAL-AND-GRANT-ROLLOUT-RUNBOOK.md`، `docs/ENTERPRISE-TRIAL-POLICY.md`

## 7. التراجع

- إبقاء `aigas_release_readiness` و`aigas_trial_quota_limits` بلا صفوف يبقي التفعيل مغلقًا.
- `ACTIVATED → EXPIRED` أو `CANCELLED` بحدث وسبب؛ لا إعادة `EXPIRED` إلى `ACTIVATED`.
- لا حذف لسجلات التدقيق أو أحداث التجربة. لا `reset/clean`.
- إيقاف الواجهة/المسار لا يغيّر بيانات؛ إعادة `0030` تحتاج مراجعة واعتمادًا مستقلًا.

## 8. حدود الادعاء

`PASS ≠ RELEASED`. الدليل محلي ومعزول. لا إطلاق، ولا اعتماد حصص/احتفاظ، ولا امتثال، ولا نجاح منتج. `0030` غير مطبق خارجيًا، ولم تُجرَ أي عملية تفعيل أو دفع.
