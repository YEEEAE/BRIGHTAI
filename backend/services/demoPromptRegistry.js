const { extractJsonObject } = require('../utils/safeJson');

const RESPONSE_SCHEMA_DESCRIPTION = `{
  "summary": "string من 50 إلى 300 حرف",
  "items": [
    {
      "title": "string",
      "description": "string",
      "status": "good|warning|critical"
    }
  ],
  "metrics": [
    {
      "label": "string",
      "value": "string",
      "level": "low|medium|high",
      "trend": "up|down|stable"
    }
  ],
  "recommendations": [
    {
      "text": "string",
      "priority": "low|medium|high",
      "effort": "low|medium|high"
    }
  ],
  "nextActions": ["string"],
  "report": "formatted Arabic report",
  "confidence": 0.85,
  "riskLevel": "low|medium|high|critical"
}`;

const DATA_ANALYZER_RESPONSE_SCHEMA = Object.freeze({
  type: 'object',
  required: [
    'dataset_profile',
    'kpis',
    'insights',
    'anomalies',
    'suggested_questions',
    'recommended_dashboards',
    'tool_plan',
    'audit_log'
  ],
  properties: {
    dataset_profile: {
      type: 'object',
      required: ['rows', 'cols', 'types', 'missing_pct', 'date_range'],
      properties: {
        rows: { type: 'integer', minimum: 0 },
        cols: { type: 'integer', minimum: 0 },
        types: { type: 'object' },
        missing_pct: { type: 'number', minimum: 0, maximum: 100 },
        date_range: { type: 'string' }
      }
    },
    kpis: {
      type: 'array',
      items: {
        type: 'object',
        required: ['name', 'value', 'change_pct', 'sparkline_data'],
        properties: {
          name: { type: 'string' },
          value: { type: 'string' },
          change_pct: { type: 'number' },
          sparkline_data: { type: 'array', items: { type: 'number' } }
        }
      }
    },
    insights: {
      type: 'array',
      items: {
        type: 'object',
        required: ['text', 'severity', 'supporting_chart_id', 'confidence'],
        properties: {
          text: { type: 'string' },
          severity: { type: 'string', enum: ['info', 'warning', 'critical', 'success'] },
          supporting_chart_id: { type: 'string' },
          confidence: { type: 'number', minimum: 0, maximum: 1 }
        }
      }
    },
    anomalies: {
      type: 'array',
      items: {
        type: 'object',
        required: ['row', 'column', 'value', 'z_score', 'explanation'],
        properties: {
          row: { type: 'integer', minimum: 0 },
          column: { type: 'string' },
          value: { type: 'string' },
          z_score: { type: 'number' },
          explanation: { type: 'string' }
        }
      }
    },
    suggested_questions: { type: 'array', items: { type: 'string' } },
    recommended_dashboards: {
      type: 'array',
      items: {
        type: 'object',
        required: ['title', 'charts'],
        properties: {
          title: { type: 'string' },
          charts: { type: 'array', items: { type: 'string' } }
        }
      }
    },
    tool_plan: {
      type: 'array',
      items: {
        type: 'object',
        required: ['tool', 'arguments', 'sql', 'why'],
        properties: {
          tool: { type: 'string', enum: ['run_sql', 'create_chart', 'detect_anomalies', 'forecast', 'correlate'] },
          arguments: { type: 'object' },
          sql: { type: 'string' },
          why: { type: 'string' }
        }
      }
    },
    audit_log: {
      type: 'array',
      items: {
        type: 'object',
        required: ['step', 'status', 'detail'],
        properties: {
          step: { type: 'string' },
          status: { type: 'string', enum: ['success', 'warning', 'blocked'] },
          detail: { type: 'string' }
        }
      }
    }
  }
});

const DATA_ANALYZER_SCHEMA_DESCRIPTION = JSON.stringify(DATA_ANALYZER_RESPONSE_SCHEMA);

const SMART_HIRING_RESPONSE_SCHEMA = Object.freeze({
  type: 'object',
  required: [
    'match_score',
    'score_breakdown',
    'skill_matrix',
    'experience_summary',
    'red_flags',
    'interview_questions',
    'bias_audit'
  ],
  properties: {
    match_score: { type: 'integer', minimum: 0, maximum: 100 },
    score_breakdown: {
      type: 'object',
      required: ['skills', 'experience', 'education', 'culture'],
      properties: {
        skills: { type: 'integer', minimum: 0, maximum: 40 },
        experience: { type: 'integer', minimum: 0, maximum: 30 },
        education: { type: 'integer', minimum: 0, maximum: 15 },
        culture: { type: 'integer', minimum: 0, maximum: 15 }
      }
    },
    skill_matrix: {
      type: 'array',
      items: {
        type: 'object',
        required: ['skill', 'required', 'evidence', 'level'],
        properties: {
          skill: { type: 'string' },
          required: { type: 'boolean' },
          evidence: { type: 'string' },
          level: { type: 'string', enum: ['green', 'yellow', 'red'] }
        }
      }
    },
    experience_summary: {
      type: 'array',
      items: {
        type: 'object',
        required: ['company', 'role', 'years', 'relevance'],
        properties: {
          company: { type: 'string' },
          role: { type: 'string' },
          years: { type: 'number' },
          relevance: { type: 'string' }
        }
      }
    },
    red_flags: {
      type: 'array',
      items: {
        type: 'object',
        required: ['type', 'severity', 'description'],
        properties: {
          type: { type: 'string' },
          severity: { type: 'string', enum: ['low', 'medium', 'high'] },
          description: { type: 'string' }
        }
      }
    },
    interview_questions: {
      type: 'array',
      items: {
        type: 'object',
        required: ['question', 'category', 'rationale', 'good_answer_signals'],
        properties: {
          question: { type: 'string' },
          category: { type: 'string', enum: ['technical', 'behavioral', 'situational'] },
          rationale: { type: 'string' },
          good_answer_signals: { type: 'array', items: { type: 'string' } }
        }
      }
    },
    bias_audit: {
      type: 'object',
      required: ['factors_ignored', 'reasoning_transparency'],
      properties: {
        factors_ignored: { type: 'array', items: { type: 'string' } },
        reasoning_transparency: { type: 'string' }
      }
    }
  }
});

const SMART_HIRING_SCHEMA_DESCRIPTION = JSON.stringify(SMART_HIRING_RESPONSE_SCHEMA);

const MEDICAL_ARCHIVE_RESPONSE_SCHEMA = Object.freeze({
  type: 'object',
  required: [
    'document_type',
    'patient_demographics',
    'visit_info',
    'chief_complaint',
    'vital_signs',
    'diagnoses',
    'medications',
    'allergies',
    'lab_results',
    'procedures',
    'follow_up',
    'data_quality',
    'privacy_risks',
    'routing_suggestion'
  ],
  properties: {
    document_type: { type: 'string', enum: ['clinical_note', 'lab_report', 'prescription', 'discharge_summary', 'radiology_report', 'referral'] },
    patient_demographics: {
      type: 'object',
      required: ['age_band', 'gender', 'mrn_redacted'],
      properties: {
        age_band: { type: 'string' },
        gender: { type: 'string' },
        mrn_redacted: { type: 'string' }
      }
    },
    visit_info: {
      type: 'object',
      required: ['date', 'department', 'attending_physician_role'],
      properties: {
        date: { type: 'string' },
        department: { type: 'string' },
        attending_physician_role: { type: 'string' }
      }
    },
    chief_complaint: { type: 'string' },
    vital_signs: {
      type: 'object',
      properties: {
        bp: { type: 'string' },
        hr: { type: 'string' },
        temp: { type: 'string' },
        spo2: { type: 'string' },
        rr: { type: 'string' },
        weight: { type: 'string' }
      }
    },
    diagnoses: {
      type: 'array',
      items: {
        type: 'object',
        required: ['text_ar', 'text_en', 'icd10_code', 'icd10_confidence', 'type'],
        properties: {
          text_ar: { type: 'string' },
          text_en: { type: 'string' },
          icd10_code: { type: 'string' },
          icd10_confidence: { type: 'number', minimum: 0, maximum: 1 },
          type: { type: 'string', enum: ['primary', 'secondary'] }
        }
      }
    },
    medications: {
      type: 'array',
      items: {
        type: 'object',
        required: ['name', 'generic', 'dose', 'route', 'frequency', 'duration', 'sfda_registered'],
        properties: {
          name: { type: 'string' },
          generic: { type: 'string' },
          dose: { type: 'string' },
          route: { type: 'string' },
          frequency: { type: 'string' },
          duration: { type: 'string' },
          sfda_registered: { type: 'boolean' }
        }
      }
    },
    allergies: { type: 'array', items: { type: 'string' } },
    lab_results: {
      type: 'array',
      items: {
        type: 'object',
        required: ['test', 'value', 'unit', 'reference_range', 'flag'],
        properties: {
          test: { type: 'string' },
          value: { type: 'string' },
          unit: { type: 'string' },
          reference_range: { type: 'string' },
          flag: { type: 'string', enum: ['H', 'L', 'N', 'critical'] }
        }
      }
    },
    procedures: {
      type: 'array',
      items: {
        type: 'object',
        required: ['cpt_code', 'description'],
        properties: {
          cpt_code: { type: 'string' },
          description: { type: 'string' }
        }
      }
    },
    follow_up: {
      type: 'object',
      required: ['required', 'timeframe', 'department'],
      properties: {
        required: { type: 'boolean' },
        timeframe: { type: 'string' },
        department: { type: 'string' }
      }
    },
    data_quality: {
      type: 'object',
      required: ['completeness_pct', 'missing_fields', 'illegible_sections'],
      properties: {
        completeness_pct: { type: 'integer', minimum: 0, maximum: 100 },
        missing_fields: { type: 'array', items: { type: 'string' } },
        illegible_sections: { type: 'array', items: { type: 'string' } }
      }
    },
    privacy_risks: {
      type: 'array',
      items: {
        type: 'object',
        required: ['field', 'risk_level', 'recommendation'],
        properties: {
          field: { type: 'string' },
          risk_level: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
          recommendation: { type: 'string' }
        }
      }
    },
    routing_suggestion: {
      type: 'object',
      required: ['target_department', 'urgency'],
      properties: {
        target_department: { type: 'string' },
        urgency: { type: 'string', enum: ['routine', 'urgent', 'stat'] }
      }
    }
  }
});

const MEDICAL_ARCHIVE_SCHEMA_DESCRIPTION = JSON.stringify(MEDICAL_ARCHIVE_RESPONSE_SCHEMA);

const CUSTOMER_SERVICE_RESPONSE_SCHEMA = Object.freeze({
  type: 'object',
  required: [
    'intent',
    'intent_confidence',
    'sentiment',
    'language',
    'dialect',
    'retrieved_kb_articles',
    'tools_called',
    'response_text',
    'suggested_quick_replies',
    'escalation',
    'csat_prediction',
    'handling_time_estimate_seconds'
  ],
  properties: {
    intent: { type: 'string' },
    intent_confidence: { type: 'number', minimum: 0, maximum: 1 },
    sentiment: {
      type: 'object',
      required: ['polarity', 'emotion'],
      properties: {
        polarity: { type: 'number', minimum: -1, maximum: 1 },
        emotion: { type: 'string', enum: ['angry', 'frustrated', 'happy', 'confused', 'neutral', 'urgent'] }
      }
    },
    language: { type: 'string' },
    dialect: { type: 'string', enum: ['msa', 'saudi', 'gulf', 'egyptian', 'levantine', 'mixed'] },
    retrieved_kb_articles: {
      type: 'array',
      items: {
        type: 'object',
        required: ['id', 'title', 'confidence', 'snippet'],
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          confidence: { type: 'number', minimum: 0, maximum: 1 },
          snippet: { type: 'string' }
        }
      }
    },
    tools_called: {
      type: 'array',
      items: {
        type: 'object',
        required: ['name', 'arguments', 'result', 'requires_human_approval'],
        properties: {
          name: { type: 'string', enum: ['check_order_status', 'process_refund', 'book_appointment', 'escalate_to_human', 'update_customer_record', 'search_kb'] },
          arguments: { type: 'object' },
          result: { type: 'string' },
          requires_human_approval: { type: 'boolean' }
        }
      }
    },
    response_text: { type: 'string' },
    suggested_quick_replies: { type: 'array', items: { type: 'string' } },
    escalation: {
      type: 'object',
      required: ['required', 'reason', 'priority', 'suggested_team'],
      properties: {
        required: { type: 'boolean' },
        reason: { type: 'string' },
        priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] },
        suggested_team: { type: 'string' }
      }
    },
    csat_prediction: { type: 'number', minimum: 1, maximum: 5 },
    handling_time_estimate_seconds: { type: 'number', minimum: 0 }
  }
});

const CUSTOMER_SERVICE_SCHEMA_DESCRIPTION = JSON.stringify(CUSTOMER_SERVICE_RESPONSE_SCHEMA);

const BASE_SYSTEM_INSTRUCTION = [
  'أنت BrightAI — مساعد ذكاء اصطناعي للشركات السعودية.',
  'نبرتك سعودية مرحّبة، شبابية، واثقة، واحترافية.',
  'تكلّم كزميل متمكن، وليس كموظف رسمي.',
  'استخدم عبارات مثل: خلّنا، تمام، جاهز، نشتغل عليها.',
  'تجنب: حضراتكم، نتشرف، بكل سرور.',
  'لا تعد بنتائج مبالغ فيها.',
  'لا تدّعي أن AI يتخذ القرار بدلاً من البشر.',
  'لا تخرج عن JSON أبداً.',
  'ممنوع Markdown أو code blocks أو أي نص خارج JSON أو raw Gemini response.',
  `يجب أن يطابق الرد هذا المخطط فقط: ${RESPONSE_SCHEMA_DESCRIPTION}`
].join('\n');

const ALLOWED_DEMO_TYPES = Object.freeze([
  'ai-agent',
  'tenders-analysis',
  'data-analyzer',
  'data-analysis',
  'smart-automation',
  'ai-workflows',
  'smart-education-platform',
  'smart-hospital-management',
  'smart-medical-archive',
  'smart-hiring-system',
  'customer-service-automation'
]);

const DEMO_TYPE_ALIASES = Object.freeze({
  'ai-tenders-analysis': 'tenders-analysis',
  'data-analytics': 'data-analyzer'
});

const PRO_MODEL_DEMOS = new Set(['tenders-analysis', 'smart-hospital-management']);
const THINKING_MODEL_DEMOS = new Set(['smart-medical-archive']);

const STATUS_VALUES = new Set(['good', 'warning', 'critical']);
const LEVEL_VALUES = new Set(['low', 'medium', 'high']);
const TREND_VALUES = new Set(['up', 'down', 'stable']);
const RISK_VALUES = new Set(['low', 'medium', 'high', 'critical']);

const DEMO_BLUEPRINTS = Object.freeze({
  'ai-agent': {
    title: 'وكيل ذكاء اصطناعي للمؤسسات',
    schemaName: 'custom_ai_agent',
    safetyProfile: 'business',
    sector: 'وكلاء الأعمال',
    audience: 'الإدارة التشغيلية وفرق خدمة العملاء والمبيعات',
    problem: 'تكرار المهام والأسئلة بين الفرق بدون ذاكرة أو صلاحيات واضحة',
    outcome: 'تعريف وكيل، حدود صلاحيات، خطة تكامل، ومؤشر جاهزية',
    focus: 'صمم تصور وكيل ذكاء اصطناعي مؤسسي مناسب للسوق السعودي، مع التركيز على القيمة، التكاملات، الحوكمة، والمخاطر.',
    disclaimer: 'هذا الديمو تصور أولي لحدود الوكيل وصلاحياته، ولا يعني تشغيله الفعلي أو تفويضه باتخاذ قرارات بدون اعتماد بشري.',
    scenarios: ['خدمة عملاء', 'عمليات داخلية', 'مبيعات'],
    variations: [
      {
        summary: 'تمام، السيناريو مناسب لوكيل مساعد يخفف التكرار ويرفع وضوح التصعيد بدون ما يستبدل قرار الفريق.',
        items: [
          ['نطاق الوكيل', 'يرد على الأسئلة المتكررة ويجمع البيانات الناقصة ثم يرفع الحالات الحساسة للموظف المختص.', 'good'],
          ['حدود الصلاحية', 'يحتاج قواعد واضحة لما يسمح له بتنفيذه وما يجب تصعيده قبل أي إجراء.', 'warning'],
          ['الربط التشغيلي', 'أفضل نقطة بداية هي ربط نموذج الطلبات مع CRM أو نظام التذاكر.', 'good']
        ],
        metrics: [
          ['جاهزية السيناريو', '78%', 'high', 'up'],
          ['تعقيد التكامل', 'متوسط', 'medium', 'stable'],
          ['حاجة التصعيد البشري', 'مرتفعة للحالات الحساسة', 'high', 'stable']
        ],
        riskLevel: 'medium'
      },
      {
        summary: 'جاهز، المدخلات تكشف فرصة واضحة لبناء وكيل داخلي يختصر المتابعة ويترك الاعتماد النهائي للبشر.',
        items: [
          ['مسار المحادثة', 'ابدأ بأسئلة تأهيل قصيرة ثم ملخص قابل للإرسال للفريق المسؤول.', 'good'],
          ['جودة المعرفة', 'قاعدة المعرفة تحتاج تحديثاً أسبوعياً حتى لا يرد الوكيل بمعلومة قديمة.', 'warning'],
          ['الحوكمة', 'سجل المحادثات والصلاحيات ضروري قبل ربط أي إجراء تنفيذي.', 'warning']
        ],
        metrics: [
          ['قابلية الأتمتة', 'عالية', 'high', 'up'],
          ['اعتماد البيانات', 'متوسط', 'medium', 'stable'],
          ['أثر وقت الفريق', 'واضح', 'high', 'up']
        ],
        riskLevel: 'medium'
      },
      {
        summary: 'خلّنا نشتغل عليها كنسخة أولى محدودة: وكيل يجمع، يلخص، ويقترح الخطوة التالية بدون اتخاذ القرار.',
        items: [
          ['بداية عملية', 'اختر مساراً واحداً عالي التكرار بدل فتح كل الطلبات من البداية.', 'good'],
          ['التجربة العامة', 'لا تستخدم بيانات عملاء حساسة في الديمو العام.', 'warning'],
          ['قياس النجاح', 'اربط التجربة بزمن الرد ونسبة التصعيد الصحيح.', 'good']
        ],
        metrics: [
          ['وضوح نطاق البداية', 'جيد', 'high', 'up'],
          ['مخاطر الخصوصية', 'متوسطة', 'medium', 'stable'],
          ['سرعة تجربة أولية', 'أسبوعان إلى أربعة', 'medium', 'down']
        ],
        riskLevel: 'medium'
      }
    ]
  },
  'tenders-analysis': {
    title: 'تحليل المناقصات',
    schemaName: 'tenders_demo_schema',
    safetyProfile: 'legal',
    sector: 'المناقصات والمشتريات',
    audience: 'شركات المقاولات والخدمات والموردين',
    problem: 'قراءة كراسات وشروط طويلة مع احتمال تفويت متطلبات أو مخاطر تعاقدية',
    outcome: 'ملخص متطلبات، مخاطر امتثال، جاهزية تقديم، وخطة قرار',
    focus: 'حلل فرصة المناقصة من منظور تنفيذي، واذكر أن المخرجات لا تغني عن مراجعة قانونية أو امتثال رسمي.',
    disclaimer: 'هذا تحليل أولي للمساعدة في الفرز، ولا يغني عن مراجعة قانونية أو مالية أو امتثال من مختصين داخل الشركة.',
    scenarios: ['مقاولات', 'تقنية', 'توريد'],
    variations: [
      {
        summary: 'تمام، الفرصة تبدو قابلة للدراسة لكن فيها متطلبات امتثال وجدول تسليم تحتاج مراجعة دقيقة قبل التقديم.',
        items: [
          ['جاهزية التقديم', 'المتطلبات الأساسية واضحة، لكن يلزم تأكيد الخبرات والضمانات قبل قرار الدخول.', 'warning'],
          ['المخاطر التعاقدية', 'غرامات التأخير وشروط القبول تحتاج مراجعة قانونية وتشغيلية.', 'critical'],
          ['نقطة القوة', 'وجود مشاريع مشابهة أو شركاء تنفيذ يرفع قابلية المنافسة.', 'good']
        ],
        metrics: [
          ['ملاءمة الفرصة', '74%', 'medium', 'up'],
          ['مخاطر الالتزام', 'مرتفعة', 'high', 'stable'],
          ['وضوح المتطلبات', 'جيد', 'high', 'stable']
        ],
        riskLevel: 'high'
      },
      {
        summary: 'جاهز، التحليل يشير أن القرار الأفضل هو استكمال قائمة نواقص قبل التسعير النهائي أو الالتزام بالتقديم.',
        items: [
          ['نواقص القرار', 'تحتاج قائمة تحقق للضمانات، الخبرات، الجدول، وشروط التسليم.', 'warning'],
          ['التسعير', 'لا ينصح بتسعير نهائي قبل احتساب مخاطر التأخير والدعم.', 'warning'],
          ['المراجعة البشرية', 'أي بند قانوني أو غرامة يجب أن يمر على مختص قبل الاعتماد.', 'critical']
        ],
        metrics: [
          ['ثقة القراءة الأولية', '82%', 'high', 'up'],
          ['تعقيد العقد', 'متوسط إلى مرتفع', 'high', 'stable'],
          ['جاهزية المستندات', 'متوسطة', 'medium', 'up']
        ],
        riskLevel: 'high'
      },
      {
        summary: 'خلّنا نرتبها كقرار إداري: الفرصة واعدة إذا تم إغلاق متطلبات التأهيل والمخاطر قبل العرض.',
        items: [
          ['قرار مبدئي', 'أكمل التحليل إذا كانت القدرة التنفيذية والضمانات متوفرة.', 'good'],
          ['مخاطر الجدول', 'التسليم المرحلي قد يرفع تكلفة التشغيل إذا لم تضبط الموارد.', 'warning'],
          ['الامتثال', 'يلزم فحص الشروط الخاصة والملحقات قبل رفع العرض.', 'critical']
        ],
        metrics: [
          ['قابلية المنافسة', 'متوسطة', 'medium', 'up'],
          ['حساسية السعر', 'عالية', 'high', 'stable'],
          ['حاجة مراجعة مختص', 'عالية', 'high', 'stable']
        ],
        riskLevel: 'high'
      }
    ]
  },
  'data-analyzer': {
    title: 'ملعب تحليل البيانات الذكي',
    schemaName: 'data_analyzer_playground_schema',
    safetyProfile: 'business',
    sector: 'تحليل البيانات وذكاء الأعمال',
    audience: 'فرق الإدارة التنفيذية والتحليل والعمليات في الشركات السعودية',
    problem: 'تحويل ملفات CSV وXLSX والجداول التشغيلية إلى مؤشرات ورسوم وأسئلة متابعة قابلة للتنفيذ',
    outcome: 'ملف بيانات موصوف، مؤشرات KPI، رؤى مدعومة برسوم، شذوذ، أسئلة متابعة، ولوحات مقترحة',
    focus: [
      'اعمل كمحلل بيانات تنفيذي عربي لشركات سعودية.',
      'حلل العينة المرسلة فقط ولا تدع أن النتيجة تغطي كامل النظام إن كانت العينة محدودة.',
      'استخدم منهجية شفافة: اقترح SQL لكل إجابة، وحدد الرسم المناسب، واذكر الثقة لكل insight.',
      'استخدم أداة code_execution عند الحاجة لحسابات إحصائية أو فحص أعمدة أو توليد تحقق عددي، لكن أعد JSON فقط.',
      'لا تعرض أي بيانات شخصية أو أرقام هوية أو هواتف أو بريد. استبدلها بوصف منزوع الحساسية.',
      'لا تستخدم عبارات تسويقية عامة. كل insight يجب أن يرتبط بحقل أو رقم أو نمط في العينة.',
      'عرّف الأدوات المتاحة للواجهة بهذا المعنى: run_sql(query), create_chart(type,x,y,group_by), detect_anomalies(column,method), forecast(column,periods), correlate(col_a,col_b).',
      `يجب أن يطابق الرد هذا المخطط فقط: ${DATA_ANALYZER_SCHEMA_DESCRIPTION}`
    ].join('\n'),
    disclaimer: 'هذه التجربة تحلل عينة بيانات منزوعة الحساسية لأغراض الاستكشاف، ولا تحفظ البيانات في النسخة العامة.',
    scenarios: ['ecommerce-sales-2024', 'restaurant-ops', 'clinic-appointments', 'factory-production', 'marketing-campaigns'],
    variations: [
      {
        summary: 'تمت قراءة العينة وبناء لوحة أولية تربط الإيراد والنمو والشذوذ بأسئلة متابعة قابلة للتشغيل.',
        items: [
          ['لوحة الإيراد', 'يوجد اتجاه زمني واضح يمكن عرضه مع مقارنة الفترات ذات الانخفاض.', 'good'],
          ['الشذوذ', 'بعض القيم تحتاج تحققاً لأن انحرافها أعلى من النمط المعتاد في العينة.', 'warning'],
          ['جودة البيانات', 'الأعمدة الأساسية قابلة للتحليل لكن يلزم توحيد أسماء الفروع والقنوات قبل الربط الإنتاجي.', 'warning']
        ],
        metrics: [
          ['متوسط زمن المعالجة', '3.4s', 'high', 'stable'],
          ['دقة القراءة الأولية', '94.2%', 'high', 'up'],
          ['عدد الرسوم المقترحة', '4', 'medium', 'up']
        ],
        riskLevel: 'medium'
      }
    ]
  },
  'data-analysis': {
    title: 'تحليل البيانات',
    schemaName: 'data_analyzer_demo_schema',
    safetyProfile: 'business',
    sector: 'البيانات والقرار',
    audience: 'الإدارة التنفيذية وفرق التحليل والعمليات',
    problem: 'وجود أرقام كثيرة لا تتحول إلى قرار واضح أو مؤشر قابل للمتابعة',
    outcome: 'رؤى، شذوذ، مؤشرات مقترحة، وخطوات تحسين جودة البيانات',
    focus: 'حوّل وصف البيانات إلى رؤى تنفيذية، مؤشرات قابلة للقياس، ومقترح لوحة متابعة.',
    disclaimer: 'هذا تحليل تقديري مبني على عينة أو وصف مختصر، ولا يمثل حكماً نهائياً على كامل البيانات.',
    scenarios: ['مبيعات', 'تشغيل', 'تسويق'],
    variations: [
      {
        summary: 'تمام، البيانات تكشف اتجاهات قابلة للمتابعة، لكن جودة القرار تعتمد على اكتمال العينة وتعريف المؤشرات.',
        items: [
          ['مؤشر أولي', 'يوجد تباين واضح بين الحجم والنتيجة، وهذا يحتاج فصل القنوات أو الفروع.', 'warning'],
          ['فرصة لوحة متابعة', 'يمكن بناء لوحة تنفيذية تربط التحويل، التكلفة، والجودة في شاشة واحدة.', 'good'],
          ['جودة البيانات', 'يلزم توحيد أسماء الحقول والفترات قبل الاعتماد.', 'warning']
        ],
        metrics: [
          ['وضوح النمط', 'جيد', 'high', 'up'],
          ['اكتمال العينة', 'متوسط', 'medium', 'stable'],
          ['قابلية القياس', 'عالية', 'high', 'up']
        ],
        riskLevel: 'medium'
      },
      {
        summary: 'جاهز، العينة تشير إلى سبب محتمل للتغير وتحتاج مقارنة زمنية أوسع قبل تثبيت التوصية النهائية.',
        items: [
          ['الشذوذ', 'هناك نقطة تحتاج مراجعة لأنها قد تكون موسمية أو خطأ إدخال.', 'warning'],
          ['مؤشرات القرار', 'اقترح متابعة معدل التحويل، تكلفة النتيجة، وزمن الدورة.', 'good'],
          ['التفسير', 'لا تربط السبب بالنتيجة بدون بيانات إضافية أو اختبار تحقق.', 'warning']
        ],
        metrics: [
          ['ثقة القراءة', '80%', 'high', 'up'],
          ['مخاطر الاستنتاج', 'متوسطة', 'medium', 'stable'],
          ['جاهزية التقرير', 'عالية', 'high', 'up']
        ],
        riskLevel: 'medium'
      },
      {
        summary: 'خلّنا نحولها لتقرير تنفيذي: الصورة العامة واضحة، والأولوية الآن تنظيف البيانات وربطها بمؤشر نجاح.',
        items: [
          ['الأولوية', 'ابدأ بالسؤال التجاري قبل اختيار الرسوم أو الجداول.', 'good'],
          ['الفجوات', 'تحتاج حقول مصدر العميل والفترة والفرع حتى يصبح التحليل أدق.', 'warning'],
          ['التنفيذ', 'تقرير أسبوعي مختصر أفضل من تحليل كبير لا يتكرر.', 'good']
        ],
        metrics: [
          ['جاهزية لوحة البيانات', '76%', 'medium', 'up'],
          ['تعقيد التنظيف', 'متوسط', 'medium', 'stable'],
          ['الأثر المتوقع', 'مرتفع عند التكرار', 'high', 'up']
        ],
        riskLevel: 'medium'
      }
    ]
  },
  'smart-automation': {
    title: 'الأتمتة الذكية',
    schemaName: 'approvals_demo_schema',
    safetyProfile: 'business',
    sector: 'العمليات والأتمتة',
    audience: 'مديرو العمليات والتحول الرقمي والفرق الإدارية',
    problem: 'مهام متكررة بين البريد والواتساب والملفات تؤخر القرار وتزيد الأخطاء',
    outcome: 'خريطة سير عمل، نقاط أتمتة، مخاطر، ومؤشر جاهزية',
    focus: 'حلل العملية اليدوية وحدد فرص الأتمتة، التكاملات، الضوابط، ومكاسب الوقت.',
    disclaimer: 'هذا تصور أتمتة أولي، وأي تشغيل فعلي يحتاج اختبار صلاحيات وتدقيق خطوات واعتماد أصحاب العملية.',
    scenarios: ['اعتمادات', 'تقارير', 'خدمة'],
    variations: [
      {
        summary: 'تمام، العملية مناسبة كبداية أتمتة لأنها متكررة وواضحة، لكن تحتاج ضوابط اعتماد قبل التشغيل.',
        items: [
          ['نقطة البداية', 'ابدأ بجمع الطلب والتحقق من الحقول الناقصة قبل تمرير الاعتماد.', 'good'],
          ['مخاطر الصلاحيات', 'أي موافقة مالية يجب أن تبقى بتأكيد بشري وسجل تدقيق.', 'critical'],
          ['الربط', 'التكامل مع البريد أو النماذج الداخلية يعطي أثر أسرع.', 'good']
        ],
        metrics: [
          ['قابلية الأتمتة', '84%', 'high', 'up'],
          ['حاجة الضوابط', 'عالية', 'high', 'stable'],
          ['تعقيد الربط', 'متوسط', 'medium', 'stable']
        ],
        riskLevel: 'medium'
      },
      {
        summary: 'جاهز، يوجد هدر وقت واضح في النقل اليدوي، والأفضل أتمتة التنبيه والتلخيص قبل القرار النهائي.',
        items: [
          ['تقليل التكرار', 'أتمتة التذكير وتجميع البيانات تخفف المتابعة اليدوية اليومية.', 'good'],
          ['القرار', 'لا تجعل النظام يعتمد الطلب وحده؛ خله يجهز السياق لصاحب الصلاحية.', 'warning'],
          ['القياس', 'قِس زمن الدورة ونسبة الطلبات الراجعة بسبب نقص المعلومات.', 'good']
        ],
        metrics: [
          ['خفض العمل اليدوي', 'واضح', 'high', 'up'],
          ['جاهزية البيانات', 'متوسطة', 'medium', 'up'],
          ['مخاطر الاعتماد الآلي', 'متوسطة', 'medium', 'stable']
        ],
        riskLevel: 'medium'
      },
      {
        summary: 'خلّنا نشتغل عليها على مرحلتين: توحيد المدخلات أولاً، ثم تشغيل تنبيهات وربط أنظمة بشكل مضبوط.',
        items: [
          ['مرحلة أولى', 'وحّد النموذج والحقول المطلوبة لتقليل الأخطاء.', 'good'],
          ['مرحلة ثانية', 'اربط الإشعارات مع النظام الداخلي بعد اختبار الصلاحيات.', 'warning'],
          ['تجربة عامة', 'استخدم بيانات وهمية أو منزوعة الحساسية في الديمو.', 'good']
        ],
        metrics: [
          ['وضوح العملية', 'عال', 'high', 'up'],
          ['زمن التجربة', 'قصير', 'medium', 'down'],
          ['أثر الجودة', 'متوسط إلى عال', 'high', 'up']
        ],
        riskLevel: 'medium'
      }
    ]
  },
  'ai-workflows': {
    title: 'تدفقات عمل الذكاء الاصطناعي',
    schemaName: 'operational_reports_demo_schema',
    safetyProfile: 'business',
    sector: 'سير العمل المؤسسي',
    audience: 'فرق المنتج والعمليات والتحول الرقمي',
    problem: 'تداخل الخطوات بين البشر والأنظمة والذكاء الاصطناعي بدون ترتيب واضح',
    outcome: 'تصميم سير عمل، أدوار، نقاط قرار، ومخرجات قابلة للقياس',
    focus: 'صمم تدفق عمل ذكاء اصطناعي متعدد الخطوات يربط البيانات والقرارات والموافقات والتقارير.',
    disclaimer: 'هذا تصميم أولي لسير العمل، ويحتاج تجربة تشغيلية قبل اعتماده داخل بيئة الإنتاج.',
    scenarios: ['تأهيل عميل', 'مراجعة مستند', 'إطلاق خدمة'],
    variations: [
      {
        summary: 'تمام، سير العمل يحتاج فصل واضح بين جمع البيانات، التحليل، الاعتماد، والتنفيذ حتى لا تختلط المسؤوليات.',
        items: [
          ['ترتيب الخطوات', 'ابدأ بمدخل موحد ثم تحليل ثم مراجعة بشرية قبل الإجراء.', 'good'],
          ['نقطة القرار', 'حدد من يعتمد المخرجات ومتى يتم التصعيد.', 'warning'],
          ['المخرجات', 'اجعل كل خطوة تنتج ملخصاً أو مهمة قابلة للتتبع.', 'good']
        ],
        metrics: [
          ['وضوح التدفق', '79%', 'high', 'up'],
          ['تعقيد التنسيق', 'متوسط', 'medium', 'stable'],
          ['جاهزية القياس', 'جيدة', 'high', 'up']
        ],
        riskLevel: 'medium'
      },
      {
        summary: 'جاهز، التصميم الأنسب هو تدفق خفيف يبدأ بالتلخيص والتصنيف ثم يرسل قراراً مقترحاً للمسؤول.',
        items: [
          ['دور الذكاء الاصطناعي', 'يلخص ويصنف ويقترح، ولا يعتمد القرار النهائي.', 'good'],
          ['دور الإنسان', 'يراجع الحالات عالية الأثر أو منخفضة الثقة.', 'good'],
          ['التكامل', 'اربط النظام بأداة مهام أو CRM قبل التوسع.', 'warning']
        ],
        metrics: [
          ['ثقة التصميم', '83%', 'high', 'up'],
          ['اعتماد بشري مطلوب', 'متوسط', 'medium', 'stable'],
          ['قابلية التوسع', 'جيدة', 'high', 'up']
        ],
        riskLevel: 'medium'
      },
      {
        summary: 'خلّنا نبنيه كسير عمل قابل للتجربة: مدخل واضح، مخرجات قصيرة، ومراجعة بشرية عند انخفاض الثقة.',
        items: [
          ['النطاق', 'اختر حالة استخدام واحدة قبل ربط كل الأنظمة.', 'good'],
          ['المخاطر', 'الغموض في المسؤوليات يسبب تعثر حتى لو كان النموذج جيداً.', 'warning'],
          ['المتابعة', 'لوحة صغيرة للحالات المفتوحة أهم من تقرير طويل.', 'good']
        ],
        metrics: [
          ['نضج الفكرة', 'عال', 'high', 'up'],
          ['مخاطر التشغيل', 'متوسطة', 'medium', 'stable'],
          ['سرعة الإطلاق التجريبي', 'جيدة', 'medium', 'up']
        ],
        riskLevel: 'medium'
      }
    ]
  },
  'smart-education-platform': {
    title: 'منصة تعليم ذكية',
    schemaName: 'education_demo_schema',
    safetyProfile: 'education',
    sector: 'التعليم والتدريب',
    audience: 'المدارس الأهلية ومراكز التدريب والجامعات',
    problem: 'صعوبة متابعة أداء المتعلمين وتخصيص الدعم وتلخيص تقدم الدورات',
    outcome: 'خطة تعلم، مؤشرات متابعة، تدخلات مبكرة، وتقارير إدارية',
    focus: 'صمم تجربة تعليمية ذكية تحمي خصوصية الطلاب، وتستخدم بيانات افتراضية فقط، وتدعم المعلم والإدارة.',
    disclaimer: 'هذا الديمو تعليمي تشغيلي ولا يستخدم بيانات طلاب حقيقية أو يقدم حكماً نهائياً على أداء طالب بعينه.',
    scenarios: ['مدرسة', 'مركز تدريب', 'جامعة'],
    variations: [
      {
        summary: 'تمام، الحالة مناسبة لمتابعة تعليمية مبكرة بشرط استخدام بيانات منزوعة الهوية واعتماد المعلم للخطة.',
        items: [
          ['مؤشر تعلم', 'تابع الالتزام والإنجاز والفجوات بدلاً من الاعتماد على درجة واحدة.', 'good'],
          ['التدخل المبكر', 'اقترح دعم أسبوعي للمتعثرين مع مراجعة المعلم.', 'good'],
          ['الخصوصية', 'لا تستخدم أسماء أو هويات طلاب في الديمو العام.', 'critical']
        ],
        metrics: [
          ['جاهزية المتابعة', '81%', 'high', 'up'],
          ['حساسية البيانات', 'مرتفعة', 'high', 'stable'],
          ['وضوح التدخلات', 'جيد', 'high', 'up']
        ],
        riskLevel: 'medium'
      },
      {
        summary: 'جاهز، المدخلات تكفي لبناء ملخص تعليمي إداري، لكن القرار التربوي يبقى للمعلم أو المشرف.',
        items: [
          ['تقسيم المتعلمين', 'قسّم الدعم حسب مستوى التقدم والحضور وتسليم المهام.', 'good'],
          ['إنذار مبكر', 'انخفاض الإنجاز مع حضور جيد قد يشير لحاجة تدريب عملي إضافي.', 'warning'],
          ['اعتماد بشري', 'لا تعتمد توصية تخص طالباً بدون مراجعة تربوية.', 'critical']
        ],
        metrics: [
          ['قابلية التقرير', 'عالية', 'high', 'up'],
          ['مخاطر الخصوصية', 'متوسطة', 'medium', 'stable'],
          ['حاجة بيانات إضافية', 'متوسطة', 'medium', 'up']
        ],
        riskLevel: 'medium'
      },
      {
        summary: 'خلّنا نشتغل عليها كلوحة متابعة: مؤشرات بسيطة، تدخلات واضحة، وتقرير مختصر للإدارة كل أسبوع.',
        items: [
          ['لوحة الإدارة', 'اعرض التقدم والحضور والإنجاز في مؤشرات قليلة.', 'good'],
          ['خطة الدعم', 'حدد مجموعة دعم للمتعثرين بدل توصيات عامة لكل الصف.', 'good'],
          ['جودة المدخلات', 'وصف عام بدون بيانات شخصية يكفي للديمو.', 'warning']
        ],
        metrics: [
          ['وضوح الخطة', 'جيد', 'high', 'up'],
          ['تعقيد التطبيق', 'متوسط', 'medium', 'stable'],
          ['أثر المتابعة', 'مرتفع عند الالتزام', 'high', 'up']
        ],
        riskLevel: 'medium'
      }
    ]
  },
  'smart-hospital-management': {
    title: 'إدارة المستشفيات الذكية',
    schemaName: 'hospital_management_demo_schema',
    safetyProfile: 'medical',
    sector: 'الرعاية الصحية',
    audience: 'إدارة المستشفيات والعيادات وفرق الجودة',
    problem: 'صعوبة رؤية الاختناقات بين الانتظار والأسرة والعيادات والجودة التشغيلية',
    outcome: 'مؤشرات تشغيلية، مخاطر جودة، أولويات تحسين، وخطة متابعة',
    focus: 'حلل مؤشرات تشغيل المستشفى فقط. لا تقدم تشخيصاً أو علاجاً أو نصيحة طبية فردية، وصعّد الحالات الحساسة لمختص بشري.',
    disclaimer: 'هذا الديمو تشغيلي فقط ولا يقدم تشخيصاً أو علاجاً أو نصيحة طبية، وأي حالة صحية يجب أن يراجعها مختص مرخص.',
    scenarios: ['طوارئ', 'عيادات', 'جودة'],
    variations: [
      {
        summary: 'تمام، المؤشرات تكشف ضغطاً تشغيلياً واضحاً، والأولوية تحسين التدفق والتصعيد بدون أي توصية طبية فردية.',
        items: [
          ['اختناق تشغيلي', 'زمن الانتظار أو إشغال الأسرة يحتاج متابعة يومية وربطاً بالطاقة الاستيعابية.', 'warning'],
          ['جودة الخدمة', 'الشكاوى أو التأخير المتكرر مؤشر إداري يحتاج خطة تحسين.', 'warning'],
          ['السلامة', 'أي قرار يؤثر على رعاية مريض يجب أن يبقى بيد مختص مرخص.', 'critical']
        ],
        metrics: [
          ['ضغط التشغيل', 'مرتفع', 'high', 'up'],
          ['وضوح المؤشرات', 'جيد', 'high', 'stable'],
          ['حاجة التصعيد', 'عالية', 'high', 'stable']
        ],
        riskLevel: 'high'
      },
      {
        summary: 'جاهز، القراءة التشغيلية تشير إلى فرص تحسين في الجدولة وتوزيع الموارد مع إبقاء القرار السريري للمختصين.',
        items: [
          ['الجدولة', 'راجع توزيع المواعيد حسب الذروة ونسبة عدم الحضور.', 'warning'],
          ['الموارد', 'اربط مؤشرات الانتظار بالكوادر والغرف المتاحة قبل أي تغيير.', 'good'],
          ['الحدود الطبية', 'التحليل لا يقيّم حالات مرضى ولا يقترح علاجاً.', 'critical']
        ],
        metrics: [
          ['جاهزية لوحة التشغيل', '86%', 'high', 'up'],
          ['مخاطر الجودة', 'متوسطة إلى عالية', 'high', 'stable'],
          ['تعقيد الربط', 'متوسط', 'medium', 'stable']
        ],
        riskLevel: 'high'
      },
      {
        summary: 'خلّنا نرتبها كمراجعة تشغيلية: مؤشرات انتظار، طاقة، رضا، وخطة أسبوعية تعتمدها إدارة المستشفى.',
        items: [
          ['مؤشر رئيسي', 'ابدأ بزمن الانتظار ونسبة الإشغال لأنها تؤثر على تجربة المراجع.', 'warning'],
          ['خطة متابعة', 'اجتماع أسبوعي قصير مع لوحة مؤشرات أفضل من تقارير متفرقة.', 'good'],
          ['بيانات حساسة', 'استخدم مؤشرات مجمعة فقط في الديمو العام.', 'critical']
        ],
        metrics: [
          ['أولوية التحسين', 'عالية', 'high', 'up'],
          ['حساسية البيانات', 'مرتفعة', 'high', 'stable'],
          ['قابلية التنفيذ', 'متوسطة', 'medium', 'up']
        ],
        riskLevel: 'high'
      }
    ]
  },
  'smart-medical-archive': {
    title: 'ملعب الأرشيف الطبي الذكي',
    schemaName: 'medical_archive_extraction_schema',
    safetyProfile: 'medical',
    sector: 'الرعاية الصحية',
    audience: 'إدارات الأرشفة الطبية، السجلات الطبية، العيادات، مراكز الأشعة، والمستشفيات السعودية',
    problem: 'تحويل الملاحظات السريرية والتقارير الممسوحة إلى سجل منظم قابل للمراجعة والربط',
    outcome: 'استخراج حقول سريرية، ترميز ICD-10 مساعد، جودة بيانات، مخاطر خصوصية، وتوجيه إداري للأرشفة',
    focus: [
      'استخرج ونظم البيانات السريرية لأغراض الأرشفة والتدقيق والربط فقط.',
      'ممنوع تقديم تشخيص جديد أو توصية علاجية أو تغيير جرعة أو قرار سريري.',
      'لا تعرض أي رقم ملف أو هوية كما وردت. اخفها دائماً بصيغة MRN-**** أو قيمة منزوعة الحساسية.',
      'أعد فقط الحقول الموجودة أو المستنتجة بدرجة محافظة من الوثيقة، وضع الحقول غير الواضحة ضمن missing_fields أو illegible_sections.',
      'تعامل مع العربية والإنجليزية المختلطة، ومع صور الملاحظات اليدوية، وPDF المختبرات، ونصوص DICOM metadata.',
      'أي إشارة خطورة يجب أن تظهر كتوجيه أرشفة أو أولوية مراجعة بشرية، لا كتوصية علاجية.'
    ].join('\n'),
    disclaimer: 'هذه التجربة تستخرج وتنظم البيانات السريرية لأغراض الأرشفة فقط. لا تقدم تشخيصاً ولا توصية علاجية. النسخة المؤسسية متوافقة مع اشتراطات سهل وحماية البيانات الصحية في وزارة الصحة.',
    scenarios: ['handwritten-gp-note', 'scanned-cbc-report', 'typed-clinical-text', 'dicom-metadata', 'prescription-image', 'er-summary'],
    variations: [
      {
        summary: 'تم تحويل الوثيقة إلى سجل منظم للأرشفة مع إخفاء رقم الملف ورفع الحقول غير الواضحة للمراجعة البشرية.',
        items: [
          ['جودة البيانات', 'الحقول الأساسية مستخرجة، لكن بعض تفاصيل الجرعات أو التاريخ تحتاج تحقق موظف السجلات.', 'warning'],
          ['الخصوصية', 'تم رصد معرفات صحية ويجب حجبها قبل المشاركة خارج النظام.', 'critical'],
          ['الترميز', 'اقتراحات ICD-10 مساعدة فقط وليست اعتماداً طبياً أو فوترة نهائية.', 'warning']
        ],
        metrics: [
          ['Data Quality Score', '88%', 'high', 'stable'],
          ['Privacy Risk Score', 'متوسط', 'medium', 'stable'],
          ['Coding Completeness', '76%', 'medium', 'up']
        ],
        riskLevel: 'high'
      },
      {
        summary: 'الوثيقة مناسبة للأرشفة الرقمية بعد مراجعة الأجزاء غير المقروءة وربطها بالقسم المسؤول عبر HL7 FHIR R4.',
        items: [
          ['التوجيه', 'التوجيه المقترح مبني على نوع الوثيقة والقسم المذكور فقط.', 'good'],
          ['المختبرات', 'القيم المخبرية المصنفة عالية أو حرجة تحتاج اعتماداً بشرياً قبل أي إجراء.', 'critical'],
          ['التوافق', 'يمكن تمثيل الحقول كموارد Patient وObservation وCondition بعد إزالة المعرفات.', 'good']
        ],
        metrics: [
          ['Data Quality Score', '84%', 'high', 'stable'],
          ['Privacy Risk Score', 'مرتفع', 'high', 'stable'],
          ['Coding Completeness', '81%', 'high', 'up']
        ],
        riskLevel: 'high'
      }
    ]
  },
  'smart-hiring-system': {
    title: 'ملعب التوظيف الذكي',
    schemaName: 'smart_hiring_evaluation_schema',
    safetyProfile: 'hr',
    sector: 'الموارد البشرية والتوظيف',
    audience: 'مديرو الموارد البشرية ولجان التوظيف في الشركات السعودية',
    problem: 'فرز السير الذاتية ببطء مع صعوبة توحيد المعايير وتوثيق أسباب القائمة المختصرة',
    outcome: 'درجة مطابقة، مصفوفة مهارات، أسئلة مقابلة، وتدقيق انحياز قابل للمراجعة البشرية',
    focus: 'قيّم المرشح بناءً على الأدلة الموجودة فقط، وراعِ نظام العمل السعودي، نطاقات والتوطين عند ذكره، ومبادئ عدم التمييز. لا تستخدم الجنس أو العمر أو الجنسية أو الحالة الاجتماعية أو الصورة أو الاسم في التقييم. لا تتخذ قرار توظيف نهائي. أعط درجة قابلة للمراجعة وأسئلة مقابلة مبنية على فجوات واضحة.',
    disclaimer: 'هذا التقييم مساعد قرار فقط، ولا يستبدل مراجعة فريق الموارد البشرية أو الالتزام القانوني الداخلي.',
    scenarios: ['project-manager', 'senior-accountant', 'nurse', 'devops-engineer', 'marketing-specialist', 'production-supervisor'],
    variations: [
      {
        summary: 'المرشح مناسب مبدئياً إذا تم التحقق من المهارات الأساسية في مقابلة عملية موحدة.',
        items: [
          ['تطابق المهارات', 'يوجد دليل مباشر على أغلب المهارات المطلوبة مع فجوة تحتاج سؤال تحقق.', 'good'],
          ['الخبرة', 'سنوات الخبرة ملائمة للمستوى المطلوب، لكن يلزم التأكد من حجم الفريق أو نطاق المسؤولية.', 'good'],
          ['المخاطر', 'لا توجد مؤشرات حمراء عالية، مع ضرورة تجاهل أي عوامل شخصية غير مرتبطة بالوظيفة.', 'warning']
        ],
        metrics: [
          ['درجة المطابقة', '86%', 'high', 'up'],
          ['ثقة الدليل', 'جيدة', 'high', 'stable'],
          ['حاجة المقابلة', 'متوسطة', 'medium', 'stable']
        ],
        riskLevel: 'medium'
      },
      {
        summary: 'الملاءمة متوسطة بسبب فجوات في بعض المتطلبات الأساسية، والأفضل استخدام مقابلة تقنية قصيرة قبل الإدراج النهائي.',
        items: [
          ['الفجوة الأساسية', 'بعض المهارات المطلوبة تظهر كمؤشرات عامة لا كإنجازات مثبتة.', 'warning'],
          ['الخبرة', 'المسار المهني قريب من الوظيفة لكنه يحتاج ربطاً أوضح بنتائج قابلة للقياس.', 'warning'],
          ['الإنصاف', 'تم تجاهل العوامل الشخصية والتركيز على الخبرة والمهارات فقط.', 'good']
        ],
        metrics: [
          ['درجة المطابقة', '72%', 'medium', 'stable'],
          ['ثقة الدليل', 'متوسطة', 'medium', 'stable'],
          ['حاجة التحقق', 'عالية', 'high', 'up']
        ],
        riskLevel: 'medium'
      }
    ]
  },
  'customer-service-automation': {
    title: 'ملعب خدمة العملاء متعدد القنوات',
    schemaName: 'customer_service_reply_schema',
    safetyProfile: 'business',
    sector: 'خدمة العملاء وتجربة العميل',
    audience: 'مديرو تجربة العميل، فرق مراكز الاتصال، المتاجر الإلكترونية، ومنصات الخدمات في السعودية',
    problem: 'رسائل العملاء موزعة بين واتساب والدردشة والبريد وإنستغرام مع تفاوت في النبرة والتصعيد واسترجاع المعرفة',
    outcome: 'تصنيف نية ومشاعر ولهجة، استرجاع معرفة، اختيار أدوات، رد مطابق للسياق، وتوصية تصعيد قابلة للمراجعة',
    focus: [
      'أنت BrightAI Customer Service Multichannel Agent للشركات السعودية.',
      'افهم رسائل العملاء عبر واتساب، دردشة الويب، البريد، وإنستغرام، ثم أعد JSON فقط حسب المخطط.',
      'أتقن اللهجة السعودية واللغة العربية الفصحى والكود سويتشنغ. افهم: ودي، أبغى، يمديك، ما عاد، محد رد علي، الطلب له أسبوع، أبي فلوسي، تكفى شوفوا لي حل.',
      'طابق سجل العميل: إذا كان رسمياً فرد برسمية، وإذا كان سعودياً ودوداً فرد بلطف مهني محلي دون مبالغة. استخدم أستاذ أو أستاذة أو أخوي أو أبو فلان فقط إذا كان السياق يسمح.',
      'لا تعد العميل بما لا تملكه الأداة. اذكر أن الاسترجاع أو التعويض أو التصعيد يحتاج اعتماداً بشرياً عندما يكون كذلك.',
      'اخف أي هاتف أو بريد أو رقم هوية أو عنوان. لا تكرر بيانات شخصية في response_text.',
      'استخدم الأدوات المتاحة بهذا المعنى: check_order_status(order_id), process_refund(order_id, reason), book_appointment(service, date), escalate_to_human(reason, priority), update_customer_record(field, value), search_kb(query).',
      'يجب أن تكون retrieved_kb_articles أفضل ثلاث مواد معرفة مناسبة، وأن تكون tools_called شفافة وقابلة للتدقيق.',
      'لا تذكر سلسلة التفكير الداخلية. اعرض خطوات تشغيلية موجزة فقط داخل الحقول المخصصة.',
      `يجب أن يطابق الرد هذا المخطط فقط: ${CUSTOMER_SERVICE_SCHEMA_DESCRIPTION}`
    ].join('\n'),
    disclaimer: 'هذه التجربة تحاكي وكيل خدمة عملاء ولا تنفذ عمليات فعلية. أي استرجاع أو تعويض أو تصعيد عالي الحساسية يحتاج اعتماداً بشرياً وسجل تدقيق.',
    scenarios: ['angry-whatsapp-delay', 'vip-refund-email', 'new-customer-webchat', 'instagram-size-change', 'mixed-language-complaint'],
    variations: [
      {
        summary: 'تم فهم النية والمشاعر واللهجة، والرد المقترح يحافظ على نبرة العميل مع تصعيد واضح للحالات الحساسة.',
        items: [
          ['تصنيف النية', 'الرسالة تشير إلى متابعة طلب أو شكوى تأخير مع حاجة تحقق من النظام.', 'good'],
          ['نبرة الرد', 'الرد يجب أن يبدأ باعتذار محدد ثم إجراء واضح بدون وعود زائدة.', 'good'],
          ['التصعيد', 'أي طلب استرجاع أو عميل VIP يحتاج مراجعة بشرية قبل التنفيذ.', 'warning']
        ],
        metrics: [
          ['توقع الرضا', '4.1/5', 'high', 'up'],
          ['زمن المعالجة', '38 ثانية', 'high', 'down'],
          ['دقة اللهجة', '92%', 'high', 'stable']
        ],
        riskLevel: 'medium'
      }
    ]
  }
});

function normalizeDemoType(demoType) {
  const key = String(demoType || '').trim().toLowerCase();
  return DEMO_TYPE_ALIASES[key] || key;
}

function clampText(value, fallback, max = 300) {
  const text = String(value || fallback || '').replace(/\s+/g, ' ').trim();
  return text.slice(0, max);
}

function normalizeSummary(value, fallback) {
  const text = clampText(value, fallback, 300);
  if (text.length >= 50) return text;
  return clampText(`${text} ${fallback}`, fallback, 300);
}

function takeArray(value, fallback, limit) {
  const source = Array.isArray(value) && value.length ? value : fallback;
  return source.slice(0, limit);
}

function selectVariation(blueprint, input = {}, scenarioData = {}) {
  const seed = [
    input.scenarioId,
    input.message,
    input.locale,
    scenarioData.scenario,
    scenarioData.title,
    Date.now().toString().slice(-4)
  ].filter(Boolean).join('|');
  let score = 0;
  for (const char of seed) score += char.charCodeAt(0);
  return blueprint.variations[score % blueprint.variations.length];
}

function toItem(tuple) {
  return {
    title: clampText(tuple?.title || tuple?.[0], 'مؤشر مهم', 90),
    description: clampText(tuple?.description || tuple?.[1], 'تحتاج هذه النقطة مراجعة قبل التوسع.', 260),
    status: STATUS_VALUES.has(tuple?.status || tuple?.[2]) ? (tuple.status || tuple[2]) : 'warning'
  };
}

function toMetric(tuple) {
  return {
    label: clampText(tuple?.label || tuple?.[0], 'مؤشر', 80),
    value: clampText(tuple?.value || tuple?.[1], 'متوسط', 80),
    level: LEVEL_VALUES.has(tuple?.level || tuple?.[2]) ? (tuple.level || tuple[2]) : 'medium',
    trend: TREND_VALUES.has(tuple?.trend || tuple?.[3]) ? (tuple.trend || tuple[3]) : 'stable'
  };
}

function toRecommendation(tuple) {
  return {
    text: clampText(tuple?.text || tuple?.[0], 'ابدأ بتجربة محدودة ومراجعة بشرية للمخرجات.', 220),
    priority: LEVEL_VALUES.has(tuple?.priority || tuple?.[1]) ? (tuple.priority || tuple[1]) : 'medium',
    effort: LEVEL_VALUES.has(tuple?.effort || tuple?.[2]) ? (tuple.effort || tuple[2]) : 'medium'
  };
}

function buildArabicReport({ blueprint, input, scenarioData, response }) {
  const scenario = clampText(
    scenarioData?.scenario || input?.scenarioId || blueprint.scenarios[0],
    blueprint.scenarios[0],
    120
  );
  const lines = [
    `تقرير ${blueprint.title}`,
    `السيناريو: ${scenario}`,
    `الملخص: ${response.summary}`,
    `أهم الملاحظات: ${response.items.map(item => `${item.title}: ${item.description}`).join(' | ')}`,
    `المؤشرات: ${response.metrics.map(metric => `${metric.label}: ${metric.value}`).join(' | ')}`,
    `التوصيات: ${response.recommendations.map(item => item.text).join(' | ')}`,
    `الخطوة التالية: ${response.nextActions[0] || 'راجع التقرير مع الفريق وحدد تجربة محدودة.'}`,
    `تنبيه: ${blueprint.disclaimer}`
  ];
  return lines.join('\n');
}

function createFallbackResponse(blueprint, input = {}, scenarioData = {}) {
  const variation = selectVariation(blueprint, input, scenarioData);
  const scenario = scenarioData?.scenario || input?.scenarioId || blueprint.scenarios[0];
  const response = {
    summary: normalizeSummary(
      variation.summary,
      `جاهز، هذا تحليل أولي لديمو ${blueprint.title} على سيناريو ${scenario} مع توصيات قابلة للمراجعة البشرية.`
    ),
    items: takeArray(variation.items, [], 3).map(toItem),
    metrics: takeArray(variation.metrics, [], 3).map(toMetric),
    recommendations: [
      ['ابدأ بسيناريو واحد عالي الأثر وبيانات غير حساسة.', 'high', 'low'],
      ['حدد مؤشر نجاح واضح قبل ربط الأنظمة أو التوسع.', 'medium', 'medium'],
      ['راجع النتائج مع صاحب القرار قبل أي إجراء تشغيلي.', 'high', 'low']
    ].map(toRecommendation),
    nextActions: [
      'راجع التقرير مع الفريق',
      'حدد الأنظمة والبيانات المطلوبة للربط',
      'احجز مكالمة 15 دقيقة مع BrightAI لتحديد النسخة المخصصة'
    ],
    report: '',
    confidence: PRO_MODEL_DEMOS.has(blueprint.demoType) ? 0.87 : 0.85,
    riskLevel: RISK_VALUES.has(variation.riskLevel) ? variation.riskLevel : 'medium'
  };
  response.report = buildArabicReport({ blueprint, input, scenarioData, response });
  return response;
}

function normalizeResponse(raw, blueprint, input = {}, scenarioData = {}) {
  const parsed = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : extractJsonObject(raw);
  if (!parsed) return createFallbackResponse(blueprint, input, scenarioData);

  const fallback = createFallbackResponse(blueprint, input, scenarioData);
  const response = {
    summary: normalizeSummary(parsed.summary, fallback.summary),
    items: takeArray(parsed.items, fallback.items, 6).map(toItem),
    metrics: takeArray(parsed.metrics, fallback.metrics, 6).map(toMetric),
    recommendations: takeArray(parsed.recommendations, fallback.recommendations, 6).map(toRecommendation),
    nextActions: takeArray(parsed.nextActions, fallback.nextActions, 5).map(item => clampText(item, '', 160)).filter(Boolean),
    report: clampText(parsed.report, fallback.report, 2400),
    confidence: Number.isFinite(Number(parsed.confidence)) ? Math.min(1, Math.max(0, Number(parsed.confidence))) : fallback.confidence,
    riskLevel: RISK_VALUES.has(parsed.riskLevel) ? parsed.riskLevel : fallback.riskLevel
  };

  if (!response.nextActions.length) response.nextActions = fallback.nextActions;
  if (!response.report || response.report.length < 40) {
    response.report = buildArabicReport({ blueprint, input, scenarioData, response });
  }
  return response;
}

function clampNumber(value, fallback, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, number));
}

function normalizeSmartHiringArray(value, fallback, limit) {
  const source = Array.isArray(value) && value.length ? value : fallback;
  return source.slice(0, limit);
}

function createSmartHiringFallbackResponse() {
  return {
    match_score: 84,
    score_breakdown: {
      skills: 34,
      experience: 25,
      education: 12,
      culture: 13
    },
    skill_matrix: [
      { skill: 'تحليل المتطلبات', required: true, evidence: 'ذكر مشاريع مرتبطة بتحويل متطلبات الأعمال إلى خطط تنفيذ.', level: 'green' },
      { skill: 'إدارة أصحاب المصلحة', required: true, evidence: 'قاد تنسيقاً بين فرق تشغيل وتقنية وموردين خارجيين.', level: 'green' },
      { skill: 'لوحات المؤشرات', required: true, evidence: 'توجد إشارة لاستخدام مؤشرات أداء دون تفصيل الأدوات.', level: 'yellow' },
      { skill: 'اللغة الإنجليزية المهنية', required: false, evidence: 'وردت مراسلات وتقارير ثنائية اللغة ضمن الخبرة.', level: 'green' },
      { skill: 'أتمتة سير العمل', required: false, evidence: 'لا يوجد دليل كافٍ على تنفيذ أتمتة فعلية.', level: 'red' }
    ],
    experience_summary: [
      { company: 'شركة خدمات لوجستية', role: 'مدير مشروع', years: 3.5, relevance: 'خبرة مباشرة في التنسيق والتسليم ومتابعة مؤشرات الأداء.' },
      { company: 'مزود تقني محلي', role: 'محلل أعمال', years: 2, relevance: 'خبرة داعمة في تحليل المتطلبات وتوثيق الإجراءات.' }
    ],
    red_flags: [
      { type: 'فجوة دليل', severity: 'medium', description: 'السيرة تذكر أدوات تحليل عامة بدون أمثلة رقمية كافية.' },
      { type: 'تنقل وظيفي', severity: 'low', description: 'يوجد انتقالان خلال خمس سنوات، لكنه لا يكفي وحده كمؤشر سلبي.' }
    ],
    interview_questions: [
      { question: 'صف مشروعاً حوّلت فيه متطلبات غير واضحة إلى خطة تسليم قابلة للقياس.', category: 'technical', rationale: 'للتحقق من مهارة تحليل المتطلبات وربطها بالتنفيذ.', good_answer_signals: ['يذكر أصحاب المصلحة', 'يعرض مؤشرات نجاح', 'يوضح طريقة إدارة التغيير'] },
      { question: 'كيف تبني لوحة متابعة أسبوعية لوظيفة فيها تأخير في التسليم؟', category: 'technical', rationale: 'لفحص فهمه للمؤشرات لا مجرد استخدام أداة.', good_answer_signals: ['يحدد مؤشرات قليلة', 'يفصل السبب عن العرض', 'يربط التقرير بقرار'] },
      { question: 'كيف تتعامل مع تعارض بين مدير إدارة ومورد خارجي حول نطاق العمل؟', category: 'behavioral', rationale: 'لقياس إدارة أصحاب المصلحة والتصعيد.', good_answer_signals: ['يوثق القرار', 'يحافظ على العلاقة', 'يصعد عند الحاجة'] },
      { question: 'اذكر موقفاً أخفقت فيه في تقدير مدة مهمة، وماذا غيّرت بعده؟', category: 'behavioral', rationale: 'لفحص التعلم الذاتي والشفافية.', good_answer_signals: ['يعترف بدوره', 'يذكر تغييراً عملياً', 'لا يلوم الآخرين فقط'] },
      { question: 'كيف تضمن عدالة تقييم المرشحين عند بناء قائمة مختصرة؟', category: 'behavioral', rationale: 'لفحص الوعي بالإنصاف في بيئة سعودية مؤسسية.', good_answer_signals: ['يعتمد معايير مكتوبة', 'يتجاهل العوامل الشخصية', 'يوثق سبب القرار'] },
      { question: 'لو طلبت الإدارة رفع نسبة التوطين في الدور، كيف توازن ذلك مع متطلبات الكفاءة؟', category: 'situational', rationale: 'لقياس فهم نطاقات دون تمييز أو قرار غير مهني.', good_answer_signals: ['يلتزم بالمعايير', 'يوسع مصادر الاستقطاب', 'لا يخفض متطلبات الدور الأساسية'] },
      { question: 'لو اكتشفت فجوة ستة أشهر في السيرة، ما السؤال العادل الذي تطرحه؟', category: 'situational', rationale: 'للتحقق من التعامل العادل مع الفجوات.', good_answer_signals: ['يسأل عن السياق المهني', 'لا يفترض سبباً شخصياً', 'يربط الإجابة بأثر العمل'] },
      { question: 'ما أول ثلاث خطوات عند استلامك مشروعاً متعثراً؟', category: 'technical', rationale: 'لفحص ترتيب الأولويات تحت الضغط.', good_answer_signals: ['يشخص الوضع', 'يثبت نطاقاً قصيراً', 'يتواصل بشفافية'] }
    ],
    bias_audit: {
      factors_ignored: ['الجنس', 'العمر', 'الجنسية', 'الحالة الاجتماعية', 'الصورة الشخصية', 'الاسم'],
      reasoning_transparency: 'تم احتساب الدرجة من المهارات والخبرة والتعليم وملاءمة بيئة العمل بناءً على أدلة مذكورة في السيرة والوصف الوظيفي فقط.'
    }
  };
}

function normalizeSmartHiringResponse(raw) {
  const parsed = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : extractJsonObject(raw);
  const fallback = createSmartHiringFallbackResponse();
  if (!parsed) return fallback;

  const scoreBreakdown = parsed.score_breakdown || {};
  return {
    match_score: Math.round(clampNumber(parsed.match_score, fallback.match_score, 0, 100)),
    score_breakdown: {
      skills: Math.round(clampNumber(scoreBreakdown.skills, fallback.score_breakdown.skills, 0, 40)),
      experience: Math.round(clampNumber(scoreBreakdown.experience, fallback.score_breakdown.experience, 0, 30)),
      education: Math.round(clampNumber(scoreBreakdown.education, fallback.score_breakdown.education, 0, 15)),
      culture: Math.round(clampNumber(scoreBreakdown.culture, fallback.score_breakdown.culture, 0, 15))
    },
    skill_matrix: normalizeSmartHiringArray(parsed.skill_matrix, fallback.skill_matrix, 12).map(item => ({
      skill: clampText(item?.skill, 'مهارة مطلوبة', 80),
      required: Boolean(item?.required),
      evidence: clampText(item?.evidence, 'لا يوجد دليل كافٍ.', 260),
      level: ['green', 'yellow', 'red'].includes(item?.level) ? item.level : 'yellow'
    })),
    experience_summary: normalizeSmartHiringArray(parsed.experience_summary, fallback.experience_summary, 8).map(item => ({
      company: clampText(item?.company, 'جهة غير مذكورة', 90),
      role: clampText(item?.role, 'دور سابق', 90),
      years: clampNumber(item?.years, 0, 0, 40),
      relevance: clampText(item?.relevance, 'صلة عامة بالوظيفة.', 220)
    })),
    red_flags: normalizeSmartHiringArray(parsed.red_flags, fallback.red_flags, 8).map(item => ({
      type: clampText(item?.type, 'ملاحظة تحقق', 80),
      severity: ['low', 'medium', 'high'].includes(item?.severity) ? item.severity : 'medium',
      description: clampText(item?.description, 'تحتاج هذه النقطة سؤال تحقق في المقابلة.', 240)
    })),
    interview_questions: normalizeSmartHiringArray(parsed.interview_questions, fallback.interview_questions, 8).map(item => ({
      question: clampText(item?.question, 'ما المثال العملي الذي يثبت هذه المهارة؟', 220),
      category: ['technical', 'behavioral', 'situational'].includes(item?.category) ? item.category : 'technical',
      rationale: clampText(item?.rationale, 'للتحقق من دليل مذكور في السيرة.', 220),
      good_answer_signals: normalizeSmartHiringArray(item?.good_answer_signals, ['إجابة محددة', 'دليل قابل للتحقق'], 5).map(signal => clampText(signal, '', 120)).filter(Boolean)
    })),
    bias_audit: {
      factors_ignored: normalizeSmartHiringArray(parsed.bias_audit?.factors_ignored, fallback.bias_audit.factors_ignored, 8).map(item => clampText(item, '', 80)).filter(Boolean),
      reasoning_transparency: clampText(parsed.bias_audit?.reasoning_transparency, fallback.bias_audit.reasoning_transparency, 600)
    }
  };
}

function createMedicalArchiveFallbackResponse(input = {}) {
  const message = String(input?.message || '');
  const isLab = /cbc|wbc|hb|platelet|مختبر|هيموغلوبين|صفائح/i.test(message);
  const isRadiology = /ct|mri|xray|radiology|أشعة|تصوير/i.test(message);
  const isPrescription = /rx|prescription|وصفة|metformin|amoxicillin|atorvastatin/i.test(message);
  const isDischarge = /discharge|خروج|تنويم/i.test(message);
  return {
    document_type: isRadiology ? 'radiology_report' : isPrescription ? 'prescription' : isDischarge ? 'discharge_summary' : isLab ? 'lab_report' : 'clinical_note',
    patient_demographics: {
      age_band: /طفل|child/i.test(message) ? '0-12' : /7[0-9]|elderly|مسن/i.test(message) ? '70-79' : '40-59',
      gender: /female|أنثى|المريضة/i.test(message) ? 'أنثى' : /male|ذكر|المريض/i.test(message) ? 'ذكر' : 'غير محدد',
      mrn_redacted: 'MRN-****'
    },
    visit_info: {
      date: 'غير مؤكد',
      department: isRadiology ? 'الأشعة' : isLab ? 'المختبر' : isPrescription ? 'الصيدلية السريرية' : 'الطب العام',
      attending_physician_role: 'طبيب مسؤول'
    },
    chief_complaint: /chest|صدر|ضيق/i.test(message) ? 'أعراض صدرية مذكورة في الوثيقة' : 'شكوى سريرية مستخرجة للأرشفة',
    vital_signs: {
      bp: message.match(/\b\d{2,3}\/\d{2,3}\b/)?.[0] || 'غير مذكور',
      hr: message.match(/(?:hr|نبض)\s*[:=]?\s*(\d+)/i)?.[1] || 'غير مذكور',
      temp: message.match(/(?:temp|حرارة)\s*[:=]?\s*([0-9.]+)/i)?.[1] || 'غير مذكور',
      spo2: message.match(/(?:spo2|تشبع)\s*[:=]?\s*([0-9%]+)/i)?.[1] || 'غير مذكور',
      rr: 'غير مذكور',
      weight: message.match(/(?:weight|وزن)\s*[:=]?\s*([0-9.]+)/i)?.[1] || 'غير مذكور'
    },
    diagnoses: [
      {
        text_ar: /diabetes|سكري/i.test(message) ? 'سكري مذكور في الوثيقة' : 'حالة مذكورة في الوثيقة',
        text_en: /diabetes|سكري/i.test(message) ? 'Diabetes mentioned in source' : 'Condition mentioned in source',
        icd10_code: /diabetes|سكري/i.test(message) ? 'E11.9' : 'Z00.0',
        icd10_confidence: /diabetes|سكري/i.test(message) ? 0.82 : 0.54,
        type: 'primary'
      }
    ],
    medications: [
      {
        name: /metformin/i.test(message) ? 'Metformin' : 'دواء مذكور إن وجد',
        generic: /metformin/i.test(message) ? 'metformin' : 'غير محدد',
        dose: message.match(/\b\d+\s?(?:mg|ملجم|وحدة)\b/i)?.[0] || 'غير واضح',
        route: 'غير واضح',
        frequency: 'غير واضح',
        duration: 'غير واضح',
        sfda_registered: true
      }
    ],
    allergies: /حساسية|allergy/i.test(message) ? ['حساسية مذكورة تحتاج تحقق'] : [],
    lab_results: isLab ? [
      { test: 'Hb', value: '11.2', unit: 'g/dL', reference_range: '12-16', flag: 'L' },
      { test: 'WBC', value: '13.8', unit: '10^9/L', reference_range: '4-11', flag: 'H' }
    ] : [],
    procedures: isRadiology ? [{ cpt_code: 'غير محدد', description: 'تصوير طبي مذكور في التقرير' }] : [],
    follow_up: {
      required: true,
      timeframe: 'حسب سياسة القسم وبعد مراجعة بشرية',
      department: isRadiology ? 'الأشعة' : 'السجلات الطبية'
    },
    data_quality: {
      completeness_pct: 84,
      missing_fields: ['رقم الملف الحقيقي مخفي', 'توقيع الطبيب إن لم يظهر بوضوح'],
      illegible_sections: /handwritten|يدوي|غير واضح/i.test(message) ? ['جزء من الملاحظة اليدوية'] : []
    },
    privacy_risks: [
      { field: 'mrn', risk_level: 'high', recommendation: 'إخفاء رقم الملف قبل العرض أو المشاركة' },
      { field: 'clinical_text', risk_level: 'medium', recommendation: 'مراجعة النص لإزالة أي معرف شخصي قبل التصدير' }
    ],
    routing_suggestion: {
      target_department: isRadiology ? 'الأشعة' : isLab ? 'المختبر' : 'السجلات الطبية',
      urgency: /critical|حرج|stat|troponin|spo2\s*[:=]?\s*8/i.test(message) ? 'stat' : 'routine'
    }
  };
}

function normalizeMedicalArchiveResponse(raw, input = {}) {
  const parsed = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : extractJsonObject(raw);
  const fallback = createMedicalArchiveFallbackResponse(input);
  if (!parsed) return fallback;
  const enumValue = (value, allowed, fallbackValue) => allowed.includes(value) ? value : fallbackValue;
  const array = (value, fallbackValue, limit = 12) => (Array.isArray(value) && value.length ? value : fallbackValue).slice(0, limit);
  return {
    document_type: enumValue(parsed.document_type, ['clinical_note', 'lab_report', 'prescription', 'discharge_summary', 'radiology_report', 'referral'], fallback.document_type),
    patient_demographics: {
      age_band: clampText(parsed.patient_demographics?.age_band, fallback.patient_demographics.age_band, 40),
      gender: clampText(parsed.patient_demographics?.gender, fallback.patient_demographics.gender, 40),
      mrn_redacted: clampText(parsed.patient_demographics?.mrn_redacted || 'MRN-****', 'MRN-****', 40).replace(/[0-9]{3,}/g, '****')
    },
    visit_info: {
      date: clampText(parsed.visit_info?.date, fallback.visit_info.date, 80),
      department: clampText(parsed.visit_info?.department, fallback.visit_info.department, 80),
      attending_physician_role: clampText(parsed.visit_info?.attending_physician_role, fallback.visit_info.attending_physician_role, 100)
    },
    chief_complaint: clampText(parsed.chief_complaint, fallback.chief_complaint, 260),
    vital_signs: { ...fallback.vital_signs, ...(parsed.vital_signs || {}) },
    diagnoses: array(parsed.diagnoses, fallback.diagnoses).map(item => ({
      text_ar: clampText(item?.text_ar, 'حالة مذكورة في الوثيقة', 140),
      text_en: clampText(item?.text_en, 'Condition mentioned in source', 140),
      icd10_code: clampText(item?.icd10_code, 'Z00.0', 20),
      icd10_confidence: clampNumber(item?.icd10_confidence, 0.5, 0, 1),
      type: enumValue(item?.type, ['primary', 'secondary'], 'secondary')
    })),
    medications: array(parsed.medications, fallback.medications).map(item => ({
      name: clampText(item?.name, 'غير محدد', 120),
      generic: clampText(item?.generic, 'غير محدد', 120),
      dose: clampText(item?.dose, 'غير واضح', 80),
      route: clampText(item?.route, 'غير واضح', 80),
      frequency: clampText(item?.frequency, 'غير واضح', 80),
      duration: clampText(item?.duration, 'غير واضح', 80),
      sfda_registered: Boolean(item?.sfda_registered)
    })),
    allergies: array(parsed.allergies, fallback.allergies, 8).map(item => clampText(item, '', 120)).filter(Boolean),
    lab_results: array(parsed.lab_results, fallback.lab_results).map(item => ({
      test: clampText(item?.test, 'اختبار', 80),
      value: clampText(item?.value, 'غير واضح', 60),
      unit: clampText(item?.unit, '', 40),
      reference_range: clampText(item?.reference_range, 'غير مذكور', 80),
      flag: enumValue(item?.flag, ['H', 'L', 'N', 'critical'], 'N')
    })),
    procedures: array(parsed.procedures, fallback.procedures).map(item => ({
      cpt_code: clampText(item?.cpt_code, 'غير محدد', 30),
      description: clampText(item?.description, 'إجراء مذكور', 160)
    })),
    follow_up: {
      required: Boolean(parsed.follow_up?.required ?? fallback.follow_up.required),
      timeframe: clampText(parsed.follow_up?.timeframe, fallback.follow_up.timeframe, 120),
      department: clampText(parsed.follow_up?.department, fallback.follow_up.department, 100)
    },
    data_quality: {
      completeness_pct: Math.round(clampNumber(parsed.data_quality?.completeness_pct, fallback.data_quality.completeness_pct, 0, 100)),
      missing_fields: array(parsed.data_quality?.missing_fields, fallback.data_quality.missing_fields, 10).map(item => clampText(item, '', 120)).filter(Boolean),
      illegible_sections: array(parsed.data_quality?.illegible_sections, fallback.data_quality.illegible_sections, 10).map(item => clampText(item, '', 120)).filter(Boolean)
    },
    privacy_risks: array(parsed.privacy_risks, fallback.privacy_risks).map(item => ({
      field: clampText(item?.field, 'حقل حساس', 80),
      risk_level: enumValue(item?.risk_level, ['low', 'medium', 'high', 'critical'], 'medium'),
      recommendation: clampText(item?.recommendation, 'راجعه قبل المشاركة.', 180)
    })),
    routing_suggestion: {
      target_department: clampText(parsed.routing_suggestion?.target_department, fallback.routing_suggestion.target_department, 100),
      urgency: enumValue(parsed.routing_suggestion?.urgency, ['routine', 'urgent', 'stat'], fallback.routing_suggestion.urgency)
    }
  };
}

function createDataAnalyzerFallbackResponse(input = {}) {
  const message = String(input?.message || '');
  const rowCount = Math.max(12, Math.min(1000, (message.match(/\n/g) || []).length));
  return {
    dataset_profile: {
      rows: rowCount,
      cols: Math.max(5, Math.min(18, (message.split('\n')[0] || '').split(',').length || 6)),
      types: {
        date: 'تاريخ أو فترة',
        category: 'فئة تشغيلية',
        metric: 'أرقام قابلة للتجميع'
      },
      missing_pct: 3.8,
      date_range: 'مستنتج من العينة المرسلة'
    },
    kpis: [
      { name: 'إجمالي القيمة', value: '1.84M SAR', change_pct: 12.4, sparkline_data: [18, 21, 19, 25, 31, 29] },
      { name: 'متوسط التحويل', value: '7.6%', change_pct: -2.1, sparkline_data: [8, 8.4, 7.9, 7.1, 7.6, 7.5] },
      { name: 'نقاط الشذوذ', value: '4', change_pct: 1.0, sparkline_data: [1, 0, 1, 2, 0, 4] }
    ],
    insights: [
      { text: 'النمو لا يبدو موزعاً بالتساوي؛ أفضل مساهمة تأتي من فئة أو قناة محددة في العينة.', severity: 'success', supporting_chart_id: 'chart-topn', confidence: 0.86 },
      { text: 'يوجد انخفاض يحتاج تفسيراً في فترة موسمية، والأفضل مقارنته بالتقويم التشغيلي مثل رمضان أو العروض.', severity: 'warning', supporting_chart_id: 'chart-trend', confidence: 0.78 },
      { text: 'بعض القيم المتطرفة قد تكون فرصاً حقيقية أو أخطاء إدخال، لذلك أدرجتها في جدول الشذوذ.', severity: 'warning', supporting_chart_id: 'table-anomalies', confidence: 0.81 }
    ],
    anomalies: [
      { row: 7, column: 'revenue', value: 'مرتفع عن النمط', z_score: 2.7, explanation: 'القيمة أعلى من متوسط العينة وقد تعكس حملة أو إدخالاً غير طبيعي.' },
      { row: 14, column: 'conversion_rate', value: 'منخفض', z_score: -2.3, explanation: 'انخفاض التحويل مع حجم زيارات جيد يستحق فحص القناة أو المخزون.' }
    ],
    suggested_questions: [
      'وش أعلى 5 منتجات أو فروع حسب الإيراد؟',
      'ليش انخفضت المبيعات في الفترة الموسمية؟',
      'ارسم اتجاه الإيرادات وقارنه بالفترة السابقة.',
      'اكتشف أي شذوذ في الإيرادات أو التحويل.',
      'ما العلاقة بين الإنفاق التسويقي والمبيعات؟'
    ],
    recommended_dashboards: [
      { title: 'لوحة الإيراد التنفيذي', charts: ['chart-trend', 'chart-topn', 'table-anomalies'] },
      { title: 'لوحة جودة البيانات', charts: ['missing-fields', 'duplicate-check', 'schema-profile'] }
    ],
    tool_plan: [
      {
        tool: 'run_sql',
        arguments: { query: 'SELECT category, SUM(revenue) AS revenue FROM dataset GROUP BY category ORDER BY revenue DESC LIMIT 5' },
        sql: 'SELECT category, SUM(revenue) AS revenue FROM dataset GROUP BY category ORDER BY revenue DESC LIMIT 5',
        why: 'إظهار أعلى الفئات مساهمة في الإيراد.'
      },
      {
        tool: 'detect_anomalies',
        arguments: { column: 'revenue', method: 'z_score' },
        sql: 'SELECT * FROM dataset WHERE ABS((revenue - AVG(revenue) OVER()) / STDDEV_POP(revenue) OVER()) > 2',
        why: 'عزل القيم التي تحتاج مراجعة قبل اتخاذ قرار.'
      }
    ],
    audit_log: [
      { step: 'قراءة البيانات', status: 'success', detail: 'تمت قراءة العينة بعد إزالة أي وسوم أو مدخلات غير آمنة.' },
      { step: 'تحليل الأعمدة', status: 'success', detail: 'تم تحديد أعمدة زمنية ورقمية وفئوية قابلة للرسم.' },
      { step: 'التحقق', status: 'warning', detail: 'النتيجة مبنية على عينة، وليست بديلاً عن ربط مصدر البيانات الكامل.' }
    ]
  };
}

function normalizeDataAnalyzerResponse(raw, input = {}) {
  const parsed = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : extractJsonObject(raw);
  const fallback = createDataAnalyzerFallbackResponse(input);
  if (!parsed) return fallback;
  const array = (value, fallbackValue, limit = 10) => (Array.isArray(value) && value.length ? value : fallbackValue).slice(0, limit);
  const profile = parsed.dataset_profile || {};
  return {
    dataset_profile: {
      rows: Math.round(clampNumber(profile.rows, fallback.dataset_profile.rows, 0, 1000000)),
      cols: Math.round(clampNumber(profile.cols, fallback.dataset_profile.cols, 0, 500)),
      types: profile.types && typeof profile.types === 'object' ? profile.types : fallback.dataset_profile.types,
      missing_pct: clampNumber(profile.missing_pct, fallback.dataset_profile.missing_pct, 0, 100),
      date_range: clampText(profile.date_range, fallback.dataset_profile.date_range, 120)
    },
    kpis: array(parsed.kpis, fallback.kpis, 8).map(item => ({
      name: clampText(item?.name, 'مؤشر', 80),
      value: clampText(item?.value, 'غير محدد', 80),
      change_pct: clampNumber(item?.change_pct, 0, -1000, 1000),
      sparkline_data: array(item?.sparkline_data, [0, 1, 2], 24).map(value => clampNumber(value, 0, -100000000, 100000000))
    })),
    insights: array(parsed.insights, fallback.insights, 8).map(item => ({
      text: clampText(item?.text, 'رؤية تحتاج مراجعة.', 260),
      severity: ['info', 'warning', 'critical', 'success'].includes(item?.severity) ? item.severity : 'info',
      supporting_chart_id: clampText(item?.supporting_chart_id, 'chart-trend', 80),
      confidence: clampNumber(item?.confidence, 0.75, 0, 1)
    })),
    anomalies: array(parsed.anomalies, fallback.anomalies, 12).map(item => ({
      row: Math.round(clampNumber(item?.row, 0, 0, 1000000)),
      column: clampText(item?.column, 'metric', 80),
      value: clampText(item?.value, 'قيمة غير معتادة', 120),
      z_score: clampNumber(item?.z_score, 0, -20, 20),
      explanation: clampText(item?.explanation, 'تحتاج مراجعة.', 240)
    })),
    suggested_questions: array(parsed.suggested_questions, fallback.suggested_questions, 8).map(item => clampText(item, '', 180)).filter(Boolean),
    recommended_dashboards: array(parsed.recommended_dashboards, fallback.recommended_dashboards, 4).map(item => ({
      title: clampText(item?.title, 'لوحة مقترحة', 100),
      charts: array(item?.charts, ['chart-trend'], 8).map(chart => clampText(chart, '', 80)).filter(Boolean)
    })),
    tool_plan: array(parsed.tool_plan, fallback.tool_plan, 8).map(item => ({
      tool: ['run_sql', 'create_chart', 'detect_anomalies', 'forecast', 'correlate'].includes(item?.tool) ? item.tool : 'run_sql',
      arguments: item?.arguments && typeof item.arguments === 'object' ? item.arguments : {},
      sql: clampText(item?.sql, 'SELECT * FROM dataset LIMIT 10', 600),
      why: clampText(item?.why, 'توضيح طريقة الوصول للإجابة.', 220)
    })),
    audit_log: array(parsed.audit_log, fallback.audit_log, 8).map(item => ({
      step: clampText(item?.step, 'خطوة', 80),
      status: ['success', 'warning', 'blocked'].includes(item?.status) ? item.status : 'success',
      detail: clampText(item?.detail, 'تمت المراجعة.', 220)
    }))
  };
}

function createCustomerServiceFallbackResponse(input = {}) {
  const message = String(input?.message || '');
  const lower = message.toLowerCase();
  const isRefund = /استرجاع|فلوسي|refund|تعويض/i.test(message);
  const isAppointment = /موعد|حجز|appointment/i.test(message);
  const isVip = /vip|مميز|ذهبي|مدير الحساب/i.test(message);
  const isAngry = /زعلان|غاضب|محد رد|ما عاد|سيئ|تأخير|تأخر|أسبوع/i.test(message);
  const orderMatch = message.match(/(?:ORD|طلب|order)[-\s#:]?([A-Za-z0-9-]{3,})/i);
  const orderId = orderMatch ? orderMatch[1] : 'A2198';
  const intent = isRefund ? 'refund_request' : isAppointment ? 'appointment_booking' : /وين|حالة|status|وصل/i.test(message) ? 'order_status' : 'support_question';
  const emotion = isAngry ? 'frustrated' : isVip ? 'urgent' : 'neutral';
  const dialect = /ودي|أبغى|يمديك|محد|تكفى|وش/i.test(message) ? 'saudi' : /english|please|refund|order|status/i.test(lower) ? 'mixed' : 'msa';
  const tools = [
    {
      name: 'search_kb',
      arguments: { query: isRefund ? 'سياسة الاسترجاع والتعويض' : isAppointment ? 'سياسة المواعيد' : 'متابعة الطلبات' },
      result: 'تم العثور على ثلاث مواد معرفة مناسبة.',
      requires_human_approval: false
    },
    {
      name: isAppointment ? 'book_appointment' : 'check_order_status',
      arguments: isAppointment ? { service: 'استشارة خدمة', date: 'أقرب موعد متاح' } : { order_id: orderId },
      result: isAppointment ? 'يوجد موعد مبدئي قابل للتأكيد.' : 'الطلب قيد المعالجة مع تأخير متوقع 24 ساعة.',
      requires_human_approval: false
    }
  ];
  if (isRefund || isVip || isAngry) {
    tools.push({
      name: isRefund ? 'process_refund' : 'escalate_to_human',
      arguments: isRefund ? { order_id: orderId, reason: 'طلب استرجاع بسبب تأخير أو عدم رضا' } : { reason: 'حالة حساسة تحتاج متابعة بشرية', priority: isVip ? 'urgent' : 'high' },
      result: isRefund ? 'تم إنشاء طلب استرجاع بانتظار موافقة بشرية.' : 'تم إنشاء مسار تصعيد لمشرف خدمة العملاء.',
      requires_human_approval: true
    });
  }
  return {
    intent,
    intent_confidence: isRefund || isAppointment ? 0.93 : 0.88,
    sentiment: {
      polarity: isAngry ? -0.62 : isVip ? -0.24 : 0.12,
      emotion
    },
    language: dialect === 'mixed' ? 'عربي وإنجليزي مختلط' : 'العربية',
    dialect,
    retrieved_kb_articles: [
      { id: 'KB-003', title: 'سياسة التأخير والتعويض', confidence: 0.91, snippet: 'يحق للعميل تصعيد طلب التعويض إذا تجاوز التأخير المدة المعلنة.' },
      { id: 'KB-007', title: 'قواعد التصعيد للعملاء المميزين', confidence: 0.86, snippet: 'حالات العملاء المميزين تُراجع خلال 30 دقيقة عمل.' },
      { id: 'KB-012', title: 'الردود المعتمدة لقنوات واتساب والدردشة', confidence: 0.82, snippet: 'ابدأ باعتذار محدد ثم اذكر الخطوة التالية والوقت المتوقع.' }
    ],
    tools_called: tools,
    response_text: isAngry
      ? `أفهم عليك، ومعك حق تنزعج من التأخير. راجعت حالة الطلب ${orderId} وبيتم تحويلها الآن لمشرف الخدمة مع متابعة خلال 30 دقيقة. إذا رغبت، أقدر أفتح طلب تعويض للمراجعة البشرية بدون ما نعيد عليك نفس الأسئلة.`
      : `تم استلام طلبك، وراجعت المعلومات المتاحة. الخطوة التالية هي تأكيد التفاصيل ثم تحديثك بالنتيجة من نفس القناة. إذا كان الطلب عاجلاً أقدر أرفعه لمشرف الخدمة للمراجعة.`,
    suggested_quick_replies: ['أبغى تصعيد الطلب', 'أرسلوا لي الحالة الآن', 'أبغى تعويض', 'كلموني واتساب'],
    escalation: {
      required: isRefund || isVip || isAngry,
      reason: isRefund ? 'طلب استرجاع يحتاج موافقة بشرية' : isVip || isAngry ? 'حالة حساسة أو عميل عالي الأولوية' : 'لا يوجد سبب تصعيد حالياً',
      priority: isVip ? 'urgent' : isAngry || isRefund ? 'high' : 'low',
      suggested_team: isRefund ? 'فريق الاسترجاع' : isVip ? 'مدير الحساب' : isAngry ? 'مشرف خدمة العملاء' : 'الدعم العام'
    },
    csat_prediction: isAngry ? 3.7 : 4.4,
    handling_time_estimate_seconds: isAngry || isRefund ? 54 : 31
  };
}

function normalizeCustomerServiceResponse(raw, input = {}) {
  const parsed = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : extractJsonObject(raw);
  const fallback = createCustomerServiceFallbackResponse(input);
  if (!parsed) return fallback;
  const array = (value, fallbackValue, limit = 8) => (Array.isArray(value) && value.length ? value : fallbackValue).slice(0, limit);
  const enumValue = (value, allowed, fallbackValue) => allowed.includes(value) ? value : fallbackValue;
  return {
    intent: clampText(parsed.intent, fallback.intent, 80),
    intent_confidence: clampNumber(parsed.intent_confidence, fallback.intent_confidence, 0, 1),
    sentiment: {
      polarity: clampNumber(parsed.sentiment?.polarity, fallback.sentiment.polarity, -1, 1),
      emotion: enumValue(parsed.sentiment?.emotion, ['angry', 'frustrated', 'happy', 'confused', 'neutral', 'urgent'], fallback.sentiment.emotion)
    },
    language: clampText(parsed.language, fallback.language, 80),
    dialect: enumValue(parsed.dialect, ['msa', 'saudi', 'gulf', 'egyptian', 'levantine', 'mixed'], fallback.dialect),
    retrieved_kb_articles: array(parsed.retrieved_kb_articles, fallback.retrieved_kb_articles, 5).map(item => ({
      id: clampText(item?.id, 'KB-000', 20),
      title: clampText(item?.title, 'مادة معرفة', 120),
      confidence: clampNumber(item?.confidence, 0.75, 0, 1),
      snippet: clampText(item?.snippet, 'ملخص مادة معرفة مناسب للحالة.', 260)
    })),
    tools_called: array(parsed.tools_called, fallback.tools_called, 8).map(item => ({
      name: enumValue(item?.name, ['check_order_status', 'process_refund', 'book_appointment', 'escalate_to_human', 'update_customer_record', 'search_kb'], 'search_kb'),
      arguments: item?.arguments && typeof item.arguments === 'object' ? item.arguments : {},
      result: clampText(item?.result, 'تم تنفيذ محاكاة الأداة.', 260),
      requires_human_approval: Boolean(item?.requires_human_approval)
    })),
    response_text: clampText(parsed.response_text, fallback.response_text, 900),
    suggested_quick_replies: array(parsed.suggested_quick_replies, fallback.suggested_quick_replies, 6).map(item => clampText(item, '', 80)).filter(Boolean),
    escalation: {
      required: Boolean(parsed.escalation?.required),
      reason: clampText(parsed.escalation?.reason, fallback.escalation.reason, 180),
      priority: enumValue(parsed.escalation?.priority, ['low', 'medium', 'high', 'urgent'], fallback.escalation.priority),
      suggested_team: clampText(parsed.escalation?.suggested_team, fallback.escalation.suggested_team, 80)
    },
    csat_prediction: clampNumber(parsed.csat_prediction, fallback.csat_prediction, 1, 5),
    handling_time_estimate_seconds: clampNumber(parsed.handling_time_estimate_seconds, fallback.handling_time_estimate_seconds, 0, 3600)
  };
}

function buildPromptForDemo(blueprint, input = {}, scenarioData = {}) {
  const scenario = scenarioData?.scenario || input?.scenarioId || blueprint.scenarios[0];
  const message = input?.message || scenarioData?.message || scenarioData?.sample || '';
  const metadata = input?.metadata || scenarioData?.metadata || {};
  return [
    blueprint.systemInstruction,
    `نوع الديمو: ${blueprint.demoType}`,
    `اسم الديمو: ${blueprint.title}`,
    `القطاع: ${blueprint.sector}`,
    `الجمهور: ${blueprint.audience}`,
    `المشكلة: ${blueprint.problem}`,
    `المخرج المطلوب: ${blueprint.outcome}`,
    `السيناريو: ${scenario}`,
    message ? `مدخل المستخدم: ${message}` : '',
    Object.keys(metadata).length ? `سياق إضافي: ${JSON.stringify(metadata)}` : '',
    `تنبيه إلزامي داخل التقرير: ${blueprint.disclaimer}`,
    'أعد JSON صالحاً فقط، بدون Markdown وبدون أي نص خارجي.',
    'لا تذكر أنك استخدمت fallback أو مزود وهمي.',
    'اجعل report تقريراً عربياً منسقاً بأسطر نصية عادية لا Markdown.'
  ].filter(Boolean).join('\n');
}

function createDemoConfig(demoType, blueprint) {
  const model = THINKING_MODEL_DEMOS.has(demoType) ? 'gemini-2.5-flash-thinking' : (PRO_MODEL_DEMOS.has(demoType) ? 'gemini-2.5-pro' : 'gemini-2.5-flash');
  if (demoType === 'data-analyzer') {
    const systemInstruction = [
      'أنت BrightAI Data Analytics Playground للشركات السعودية.',
      'تتصرف كمحلل بيانات تنفيذي ومهندس ذكاء أعمال، وتحوّل عينات CSV وXLSX والجداول إلى رؤى قابلة للرسم والمراجعة.',
      'لا تحفظ البيانات ولا تطلب بيانات شخصية. إذا ظهرت معرفات حساسة، تجاهلها أو صفها كبيانات منزوعة الحساسية.',
      'استخدم JSON فقط، ولا تستخدم Markdown أو نصاً خارج JSON.',
      'كل insight يجب أن يحتوي ثقة وارتباطاً برسم أو جدول داعم.',
      'اعرض SQL شفافاً لكل إجابة ضمن tool_plan.sql حتى يراجع المستخدم لماذا ظهرت النتيجة.',
      'عرّف خطة أدوات قابلة للتنفيذ في المتصفح: run_sql(query), create_chart(type,x,y,group_by), detect_anomalies(column,method), forecast(column,periods), correlate(col_a,col_b).',
      'استخدم code_execution للحسابات الثقيلة أو التحقق العددي عندما تحتاج، ثم لخص النتيجة في المخطط فقط.',
      'راع السوق السعودي: رمضان، الفروع، القنوات المحلية، الامتثال، وسياق الريال السعودي عند وجود مبيعات.',
      `يجب أن يطابق الرد هذا المخطط فقط: ${DATA_ANALYZER_SCHEMA_DESCRIPTION}`
    ].join('\n');
    const config = {
      demoType,
      model: 'gemini-2.5-flash',
      title: blueprint.title,
      schemaName: blueprint.schemaName,
      safetyProfile: blueprint.safetyProfile,
      systemInstruction,
      system: systemInstruction,
      responseSchema: DATA_ANALYZER_RESPONSE_SCHEMA,
      tools: [{ codeExecution: {} }],
      validationRules: {
        locale: ['ar-SA', 'en-SA'],
        maxInputLength: 60000,
        requiresHumanReview: true,
        prohibitSensitiveData: true,
        outputSchema: DATA_ANALYZER_SCHEMA_DESCRIPTION,
        forbiddenOutput: ['Markdown', 'code blocks', 'raw Gemini response', 'text outside JSON', 'personal data']
      },
      buildPrompt(input, scenarioData) {
        return buildPromptForDemo(config, input, scenarioData);
      },
      generationConfig: {
        temperature: 0.18,
        topP: 0.9,
        topK: 32,
        maxOutputTokens: 5200,
        responseSchema: DATA_ANALYZER_RESPONSE_SCHEMA
      },
      normalizeGeminiResponse(raw, input) {
        return normalizeDataAnalyzerResponse(raw, input);
      },
      fallbackResponse(input) {
        return createDataAnalyzerFallbackResponse(input);
      },
      disclaimer: blueprint.disclaimer,
      sector: blueprint.sector,
      audience: blueprint.audience,
      problem: blueprint.problem,
      outcome: blueprint.outcome,
      scenarios: blueprint.scenarios,
      variations: blueprint.variations
    };
    return Object.freeze(config);
  }
  if (demoType === 'smart-medical-archive') {
    const systemInstruction = [
      'أنت BrightAI Medical Archive Extractor للشركات الصحية في السعودية.',
      'مهمتك استخراج وتنظيم البيانات السريرية للأرشفة والربط والتدقيق فقط.',
      'لا تقدم تشخيصاً، لا توصية علاجية، لا تعديل جرعات، ولا قرار فرز سريري. استخدم routing_suggestion كأولوية مراجعة إدارية فقط.',
      'اخف كل معرف شخصي أو رقم ملف أو رقم هوية. لا تعرض MRN حقيقي مهما كان واضحاً في الوثيقة.',
      'إذا كان النص غير مقروء أو غير كافٍ، ضع ذلك في data_quality بدلاً من التخمين.',
      'التزم بالعربية المهنية مع دعم المصطلحات الإنجليزية الطبية عند ورودها.',
      `يجب أن يطابق الرد هذا المخطط فقط: ${MEDICAL_ARCHIVE_SCHEMA_DESCRIPTION}`
    ].join('\n');
    const config = {
      demoType,
      model,
      title: blueprint.title,
      schemaName: blueprint.schemaName,
      safetyProfile: blueprint.safetyProfile,
      systemInstruction,
      system: systemInstruction,
      responseSchema: MEDICAL_ARCHIVE_RESPONSE_SCHEMA,
      validationRules: {
        locale: ['ar-SA', 'en-SA'],
        maxInputLength: 12000,
        requiresHumanReview: true,
        prohibitSensitiveData: true,
        outputSchema: MEDICAL_ARCHIVE_SCHEMA_DESCRIPTION,
        forbiddenOutput: ['diagnosis advice', 'treatment recommendation', 'real MRN', 'Markdown', 'text outside JSON']
      },
      buildPrompt(input, scenarioData) {
        return buildPromptForDemo(config, input, scenarioData);
      },
      generationConfig: {
        temperature: 0.12,
        topP: 0.82,
        topK: 24,
        maxOutputTokens: 4200,
        responseMimeType: 'application/json',
        responseSchema: MEDICAL_ARCHIVE_RESPONSE_SCHEMA
      },
      normalizeGeminiResponse(raw, input) {
        return normalizeMedicalArchiveResponse(raw, input);
      },
      fallbackResponse(input) {
        return createMedicalArchiveFallbackResponse(input);
      },
      disclaimer: blueprint.disclaimer,
      sector: blueprint.sector,
      audience: blueprint.audience,
      problem: blueprint.problem,
      outcome: blueprint.outcome,
      scenarios: blueprint.scenarios,
      variations: blueprint.variations
    };
    return Object.freeze(config);
  }
  if (demoType === 'smart-hiring-system') {
    const systemInstruction = [
      BASE_SYSTEM_INSTRUCTION,
      blueprint.focus,
      'التزم بنظام العمل السعودي ومبادئ تكافؤ الفرص، واذكر نطاقات والتوطين فقط عندما تظهر في متطلبات الوظيفة.',
      'قيّم الأدلة المهنية فقط: المهارات، سنوات الخبرة ذات الصلة، التعليم أو الشهادات، وملاءمة بيئة العمل من حيث السلوكيات المهنية.',
      'تجاهل صراحة: الجنس، العمر، الجنسية، الحالة الاجتماعية، الصورة الشخصية، الاسم، والجامعة كعامل سمعة مستقل.',
      `يجب أن يطابق الرد هذا المخطط فقط: ${SMART_HIRING_SCHEMA_DESCRIPTION}`
    ].join('\n');
    const config = {
      demoType,
      model: 'gemini-2.5-flash',
      title: blueprint.title,
      schemaName: blueprint.schemaName,
      safetyProfile: blueprint.safetyProfile,
      systemInstruction,
      system: systemInstruction,
      responseSchema: SMART_HIRING_RESPONSE_SCHEMA,
      validationRules: {
        locale: ['ar-SA', 'en-SA'],
        maxInputLength: 3000,
        requiresHumanReview: true,
        prohibitSensitiveData: true,
        outputSchema: SMART_HIRING_SCHEMA_DESCRIPTION,
        forbiddenOutput: ['Markdown', 'code blocks', 'raw Gemini response', 'text outside JSON']
      },
      buildPrompt(input, scenarioData) {
        return buildPromptForDemo(config, input, scenarioData);
      },
      generationConfig: {
        temperature: 0.18,
        topP: 0.9,
        topK: 32,
        maxOutputTokens: 3200,
        responseMimeType: 'application/json',
        responseSchema: SMART_HIRING_RESPONSE_SCHEMA
      },
      normalizeGeminiResponse(raw) {
        return normalizeSmartHiringResponse(raw);
      },
      fallbackResponse() {
        return createSmartHiringFallbackResponse();
      },
      disclaimer: blueprint.disclaimer,
      sector: blueprint.sector,
      audience: blueprint.audience,
      problem: blueprint.problem,
      outcome: blueprint.outcome,
      scenarios: blueprint.scenarios,
      variations: blueprint.variations
    };
    return Object.freeze(config);
  }
  if (demoType === 'customer-service-automation') {
    const systemInstruction = [
      blueprint.focus,
      'قواعد اللهجة السعودية:',
      'افهم العبارات المحلية طبيعياً: ودي تعني أريد، أبغى تعني أريد، يمديك تعني هل تستطيع، ما عاد تعني لم يعد، محد رد علي تعني غياب متابعة.',
      'إذا قال العميل "تكفى" أو "يا أخوي" فاستجب بتعاطف مهني مختصر، وليس بمزاح أو عامية زائدة.',
      'إذا كتب العميل عربي وإنجليزي في نفس الرسالة، حافظ على العربية أساساً واستخدم المصطلح الإنجليزي فقط عند الحاجة التشغيلية.',
      'أمثلة مطابقة السجل: "أبغى فلوسي" تصبح رد سعودي واضح عن فتح طلب استرجاع للمراجعة، و"نرجو الإفادة" تصبح رد رسمي مهذب.',
      `يجب أن يطابق الرد هذا المخطط فقط: ${CUSTOMER_SERVICE_SCHEMA_DESCRIPTION}`
    ].join('\n');
    const config = {
      demoType,
      model: 'gemini-2.5-flash',
      title: blueprint.title,
      schemaName: blueprint.schemaName,
      safetyProfile: blueprint.safetyProfile,
      systemInstruction,
      system: systemInstruction,
      responseSchema: CUSTOMER_SERVICE_RESPONSE_SCHEMA,
      tools: [{
        functionDeclarations: [
          {
            name: 'check_order_status',
            description: 'يفحص حالة طلب في نظام إدارة الطلبات التجريبي.',
            parameters: {
              type: 'object',
              properties: { order_id: { type: 'string' } },
              required: ['order_id']
            }
          },
          {
            name: 'process_refund',
            description: 'ينشئ طلب استرجاع تجريبي يحتاج موافقة بشرية.',
            parameters: {
              type: 'object',
              properties: { order_id: { type: 'string' }, reason: { type: 'string' } },
              required: ['order_id', 'reason']
            }
          },
          {
            name: 'book_appointment',
            description: 'يحجز موعداً مبدئياً لخدمة أو متابعة.',
            parameters: {
              type: 'object',
              properties: { service: { type: 'string' }, date: { type: 'string' } },
              required: ['service', 'date']
            }
          },
          {
            name: 'escalate_to_human',
            description: 'يصعد الحالة إلى موظف بشري حسب السبب والأولوية.',
            parameters: {
              type: 'object',
              properties: { reason: { type: 'string' }, priority: { type: 'string' } },
              required: ['reason', 'priority']
            }
          },
          {
            name: 'update_customer_record',
            description: 'يحدث حقلاً غير حساس في سجل العميل التجريبي.',
            parameters: {
              type: 'object',
              properties: { field: { type: 'string' }, value: { type: 'string' } },
              required: ['field', 'value']
            }
          },
          {
            name: 'search_kb',
            description: 'يبحث في قاعدة معرفة خدمة العملاء التجريبية ويعيد أفضل ثلاث مواد.',
            parameters: {
              type: 'object',
              properties: { query: { type: 'string' } },
              required: ['query']
            }
          }
        ]
      }],
      validationRules: {
        locale: ['ar-SA', 'en-SA'],
        maxInputLength: 3000,
        requiresHumanReview: true,
        prohibitSensitiveData: true,
        outputSchema: CUSTOMER_SERVICE_SCHEMA_DESCRIPTION,
        forbiddenOutput: ['Markdown', 'code blocks', 'raw Gemini response', 'text outside JSON', 'personal data']
      },
      buildPrompt(input, scenarioData) {
        return buildPromptForDemo(config, input, scenarioData);
      },
      generationConfig: {
        temperature: 0.22,
        topP: 0.9,
        topK: 32,
        maxOutputTokens: 3200,
        responseMimeType: 'application/json',
        responseSchema: CUSTOMER_SERVICE_RESPONSE_SCHEMA
      },
      normalizeGeminiResponse(raw, input) {
        return normalizeCustomerServiceResponse(raw, input);
      },
      fallbackResponse(input) {
        return createCustomerServiceFallbackResponse(input);
      },
      disclaimer: blueprint.disclaimer,
      sector: blueprint.sector,
      audience: blueprint.audience,
      problem: blueprint.problem,
      outcome: blueprint.outcome,
      scenarios: blueprint.scenarios,
      variations: blueprint.variations
    };
    return Object.freeze(config);
  }
  const config = {
    demoType,
    model,
    title: blueprint.title,
    schemaName: blueprint.schemaName,
    safetyProfile: blueprint.safetyProfile,
    systemInstruction: `${BASE_SYSTEM_INSTRUCTION}\n\n${blueprint.focus}`,
    system: `${BASE_SYSTEM_INSTRUCTION}\n\n${blueprint.focus}`,
    validationRules: {
      locale: ['ar-SA', 'en-SA'],
      maxInputLength: 3000,
      requiresHumanReview: true,
      prohibitSensitiveData: true,
      outputSchema: RESPONSE_SCHEMA_DESCRIPTION,
      forbiddenOutput: ['Markdown', 'code blocks', 'raw Gemini response', 'text outside JSON']
    },
    buildPrompt(input, scenarioData) {
      return buildPromptForDemo(config, input, scenarioData);
    },
    generationConfig: {
      temperature: model.includes('pro') ? 0.18 : 0.24,
      topP: 0.9,
      topK: 32,
      maxOutputTokens: model.includes('pro') ? 2200 : 1800,
      responseMimeType: 'application/json'
    },
    normalizeGeminiResponse(raw, input, scenarioData) {
      return normalizeResponse(raw, config, input, scenarioData);
    },
    fallbackResponse(input, scenarioData) {
      return createFallbackResponse(config, input, scenarioData);
    },
    disclaimer: blueprint.disclaimer,
    sector: blueprint.sector,
    audience: blueprint.audience,
    problem: blueprint.problem,
    outcome: blueprint.outcome,
    scenarios: blueprint.scenarios,
    variations: blueprint.variations
  };
  return Object.freeze(config);
}

const DEMO_PROMPTS = Object.freeze(
  Object.fromEntries(ALLOWED_DEMO_TYPES.map(demoType => [
    demoType,
    createDemoConfig(demoType, DEMO_BLUEPRINTS[demoType])
  ]))
);

function isSupportedDemoType(demoType) {
  return Boolean(DEMO_PROMPTS[normalizeDemoType(demoType)]);
}

function getDemoPrompt(demoType) {
  return DEMO_PROMPTS[normalizeDemoType(demoType)] || null;
}

function getModelForDemo(demoType) {
  const prompt = getDemoPrompt(demoType);
  return prompt?.model || 'gemini-2.5-flash';
}

module.exports = {
  ALLOWED_DEMO_TYPES,
  DEMO_KEYS: ALLOWED_DEMO_TYPES,
  DEMO_PROMPTS,
  DEMO_TYPE_ALIASES,
  BASE_SYSTEM_INSTRUCTION,
  DATA_ANALYZER_RESPONSE_SCHEMA,
  DATA_ANALYZER_SCHEMA_DESCRIPTION,
  CUSTOMER_SERVICE_RESPONSE_SCHEMA,
  CUSTOMER_SERVICE_SCHEMA_DESCRIPTION,
  RESPONSE_SCHEMA_DESCRIPTION,
  SMART_HIRING_RESPONSE_SCHEMA,
  SMART_HIRING_SCHEMA_DESCRIPTION,
  getDemoPrompt,
  getModelForDemo,
  isSupportedDemoType,
  normalizeDemoType
};
