# BRIGHT AI / AIGAS — Baseline & Product Traceability

> **مراجعة محلية مؤرخة:** 2026-11-08 (Asia/Riyadh)  
> **HEAD:** `55cd41567d82439790acbd871f917905df89e78a` — `main`  
> **Neon:** مشروع `young-frog-60183055` / فرع `production` (`br-young-bird-b43proeb`) / `neondb`  
> **النطاق:** توثيق المصدر والمخطط والإعداد والدليل الحي؛ لا تعديل منتج، ولا كتابة إلى Neon أو خدمة خارجية.

## 1. قواعد القراءة والحالة

| الحالة | ما تثبته | ما لا تثبته |
|---|---|---|
| `SOURCE_PRESENT` | ملف أو route أو منطق موجود محليًا على HEAD الحالي | النشر، الإعداد، أو نجاح السلوك |
| `SCHEMA_PRESENT` | جدول/عمود/دالة/قيد موجود في Neon وقت القراءة | أن التطبيق يستخدمه بنجاح أو أن الترحيل مسجل/مطبق كاملًا |
| `CONFIGURED` | إعداد فعلي مقروء من بيئة الخدمة أو Neon | الموافقة القانونية/الأمنية أو صحة التشغيل |
| `RUNTIME_VERIFIED` | استجابة فعلية محددة بتاريخ ونطاق | نشر HEAD الحالي أو صحة وظيفة أخرى |
| `APPROVED` | اعتماد صاحب الصلاحية موثق صراحة | لا يُستنتج من المصدر أو المخطط أو إعداد متاح |
| `NOT_VERIFIED` / `BLOCKED` | الدليل التشغيلي ناقص / شرط لازم خارج النطاق | لا يعني نجاحًا أو إخفاقًا غير مقاس |

لا يوجد في هذه المراجعة اعتماد تشغيل `APPROVED` لأي منتج أو مزود AI. كلمة `APPROVED_REQ` في السجل تعني مطلبًا معتمدًا في وثيقة المتطلبات فقط.

## 2. Baseline والأدلة التي جُمعت

- **Git:** HEAD المحلي هو SHA أعلاه على `main`. توجد عند بدء المهمة تعديلات مستخدم محلية في `Audit/BRIGHTAI-BETA-GATE-FINAL-2026-11-08/ALL-15-PRE-BETA-PROMPTS.md`؛ لم تُمس.
- **README:** فقرة النظام «جاهز» ومزودا Groq/Gemini النشطان و`POST /api/ai/chat/` وميزات Redis/SSE هي وصف تاريخي مؤرخ 2026-07-18: نواة المنتج `SOURCE_PRESENT` فقط؛ المزودان `NOT_VERIFIED` (وسجل المصدر الحالي فارغ)، route `/api/ai/chat/` `NOT_PRESENT` في شجرة Astro الحالية، ووجود `REDIS_URL` في قالب Render لا يثبت مستهلكًا أو إعدادًا حيًا. أُضيف تنبيه فوق النص للحفاظ على السجل دون عرضه كحقيقة راهنة.
- **المصدر والإعداد:** `render.yaml` يصف Render Node، `npm start`، health check على `/`، ويضبط `AIGAS_APP_ENABLED="false"`. هذا قالب مصدر وليس قراءة لإعداد الخدمة المنشورة. `src/server/secure-chat/models.mjs` يحوي `APPROVED_MODELS=[]` و`src/server/firewall/provider.mjs` يحوي `approvedProviders=[]`.
- **المتصفح، قراءة عامة فقط، 2026-11-08:** كل URL أدناه أعاد HTTP 404 بلا تحويل وعرض صفحة 404 العامة. هذا `RUNTIME_VERIFIED` لردّ URL في لحظة الفحص فقط؛ Origin وSHA المنشور وربط الدومين/CDN `NOT_VERIFIED`.
  - `https://brightai.live/app/`
  - `https://brightai.live/app/kernel/`
  - `https://brightai.live/app/firewall/`
  - `https://brightai.live/app/ledger/`
  - `https://brightai.live/app/human-gate/`
  - `https://brightai.live/app/risk-engine/`
  - `https://brightai.live/app/secure-chat/`
  - `https://brightai.live/app/api/kernel/health`
- **Neon، قراءة فقط:** `public` يحوي 31 جدول `aigas_*`؛ RLS مفعّل على 31/31، وعدد السياسات صفّان على جدولين (`aigas_sc_requests`, `aigas_sc_cancellations`). دور `authenticated` لديه SELECT/INSERT/UPDATE/DELETE على 31 جدولًا (124 امتيازًا جدوليًا)، و`neondb_owner.rolbypassrls=true`، ولا يوجد `aigas_runtime`.
- **Neon Data API:** الحالة `active`، والنطاق `public`، والدور المجهول `anonymous`، ومفتاح الدور `.role` (قراءة إعداد Control Plane في 2026-11-08).
- **فرع Neon:** أظهر الجرد فرع `production` الوحيد، primary/default، وحالته `protected=false`. وجوده لا يثبت مسار استعادة أو RPO/RTO.
- **Neon بيانات/هوية:** 0 في الجداول التشغيلية المفحوصة (`tenants`, `memberships`, `product_access`, Firewall decisions, Ledger events, Human Gate requests, Risk assets, Secure Chat messages)، و0 `neon_auth.user` و0 `neon_auth.session`. هذه لقطات عدّ لا تدقيقًا لكل صف في كل جدول.
- **ما لم يُنفذ:** لا build أو lint أو اختبارات أو دخول/تفاعل API؛ لا migration أو تغيير إعداد أو بيانات أو نشر أو Git write.

## 3. حالة مخطط Neon والترحيلات

لا يوجد migration ledger؛ الحالة مستنتجة من أسماء الكائنات الحالية، ولا تُسمى الترحيلات «مطبقة بالكامل» دون تطابق مخططها.

| مجموعة الحالة في 2026-11-08 | دليل المخطط |
|---|---|
| `SCHEMA_PRESENT`: أساس Kernel وFirewall وLedger وHuman Gate وRisk Engine وSecure Chat والسياسات | الجداول الـ31 موجودة؛ التعداد التفصيلي حسب المنتج في المصفوفة أدناه |
| `SCHEMA_PRESENT`: Firewall `0012` | قيد `aigas_fw_decisions` يقبل الحالات الخمس `ALLOW/WARN/REDACT/ESCALATE/DENY` مع قيود ربط السبب بالقرار |
| `SCHEMA_PRESENT`: Risk Engine `0015`, Kernel approvals `0020`, Risk guard `0021` | `data_context` و`residual_risk_description` و`required_approvals` موجودة؛ دالة `aigas_re_guard_treatment` والـtrigger `aigas_re_treatment_guard` موجودان |
| `PARTIAL`: Ledger `0013` | حقول/قيود سلسلة SHA-256 و`hash_profile=aigas-ledger-sha256-chain-v2` موجودة؛ `aigas_ld_events_chain_guard()` غير موجودة، وقيد metadata الحالي يقبل `ALLOW/BLOCK/REDACT` فقط. لا تطابق كاملًا مع migration المصدر |
| `NOT_PRESENT`: `0014`, `0016`, `0017` | جداول Human Gate `aigas_hg_delegations`/`aigas_hg_grants` غائبة؛ `aigas_sc_usage_window_v2` غائبة؛ عمود `aigas_audit_events.correlation_id` غائب |
| `NOT_PRESENT`: `0018`, `0019`, `0022`, `0023` | منح DML قائمة؛ لا دور `aigas_runtime`؛ فهرسا scope غير موجودين؛ `aigas_trial_requests` غير موجود |

لا تُطبّق migrations هنا. ترتيب المعالجة، المراجعة، وبيئة staging يحتاج موافقة مشغّل قاعدة البيانات ومالك المنصة، ومراجعة الأمن للتغييرات على المنح والعزل.

## 4. مصفوفة تتبع Kernel والمنتجات الخمسة

| المساحة / الوظيفة الممثلة | Source path | Table / schema | Endpoint محلي | Configured | Evidence الحالي | عائق بيتا |
|---|---|---|---|---|---|---|
| **AIGAS Kernel** — هوية، عضويات، صلاحيات، سياسات، تدقيق وإتاحة منتجات | `src/server/kernel/{auth,access,db,service,policies,administration}.mjs`; `src/pages/app/api/kernel*`; `src/pages/app/api/kernel/**` | `aigas_tenants`, `aigas_memberships`, `aigas_product_access`, `aigas_product_grants`, `aigas_auth_organizations`, `aigas_member_invitations`, `aigas_departments`, `aigas_department_memberships`, `aigas_department_events`, `aigas_policy_*`, `aigas_kernel_policy_decisions`, `aigas_audit_events`؛ مخطط أساسي موجود، `0017` سياق التدقيق غائب، `0023` trial غائب | `/app/api/kernel`, `/health`, `/invitations`, `/members`, `/policies`, `/products` | البوابة في قالب Render مغلقة؛ إعداد Neon Auth موجود، لكن لا مستخدم أو جلسة؛ إعداد DB الفعلي في خدمة Node غير مثبت | SOURCE_PRESENT + SCHEMA_PRESENT؛ Neon counts 0؛ Browser 404 للبوابة وHealth؛ نشر SHA NOT_VERIFIED | P0-01/02/03/06؛ مالك المنصة/مشغّل النشر، الأمن، مشغّل قاعدة البيانات |
| **Firewall** — قواعد وتقييم وعمليات محكومة | `src/server/firewall/{core,service,http,guard,binding,provider,escalation}.mjs`; `src/pages/app/api/firewall/*` | `aigas_fw_rules`, `aigas_fw_decisions` موجودتان؛ لا سجل قرارات. `0012` حاضر في خط الأساس، لكن `0013` Ledger evidence غير متكامل | `/app/api/firewall/evaluate`, `/rules`, `/guarded-executions` | `approvedProviders=[]`; لا مزود/نموذج/منطقة معتمد في المصدر | SOURCE_PRESENT + SCHEMA_PRESENT؛ DB rows 0؛ Browser 404؛ لا تحقق تنفيذ AI | P0-01/02/03/05؛ مالك المنتج والأمن/الخصوصية والقانوني لاعتماد المزود |
| **Ledger** — تسجيل الحدث، السلسلة، التحقق والتصدير | `src/server/ledger/{core,service,writer,http}.mjs`; `src/pages/app/api/ledger/**`; `public/downloads/aigas-ledger-verifier.mjs` | `aigas_ld_events`, `aigas_ld_evidence_requirements` موجودتان؛ events 0؛ حقول v2 موجودة لكن chain guard غائب والقيد لا يطابق الحالات التي يرسلها المصدر | `/app/api/ledger/events`, `/[eventId]`, `/[eventId]/verify`, `/[eventId]/export` | لا إعداد أو تشغيل منتج مثبت | SOURCE_PRESENT + SCHEMA_PRESENT جزئيًا؛ Neon parity mismatch؛ لا حدث حقيقي أو تشغيل verifier مثبت | P0-01/02/03/12 وP1-04؛ مشغّل DB + مالك المنتج + الأمن/الامتثال/القانوني |
| **Human Gate** — طلب وموافقة وتنفيذ مقيد | `src/server/human-gate/{core,service,http}.mjs`; `src/pages/app/api/human-gate/**` | `aigas_hg_requests`, `aigas_hg_decisions`, `aigas_hg_policies`, `aigas_hg_events` موجودة؛ `aigas_hg_delegations` و`aigas_hg_grants` غير موجودة؛ requests 0 | `/app/api/human-gate/policy`, `/requests`, `/requests/[requestId]/cancel`, `/decide`, `/execute`, `/delegations`, `/delegations/[delegationId]/revoke` | البوابة مغلقة في القالب؛ لا جلسة أو إذن تشغيل حي | SOURCE_PRESENT + SCHEMA_PRESENT جزئيًا؛ Neon requests 0؛ Browser 404 | P0-01/02/03/06؛ مالك المنتج والأمن ومشغّل DB لاعتماد دورة التفويض والتنفيذ |
| **Risk Engine** — سجل الأصول والتقييم والمعالجة | `src/server/risk-engine/{core,service,http}.mjs`; `src/pages/app/api/risk-engine/**` | `aigas_re_assets`, `aigas_re_asset_revisions`, `aigas_re_assessments`, `aigas_re_treatment_revisions` موجودة؛ `0015` وأثر `0021` ظاهر؛ assets 0 | `/app/api/risk-engine/assets`, `/assets/[assetId]`, `/assessments`, `/revisions`, `/treatments`, `/actions`, `/export` | لا خدمة منشورة أو مستخدم فعلي مثبت | SOURCE_PRESENT + SCHEMA_PRESENT؛ Neon assets 0؛ Browser 404؛ منطق التقييم المصدري لا يثبت قبولًا تشغيليًا | P0-01/03/06/10؛ مالك المنتج + مسؤول المخاطر/الأمن + مشغّل النشر |
| **Secure Chat** — اختيار نموذج، سياسة، حصص ومحادثات | `src/server/secure-chat/{service,policy,requests,models,adapter}.mjs`; `src/pages/app/api/secure-chat/*` | `aigas_sc_requests`, `aigas_sc_cancellations`, `aigas_sc_conversations`, `aigas_sc_messages` موجودة؛ الجداول المفحوصة بلا بيانات؛ دالة الحصة المطلوبة `aigas_sc_usage_window_v2` غائبة | `/app/api/secure-chat/models`, `/messages` | `APPROVED_MODELS=[]`; لا مزود أو مفتاح خادمي/تفويض معتمد | SOURCE_PRESENT + SCHEMA_PRESENT جزئيًا؛ Neon messages 0؛ Browser 404؛ لا إرسال تحقق | P0-01/02/03/05/06؛ مالك المنتج + الأمن/الخصوصية + القانوني + مشغّل DB |

كل الـendpoints أعلاه `SOURCE_PRESENT` فقط. استجابة Health API 404 لا تعني أن health handler نفسه أُختبر؛ تعني أن URL العام لم يصل إلى ذلك handler وقت الفحص. لا صف في المصفوفة يثبت `AVAILABLE` أو `SAFE` أو `APPROVED`.

## 5. سجل P0/P1/P2 الحالي

أعداد السجل الحالي 12 P0، و10 P1، و6 P2 (عناصر، لا نسبة إنجاز). لم يُغلق مانع بهذه المراجعة. تم تحديث الدليل والحالة الوصفية للمانعين P0-01 وP0-02 وP0-03 فقط؛ بقية الحالات كما هي في `docs/RELEASE-BLOCKERS-REGISTER.md` إلى أن يظهر دليل جديد.

- **P0:** P0-01 `BLOCKED`, P0-02 `PARTIAL`, P0-03 `BLOCKED`, P0-04 `BLOCKED`, P0-05 `BLOCKED`, P0-06 `BLOCKED`, P0-07 `BLOCKED`, P0-08 `BLOCKED`, P0-09 `BLOCKED`, P0-10 `OPEN`, P0-11 `BLOCKED`, P0-12 `PARTIAL`.
- **P1:** P1-01 `OPEN`, P1-02 `OPEN`, P1-03 `OPEN`, P1-04 `BLOCKED`, P1-05 `OPEN`, P1-06 `OPEN`, P1-07 `BLOCKED`, P1-08 `OPEN`, P1-09 `OPEN`, P1-10 `OPEN`.
- **P2:** P2-01 إلى P2-06 `OPEN`.

**الموافقات المطلوبة:** مشغّل النشر/مالك المنصة لإثبات Origin وSHA؛ مشغّل Neon لفرع staging/migrations والأدوار؛ مسؤول الأمن لعزل المستأجرين وCSP والاختبارات السلبية؛ مالك المنتج لتحديد نطاق beta؛ الخصوصية والقانوني لاختيار مزود/منطقة/no-training/الاحتفاظ والادعاءات؛ المالية والقانوني لأي سعر أو trial أو ترخيص. لا تُوصى Beta قبل ظهور أدلة أمنية وتشغيلية فعلية واعتمادات ملاكها.

## 6. تعافي ملف prompts المختصر

الملف `Audit/outhers/ALL-15-OPENCODE-MCP-PROMPTS.md` كان 438 بايتًا فقط. أُعيد تكوينه من ملفات الـ15 المنفصلة الكاملة في `Audit/BRIGHTAI-BETA-GATE-FINAL-2026-11-08/15-FINAL-OPENCODE-PROMPTS/`. الملف المجمّع المعدل مسبقًا `Audit/BRIGHTAI-BETA-GATE-FINAL-2026-11-08/ALL-15-PRE-BETA-PROMPTS.md` حُفظ كما هو ولم يُستخدم كهدف كتابة.

## 7. التحقق الذي لم يُنفذ

لم تُشغّل اختبارات أو build أو lint أو قياس أداء أو رحلة دخول أو API action. قراءة source والمخطط، واستجابة HTTP العامة المحددة أعلاه، لا تثبت صحة المنتج أو عزله أو ملاءمته الأمنية أو القانونية. لا commit أو push أو PR أو merge أو deploy أو migration.
