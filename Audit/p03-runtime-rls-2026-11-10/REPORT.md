# P03 — Runtime RLS وData API: دليل تنفيذ

> **التاريخ:** 2026-11-10 · **HEAD وقت التنفيذ:** `9f703347db3e583a45c82ea19aac002a548774b3` (`9f703347 update site`)
> **المرجع المطلوب:** `7b1f533f71c7b1f41884790366a4d5967c85a87b`. **الانحراف:** 3 commits (`7b1f533` ← `60777c9` ← `5725727` ← `9f70334`)، كلها `update site`؛ لم تُعدّل `migrations/` ولا `src/server/` في هذا النطاق.
> **البيئات:** (1) عنقود PostgreSQL 18.6 محلي معزول على unix socket بلا شبكة؛ (2) `aigas-staging` = `lucky-salad-43566291` / `br-rough-wind-bdkmg13n` / `neondb` — **SELECT فقط**.
> **لم يُنفَّذ:** أي كتابة أو migration أو GRANT/REVOKE على Neon، أي تغيير Data API، أي commit/push/نشر، أي عملية مدفوعة، أي وصول إلى production.
> **الحالة:** `DB04`–`DB07` **DONE محليًا + VERIFIED قراءة فقط على الهدف**. الإنتاج `NOT VERIFIED`، وcutover وbootstrap ما زالا بوابة منفصلة. `PASS ≠ RELEASED`.

الملفات المرافقة:
- `local-runtime-rls.json` — 69 فحصًا سلوكيًا/بنيويًا على العنقود المحلي (كل شيء داخل معاملات تُلغى).
- `neon-staging-posture.json` — لقطة قراءة فقط لـ36 جدولًا و77 سياسة و25 دالة ومنح الأدوار.
- `docs/RUNTIME-RLS-PERMISSION-MATRIX.md` — المصفوفة الدقيقة ودورة حياة GUC والحدود.
- `docs/DATA-API-EXPOSURE-DECISION.md` — خيارات Data API المعتمدة والمتبقية.

---

## 1. الأوامر المنفَّذة

```bash
# 1) مصفوفة RLS محلية: عنقود PG18 جديد، 25 ترحيلًا، بيانات اصطناعية، 69 فحصًا
node scripts/verify-runtime-rls.mjs \
  --json Audit/p03-runtime-rls-2026-11-10/local-runtime-rls.json

# 2) لقطة وضع الهدف المعزول (SELECT فقط، حارس يرفض أي غير SELECT)
node --env-file=.env.staging.local scripts/audit-runtime-posture.mjs \
  --json Audit/p03-runtime-rls-2026-11-10/neon-staging-posture.json

# 3) انحدار العقود الحالية (36 اختبارًا، 5 قواعد محلية، runtime role، no-egress)
KERNEL_TEST_DATABASE_URL=… FIREWALL_TEST_DATABASE_URL=… \
HUMAN_GATE_TEST_DATABASE_URL=… LEDGER_TEST_DATABASE_URL=… \
RISK_ENGINE_TEST_DATABASE_URL=… node scripts/verify-contracts-local.mjs

# 4) قراءة إعداد Data API من control plane (MCP قراءة فقط)
#    get_data_api(project, branch, database) — production وstaging
```

`verify-runtime-rls.mjs` ينشئ عنقودًا خاصًا تحت `TMPDIR`، ويعيد تمثيل وضع Neon: `neondb_owner` (`BYPASSRLS CREATEROLE`)، `authenticated`/`anonymous`، default ACL يمنح `authenticated` تلقائيًا، و`neon_auth`. يطبّق ترتيب `migrations/` نفسه (`0011/0012/0013/0019` مستبعدة كبدائل تاريخية)، ويُلغي كل معاملة بعد القياس. لا يقرأ `.env` ولا يتصل بأي مضيف.

---

## 2. النتائج

### 2.1 المصفوفة المحلية — 69/69 `PASS`

| المجال | الفحوص | النتيجة |
|---|---|---|
| DB04 (ملكية/سمات/RESET/تصعيد) | 12 | `PASS` |
| DB05 (A/B، غير عضو، GUC، CRUD، تصدير) | 23 | `PASS` |
| DB06 (منح/دوال/أدوار عميلة/مصفوفة أفعال) | 23 | `PASS` |
| DB07 (محتوى المحادثة) | 11 | `PASS` |
| **الإجمالي** | **69** | **`PASS` — صفر FAIL** |

### 2.2 الهدف المعزول — 9/9 فحوص وضع `PASS`

| القياس | القيمة |
|---|---|
| الجداول / RLS / FORCE | 36 / 36 / 2 (`aigas_sc_conversations`, `aigas_sc_messages`) |
| مالكو الجداول | `neondb_owner` = 36، `aigas_runtime` = 0 |
| `aigas_runtime` | `NOSUPERUSER NOBYPASSRLS NOCREATEROLE NOCREATEDB NOREPLICATION NOLOGIN NOINHERIT`، عضويات `[]` |
| السياسات | 77، منها 36 `aigas_client_deny` RESTRICTIVE، و2 `sc_content_participant` تحوي `user_id` |
| منح `authenticated`/`anonymous`/`PUBLIC` | 0 جدول، 0 دالة، 0 تسلسل |
| Default ACL للعميل | 0 (`neon_auth` فقط، لصالح `neondb_owner`) |
| منح `aigas_runtime` | مطابقة محليًا 100% (`PARITY` في مصفوفة الأفعال على 36 جدولًا) |
| منح المحتوى | صفر على `sc_messages`/`sc_conversations` |
| الصفوف | 0 في كل الجداول المفحوصة |
| Ledger | 25/25 `APPLIED` |

DSN المستخدم للقراءة هو `neondb_owner` (`rolbypassrls=true`). سُجّل كـobservation لا كنجاح: هذا اعتماد migrations/ops وليس دور التطبيق. تحويل خدمة Node إلى `aigas_runtime` لم يُنفَّذ ولم يُثبت.

### 2.3 معايير القبول

| المعيار | الحكم | الدليل |
|---|---|---|
| Runtime ليس owner ولا `BYPASSRLS` | **PASS (محلي + كتالوج الهدف)** | سمات الدور + `relowner` = 0 + ليس عضوًا في `neondb_owner`/`authenticated` |
| لا وصول عابر للمؤسسات | **PASS (سلوكي محلي)** | قراءة/كتابة/تحديث/حذف عبر A/B، غير عضو، GUC switch، actor mismatch، `COPY` |
| محتوى Secure Chat للمشارك فقط حتى أمام مدير غير مشارك | **PASS (محلي) / طبقة المنح فقط على الهدف** | مشارك=1، مشارك آخر=1 خاص به، ADMIN غير مشارك=0، مؤسسة أخرى=0، كتابة منسوبة لمؤلف آخر `42501` |
| رفض `authenticated`/`anonymous` والدوال | **PASS (محلي + كتالوج الهدف)** | `42501` على الجداول والدوال؛ `authenticator` كذلك؛ `SET ROLE aigas_runtime` مرفوض |
| تقييد Data API | **NOT DONE — يحتاج تفويضًا** | production `active`/`public`؛ الخيار A/B موثق في `docs/DATA-API-EXPOSURE-DECISION.md` |

**الفرق المهم:** DB07 مُثبت سلوكيًا محليًا بسياسة participant-only على دور اختبار يملك `SELECT/INSERT` على الجدولين (لا نظير له على Neon). على الهدف، لا يملك أي دور غير المالك أي منحة على المحتوى، فالسلوك الفعلي أشدّ من participant-only لكنه لا يختبر المسند نفسه. لا يجوز وصفه كإثبات production.

### 2.4 انحدار العقود

`node scripts/verify-contracts-local.mjs` على عنقود PG18 معزول: **36/36 `PASS`، 0 FAIL، 0 SKIP**. هذا يطابق نتيجة P02 ويؤكد أن إضافة سكربتات P03 لم تغيّر سلوك Kernel/DB18. ملاحظة تشغيلية: الاتصال يجب أن يكون بدور superuser لتجاوز `ALTER ROLE … NOSUPERUSER` في 0025 (انظر F1)؛ في مسار Neon الحقيقي يمر الترحيل من `CREATE ROLE` فلا يظهر العيب.

---

## 3. ما اكتُشف ولم يكن موثقًا

### 3.1 `0025` فرع `ELSE` يفشل على PG18 عند إعادة التطبيق — `MEDIUM`

- **القياس:** على PG 18.6، `neondb_owner` (`CREATEROLE` مع `ADMIN` على `aigas_runtime`) ينفّذ `ALTER ROLE aigas_runtime NOSUPERUSER` → `42501 permission denied to alter role`، والتفصيل: `Only roles with the SUPERUSER attribute may change the SUPERUSER attribute`.
- **الأثر:** إعادة تطبيق `0025` على قاعدة يوجد فيها `aigas_runtime` مسبقًا تفشل قبل إعادة تأكيد الوضع. المسار الأول (`CREATE ROLE`) سليم ومُثبت على staging. بقية السمات (`NOINHERIT/NOBYPASSRLS/NOCREATEDB/NOCREATEROLE/NOREPLICATION`) تُعدّل بنجاح بلا superuser.
- **لم يُعدّل `0025` في هذه المهمة:** تعديله يغيّر sha256 ويبطل تطابق ledger على staging المعزول، ويحتاج إعادة بناء/إثبات parity. التوصية: نقل `NOSUPERUSER` إلى حارس صريح (`RAISE` إن كان الدور الحالي superuser) وإبقاء بقية `ALTER` — أو تطبيق إعادة التهيئة بدور superuser موثّق في runbook.

### 3.2 سطح أفعال أوسع من الحاجة عبر `ELSE` — `MEDIUM` (تصميمي، مفتوح من P02 §3.4)

سبعة جداول تحصل على `SELECT, INSERT, UPDATE, DELETE` لأنها غير مذكورة في قوائم `0025` §3: `department_memberships`, `fw_rules`, `hg_delegations`, `hg_grants`, `hg_policies`, `memberships`, `re_assessments`. RLS تقيّد الصفوف (مثبت)، لكن أي جدول جديد يرث CRUD صامتًا. التوصية: قوائم صريحة + `RAISE` على غير المعروف في ترحيل لاحق (`0030`)، لا بتعديل ترحيل مطبّق.

### 3.3 `FORCE RLS` ليس حماية من المالك — `INFO` مؤكَّد

القياس: `neondb_owner` قرأ رسالتي المحادثة رغم `FORCE` على الجدولين، لأنه `BYPASSRLS`. هذا ليس عيبًا في `0027`; هو سبب اعتماد cutover إلى `aigas_runtime` كضابط فعلي. توثيق ذلك يمنع قراءة `relforcerowsecurity=true` كشهادة أمان.

### 3.4 حدود مصادقة RLS — `INFO` تصميمي

`aigas_runtime` يستطيع ضبط أي UUID في `aigas.user_id`. لذلك RLS تعزل المؤسسات ولا تصادق الهوية. الحد الفعلي هو تحقق JWT/العضوية في الخادم ثم ضبط السياق داخل معاملة. أي منح لـ`aigas_runtime` لمسار عميل يمحو هذا الحد. موثق في المصفوفة §4.

### 3.5 Data API على production ما زال مكشوفًا — `HIGH` (مفتوح)

`get_data_api` (قراءة 2026-11-10T11:51:12Z): `status=active`, `db_schemas=["public"]`, `db_anon_role=anonymous`, `db_aggregates_enabled=true`. staging بلا Data API. الحماية الحالية (صفر منح + سياسة deny) تمنع الوصول لكنها لا تغلق السطح. يحتاج قرار مالك (خيار A/B).

---

## 4. حدود الدليل

| البند | الحالة | السبب |
|---|---|---|
| DB04 على عنقود محلي معزول | `PASS` | 12 فحصًا + كتالوج |
| DB04 على الهدف المعزول (كتالوج) | `PASS` | قراءة فقط، 9/9 |
| DB05 سلوكيًا | `PASS` محليًا | لا كتابة/بيانات على Neon |
| DB06 محليًا وعلى الهدف | `PASS` | `PID`/كتالوج؛ Data API نفسه لم يُختبر عبر REST |
| DB07 محليًا | `PASS` | بدور اختبار بمنحة مؤقتة داخل عنقود يُدمَّر |
| DB07 على الهدف | `PASS` لمنع المنح فقط | لا منحة لأي دور، فلا يُقيَّم المسند حيًّا |
| خدمة Node متصلة بـ`aigas_runtime` | `NOT RUN` | يحتاج login/سر وإعادة تشغيل خدمة |
| تعطيل/تقييد Data API | `NOT DONE` | إجراء control plane يحتاج تفويضًا |
| bootstrap/قبول الدعوة تحت RLS | `BLOCKED` | مسار مميز غير معتمد (P05) |
| استعادة/RPO/RTO | `NOT RUN` | بوابة P17 |
| production | `NOT VERIFIED` | لم يُلمس |

`PASS` هنا يعني أن الوضع والسلوك مطابقان للمعيار على بيئة معزولة أو بقراءة كتالوج، ولا يعني إطلاقًا ولا امتثالًا شاملًا.

---

## 5. التغييرات في المستودع

| الملف | النوع |
|---|---|
| `scripts/verify-runtime-rls.mjs` | جديد — 69 فحصًا، عنقود PG18 مؤقت، بلا شبكة |
| `scripts/audit-runtime-posture.mjs` | جديد — لقطة وضع للهدف بحارس SELECT فقط |
| `docs/RUNTIME-RLS-PERMISSION-MATRIX.md` | جديد — المصفوفة والحدود |
| `docs/DATA-API-EXPOSURE-DECISION.md` | جديد — خيارات A/B/C والاعتمادات |
| `docs/TENANT-ISOLATION-VERIFICATION.md` | تحديث — ما نُفّذ وما بقي |
| `Audit/p03-runtime-rls-2026-11-10/*` | جديد — 3 ملفات دليل |
| `.agents/mind/01-mind-latest.md` | تحديث مختصر |

لا تعديل على `src/` ولا `migrations/` ولا الاختبارات ولا workflows. `.env` و`.env.staging.local` مستبعدان من git وبصلاحية `600`، ولم تُطبع أي قيمة سر. لم تُنشأ أدوار أو منح على Neon؛ أدوار الاختبار (`p03_content_probe`, `p03_runtime_login`) موجودة فقط داخل العنقود المؤقت الذي يُدمَّر.

---

## 6. خطة التراجع (إن نُفّذت خطوة إنتاج)

1. **Data API:** إعادة `provision_neon_data_api` بنفس `db_schemas` السابق، أو إرجاع `db_schemas=["public"]` — بلا لمس SQL.
2. **cutover الدور:** إرجاع `DATABASE_URL` إلى اعتماد `neondb_owner` المعتمد مؤقتًا (يعيد التجاوز لكنه يحفظ التوافر)، ثم مراجعة سبب الفشل.
3. **منح خاطئة:** `REVOKE` فوري من الدور المعني + إعادة تشغيل فحص الوضع (`audit-runtime-posture.mjs`) للتأكد من 9/9.
4. **فشل ترحيل:** لا rollback آلي؛ العنقود المحلي يُدمَّر، والهدف المعزول يُعاد بناؤه من `migrations/` بعد اعتماد. لا يُعاد استخدام قاعدة مشتركة.
