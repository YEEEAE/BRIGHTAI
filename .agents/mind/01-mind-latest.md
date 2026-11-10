# Project Mind — BRIGHTAI / AIGAS

## Current State
- 2026-11-10 VERIFIED LOCAL: HEAD `57257276d68129e4d3d5849cc50571eca74e01b0` + working tree؛ AR02/AR03: unit31/combined36 PASS،0 FAIL/0 SKIP؛ DB18.6 بخمس قواعد ودورruntime/NOBYPASSRLS؛ build/routes55 PASS؛ مرجع `Audit/ar02-ar03-2026-11-10/REPORT.md`؛ لا إطلاق.
- العقد المحلي يتطلب `0028` لقفل العضوية/المنح دون صلاحيات تعديل إضافية، و`0029` لمنع مرجعLedger الاصطناعيnull؛ طُبقتا في fixtures مؤقتة فقط؛ أي تطبيق خارجي يحتاج مراجعة وتفويضًا مستقلًا.
- التقرير له قارئHTML مستقل دون شبكة: `Audit/final-360-2026-11-10/FINAL-360-AUDIT.html`؛ يولد بـbuild-report.mjs؛76 متطلبًا و25 برومبتًا؛ Chromium360/390/768/1440 والبحث/النسخ/CSV وتهيئة الطباعة PASS؛ بيانات التدقيق لم تتغير.
- توجيه المستخدم2026-11-10: لا سقف15 لبرومبتات الإغلاق؛ الخطة الحالية25 بتقسيم تخصصي وتبعيات مفحوصة في `Audit/final-360-2026-11-10/EXECUTION-PROMPTS.md`؛ أرقام التدقيق وNO-GO دون تغيير.
- 2026-11-10 HISTORICAL LIVE CHECK: SHA `7b1f533f71c7b1f41884790366a4d5967c85a87b` طابق Render deploy `dep-dbpg8kgae00c73easjr0`؛ الخدمة `srv-d7m5bcjbc2fs73826v20` static_site/dist/client وapp/Auth/API404؛ لم يُعد فحصها بجولةAR02/AR03؛ Beta/Commercial NO-GO.
- تدقيق360 تاريخي: tests18 PASS/9 FAIL/5 SKIP تجاوزتها نتائجAR02/AR03 المحلية أعلاه؛ Firewall harness8/8 و55 صفحة حية200 دليل مؤرخ في `Audit/final-360-2026-11-10/FINAL-360-AUDIT.md`، دون عمليات منتج حية مثبتة.
- المراقبة: اعتماد مستقل لكل طبقة + SHA كامل؛ PostHog staging/beta فقط؛ واجهة App/Auth ترسل رموزًا ثابتة عبر same-origin relay؛ لا SDK أو stack؛ خطة التحقق O1–O8 غير منفذة.

## Open Issues / Blockers
- 2026-11-10 VERIFIED: Neon production وحيد غير محمي؛ 31 جدولًا/RLS31/سياسات2/FORCE0؛ runtime role وmigration ledger غائبان؛ لا staging أو استعادة مقاسة.
- Sentry projects=[] ضمن الاتصال؛ PostHog720936 ingested_event=false وإعدادات خصوصية تحتاج مراجعة؛ لا وجهة معتمدة، وحد الخطة التاريخي لم يُعد التحقق منه. Bootstrap/RLS وtrial/purge وموافقات المزودين والـUAT ما زالت مفتوحة.

## Ledger (الأحدث أولًا)

## [2026-11-10] — إغلاق عقود الوحدة وتكامل DB18 محليًا
- **تم:** تصحيحfixtures والعقود، Human Gate list، Risk shadowing/audit mapping، وقفلRLS محدود ومرجعLedgernull؛ لا تخفيفguards أو كتابة خارجية.
- **التحقق:** PASS — unit31/combined36،0 FAIL/0 SKIP؛ خمسDB18 بدورruntime؛ عزل/رفض/سباقات/rollback وLedgerCLI؛ build/routes55 PASS.
- **الحالة:** DONE LOCAL — لاRuntime/Approval/Release؛ P16خارج النطاق.
- **ملفات:** `Audit/ar02-ar03-2026-11-10/REPORT.md`، `scripts/verify-contracts-local.mjs`، `docs/KERNEL-DEVELOPMENT.md`.
- **مفتوح:** مراجعة وترحيل0028/0029 على هدف معتمد مستقلًا؛ bootstrap وبقية مساراتRLS غير مغطاة بهذا الإغلاق.

## [2026-11-10] — تدقيق 360 ومصفوفة أدلة حالية
- **تم:** إثبات Render static/deploy/SHA بقراءة MCP بعد اختيار المستخدم؛ جرد Neon والمراقبة وزحف55 صفحة؛ مصفوفة76 متطلبًا ومواصفات تجربة و15 برومبت إغلاق.
- **التحقق:** build PASS؛ unit18 PASS/9 FAIL/5 SKIP؛ guard8/8 LOCAL PASS؛ routes FAIL عند assertion analytics قديم؛ لا E2E/DB writes/provider/deploy.
- **الحالة:** DONE للتدقيق ضمن حدوده؛ المنتجات/Beta/Commercial BLOCKED؛ النسب مؤشرات أدلة أولية لا موافقات إطلاق.
- **ملفات:** `Audit/final-360-2026-11-10/FINAL-360-AUDIT.md`، `Audit/final-360-2026-11-10/EXECUTION-PROMPTS.md`.
- **مفتوح:** SSR معزول وparity/runtime RLS وbootstrap/trial lifecycle/purge وموافقات AI/خصوصية واستعادة وUAT؛ .env بقيت ignored/untracked وصلاحيتها600 دون تغيير قيم.

## [2026-11-10] — استكمال المراقبة المحلية
- **تم:** تنقيح بقوائم ثابتة بلا stack، ربط إشارات الواجهة ونتائج الدخول، استقلال موافقة analytics، وتوثيق alert/on-call كمسودة بلا وجهات.
- **التحقق:** قراءة MCP ومراجعة المصدر/diff فقط؛ test/build/lint/typecheck/Playwright/إرسال أحداث NOT RUN حسب الطلب.
- **الحالة:** PARTIAL — SOURCE_PRESENT؛ CONFIGURED/RUNTIME_VERIFIED/APPROVED غير مثبتة؛ G8/G9 دون ترقية.
- **ملفات:** `docs/MONITORING-AND-ANALYTICS-WIRING.md`، `docs/beta/MONITORING-READONLY-STATUS-2026-11-10.md`.
- **مفتوح:** المالك طلب مشروع PostHog جديد؛ لم يُحاول الإنشاء لبلوغ السعة، ولا ترقية مدفوعة أو تعديل للموجود.

## [2026-11-09] — طبقتا مراقبة opt-in (Sentry/PostHog) وبوابات G8/G9

### تم التنفيذ
- HEAD الفعلي `9bee68f450a55396528819d738e728b438475973` (`main`). الـSHA `46ecaea…` والمرشح `3eaf6907…` تاريخيان؛ لم يُنسب أي دليل تشغيلي إلى HEAD الحالي.
- أُضيفت طبقة `src/server/observability/` بلا أي حزمة SDK جديدة: تهيئة بوابات، قوائم سماح، عميل Sentry Envelope مبسّط، وعميل PostHog capture صريح. كلتاهما مطفأتان افتراضيًا وتحتاجان مرجع اعتماد + بيئة معتمدة + علمًا خاصًا.
- Sentry (خادمي فقط؛ لا SDK متصفح): فقط 5xx وأكواد Auth/Invite/RLS/Ledger/Provider المحددة. لا `error.message` خام، ولا request/cookies/user/IP/body، ولا DSN/مفاتيح/متن محادثة. يُرسل رمز ثابت + مسار ثابت + stack من `src/dist/scripts` فقط.
- PostHog: قائمة أحداث صريحة (`portal_viewed`, `product_opened`, `policy_action_result`, `quota_exhausted`, `login_flow_result` كعقد) وخصائص محددة فقط؛ `distinct_id` عشوائي و`$process_person_profile=false` و`$geoip_disable=true`. لا auto-capture/replay/heatmaps.
- وُصلت Sentry بأخطاء Kernel/Human Gate/Ledger/Risk Engine/Firewall/Secure Chat، وبإشارة `LEDGER_VERIFICATION_MISMATCH`. وُصل PostHog بـ`AppLayout` (portal/product) وبـHuman Gate policy وSecure Chat quota. `login_flow_result` غير موصول لأن Neon Auth يتم في المتصفح.
- مفتاح إيقاف مستقل لكل طبقة (`AIGAS_SENTRY_KILL_SWITCH`/`AIGAS_POSTHOG_KILL_SWITCH`) ولا يعتمد على `AIGAS_APP_ENABLED`. لم تُضف القيم إلى `render.yaml` أو `.env.example`.
- وُثّق عقد البيانات وخطة تحقق Staging V1–V6 في `docs/MONITORING-AND-ANALYTICS-WIRING.md`، وأُضيف قسم 10 إلى Runbook، وحالة V15 إلى VERIFICATION-PLAN.
- تحديث Gates: G1 بقي `PASS` بنطاق عام فقط مع تسجيل أن مسح 2026-11-08 أقدم من HEAD الحالي؛ G2–G8 بقيت `BLOCKED`؛ G9 بقي `NOT_VERIFIED`. لا GO.

### الملفات المتأثرة
- `src/server/observability/{config,redact,sentry,posthog,index}.mjs` (جديد)
- `src/server/{kernel,human-gate,ledger,risk-engine,firewall}/http.mjs`, `src/server/secure-chat/service.mjs`, `src/layouts/AppLayout.astro`
- `docs/MONITORING-AND-ANALYTICS-WIRING.md` (جديد), `docs/PRE-BETA-SECURITY-AND-OPERATIONS-RUNBOOK.md`
- `docs/beta/RC-3eaf6907c35d0a138984defb5cf9f947f9520f82/{GO-NO-GO-GATES.yaml,VERIFICATION-PLAN.md}`, `docs/FINAL-RELEASE-HANDOFF.md`

### التحقق
- `node --check` لكل ملفات `.mjs` المعدلة/الجديدة و`git diff --check`: PASS (فحص صياغة فقط).
- YAML: 9 بوابات صالحة، القرار `NO-GO`، G1 PASS وG8 BLOCKED وG9 NOT_VERIFIED: PASS.
- Build/tests/lint/typecheck/Playwright/E2E/HTTP/إرسال أحداث/نشر: NOT RUN حسب نطاق الدفعة. لا `RUNTIME_VERIFIED`.

### النتيجة
- **الحالة:** DONE محليًا للـwiring والتوثيق؛ **PARTIAL** للحالة العامة. **G8=BLOCKED** وG9=NOT_VERIFIED. لا ادعاء تفعيل أو مراقبة Live.

### ملاحظات / مشاكل مفتوحة
- Sentry MCP: منظمة `659ec3bf0cec` بلا أي مشروع. PostHog: مشروع `Default project` (720936) بلا أحداث، وإعداداته تحتاج تقوية (`autocapture_opt_out`, `capture_console_log_opt_in`, `capture_performance_opt_in`, `heatmaps_opt_in`, `anonymize_ips=true`). لم يُختر مشروع/منظمة نيابة عن المالك ولم تُغيَّر أي إعدادات.
- يلزم: مشروع Sentry معتمد + DSN في Secret Store، مشروع PostHog معتمد + قرار تحليلات، مراجعة payload، وجهات Alert/on-call، ثم تنفيذ V1–V6 على Staging ببيانات اصطناعية وتوقيع G8/G9.

## [2026-11-09] — سجل موافقات G6 والتجربة المقيدة وحدود fail-closed

### تم التنفيذ
- HEAD الفعلي `13926fb2197ca1fc34e05da59320e9c2243b5a97` (`main`، شجرة نظيفة). الـSHA `46ecaea…` وقرار RC `3eaf6907…` تاريخيان فقط.
- أُنشئ سجل اعتماد جديد `docs/beta/G6-PROVIDER-TRIAL-APPROVAL-REGISTER-2026-11-09.md`: حقول provider/model/region/retention/no-training/DPA/scope/endpoint/rate-quota/secret-store/expiry لفريقي Secure Chat وFirewall، فارغ عمدًا (`NOT_APPROVED`).
- التجربة 48 ساعة وُثّقت كطلب اعتماد: مؤسستان، 5 مستخدمين، بيانات اصطناعية، بلا إرسال خارجي/دفع/self-service؛ لا تفعيل إلا بمشغّل مسمّى مستقل ومنتج اجتاز تحققًا فعليًا بعد التفويض (`0023` غير مطبقة).
- ثبت أن Neon في `aws-us-east-2` (منصة `aws`، PG 18، فرع `production` وحيد `protected=false`) عبر Neon MCP قراءة فقط؛ ادعاء الاستضافة السعودية يبقى ممنوعًا (`P0-09`). النص العام الحالي لا يدّعيه.
- وُثّقت 14 حالة fail-closed ومقرراتها في الكود (نماذج/حصة/مزود/Human Gate/RLS/Kernel setup/حجب الأسرار/التدقيق)، مع بقاء حماية Kernel الأساسية مستقلة عن رخص المنتجات.
- لم تُضف مدخلات إلى `APPROVED_MODELS` أو `approvedProviders`، ولم يُفعّل إرسال خارجي، ولم تُنفّذ migrations أو كتابة/نشر/commit/push.
### الملفات المتأثرة
- `docs/beta/G6-PROVIDER-TRIAL-APPROVAL-REGISTER-2026-11-09.md` (جديد)
- `docs/FINAL-RELEASE-HANDOFF.md`
### التحقق
- Neon MCP قراءة فقط (`describe_project`, `list_branches`): PASS للحالة والمنطقة.
- فحص المصدر لمسارات fail-closed: PASS. Build/tests/HTTP/E2E: NOT RUN حسب النطاق.
### النتيجة
- **الحالة:** DONE محليًا للسجل والتحليل؛ **G6=BLOCKED** و**Trial=BLOCKED**. لا `RUNTIME_VERIFIED` ولا `APPROVED` ولا Beta.
### ملاحظات / مشاكل مفتوحة
- يلزم توقيع Product + Security/Privacy + Legal + DB Operator، و`0016/0023` على staging، وقرار إقامة بيانات (A/B)، قبل أي إغلاق.

## [2026-11-09] — تشخيص 404 البوابة: الأصل يخدم ملفات ثابتة لا Node SSR
### تم التنفيذ
- HEAD الفعلي `5ee9df758165c411e5f6e3677a4d4da5e1bb60b5` (`main`، شجرة نظيفة). قراءة HTTP عامة أثبتت أن `brightai.live` يصل عبر Cloudflare إلى Render (`rndr-id`)، وكل الاستجابات تحمل `last-modified` موحّد `2026-11-08T21:37:31Z` و`cache-control: public, max-age=0, s-maxage=300`.
- `/app/` و`/app` و`/nonexistent-xyz/` تعيد نفس 404 ونفس `etag` (صفحة 404 الثابتة)؛ لا ترويسات middleware على أي مسار. `/app/api/kernel/health` يعيد HTML لا JSON.
- المصدر صحيح: كل `src/pages/app/**` بـ`prerender=false`، و`dist/client` بلا `/app/*`، و`dist/server` يحتوي المسارات. `@astrojs/node` standalone يخدم الملفات الثابتة **قبل** middleware؛ لذلك الوصول لـNode كان سيعطي `503` لا `404`.
- السبب الجذري: الدومين يقدّم artifacts ثابتة (`dist/client`) وليس خدمة Node `npm start`. لا تصحيح برمجي يعالج ذلك. لم يُعدّل كود التطبيق ولا `render.yaml`.
- Render MCP أعاد `unauthorized`؛ لذلك service ID/type وdeploy ID وSHA وdigest `BLOCKED`. Sentry org بلا مشاريع، PostHog بلا أحداث، ولا SDK في `package.json` ⇒ G8 بلا تغيير.
- Neon قراءة فقط: 31 جدولًا، RLS 31/31، سياستان، `aigas_runtime=0`، Auth users/sessions/orgs = 0، Data API `active` على `public`.
### الملفات المتأثرة
- `docs/beta/RUNTIME-404-ROOT-CAUSE-2026-11-09.md` (جديد)
- `docs/FINAL-RELEASE-HANDOFF.md` (رابط مرجعي)
### التحقق
- `curl -D -` لمسارات `/`, `/app/`, `/app`, `/app/api/kernel/health`, `/nonexistent-xyz/`, `/images/...`, `/sitemap-index.xml`: PASS كدليل HTTP.
- Neon MCP قراءة فقط: PASS. Build/test/lint/Playwright/local server: NOT RUN حسب نطاق الدفعة.
### النتيجة
- **الحالة:** DONE للتشخيص محليًا؛ **G2=BLOCKED** و**G3=BLOCKED** بلا تغيير. لا Beta ولا GO.
### ملاحظات / مشاكل مفتوحة
- يلزم اختيار المالك لـRender workspace وتفويض الوصول (MCP أعاد `unauthorized`)، ثم ربط الدومين بخدمة Node وتسجيل `service → deploy → SHA → digest → origin response`.
- ملاحظة مؤجلة: الصفحات prerendered تتجاوز middleware في standalone فلا تحصل على CSP/HSTS؛ معالجتها تحتاج تفويضًا منفصلًا.
- Rollover: نُقلت ثلاثة سجلات `2026-11-08` (صقل الصفحات/المعرفة/التعليم) إلى أعلى `02-mind-mid.md`؛ `01` صار 470 سطرًا.
