# ترتيب التنفيذ الأفضل

نفّذ بهذا الترتيب، لا تخلط كل شيء مرة واحدة:

```txt
1. برومبت اكتشاف المنتجات التي لا تملك ديمو
2. برومبت نقل interview إلى demo/smart-hiring-system
3. برومبت نقل try إلى demo/data-analyzer
4. برومبت إصلاح المنتجات الناقصة وربطها بـ demo
5. برومبت تحسين كل /demo/
6. برومبت التنظيف
7. برومبت ما قد تكون نسيته
8. برومبت QA النهائي
```

أهم شيء الآن: لا تبدأ بتحسينات SEO قبل نقل** **`interview` و `try`. النقل أولاً، ثم إصلاح** **`services/index.html`، ثم التحسينات. otherwise بتضطر تعدّل نفس الروابط مرتين.

أكيد. هذا برومبت شامل لتوحيد Gemini AI API داخل:

```txt
/Users/yzydalshmry/Desktop/BRIGHTAI/backend
```

والتحقق أن كل صفحات** **`/demo/` مربوطة به وتعمل بشكل صحيح بدون مفاتيح مكشوفة أو ربط مباشر من الواجهة.

---

# برومبت توحيد Gemini API لكل صفحات الديمو

```txt
أنت Senior Backend AI Engineer + Full-Stack QA Auditor + Security Reviewer.

أعمل على مشروع Bright AI في المسار:

/Users/yzydalshmry/Desktop/BRIGHTAI

المطلوب:
توحيد كل تكاملات Gemini AI داخل Backend فقط، ثم التحقق أن كل صفحات الديمو داخل /demo/ تستخدم هذا التكامل الموحد وتعمل بشكل صحيح.

المسار الأساسي للـ Backend:

/Users/yzydalshmry/Desktop/BRIGHTAI/backend

الهدف النهائي:
- كل ديمو يرسل طلباته إلى Backend داخلي.
- كل Backend AI requests تمر عبر ملف Gemini Gateway موحد.
- لا يوجد أي API Key في الواجهة.
- لا يوجد fetch مباشر من المتصفح إلى Gemini.
- كل ديمو يستقبل نتيجة منظمة قابلة للعرض.
- كل ديمو يحتوي fallback و error handling.
- كل صفحات /demo/ تعمل بدون كسر.

ابدأ بفحص بنية المشروع ولا تفترض أسماء الملفات.

ابحث أولاً عن ملفات Gemini أو AI الموجودة:
- backend/server.js
- backend/services/aiGateway.js
- backend/services/geminiGateway.js
- backend/services/geminiClient.js
- backend/services/unifiedAiGateway.js
- backend/routes/
- backend/controllers/
- backend/middleware/
- assets/js/gemini-demo-engine.js
- assets/js/ai-agent-demo-suite.js
- assets/js/live-demo-apps.js
- frontend/js/demo-experience.js

إذا وجدت أكثر من ملف يتعامل مع Gemini:
لا تحذف مباشرة.
أنشئ طبقة موحدة واجعل الباقي يستدعيها أو يتحول إليها تدريجياً.

المطلوب تنفيذياً:

## المرحلة 1: اكتشاف بنية الذكاء الاصطناعي الحالية

افحص كل المشروع وابحث عن:

- GEMINI_API_KEY
- GOOGLE_API_KEY
- generativelanguage.googleapis.com
- google.generativeai
- @google/generative-ai
- GoogleGenerativeAI
- Gemini
- gemini
- /api/ai/
- chat/completions
- responseMimeType
- responseSchema
- schemaName
- demoType
- agentType
- fetch(

اعطني تقريراً قبل التعديل يحتوي على:
- كل الملفات التي تحتوي تكامل Gemini
- كل endpoints الخاصة بالذكاء الاصطناعي
- كل ملفات frontend التي تستدعي AI
- هل يوجد API Key في frontend؟
- هل يوجد fetch مباشر إلى Gemini؟
- هل يوجد أكثر من gateway؟
- هل يوجد ديموهات تستخدم endpoints مختلفة؟

بعد التقرير، ابدأ الإصلاح.

## المرحلة 2: إنشاء أو تثبيت Gemini Gateway موحد

اعتمد ملفاً واحداً داخل backend ليكون المصدر الموحد، ويفضل:

backend/services/aiGateway.js

إذا الملف موجود، حسّنه بدلاً من إنشاء ملف جديد.
إذا غير موجود، أنشئه.

يجب أن يدعم الملف الموحد الآتي:

1. قراءة GEMINI_API_KEY من environment فقط:
- process.env.GEMINI_API_KEY
- أو process.env.GOOGLE_API_KEY كـ fallback إن كان مستخدماً في المشروع

ممنوع نهائياً:
- hardcoded API key
- إرسال API key للواجهة
- تسجيل API key في logs

2. دالة موحدة مثل:

async function runGeminiCompletion({
  model,
  messages,
  system,
  temperature,
  maxOutputTokens,
  responseFormat,
  schemaName,
  schema,
  demoType,
  agentType,
  locale,
  sourcePage,
  safetyProfile,
  metadata
})

3. دعم الرسائل بصيغة قريبة من OpenAI:
messages: [
  { role: "system", content: "..." },
  { role: "user", content: "..." }
]

ثم تحويلها داخلياً إلى صيغة Gemini.

4. دعم structured output:
إذا جاء response_format من النوع:
{
  "type": "json_schema",
  "json_schema": {
    "name": "...",
    "schema": {}
  }
}

حوّله إلى Gemini generationConfig بما يناسب:
- responseMimeType: "application/json"
- responseSchema إن كان مدعوماً في المكتبة/النمط الحالي

إذا كان responseSchema غير متاح في النسخة الحالية:
- استخدم responseMimeType: "application/json"
- أضف تعليمات صارمة داخل prompt لإرجاع JSON فقط
- أضف JSON parsing و validation بعد الرد

5. دعم schemaName:
أنشئ mapping موحد للـ schemas مثل:

const demoSchemas = {
  recruitmentSchema,
  smartHiringSchema,
  medicalArchiveSchema,
  dataAnalyzerSchema,
  dataPlatformSchema,
  educationSchema,
  hospitalOpsSchema,
  documentAutomationSchema,
  customerSupportSchema,
  marketingAutomationSchema,
  supplyChainSchema,
  customAiAgentSchema,
  competitorAnalysisAgentSchema,
  seoAgentSchema,
  marketingAgentSchema,
  opportunityDiscoveryAgentSchema,
  aiConsultingSchema,
  approvalsAutomationSchema,
  hrAutomationSchema,
  operationalReportsSchema,
  socialDataAnalysisSchema
}

واسمح أيضاً بالأسماء التالية كـ aliases:
- recruitment
- smart_hiring_system
- medical_archive
- data_analyzer
- data_platform
- education
- hospital_ops
- document_automation
- customer_support
- marketing_automation
- supply_chain
- custom_ai_agent
- competitor_analysis_agent
- seo_agent
- marketing_agent
- opportunity_discovery_agent
- ai_consulting
- approvals_automation
- hr_automation
- operational_reports
- social_data_analysis

6. دعم fallback آمن:
إذا فشل Gemini:
- رجّع JSON error مفهوم
- لا ترجع raw stack trace
- لا ترجع API key
- لا ترجع تفاصيل حساسة
- status code مناسب
- message عربي مناسب للواجهة

مثال:
{
  "ok": false,
  "error": {
    "code": "AI_PROVIDER_UNAVAILABLE",
    "message_ar": "تعذر تشغيل التحليل الآن. يمكنك استخدام المثال الجاهز أو إعادة المحاولة."
  }
}

7. Logs آمنة:
سجّل فقط:
- requestId
- demoType
- agentType
- schemaName
- sourcePage
- latency
- success/fail

لا تسجل:
- API keys
- ملفات مرفوعة كاملة
- بيانات شخصية
- محتوى طبي حساس
- CV كامل
- رسائل عملاء كاملة

8. Safety profiles:
أضف إعداد safetyProfile حسب نوع الديمو:
- healthcare
- recruitment
- education
- marketing
- competitor_intelligence
- sales_leads
- general_business

كل profile يضيف system safety instructions مناسبة.

## المرحلة 3: توحيد Backend Endpoints

افحص backend/server.js أو routes.

أنشئ أو ثبّت endpoint موحد:

POST /api/ai/chat/completions

يقبل body مثل:

{
  "model": "gemini-2.5-flash",
  "demoType": "seo_agent",
  "agentType": "seo_agent",
  "schemaName": "seoAgentSchema",
  "locale": "ar-SA",
  "sourcePage": "/demo/seo-ai-agent/",
  "messages": [
    { "role": "system", "content": "..." },
    { "role": "user", "content": "..." }
  ],
  "response_format": {
    "type": "json_schema",
    "json_schema": {
      "name": "seoAgentSchema",
      "schema": {}
    }
  },
  "temperature": 0.2
}

ويرجع:

{
  "ok": true,
  "provider": "gemini",
  "model": "...",
  "requestId": "...",
  "data": {}
}

أو إذا كان المشروع يستخدم response مباشرة:
حافظ على التوافق، لكن وثّقه.

أي endpoints قديمة مثل:
- /api/ai/gemini
- /api/ai/demo
- /api/ai/openai-chat
- /api/ai/ocr
- /api/ai/medical

لا تكسرها.
اجعلها تستدعي نفس aiGateway.js داخلياً أو ترجع redirect داخلي منطقي.
الأهم أن لا يبقى فيها Gemini logic مكرر.

## المرحلة 4: توحيد Frontend AI Client

افحص ملفات الواجهة:
- assets/js/gemini-demo-engine.js
- assets/js/ai-agent-demo-suite.js
- assets/js/live-demo-apps.js
- frontend/js/demo-experience.js
- أي JS داخل demo/*

المطلوب:
كل ديمو يجب أن يستخدم function موحدة مثل:

window.BrightAI.generateDemoResult({
  demoType,
  agentType,
  schemaName,
  sourcePage,
  userInputs,
  systemPrompt,
  taskPrompt,
  fallbackResult
})

هذه الدالة يجب أن ترسل إلى:

/api/ai/chat/completions

ممنوع:
- fetch مباشر إلى Gemini
- API Key في localStorage/sessionStorage
- إدخال API Key من المستخدم في واجهة الإنتاج
- نسخ logic Gemini في كل صفحة ديمو

إذا وجدت صفحات تطلب من المستخدم إدخال Gemini API Key:
- أزل ذلك من واجهة الإنتاج
- أبقِ خيار dev فقط إن كان مفيداً، لكن مخفي أو محمي ببيئة development
- اجعل الديمو يستخدم Backend دائماً

## المرحلة 5: ربط كل صفحات /demo/

افحص كل مجلد داخل:

/Users/yzydalshmry/Desktop/BRIGHTAI/demo/

لكل ملف:
demo/*/index.html

تحقق من:
- وجود script لمحرك الديمو الموحد
- وجود data-demo-type أو data-agent-demo أو ما يعادله
- وجود schemaName واضح
- وجود fallbackResult
- وجود زر تشغيل AI
- وجود زر Sample Data
- وجود Result Dashboard
- وجود Error State
- عدم عرض JSON خام للمستخدم

الديموهات التي يجب فحصها على الأقل:

- /demo/smart-hiring-system/
- /demo/data-analyzer/
- /demo/data-quality/
- /demo/text-analysis/
- /demo/customer-service-automation/
- /demo/custom-ai-agent/
- /demo/competitor-analysis-agent/
- /demo/seo-ai-agent/
- /demo/marketing-ai-agent/
- /demo/opportunity-discovery-agent/
- /demo/marketing-automation/
- /demo/supply-chain-optimization/
- /demo/ocr-demo/
- /demo/smart-medical-archive/
- /demo/smart-hospital-management/
- /demo/ai-scolecs/
- /demo/brightproject/
- /demo/brightsales/
- /demo/ai-tenders-analysis/

إذا كان بعض هذه المجلدات غير موجود:
- لا تفشل المهمة بالكامل
- اذكرها في التقرير
- إذا كانت مذكورة في services/index.html كـ demoUrl، اعتبرها مشكلة High

## المرحلة 6: Schemas المطلوبة

تأكد أن هذه schemas موجودة أو أن هناك بدائل مكافئة:

1. smartHiringSchema
2. dataAnalyzerSchema
3. dataQualitySchema
4. textAnalysisSchema
5. customerSupportSchema
6. customAiAgentSchema
7. competitorAnalysisAgentSchema
8. seoAgentSchema
9. marketingAgentSchema
10. opportunityDiscoveryAgentSchema
11. marketingAutomationSchema
12. supplyChainSchema
13. documentAutomationSchema
14. medicalArchiveSchema
15. hospitalOpsSchema
16. educationSchema
17. projectManagementSchema
18. salesAgentSchema
19. tenderAnalysisSchema
20. aiConsultingSchema
21. approvalsAutomationSchema
22. hrAutomationSchema
23. operationalReportsSchema
24. socialDataAnalysisSchema

إذا كانت بعض الديموهات لا تحتاج schema معقد:
استخدم genericDemoSchema مؤقتاً، لكن سجّل ذلك كـ Warning.

كل schema يجب أن ينتج:
- executive_summary_ar
- score أو readiness_score إن مناسب
- key_insights
- risks
- recommended_actions
- business_impact_ar
- integration_readiness
- next_action_ar
- whatsapp_summary_ar

## المرحلة 7: اختبارات تشغيل Backend

أنشئ أو حسّن سكربت اختبار مثل:

scripts/test-gemini-unified-api.mjs

يختبر endpoint:

POST /api/ai/chat/completions

لكل demoType أساسي، باستخدام payload صغير و sample data.

يجب أن يختبر:
- status code
- JSON صالح
- ok true أو error مفهوم
- data object موجود
- لا raw HTML
- لا raw stack trace
- لا API key
- schema fields الأساسية موجودة

اختبر على الأقل:
- smart_hiring_system
- data_analyzer
- customer_support
- custom_ai_agent
- competitor_analysis_agent
- seo_agent
- marketing_agent
- opportunity_discovery_agent
- marketing_automation
- supply_chain
- document_automation
- medical_archive
- hospital_ops
- education

أضف script في package.json إن مناسب:
"test:ai-gateway": "node scripts/test-gemini-unified-api.mjs"

لكن لا تكسر package.json.

## المرحلة 8: اختبارات Frontend Static Audit

أنشئ أو حسّن سكربت مثل:

scripts/audit-demo-ai-bindings.mjs

يفحص كل demo/*/index.html ويتأكد من:
- لا يوجد generativelanguage.googleapis.com
- لا يوجد GEMINI_API_KEY
- لا يوجد GOOGLE_API_KEY
- لا يوجد apiKey في HTML
- يوجد /api/ai/chat/completions أو محرك موحد يستدعيه
- يوجد schemaName أو data-schema
- يوجد demoType أو agentType
- يوجد fallback
- يوجد Error State
- يوجد Sample Data

أضف script:
"audit:demo-ai": "node scripts/audit-demo-ai-bindings.mjs"

## المرحلة 9: إصلاح مشاكل متوقعة

أصلح هذه الأنماط إن وجدتها:

1. صفحة Demo تستدعي Gemini مباشرة:
حوّلها إلى /api/ai/chat/completions.

2. صفحة Demo تحتوي حقل API Key:
أزله من الإنتاج.

3. ديمو يستخدم endpoint قديم:
إما حدّثه للموحد أو اجعل endpoint القديم يستدعي gateway الموحد.

4. ديمو يعرض JSON خام:
أضف renderer أو fallback dashboard.

5. ديمو بدون fallback:
أضف fallbackResult مناسب.

6. ديمو بدون schemaName:
أضف schemaName مطابق.

7. Backend يرجع raw error:
نظف error response.

8. script يستخدم مسار ثابت:
استبدل:
"/Users/yzydalshmry/Desktop/BRIGHTAI"
بـ:
process.cwd()

## المرحلة 10: أوامر الاختبار النهائية

بعد الإصلاح شغّل المتاح فقط من package.json:

- npm run audit:demo-ai
- npm run test:ai-gateway
- npm run smoke-test:config
- npm run internal-links:audit
- npm run seo:html:check
- npm run build

إذا أي سكربت غير موجود:
لا تخترعه في التقرير.
إما أضفه إذا كان ضمن المهمة، أو اذكر أنه غير موجود.

## المرحلة 11: التقرير النهائي

أعطني تقريراً بالعربية بهذه البنية:

### 1. ملخص تنفيذي
- هل تم توحيد Gemini API؟
- ما هو الملف الموحد؟
- هل كل الديموهات تستخدمه؟
- هل توجد مفاتيح مكشوفة؟
- هل المشروع جاهز للنشر من ناحية AI؟

### 2. ملف Gateway الموحد
- المسار
- الدوال الرئيسية
- endpoints التي تستخدمه
- schemas المدعومة
- safety profiles

### 3. جدول الديموهات
لكل ديمو:
- المسار
- demoType
- schemaName
- endpoint
- fallback موجود؟
- error state موجود؟
- يستخدم gateway الموحد؟
- الحالة: Pass / Warning / Fail
- الملاحظة

### 4. مشاكل تم إصلاحها
- الملف
- المشكلة
- الإصلاح
- السبب

### 5. مشاكل متبقية
صنفها:
- Critical
- High
- Medium
- Low

### 6. اختبارات
- الأمر
- النتيجة
- ملاحظات

### 7. توصية النشر
- Ready
- Ready with warnings
- Not ready

### 8. خطوات لاحقة
- تحسينات اختيارية
- تحسينات ضرورية
- ديون تقنية
```

---

# برومبت مختصر للتدقيق فقط بدون تعديل

استخدم هذا إذا تبغى أولاً تقرير بدون ما يلمس الملفات:

```txt
أنت AI Integration QA Auditor.

افحص مشروع Bright AI في:

/Users/yzydalshmry/Desktop/BRIGHTAI

بدون تعديل أي ملف.

المطلوب:
تدقيق توحيد Gemini API لكل صفحات الديمو داخل /demo/ والتحقق أنها تستخدم Backend الموحد داخل:

/Users/yzydalshmry/Desktop/BRIGHTAI/backend

افحص:
- backend/server.js
- backend/services/
- assets/js/
- frontend/js/
- demo/*/index.html
- services/index.html

ابحث عن:
- GEMINI_API_KEY
- GOOGLE_API_KEY
- generativelanguage.googleapis.com
- GoogleGenerativeAI
- @google/generative-ai
- /api/ai/chat/completions
- /api/ai/
- schemaName
- demoType
- agentType
- fallbackResult
- fetch(

أعطني تقريراً فقط يحتوي:

1. ما هو ملف Gemini Gateway الحالي؟
2. ما هي endpoints الخاصة بالذكاء الاصطناعي؟
3. هل يوجد أي API Key في الواجهة؟
4. هل يوجد fetch مباشر إلى Gemini؟
5. كل ديمو داخل /demo/:
   - المسار
   - endpoint المستخدم
   - schemaName
   - demoType أو agentType
   - fallback موجود؟
   - error state موجود؟
   - الحالة Pass/Warning/Fail
6. الديموهات غير المرتبطة بالموحد
7. الديموهات التي تحتاج schema
8. الملفات التي يجب تعديلها
9. خطة إصلاح مرتبة حسب الأولوية

لا تعدّل أي ملف.
```

---

# برومبت إصلاح مباشر بعد التقرير

```txt
بناءً على تقرير تدقيق Gemini API السابق، أصلح مشاكل الربط فقط.

القواعد:
- لا تعيد تصميم الصفحات.
- لا تغيّر محتوى SEO إلا إذا كان ضرورياً.
- لا تنقل ملفات.
- لا تحذف endpoints قديمة إذا كانت مستخدمة.
- لا تكشف API key.
- لا تضف fetch مباشر إلى Gemini.
- كل AI request يجب أن يمر عبر backend/services/aiGateway.js أو Gemini Gateway الموحد.
- كل demo يجب أن يستخدم /api/ai/chat/completions أو endpoint موحد يستدعي gateway نفسه.
- أضف fallbackResult و error state للصفحات الناقصة.
- أضف schemaName و demoType للصفحات الناقصة.
- نظف أي raw JSON display.

بعد الإصلاح:
- شغّل audit:demo-ai إن كان موجوداً.
- شغّل internal-links:audit.
- شغّل smoke-test:config.
- شغّل build.

أعطني:
- الملفات المعدلة
- المشاكل التي تم حلها
- الديموهات التي أصبحت Pass
- المشاكل المتبقية
```

---

# برومبت اختبار API Gateway فقط

```txt
اختبر Gemini API Gateway الموحد فقط في مشروع Bright AI.

المسار:
/Users/yzydalshmry/Desktop/BRIGHTAI/backend

المطلوب:
1. شغّل Backend محلياً حسب package.json.
2. اختبر endpoint:
POST /api/ai/chat/completions

3. أرسل payload تجريبي لكل demoType:
- smart_hiring_system
- data_analyzer
- customer_support
- custom_ai_agent
- competitor_analysis_agent
- seo_agent
- marketing_agent
- opportunity_discovery_agent
- marketing_automation
- supply_chain
- document_automation
- medical_archive
- hospital_ops
- education

4. لكل payload استخدم:
{
  "model": "gemini-2.5-flash",
  "demoType": "...",
  "agentType": "...",
  "schemaName": "...",
  "locale": "ar-SA",
  "sourcePage": "/demo/.../",
  "messages": [
    {
      "role": "system",
      "content": "أنت مساعد تحليلي يعيد JSON منظم فقط."
    },
    {
      "role": "user",
      "content": "استخدم بيانات تجريبية مختصرة واعد تقريراً عربياً منظماً."
    }
  ],
  "response_format": {
    "type": "json_schema",
    "json_schema": {
      "name": "...",
      "schema": {}
    }
  },
  "temperature": 0.2
}

5. تحقق أن response:
- status 200 أو error مفهوم
- JSON صالح
- لا يحتوي API key
- لا يحتوي stack trace
- لا يحتوي raw provider error
- يحتوي data أو error منظم
- يحترم schema قدر الإمكان

6. أنشئ تقرير:
- demoType
- schemaName
- status
- JSON valid
- gateway used
- notes
```

---

## ترتيب الاستخدام الأفضل

ابدأ بهذا:

```txt
نفّذ برومبت التدقيق فقط بدون تعديل.
```

بعد التقرير:

```txt
نفّذ برومبت إصلاح مباشر بعد التقرير.
```

ثم:

```txt
نفّذ برومبت اختبار API Gateway فقط.
```

وبعدها شغّل QA النهائي للديموهات.
