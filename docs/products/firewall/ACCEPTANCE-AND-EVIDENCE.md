# AIGAS Firewall — ACCEPTANCE-AND-EVIDENCE

> **Document ID:** `AIGAS-FW-ACC-001` · **Version:** `1.0.0-draft` · **Date:** 2026-11-01  
> **Path:** `docs/products/firewall/ACCEPTANCE-AND-EVIDENCE.md`  
> **Release state:** `NOT_APPROVED / OPERATIONAL EVIDENCE NOT VERIFIED`  
> **Scope:** MVP (Firewall independently licensed, with mandatory shared Kernel baseline).

## 1. الغرض وحد الإثبات

هذا المستند هو **بوابة قرار إطلاق AIGAS Firewall**. لا يعتمد تصريح «الميزة تعمل» على وصف الماستر، أو نجاح البناء، أو عرض الشاشة، أو ملف README تاريخي. الدليل المطلوب هو **سلوك قابل للتحقق على مسار AI متكامل حقيقي ومخوّل**، مرتبط بإصدار وكود ونسخة سياسة وهوية وصلاحيات وبيئة محددة، مع إمكانية إظهار حالات المنع/fail-closed دون تسريب أسرار العملاء.

**الحالة عند إنشاء هذا الملف:** مراجعة شجرة GitHub كشفت صفحات Astro ومكونات `ProductExperience`, `DecisionCircuit`, `interior-motion` التعليمية، ولم تكشف ضمن `src/pages` API تشغيليًا لـFirewall. وجود `kernel/README.md` التاريخي لا يكفي لإثبات مزود شغال أو قواعد حظر. **نتائج التشغيل/اختبارات التكامل/النشر التجاري لجميع وظائف Firewall الأساسية: `NOT_VERIFIED`.**

**انفصال المسؤوليات:** مؤلف الوثيقة لا يمنح شهادة امتثال أو موافقة Security/Legal/Owner. اعتماد الإطلاق يتطلب جهات مخولة فعلية وحقائق بيئة/إصدار حديثة.

## 2. قاموس الأدلة وحالات القبول

| الحالة | تعريفها | يجوز معها التسويق كمتاح؟ |
|---|---|---|
| `NOT_VERIFIED` | لا توجد أدلة كافية، أو لم تراجع في الإصدار المقصود | **لا** |
| `NOT_IMPLEMENTED` | المصدر يثبت عدم تنفيذ مسار التشغيل المطلوب | **لا** |
| `IMPLEMENTED_NOT_VERIFIED` | يوجد كود وظيفي لكن لم يثبت سلوكه في البيئة المطلوبة | **لا** |
| `PASS` | دليل مؤرخ قابل للتكرار يثبت المعيار في إصدار وبيئة محددين | فقط ضمن نطاق الدليل وبعد اعتماد الإطلاق |
| `FAIL` | نتيجة مخالفة للمعيار أو شرط أمني | **لا** |
| `BLOCKED` | يحتاج نظام/اعتماد/صلاحية أو شرط غير متوفر | **لا** |
| `NOT_APPLICABLE` | خارج النطاق المعتمد مع سبب وتوقيع مناسب | لا تتوسع في الادعاء |

**درجة المصدر:** `SPEC_ONLY` < `SOURCE_PRESENT` < `LOCAL_RUN` < `INTEGRATED_RUN` < `DEPLOYED_PRODUCTION_EVIDENCE`. ليس كل معيار يتطلب إثبات Production مسبقًا، لكن **لا بد من قبول البيئة ونطاق الدليل المناسبين**، ولا يكون Local Build بدل تكامل.

## 3. بوابات منع إطلاق مطلقة (P0 / No-Go)

أي **FAIL** غير مغلق بدليل جديد في أحد البنود التالية يعني **NO-GO**، ولا يعالجه استثناء تجاري أو تقليل الوصف:

1. **`NG-01`:** Hard Deny أو سياسة أعلى يمكن تجاوزها بموجه AI أو دور أدنى أو وضع Shadow.
2. **`NG-02`:** احتمال أن يأخذ نظام خارجي طلبًا محظورًا رغم قرار Block داخل نطاق التكامل المعلن.
3. **`NG-03`:** تسرب بيانات/إثباتات/مفاتيح مستأجر آخر عند استخدام أو فشل Firewall.
4. **`NG-04`:** السماح الصامت عند تعطل Policy Service أو هوية/ترخيص/ضابط إلزامي.
5. **`NG-05`:** تحول Pending Review أو Expired Approval إلى تنفيذ فعل مؤثر دون قرار موثوق.
6. **`NG-06`:** استخدام بيانات عميل في تدريب/تحسين نموذج بواسطة BRIGHT AI أو مزوده، أو عدم وجود اتفاق/ضابط يفي بهذا الالتزام.
7. **`NG-07`:** توجيه بيانات عميل إلى مزود أو منطقة معالجة أو أداة غير مصرح بها.
8. **`NG-08`:** لا يُسجل الحد الأدنى من الدليل الأمني عندما يكون تسجيله لازمًا، أو يُزوّر نجاح التسجيل.
9. **`NG-09`:** بيانات حقيقية داخل Trial دون تصريح كتابي وبيئة/عقد/سياسة معالجة مثبتة.
10. **`NG-10`:** ادعاء واجهة تجريبية أو API غير منفذة أنها منتج حقيقي متاح.
11. **`NG-11`:** تجربة تنتهي برسوم مدفوعة أو اشتراك تلقائي دون موافقة مستقلة.
12. **`NG-12`:** عدم إمكان تشغيل الترخيص أو الهوية أو سياسة الحماية محليًا في Air-Gapped مع الاستمرار في تسويق هذا النمط كجاهز.

## 4. حزمة الأدلة (Evidence Pack)

هيكل مقترح للحزمة **بعد إنشاء أدلة حقيقية، لا يُنشئ هذا المستند تلك الأدلة**:

```text
Firewall-Release-Evidence/<release-id>/
  release-manifest.json                # commit SHA, artifact digest, date, environment
  scope-and-coverage.md               # integrations, included/excluded models/tools
  approved-policy-export.json         # IDs/versions, no sensitive policy internals
  integration-traces/                 # anonymized allow/block/redact/review evidence
  security/                           # tenant auth, hard deny, fail-closed, tools, DLP
  operations/                         # throttling, outage handling, metrics methodology
  trial/                              # activation/expiry, quotas, PoV/exit where in scope
  deployment/                         # SaaS / On-Prem / Air-Gapped scope evidence
  data-protection/                    # no-training, vendors, regions, retention approvals
  findings-and-remediation.md         # failures, ownership, fixes and re-verification
  release-signoffs.md                 # Product + Eng + Security + Privacy + Commercial
```

**مهم:** ملفات المثال أعلاه أسماء تنظيمية مستقبلية؛ **ليست أدلة موجودة**. أي «Screenshot» قد يساعد فهم واجهة لكن لا يثبت إنفاذًا أو منع تسريب أو سلامة API.

### 4.1 وصف سجل الدليل الموحد

| الحقل | محتواه المطلوب |
|---|---|
| `evidence_id` | معرف فريد وثابت مرجعيًا |
| `requirement_id` | `FW-xx` و`AC-FW-xx` و/أو `NG-xx` |
| `release_id / commit_sha` | الإصدار الفعلي الذي اختُبر؛ لا تاريخ عام |
| `environment_id / deployment_profile` | بيئة اختبار/نشر ومزود/نطاق مأذون دون أسرار |
| `policy_id / version` | نسخة السياسة التي أدت للقرار |
| `tenant_scope` | هوية مستأجر مقنّعة مستمدة من المصادقة |
| `actor_role` | دور الفاعل دون بيانات شخصية غير ضرورية |
| `test_case / timestamp` | الحالة وتاريخ التنفيذ مع منطقة زمنية واضحة |
| `input_classification` | فئة مدخل/بيانات اصطناعية، لا نسخ بيانات حساسة في التقرير |
| `expected / observed` | المتوقع والملاحظ مع أثر خارجي حقيقي |
| `trace / audit_ref` | رابط محكوم الوصول للحدث/سجل التحقق |
| `result` | PASS/FAIL/BLOCKED/NOT_VERIFIED/NA |
| `verifier / review_date` | المراجع ووقت اعتماده |
| `limitations` | النطاق غير المغطى، والافتراضات، والنتائج غير الحاسمة |

## 5. مصفوفة معايير القبول للمنتج — RTM

> كل حالة أدناه `NOT_VERIFIED` عند تحرير الوثيقة؛ دليل الاختبار المطلوب في العمود الأخير لا يعني أنه متوفر.

| AC ID | Requirement | الفعل/النتيجة القابلة للإثبات | دليل إلزامي | شدة |
|---|---|---|---|---|
| `AC-FW-01` | `FW-01` | طلب AI حقيقي يصل لمزود معتمد **فقط** عبر نقطة التكامل المخولة | Proxy/SDK trace + مصدر/وجهة + policy ref | P0 |
| `AC-FW-02` | `FW-02` | `ALLOW` يسمح بعملية مأذون بها وتظهر استجابة خاضعة للضبط | Request/decision/provider response correlation | P0 |
| `AC-FW-03` | `FW-02` | `BLOCK` يمنع الاستدعاء/الأثر الخارجي داخل نطاق التكامل | Trace لا يرسل الطلب إلى provider + قرار مسجل | P0 |
| `AC-FW-04` | `FW-02`,`FW-04` | `REDACT` يمرر محتوى منقحًا لا خامًا | مقارنة synthetic قبل/بعد وegress evidence | P0 عند نشر Redact |
| `AC-FW-05` | `FW-02` | `WARN` لا يتجاوز ضابطًا يوجب Block أو Review | Policy matrix وقرار/تنفيذ | P1 عند نشر Warn |
| `AC-FW-06` | `FW-02` | طلب موافقة لا ينفذ الفعل قبل قرار مخول | Pending event + عدم provider/tool call | P0 عند نشر Review |
| `AC-FW-07` | `FW-02`,`FW-03` | انتهاء الموافقة/رفضها/تغير سياقها يوقف العملية | Review state + token/policy recheck + trace | P0 |
| `AC-FW-08` | `FW-03` | سياسة أعلى تمنع سياسة أدنى تسمح | Hierarchy conflict scenario + policy version | P0 |
| `AC-FW-09` | `FW-03` | Model/user منخفض الصلاحية لا يعدل Hard Deny | Authorization test + denied change evidence | P0 |
| `AC-FW-10` | `FW-03`,`FW-06` | Shadow/Trial لا يعطل hard controls | Shadow result + unchanged enforced deny | P0 |
| `AC-FW-11` | `FW-04` | الكشف يعمل على مدخلات عربية ضمن مجموعة تحقق محددة | Corpus version + outcomes + limitations | P1 |
| `AC-FW-12` | `FW-04` | الكشف يعمل على مدخلات إنجليزية ضمن مجموعة تحقق محددة | Corpus version + outcomes + limitations | P1 |
| `AC-FW-13` | `FW-04` | فحص المخرجات يمنع إفراج بيانات خاضعة لحظر | Controlled output/stream proof | P0 إذا شملت المخرجات الإعلان |
| `AC-FW-14` | `FW-04` | تجنب تخزين raw PII داخل سجلات/trace/Analytics افتراضيًا | Log sampling sanitized + logging config | P0 |
| `AC-FW-15` | `FW-05` | Prompt Injection بمصدر غير موثوق لا يمنحه سلطة | Attack case + authority separation evidence | P0 |
| `AC-FW-16` | `FW-05` | أداة/هدف/نطاق غير مخول يُرفض رغم أمر النموذج | Tool authorization + no-execution trace | P0 |
| `AC-FW-17` | `FW-06` | Monitor mode يحتاج موافقة ونطاقًا ومدة وسياسة | Approval record + config + activity | P1 |
| `AC-FW-18` | `FW-07` | Rate limits/Quota للـtenant دون خطأ حساب/تجاوز | Usage counters + denial + isolation | P1 |
| `AC-FW-19` | `FW-07` | خدمة سياسة/هوية لازمة تتعطل → Fail-Closed | Failure injection + egress-negative proof | P0 |
| `AC-FW-20` | `FW-07` | Provider fallback لا يتجاوز قائمة/منطقة معتمدة | Blocked destination + actual egress record | P0 |
| `AC-FW-21` | `FW-07` | مستأجر لا يصل لسياسات/نتائج/مفاتيح مستأجر آخر | Authorization + DB/cache/queue/log scope | P0 |
| `AC-FW-22` | `FW-08` | سجل أساسي حتى بدون Ledger التجاري | Event persistence evidence, no LD entitlement | P0 |
| `AC-FW-23` | `FW-08` | لا يدّعي Audit نجاحًا عند فشل التسجيل الإلزامي | Fault injection + control outcome | P0 |
| `AC-FW-24` | `Kernel`,`FW-01` | التراخيص تحدد المستأجر والمنتج والوظيفة | Entitlement/identity test and blocking | P0 |
| `AC-FW-25` | Privacy | مزود AI ملزم ومُهيّأ بعدم التدريب على بيانات العميل | Vendor contract/config and approved deployment | P0 |
| `AC-FW-26` | Privacy | بيانات العميل لا تنتقل إلى منطقة/مزود خارج المعتمد | Egress logs, DPA, region decision | P0 |
| `AC-FW-27` | Trial | تجربة Firewall تبدأ بعد تفعيل حقيقي وتنتهي بعد 48h | Activation & expiry log, deny after expiry | P0 قبل Trial |
| `AC-FW-28` | Trial | لا اشتراك مدفوع أو فاتورة تلقائية | Billing/contract workflow + negative case | P0 قبل Trial |
| `AC-FW-29` | Deploy | Air-Gapped يعمل دون شبكة خارجية إذا أعلن توفره | Offline environment & network egress proof | P0 عند إعلان Air-Gapped |
| `AC-FW-30` | Release | التوثيق العام لا يعرض وظائف لم يثبت إصدارها | Feature-to-claim inventory + sign-off | P0 |

### 5.1 تخصيص قبول الوظائف ذات الطبيعة المشروطة

- يجوز **عدم إعلان** ميزة إضافية لم تكتمل، لكن يجب توضيح أنها غير متاحة؛ لا يصح إعلان خمس قرارات كلها عاملة إذا لم يثبت كل نوع قرار.
- لا يجوز جعل `FW-03` Hard Deny أو `FW-07` Fail-Closed أو عزل المستأجر أو سجل أمان أساسي ميزة اختيارية أو متروكة حتى بعد الإطلاق.
- متطلبات الـMVP المشتركة مع Kernel يجب إثباتها في الإصدار والنشر نفسه؛ اختبار منتج مختلف لا يبرر اعتبارها مكتملة.
- المنصات SaaS وOn-Premise وAir-Gapped تحتاج حزمة أدلة ونطاق اعتماد لكل بيئة معلنة؛ لا تعتبر نتيجة بيئة واحدة صالحة تلقائيًا للبقية.

## 6. مجموعات حالات الاختبار العملية

### 6.1 توثيق هوية وتكامل

1. مستأجر A يُرسل طلبًا عبر نقطة تكامل A المعتمدة → المرور وفق السياسة.
2. المستأجر A يحاول استخدام مفتاح/توكن B → رفض قبل الوصول للمحتوى.
3. مستأجر A يرسل في Body `tenant_id=B` → لا يغير السمة المشتقة من السياق الموثق.
4. API Evaluate يقرر Block لكن عميل غير محكوم يحاول الاتصال مباشرة بمزود → لا يُسوق النظام كحماية لذلك المسار غير المحكوم.
5. عند وجود proxy محكوم، مسار bypass المتوقع داخل النطاق المعلن يفشل وفق تعريف الشبكة/الإعداد، ويُوثق بنطاق التغطية.

### 6.2 محرك السياسات والقرارات

1. سياسة `Hard Deny` تمنع منطقة/مزودًا → لا يستدعيه الـGateway ولو طلب العميل السماح.
2. سياسة أدنى تسمح بما تحظره العليا → الرفض هو النتيجة.
3. سياسة Shadow مسموحة تُسجل نتيجة مراقبة دون إيقاف اختياري؛ Hard Deny يبقى نافذًا.
4. قرار Redact: يتلقى المزوّد نصًا منقحًا وتظهر مرجعية سبب دون النص الخام في السجلات.
5. Pending Review: لا يوجد Tool/Provider call. الموافقة تصدر من هوية مخوّلة وتتطلب إعادة تحقق قبل التنفيذ.
6. رفض أو انتهاء مراجعة: لا تنفيذ، ولو أرسل النموذج إشعار «تمت الموافقة» كنص.
7. خطأ داخلي/عدم وجود سياسة لازمة لا يعني Allow افتراضيًا.

### 6.3 كشف البيانات وAI Security

- عينات **اصطناعية** تشمل صيغًا عربية/إنجليزية مختلفة، وحدود كشف وFalse Positive/False Negative موثقة؛ **لا تُثبّت نسبًا دون دراسة قياس**.
- اختبارات Tool calling بمصادر غير موثوقة تطلب exfiltration أو استدعاء مورد غير مخول؛ رفض حقيقي في طبقة الأدوات.
- فحص خروج يتعامل مع ردود مجزأة/متدفقة، مع منع إرسال أجزاء قبل التأكد عند وجود قاعدة إخراج ملزمة.
- التمييز بين غياب كشف لمحتوى خارج نطاق التغطية وبين عيب في إنفاذ سياسة داخل النطاق.

### 6.4 الأعطال والفوترة

- مهلة Engine/IdP/Policy Store/Required Audit → لا تجاوز.
- مزود AI معتمد يسقط؛ لا توجيه إلى مزود آخر غير موافق عليه تلقائيًا.
- محاولات Retry لا تتسبب في تكرار تنفيذ Tool Action/تحصيل وحدة استهلاك، حسب Idempotency approved.
- الحصة تنتهي → القرار واضح ولا توجد رسوم صامتة.
- تجربة 48 ساعة تنتهي → منع trial entitlement بعد الوقت المحدد دون إبطال رخصة أخرى مدفوعة صالحة.
- تقرير PoV يفصل النتيجة الفعلية عن محاكاة UX ويدوّن الحالات غير المختبرة.

## 7. حوكمة الخصوصية والعقود

| بوابة | متطلبات إثبات | مصدر الاعتماد |
|---|---|---|
| No-Training | عقود/إعدادات مزود تمنع الاستخدام في تدريب/تحسين النماذج + إثبات اختيار مزود مناسب | Security + Privacy/Legal |
| Data residency | نطاق تخزين ومعالجة مصرح به وتعريف الاستثناءات | Privacy + Customer |
| Data inventory | أصناف البيانات وسبب جمعها ومكان مرورها وتسجيلها | Data Owner/Privacy |
| Retention | جدول احتفاظ منفصل للسجلات والمحتوى والنسخ وLegal Hold | Legal + Ops |
| Encryption / keys | من يملك المفاتيح وأين تستخدم وكيف تُدوّر وتُبطل | Security/KMS owner |
| Tenant Isolation | حماية كل مخزن/خدمة/سجل لا مجرد API | Security Engineering |
| Vendor & Provider | سجل موردين معتمدين ومناطق ومعالجة وتدفقات | Security/Procurement/Legal |
| Controls applicability | تحديد متطلبات PDPL/NCA/قطاع حسب نطاق الانطباق | Legal/Compliance |

لا تكتب «ممتثل لـPDPL/NCA/ISO/IEC 42001» دون تحديد النطاق والدليل والتصديق/التقييم الفعلي. وجود سياسات مكتوبة لا يثبت تطبيقًا أو شهادة.

## 8. تحقق الحزم والنشر

### 8.1 حزمة إصدار

- Commit SHA، build artifact digest، dependencies/SBOM إن اعتمدت، وتاريخ التجميع.
- أسماء API/Policy schema ونسخها، ومصفوفة توافق العملاء والمزودين.
- قابلية Rollback دون تعطيل سياسة إلزامية أو كشف بيانات.
- إدارة الأسرار؛ لا مفاتيح أو توكنات في المستودع أو ملف الدليل.
- إعدادات Health للموقع العام لا تُستخدم بدل Product Readiness/Policy Engine Health.

### 8.2 SaaS

- عزل مستأجرين، هوية/ترخيص، تدفق egress وبيانات ضمن مناطق معتمدة.
- التحكم في ميزانيات/حصص الطلب، والمراقبة والأمان عند تعطل جزء من الخدمة.
- احتفاظ وصلاحيات دعم مبنية على سياسة وعقد.

### 8.3 On-Premise

- حزمة موقعة قابلة للتحقق، الترخيص المحلي، الهوية، عمليات backup/restore، حسابات الإدارة.
- غياب تسرب أسرار إلى BRIGHT AI أو مزود خارجي إلا بموافقة وقناة صريحة.
- تغطية التكاملات المسموح بها ضمن شبكة العميل وحقوقه.

### 8.4 Air-Gapped

- تشغيل Firewall + Kernel + هوية وترخيص وسياسة وتدقيق ومفاتيح ومزود محلي **دون اتصال إنترنت**.
- تحديث وتوقيع وإبطال/تغيير مفاتيح/سياسات عبر آلية Offline موثقة ومصرح بها.
- فحص سلبي لحركة الشبكة الخارجية وعدم إرسال Telemetry أو License Check خارجي.
- مسار خروج/تصدير أدلة محكوم عند الحاجة، دون تمرير بيانات العميل عبر خدمة غير مصرح بها.

## 9. مصفوفة متطلبات API والمخرجات

| عنصر API | التحقق المطلوب | حالة الوثيقة |
|---|---|---|
| `POST /v1/firewall/evaluations` | التقييم **لا ينفذ** ويرجع `NOT_EXECUTED` | مقترح، لم يثبت نشره |
| `POST /v1/firewall/guarded-executions` | ينفذ فقط بعد السماح ويفرض Block فعليًا | مقترح، لم يثبت نشره |
| قرار `REQUEST_APPROVAL` | `PENDING` مع إيقاف التنفيذ | مقترح، لم يثبت نشره |
| مراجعة أساسية | صلاحية ومهلة/فصل مهام، لا تتطلب شراء Human Gate التجاري | مقترح، لم يثبت نشره |
| معرف القرار | سجل/نسخة سياسة/سبب/هوية نطاق دون PII | مقترح، لم يثبت نشره |
| سلسلة أخطاء | `401/403/409/422/429/503` ومعنى Fail-Closed | مقترح، لم يثبت نشره |
| Idempotency | لا تنفذ عملية ذات أثر مرتين عند Retry | مقترح، لم يثبت نشره |
| المسار المعزول | ترخيص/مصادقة/سياسات دون اتصال Cloud | مقترح، لم يثبت نشره |

**تحذير:** المسارات المعروضة في `API-CONTRACT.yaml` **عناوين تصميم مؤقتة** وليست روابط عاملة. يجب اعتماد نسختها/مسمياتها واختبارها قبل إتاحتها في بوابة مطورين عامة.

## 10. متطلبات ربط سجل الحالة

لا تُرفع ميزة من `PLANNED` إلى `WORKING` في `FEATURE-STATUS.yaml` إلا إذا:

1. ربطت بمعرّف ثابت (`FW-01` … `FW-08`) وحالة قبول مناسبة.
2. عُيّن إصدار/بيئة/N-point integration.
3. أثبت التنفيذ أثره، وظهر أثر الرفض أو التعطل بالموقع الصحيح.
4. توفرت مراجعة مناسبة للأمان والخصوصية والعزل.
5. وُثقت حدود القدرة التي **لم تختبر** حتى لا تُسوّق توسعة غير مثبتة.
6. اعتمد مسؤول المنتج/الإطلاق تغيير الحالة وفق صلاحية فعلية.
7. تمايز السجل المرئي `FW-UI-*` (مجرد شرح UI) عن `FW-*` التشغيلي.

## 11. سجل إغلاق العيوب ونطاق الاستثناء

| الحقل | المطلوب |
|---|---|
| Defect ID | معرف فريد وتاريخ ظهوره |
| Severity | P0/P1/P2 مع أثر موضوعي |
| Affected criteria | AC IDs + FW IDs |
| Root cause | سبب مثبت لا تفسير واجهة عام |
| Reproduction | خطوات ببيانات/حسابات غير حساسة |
| Fix reference | Commit SHA وموضع الإصلاح |
| Retest evidence | إثبات مرور نفس الحالة بعد التغيير |
| Signoff | مالك التخصص المخوّل |
| Known limitation | الإفصاح في Release Notes عند الحاجة |

**استثناء P0:** غير مسموح تسويق منتج جاهز مع فشل P0 غير مغلق. إن كان الخلل ضمن ميزة اختيارية، يمكن حجب الميزة بشكل محكم من الإصدار والتسويق إذا ثبت أن عزلها لا يؤثر في الوظائف الأساسية؛ ويُسجل القرار وصلاحيات اعتماده.

## 12. تقرير الإطلاق (Release Decision Record)

```yaml
release_candidate: NOT_ASSIGNED
product: AIGAS-FW
version: NOT_ASSIGNED
deployment_profile: NOT_ASSIGNED
code_sha: NOT_ASSIGNED
coverage_scope: NOT_APPROVED
all_p0_gates_pass: NOT_VERIFIED
functional_evidence_complete: NOT_VERIFIED
tenant_isolation: NOT_VERIFIED
mandatory_fail_closed: NOT_VERIFIED
privacy_and_provider_approval: NOT_VERIFIED
trial_ready: NOT_VERIFIED
pricing_and_licensing_approved: NOT_VERIFIED
public_claims_reviewed: NOT_VERIFIED
signoffs:
  product_owner: PENDING
  security_owner: PENDING
  privacy_legal: PENDING
  engineering: PENDING
  operations: PENDING
  commercial: PENDING
release_decision: NO_GO_UNTIL_EVIDENCE_AND_APPROVAL
```

**هذه القيم تُمثل الحالة المحفوظة في الوثيقة عند إنشائها، وليس حكمًا بأن التجارب فشلت تقنيًا.** حالتها `NOT_VERIFIED` إلى أن تُقدّم أدلة من إصدار محدد.

## 13. مَن يوقّع على ماذا؟

| صاحب الدور | صلاحية الاعتماد المطلوبة |
|---|---|
| Product Owner | ملاءمة النطاق ومطابقة الادعاءات والمنتجات المستقلة |
| Engineering Lead | اكتمال وظيفة مسار التكامل والفشل وتطابق الإصدار |
| Security Architect | Hard Deny، الأدوات، العزل، إدارة المفاتيح، Fail-Closed |
| Privacy/Legal | No-Training، الموردين، الإقامة/المعالجة، الاحتفاظ، شروط Trial |
| Operations/SRE | جاهزية النشر/المراقبة والتعافي، وإجراءات حادثة وخروج |
| Commercial/Finance | ترخيص/تجربة/حصص/عدم تحويل مدفوع صامت |
| Owner / Release Authority | الموافقة النهائية وفق الصلاحيات المؤسسية المعتمدة |

**لا تُختلق أسماء أو توقيعات أو اعتمادات.** تعتمد سلطة توقيع محددة لاحقًا في مصفوفة صلاحيات الإدارة.

## 14. نطاق المصادر والتعارضات

- `docs/MASTER-PROJECT-BLUEPRINT.md` §03.2 و§04–08 و§12؛ مصدر متطلبات Firewall الثماني.
- `docs/PRODUCT-MASTER-CATALOG.yaml` → `products[AIGAS-FW]`؛ وصف المتطلبات والحدود.
- `docs/PLATFORM-ARCHITECTURE.md`؛ حدود Kernel وفصل المنتجات والفشل والاعتماد.
- `docs/INTEGRATION-AND-DEPLOYMENT.md`؛ واجهات التكامل وأنماط SaaS/On-Premise/Air-Gapped.
- `docs/DATA-PRIVACY-AND-SECURITY.md`؛ العزل، No-Training، الاحتفاظ والخصوصية.
- `docs/ENTERPRISE-TRIAL-POLICY.md`؛ أهلية تجربة 48 ساعة وانتهاؤها.
- `docs/PRICING-AND-LICENSING.md`؛ الاستقلال التجاري وعدم الفوترة المكررة.
- شجرة `YEEEAE/BRIGHTAI`/`main` عند تاريخ إنشاء الوثيقة؛ مراجعة المصدر **ليست دليل تشغيل**.

**مستندات FireWall الشقيقة:** `PRODUCT-SPEC.md`, `FEATURE-STATUS.yaml`, `PAGE-EXPERIENCE.md`, `API-CONTRACT.yaml`, `48H-TRIAL-SPEC.md`.

---

**نتيجة مراجعة الوثيقة:** `DOCUMENT_READY_FOR_OWNER_REVIEW`، أما **حالة إطلاق المنتج: `NO_GO_UNTIL_EVIDENCE_AND_APPROVAL`**. لم تُجر تغييرات على GitHub أو النشر أو العملاء.
