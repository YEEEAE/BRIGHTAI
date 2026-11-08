# Firewall — خطة تحقق staging وحالات الإعداد/الرفض/المهلة

> الحالة: **NOT RUN** · التاريخ: 2026-11-08 · النطاق: مسار `/app/api/firewall/*` فقط
> لا يثبت هذا المستند تشغيلًا أو نشرًا أو اعتماد مزود. لا تشغّله على الإنتاج.

## 1. النطاق وما لا يغطيه

يغطي هذا المستند مسار Firewall المحكوم: `GET/POST/PATCH/DELETE /app/api/firewall/rules/`، و`POST /app/api/firewall/evaluate/` (لا ينفذ)، و`POST /app/api/firewall/guarded-executions/` (مسار الإنفاذ الوحيد).

لا يغطي: استدعاءات المزود المباشرة من تطبيقات أخرى، فحص مخرجات المزود، البث، DLP شاملًا، كشف حقن التعليمات، عزل المؤسسات (له مستند منفصل)، اعتماد مزود، ترخيص، أو نشرًا.

## 2. الشروط المسبقة (كلها بموافقة منفصلة)

| الشرط | المالك | الحالة |
|---|---|---|
| فرع staging معتمد مع استعادة | مالك Neon + العمليات | NOT CONFIGURED |
| تطبيق ترحيلات Firewall/Kernel على staging | مشغّل قاعدة البيانات | NOT RUN |
| دور `aigas_runtime` وRLS/GRANTs | الأمن + مشغّل قاعدة البيانات | NOT RUN |
| مؤسسة وعضوية ومسار Kernel policy `ALLOW` اصطناعي | مالك المنتج | NOT RUN |
| مزود AI معتمد (model/region/No-Training/مفتاح) | مالك المنتج + الأمن/الخصوصية + القانوني | NOT APPROVED |
| تكامل Human Gate بعقد عملية معتمد | مالك Human Gate + الأمن | NOT APPROVED |

بدون مزود معتمد يبقى `approvedProviders=[]`، والنتيجة الصحيحة لمسار الإنفاذ بعد حفظ القرار هي `503 PROVIDER_NOT_CONFIGURED` و`external_action_executed=false`. هذا هو السلوك المتوقع، وليس فشلًا.

## 3. أوامر محلية بلا شبكة أو قاعدة بيانات (قابلة للتشغيل بجهة مخوّلة)

```bash
node --check src/server/firewall/core.mjs
node --check src/server/firewall/guard.mjs
node --check src/server/firewall/provider.mjs
node --check src/server/firewall/local-adapter.mjs
node scripts/firewall-local-verify.mjs
```

`firewall-local-verify.mjs` يستخدم محولًا محليًا ثابت المخرج (`external:false`) ولا يفتح اتصالًا ولا يقرأ مفتاحًا. نجاحه يعني صحة ترتيب الحارس محليًا فقط، ولا يُرفع إلى `VERIFIED` للتشغيل أو العزل أو الاعتماد.

**حالة التنفيذ الآن:** NOT RUN حسب نطاق دفعة الإغلاق (لا تشغيل اختبارات/build/lint تلقائيًا).

## 4. مصفوفة سيناريوهات staging

كل البيانات اصطناعية. يُسجَّل لكل حالة: `commit SHA`، البيئة، المؤسسة/الدور، `decision_id`، `request_id`، `policy_version`، `request_fingerprint`، HTTP، `execution_status`، و`external_action_executed`، دون متن الطلب أو أي سر.

| # | السيناريو | المتوقع في API | المتوقع في الواجهة | دليل مطلوب |
|---|---|---|---|---|
| S1 | جداول/أعمدة Firewall غائبة | `503 FIREWALL_SCHEMA_MISSING` أو `FIREWALL_SCHEMA_OUTDATED` مع `setup:true` | لوحة «التهيئة غير مكتملة» بلا بيانات | استجابة + لقطة |
| S2 | دور runtime بلا صلاحية | `503 FIREWALL_DB_PRIVILEGE` | نفس لوحة التهيئة | استجابة |
| S3 | لا قاعدة مفعّلة | `DENY / NO_ACTIVE_POLICY` | شارة DENY وسبب عربي | قرار محفوظ |
| S4 | DENY | `403 POLICY_BLOCKED` بعد `persisted:true` | لا نص أصلي، ولا استجابة مزود | قرار + عدم وجود أثر egress |
| S5 | REDACT | `200` مع `forwardText` منقح فقط | يظهر النص المنقح فقط | مقارنة قبل/بعد للنص الاصطناعي + أثر المزود |
| S6 | WARN | `409 WARNING_NOT_FORWARDED` | توقف واضح بلا تمرير | قرار + عدم استدعاء |
| S7 | ESCALATE بلا تكامل | `409 HUMAN_GATE_NOT_CONFIGURED`، `review_required:true` | لا يوجد طلب موافقة | قرار + عدم استدعاء |
| S8 | ESCALATE بتكامل معتمد (إن اعتُمد لاحقًا) | `202 REVIEW_PENDING` بلا إرسال | حالة مراجعة معلقة | ربط القرار/الطلب/النسخة |
| S9 | لا مزود معتمد | `503 PROVIDER_NOT_CONFIGURED`، `persisted:true` | `PROVIDER_NOT_CONFIGURED` صريحة | استجابة + لوحة |
| S10 | إعادة استخدام `request_id` نفسه | `409 REQUEST_ALREADY_EVALUATED` أو `REQUEST_ID_CONFLICT` | لا إعادة تنفيذ تلقائية | قرار أول + استجابة ثانية |
| S11 | Kernel policy ليست `ALLOW` | `409 KERNEL_POLICY_REQUIRED` أو `DENY / KERNEL_POLICY_DENIED` | سبب Kernel ظاهر | سلسلة السياسات |
| S12 | فشل تدقيق/إلحاق إلزامي | `503 REQUIRED_AUDIT_UNAVAILABLE` | لا ادعاء حفظ | استجابة + rollback |
| S13 | مهلة المزود (بيئة معتمدة فقط) | `503 PROVIDER_UNAVAILABLE`، `UNKNOWN`، `external_action_executed:null` | تحذير «قد يكون الطلب وصل؛ لا تعِد الإرسال» | وقت البدء/المهلة |
| S14 | محول محلي فقط (تحقق) | `200 LOCAL_SANDBOX_COMPLETED`، `external_action_executed:false` | لا يظهر في الإنتاج | مخرج الأوامر المحلية |

### 4.1 مهلة المزود

`PROVIDER_TIMEOUT_MS=15000` قيمة محلية غير معتمدة كـSLA. لا تُغيَّر في هذه الدفعة. تُختبر فقط في staging معتمد وبمحول staging يتباطأ عمدًا، ويُتحقق من `UNKNOWN` وعدم وجود إعادة تلقائية. لا يُختبر على الإنتاج.

## 5. إثبات عدم الإرسال

- في S3–S7 وS9 وS11: لا استدعاء لمحول المزود (عداد/سجل staging أو عدم وجود egress).
- في S4: قرار DENY محفوظ، ولا نص في أي استجابة.
- في S5: المحول لا يستلم إلا `forwardText` المنقح؛ يُثبت بمقارنة النص الاصطناعي.
- في S13: لا تُسجَّل نجاح ولا يُعاد الإرسال؛ `external_action_executed=null`.

## 6. حدود لا يجوز تجاوزها

- لا مفاتيح أو DSN أو بيانات حقيقية في السجلات أو الأدلة أو Markdown.
- لا تغيير لسياسة Kernel أو RLS أو `approvedProviders` لتسهيل نجاح أي حالة.
- لا اعتبار نجاح S14 أو نجاح build دليلًا على `RUNTIME_VERIFIED` أو `APPROVED`.
- لا نشر أو commit أو push من هذا المستند.

## 7. الجهات المالكة للاعتماد

- **الأمن + مالك المنتج:** نطاق الحماية، الحالات الخمس، عدم التجاوز.
- **الأمن/الخصوصية + القانوني:** اعتماد model/provider/region/No-Training/الاحتفاظ.
- **مالك Human Gate + الأمن:** عقد عملية المراجعة وربطها.
- **مشغّل قاعدة البيانات + الأمن:** staging و`aigas_runtime` وRLS.
- **العمليات:** تنفيذ staging وجمع الأدلة.

**النتيجة الحالية:** `SOURCE_PRESENT` لمسار الحارس والمحول المحلي؛ `NOT_VERIFIED` لكل ما يتطلب staging أو اعتمادًا.
