# تشغيل أصل Node مستقل — خطة مشغّل، لم تُنفذ

الحالة 2026-11-16: محليًا مساحات6/6 HTTP PASS؛ حيًا BLOCKED بخدمة Static. هذا المستند أحدث من الإرشادات التاريخية المتعارضة في APP-PORTAL-RUNTIME-HANDOFF. لا يفوض إنشاء أو نشر أو تغيير DNS.

## خطة Render

1. بعد اعتماد عملية النشر، راجع workspace التاريخية `tea-dade102fngtc739064v0` وخدمة `srv-dbpj8jajnfac739je6lg` قبل إنشاء بديل. لا تستنتج حذفها من غيابها في workspace العامة.
2. اختر خدمة **Web Service / Node** مستقلة، بلا custom domain وبـauto-deploy معطل، ومن checkout معتمد يحوي الإصلاحات المحلية بعد مراجعتها. لا تغير الخدمة Static الحالية. راجع الخطة والتكلفة قبل الإنشاء؛ لا تفترض إتاحة free.
3. Root repository؛ build `npm ci && npm run build`؛ start `npm start`؛ health path `/healthz/`؛ استماع جميع الواجهات على PORT المنصة. لا publish directory ولا SPA fallback ولا rewrite إلى index.html. إصدار Node المتحقق محليًا22.22.2 وفق blueprint، ومخاطر الاعتمادات/ترقيتها قرار منفصل موثق في المشروع.
4. أدخل القيم عبر لوحة البيئة فقط. الأسماء أدناه؛ لا تنسخ الأسرار إلى source أو logs. DB بدور runtime محدود وعلى staging معتمد، Auth مهيأ ومخطط migrations مطابق؛ لا تطبق ترحيلات إنتاج ضمن هذه الخطة. اسم REDIS_URL في blueprint توافق قديم وليس تبعية لهذا المسار.
5. فعّل فحص Auth الشبكي وRLS، واترك بوابة المنتج مغلقة حتى اعتماد إتاحتها. البوابة المغلقة لا تفشل readiness إذا نجحت التبعيات. لا تستخدم `/` لتجاوز health503. الفحص الحالي يثبت اتصال DB ووجود aigas_tenants فقط؛ لا يثبت اكتمال كل migrations أو RLS/منح المنتجات، فتراجع منفصلة.
6. اختبر HTTPS على عنوان onrender للخدمة المستقلة أولًا. سجّل GET/HEAD لكل مسار أدناه وhealth وAPI، ثم اختبار جلسة اصطناعية مخولة وخروجها، دون تسجيل tokens/cookies أو بيانات شخصية.

## Environment — أسماء فقط

Runtime: `NODE_ENV`, `NODE_VERSION`, `HOST`, `PORT`, `AIGAS_APP_ENABLED`, `AIGAS_HEALTH_AUTH_PROBE`, `AIGAS_REQUIRE_RLS`, `AIGAS_CSP_ENFORCE`.

Secrets/config: `DATABASE_URL`, `NEON_AUTH_BASE_URL`, `NEON_AUTH_JWKS_URL`.

Platform identity: `RENDER_SERVICE_ID`, `RENDER_SERVICE_NAME`, `RENDER_SERVICE_TYPE`, `RENDER_GIT_COMMIT`. لا تفترض أن المنصة تضبط كل الحقول؛ اقرأ الموجود من health.

Optional operator identity: `AIGAS_RELEASE_SHA`, `AIGAS_DEPLOY_ID`, `AIGAS_IMAGE_DIGEST` (للصور فقط). لا تضع Deploy ID قديمًا في نشر جديد ولا تضبط override لملف version على المنصة.

## Cache / CSP / TLS

- أي توجيه لاحق للحافة يحتاج تفويضًا مستقلًا. طابق `/app` أو بادئة `/app/` كاملة بما فيها API، وكذلك `/auth` وبادئتها وhealthz بنوعي slash. bypass لكل الطرق والأخطاء والتحويلات؛ عطّل Cache Everything/edge TTL overrides وSPA fallback لهذه المسارات، وامسح404 القديمة عند التحويل المعتمد. لا تكفي قاعدة `/api/*` لأن API هنا تحت `/app/api/*`.
- origin الخاص: Cache-Control private/no-store، CDN-Cache-Control وCloudflare-CDN-Cache-Control no-store، X-Robots-Tag noindex/nofollow، Vary Cookie/Authorization. اختبر طلبين متتاليين بلا credentials ثم بجلسة اصطناعية؛ لا Age متزايد ولا cache HIT ولا استجابة مشتركة. افحص غير slash والتحويلات والمسارات المشفرة أيضًا قبل cutover.
- CSP baseline مفروض؛ السياسة الكاملة Report-Only افتراضيًا. اختبر تحميل JS والدخول وNeon connect origin فعليًا، ثم فعّل enforcement في الخدمة المعزولة وأعد الاختبارات. لا wildcard auth origin ولا unsafe-inline للسكربتات. CSP ليس برهان امتثال شامل.
- TLS ينتهي لدى Render/الحافة؛ HTTPS فقط خارجيًا وFull(strict) عند الحافة، لا downgrade. تحقق شهادة وHSTS من الاستجابة HTTPS، وأن proxy يضبط forwarded-proto الموثوق ويمنع تمرير قيمة عميل غير موثوقة. اتصال HTTP داخلي خلف TLS لا يستلزم ملفات شهادة محلية.

## SHA ومعيار الإغلاق

سجّل intended commit وBuild log SHA وRender deploy ID/commit وحالةlive، ثم قارن `/healthz/` release.artifact.commit وrelease.deploy.claimedCommit مع نفس SHA وconsistent=true؛ null ليس نجاح مطابقة. سجل artifact.digest وpackageLock digest وbuiltAt. digest الحالي يخص version.json، وليس hash كامل ملفات bundle؛ المصدر المحلي غير الملتزم لا يثبت به SHA وحده.

القبول: health200 بتبعيات فعلية وAuth probe ACTIVE/CACHED ناجح، وجلسة اصطناعية صحيحة، وكل المساحات الست200/HEAD بلا404، وAPI بلاجلسة401 JSON برسالة دخول واضحة، والبوابة المغلقة503 JSON/HTML، وفحوص الكاش/CSP/TLS على الأصل ثم الحافة. صفحةSSR200 تثبت الوصول للغلاف فقط، لا صلاحية المنتج أو نجاح عملياته. returnTo مقتصر على المنتجات الخمسة canonical؛ اختبر رفض external/encoded/query/fragment وقبول الوجهة بعد تفويض الخادم فقط.

## Rollback

قبل النشر سجّل آخر deploy سليم وSHA وإعدادات البيئة ومراجع الأسرار دون قيمها وإعداد origin/cache الحالي. عند health503 أو SHA mismatch أو بيانات متقاطعة أو كاش خاص: أوقف التوسع وأغلق بوابة المنتج. أعد آخر deploy متوافق عبر Render؛ راجع البيئة بشكل مستقل لأن rollback ليس استعادة أسرار أو DB. لا reverse migrations ولا حذف موارد. إن لم يوجد deploy Node سليم، يبقى Node معزولًا والدومين الحالي دون تغيير؛ لا تعد HTML static نجاحًا للتطبيق. أعد فحوص health/SHA/الجلسة/الكاش بعد الرجوع. أي إعادة توجيه DNS منفصلة ومصرح بها فقط.

المراجع التشغيلية: [Render health checks](https://render.com/docs/health-checks)، [Render rollbacks](https://render.com/docs/rollbacks)، [Astro Node adapter](https://docs.astro.build/en/guides/integrations-guide/node/).

## خريطة المصادر الفعلية

القائمة التالية مشتقة من src/pages، وليست وعدًا بأن كل endpoint يقبل كل HTTP method. `[id]` ونظائرها معاملات فعلية، وليست مسارات HTML ثابتة.

| Node path | المصدر | Methods |
|---|---|---|
| `/app/api/firewall/evaluate/` | `src/pages/app/api/firewall/evaluate.ts` | POST |
| `/app/api/firewall/guarded-executions/` | `src/pages/app/api/firewall/guarded-executions.ts` | POST |
| `/app/api/firewall/rules/` | `src/pages/app/api/firewall/rules.ts` | GET, POST, PATCH, DELETE |
| `/app/api/human-gate/delegations/[delegationId]/revoke/` | `src/pages/app/api/human-gate/delegations/[delegationId]/revoke.ts` | POST |
| `/app/api/human-gate/delegations/` | `src/pages/app/api/human-gate/delegations/index.ts` | GET, POST |
| `/app/api/human-gate/policy/` | `src/pages/app/api/human-gate/policy.ts` | POST |
| `/app/api/human-gate/requests/[requestId]/cancel/` | `src/pages/app/api/human-gate/requests/[requestId]/cancel.ts` | POST |
| `/app/api/human-gate/requests/[requestId]/decide/` | `src/pages/app/api/human-gate/requests/[requestId]/decide.ts` | POST |
| `/app/api/human-gate/requests/[requestId]/execute/` | `src/pages/app/api/human-gate/requests/[requestId]/execute.ts` | POST |
| `/app/api/human-gate/requests/` | `src/pages/app/api/human-gate/requests/index.ts` | GET, POST |
| `/app/api/kernel/` | `src/pages/app/api/kernel.ts` | GET, POST |
| `/app/api/kernel/health/` | `src/pages/app/api/kernel/health.ts` | GET |
| `/app/api/kernel/invitations/` | `src/pages/app/api/kernel/invitations.ts` | GET |
| `/app/api/kernel/members/` | `src/pages/app/api/kernel/members.ts` | GET, POST |
| `/app/api/kernel/policies/` | `src/pages/app/api/kernel/policies.ts` | GET, POST |
| `/app/api/kernel/products/` | `src/pages/app/api/kernel/products.ts` | PATCH |
| `/app/api/kernel/trials/[trialId]/cancel/` | `src/pages/app/api/kernel/trials/[trialId]/cancel.ts` | POST |
| `/app/api/kernel/trials/[trialId]/submit/` | `src/pages/app/api/kernel/trials/[trialId]/submit.ts` | POST |
| `/app/api/kernel/trials/` | `src/pages/app/api/kernel/trials/index.ts` | GET, POST |
| `/app/api/ledger/events/[eventId]/export/` | `src/pages/app/api/ledger/events/[eventId]/export.ts` | GET |
| `/app/api/ledger/events/[eventId]/` | `src/pages/app/api/ledger/events/[eventId]/index.ts` | GET |
| `/app/api/ledger/events/[eventId]/verify/` | `src/pages/app/api/ledger/events/[eventId]/verify.ts` | POST |
| `/app/api/ledger/events/` | `src/pages/app/api/ledger/events/index.ts` | GET, POST |
| `/app/api/operator/trials/[trialId]/activate/` | `src/pages/app/api/operator/trials/[trialId]/activate.ts` | POST |
| `/app/api/operator/trials/[trialId]/close/` | `src/pages/app/api/operator/trials/[trialId]/close.ts` | POST |
| `/app/api/operator/trials/[trialId]/decide/` | `src/pages/app/api/operator/trials/[trialId]/decide.ts` | POST |
| `/app/api/operator/trials/[trialId]/expire/` | `src/pages/app/api/operator/trials/[trialId]/expire.ts` | POST |
| `/app/api/operator/trials/` | `src/pages/app/api/operator/trials/index.ts` | GET |
| `/app/api/risk-engine/actions/` | `src/pages/app/api/risk-engine/actions.ts` | GET |
| `/app/api/risk-engine/assets/[assetId]/assessments/` | `src/pages/app/api/risk-engine/assets/[assetId]/assessments.ts` | GET, POST |
| `/app/api/risk-engine/assets/[assetId]/` | `src/pages/app/api/risk-engine/assets/[assetId]/index.ts` | PATCH, DELETE |
| `/app/api/risk-engine/assets/[assetId]/revisions/` | `src/pages/app/api/risk-engine/assets/[assetId]/revisions.ts` | GET |
| `/app/api/risk-engine/assets/[assetId]/treatments/` | `src/pages/app/api/risk-engine/assets/[assetId]/treatments.ts` | GET, POST, PATCH |
| `/app/api/risk-engine/assets/` | `src/pages/app/api/risk-engine/assets/index.ts` | GET, POST |
| `/app/api/risk-engine/export/` | `src/pages/app/api/risk-engine/export.ts` | GET |
| `/app/api/secure-chat/messages/` | `src/pages/app/api/secure-chat/messages.ts` | POST, DELETE |
| `/app/api/secure-chat/models/` | `src/pages/app/api/secure-chat/models.ts` | GET |
| `/app/firewall/` | `src/pages/app/firewall/index.astro` | GET / HEAD (SSR page) |
| `/app/human-gate/` | `src/pages/app/human-gate/index.astro` | GET / HEAD (SSR page) |
| `/app/` | `src/pages/app/index.astro` | GET / HEAD (SSR page) |
| `/app/kernel/` | `src/pages/app/kernel/index.astro` | GET / HEAD (SSR page) |
| `/app/ledger/` | `src/pages/app/ledger/index.astro` | GET / HEAD (SSR page) |
| `/app/operator/trials/` | `src/pages/app/operator/trials/index.astro` | GET / HEAD (SSR page) |
| `/app/risk-engine/[assetId]/` | `src/pages/app/risk-engine/[assetId].astro` | GET / HEAD (SSR page) |
| `/app/risk-engine/` | `src/pages/app/risk-engine/index.astro` | GET / HEAD (SSR page) |
| `/app/secure-chat/` | `src/pages/app/secure-chat/index.astro` | GET / HEAD (SSR page) |
| `/healthz/` و`/healthz` | `src/pages/healthz.ts` + alias في `scripts/server.mjs` → `src/server/kernel/health-endpoint.mjs` | GET / HEAD (JSON مباشر بلا redirect) |
| `/auth/sign-up/` | `src/pages/auth/sign-up.astro` | GET / HEAD |
| `/auth/accept-invitation/` | `src/pages/auth/accept-invitation.astro` | GET / HEAD |

## ملحق الدور وقرار التحويل

خطة فقط: يلزم اعتماد المالك قبل أي إجراء Render/Cloudflare أو ربط brightai.live. الأصل الجديد على .onrender.com مع Neon Staging فقط. اضبط AIGAS_DB_RUNTIME_ROLE=aigas_runtime وAIGAS_REQUIRE_RLS=true؛ حساب القناة LOGIN محدود، NOBYPASSRLS/NOSUPERUSER، وله SET على aigas_runtime دون صلاحيات إدارة. لا تستخدم options=-c role في Pooler؛ SET LOCAL ROLE داخل كل معاملة وفحص DB مع قراءة current_user وrolbypassrls. يلزم إثبات هذه الصلاحيات على Staging؛ لا تمنحها هذه الخطة تلقائيًا.

أسماء المزود: GROQ_API_KEY (سر)، GROQ_MODEL (إعداد)، وAIGAS_CSP_ENFORCE (موجود في blueprint، غير سري). قبل ربط الدومين: health200 وconsistent=true، ثم Bypass Cache للبادئات /app* و/auth* و/api* و/healthz*، بما فيها الأخطاء والتحويلات. أبق الخدمة الثابتة خيار رجوع فوري لتوجيه Cloudflare بعد التفويض؛ رجوعها لا يعني عمل المنتجات الخادمية.
