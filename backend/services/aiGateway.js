/**
 * BrightAI Unified AI Gateway
 * طبقة موحدة لكل استدعاءات الذكاء الاصطناعي في المشروع
 * - Gemini كمزود أساسي
 * - اختيار المزود بشكل صحيح بناءً على البيئة
 * - توحيد payload و response و error handling
 */

const { config, isApiKeyConfigured, isGroqConfigured, isNvidiaConfigured, isDeepSeekConfigured } = require('../config');
const { sanitizeUserInput, filterAIResponse } = require('../utils/sanitizer');
const { retryWithBackoff } = require('../utils/errorHandler');
const { createSessionId, getOrCreateSession, addToSession } = require('../utils/sessionStore');
const { pickProvider, callOpenAiCompatibleProvider } = require('./openaiCompatProvider');
const crypto = require('crypto');

const REQUEST_TIMEOUT_MS = Math.max(3000, parseInt(process.env.AI_GATEWAY_TIMEOUT_MS, 10) || 30000);
const MAX_SUGGESTIONS = 3;
const DEFAULT_SUGGESTIONS = [
  'ما هي خدماتكم؟',
  'أريد استشارة تقنية',
  'كيف أبدأ معكم؟'
];
const AI_GATEWAY_MOCK_MODE = process.env.AI_GATEWAY_MOCK_MODE === '1';

const BASE_DEMO_SCHEMA = {
  type: 'object',
  required: [
    'executive_summary_ar',
    'readiness_score',
    'key_insights',
    'risks',
    'recommended_actions',
    'business_impact_ar',
    'integration_readiness',
    'next_action_ar',
    'whatsapp_summary_ar'
  ],
  properties: {
    executive_summary_ar: { type: 'string' },
    score: { type: 'number' },
    readiness_score: { type: 'number' },
    key_insights: { type: 'array', items: { type: 'string' } },
    risks: { type: 'array', items: { type: 'string' } },
    recommended_actions: { type: 'array', items: { type: 'string' } },
    business_impact_ar: { type: 'string' },
    integration_readiness: { type: 'array', items: { type: 'string' } },
    next_action_ar: { type: 'string' },
    whatsapp_summary_ar: { type: 'string' }
  }
};

function extendDemoSchema(extraProperties = {}) {
  return {
    ...BASE_DEMO_SCHEMA,
    properties: {
      ...BASE_DEMO_SCHEMA.properties,
      ...extraProperties
    }
  };
}

const demoSchemas = {
  recruitmentSchema: extendDemoSchema({
    candidate_fit: { type: 'number' },
    interview_questions: { type: 'array', items: { type: 'string' } }
  }),
  smartHiringSchema: extendDemoSchema({
    candidate_fit: { type: 'number' },
    shortlist_notes: { type: 'array', items: { type: 'string' } }
  }),
  medicalArchiveSchema: extendDemoSchema({
    extracted_record: { type: 'object' },
    quality_flags: { type: 'array', items: { type: 'string' } }
  }),
  dataAnalyzerSchema: extendDemoSchema({
    anomalies: { type: 'array', items: { type: 'string' } },
    dashboard_recommendations: { type: 'array', items: { type: 'string' } }
  }),
  dataQualitySchema: extendDemoSchema({
    data_quality_score: { type: 'number' },
    validation_findings: { type: 'array', items: { type: 'string' } }
  }),
  textAnalysisSchema: extendDemoSchema({
    sentiment: { type: 'string' },
    topics: { type: 'array', items: { type: 'string' } }
  }),
  dataPlatformSchema: extendDemoSchema({
    platform_modules: { type: 'array', items: { type: 'string' } }
  }),
  educationSchema: extendDemoSchema({
    learning_plan: { type: 'array', items: { type: 'string' } },
    assessment_items: { type: 'array', items: { type: 'string' } }
  }),
  hospitalOpsSchema: extendDemoSchema({
    operational_kpis: { type: 'array', items: { type: 'object' } }
  }),
  documentAutomationSchema: extendDemoSchema({
    extracted_fields: { type: 'array', items: { type: 'object' } },
    validation_checks: { type: 'array', items: { type: 'string' } }
  }),
  customerSupportSchema: extendDemoSchema({
    intent: { type: 'string' },
    ticket_priority: { type: 'string' },
    reply_templates: { type: 'array', items: { type: 'string' } }
  }),
  marketingAutomationSchema: extendDemoSchema({
    campaign_plan: { type: 'array', items: { type: 'string' } },
    channel_mix: { type: 'array', items: { type: 'object' } }
  }),
  supplyChainSchema: extendDemoSchema({
    supply_actions: { type: 'array', items: { type: 'string' } },
    stock_risks: { type: 'array', items: { type: 'string' } }
  }),
  customAiAgentSchema: extendDemoSchema({
    agent_blueprint: { type: 'object' },
    handoff_rules: { type: 'array', items: { type: 'string' } }
  }),
  competitorAnalysisAgentSchema: extendDemoSchema({
    competitor_gaps: { type: 'array', items: { type: 'string' } },
    positioning_moves: { type: 'array', items: { type: 'string' } }
  }),
  seoAgentSchema: extendDemoSchema({
    technical_seo_actions: { type: 'array', items: { type: 'string' } },
    content_opportunities: { type: 'array', items: { type: 'string' } }
  }),
  marketingAgentSchema: extendDemoSchema({
    audience_segments: { type: 'array', items: { type: 'string' } },
    message_angles: { type: 'array', items: { type: 'string' } }
  }),
  opportunityDiscoveryAgentSchema: extendDemoSchema({
    lead_segments: { type: 'array', items: { type: 'string' } },
    scoring_rules: { type: 'array', items: { type: 'string' } }
  }),
  aiConsultingSchema: extendDemoSchema({
    roadmap: { type: 'array', items: { type: 'string' } }
  }),
  approvalsAutomationSchema: extendDemoSchema({
    approval_flow: { type: 'array', items: { type: 'string' } }
  }),
  hrAutomationSchema: extendDemoSchema({
    hr_workflows: { type: 'array', items: { type: 'string' } }
  }),
  operationalReportsSchema: extendDemoSchema({
    report_blueprint: { type: 'array', items: { type: 'string' } }
  }),
  socialDataAnalysisSchema: extendDemoSchema({
    social_signals: { type: 'array', items: { type: 'string' } }
  }),
  projectManagementSchema: extendDemoSchema({
    project_risks: { type: 'array', items: { type: 'string' } }
  }),
  salesAgentSchema: extendDemoSchema({
    pipeline_actions: { type: 'array', items: { type: 'string' } }
  }),
  tenderAnalysisSchema: extendDemoSchema({
    tender_fit: { type: 'number' },
    bid_requirements: { type: 'array', items: { type: 'string' } }
  }),
  pricingEstimatorSchema: extendDemoSchema({
    cost_factors: { type: 'array', items: { type: 'string' } },
    scope_assumptions: { type: 'array', items: { type: 'string' } },
    estimate_range_ar: { type: 'string' }
  }),
  reportFaqSchema: extendDemoSchema({
    faqs: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          question: { type: 'string' },
          answer: { type: 'string' }
        }
      }
    }
  }),
  genericDemoSchema: BASE_DEMO_SCHEMA
};

const schemaAliases = {
  recruitment: 'recruitmentSchema',
  smart_hiring_system: 'smartHiringSchema',
  smart_hiring: 'smartHiringSchema',
  smart_hiring_demo_schema: 'smartHiringSchema',
  medical_archive: 'medicalArchiveSchema',
  medical_archive_demo_schema: 'medicalArchiveSchema',
  data_analyzer: 'dataAnalyzerSchema',
  data_analyzer_demo_schema: 'dataAnalyzerSchema',
  data_quality: 'dataQualitySchema',
  data_quality_demo_schema: 'dataQualitySchema',
  text_analysis: 'textAnalysisSchema',
  text_analysis_demo_schema: 'textAnalysisSchema',
  data_platform: 'dataPlatformSchema',
  education: 'educationSchema',
  education_demo_schema: 'educationSchema',
  hospital_ops: 'hospitalOpsSchema',
  hospital_management_demo_schema: 'hospitalOpsSchema',
  document_automation: 'documentAutomationSchema',
  ocr_document_demo_schema: 'documentAutomationSchema',
  customer_support: 'customerSupportSchema',
  customer_service_demo_schema: 'customerSupportSchema',
  marketing_automation: 'marketingAutomationSchema',
  marketing_automation_demo_schema: 'marketingAutomationSchema',
  supply_chain: 'supplyChainSchema',
  supply_chain_demo_schema: 'supplyChainSchema',
  custom_ai_agent: 'customAiAgentSchema',
  custom_agent_demo_schema: 'customAiAgentSchema',
  competitor_analysis_agent: 'competitorAnalysisAgentSchema',
  competitor_analysis_demo_schema: 'competitorAnalysisAgentSchema',
  seo_agent: 'seoAgentSchema',
  seo_agent_demo_schema: 'seoAgentSchema',
  marketing_agent: 'marketingAgentSchema',
  marketing_agent_demo_schema: 'marketingAgentSchema',
  opportunity_discovery_agent: 'opportunityDiscoveryAgentSchema',
  opportunity_agent_demo_schema: 'opportunityDiscoveryAgentSchema',
  ai_consulting: 'aiConsultingSchema',
  ai_consulting_demo_schema: 'aiConsultingSchema',
  approvals_automation: 'approvalsAutomationSchema',
  approvals_demo_schema: 'approvalsAutomationSchema',
  hr_automation: 'hrAutomationSchema',
  hr_automation_demo_schema: 'hrAutomationSchema',
  operational_reports: 'operationalReportsSchema',
  operational_reports_demo_schema: 'operationalReportsSchema',
  social_data_analysis: 'socialDataAnalysisSchema',
  social_data_demo_schema: 'socialDataAnalysisSchema',
  brightproject_demo_schema: 'projectManagementSchema',
  brightsales_demo_schema: 'salesAgentSchema',
  tenders_demo_schema: 'tenderAnalysisSchema',
  pricing: 'pricingEstimatorSchema',
  pricing_demo_schema: 'pricingEstimatorSchema',
  report_ai_saudi_2026: 'reportFaqSchema',
  report_ai_saudi_faq_schema: 'reportFaqSchema',
  demo_index: 'genericDemoSchema',
  demo_index_schema: 'genericDemoSchema'
};

const MOCK_SCHEMA_EXTRAS = {
  smartHiringSchema: {
    candidate_fit: 84,
    shortlist_notes: ['الخبرة مناسبة للمتطلبات الأساسية.', 'تحتاج المقابلة إلى أسئلة تحقق عملية.']
  },
  dataAnalyzerSchema: {
    anomalies: ['ارتفاع غير معتاد في الطلبات المسائية.', 'انخفاض التحويل في قناة واحدة.'],
    dashboard_recommendations: ['إضافة مؤشر يومي للتحويل.', 'تقسيم النتائج حسب المدينة والقناة.']
  },
  customerSupportSchema: {
    intent: 'طلب دعم ومتابعة',
    ticket_priority: 'متوسطة',
    reply_templates: ['تم استلام طلبك وسنراجع التفاصيل.', 'نحتاج رقم الطلب لتسريع المعالجة.']
  },
  customAiAgentSchema: {
    agent_blueprint: { role: 'مساعد تشغيلي', channels: ['الموقع', 'واتساب'], guardrails: ['تصعيد الحالات الحساسة'] },
    handoff_rules: ['تصعيد الشكاوى عالية الحساسية.', 'طلب موافقة بشرية قبل تغيير بيانات العميل.']
  },
  competitorAnalysisAgentSchema: {
    competitor_gaps: ['ضعف وضوح العرض المحلي.', 'فرصة لتحسين صفحة الخدمة الأساسية.'],
    positioning_moves: ['إبراز سرعة التنفيذ.', 'تقديم مقارنة قيمة بدل تخفيض السعر.']
  },
  seoAgentSchema: {
    technical_seo_actions: ['مراجعة العناوين والـ canonical.', 'تحسين الروابط الداخلية للصفحات التجارية.'],
    content_opportunities: ['صفحة خدمة محلية للرياض.', 'دليل أسئلة شائعة للسوق السعودي.']
  },
  marketingAgentSchema: {
    audience_segments: ['مديرو العمليات في الشركات المتوسطة.', 'فرق التسويق التي تحتاج أتمتة المتابعة.'],
    message_angles: ['تقليل الوقت اليدوي.', 'تحويل بيانات العملاء إلى قرارات قابلة للقياس.']
  },
  opportunityDiscoveryAgentSchema: {
    lead_segments: ['شركات خدمات مهنية متوسطة.', 'منشآت صحية تحتاج أتمتة خدمة العملاء.'],
    scoring_rules: ['+20 عند وجود نظام CRM.', '+15 عند وجود طلبات متكررة قابلة للأتمتة.']
  },
  marketingAutomationSchema: {
    campaign_plan: ['رسالة ترحيب بعد التسجيل.', 'متابعة بعد 24 ساعة حسب الاهتمام.'],
    channel_mix: [{ channel: 'واتساب', role: 'متابعة مؤهلة' }, { channel: 'البريد', role: 'محتوى تثقيفي' }]
  },
  supplyChainSchema: {
    supply_actions: ['تحديد نقاط إعادة الطلب.', 'مراجعة الموردين ذوي التأخير المتكرر.'],
    stock_risks: ['نفاد مخزون في الأصناف سريعة الحركة.', 'اعتماد زائد على مورد واحد.']
  },
  documentAutomationSchema: {
    extracted_fields: [{ name: 'رقم الوثيقة', confidence: 'مرتفع' }, { name: 'تاريخ الإصدار', confidence: 'متوسط' }],
    validation_checks: ['التحقق من اكتمال الحقول الإلزامية.', 'مطابقة التاريخ مع سياسة الأرشفة.']
  },
  medicalArchiveSchema: {
    extracted_record: { patient_id: 'DEMO-001', document_type: 'ملخص زيارة', privacy_level: 'عال' },
    quality_flags: ['بيانات تجريبية فقط.', 'تحتاج مراجعة مختص قبل الاعتماد.']
  },
  hospitalOpsSchema: {
    operational_kpis: [
      { label: 'وقت الانتظار', value: 'متوسط', status: 'يحتاج متابعة' },
      { label: 'استغلال الأسرة', value: 'جيد', status: 'مستقر' }
    ]
  },
  educationSchema: {
    learning_plan: ['تقسيم الدرس إلى أهداف قصيرة.', 'إضافة نشاط تقييم سريع بعد كل محور.'],
    assessment_items: ['سؤال فهم مباشر.', 'تمرين تطبيقي مرتبط بالمهارة.']
  }
};

const safetyProfiles = {
  healthcare: 'لا تقدم تشخيصاً طبياً نهائياً، ولا توصية علاجية فردية، واطلب مراجعة مختص مرخص عند وجود مخاطر صحية.',
  recruitment: 'تجنب أي استنتاجات أو قرارات مبنية على العمر أو الجنس أو الجنسية أو الحالة الاجتماعية أو أي سمة محمية.',
  education: 'احم بيانات الطلاب، واجعل المخرجات مساعدة للمعلم ولا تستبدل تقييمه المهني.',
  marketing: 'لا تقدم وعود أداء مضمونة، واحترم موافقات الرسائل وسياسات المنصات والخصوصية.',
  competitor_intelligence: 'استخدم المعلومات العامة أو المدخلة فقط، ولا تقترح scraping مخالفاً أو جمع بيانات غير مصرح بها.',
  sales_leads: 'لا تولد بيانات شخصية وهمية، ولا تقترح تواصل مزعجاً، واجعل التأهيل مبنياً على إشارات مشروعة.',
  general_business: 'اجعل المخرجات تقديرية ومناسبة لاتخاذ قرار أولي مع مراجعة بشرية قبل التنفيذ.'
};

const CHAT_SYSTEM_PROMPT = `
أنت "BrightAI Assistant" — المساعد الذكي الرسمي لموقع Bright AI في السعودية.

## الهوية والدور:
- اسمك: BrightAI Assistant
- شركتك: Bright AI — شركة سعودية متخصصة في حلول الذكاء الاصطناعي
- التواصل البشري: yazeed1job@gmail.com | واتساب: +966538229013
- نبرة الرد: عربية واضحة مع لمسة سعودية مهنية خفيفة عند الحاجة
- دورك: مساعدة تقنية وتجارية، وتوجيه المستخدم بسرعة للخطوة التالية

## خدمات Bright AI التي تشرحها بثقة:
- وكلاء الذكاء الاصطناعي (AI Agents): /ai-agent
- الأتمتة الذكية (RPA): /smart-automation
- تحليل البيانات: /data-analysis
- الاستشارات: /consultation
- حلول مخصصة للقطاعات السعودية: حكومي، صحي، تجزئة، لوجستيات، صناعة

## سيناريوهات إلزامية:
1) حجز موعد / استشارة:
- اجمع: الاسم، جهة العمل، المجال، الوقت المناسب للتواصل
- اقترح صفحة الاستشارات أو التواصل المباشر

2) طلب عرض سعر:
- اجمع: نوع الخدمة، حجم الاستخدام، عدد المستخدمين، التكاملات المطلوبة
- إذا البيانات ناقصة، اطلبها بنقاط قصيرة ومباشرة

3) الدعم التقني:
- اجمع: وصف المشكلة، الصفحة/المسار، وقت حدوث الخطأ، المتصفح/الجهاز
- قدم أول خطوة حل عملية قبل أي تصعيد

## قواعد التصعيد لفريق بشري:
- صعّد فوراً إذا المستخدم طلب موظف بشري أو مكالمة مباشرة
- صعّد فوراً عند شكاوى متكررة أو عطل تشغيلي مؤثر
- عند التصعيد: وضّح قناة التصعيد (واتساب + البريد) بنهاية الرد

## أسلوب الرد:
- إجابة مختصرة وواضحة (2 إلى 5 جمل)
- لا تذكر أي مفاتيح API أو تفاصيل داخلية
- اختم بسؤال متابعة واحد مختصر يساعد على التقدم
- إذا السؤال خارج النطاق، قل ذلك بوضوح ووجّه لمسار تواصل مناسب

## تنسيق إضافي مطلوب:
- بعد الإجابة أضف هذا الفاصل حرفياً: ---SUGGESTIONS---
- بعد الفاصل أضف 3 أسئلة متابعة قصيرة (كل سؤال في سطر مستقل، بدون ترقيم)
`;

const STREAM_SYSTEM_PROMPT = (() => {
  const marker = '## تنسيق إضافي مطلوب:';
  const markerIndex = CHAT_SYSTEM_PROMPT.indexOf(marker);
  if (markerIndex < 0) return CHAT_SYSTEM_PROMPT;
  return `${CHAT_SYSTEM_PROMPT.slice(0, markerIndex)}${marker}
- قدم الإجابة مباشرة بدون فواصل خاصة أو قوائم اقتراحات.
- لا تضف عبارة ---SUGGESTIONS--- مطلقاً.`;
})();

function resolveApiKey() {
  const envValue = typeof process.env.GEMINI_API_KEY === 'string'
    ? process.env.GEMINI_API_KEY.trim()
    : '';
  if (envValue && envValue !== 'YOUR_SECRET_HERE') return envValue;

  const googleEnvValue = typeof process.env.GOOGLE_API_KEY === 'string'
    ? process.env.GOOGLE_API_KEY.trim()
    : '';
  if (googleEnvValue && googleEnvValue !== 'YOUR_SECRET_HERE') return googleEnvValue;

  const configValue = typeof config.gemini.apiKey === 'string'
    ? config.gemini.apiKey.trim()
    : '';
  if (configValue && configValue !== 'YOUR_SECRET_HERE') return configValue;

  return '';
}

function createRequestId() {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return `req_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeSchemaKey(value) {
  return String(value || '')
    .trim()
    .replace(/-/g, '_')
    .replace(/\s+/g, '_');
}

function resolveDemoSchema(schemaName, fallbackSchema) {
  if (fallbackSchema && typeof fallbackSchema === 'object' && Object.keys(fallbackSchema).length > 0) return fallbackSchema;
  const directName = String(schemaName || '').trim();
  if (demoSchemas[directName]) return demoSchemas[directName];
  const normalized = normalizeSchemaKey(directName);
  const aliased = schemaAliases[normalized] || schemaAliases[normalized.replace(/_demo_report$/, '')];
  return demoSchemas[aliased] || null;
}

function resolveSafetyProfileName({ safetyProfile, demoType, agentType, schemaName }) {
  const candidates = [safetyProfile, demoType, agentType, schemaName]
    .map(value => normalizeSchemaKey(value).toLowerCase())
    .filter(Boolean);

  if (candidates.some(value => /medical|health|hospital|archive/.test(value))) return 'healthcare';
  if (candidates.some(value => /hiring|recruit|hr/.test(value))) return 'recruitment';
  if (candidates.some(value => /education|school|scolecs/.test(value))) return 'education';
  if (candidates.some(value => /marketing|seo|social/.test(value))) return 'marketing';
  if (candidates.some(value => /competitor/.test(value))) return 'competitor_intelligence';
  if (candidates.some(value => /sales|opportunity|lead/.test(value))) return 'sales_leads';
  return 'general_business';
}

function createSafeAiError(code = 'AI_PROVIDER_UNAVAILABLE', statusCode = 503) {
  return {
    ok: false,
    statusCode,
    error: {
      code,
      message_ar: 'تعذر تشغيل التحليل الآن. يمكنك استخدام المثال الجاهز أو إعادة المحاولة.'
    }
  };
}

function normalizeSafeProviderErrorCode(code, statusCode) {
  const raw = String(code || '').toUpperCase();
  if (statusCode === 429 || raw.includes('429') || raw.includes('RATE_LIMIT') || raw.includes('RESOURCE_EXHAUSTED')) {
    return 'AI_PROVIDER_RATE_LIMITED';
  }
  if (statusCode === 408 || raw.includes('TIMEOUT')) return 'AI_PROVIDER_TIMEOUT';
  return 'AI_PROVIDER_UNAVAILABLE';
}

function isAiGatewayMockModeEnabled() {
  return AI_GATEWAY_MOCK_MODE && config.server.nodeEnv !== 'production';
}

function createMockDemoData(schemaName, demoType) {
  const activeSchemaName = resolveDemoSchema(schemaName) ? String(schemaName || 'genericDemoSchema') : 'genericDemoSchema';
  const title = String(demoType || activeSchemaName || 'الديمو').replace(/[_-]+/g, ' ');
  const base = {
    executive_summary_ar: `نتيجة محاكاة آمنة لاختبار بوابة Bright AI لنوع ${title}.`,
    readiness_score: 82,
    score: 82,
    key_insights: [
      'الطلب وصل إلى بوابة الذكاء الاصطناعي الموحدة بنجاح.',
      'تم توليد بيانات منظمة دون استدعاء مزود خارجي.',
      'المخرجات مناسبة لاختبار الربط والعرض وليست نتيجة تشغيل حي.'
    ],
    risks: [
      'هذه بيانات محاكاة ولا تمثل تحليلاً فعلياً.',
      'يلزم اختبار حي بمفتاح Gemini قبل الاعتماد الإنتاجي.'
    ],
    recommended_actions: [
      'تحقق من ظهور الحقول الأساسية في الواجهة.',
      'شغّل الاختبار الحي عند توفر GEMINI_API_KEY.',
      'راجع الرسائل النهائية للمستخدم عند فشل المزود.'
    ],
    business_impact_ar: 'يوفر وضع المحاكاة اختباراً مستقراً لمسار البوابة وتجربة المستخدم دون تكلفة أو اعتماد على مزود خارجي.',
    integration_readiness: ['Unified endpoint', 'JSON schema contract', 'Arabic fallback UX'],
    next_action_ar: 'أعد تشغيل الاختبار الحي بعد إعداد مفتاح Gemini.',
    whatsapp_summary_ar: `تم اختبار ${title} بوضع المحاكاة بنجاح.`
  };

  const canonicalName = demoSchemas[schemaName]
    ? schemaName
    : (schemaAliases[normalizeSchemaKey(schemaName).toLowerCase()] || schemaAliases[normalizeSchemaKey(demoType).toLowerCase()] || activeSchemaName);
  return {
    ...base,
    ...(MOCK_SCHEMA_EXTRAS[canonicalName] || {})
  };
}

function safeGatewayLog(event, fields) {
  const safeFields = {
    requestId: fields?.requestId,
    demoType: fields?.demoType,
    agentType: fields?.agentType,
    schemaName: fields?.schemaName,
    sourcePage: fields?.sourcePage,
    latency: fields?.latency,
    success: fields?.success
  };
  console.info(`[AIGateway] ${event}`, safeFields);
}

function normalizeResponseFormat(responseFormat, schemaName, schema) {
  const directSchema = schema || responseFormat?.json_schema?.schema || responseFormat?.jsonSchema?.schema || responseFormat?.schema || null;
  const resolvedName = responseFormat?.json_schema?.name || responseFormat?.jsonSchema?.name || schemaName || 'genericDemoSchema';
  return {
    wantsJson: responseFormat?.type === 'json_schema' || responseFormat?.type === 'json_object' || !!directSchema || !!schemaName,
    schemaName: resolvedName,
    schema: resolveDemoSchema(resolvedName, directSchema) || demoSchemas.genericDemoSchema
  };
}

function parseJsonFromGeminiText(text) {
  const raw = String(text || '').trim();
  if (!raw) return null;
  const cleaned = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch (_error) {
    const match = cleaned.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch (_nestedError) {
      return null;
    }
  }
}

function normalizeStructuredData(parsed, rawText, schemaName) {
  if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed;
  return {
    executive_summary_ar: rawText || 'تعذر تحليل الاستجابة المنظمة بالكامل.',
    readiness_score: 70,
    score: 70,
    key_insights: ['الاستجابة احتاجت تطبيعاً بعد رجوعها من مزود الذكاء الاصطناعي.'],
    risks: ['راجع النتيجة قبل استخدامها في قرار تشغيلي.'],
    recommended_actions: ['أعد المحاولة أو استخدم المثال الجاهز إذا استمر الخطأ.'],
    business_impact_ar: 'الأثر تقديري ويحتاج مراجعة بشرية.',
    integration_readiness: ['Backend موحد', 'مراجعة بشرية مطلوبة'],
    next_action_ar: 'راجع التقرير ثم أعد المحاولة عند الحاجة.',
    whatsapp_summary_ar: `تقرير ${schemaName || 'الديمو'} يحتاج مراجعة.`
  };
}

function resolveModel() {
  return String(config.gemini.model || process.env.GEMINI_MODEL || 'gemini-2.5-flash').trim() || 'gemini-2.5-flash';
}

function buildGeminiGenerateUrl(modelOverride) {
  const model = String(modelOverride || resolveModel()).trim() || resolveModel();
  const base = `${config.gemini.endpoint}/${model}:generateContent`;
  const apiKey = resolveApiKey();
  if (apiKey) {
    return `${base}?key=${encodeURIComponent(apiKey)}`;
  }
  return base;
}

function buildGeminiStreamUrl(modelOverride) {
  const model = String(modelOverride || resolveModel()).trim() || resolveModel();
  const base = `${config.gemini.endpoint}/${model}:streamGenerateContent`;
  const params = new URLSearchParams();
  params.set('alt', 'sse');
  const apiKey = resolveApiKey();
  if (apiKey) {
    params.set('key', apiKey);
  }
  return `${base}?${params.toString()}`;
}

function mapSessionRole(role) {
  if (role === 'assistant' || role === 'model') return 'model';
  return 'user';
}

function buildGeminiContents(history, message, systemPrompt) {
  const prompt = systemPrompt || CHAT_SYSTEM_PROMPT;
  const contents = [
    { role: 'user', parts: [{ text: prompt }] },
    { role: 'model', parts: [{ text: 'تم استلام التعليمات وسألتزم بها بالكامل.' }] }
  ];

  for (const item of history) {
    if (!item || typeof item.content !== 'string') continue;
    const text = item.content.trim();
    if (!text) continue;
    contents.push({ role: mapSessionRole(item.role), parts: [{ text }] });
  }

  contents.push({ role: 'user', parts: [{ text: message }] });
  return contents;
}

function parseGeminiText(payload) {
  const parts = payload?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) return '';
  return parts
    .map(part => String(part?.text || '').trim())
    .filter(Boolean)
    .join('\n')
    .trim();
}

function normalizeGeminiPart(part) {
  if (!part || typeof part !== 'object') return null;
  if (typeof part.text === 'string') return { text: part.text };
  if (part.type === 'text' && typeof part.text === 'string') return { text: part.text };
  if (part.inline_data && part.inline_data.mime_type && part.inline_data.data) {
    return { inline_data: { mime_type: part.inline_data.mime_type, data: part.inline_data.data } };
  }
  if (part.inlineData && (part.inlineData.mime_type || part.inlineData.mimeType) && part.inlineData.data) {
    return {
      inline_data: {
        mime_type: part.inlineData.mime_type || part.inlineData.mimeType,
        data: part.inlineData.data
      }
    };
  }
  if ((part.type === 'input_file' || part.type === 'file') && (part.mime_type || part.mimeType) && part.data) {
    return {
      inline_data: {
        mime_type: part.mime_type || part.mimeType,
        data: part.data
      }
    };
  }
  if (part.type === 'image_url' && part.image_url && typeof part.image_url.url === 'string') {
    const match = part.image_url.url.match(/^data:([^;,]+);base64,(.+)$/);
    if (match) return { inline_data: { mime_type: match[1], data: match[2] } };
  }
  return null;
}

function buildGeminiPartsFromContent(content) {
  if (typeof content === 'string') {
    const text = content.trim();
    return text ? [{ text }] : [];
  }

  if (!Array.isArray(content)) return [];
  const parts = [];
  for (const item of content) {
    const part = normalizeGeminiPart(item);
    if (part) parts.push(part);
  }
  return parts;
}

function buildGeminiContentsFromMessages(messages, systemPrompt) {
  const contents = [];
  const systemParts = [];

  if (systemPrompt && String(systemPrompt).trim()) {
    systemParts.push(String(systemPrompt).trim());
  }

  for (const msg of messages || []) {
    if (!msg || typeof msg !== 'object') continue;
    if (msg.role === 'system') {
      const text = typeof msg.content === 'string' ? msg.content.trim() : '';
      if (text) systemParts.push(text);
      continue;
    }
    const parts = buildGeminiPartsFromContent(msg.content);
    if (!parts.length) continue;
    contents.push({
      role: mapSessionRole(msg.role),
      parts
    });
  }

  if (systemParts.length) {
    contents.unshift({
      role: 'model',
      parts: [{ text: 'تم استلام تعليمات النظام وسألتزم بها.' }]
    });
    contents.unshift({
      role: 'user',
      parts: [{ text: systemParts.join('\n\n') }]
    });
  }

  return contents;
}

function splitReplyAndSuggestions(rawText) {
  const text = String(rawText || '').trim();
  if (!text) {
    return { reply: 'أهلاً بك، اكتب سؤالك وسأساعدك مباشرة.', suggestions: DEFAULT_SUGGESTIONS };
  }

  const delimiter = '---SUGGESTIONS---';
  const [answerPart, suggestionsPart = ''] = text.split(delimiter);
  const reply = filterAIResponse(answerPart.trim()) || 'أهلاً بك، كيف أقدر أخدمك اليوم؟';

  const suggestions = suggestionsPart
    .split('\n')
    .map(line => sanitizeUserInput(line))
    .map(line => line.replace(/^[-*0-9.)\s]+/, '').trim())
    .filter(Boolean)
    .slice(0, MAX_SUGGESTIONS);

  return { reply, suggestions: suggestions.length ? suggestions : DEFAULT_SUGGESTIONS };
}

async function runGeminiCompletion({
  model,
  messages,
  system,
  temperature = 0.2,
  maxOutputTokens,
  responseFormat,
  response_format,
  schemaName,
  schema,
  demoType,
  agentType,
  locale = 'ar-SA',
  sourcePage,
  safetyProfile,
  metadata
} = {}) {
  const requestId = createRequestId();
  const startedAt = Date.now();
  const activeSchemaName = schemaName
    || responseFormat?.json_schema?.name
    || response_format?.json_schema?.name
    || 'genericDemoSchema';
  const profileName = resolveSafetyProfileName({ safetyProfile, demoType, agentType, schemaName: activeSchemaName });
  const normalizedResponse = normalizeResponseFormat(responseFormat || response_format || null, activeSchemaName, schema);

  try {
    if (AI_GATEWAY_MOCK_MODE && config.server.nodeEnv === 'production') {
      return {
        ...createSafeAiError('MOCK_MODE_DISABLED_IN_PRODUCTION', 500),
        requestId,
        provider: 'gemini',
        model: model || resolveModel()
      };
    }

    if (isAiGatewayMockModeEnabled()) {
      const data = createMockDemoData(normalizedResponse.schemaName, demoType);
      safeGatewayLog('completion_mock', {
        requestId,
        demoType,
        agentType,
        schemaName: normalizedResponse.schemaName,
        sourcePage,
        latency: Date.now() - startedAt,
        success: true
      });
      return {
        ok: true,
        provider: 'mock-gemini',
        model: 'mock',
        requestId,
        data,
        text: JSON.stringify(data),
        schemaName: normalizedResponse.schemaName,
        safetyProfile: profileName
      };
    }

    if (!resolveApiKey()) {
      const unavailable = createSafeAiError('AI_PROVIDER_UNAVAILABLE', 503);
      safeGatewayLog('completion', {
        requestId,
        demoType,
        agentType,
        schemaName: activeSchemaName,
        sourcePage,
        latency: Date.now() - startedAt,
        success: false
      });
      return { ...unavailable, requestId, provider: 'gemini', model: model || resolveModel() };
    }

    const requestMessages = Array.isArray(messages) && messages.length
      ? messages
      : [{ role: 'user', content: String(metadata?.prompt || '') }];

    if (!requestMessages.length || requestMessages.every(item => !item?.content)) {
      return {
        ...createSafeAiError('INVALID_MESSAGES', 400),
        requestId,
        provider: 'gemini',
        model: model || resolveModel()
      };
    }

    const strictJsonInstruction = normalizedResponse.wantsJson
      ? [
          `أعد JSON صالحاً فقط باسم المخطط: ${normalizedResponse.schemaName}.`,
          'لا تضف Markdown ولا شرحاً خارج JSON.',
          'يجب أن يحتوي JSON على executive_summary_ar وkey_insights وrisks وrecommended_actions وbusiness_impact_ar وintegration_readiness وnext_action_ar وwhatsapp_summary_ar.'
        ].join('\n')
      : '';
    const safetyInstruction = safetyProfiles[profileName] || safetyProfiles.general_business;
    const systemPrompt = [
      system,
      `اللغة المطلوبة: ${locale}.`,
      safetyInstruction,
      strictJsonInstruction
    ].filter(Boolean).join('\n\n');

    const contents = buildGeminiContentsFromMessages(requestMessages, systemPrompt);
    if (!contents.length) {
      return {
        ...createSafeAiError('INVALID_MESSAGES', 400),
        requestId,
        provider: 'gemini',
        model: model || resolveModel()
      };
    }

    const text = await callGemini(contents, {
      model,
      temperature,
      maxOutputTokens: maxOutputTokens || metadata?.maxOutputTokens || 1600,
      responseSchema: normalizedResponse.wantsJson ? normalizedResponse.schema : null,
      responseMimeType: normalizedResponse.wantsJson ? 'application/json' : undefined,
      safetySettings: resolveSafetySettings({ safetyProfile: profileName, demoType, agentType, schemaName: activeSchemaName })
    });
    const parsed = normalizedResponse.wantsJson ? parseJsonFromGeminiText(text) : null;
    const data = normalizedResponse.wantsJson
      ? normalizeStructuredData(parsed, text, normalizedResponse.schemaName)
      : { text };

    safeGatewayLog('completion', {
      requestId,
      demoType,
      agentType,
      schemaName: normalizedResponse.schemaName,
      sourcePage,
      latency: Date.now() - startedAt,
      success: true
    });

    return {
      ok: true,
      provider: 'gemini',
      model: String(model || resolveModel()).trim() || resolveModel(),
      requestId,
      data,
      text,
      schemaName: normalizedResponse.schemaName,
      safetyProfile: profileName
    };
  } catch (error) {
    const statusCode = normalizeStatusCode(error);
    safeGatewayLog('completion', {
      requestId,
      demoType,
      agentType,
      schemaName: activeSchemaName,
      sourcePage,
      latency: Date.now() - startedAt,
      success: false
    });
    const safeStatusCode = statusCode >= 400 && statusCode < 600 ? statusCode : 503;
    return {
      ...createSafeAiError(normalizeSafeProviderErrorCode(error?.code, safeStatusCode), safeStatusCode),
      requestId,
      provider: 'gemini',
      model: String(model || resolveModel()).trim() || resolveModel()
    };
  }
}

function normalizeStatusCode(error) {
  let statusCode = Number(error?.statusCode) || 0;
  if (statusCode) return statusCode;
  const errCode = String(error?.code || '').toUpperCase();
  const errMessage = String(error?.message || '').toLowerCase();
  if (errCode === 'ETIMEDOUT' || errMessage.includes('timeout')) return 408;
  if (errCode === 'ECONNRESET' || errCode === 'ECONNREFUSED' || errCode === 'ENOTFOUND' || errCode === 'ENETUNREACH') return 503;
  return 500;
}

function createInputError(statusCode, message, errorCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = errorCode;
  error.userMessage = message;
  return error;
}

function validateChatRequest(req) {
  if (!isApiKeyConfigured()) {
    throw createInputError(
      503,
      'خدمة الذكاء الاصطناعي غير متاحة حالياً — مفتاح GEMINI_API_KEY غير مُعد في بيئة الخادم.',
      'GEMINI_NOT_CONFIGURED'
    );
  }

  if (!req.body || typeof req.body.message !== 'string') {
    throw createInputError(400, 'طلب غير صالح', 'INVALID_REQUEST');
  }

  const rawMessage = req.body.message;
  const sanitizedMessage = sanitizeUserInput(rawMessage);
  if (!sanitizedMessage) {
    throw createInputError(400, 'يرجى إدخال رسالة', 'NO_MESSAGE');
  }

  if (sanitizedMessage.length > config.validation.maxInputLength) {
    throw createInputError(400, `الرسالة طويلة جداً. الحد الأقصى ${config.validation.maxInputLength} حرف`, 'MESSAGE_TOO_LONG');
  }

  const providedSessionId = typeof req.body.sessionId === 'string'
    ? sanitizeUserInput(req.body.sessionId).slice(0, 120)
    : '';
  const session = getOrCreateSession(providedSessionId || createSessionId());
  const activeSessionId = session.id;
  const history = Array.isArray(session.history) ? session.history.slice(-12) : [];

  return { sanitizedMessage, activeSessionId, history };
}

function normalizeGeminiSchema(schema) {
  if (!schema || typeof schema !== 'object') return null;
  const copy = Array.isArray(schema) ? schema.map(normalizeGeminiSchema) : { ...schema };
  if (copy.type && typeof copy.type === 'string') copy.type = copy.type.toUpperCase();
  if (copy.properties && typeof copy.properties === 'object') {
    copy.properties = Object.fromEntries(
      Object.entries(copy.properties).map(([key, value]) => [key, normalizeGeminiSchema(value)])
    );
  }
  if (copy.items) copy.items = normalizeGeminiSchema(copy.items);
  if (Array.isArray(copy.anyOf)) copy.anyOf = copy.anyOf.map(normalizeGeminiSchema);
  if (Array.isArray(copy.oneOf)) copy.oneOf = copy.oneOf.map(normalizeGeminiSchema);
  if (Array.isArray(copy.allOf)) copy.allOf = copy.allOf.map(normalizeGeminiSchema);
  delete copy.additionalProperties;
  delete copy.$schema;
  return copy;
}

function resolveResponseSchema(body) {
  const responseFormat = body?.response_format || body?.responseFormat;
  if (!responseFormat || typeof responseFormat !== 'object') {
    // Legacy fallback: direct responseSchema / response_schema on body
    return normalizeGeminiSchema(body?.responseSchema || body?.response_schema || null);
  }

  // Unified standard: response_format.json_schema.schema
  const jsonSchema = responseFormat.json_schema || responseFormat.jsonSchema;
  if (jsonSchema && typeof jsonSchema === 'object' && jsonSchema.schema) {
    return normalizeGeminiSchema(jsonSchema.schema);
  }

  // Fallback: response_format.schema (shorthand)
  if (responseFormat.schema) {
    return normalizeGeminiSchema(responseFormat.schema);
  }

  return null;
}

function resolveSchemaName(body) {
  const responseFormat = body?.response_format || body?.responseFormat;
  const jsonSchema = responseFormat?.json_schema || responseFormat?.jsonSchema;
  return String(jsonSchema?.name || body?.schemaName || 'unnamed_schema');
}

function resolveSafetySettings(body) {
  if (Array.isArray(body?.safetySettings)) return body.safetySettings;
  if (Array.isArray(body?.safety_settings)) return body.safety_settings;

  const domain = String(body?.domain || body?.demoDomain || '').toLowerCase();
  const threshold = (domain === 'health' || domain === 'medical' || domain === 'medical_archive')
    ? 'BLOCK_LOW_AND_ABOVE'
    : 'BLOCK_MEDIUM_AND_ABOVE';

  return [
    { category: 'HARM_CATEGORY_HARASSMENT', threshold },
    { category: 'HARM_CATEGORY_HATE_SPEECH', threshold },
    { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold },
    { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold }
  ];
}

async function callGemini(contents, options = {}) {
  return retryWithBackoff(async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(new Error('TIMEOUT')), REQUEST_TIMEOUT_MS);

    try {
      const generationConfig = {
        temperature: Number.isFinite(Number(options.temperature)) ? Number(options.temperature) : 0.55,
        maxOutputTokens: Number.isFinite(Number(options.maxOutputTokens)) ? Number(options.maxOutputTokens) : 900
      };
      const responseSchema = normalizeGeminiSchema(options.responseSchema);
      if (responseSchema) {
        generationConfig.responseMimeType = 'application/json';
        generationConfig.responseSchema = responseSchema;
      } else if (options.responseMimeType) {
        generationConfig.responseMimeType = options.responseMimeType;
      }

      const response = await fetch(buildGeminiGenerateUrl(options.model), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': resolveApiKey()
        },
        body: JSON.stringify({
          contents,
          generationConfig,
          safetySettings: Array.isArray(options.safetySettings) ? options.safetySettings : undefined
        }),
        signal: controller.signal
      });

      if (!response.ok) {
        const bodyText = await response.text().catch(() => '');
        const apiError = new Error(bodyText || `GEMINI_API_${response.status}`);
        apiError.statusCode = response.status;
        apiError.code = `GEMINI_API_${response.status}`;
        throw apiError;
      }

      const payload = await response.json();
      const text = parseGeminiText(payload);
      if (!text) {
        const emptyError = new Error('EMPTY_GEMINI_REPLY');
        emptyError.statusCode = 502;
        emptyError.code = 'EMPTY_GEMINI_REPLY';
        throw emptyError;
      }

      return text;
    } catch (error) {
      if (error && (error.name === 'AbortError' || error.message === 'TIMEOUT')) {
        const timeoutError = new Error('TIMEOUT');
        timeoutError.statusCode = 408;
        timeoutError.code = 'REQUEST_TIMEOUT';
        throw timeoutError;
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }, {
    maxRetries: config.server.nodeEnv === 'test' ? 0 : 3,
    baseDelay: config.server.nodeEnv === 'test' ? 10 : 1000,
    maxDelay: config.server.nodeEnv === 'test' ? 20 : 10000
  });
}

async function callGeminiStream(contents, { signal, onToken } = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(new Error('TIMEOUT')), REQUEST_TIMEOUT_MS);

  if (signal) {
    if (signal.aborted) {
      controller.abort(signal.reason || new Error('ABORTED'));
    } else {
      signal.addEventListener('abort', () => controller.abort(signal.reason || new Error('ABORTED')), { once: true });
    }
  }

  let accumulated = '';

  try {
    const response = await fetch(buildGeminiStreamUrl(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': resolveApiKey()
      },
      body: JSON.stringify({
        contents,
        generationConfig: { temperature: 0.55, maxOutputTokens: 900 }
      }),
      signal: controller.signal
    });

    if (!response.ok) {
      const bodyText = await response.text().catch(() => '');
      const apiError = new Error(bodyText || `GEMINI_API_${response.status}`);
      apiError.statusCode = response.status;
      apiError.code = `GEMINI_API_${response.status}`;
      throw apiError;
    }

    const reader = response.body?.getReader?.();
    if (!reader) {
      const bodyText = await response.text().catch(() => '');
      if (!bodyText.trim()) {
        const emptyError = new Error('EMPTY_GEMINI_REPLY');
        emptyError.statusCode = 502;
        emptyError.code = 'EMPTY_GEMINI_REPLY';
        throw emptyError;
      }
      accumulated = bodyText.trim();
      if (onToken) onToken(accumulated);
      return accumulated;
    }

    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    const processChunk = (rawChunk) => {
      const lines = rawChunk.split('\n');
      for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line.startsWith('data:')) continue;
        const payload = line.replace(/^data:\s*/, '');
        if (!payload || payload === '[DONE]') continue;
        try {
          const parsed = JSON.parse(payload);
          const text = parseGeminiText(parsed);
          if (!text) continue;
          const delta = accumulated && text.startsWith(accumulated) ? text.slice(accumulated.length) : text;
          if (!delta) continue;
          accumulated += delta;
          if (onToken) onToken(delta);
        } catch (_error) {
          continue;
        }
      }
    };

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const chunks = buffer.split('\n\n');
      buffer = chunks.pop() || '';
      chunks.forEach(processChunk);
    }

    if (buffer.trim()) processChunk(buffer);

    if (!accumulated.trim()) {
      const emptyError = new Error('EMPTY_GEMINI_REPLY');
      emptyError.statusCode = 502;
      emptyError.code = 'EMPTY_GEMINI_REPLY';
      throw emptyError;
    }

    return accumulated;
  } catch (error) {
    if (error && (error.name === 'AbortError' || error.message === 'TIMEOUT')) {
      const timeoutError = new Error('TIMEOUT');
      timeoutError.statusCode = 408;
      timeoutError.code = 'REQUEST_TIMEOUT';
      throw timeoutError;
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function writeSse(streamRes, payload) {
  streamRes.write(`data: ${JSON.stringify(payload)}\n\n`);
}

async function chat(req) {
  const { sanitizedMessage, activeSessionId, history } = validateChatRequest(req);
  const contents = buildGeminiContents(history, sanitizedMessage, CHAT_SYSTEM_PROMPT);
  const rawReply = await callGemini(contents);
  const { reply, suggestions } = splitReplyAndSuggestions(rawReply);

  addToSession(activeSessionId, 'user', sanitizedMessage);
  addToSession(activeSessionId, 'assistant', reply);

  return { reply, sessionId: activeSessionId, suggestions };
}

async function chatStream(req, rawRes) {
  const streamRes = rawRes;

  let chatContext;
  try {
    chatContext = validateChatRequest(req);
  } catch (error) {
    const statusCode = normalizeStatusCode(error);
    return { error: true, statusCode, errorData: { error: error?.userMessage || 'حدث خطأ', errorCode: error?.code || 'CHAT_ERROR' } };
  }

  const { sanitizedMessage, activeSessionId, history } = chatContext;

  streamRes.writeHead(200, {
    ...(req.corsHeaders || {}),
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive'
  });
  writeSse(streamRes, { type: 'session', sessionId: activeSessionId });

  const controller = new AbortController();
  req.on('close', () => {
    const closeError = new Error('CLIENT_ABORTED');
    closeError.code = 'CLIENT_ABORTED';
    controller.abort(closeError);
  });

  let assistantText = '';

  try {
    const contents = buildGeminiContents(history, sanitizedMessage, STREAM_SYSTEM_PROMPT);
    addToSession(activeSessionId, 'user', sanitizedMessage);

    assistantText = await callGeminiStream(contents, {
      signal: controller.signal,
      onToken: (delta) => {
        if (!delta) return;
        writeSse(streamRes, { type: 'token', token: delta });
      }
    });

    const { reply, suggestions } = splitReplyAndSuggestions(assistantText);
    const safeReply = reply || 'أهلاً بك، كيف أقدر أخدمك اليوم؟';

    addToSession(activeSessionId, 'assistant', safeReply);
    writeSse(streamRes, { type: 'done', reply: safeReply, sessionId: activeSessionId, suggestions });
    streamRes.write('data: [DONE]\n\n');
  } catch (error) {
    if (error?.code === 'CLIENT_ABORTED') {
      try { streamRes.end(); } catch (_e) { /* ignore */ }
      return { error: true, clientAborted: true };
    }
    const statusCode = normalizeStatusCode(error);
    writeSse(streamRes, {
      type: 'error',
      error: error?.userMessage || 'حدث خطأ أثناء البث',
      errorCode: error?.code || 'STREAM_ERROR',
      statusCode
    });
    streamRes.write('data: [DONE]\n\n');
  } finally {
    try { streamRes.end(); } catch (_e) { /* ignore */ }
  }

  return { error: false };
}

async function openAiCompatChat(req) {
  const body = req && req.body && typeof req.body === 'object' ? req.body : {};
  const provider = pickProvider(body);
  const model = String(body.model || '').trim() || resolveModel();
  const temperature = Number.isFinite(Number(body.temperature)) ? Number(body.temperature) : 0.2;
  const maxTokens = Number.isFinite(Number(body.max_tokens || body.maxTokens)) ? Number(body.max_tokens || body.maxTokens) : 4096;

  const messages = Array.isArray(body.messages)
    ? body.messages
    : (typeof body.prompt === 'string' && body.prompt.trim()
      ? [{ role: 'user', content: body.prompt }]
      : []);

  if (!messages.length) {
    const error = new Error('يرجى إرسال messages أو prompt');
    error.statusCode = 400;
    error.code = 'INVALID_MESSAGES';
    throw error;
  }

  if (provider === 'nvidia' || provider === 'deepseek') {
    const result = await callOpenAiCompatibleProvider({ provider, messages, temperature, maxTokens, model: body.model });
    return { ...result.data, provider: result.provider, activeModel: result.model };
  }

  const schemaName = resolveSchemaName(body);
  const result = await runGeminiCompletion({
    model,
    messages,
    temperature,
    maxOutputTokens: maxTokens,
    responseFormat: body.response_format || body.responseFormat,
    schemaName,
    schema: resolveResponseSchema(body),
    demoType: body.demoType,
    agentType: body.agentType,
    locale: body.locale || 'ar-SA',
    sourcePage: body.sourcePage,
    safetyProfile: body.safetyProfile,
    metadata: { maxOutputTokens: maxTokens }
  });

  if (!result.ok) return result;
  const content = typeof result.data === 'string' ? result.data : JSON.stringify(result.data);
  return {
    ok: true,
    provider: result.provider || 'gemini',
    model: result.model,
    activeModel: result.model,
    requestId: result.requestId,
    data: result.data,
    schemaName: result.schemaName,
    choices: [{ message: { role: 'assistant', content }, finish_reason: 'stop' }]
  };
}

function getProviderStatus() {
  return {
    gemini: {
      configured: isApiKeyConfigured(),
      model: resolveModel(),
      primary: true,
      message: isApiKeyConfigured() ? 'GEMINI_API_KEY مُعد وجاهز' : 'GEMINI_API_KEY غير مُعد'
    },
    groq: {
      configured: isGroqConfigured(),
      model: config.groq.model,
      primary: false,
      message: isGroqConfigured() ? 'GROQ_API_KEY مُعد' : 'GROQ_API_KEY غير مُعد'
    },
    nvidia: {
      configured: isNvidiaConfigured(),
      model: config.nvidia.model,
      primary: false,
      message: isNvidiaConfigured() ? 'NVIDIA_API_KEY مُعد' : 'NVIDIA_API_KEY غير مُعد'
    },
    deepseek: {
      configured: isDeepSeekConfigured(),
      model: config.deepseek.model,
      primary: false,
      message: isDeepSeekConfigured() ? 'DEEPSEEK_API_KEY مُعد' : 'DEEPSEEK_API_KEY غير مُعد'
    }
  };
}

function getSafeAiStatus() {
  return {
    ok: true,
    providers: {
      gemini: {
        configured: isApiKeyConfigured(),
        model: resolveModel(),
        status: isApiKeyConfigured() ? 'ready' : 'missing_key'
      }
    }
  };
}

module.exports = {
  chat,
  chatStream,
  openAiCompatChat,
  runGeminiCompletion,
  validateChatRequest,
  callGemini,
  callGeminiStream,
  buildGeminiContents,
  parseGeminiText,
  splitReplyAndSuggestions,
  resolveApiKey,
  resolveModel,
  resolveSchemaName,
  resolveDemoSchema,
  demoSchemas,
  schemaAliases,
  safetyProfiles,
  isAiGatewayMockModeEnabled,
  createMockDemoData,
  normalizeStatusCode,
  getProviderStatus,
  getSafeAiStatus,
  CHAT_SYSTEM_PROMPT,
  STREAM_SYSTEM_PROMPT,
  DEFAULT_SUGGESTIONS,
  writeSse
};
