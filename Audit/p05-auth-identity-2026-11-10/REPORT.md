# P05 — Auth والعضويات والسياسات

**الحالة:** `PARTIAL` — محليًا مكتمل ومُثبت، وruntime الحقيقي لـNeon Auth وقناة P19 غير متاحين.
**التاريخ:** 2026-11-10
**HEAD:** `7954bb6f1c2cfddb4839902a5b7d74888a92bc48`
**المرجع:** `7b1f533f71c7b1f41884790366a4d5967c85a87b`
**الانحراف:** HEAD أحدث من المرجع؛ ملفات P05 الأصلية لم تتغير في `git diff 7b1f533..HEAD`، والتغييرات أدناه محلية في working tree. تعديل المستخدم على `Audit/EXECUTION-PROMPTS.md` لم يُلمس.

## 1. البيئة والأدوات

- macOS، Node `v22.22.2`، PostgreSQL `18.6` محلي معزول على `127.0.0.1:55432`، قواعد `p05_*` تُنشأ وتُحذف للاختبار فقط.
- `tests/helpers/no-egress.mjs` يمنع أي socket خارج localhost أثناء الحزم.
- Neon قراءة فقط عبر MCP على `lucky-salad-43566291` / `br-rough-wind-bdkmg13n`.
- لم تُستخدم قيم أسرار أو tokens أو محتوى عميل، ولم يُلمس الإنتاج أو أي مورد خارجي.

## 2. العيوب المكتشفة والمصلحة

1. **`manageMember` تحت دور `aigas_runtime`:** `SELECT … FOR UPDATE` على صف العضوية الذاتية يعيد 0 صفوف لأن سياسة UPDATE تستثني `user_id = aigas_actor()`. النتيجة: إدارة الأعضاء تفشل 403، وسحب العضوية الذاتية كان يُعاد كـ`unchanged` ناجح شكليًا.
   - الإصلاح: رفض تغيير الذات قبل قراءة الهدف، واستخدام `public.aigas_lock_member($1,$2)` المقيدة لصف الفاعل.
2. **`policies.scoped`:** نفس المشكلة على صف الفاعل، فتفشل كل عمليات السياسات تحت runtime بـ403 زائف.
   - الإصلاح: `aigas_lock_member` بدل `FOR UPDATE` المباشر.
3. **`createWorkspace`:** قراءة `neon_auth."user" … FOR SHARE` تقع خارج كتلة الالتقاط، فيتسرب `42501` خامًا بدل `503 WORKSPACE_PROVISIONING_REQUIRED`.
   - الإصلاح: توسيع الالتقاط ليشمل القراءة الأولى مع إبقاء رفض self-grant.

**الملفات:** `src/server/kernel/administration.mjs`، `src/server/kernel/policies.mjs`، `src/server/kernel/service.mjs`.

## 3. الأدلة حسب المتطلب

| المتطلب | الدليل المحلي | الحالة |
|---|---|---|
| AU01 تسجيل/دخول/استعادة/انتهاء جلسة | **live staging:** sign-up 200، get-session true، token 200، JWT EdDSA/issuer/`sub` UUID/`iat`/`exp`/TTL 900s، `authenticate` true، token معدّل 401، sign-out 200 ثم get-session false وtoken 401، sign-in جديد 200 وجلسة ثانية true. محليًا: رفض alg آخر/missing iat/exp/anon/عمر>15m/JWKS cross-origin | `PASS LIVE` — مع حد: JWT صادر قبل sign-out يبقى صالحًا حتى `exp` (stateless) |
| AU02 صلاحيات من هوية موثقة | runtime DB: عضو A يرى A فقط؛ outsider على A = 403؛ tenant مزور = 403؛ selector غير UUID = 400؛ بلا عضوية = `tenant:null`؛ banned = 401 | `PASS` محلي |
| AU03 bootstrap أول مؤسسة | runtime: `createWorkspace` = `503 WORKSPACE_PROVISIONING_REQUIRED`، لا tenant/لا membership، والعدد لا يتغير | `BLOCKED` للنجاح — P19 غير منفذ؛ السلبية PASS |
| AU04 دعوة/ربط/قبول/إلغاء | owner-mode: ربط الهوية بالبريد، replay idempotent، consumed بعد السحب = 403، expired = 410، canceled = 403، inviter authority revoked = 403، cross-tenant cancel = 404؛ runtime: discover = 0 وaccept = `503 INVITATION_BOOTSTRAP_REQUIRED` | `PARTIAL` — المنطق PASS، القبول الحي BLOCKED (P19) |
| AU05 أعضاء/آخر مالك/سحب فوري | runtime: set-role، منع self role/revoke = 409، سحب العضوية يمنع الطلب التالي فورًا، سباق مالكين يحفظ ≥1 مالك، ADMIN لا يرقّي إلى ADMIN | `PASS` محلي |
| AU06 Enterprise→Department→Product→User | runtime: create→submit→approve→publish، منع اعتماد الذات، تفويض ADMIN، نشر طرف ثالث، HARD_DENY يمنع التخفيف والإيقاف، four-eyes، تواريخ غير صالحة = 400، cross-tenant = 403 | `PASS` محلي |
| AU07 فصل entitlement عن الشراء والأمان | وحدة: toggle وحده ليس وصولًا؛ admin grant بتوقيع/مرجع فقط؛ trial منفصل؛ revoked/expired منفصلان؛ licence/subscription NOT_CONFIGURED؛ DB: grant منتج لا يفتح منتجًا آخر، trial منتهٍ = 403 `expired`، تعطيل المنتجات لا يعطل Kernel | `PASS` محلي |

## 4. أوامر ونتائج

```bash
# 1) وحدة الهوية/الاستحقاق/السياسات
node --test tests/identity.test.mjs
# 4 tests, 4 pass, 0 fail

# 2) runtime DB على PG18 معزول
KERNEL_IDENTITY_TEST_DATABASE_URL='postgres://postgres@127.0.0.1:55432/p05_identity' \
AIGAS_REQUIRE_DB_TESTS=true node --test tests/identity-runtime-db.test.mjs
# 1 test, 1 pass, 0 fail

# 3) منطق الدعوات (owner-mode محلي)
KERNEL_INVITATION_TEST_DATABASE_URL='postgres://postgres@127.0.0.1:55432/p05_invitation' \
AIGAS_REQUIRE_DB_TESTS=true node --test tests/identity-invitation-db.test.mjs
# 1 test, 1 pass, 0 fail

# 4) حزمة العقود الكاملة (تنشئ وتدمر 7 قواعد ar_contract_*)
node scripts/verify-contracts-local.mjs
# tests 42, pass 42, fail 0, skipped 0

# 5) build
pnpm build
# PASS — 55 public pages in sitemap/llms.txt; version.json: 7954bb6f1c2c
```

## 5. Readback على staging المعزول (قراءة فقط)

عبر Neon MCP على `lucky-salad-43566291` / `br-rough-wind-bdkmg13n`:

| auth_users | auth_sessions | auth_invitations | kernel_tenants | kernel_memberships | linked_orgs |
|---:|---:|---:|---:|---:|---:|
| 5 اصطناعية | 0 | 0 | 0 | 0 | 0 |

**مهم:** `NEON_AUTH_BASE_URL` في `.env` يشير إلى إنتاج (`c-6`)، ولم يُستخدم. عنوان staging أُخذ من Neon MCP: `ep-holy-shape…c-8` / `neondb/auth`، وJWKS same-origin.

## 5.1 تدفق Neon Auth الحي (staging فقط)

| الخطوة | النتيجة |
|---|---|
| `POST /sign-up/email` | 200، `token`+`user`، كوكي `__Secure-neon-auth.session_token` |
| `GET /get-session` بعد التسجيل | 200، `user` و`session` موجودان |
| `GET /token` | 200، JWT |
| خصائص JWT | `alg=EdDSA`، `iss=https://ep-holy-shape…`، `sub` UUID، `iat`/`exp` موجودان، TTL=900s، `role=authenticated` |
| `authenticate` في التطبيق | PASS، `userId === sub` |
| JWT معدّل | 401 `UNAUTHORIZED` |
| `POST /sign-out` | 200 |
| `GET /get-session` بعد الخروج | 200، بلا `user`/`session` |
| `GET /token` بعد الخروج | 401 |
| JWT القديم بعد الخروج | ما زال يتحقق حتى `exp` — حد stateless معروف |
| `POST /sign-in/email` | 200، جلسة جديدة |
| `GET /get-session` + `/token` للجلسة الثانية | 200/PASS |
| `sign-out` للجلسة الثانية | 200 |
| قراءة عضوية staging للهوية الحية | `tenant=null`، 0 memberships، 5 منتجات، اتصال `CONNECTED` |

أُبطلت كل جلسات الهويات الاصطناعية (`DELETE` محدود على `p05.%@example.test`)، والنتيجة: 0 جلسات. الهويات الخمس الاصطناعية باقية على staging ولم تُحذف (الحذف يحتاج تفويضًا مستقلًا).

## 6. حالات سلبية مغطاة

- توقيع/issuer/alg/exp/`maxTokenAge`/UUID/anon/JWKS cross-origin/ترويسة ضخمة.
- tenant مزور، selector غير UUID، عضو خارج المؤسسة، حساب banned، عضو بلا عضوية.
- self role/revoke، ADMIN يرقّي ADMIN، سباق سحب مالكين.
- اعتماد الذات، نشر المنشئ، تخفيف/إيقاف HARD_DENY، four-eyes غير مكتمل، تواريخ معكوسة، cross-tenant.
- grant بلا مرجع موافقة، grant منتهٍ/مسحوب، trial منتهٍ، منتج غير مشمول، منتج غير مفعّل.
- self-provision 503 بلا صفوف، invitation accept 503 بلا عضوية، discover = 0 تحت runtime، replay/consumed/expired/canceled/revoked inviter.

## 7. ما لم يُتحقق ولماذا

- **انتهاء JWT الحي:** لم ننتظر 15 دقيقة؛ TTL المقيس 900s، ورفض التوكن المنتهي مغطى محليًا في `tests/identity.test.mjs`.
- **إبطال JWT الفوري:** `sign-out` يبطل الجلسة ويمنع `get-session`/`/token`، لكن JWT صادر قبل الخروج يبقى صالحًا حتى `exp` (≤15m). لا denylist/introspection؛ هذا حد stateless مقصود وليس إثبات إبطال فوري.
- **AU03/AU04 نجاحًا:** قناة provisioning وقبول الدعوات من P19 غير موجودة؛ الكود الحالي يفشل مغلقًا 503 عن قصد. لم يُعد تنفيذ القناة هنا.
- **Runtime RLS على staging:** لم يُختبر عبر دور `aigas_runtime` الحي (لا credential محلي)، والقراءة الحية استخدمت اتصال المالك read-only. مسار runtime مغطى محليًا على PG18.
- **Browser:** لم يُشغّل على تطبيق حي لعدم وجود نشر معزول؛ الصفحات مصدرية فقط.

## 8. التراجع

- إيقاف عنقود PG18 المؤقت وحذف قواعد `p05_*`/`ar_contract_*` فقط.
- إرجاع التغييرات المصدرية الثلاثة وملفات الاختبار وسطر harness إن لزم.
- على staging: أُبطلت كل جلسات الهويات الاصطناعية؛ بقيت 5 هويات اختبار (`p05.%@example.test`) دون حذف. حذفها يحتاج تفويضًا مستقلًا.
- لا مساس بالإنتاج (`young-frog-60183055`) ولا بمفاتيحه؛ `.env` الإنتاجي لم يُستخدم.

## 9. الحالة النهائية

`DONE LOCAL` لطبقة التطبيق والاختبارات وRLS runtime المعزولة.
`PASS LIVE` لـAU01 على staging: تسجيل/دخول/استعادة/إبطال جلسة وJWT EdDSA.
`PARTIAL` لـP05 كاملًا.
`BLOCKED` لـAU03/AU04 نجاحًا حتى قناة P19.
`PASS ≠ RELEASED`.
