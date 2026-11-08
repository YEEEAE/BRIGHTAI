# سجل موافقات G6 والتجربة المقيدة — BRIGHT AI / AIGAS

> **النوع:** سجل اعتماد مطلوب (سجل فارغ عمدًا). ليس قرارًا نافذًا، وليس تفويضًا بالإرسال أو التفعيل أو الشراء.
> **التاريخ:** 2026-11-09 (محلي).
> **المرشح الحالي:** `13926fb2197ca1fc34e05da59320e9c2243b5a97` — فرع `main` — شجرة عمل نظيفة.
> **ملاحظة SHA:** الـSHA `46ecaeae25368a467c30d27320978fb21aef2077` وقرار المرشح `3eaf6907…` تاريخيان فقط. لا يُنسب أي منهما إلى الحالة الحالية، ولا تعني هذه الوثيقة أن أيًا منهما منشور.
> **حالة النشر:** `NOT DEPLOYED` — لا يوجد دليل أن أي خدمة منشورة تطابق هذا الـSHA.
> **ملف البوابات المرجعي:** `docs/beta/RC-3eaf6907c35d0a138984defb5cf9f947f9520f82/GO-NO-GO-GATES.yaml` (G6). هذا السجل يوسّع G6 وG10/التجربة للحالة الحالية ولا يرفع حالتها.
> **القرار الحالي:** `G6 = BLOCKED` و`Trial / 48h = BLOCKED`. لا إغلاق حتى توقيع الأطراف المذكورة، وتنفيذ التحقق المصرّح به على نفس الـSHA، وحفظ الدليل المؤرخ.

---

## 0. رموز الحالة والحدود

| الرمز | المعنى |
|---|---|
| `SOURCE_PRESENT` | الكود/الوثيقة موجودة في المرشح وقُرئت. لا تثبت التشغيل. |
| `SCHEMA_PRESENT` | الكائن موجود في مخطط قاعدة البيانات المفحوص وقت الجرد. |
| `CONFIGURED` | إعداد فعلي في بيئة معتمدة، لا مجرد قالب أو متغير بيئة. |
| `RUNTIME_VERIFIED` | دليل تشغيل مؤرخ من بيئة معتمدة وعلى نفس المرشح. |
| `APPROVED` | قرار موقّع من صاحب السلطة المحدد. |
| `NOT_VERIFIED` | لا يوجد دليل كافٍ. |
| `BLOCKED` | متعذر الآن لسبب موثق أو لغياب سلطة/بيئة. |

**قاعدة ملزمة:** لا يتحول أي صف إلى `APPROVED` أو `CONFIGURED` بسبب:
- وجود متغير بيئة أو مفتاح،
- نجاح build أو اختبار محلي،
- تعبئة الجدول بنموذج افتراضي أو مزود احتياطي،
- وجود SDK/Sentry/PostHog/Neon MCP متصل.

المفاتيح والأسماء في هذا السجل **أمثلة للحقول المطلوبة**، ولا تُملأ بقيم حقيقية في المستودع.

---

## 1. لقطة الأدلة الحالية (2026-11-09)

| البند | القيمة | المصدر/الطريقة |
|---|---|---|
| Commit الحالي | `13926fb2197ca1fc34e05da59320e9c2243b5a97` | `git rev-parse HEAD` |
| الفرع | `main` | `git branch --show-current` |
| شجرة العمل | نظيفة | `git status --short` |
| مشروع Neon | `young-frog-60183055` — «AIGAS Kernel» | Neon MCP قراءة فقط (`describe_project`) |
| منصة/منطقة Neon | `aws` / `aws-us-east-2` | Neon MCP قراءة فقط |
| إصدار PostgreSQL | `18` | Neon MCP قراءة فقط |
| الفرع الوحيد | `production` = `br-young-bird-b43proeb`، `protected=false`، `primary=true` | Neon MCP قراءة فقط (`list_branches`) |
| النماذج المعتمدة (Secure Chat) | `APPROVED_MODELS = []` | `src/server/secure-chat/models.mjs` |
| مزودو Firewall | `approvedProviders = []` | `src/server/firewall/provider.mjs` |
| مسار إرسال خارجي | غير معتمد وغير مهيأ | السجلان أعلاه + حالات `PROVIDER_NOT_CONFIGURED` |
| تجربة 48 ساعة | غير مفعلة، لا self-service، لا تحويل تلقائي | `src/server/kernel/trial.mjs`, `docs/ENTERPRISE-TRIAL-POLICY.md` |
| بوابة التطبيق | `AIGAS_APP_ENABLED=false` | `render.yaml`, `src/server/kernel/env.mjs` |

**حدود اللقطة:** لم تُطبّق migrations، ولم تُكتب بيانات، ولم يُشغّل build/اختبار/متصفح، ولم يُنشر شيء. الجرد الحي مقصور على قراءة كتالوج/إعداد Neon.

---

## 2. سجل G6 — مزودو ونماذج Secure Chat

> **الحالة:** فارغ عمدًا — `NOT_APPROVED` / `SOURCE_PRESENT` للسجل الفارغ فقط.
> **قاعدة الكود:** إضافة أي مدخل تحتاج اعتمادًا فعليًا مكتوبًا؛ متغيرات البيئة وحدها لا تعتمد نموذجًا. `listModels()` لا يعلن الإتاحة إلا بنموذج `READY` + حصة معتمدة + دالة `0016` قابلة للتنفيذ.

| # | provider | model IDs | region (معالجة/تخزين) | retention | no-training | DPA / بنود | scope (tenantIds + الغرض) | endpoint | rate/quota | secret store ref | expiry | Product | Security/Privacy | Legal | الحالة |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| SC-1 |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `NOT_APPROVED` |
| SC-2 |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `NOT_APPROVED` |

**حقول إلزامية لكل مدخل قبل أي كتابة كود:**
- `id`, `label`, `tenantIds[]`, `region`, `protocol='CHAT_COMPLETIONS_V1'`, `endpoint`, `providerModel`.
- `apiKeyEnv` يشير إلى اسم متغير في Secret Store، **وليس** إلى قيمة داخل المستودع.
- `maxOutputTokens`, `maxRequestTokens`, `maxInputBytes`, `inputOverheadTokens` (حدود مراجعة لهذا النموذج/البروتوكول تحديدًا).
- `timeoutMs` مع سبب مراجعة (الافتراضي 15s في Firewall ليس SLA معتمدًا).
- `approval: { reference, expiresAt, noTraining:true, retentionReference, regionReference }`.
- حصة استخدام معتمدة: `AIGAS_SC_LIMITS_APPROVAL_REF` + حدود فعلية؛ غيابها = `USAGE_POLICY_NOT_CONFIGURED` وليس «غير محدود».

**ممنوع:**
- إضافة نموذج افتراضي أو مزود احتياطي لملء الفراغ.
- تفعيل إرسال خارجي لأغراض العرض أو الاختبار على بيانات حقيقية.
- اعتبار نجاح استدعاء مزود أثناء تطوير دليلًا على `APPROVED`.
- كتابة مفتاح أو endpoint داخلي أو DSN في هذا السجل أو في الـMind.

**تبعية:** `migrations/0016` (دالة الحصة) غير مطبقة على الفرع المفحوص، لذلك حتى بوجود مدخل معتمد لاحقًا يبقى الإرسال مغلقًا حتى `USAGE_POLICY_NOT_READY` يُحل بدليل.

---

## 3. سجل G6 — مزودو Firewall

> **الحالة:** فارغ عمدًا — `NOT_APPROVED`.
> **قاعدة الكود:** `external:true` إلزامي؛ المحول المحلي `local-adapter.mjs` لا يُسجّل كمزود معتمد ولا يظهر كإتاحة. أي غياب/انتهاء = `PROVIDER_NOT_CONFIGURED` مع حفظ قرار السياسة فقط.

| # | provider | model/version | region | retention | no-training | DPA | scope (tenantIds) | endpoint | rate/quota | secret store ref | approval ref | expiry | Product | Security | Legal | الحالة |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| FW-1 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `NOT_APPROVED` |
| FW-2 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `NOT_APPROVED` |

**شروط إضافية:** يجب أن يعلن المزود `external:true` و`localSandbox!==true`، وأن يحمل `approvalReference` و`approvedUntil` صالحين. لا يُقبل مزود من JSON أو من طلب متصفح.

**تبعية:** تكامل Human Gate للتصعيد (`ESCALATE`) يجب أن يكون معتمدًا قبل أي تنفيذ فعلي؛ وإلا يبقى `HUMAN_GATE_NOT_CONFIGURED` و`EXECUTION_INTEGRATION_NOT_CONFIGURED`.

---

## 4. سجل التجربة 48 ساعة — طلب اعتماد لا قرار نافذ

### 4.1 النطاق المقيد المقترح (مطلوب اعتماده)

| البند | القيمة المقترحة | الحالة |
|---|---|---|
| المؤسسات | 2 كحد أقصى، معزولة تمامًا | `REQUESTED` — تحتاج توقيع مالك المنصة + الأمن |
| المستخدمون | 5 كحد أقصى لكل مؤسسة | `REQUESTED` |
| البيانات | اصطناعية فقط؛ لا بيانات عملاء ولا نسخ من production | `REQUESTED` |
| البيئة | staging معتمد فقط | `REQUESTED` — يعتمد على G5/G7 |
| التفعيل | مشغّل مخوّل يدويًا بعد التوقيع؛ **لا self-service** | `REQUESTED` |
| الإرسال الخارجي | ممنوع حتى G6 | `BLOCKED` |
| الدفع/التحويل | لا دفع، لا فاتورة، لا تحويل تلقائي | `REQUESTED` + سلوك الكود `SOURCE_PRESENT` |
| المدة | 48 ساعة من `activated_at` الفعلي، لا من الطلب/التسجيل | `SOURCE_PRESENT` |
| Exit | تصدير/حذف بسياسة معتمدة | `BLOCKED` |

هذا النطاق **طلب اعتماد**، وليس قرارًا نافذًا ولا وعدًا للعميل.

### 4.2 موافقة دور المسؤول عن التجربة (Trial Operator)

لا يُفعّل أي استحقاق إلا بعد تسجيل هذه الحقول وتوقيعها:

| الحقل | الشرط | الحالة |
|---|---|---|
| اسم المشغّل | شخص مسمّى، مستقل عن مقدّم الطلب | `NOT_APPROVED` |
| نافذة التنفيذ | تاريخ/وقت UTC + مرجع التذكرة | `NOT_APPROVED` |
| جاهزية المنتج | منتج واحد محدد اجتاز تحققًا فعليًا **بعد** التفويض، على نفس SHA، بدليل مؤرخ | `NOT_VERIFIED` |
| بيانات اصطناعية | `dataMode=SYNTHETIC` مثبت في الطلب | `SOURCE_PRESENT` |
| إقرار العميل | موافقة مكتوبة على النطاق والبيانات والحدود | `NOT_APPROVED` |
| اعتماد المنتج/المزود | لا Secure Chat/Firewall خارجي قبل G6 | `BLOCKED` |
| سجل التفعيل | `activated_at` + `expires_at = activated_at + 48h` في نفس المعاملة | `SOURCE_PRESENT` |
| التحويل | `automaticConversion=false`, `automaticCharge=false`, `automaticRenewal=false` | `SOURCE_PRESENT` |

**ربط إلزامي بالمنتج الفعلي:** لا يبدأ العداد ولا يُنشأ استحقاق لمجرد الموافقة الإدارية. يجب أن يكون المنتج:
1. محددًا كتابيًا في نطاق التجربة،
2. قد اجتاز تحقق القبول المخصص له بعد التفويض (على staging معتمد وبيانات اصطناعية)،
3. مربوطًا بدليل في `docs/products/<product>/ACCEPTANCE-AND-EVIDENCE.md` أو ما يعادله،
4. موقّعًا من مالك المنتج + الأمن.

**ممنوع:**
- تعبئة `aigas_trial_requests` أو `aigas_trial_entitlements` ببيانات وهمية على `production` لاختبار الواجهة.
- إنشاء استحقاق عبر SQL يدوي غير مراجع.
- تحويل `APPROVED` إلى `ACTIVATED` دون `readinessVerified` و`customerAcknowledged` وبيانات اصطناعية.
- أي مسار دفع/تجديد/تحويل تلقائي.

**تبعية:** `migrations/0023` غير مطبقة على الفرع المفحوص؛ لذلك كل قراءة دورة الحياة ترجع `NOT_CONFIGURED` / `MIGRATION_0023_NOT_APPLIED`، وهذا سلوك fail-closed مقصود.

---

## 5. إقامة البيانات — الواقع مقابل الادعاء

| البند | الحالة | الدليل |
|---|---|---|
| منطقة مشروع Neon | `aws-us-east-2` (منصة `aws`) | Neon MCP `describe_project`، 2026-11-09 |
| ادعاء استضافة سعودية | **ممنوع** | `docs/DATA-PRIVACY-AND-SECURITY.md` §8.2؛ `P0-09` |
| النص التجاري الحالي | لا يدّعي استضافة سعودية؛ ينفي افتراضها | فحص `src/components/ProductContentExtension.astro`, `src/pages/knowledge/*` |
| تغيير المنطقة/النقل | **لم يُنفّذ** | خارج نطاق هذه الدفعة |

**قرار مالك مطلوب (واحد من اثنين، لا يُتخذ تلقائيًا):**
- **A:** إبقاء `aws-us-east-2` وتثبيت النص التعاقدي/التسويقي على المنطقة الفعلية وحدود المعالجة.
- **B:** خطة نقل إلى منطقة سعودية/مشروع منفصل، مع تقدير كلفة ومخاطر وترحيل واختبار استعادة وتوقيع قانوني.

لا تُوصف المنصة بـ«الاستضافة السعودية» أو «إقامة بيانات سعودية» قبل القرار والدليل التشغيلي.

---

## 6. شروط التوقف الآمن (fail-closed) — الحد الأدنى

> الحماية الأساسية في Kernel لا تعتمد على اشتراك منتج اختياري. غياب الترخيص/الحصة/المزود يمنع **الإرسال/التنفيذ**، ولا يعطّل التحقق من الهوية أو العزل أو حجب الأسرار.

| # | الحالة | السلوك المتوقع | مرجع الكود | حالة التحقق |
|---|---|---|---|---|
| FC-01 | سجل نماذج Secure Chat فارغ | لا قائمة إرسال؛ `NO_APPROVED_MODEL` / `PROVIDER_NOT_CONFIGURED`؛ لا محتوى يخرج ولا يُحفظ | `secure-chat/models.mjs`, `service.mjs`, `adapter.mjs` | `SOURCE_PRESENT` / `NOT RUN` |
| FC-02 | اعتماد النموذج منتهٍ | `MODEL_APPROVAL_EXPIRED`؛ لا إرسال | `adapter.mjs` (`providerState`) | `SOURCE_PRESENT` / `NOT RUN` |
| FC-03 | حصة غير معتمدة أو غير صالحة | `USAGE_POLICY_NOT_CONFIGURED` / `USAGE_POLICY_INVALID`؛ `reserve()` لا يحجز بلا سياسة | `secure-chat/policy.mjs` | `SOURCE_PRESENT` / `NOT RUN` |
| FC-04 | سياسة حصة معتمدة لكن دالة `0016` غائبة/بلا EXECUTE | `USAGE_POLICY_NOT_READY`؛ لا إتاحة | `secure-chat/service.mjs` | `SOURCE_PRESENT` / `NOT RUN` |
| FC-05 | مزود Firewall غائب أو منتهٍ | `PROVIDER_NOT_CONFIGURED` مع حفظ قرار السياسة؛ `execution=BLOCKED`؛ لا استدعاء | `firewall/provider.mjs`, `guard.mjs`, `service.mjs` | `SOURCE_PRESENT` / `NOT RUN` |
| FC-06 | Human Gate غير مهيأ للتصعيد | `HUMAN_GATE_NOT_CONFIGURED` / `EXECUTION_INTEGRATION_NOT_CONFIGURED`؛ `BLOCKED` | `firewall/guard.mjs` | `SOURCE_PRESENT` / `NOT RUN` |
| FC-07 | قرار Firewall حاجب | `POLICY_BLOCKED` قبل أي مزود؛ لا استدعاء | `firewall/guard.mjs` | `SOURCE_PRESENT` / `NOT RUN` |
| FC-08 | لا منحة ولا ترخيص ولا تجربة نشطة | `PRODUCT_NOT_ENABLED` / `NO_ACTIVE_ACCESS_SOURCE`؛ لا وصول للمنتج | `kernel/access.mjs` | `SOURCE_PRESENT` / `NOT RUN` |
| FC-09 | `0023` غير مطبقة | `NOT_CONFIGURED` / `MIGRATION_0023_NOT_APPLIED`؛ لا استحقاق مخترع | `kernel/trial.mjs` | `SOURCE_PRESENT` / `SCHEMA` غائب |
| FC-10 | نافذة التجربة غير مضبوطة على 48 ساعة بالضبط | `INVALID_48_HOUR_WINDOW` / `BLOCKED`؛ لا استحقاق | `kernel/trial.mjs` | `SOURCE_PRESENT` / `NOT RUN` |
| FC-11 | اتصال DB متجاوز RLS بينما `AIGAS_REQUIRE_RLS=true` | رفض الاتصال/العملية؛ ليس سماحًا صامتًا | `kernel/db.mjs` (`requireRlsPosture`) | `SOURCE_PRESENT` / `NOT RUN` |
| FC-12 | جداول Kernel/الأعمدة المطلوبة غير موجودة | `KERNEL_ADMIN_SETUP_REQUIRED` / `DB_PRIVILEGE_UNAVAILABLE` | `kernel/access.mjs` | `SOURCE_PRESENT` / `NOT RUN` |
| FC-13 | محتوى يشبه سرًا في Secure Chat | `SENSITIVE_CONTENT_BLOCKED`؛ لا إرسال؛ فحص الخروج يعاد قبل الإرسال | `secure-chat/policy.mjs` (`sc-baseline-v1`) | `SOURCE_PRESENT` / `NOT RUN` |
| FC-14 | فشل تدقيق/كتابة إلزامية | فشل العملية بدليل/حالة `EVIDENCE_UNAVAILABLE` بدل نجاح شكلي | `kernel/service.mjs` (`audit`) | `SOURCE_PRESENT` / `NOT RUN` |

**حماية مستقلة عن الاشتراكات (تبقى فعّالة حتى بلا أي منتج مدفوع):**
1. `INPUT_POLICY` الأساسية تعمل على كل طلب Secure Chat؛ لا تحتاج رخصة Firewall.
2. قرار Firewall يُحفظ قبل أي استدعاء، و`DENY` يمنع الاستدعاء بالكامل.
3. `requireProductAccess` يفصل المصادر (إداري/تجربة/ترخيص) ولا يمنح وصولًا عند غيابها.
4. `audit()` يفشل مغلقًا عند تعذر الدليل بدل ادعاء نجاح.
5. لا مزود/نموذج افتراضي عند غياب الإعداد.

**حدود هذه الشروط:** هي شروط سلوكية مصدرية؛ لم تُختبر تشغيليًا في هذه الدفعة. لا تتحول إلى `RUNTIME_VERIFIED` إلا بتشغيلها على بيئة معتمدة وتسجيل الرموز والاستجابات.

---

## 7. التبعيات وشروط الإغلاق

### 7.1 تبعيات داخلية

| التبعية | الأثر على G6/التجربة | الحالة |
|---|---|---|
| `0016` حصة Secure Chat | لا إرسال بلا دالة حصة قابلة للتنفيذ | غير مطبقة |
| `0023` دورة التجربة | لا استحقاق/تفعيل/انتهاء فعلي | غير مطبقة |
| `0017` سياق التدقيق | أي مسار `audit()` قد يفشل على المخطط الحالي | غير مطبقة |
| `0025`/`0027` عزل المؤسسات والمتن | لا تجربة آمنة قبل عزل مؤسستين | غير مطبقة |
| G5 staging | لا تفعيل تجربة/مزود على production | `BLOCKED` |
| G7 restore | لا بدء PoV بلا استعادة موثقة | `BLOCKED` |
| G8 monitoring | لا بدء PoV بلا on-call/تنبيهات | `BLOCKED` |

### 7.2 شروط إغلاق G6

1. مدخل معتمد واحد على الأقل لكل من Secure Chat وFirewall، بالحقول كاملة، أو قرار صريح بإبقاء السجل فارغًا وعدم تقديم المنتج.
2. مرجع Secret Store لكل مفتاح، دون قيمة في المستودع.
3. `region` و`retention` و`no-training` موثقة بعقد/DPA أو ملحق.
4. مراجعة أثر الخصوصية (PIA) موقعة لنطاق Beta.
5. دليل اختبار سلبي: طلب بلا نموذج/بمزود منتهٍ/بحصة غائبة لا يخرج ولا يُنشئ ادعاء نجاح.
6. توقيع Product + Security/Privacy + Legal + (عند الانطباق) DB Operator.

### 7.3 شروط إغلاق التجربة

1. توقيع النطاق المقيد (مؤسستان/5 مستخدمين/بيانات اصطناعية/بلا إرسال خارجي/بلا دفع).
2. `0023` مطبقة على staging معتمد، مع فحص كتالوج بعد التطبيق.
3. مشغّل مسمّى مستقل، ونافذة تنفيذ موقعة.
4. منتج واحد محدد اجتاز تحققًا فعليًا بعد التفويض.
5. اختبار انتهاء 48 ساعة بلا تحويل/خصم، واختبار رفض التفعيل قبل الجاهزية.
6. سياسة Exit (تصدير/حذف) معتمدة قبل أي بيانات تجربة.

---

## 8. سجل التوقيعات (فارغ)

| القرار | الدور | القرار | الاسم | التاريخ | مرجع الدليل |
|---|---|---|---|---|---|
| اعتماد مزود/نموذج Secure Chat | مالك المنتج + الأمن/الخصوصية + القانوني | GO / NO-GO |  |  |  |
| اعتماد مزود Firewall | مالك المنتج + الأمن + القانوني | GO / NO-GO |  |  |  |
| اعتماد DPA/Retention/No-Training | القانوني + الخصوصية | GO / NO-GO |  |  |  |
| اعتماد PIA لنطاق Beta | الخصوصية | GO / NO-GO |  |  |  |
| اعتماد النطاق المقيد للتجربة | مالك المنصة + الأمن | GO / NO-GO |  |  |  |
| تعيين مشغّل التجربة ونافذتها | مالك المنصة | GO / NO-GO |  |  |  |
| بدء 48h PoV | مالك المنتج + مالك المنصة | GO / NO-GO |  |  |  |
| قرار إقامة البيانات (A/B) | مالك المنصة + القانوني | GO / NO-GO |  |  |  |

**لا يُعد أي صف موافقة حتى يُملأ الاسم والتاريخ والدليل. الجدول الفارغ نفسه دليل على أن G6 ما زال `BLOCKED`.**

---

## 9. خطة التحقق اللاحقة (NOT RUN — تحتاج تفويض المالك)

| # | الفحص | أمر/إجراء مقترح | معيار القبول |
|---|---|---|---|
| V1 | رفض الإرسال بلا نموذج | طلب `listModels` ثم `sendMessage` ببيانات اصطناعية | `NO_APPROVED_MODEL` / لا استدعاء شبكي |
| V2 | رفض الحصة الغائبة | نفس الطلب مع مدخل نموذج وهمي غير معتمد | `USAGE_POLICY_NOT_CONFIGURED` |
| V3 | رفض المزود المنتهي | مدخل اختبار بصلاحية منتهية على بيئة معزولة | `MODEL_APPROVAL_EXPIRED` / `PROVIDER_NOT_CONFIGURED` |
| V4 | Firewall بلا مزود | قرار `ALLOW` مع سجل فارغ | `PROVIDER_NOT_CONFIGURED`، `execution=BLOCKED`، لا استدعاء |
| V5 | Firewall `DENY` | قرار حاجب | `POLICY_BLOCKED` قبل أي مزود |
| V6 | التجربة بلا `0023` | قراءة دورة الحياة | `MIGRATION_0023_NOT_APPLIED` |
| V7 | نافذة غير 48h | صف اختبار على staging | `INVALID_48_HOUR_WINDOW` / لا استحقاق |
| V8 | انتهاء بلا تحويل | صف `ACTIVATED` ثم تجاوز الوقت | `EXPIRED`، لا دفع/تجديد |
| V9 | حجب الأسرار بلا رخصة Firewall | رسالة اصطناعية تحوي مفتاحًا وهميًا | `SENSITIVE_CONTENT_BLOCKED` |
| V10 | عزل مؤسستين | سيناريو A/B | لا قراءة/كتابة عبر المؤسسة |

**قيود:** لا تُستخدم بيانات حقيقية، ولا أسرار، ولا `production`. كل تشغيل يحتاج بيئة staging معتمدة، وتفويضًا مستقلًا، وتسجيلًا مؤرخًا للنتيجة.

---

## 10. الخلاصة

- **G6:** `BLOCKED` — السجلان فارغان، لا اعتماد مزود/نموذج/منطقة/احتفاظ/No-Training/DPA/Secret Store. الكود fail-closed `SOURCE_PRESENT` فقط.
- **التجربة 48 ساعة:** `BLOCKED` — النطاق المقيد طلب اعتماد، لا self-service، لا تحويل تلقائي، ولا استحقاق بلا `0023` ومنتج متحقق.
- **إقامة البيانات:** `VERIFIED` أن Neon في `aws-us-east-2`؛ ادعاء السعودية `PROHIBITED` حتى قرار موثق.
- **Beta:** لا `GO`. لا `READY`. لا نشر ولا إرسال خارجي ولا كتابة على Neon في هذه الدفعة.
