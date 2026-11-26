# UI action binding register — P10

**نطاق هذا السجل:** مصدر MagicPath وصل مقتطعًا؛ لذا هذا register يغطي المناطق/الأفعال الظاهرة في الجزء المقروء ومخطط القبول المطلوب، وليس تعدادًا لكل زر في كامل TSX. الحالات تفصل صراحة بين public synthetic وenterprise authenticated؛ اختبار الواجهة العامة لا يثبت توصيلًا مؤسسيًا.

| الشاشة / الفعل | Public synthetic المرشح | Enterprise authenticated contract (من routes/schema) | حالة الربط الحالية |
|---|---|---|---|
| Overview / metrics | `createGovernanceSession()` وأحداثها في `src/demo/governance.mjs`; الملخص في `governance-demo.ts` | `GET /app/api/kernel` (`routes.mjs`) ثم قراءات المنتجات المصرح بها | `PASS_VERIFIED` public synthetic metrics في Chrome E2E؛ enterprise NOT_VERIFIED |
| Kernel: اختيار السيناريو، تشغيل/reset، pipeline | `decide()` و`createGovernanceSession().act()`؛ لا إرسال خارجي في `/demo/governance/` | `GET/POST /app/api/kernel`; `POST /app/api/kernel/policies`; `PATCH /app/api/kernel/products`; `POST /app/api/kernel/members` | `NOT_VERIFIED`; المختبر الموحد منفصل عن prototype |
| Firewall: evaluate/rules/guarded execution | محرك public المعزول في `src/demo/engine.mjs` وflow sample في `governance.mjs` | `POST /app/api/firewall/evaluate`; `POST /app/api/firewall/guarded-executions`; rules `GET/POST/PATCH/DELETE`; schema `ruleInput` و`tool_call` في `request-schemas.mjs` | `PASS_VERIFIED` لعينة public `ALLOW` و`REVIEW_REQUIRED` ثم قرار المراجعة؛ enterprise NOT_VERIFIED، ولا توصل public إلى `/app/api/*` |
| Risk Engine: asset/assess/assist/treat/export | `evaluate()` و`replayEvaluation()` في محرك المختبر | `GET/POST /app/api/risk-engine/assets`; `GET/POST .../[assetId]/assessments`; revisions/treatments; `POST /app/api/risk-engine/assist`; `GET /app/api/risk-engine/export` | `PASS_VERIFIED` لتقييم public منخفض وmetrics؛ assist/treat/export وenterprise NOT_VERIFIED |
| Human Gate: review/decide/execute | مراجعة session-local في `governance.mjs`؛ قرار توضيحي غير تنفيذي | `GET/POST /app/api/human-gate/requests`; POST `.../[requestId]/decide`, `/execute`, `/cancel`; policy/delegations routes | `PASS_VERIFIED` لقرار public مستقل ومرتبط بفحص؛ enterprise NOT_VERIFIED (auth/tenant/expiry/replay خارج هذا الاختبار) |
| Ledger: record/verify/export | `exportEvidence()` و`verifyEvidence()`؛ النسخة local غير موقعة وفق copy الحالي | `GET/POST /app/api/ledger/events`; `GET /app/api/ledger/events/[eventId]` و`/export`; `POST .../[eventId]/verify` | `PASS_VERIFIED` local record/verify snapshot/consented export؛ enterprise NOT_VERIFIED، ولا وصف local hash كتوقيع/ضمان |
| Secure Chat: model/send/cancel | `/demo/secure-chat/`؛ public gateway خارج هذا المختبر ويخضع لاعتماد/قيد مستقل | `GET /app/api/secure-chat/models`; `POST/DELETE /app/api/secure-chat/messages`; schema يشترط `requestId`, `modelId`, `message`, `syntheticAcknowledged` | `NOT_VERIFIED` على مكوّن MagicPath؛ لا رد ثابت يوصف بأنه live |
| Registry: search/filter/add/revision | جرد الأصول الاصطناعية الحالي في صفحة الحوكمة (إضافة قوالب محدودة) | `/app/api/risk-engine/assets` و`/[assetId]` و`/revisions` | `PASS_VERIFIED` لإضافة قالب public فقط؛ search/filter/revisions وenterprise NOT_VERIFIED |
| Policy Packs: select/apply/history | `policyPacks` public يغير pack/version داخل الجلسة | `GET/POST /app/api/kernel/policies`; Firewall rules بحسب العقود | `PASS_VERIFIED` لتطبيق supervision داخل الجلسة العامة؛ history/approved/published وenterprise NOT_VERIFIED |
| Developer Workbench: copy examples | لا شاشة source→local مثبتة في الملفات المقروءة | مصدر توليد الأمثلة: `routes.mjs`, `request-schemas.mjs`؛ لا مفاتيح | `NOT_VERIFIED`; يجب اختبار method/path/auth/errors وعدم اختراع endpoint |
| Trust Center: links/evidence | `/trust/` للمحتوى العام | مستندات عامة مصرح بنشرها فقط؛ لا بيانات tenant | `NOT_VERIFIED`; لا badges دون دليل منشور |
| Enterprise modal: open/close/submit/retry | `/request-access/` و`/contact/`؛ `POST /api/enterprise-inquiry` (schema: UUIDv4 submissionId, email, message) | trial: `GET/POST /app/api/trial`; trial start/open schema في `request-schemas.mjs`; التفعيل مستقل | `NOT_VERIFIED` لتطابق المرجع وإظهار success/error؛ submit ليس قبولًا أو تفعيلًا |

## الأفعال الظاهرة في جزء TSX المقروء

| الفعل | ما يظهر في المصدر | ضابط القبول اللازم |
|---|---|---|
| التنقل بين الصفحات | `setPage` محلي | URL/share state بلا بيانات حساسة، back/forward، direct load |
| اختيار scenario وتحرير prompt | state محلي و`evaluateDemo` | synthetic-only؛ validation ورسالة خطأ؛ لا نقل إلى egress غير معتمد |
| تشغيل المسار | أحداث local تُضاف عبر `digest()` | ترتيب قرار حقيقي من المحرك؛ deny/held يوقف المسار؛ error/expired/quota states |
| موافقة/رفض | `approve()` يسجل حدث محلي | enterprise decision عبر requestId/approval policy؛ رفض لا يستأنف التنفيذ |
| verify/tamper | SHA-256 محلي على `events` | نسخة منفصلة، ربط event/source، فشل مغلق عند crypto unavailable؛ لا claim توقيع |
| export | تنزيل JSON من المتصفح | فصل public المحلي عن enterprise export endpoint؛ consent/privacy |
| فتح enterprise dialog | `showModal()`؛ رابط التواصل الظاهر بالنص المقروء | focus trap/return focus/Escape/scroll lock، إرسال فعلي وreceipt/failure/retry |

## دليل التحقق وحدوده

`tests/governance-demo-browser.e2e.mjs` يمر محليًا في Chrome ويغطي أقسام public synthetic المذكورة، عزل الجلسات، reset/expiry، consented export، keyboard path، عدم وجود طلبات خارجية، عدم وجود horizontal overflow عند 320/768/1440px، وaxe بلا مخالفات عند المقاسات نفسها. نجاحه لا يثبت استخدام browser لأفعال MagicPath الأصلية أو اتصال enterprise APIs أو اكتمال كل 12 عنصرًا.
