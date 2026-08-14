# تقرير تدقيق QC Task Manager — Evidence-First Audit

- **تاريخ التدقيق:** 2026-08-14
- **Commit/branch:** `7598873a` على `main`
- **المنفذ:** وكيل تدقيق مستقل (read-only) — تم بالكامل بدون تعديل ملفات
- **المصادر:** `audit/qc/{PROMPTS.md, prompt2.md, prompt3.md}` كمتطلبات، `audit/qc/REPORT.md` كمرجع سياق فقط، `apps/qc-task-manager/` كالكود الفعلي، `.agents/brain.md` كآخر حالة معروفة

## نطاق التدقيق

- تطبيق `apps/qc-task-manager` كاملًا: الكود، الإعدادات، قاعدة البيانات، migrations، الاختبارات، الواجهات، التوثيق.
- مطابقة المتطلبات من `PROMPTS.md` (12 برومبت) + `prompt2.md` (18 برومبت مصححة) + `prompt3.md` (Master Baseline + Migrations + Hardening + DR + AI).
- **القواعد الملتزمة:** read-only بالكامل — ما عدّل أي ملف داخل الريبو، ما أنشأ ملفات، ما نفّذ أوامر شبكة أو نشر، ما طبعت أي قيمة سر، ما لمس أي قاعدة بيانات حقيقية (كل الفحوصات على قواعد مؤقتة في `/tmp`). `git status` بعد الجلسة: التعديل الوحيد هو `.agents/brain.md` الموجود مسبقًا.

## حدود التدقيق (ما لم يُختبر)

- لا وصول إنتاجي (Render/disk/env حقيقي).
- لا live Groq request (قواعد التدقيق تمنع أوامر الشبكة — رغم وجود `GROQ_API_KEY` في بيئة الجلسة).
- لا فحص a11y يدوي (كيبورد/قارئ شاشة).
- لا load/performance test ولا قياس Core Web Vitals.
- لا production restore drill.

---

## 1. القرار التنفيذي

**القرار: NO-GO للإطلاق الإنتاجي — CONDITIONAL GO كتطبيق داخلي محلي (Pilot)**

النظام **قوي وظيفيًا ومُتحقق محليًا بدرجة عالية جدًا**، لكنه **ليس جاهزًا إنتاجيًا** — نفس P0 blockers من تدقيق 2026-08-12 ما زالت قائمة:

1. **لا يوجد سطح نشر فعلي للـ QC:** `render.yaml` يعرّف خدمة واحدة فقط (`brightai-site`)، ولا يوجد أي مرجع للـ QC → لا service، لا persistent disk، لا env config. **P0**
2. **لا يوجد health endpoint للـ QC:** لا `/api/health` ولا أي route صحية (النتيجة الوحيدة لكلمة "health" في src هي نص في `admin/settings`). **P0**
3. **تكامل Groq الحي غير مُتحقق:** التصميم والحوكمة قوية ومُختبرة بـ mocks، لكن لا اختبار حي واحد على مزوّد خارجي → لا يُمنح AI أي درجة Verified. **P0**
4. **CSP فيه `style-src 'unsafe-inline'`** قائم (P1 أمني موثق سابقًا وما زال قائمًا).
5. **أدلة تشغيلية إنتاجية مفقودة:** restore drill حي، load test، تدقيق a11y يدوي، CWV — كلها Unverified.

**الفصل الصريح:** "قوي وظيفيًا" = 265 اختبار وحدة + 386 فحص E2E حي عبر متصفح حقيقي على قواعد مؤقتة + typecheck/build/guards نظيفة. "جاهز إنتاجيًا" = لا، لأن معايير الإنتاج (health، deployment surface، persistent storage، live integration، DR drill) غير مثبتة إطلاقًا.

---

## 2. Scorecard

**نموذج النسب:** Verified=100 / Implemented but not freshly verified=70 / Partial=40 / Missing=0 / Blocked=خارج المقام (يُعرض منفصلًا). `Coverage % = مجموع الدرجات ÷ عدد المتطلبات القابلة للتقييم`.

| المجال | النسبة | الثقة | الحالة | الدليل المختصر | العائق الرئيسي |
|---|---|---|---|---|---|
| Functional Coverage | **92%** (31 متطلب: 26 Verified، 3 Implemented، 1 Partial، 1 Missing) | High | ✅ متقدم | 265 unit + 386 E2E حي + build | REPOSITORY-AUDIT.md مفقود، saved-filter UI جزئي، exports بلا اختبار مباشر |
| Tests & Verification | **88%** | High | ✅ قوي محليًا | `pnpm test` 265/0، E2E 386/0، typecheck 0/0/13، build ✅ | لا live Groq، لا load، لا a11y يدوي |
| Security | **78%** | Medium-High | ⚠️ جيد | hygiene ✅، lockout/CSRF/headers/upload validation، CSP script-src بلا unsafe-inline | `style-src 'unsafe-inline'`، rate limit in-memory، أسرار تاريخية في Git history |
| RBAC & Authorization | **92%** | High | ✅ | permissions.ts مصدر وحيد + إعادة تحقق server-side في كل API + E2E (IDOR/field-locking/role gating) | UI ليس authority (مطبق صحيحًا) |
| Database & Migrations | **90%** | High | ✅ | قاعدة طازجة: 29 جدول/51 فهرس/integrity ok/0 FK violations، 10 migrations، محرك checksum+rollback | كتابة متزامنة SQLite (BUSY ~5.4s سابقًا) — مقبول لأداة داخلية |
| Backup & Disaster Recovery | **78%** | Medium | ⚠️ | e2e-backup 13/13، restore مع verification+confirmation+safety backup، retention 14، RESTORE.md | لا restore drill إنتاجي، scheduler in-process، تحذيرات CANTOPEN |
| Audit Integrity | **82%** | High | ✅ | SHA-256 chain (audit-integrity tests PASS)، canonical JSON، append ذري | SQLite ليس immutable فعليًا، cascade يحذف سجل المهمة المحذوفة |
| AI/Groq Governance | **70%** (سقف إجباري — live غير متحقق) | Medium | ⚠️ | mocks: injection/PII/timeout/429/500/consent/auth، لا BLOB يُرسل للمزوّد، server-only boundary، audit trail | **لا live test** → لا Verified أبدًا |
| UI/UX | **75%** | Medium | ⚠️ | dashboard 45 E2E + بصري (0 overflow 1440/390 + 0 console errors)، empty/loading/error states، badging نصي+لوني | navbar overflow @768px، لا skip link، login يعرض creds الافتراضية |
| Accessibility & Responsive | **65%** | Low-Medium | ⚠️ | labels/aria/focus-visible/semantic موجودة، E2E بصري 390/1440 | لا skip-to-content، لا فحص كيبورد/قارئ شاشة، reduced-motion غير محقق، contrast غير مقاس |
| Performance | **45%** | Low | ❌ Unverified | لا قياسات طازجة (لا Lighthouse/load) | ميزانيات CWV غير مثبتة في هذه الجلسة |
| Documentation & Operability | **82%** | High | ✅ | README/DEPLOYMENT/DATABASE/MIGRATIONS/RESTORE/TESTING/ACCEPTANCE-CHECKLIST/SECURITY/AI docs | `SESSION_SECRET` موثق لكنه غير مقروء من الكود، REPOSITORY-AUDIT.md مفقود |
| Deployment & Production Readiness | **35%** (سقف إجباري 40%) | Low | ❌ | لا service في render.yaml، لا health، لا persistent disk، Groq live unverified | **P0 blockers الثلاثة** → NO-GO |

---

## 3. Requirement Traceability Matrix

الحالة: ✅ Verified / 🟡 Implemented (غير متحقق طازجًا) / 🟠 Partial / ❌ Missing / ⛔ Blocked.

### من `PROMPTS.md` (الحزمة الأساسية 00–12)

| Requirement ID | المصدر | المتطلب | الحالة | نسبة | الدليل | المتبقي |
|---|---|---|---|---|---|---|
| P00-01 | PROMPTS 00 | سياق عام: قواعد العمل الستة + الأدوار | ✅ | 100 | `src/lib/task-policy.ts`, `permissions.ts` + tests | — |
| P01-01 | PROMPTS 01 | Scaffold Astro SSR + node standalone + Tailwind + islands | ✅ | 100 | `astro.config.mjs`, `package.json`, build ✅ | — |
| P02-01 | PROMPTS 02 | Schema: users/tasks/comments/attachments/activity/delete_requests/sessions | ✅ | 100 | قاعدة طازجة 29 جدول (توسّعت)، integrity ok، 0 FK violations | — |
| P02-02 | PROMPTS 02 | Seed admin عند فراغ users + تحذير كلمة المرور الافتراضية | ✅ | 100 | `seed.ts`, تحذير `ADMIN_DEFAULT_PASSWORD` على كل تشغيل | رفع التحذير بالإنتاج |
| P03-01 | PROMPTS 03 | Login/bcrypt/sessions 12h/httpOnly/SameSite/Secure + رسالة عامة | ✅ | 100 | `auth.ts`, `session.ts`, e2e-auth-lockout 44/44 | — |
| P03-02 | PROMPTS 03 | Lockout 5 محاولات×10د + middleware route guards | ✅ | 100 | e2e-auth-lockout + test-db-rules lockout checks | — |
| P04-01 | PROMPTS 04 | توجيه حسب الدور + permissions.ts مصدر وحيد | ✅ | 100 | `permissions.ts`, `middleware.ts` | — |
| P05-01 | PROMPTS 05 | /admin/users: قائمة/إنشاء/تعديل/reset/تفعيل + منع self-demotion + Zod | ✅ | 100 | e2e-admin-users 49/49 | — |
| P06-01 | PROMPTS 06 | إنشاء/تعديل مهام + recurrence + dependencies + إشعارات + urgent | ✅ | 100 | e2e-task-shared 196/196 | — |
| P07-01 | PROMPTS 07 | صفحة الموظف + field locking صارم (server-side whitelist) | ✅ | 100 | `taskUpdates.ts` + E2E (title عبر update → 400) | — |
| P08-01 | PROMPTS 08 | تعليقات/مرفقات/activity log | ✅ | 100 | e2e-task-shared | — |
| P09-01 | PROMPTS 09 | Closure wizard 3 خطوات + evidence + skip مسجل + comment إلزامي + ترانزاكشن واحد | ✅ | 100 | e2e-task-shared (wizard بمتصفح حقيقي، إلغاء → لا يُحفظ شي) | — |
| P10-01 | PROMPTS 10 | طلبات الحذف (موظف يطلب، مدير يعتمد/يرفض) | ✅ | 100 | e2e-delete-request 39/39 | — |
| P11-01 | PROMPTS 11 | Dashboard 6 KPI + 3 charts + جدولان + فلاتر + حجب الموظف | ✅ | 100 | e2e-dashboard (توسّع لاحقًا) | — |
| P12-01 | PROMPTS 12 | Security pass + UX + SEED_DEMO + README | ✅ | 100 | hygiene ✅ + 386 E2E + README (846 سطر) | — |

### من `prompt2.md` (النسخة المصححة الموسعة 00–18)

| Requirement ID | المصدر | المتطلب | الحالة | نسبة | الدليل | المتبقي |
|---|---|---|---|---|---|---|
| P2-00-01 | PROMPT 00 | `docs/REPOSITORY-AUDIT.md` | ❌ | 0 | غير موجود في `apps/qc-task-manager/docs/` | إنشاء ملف توثيقي قصير (P3) |
| P2-01-01 | PROMPT 01 | بنية مستقلة لا تكسر BRIGHTAI + scripts | ✅ | 100 | workspace ملفوفة بـ `apps/*`، build مستقل | — |
| P2-02-01 | PROMPT 02 | 12 جدول بمواصفات حرفية + CHECKs + فهارس + CASCADE/RESTRICT/SET NULL | ✅ | 100 | قاعدة طازجة: 29 جدول/51 فهرس/0 FK violations | — |
| P2-03-01 | PROMPT 03 | `QC_DATABASE_PATH` + pragmas الأربعة + prepared statements + تحقق إقلاع | ✅ | 100 | `db.ts` (سطر 250-258) + `validateSchema` + `test-db-rules` | — |
| P2-03-02 | PROMPT 03 | SQLTools docs + `.vscode/settings.json` | ✅ | 100 | `docs/SQLTOOLS.md` (`.vscode` gitignored) | — |
| P2-04-01 | PROMPT 04 | Auth كامل + middleware + role checks server-side | ✅ | 100 | e2e-auth-lockout 44/44 | — |
| P2-05-01 | PROMPT 05 | Admin 12 ميزة (last login, department, edit كامل) | ✅ | 100 | e2e-admin-users 49/49 | — |
| P2-06-01 | PROMPT 06 | Task model كامل + recurrence بلا مهام لا نهائية + dependencies + override بسبب | ✅ | 100 | e2e-task-shared 196/196 | — |
| P2-07-01 | PROMPT 07 | قواعد server-side حرفية (whitelist, on_hold blocker, progress 0-100) | ✅ | 100 | `taskUpdates.ts` + E2E | — |
| P2-08-01 | PROMPT 08 | Lifecycle 5 حالات + started_at + wizard + cancelled/reopen | ✅ | 100 | e2e-task-shared + `task-policy.ts` | — |
| P2-09-01 | PROMPT 09 | /tasks/[id] 12 قسم + attachments آمنة + activity كامل | ✅ | 100 | E2E download authorization + activity | — |
| P2-10-01 | PROMPT 10 | إشعارات 11 حدث + mark one/all + dropdown + بلا إشعار لغير النشطين | ✅ | 100 | e2e-task-shared سيناريو 10 | — |
| P2-11-01 | PROMPT 11 | Delete requests + cascade + إشعار + log | ✅ | 100 | e2e-delete-request 39/39 | — |
| P2-12-01 | PROMPT 12 | Dashboard موسّع: 9 KPI + 6 charts + 5 tables + 8 فلاتر | ✅ | 100 | e2e-dashboard 45/45 + بصري | — |
| P2-13-01 | PROMPT 13 | بحث متقدم + pagination + sorting + فلترة server-side | 🟡 | 70 | `taskSearch.ts`, `search.astro`, `e2e-task-search.mjs` موجود — خارج سويت acceptance | إضافة search لـ `e2e:acceptance` |
| P2-13-02 | PROMPT 13 | Saved filters لكل مستخدم | 🟠 | 40 | جدول `saved_filters` موجود | لا UI مؤكد للإنشاء/التطبيق |
| P2-13-03 | PROMPT 13 | CSV + XLSX + PDF | 🟡 | 70 | `api/export/tasks.csv.ts`, `search.csv.ts`, `search.xlsx.ts`, `tasks/pdf/[id].ts` (CSV مختبر unit) | XLSX/PDF بلا اختبار مباشر طازج |
| P2-14-01 | PROMPT 14 | Checklist داخل كل مهمة + metadata QC اختيارية | ✅ | 100 | e2e-task-shared + test-templates | — |
| P2-15-01 | PROMPT 15 | Security hardening كامل (CSRF/rate limit/content-type/headers/Zod/upload) | ✅ | 100 | `api-security.ts`, hygiene ✅, E2E | `style-src 'unsafe-inline'` |
| P2-16-01 | PROMPT 16 | Backup يومي + retention 14 + restore موثق | ✅ | 100 | e2e-backup 13/13 + `RESTORE.md` + `restore-db.mjs` | scheduler in-process، drill إنتاجي |
| P2-17-01 | PROMPT 17 | Unit + integration + acceptance | ✅ | 100 | 265 unit + 386 E2E | — |
| P2-18-01 | PROMPT 18 | وثائق النشر (README/SQLTOOLS/ROLES/DEPLOYMENT/DATABASE/TESTING) | ✅ | 100 | كل الملفات موجودة | `render.yaml` بلا QC + `SESSION_SECRET` غير مقروء |

### من `prompt3.md` (الإضافات)

| Requirement ID | المصدر | المتطلب | الحالة | نسبة | الدليل | المتبقي |
|---|---|---|---|---|---|---|
| P3-01-01 | PROMPT 01 | محرك migrations تسلسلي (checksum, rollback, حارس destructive) | ✅ | 100 | 10 migrations مطبقة طازجًا، `test:migrations` PASS | — |
| P3-02-01 | PROMPT 02 | Security hardening + Groq security | ✅ | 100 | hygiene ✅ + docs | — |
| P3-03-01 | PROMPT 03 | اختبارات شاملة + AI tests | ✅ | 100 | 265 unit (ai-foundation/features داخلهم) | — |
| P3-04-01 | PROMPT 04 | Backup/DR + verify | ✅ | 100 | e2e-backup + restore unit (5 فحوصات) | drill إنتاجي |
| P3-05-01 | prompt3 إضافي | SLA Engine (policies, escalation, idempotency) | ✅ | 100 | `test:sla` PASS | scheduler خارجي غير موجود |
| P3-06-01 | prompt3 إضافي | Workflow Engine (definitions/steps/instances/actions + snapshot) | ✅ | 100 | `test:workflow` PASS | — |
| P3-07-01 | prompt3 إضافي | Findings/CAPA/RCA + Evidence + RBAC | ✅ | 100 | `test:qc-operations` PASS + routes موجودة | لا E2E متصفح لـ /findings |
| P3-08-01 | prompt3 إضافي | Audit Integrity: SHA-256 chain | ✅ | 100 | `test:audit-integrity` PASS | SQLite غير immutable |
| P3-09-01 | prompt3 إضافي | AI/Groq: features + schemas + redaction + injection + human-review | 🟡 | 70 | `test:ai-foundation` + `test:ai-features` (mocked) PASS | **live غير متحقق → لا Verified** |
| P3-10-01 | prompt3 إضافي | Evidence templates + dashboard reports | ✅ | 100 | `test:templates` + `test:dashboard-reports` PASS | — |

**تعارضات وحلول:** (1) `PROMPTS.md` PROMPT 02 = 4 حالات/3 أولويات مقابل `prompt2.md` = 5 حالات/4 أولويات → اعتُمد prompt2 (النسخة "المصححة التي تلغي التعارضات" حسب ترويسة الملف) والكود فعليًا 5/4. (2) نسب `REPORT.md` (~90%) = تقرير قديم → استُبدلت بأدلة طازجة (265/386 اليوم). (3) "cancelled requires manager/admin approval" — مطبقة (cancel محصور بـ manager/admin + سبب إلزامي).

---

## 4. نتائج التحقق المنفذ (كلها Local — صفر أوامر إنتاجية)

| # | الأمر | الوقت | Exit | النتيجة | Local/Prod |
|---|---|---|---|---|---|
| 1 | `git rev-parse --short HEAD` | 15:53 | 0 | `7598873a` / main | Local |
| 2 | `pnpm --filter @brightai/qc-task-manager typecheck` | 15:53 | 0 | **0 errors / 0 warnings / 13 hints** (144 ملف) | Local |
| 3 | `pnpm --filter @brightai/qc-task-manager test` (×2) | 15:54 | 0 | **265 passed, 0 failed** — migrations/architecture/qc-operations/templates/audit-integrity/ai-foundation/ai-features/domain/sla/workflow/db-rules/dashboard-reports | Local |
| 4 | `node scripts/architecture-guard.mjs` | 15:55 | 0 | **passed** — canonical ownership + trust boundaries | Local |
| 5 | `node scripts/verify-security-hygiene.mjs` | 15:55 | 0 | **passed** | Local |
| 6 | `NODE_ENV=production pnpm build` | 15:55 | 0 | **Server built** (تحذير Vite إعلامي واحد) | Local |
| 7 | `pnpm e2e:acceptance` (Playwright chromium، قواعد مؤقتة) | 15:56 | 0 | **386/0**: admin-users 49 + auth-lockout 44 + task-shared 196 + delete-request 39 + dashboard 45 + backup 13 + **restart-persistence ✅** | Local |
| 8 | `QC_DATABASE_PATH=/tmp/... node scripts/init-db.mjs` + فحص | 15:57 | 0 | قاعدة طازجة: **29 جدول، 51 فهرس، integrity=ok، 0 FK violations**، 10 migrations (initial→ai_evidence_status) | Local (temp) |
| 9 | `pnpm lint` (الجذر) | 15:58 | **1** | **FAIL** — كله في `apps/dashboard` (`logger.ts:81` no-explicit-any + تحذيرات unused)؛ **QC لا يملك lint script** | Local |
| 10 | فحص `GROQ_API_KEY` | 15:53 | — | **موجود** في بيئة الجلسة (قيمته لم تُعرض) — لم يُستخدم | Local |
| 11 | فحص render.yaml | 15:53 | — | خدمة واحدة `brightai-site`، **صفر مراجع للـ QC** | Local |

**تفسير failures:**
- **Lint (الوحيد الفاشل):** خارج QC تمامًا (dashboard) — لكن الـ monorepo ككل بلا بوابة lint ناجحة.
- **تحذيرات `SQLITE_CANTOPEN` (×4 أثناء الاختبارات):** من backup-scheduler يحاول أخذ backup على قاعدة مؤقتة حُذفت. غير فادحة لكنها ضجيج (G-09).
- **تحذير Vite في build:** إعلامي (db.ts static+dynamic import).

---

## 5. الفجوات والمخاطر

| ID | الأولوية | المشكلة | الأثر | الدليل | الحل الجذري | الجهد | معيار القبول |
|---|---|---|---|---|---|---|---|
| G-01 | **P0** | لا خدمة QC في `render.yaml` (لا service/disk/env) | لا يمكن النشر إطلاقًا | grep render.yaml = 0 مراجع QC | تعريف Node Web Service + persistent disk `/var/data` + env vars | M | deploy ناجح + data باقية بعد redeploy |
| G-02 | **P0** | لا `/api/health` للـ QC | لا readiness/liveness لأي orchestrator | grep health في src = نص فقط | إضافة route صحية تعيد DB check + schema version | XS | `GET /api/health` → 200 JSON |
| G-03 | **P0** | Groq live غير متحقق | ادعاء AI production غير مسموح | mocks فقط؛ لا live request | تشغيل smoke حقيقي بمفتاح + تحقق redaction | S | استجابة حية صالحة Zod + لا تسريب |
| G-04 | P1 | `style-src 'unsafe-inline'` في CSP | يضعف CSP ضد حقن style | `middleware.ts` سطر CSP | ترحيل الـ styles لهاشات/ملفات خارجية + verify script | M | verify-csp يمر |
| G-05 | P1 | أسرار مزودين سابقة في Git history (compromised) | تعرض طويل الأمد | brain QC-SECURITY-HARDENING-002 | revoke/rotate خارجي لكل مفتاح متسرب | S (خارجي) | لا مفتاح قديم صالح |
| G-06 | P1 | `SESSION_SECRET` موثق كمطلوب لكن الكود لا يقرؤه | توثيق مضلل | `grep SESSION_SECRET src/` = صفر | حذف من الوثائق أو اعتماده فعليًا | XS | docs تتطابق مع الكود |
| G-07 | P1 | كلمة المرور الافتراضية `admin123` ظاهرة + تحذير على كل تشغيل | خطر فوري عند أي تعريض | login.astro + رسائل seed | اشتراط ADMIN_DEFAULT_PASSWORD قبل أول إقلاع خارج localhost | S | لا إقلاع بدون متغير |
| G-08 | P1 | لا restore drill إنتاجي | DR غير مثبت | لا وصول إنتاجي | runbook تحقق شهري على نسخة | S | drill موثق بالتاريخ |
| G-09 | P2 | تحذيرات `SQLITE_CANTOPEN` من backup-scheduler | ضجيج + حالة backup فاشلة زورًا | سجل الاختبارات | تخطّي backup إذا غاب الملف | XS | صفر CANTOPEN بالاختبارات |
| G-10 | P2 | rate limit in-memory لكل عملية (ليس موزعًا) | 2+ instances = حدود منفصلة | `api-security.ts` | توثيق قيد single-instance أو limiter مشترك | S | موثق في SECURITY.md |
| G-11 | P2 | navbar overflow عند 768px (مسبق) | تجربة تابلت | brain QC-DASHBOARD-V2-001 | إصلاح Navbar | S | 0 overflow @768 |
| G-12 | P2 | لا skip-to-content + reduced-motion + contrast غير مقاس | a11y ناقص معايير إلزامية | BaseLayout.astro | skip link + prefers-reduced-motion + فحص axe | S | axe 0 حرج |
| G-13 | P2 | لا load/performance test + لا CWV | أداء غير مثبت | لا قياسات طازجة | Lighthouse على build محلي + ميزانية | M | LCP<2.5s |
| G-14 | P2 | `REPOSITORY-AUDIT.md` مفقود (P2-00) | توثيق ناقص | غياب الملف | إنشاؤه من brain/architecture | XS | موجود ومرتبط |
| G-15 | P3 | XLSX/PDF export وsearch بلا اختبار مباشر في acceptance | تغطية ناقصة | سويتات acceptance الحالية | إضافة suites لـ search/exports/findings | M | فحوصات جديدة تمر |

---

## 6. UI/UX/A11y Review

**الأدلة:** E2E بمتصفح chromium حقيقي (390px/1440px، 0 console errors، 0 overflow) + مراجعة كود المصدر. لم يُفحص يدويًا.

| المسار | الدور | الحالة | المشاكل | الأثر | التحسين المقترح | دليل الفحص |
|---|---|---|---|---|---|---|
| /login | عام | ✅ جيد | يعرض credentials الافتراضية | كشف بيانات دخول عامة | إخفاؤها إلا إذا ADMIN_DEFAULT_PASSWORD غير معيّن | code review |
| /employee | employee | ✅ جيد | tabs + lock icons + badges | — | — | task-shared E2E |
| /manager, /supervisor | manager/supervisor | ✅ جيد | جداول + فلاتر + New Task + urgent بارز | — | — | task-shared E2E |
| /dashboard | admin/manager/supervisor | ✅ ممتاز | 9 KPI + 6 charts + 5 tables + فلاتر + states | — | — | 45/45 E2E + بصري 1440/390 |
| /tasks/[id] | حسب الدور | ✅ جيد | 12 قسم كامل | — | ربط زر تصدير PDF بالواجهة | code review + E2E |
| /findings, /findings/[id] | supervisor/manager/admin | 🟡 غير مفحوص بمتصفح | لا E2E | فجوات UI غير مكتشفة | إضافة suite E2E + screenshots | qc-operations tests فقط |
| /reports | manager/admin | 🟡 غير مفحوص بمتصفح | نفسه | نفسه | إضافة suite | dashboard-reports tests فقط |
| /admin/users | admin | ✅ جيد | أعمدة + edit + حماية self-row + 0 overflow | — | — | 49/49 E2E + بصري |
| /admin/settings | admin | ✅ جيد | إعدادات + حالة backup | — | — | code review |

**أفضل 10 تحسينات UI/UX:**
1. Skip-to-content link في BaseLayout (أول عنصر قابل للتركيز).
2. إصلاح overflow الـ Navbar @768px.
3. إخفاء بيانات الدخول الافتراضية من /login في غير وضع dev.
4. زر "Download PDF" في صفحة المهمة (route موجود والواجهة ما تعرضه).
5. UI saved filters على /search (إنشاء/تطبيق/حذف).
6. تمديد acceptance بمسارات /findings و /reports و /search مع لقطات 360/1440.
7. إبراز "AI Generated" واعتماد البشر مرئيًا في كل لوحات AI.
8. prefers-reduced-motion على الـ wizard و transitions الجزر.
9. قوائم إجراءات سريعة في صفوف المهام (status change سريع) مع confirm للحرجة.
10. توحيد Badge "Deletion requested" وسجل الرفض عبر كل القوائم.

---

## 7. خطة الإغلاق

| # | البند | المالك المقترح | الملفات المتأثرة | الاختبار المطلوب | معيار الإغلاق |
|---|---|---|---|---|---|
| 1 | P0: خدمة QC في render.yaml + health + disk | المستخدم (قرار نشر) | `render.yaml`, `src/pages/api/health.ts` | deploy حي + curl health | 200 + data باقية |
| 2 | P0: Groq live smoke | المطوّر | `scripts/test-ai-foundation.mjs` | تشغيل بمفتاح حقيقي | response Zod-valid + audit sanitized |
| 3 | P1: CSP style-src | المطوّر | `src/middleware.ts` + CSS | verify-csp script | يمر |
| 4 | P1: rotation أسرار تاريخية | المستخدم (خارجي) | — | فحص تسرب | لا مفتاح قديم صالح |
| 5 | P1: ADMIN_DEFAULT_PASSWORD إلزامي خارج localhost | المطوّر | `src/lib/seed.ts` | اختبار وحدة | إقلاع يرفض بدونه |
| 6 | P1: restore drill | المستخدم | `docs/DISASTER-RECOVERY.md` | drill موثق | مرّ drill على نسخة |
| 7 | P2: acceptance موسّع | المطوّر | `scripts/e2e-acceptance.mjs` + suites | `pnpm e2e:acceptance` | 0 failed |
| 8 | P2: skip link + reduced-motion + axe | المطوّر | `BaseLayout.astro`, islands | فحص axe | 0 حرج |
| 9 | P2: إصلاح CANTOPEN + توثيق single-instance | المطوّر | `backup-scheduler.ts`, `SECURITY.md` | pnpm test | صفر تحذيرات |
| 10 | P3: REPOSITORY-AUDIT.md + saved-filters UI | المطوّر | docs + `search.astro` | — | موجود ومربوط |

---

## 8. ما لا يمكن إثباته الآن

- **Groq live integration:** يتطلب مفتاحًا حقيقيًا وتشغيل شبكة — **Unverified** (المفتاح موجود في البيئة لكن التدقيق read-only).
- **Render/production surface:** service/health/disk/env/HTTPS/backups الإنتاجية — **Blocked**.
- **Persistent storage proof:** يتطلب deploy + redeploy على Render.
- **Production restore drill:** يتطلب بيئة إنتاجية أو نسخة طبق الأصل.
- **Browser/manual accessibility:** فحص يدوي (كيبورد/قارئ شاشة).
- **Load/performance testing:** أدوات قياس وجولة مخصصة.
- **الأسرار التاريخية:** revoke/rotate خارجي.

---

## 9. الخلاصة الصريحة

- **وش المكتمل فعلًا؟** كل المتطلبات الوظيفية الجوهرية: auth أمني كامل، RBAC server-side، field locking، lifecycle 5 حالات مع wizard، notifications، delete requests، dashboard موسّع، search/export، checklist، findings/CAPA/RCA، SLA، workflows، audit chain SHA-256، backup/restore، حوكمة Groq مصممة بعناية. **الأدلة اليوم: 265 unit + 386 E2E حي + typecheck/build/guards نظيفة + قاعدة طازجة سليمة.**
- **وش يعمل محليًا فقط؟** كل ما سبق — على قواعد مؤقتة وخوادم محلية. حتى `e2e:acceptance` الكامل (386) يعمل في هذه البيئة.
- **وش غير مثبت؟** Groq الحي، النشر على Render، health endpoint، persistent disk، restore drill إنتاجي، load/CWV، a11y يدوي.
- **وش يمنع الإطلاق؟** P0s: (1) لا تعريف خدمة QC في render.yaml، (2) لا /api/health، (3) Groq live غير متحقق + P1: CSP unsafe-inline وأسرار تاريخية.
- **أقصر طريق واقعي لـ Conditional GO ثم GO:**
  1. health route + إصلاح CANTOPEN + إلزام ADMIN_DEFAULT_PASSWORD خارج localhost (ساعة).
  2. إضافة خدمة QC لـ render.yaml + disk + env (ساعتين).
  3. Groq live smoke (ساعة).
  4. CSP style migration + rotation خارجي (نصف يوم).
  5. عندها Conditional GO للإنتاج → GO بعد drill ناجح وأسبوع monitoring.

---

## Next 5 Actions

1. أضف `/api/health` للـ QC (route بسيطة ترجع 200 + schema version) — XS.
2. عرّف خدمة QC في `render.yaml` (Node web service + persistent disk `/var/data` + env vars) — M.
3. شغّل Groq live smoke بمفتاح حقيقي (`test-ai-foundation`) وتحقق من Zod + redaction — S.
4. رحّل `style-src` من 'unsafe-inline' وشغّل `verify-csp-no-unsafe-inline` — M.
5. وسّع `e2e:acceptance` ليشمل search/findings/reports/exports + أضف skip link — M.
