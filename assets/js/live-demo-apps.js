(function () {
  "use strict";

  const money = "ريال";
  const schemaBase = {
    type: "object",
    required: ["executive_summary", "readiness_index", "key_insights", "recommended_actions", "risks", "integration_plan", "roi_estimate", "audit_trail", "confidence_level", "disclaimer"],
    properties: {
      executive_summary: { type: "array", items: { type: "string" } },
      readiness_index: { type: "number" },
      key_insights: { type: "array", items: { type: "string" } },
      recommended_actions: { type: "array", items: { type: "string" } },
      risks: { type: "array", items: { type: "string" } },
      integration_plan: { type: "array", items: { type: "string" } },
      roi_estimate: {
        type: "object",
        required: ["summary", "estimated_saving", "payback_period", "assumptions"],
        properties: {
          summary: { type: "string" },
          estimated_saving: { type: "string" },
          payback_period: { type: "string" },
          assumptions: { type: "array", items: { type: "string" } }
        }
      },
      audit_trail: {
        type: "object",
        required: ["analysis_time", "data_type", "model", "confidence", "last_recommended_action"],
        properties: {
          analysis_time: { type: "string" },
          data_type: { type: "string" },
          model: { type: "string" },
          confidence: { type: "string" },
          last_recommended_action: { type: "string" }
        }
      },
      chart: { type: "array", items: { type: "object", properties: { label: { type: "string" }, value: { type: "number" } } } },
      confidence_level: { type: "string" },
      disclaimer: { type: "string" }
    }
  };

  function schema(extra) {
    return {
      ...schemaBase,
      properties: { ...schemaBase.properties, ...(extra || {}) }
    };
  }

  const schemas = {
    recruitmentSchema: schema({
      candidate_fit: { type: "number" },
      unbiased_screening_notes: { type: "array", items: { type: "string" } },
      interview_questions: { type: "array", items: { type: "object", properties: { question: { type: "string" }, purpose: { type: "string" } } } }
    }),
    medicalArchiveSchema: schema({
      extracted_record: { type: "object", properties: { patient_context: { type: "string" }, document_type: { type: "string" }, key_fields: { type: "array", items: { type: "string" } } } },
      quality_flags: { type: "array", items: { type: "string" } }
    }),
    dataPlatformSchema: schema({
      data_quality_score: { type: "number" },
      anomalies: { type: "array", items: { type: "string" } },
      recommended_dashboards: { type: "array", items: { type: "string" } }
    }),
    educationSchema: schema({
      learning_plan: { type: "array", items: { type: "string" } },
      assessment_items: { type: "array", items: { type: "string" } },
      student_privacy_notes: { type: "array", items: { type: "string" } }
    }),
    hospitalOpsSchema: schema({
      operational_kpis: { type: "array", items: { type: "object", properties: { label: { type: "string" }, value: { type: "string" }, status: { type: "string" } } } },
      priority_queue: { type: "array", items: { type: "string" } }
    }),
    documentAutomationSchema: schema({
      extracted_fields: { type: "array", items: { type: "object", properties: { field: { type: "string" }, value: { type: "string" }, confidence: { type: "string" } } } },
      validation_checks: { type: "array", items: { type: "string" } }
    }),
    customerSupportSchema: schema({
      intent: { type: "string" },
      ticket_priority: { type: "string" },
      reply_templates: { type: "array", items: { type: "string" } },
      handoff_rules: { type: "array", items: { type: "string" } }
    }),
    marketingAutomationSchema: schema({
      campaign_plan: { type: "array", items: { type: "string" } },
      channel_mix: { type: "array", items: { type: "object", properties: { channel: { type: "string" }, budget_share: { type: "string" }, reason: { type: "string" } } } },
      conversion_actions: { type: "array", items: { type: "string" } }
    }),
    supplyChainSchema: schema({
      supply_actions: { type: "array", items: { type: "string" } },
      stock_risks: { type: "array", items: { type: "string" } },
      forecast: { type: "array", items: { type: "object", properties: { item: { type: "string" }, demand: { type: "number" } } } }
    })
  };

  const DEMOS = {
    interview: {
      schemaName: "recruitmentSchema",
      domain: "recruitment",
      title: "فرز مرشحين عادل خلال دقائق",
      value: "حوّل السيرة والوصف الوظيفي إلى Score، فجوات، وأسئلة مقابلة بدون استخدام بيانات حساسة.",
      impact: [["تقليل وقت الفرز", "70%"], ["رفع جودة shortlist", "45%"], ["توحيد أسئلة المقابلة", "60%"]],
      quickLabel: "تجربة HR سريعة",
      proLabel: "تقييم مدير التوظيف",
      fields: [{ name: "input", label: "السيرة والوصف الوظيفي", type: "textarea" }],
      samples: [{ label: "محلل بيانات", text: "وصف: محلل بيانات Power BI وSQL. المرشح: 4 سنوات تحليل مبيعات، Python متوسط، خبرة لوحات تنفيذية." }, { label: "دعم عملاء", text: "وصف: مشرف دعم واتساب. المرشح: خبرة 3 سنوات، SLA، إدارة شكاوى وتصعيد." }],
      fallback: { readiness_index: 82, candidate_fit: 82, executive_summary: ["المرشح مناسب للمقابلة الفنية مع فجوة محددة في التكاملات."], key_insights: ["تطابق قوي في الخبرة العملية.", "تحتاج المقابلة لاختبار SQL عملي."], recommended_actions: ["إرسال اختبار قصير.", "طرح 5 أسئلة سلوكية وفنية."], risks: ["لا تعتمد النتيجة كقرار نهائي.", "لا تستخدم العمر أو الجنس أو الجنسية في الفرز."], integration_plan: ["ATS-ready", "Role-based access", "Export PDF/CSV"], roi_estimate: { summary: "توفير وقت فريق HR في الفرز الأولي.", estimated_saving: `8,000 ${money}/شهر`, payback_period: "4-6 أسابيع", assumptions: ["100 سيرة شهرياً", "15 دقيقة فرز يدوي لكل سيرة"] }, audit_trail: {}, confidence_level: "متوسط", disclaimer: "النظام مساعد قرار ولا يصدر قرار توظيف نهائي." }
    },
    "smart-medical-archive": {
      schemaName: "medicalArchiveSchema",
      domain: "medical",
      title: "أرشفة طبية ذكية قابلة للبحث",
      value: "استخرج السجلات، صنّفها، وابحث عنها دلالياً مع ضوابط خصوصية ومراجعة بشرية.",
      impact: [["تقليل وقت البحث", "75%"], ["رفع اكتمال الحقول", "55%"], ["تسريع تجهيز الملف", "65%"]],
      quickLabel: "استخراج سجل سريع",
      proLabel: "جاهزية HIS والأرشفة",
      fields: [{ name: "input", label: "وصف السجل أو نص التقرير", type: "textarea" }],
      samples: [{ label: "سكري", text: "تقرير متابعة سكري: HbA1c 8.2، أدوية Metformin، مراجعة بعد 30 يوم، نقص في رقم الهوية." }, { label: "طوارئ", text: "ملخص طوارئ: ألم صدر، تخطيط طبيعي، Troponin سلبي، توصية متابعة قلب." }],
      fallback: { readiness_index: 78, extracted_record: { patient_context: "متابعة مزمنة", document_type: "تقرير عيادة", key_fields: ["التشخيص", "الأدوية", "موعد المتابعة"] }, executive_summary: ["تم استخراج سجل منظم مع حقول تحتاج مراجعة."], key_insights: ["يوجد نقص في معرّف المريض.", "الأدوية قابلة للفهرسة والبحث."], recommended_actions: ["مراجعة الحقول الحساسة.", "ربط السجل بمعرّف HIS."], risks: ["لا ترفع بيانات حساسة حقيقية في الديمو العام.", "النظام لا يقدم تشخيصاً طبياً."], integration_plan: ["HIS-ready", "FHIR/API-ready", "Role-based access", "Audit trail"], roi_estimate: { summary: "تخفيض زمن تجهيز الملف الطبي.", estimated_saving: `12,000 ${money}/شهر`, payback_period: "6-8 أسابيع", assumptions: ["دفعات أرشفة يومية", "مراجعة بشرية للحقول الحساسة"] }, audit_trail: {}, confidence_level: "متوسط", disclaimer: "تحليل مساعد ولا يستبدل الطبيب أو السجل المعتمد." }
    },
    "data-analyzer": {
      schemaName: "dataPlatformSchema",
      domain: "data",
      title: "تحليل بيانات مؤسسي يخرج بقرار",
      value: "اكتشف جودة البيانات، الأنماط، الشذوذ، واللوحات التنفيذية المقترحة من عينة واحدة.",
      impact: [["تسريع التحليل الأولي", "80%"], ["كشف الشذوذ", "50%"], ["تقليل تقارير يدوية", "60%"]],
      quickLabel: "تحليل سريع",
      proLabel: "تقييم جاهزية منصة بيانات",
      fields: [{ name: "input", label: "عينة CSV أو وصف الأعمدة", type: "textarea" }],
      samples: [{ label: "مبيعات", text: "month,revenue,orders,returns\nJan,320000,940,22\nFeb,410000,1100,19\nMar,390000,1040,45" }, { label: "مخزون", text: "SKU A: طلب 420، مخزون 80، lead time 14 يوم. SKU B: طلب 130، مخزون 400." }],
      fallback: { readiness_index: 86, data_quality_score: 86, anomalies: ["ارتفاع المرتجعات في مارس."], recommended_dashboards: ["لوحة مبيعات تنفيذية", "لوحة جودة الطلبات"], executive_summary: ["العينة تكشف فرصة ربط المبيعات والمرتجعات في لوحة واحدة."], key_insights: ["الإيراد جيد لكن المرتجعات تحتاج تفسير.", "الأعمدة كافية لبداية MVP."], recommended_actions: ["تعريف KPI للمرتجعات.", "إضافة مصدر تكلفة التسويق."], risks: ["نتيجة تقديرية حسب العينة.", "البيانات الناقصة قد تغيّر الاستنتاج."], integration_plan: ["API-ready", "ERP/CRM-ready", "Export CSV/PDF"], roi_estimate: { summary: "تقليل وقت إعداد التقارير الشهرية.", estimated_saving: `10,000 ${money}/شهر`, payback_period: "4 أسابيع", assumptions: ["تقريرين أسبوعياً", "ربط مصدرين بيانات"] }, audit_trail: {}, confidence_level: "عالي", disclaimer: "التحليل مساعد ويحتاج تحقق من مصدر البيانات." }
    },
    "ai-scolecs": {
      schemaName: "educationSchema",
      domain: "education",
      title: "منصة تعليمية ذكية للمعلم والإدارة",
      value: "ولّد خطة، أسئلة، وتوصيات تعلم مع حماية بيانات الطلاب وعدم تحويل AI إلى قرار نهائي.",
      impact: [["تسريع إعداد الدروس", "65%"], ["رفع تخصيص التعلم", "40%"], ["تقليل التصحيح اليدوي", "55%"]],
      quickLabel: "تجربة معلم سريعة",
      proLabel: "جاهزية LMS والإدارة",
      fields: [{ name: "input", label: "المادة، المرحلة، الهدف أو إجابات الطلاب", type: "textarea" }],
      samples: [{ label: "رياضيات", text: "ثالث متوسط، درس المعادلات الخطية، هدف: 5 أسئلة تدرجية وخطة 45 دقيقة." }, { label: "إدارة", text: "صف فيه 28 طالب، متوسط الدرجات 74، يحتاج 6 طلاب دعم في الكسور." }],
      fallback: { readiness_index: 84, learning_plan: ["تمهيد 5 دقائق", "نشاط جماعي", "اختبار قصير"], assessment_items: ["سؤال فهم", "سؤال تطبيق", "سؤال تحدي"], student_privacy_notes: ["لا تعرض أسماء الطلاب في الديمو."], executive_summary: ["التجربة مناسبة لإثبات قيمة التخطيط والتقييم."], key_insights: ["توجد فرصة لتخصيص الدعم.", "التكامل مع LMS يرفع الأثر."], recommended_actions: ["تجربة فصل واحد.", "تعريف صلاحيات المعلم والإدارة."], risks: ["AI لا يستبدل تقييم المعلم.", "حماية بيانات الطلاب إلزامية."], integration_plan: ["LMS-ready", "Role-based access", "Export reports"], roi_estimate: { summary: "توفير وقت إعداد وتصحيح.", estimated_saving: `6 ساعات/معلم شهرياً`, payback_period: "شهر دراسي", assumptions: ["استخدام أسبوعي", "مراجعة المعلم للمخرجات"] }, audit_trail: {}, confidence_level: "متوسط", disclaimer: "مخرجات تعليمية مساعدة وتحتاج اعتماد المعلم." }
    },
    health: {
      schemaName: "hospitalOpsSchema",
      domain: "health",
      title: "إدارة مستشفى ذكية ومؤشرات جودة",
      value: "حوّل مؤشرات التشغيل إلى أولويات واضحة لقائمة انتظار، جودة، واستغلال موارد.",
      impact: [["تقليل انتظار المريض", "35%"], ["رفع وضوح الجودة", "50%"], ["تسريع التقرير التشغيلي", "70%"]],
      quickLabel: "قراءة تشغيلية سريعة",
      proLabel: "جاهزية HIS وBI",
      fields: [{ name: "input", label: "مؤشرات المستشفى أو السيناريو", type: "textarea" }],
      samples: [{ label: "طوارئ", text: "طوارئ: 180 مراجع يومياً، متوسط انتظار 72 دقيقة، 14 سرير مراقبة، نقص تمريض في المساء." }, { label: "جودة", text: "إشغال 88%، إعادة دخول 6%، رضا 78، تأخر خروج المرضى 90 دقيقة." }],
      fallback: { readiness_index: 80, operational_kpis: [{ label: "الانتظار", value: "72 دقيقة", status: "مرتفع" }], priority_queue: ["تحسين فرز الطوارئ", "تعديل جدولة التمريض"], executive_summary: ["توجد فرصة واضحة لتقليل الانتظار عبر جدولة وفرز أفضل."], key_insights: ["ضغط المساء هو العامل الأعلى.", "الخروج المتأخر يؤثر على الأسرة."], recommended_actions: ["تشغيل dashboard طوارئ.", "إعادة توزيع المناوبات."], risks: ["ليست توصية طبية.", "تحتاج اعتماد إدارة الجودة."], integration_plan: ["HIS-ready", "BI-ready", "Role-based access"], roi_estimate: { summary: "رفع الإنتاجية وتقليل اختناق الموارد.", estimated_saving: `15,000 ${money}/شهر`, payback_period: "8 أسابيع", assumptions: ["بيانات تشغيلية يومية", "قياس قبل/بعد"] }, audit_trail: {}, confidence_level: "متوسط", disclaimer: "النظام لا يقدم تشخيصاً ولا يستبدل البروتوكولات الطبية." }
    },
    ocr: {
      schemaName: "documentAutomationSchema",
      domain: "documents",
      title: "OCR وأتمتة وثائق جاهزة للربط",
      value: "استخرج الحقول، تحقق من النواقص، وجهّز JSON قابل للربط مع ERP أو الأرشفة.",
      impact: [["تقليل الإدخال اليدوي", "75%"], ["رفع سرعة المطابقة", "65%"], ["تقليل أخطاء الحقول", "60%"]],
      quickLabel: "استخراج مستند سريع",
      proLabel: "قواعد تحقق وتكامل",
      fields: [{ name: "input", label: "نوع المستند أو نصه", type: "textarea" }],
      samples: [{ label: "فاتورة", text: "فاتورة ضريبية: المورد شركة النور، الإجمالي 18,400، VAT 15%، رقم PO ناقص." }, { label: "عقد", text: "عقد توريد لمدة 12 شهر، غرامة تأخير 2%، دفع على 3 دفعات." }],
      fallback: { readiness_index: 88, extracted_fields: [{ field: "الإجمالي", value: "18,400", confidence: "عالي" }], validation_checks: ["رقم PO ناقص", "ضريبة القيمة مذكورة"], executive_summary: ["المستند قابل للأتمتة مع مراجعة حقل ناقص."], key_insights: ["الحقول المالية واضحة.", "يوجد نقص يمنع الاعتماد الآلي الكامل."], recommended_actions: ["إضافة قاعدة تحقق PO.", "ربط النتائج بنظام ERP."], risks: ["الحقول منخفضة الثقة تحتاج مراجعة."], integration_plan: ["ERP-ready", "Archive-ready", "Export JSON/PDF"], roi_estimate: { summary: "تقليل إدخال الفواتير يدوياً.", estimated_saving: `9,000 ${money}/شهر`, payback_period: "5 أسابيع", assumptions: ["300 مستند شهرياً", "مراجعة بشرية للناقص"] }, audit_trail: {}, confidence_level: "عالي", disclaimer: "النتيجة مساعدة وتحتاج تحقق للوثائق الرسمية." }
    },
    brightsupport: {
      schemaName: "customerSupportSchema",
      domain: "support",
      title: "خدمة عملاء ذكية بدون وعود غير مؤكدة",
      value: "صنّف نية العميل، أولوية التذكرة، الرد المناسب، ومتى يجب التصعيد البشري.",
      impact: [["رفع سرعة الرد", "85%"], ["تقليل التذاكر المتكررة", "45%"], ["تحسين SLA", "50%"]],
      quickLabel: "محادثة دعم سريعة",
      proLabel: "تصميم Bot وربط CRM",
      fields: [{ name: "input", label: "سيناريو العميل أو سياسة الخدمة", type: "textarea" }],
      samples: [{ label: "شحن", text: "عميل يسأل عن شحنة متأخرة يومين ورقم الطلب غير واضح." }, { label: "استرجاع", text: "عميل غاضب يريد استرجاع مبلغ وطلب تصعيد فوري." }],
      fallback: { readiness_index: 87, intent: "استفسار شحن", ticket_priority: "متوسط", reply_templates: ["أفهم طلبك، أرسل رقم الطلب وسأتحقق من الحالة."], handoff_rules: ["تصعيد عند الغضب أو طلب تعويض"], executive_summary: ["السيناريو مناسب لأتمتة الرد الأولي مع تصعيد واضح."], key_insights: ["نقص رقم الطلب يمنع إغلاق التذكرة.", "النبرة تحتاج تهدئة لا وعود."], recommended_actions: ["طلب رقم الطلب.", "عرض قناة تصعيد."], risks: ["لا تعد بتعويض قبل التحقق.", "اربط الردود بسياسات الشركة."], integration_plan: ["CRM-ready", "WhatsApp-ready", "Role-based access"], roi_estimate: { summary: "تقليل زمن الرد الأول.", estimated_saving: `11,000 ${money}/شهر`, payback_period: "4-6 أسابيع", assumptions: ["1,200 محادثة شهرياً", "تصعيد الحالات الحساسة"] }, audit_trail: {}, confidence_level: "عالي", disclaimer: "الردود مساعدة ولا تقدم وعوداً غير معتمدة." }
    },
    marketing: {
      schemaName: "marketingAutomationSchema",
      domain: "marketing",
      title: "تسويق ذكي يربط الحملة بالعائد",
      value: "حوّل المنتج والجمهور والميزانية إلى خطة قنوات، رسائل، وتجارب تحويل قابلة للقياس.",
      impact: [["تسريع إطلاق الحملات", "70%"], ["تحسين تتبع ROAS", "45%"], ["تقليل العمل اليدوي", "55%"]],
      quickLabel: "حملة سريعة",
      proLabel: "أتمتة Lifecycle وCRM",
      fields: [{ name: "input", label: "المنتج، الجمهور، الميزانية، هدف الحملة", type: "textarea" }],
      samples: [{ label: "SaaS", text: "منتج SaaS B2B، جمهور مدراء عمليات، ميزانية 25 ألف، هدف حجز ديمو." }, { label: "تجزئة", text: "متجر عطور، جمهور نساء 25-40، هدف رفع المبيعات في رمضان." }],
      fallback: { readiness_index: 83, campaign_plan: ["إعلان قيمة مباشر", "Retargeting لزوار الصفحة", "رسائل واتساب للمهتمين"], channel_mix: [{ channel: "Google", budget_share: "45%", reason: "نية بحث عالية" }], conversion_actions: ["CTA ديمو", "Lead form قصير"], executive_summary: ["الخطة تربط الرسائل بمؤشر حجز الديمو."], key_insights: ["الجمهور التنفيذي يحتاج ROI لا وصف تقني.", "الواتساب مناسب للمتابعة."], recommended_actions: ["إطلاق A/B test.", "ربط GA4 وCRM."], risks: ["الأرقام تقديرية حسب البيانات.", "تحتاج موافقات الرسائل."], integration_plan: ["CRM-ready", "GA4-ready", "WhatsApp-ready"], roi_estimate: { summary: "رفع كفاءة إدارة الحملات.", estimated_saving: `7,500 ${money}/شهر`, payback_period: "4 أسابيع", assumptions: ["3 قنوات", "تتبع تحويلات صحيح"] }, audit_trail: {}, confidence_level: "متوسط", disclaimer: "تقديرات التسويق تعتمد على جودة البيانات والميزانية." }
    },
    supply: {
      schemaName: "supplyChainSchema",
      domain: "supply_chain",
      title: "تحسين سلسلة التوريد من الطلب إلى المخزون",
      value: "استخرج مخاطر النفاد، توقع الطلب، وخطة إعادة الطلب من بيانات بسيطة.",
      impact: [["تقليل نفاد المخزون", "40%"], ["رفع دقة التخطيط", "50%"], ["تقليل رأس المال الراكد", "30%"]],
      quickLabel: "تحليل مخزون سريع",
      proLabel: "جاهزية ERP وWMS",
      fields: [{ name: "input", label: "المنتجات، الطلب، المخزون، lead time", type: "textarea" }],
      samples: [{ label: "مستودع", text: "SKU A طلب شهري 900، مخزون 120، lead time 21 يوم. SKU B طلب 200، مخزون 700." }, { label: "توريد", text: "مورد رئيسي يتأخر 10 أيام، مبيعات موسمية مرتفعة، تكلفة تخزين عالية." }],
      fallback: { readiness_index: 81, supply_actions: ["رفع حد إعادة الطلب لـ SKU A", "تخفيض شراء SKU B مؤقتاً"], stock_risks: ["نفاد SKU A خلال أسبوع"], forecast: [{ item: "SKU A", demand: 900 }], executive_summary: ["يوجد خطر نفاد واضح في صنف عالي الطلب."], key_insights: ["Lead time طويل مقارنة بالمخزون.", "يوجد رأس مال راكد في SKU B."], recommended_actions: ["تفعيل reorder point.", "مراجعة المورد البديل."], risks: ["التوقع تقديري حسب العينة.", "الموسمية قد تغير الطلب."], integration_plan: ["ERP-ready", "WMS-ready", "Export CSV/API"], roi_estimate: { summary: "تقليل خسائر النفاد والتخزين الزائد.", estimated_saving: `18,000 ${money}/شهر`, payback_period: "6-8 أسابيع", assumptions: ["ربط مبيعات ومخزون", "مراجعة شهرية للتوقع"] }, audit_trail: {}, confidence_level: "متوسط", disclaimer: "التوصيات تشغيلية تقديرية وتحتاج اعتماد سلسلة الإمداد." }
    }
  };

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char]));
  }

  function getCurrentDemoId() {
    const path = location.pathname.toLowerCase();
    if (path.includes("/interview/")) return "interview";
    if (path.includes("/smart-medical-archive/")) return "smart-medical-archive";
    if (path.includes("/try/data-analyzer/")) return "data-analyzer";
    if (path.includes("/ai-scolecs/")) return "ai-scolecs";
    if (path.includes("/health/")) return "health";
    if (path.includes("/demo/ocr-demo/")) return "ocr";
    if (path.includes("/ai-bots/brightsupport/")) return "brightsupport";
    if (path.includes("/services/marketing-automation") || path.includes("/services/marketing-agent")) return "marketing";
    if (path.includes("/services/supply-chain-optimization")) return "supply";
    return "";
  }

  function withAudit(data, config) {
    const fallback = config.fallback || {};
    const merged = { ...fallback, ...(data || {}) };
    merged.audit_trail = {
      analysis_time: new Date().toLocaleString("ar-SA"),
      data_type: config.domain,
      model: "gemini-2.5-flash عبر /api/ai/chat/completions",
      confidence: merged.confidence_level || "متوسط",
      last_recommended_action: (merged.recommended_actions || [])[0] || "مراجعة النتيجة مع فريق Bright AI",
      ...(merged.audit_trail || {})
    };
    return merged;
  }

  function renderShell(id, config, engine) {
    const section = document.createElement("section");
    section.className = "bai-live-demo bai-sales-demo";
    section.id = "live-ai-demo";
    section.innerHTML = `
      <div class="bai-demo-head bai-sales-hero">
        <div>
          <span class="bai-demo-eyebrow">Sales-ready AI Demo | Gemini API Backend</span>
          <h2>${escapeHtml(config.title)}</h2>
          <p>${escapeHtml(config.value)} <strong>الأرقام تقديرية حسب بيانات العميل وليست وعداً مطلقاً.</strong></p>
          <div class="bai-impact-row">${config.impact.map(([label, value]) => `<span><strong>${escapeHtml(value)}</strong>${escapeHtml(label)}</span>`).join("")}</div>
        </div>
        <span class="bai-demo-limit" data-demo-limit>متبقي ${engine.getRemainingUses()} من 3 محاولات</span>
      </div>
      <ol class="bai-demo-stepper" aria-label="خطوات التجربة">
        <li>اختر السيناريو</li><li>أدخل البيانات أو استخدم عينة</li><li>شغّل AI</li><li>شاهد التقرير</li><li>اطلب الربط</li>
      </ol>
      <div class="bai-demo-grid">
        <form class="bai-demo-form" data-demo-form>
          <div class="bai-mode-switch" role="tablist">
            <button type="button" class="active" data-mode="quick">${escapeHtml(config.quickLabel)}</button>
            <button type="button" data-mode="pro">${escapeHtml(config.proLabel)}</button>
          </div>
          <div class="bai-sample-row">${config.samples.map((sample, index) => `<button type="button" data-sample-index="${index}">${escapeHtml(sample.label)}</button>`).join("")}</div>
          ${config.fields.map((field) => `<div class="bai-demo-field"><label for="bai-${field.name}">${escapeHtml(field.label)}</label><textarea id="bai-${field.name}" name="${escapeHtml(field.name)}" rows="7" placeholder="اكتب بيانات مختصرة أو اختر عينة جاهزة..."></textarea></div>`).join("")}
          <div class="bai-trust-strip">
            <span>خصوصية الديمو</span><span>Audit Trail</span><span>صلاحيات وصول</span><span>API-ready</span>
          </div>
          <p class="bai-privacy-note">لا يتم استخدام بياناتك إلا لتوليد النتيجة التجريبية. لا ترفع بيانات حساسة حقيقية في النسخة التجريبية العامة.</p>
          <div class="bai-demo-actions">
            <button class="bai-demo-btn bai-demo-btn-primary" type="submit">شغّل الذكاء الاصطناعي</button>
            <a class="bai-demo-btn bai-demo-btn-whatsapp" data-demo-cta href="${engine.createWhatsAppUrl(config.title)}" target="_blank" rel="noopener">أرسل النتيجة عبر واتساب</a>
          </div>
        </form>
        <div class="bai-demo-output" data-demo-output>${emptyState(config)}</div>
      </div>
    `;
    return section;
  }

  function emptyState(config) {
    return `<div class="bai-demo-empty"><strong>ستظهر النتيجة هنا كـ Dashboard لا كـ JSON خام.</strong><p>النتيجة تشمل Executive Summary، Readiness Index، Insights، Actions، Risks، Integration Plan، ROI Estimate، وCTA واضح.</p><small>${escapeHtml(config.fallback.disclaimer || "مخرجات AI مساعدة وتحتاج مراجعة بشرية.")}</small></div>`;
  }

  function loadingMarkup() {
    return `<div class="bai-demo-loading" aria-live="polite"><div class="bai-demo-spinner"></div><strong>جارٍ توليد تقرير منظم...</strong><span class="bai-demo-skeleton"></span><span class="bai-demo-skeleton"></span><span class="bai-demo-skeleton" style="width:72%"></span></div>`;
  }

  function promptFor(config, values, mode) {
    return `أنت Principal AI Product Engineer في Bright AI. أنشئ تقرير ديمو تجاري عربي سعودي لصاحب قرار.
المجال: ${config.domain}
الوضع: ${mode === "pro" ? "احترافي لصاحب القرار أو المدير التقني" : "سريع للعميل غير التقني"}
البيانات:
${values.input || ""}
التزم بالـ JSON Schema فقط. لا تستخدم بيانات حساسة كالعمر أو الجنس أو الجنسية في التوظيف. في الصحة والطب لا تقدم تشخيصاً. اجعل ROI تقديرياً حسب بيانات العميل، وضع خطة تكامل وثقة ومخاطر واضحة.`;
  }

  function list(items) {
    return `<ul>${(items || []).slice(0, 6).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
  }

  function renderReport(data, config, engine) {
    const score = Math.max(0, Math.min(100, Number(data.readiness_index || data.candidate_fit || data.data_quality_score || 0)));
    return `<div class="bai-demo-report">
      <div class="bai-result-top">
        <div><span class="bai-demo-eyebrow">تقرير تنفيذي قابل للمشاركة</span><h3>${escapeHtml(config.title)}</h3></div>
        <div class="bai-score"><strong>${score || 78}</strong><span>Readiness Index</span></div>
      </div>
      <section class="bai-demo-report-section"><h4>Executive Summary</h4>${list(data.executive_summary)}</section>
      ${renderChart(data.chart || data.forecast)}
      <div class="bai-report-columns">
        <section class="bai-demo-report-section"><h4>Key Insights</h4>${list(data.key_insights)}</section>
        <section class="bai-demo-report-section"><h4>Recommended Actions</h4>${list(data.recommended_actions)}</section>
        <section class="bai-demo-report-section"><h4>Risks</h4>${list(data.risks)}</section>
        <section class="bai-demo-report-section"><h4>Integration Readiness</h4>${list(data.integration_plan)}</section>
      </div>
      <section class="bai-demo-report-section"><h4>ROI Estimate</h4><p>${escapeHtml(data.roi_estimate?.summary)}</p><div class="bai-demo-kpis"><div class="bai-demo-kpi"><span>توفير تقديري</span><strong>${escapeHtml(data.roi_estimate?.estimated_saving)}</strong></div><div class="bai-demo-kpi"><span>Payback</span><strong>${escapeHtml(data.roi_estimate?.payback_period)}</strong></div><div class="bai-demo-kpi"><span>الثقة</span><strong>${escapeHtml(data.confidence_level)}</strong></div></div>${list(data.roi_estimate?.assumptions)}</section>
      <section class="bai-demo-report-section"><h4>Audit Trail</h4><div class="bai-audit-grid">${Object.entries(data.audit_trail || {}).map(([k, v]) => `<span><small>${escapeHtml(k)}</small><strong>${escapeHtml(v)}</strong></span>`).join("")}</div></section>
      <p class="bai-privacy-note">${escapeHtml(data.disclaimer || config.fallback.disclaimer)}</p>
      <div class="bai-demo-actions"><button class="bai-demo-btn bai-demo-btn-soft" type="button" data-print-report>Download Report PDF</button><a class="bai-demo-btn bai-demo-btn-whatsapp" href="${engine.createWhatsAppUrl((data.executive_summary || [config.title])[0])}" target="_blank" rel="noopener" data-demo-whatsapp>أرسل النتيجة عبر واتساب</a><a class="bai-demo-btn bai-demo-btn-primary" href="/contact/" data-lead-submit>احجز ديمو أو اطلب عرض سعر</a></div>
    </div>`;
  }

  function renderChart(chart) {
    if (!Array.isArray(chart) || !chart.length) return "";
    const values = chart.map((item) => Number(item.value || item.demand || 0));
    const max = Math.max(...values, 1);
    return `<section class="bai-demo-report-section"><h4>Chart Snapshot</h4><div class="bai-demo-bars">${chart.slice(0, 6).map((item) => {
      const value = Number(item.value || item.demand || 0);
      const width = Math.max(8, Math.round((value / max) * 100));
      return `<div class="bai-demo-bar"><span>${escapeHtml(item.label || item.item || "مؤشر")}</span><span class="bai-demo-bar-track"><span class="bai-demo-bar-fill" style="width:${width}%"></span></span><strong>${escapeHtml(value)}</strong></div>`;
    }).join("")}</div></section>`;
  }

  function attachHandlers(section, id, config, engine) {
    const form = section.querySelector("[data-demo-form]");
    const output = section.querySelector("[data-demo-output]");
    const input = form.querySelector("textarea[name='input']");
    const limit = section.querySelector("[data-demo-limit]");
    let mode = "quick";

    section.querySelectorAll("[data-mode]").forEach((btn) => {
      btn.addEventListener("click", () => {
        mode = btn.dataset.mode;
        section.querySelectorAll("[data-mode]").forEach((item) => item.classList.toggle("active", item === btn));
      });
    });

    section.querySelectorAll("[data-sample-index]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const sample = config.samples[Number(btn.dataset.sampleIndex)];
        input.value = sample?.text || "";
        engine.trackUsage("sample_loaded");
      });
    });

    section.querySelector("[data-demo-cta]")?.addEventListener("click", () => engine.trackUsage("whatsapp_clicked"));

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      output.innerHTML = loadingMarkup();
      const result = await engine.generate({
        prompt: promptFor(config, { input: input.value }, mode),
        schema: schemas[config.schemaName],
        schemaName: config.schemaName,
        domain: config.domain,
        fallback: config.fallback,
        temperature: 0.2
      });
      limit.textContent = `متبقي ${engine.getRemainingUses()} من 3 محاولات`;
      const safe = withAudit(result, config);
      output.innerHTML = renderReport(safe, config, engine);
      output.querySelector("[data-print-report]")?.addEventListener("click", () => {
        engine.trackUsage("report_downloaded");
        window.BrightAIDemoUtils.printReport(`Bright AI Demo - ${id}`, output.querySelector(".bai-demo-report").innerHTML);
      });
      output.querySelector("[data-demo-whatsapp]")?.addEventListener("click", () => engine.trackUsage("whatsapp_clicked"));
      output.querySelector("[data-lead-submit]")?.addEventListener("click", () => engine.trackUsage("lead_submitted"));
    });
  }

  function mount() {
    const id = getCurrentDemoId();
    const config = DEMOS[id];
    if (!config || document.getElementById("live-ai-demo") || !window.GeminiDemoEngine) return;
    const engine = new window.GeminiDemoEngine({ demoId: id, timeoutMs: 14000 });
    const section = renderShell(id, config, engine);
    const target = document.querySelector("main") || document.body;
    const anchor = target.querySelector("section:nth-of-type(1)") || target.firstElementChild;
    if (anchor?.parentNode) anchor.parentNode.insertBefore(section, anchor.nextSibling);
    else target.appendChild(section);
    attachHandlers(section, id, config, engine);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount);
  else mount();
})();
