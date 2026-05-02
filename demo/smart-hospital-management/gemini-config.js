window.HospitalGeminiConfig = {
  endpoint: "./api.php",
  defaultModel: "gemini-2.5-flash",
  reasoningModel: "gemini-2.5-flash-thinking",
  responseSchema: {
    type: "object",
    properties: {
      decision_summary: { type: "string" },
      recommended_actions: {
        type: "array",
        items: {
          type: "object",
          properties: {
            action: { type: "string" },
            impact_estimate: { type: "string" },
            effort: { type: "string", enum: ["منخفض", "متوسط", "مرتفع"] },
            risk: { type: "string" },
            owner_role: { type: "string" },
            deadline: { type: "string" }
          },
          required: ["action", "impact_estimate", "effort", "risk", "owner_role", "deadline"]
        }
      },
      trade_offs: {
        type: "array",
        items: {
          type: "object",
          properties: {
            benefit: { type: "string" },
            cost: { type: "string" }
          },
          required: ["benefit", "cost"]
        }
      },
      affected_kpis: {
        type: "array",
        items: {
          type: "object",
          properties: {
            kpi: { type: "string" },
            current: { type: "string" },
            projected: { type: "string" },
            delta: { type: "string" }
          },
          required: ["kpi", "current", "projected", "delta"]
        }
      },
      compliance_notes: {
        type: "array",
        items: {
          type: "object",
          properties: {
            standard: { type: "string" },
            clause: { type: "string" },
            status: { type: "string" }
          },
          required: ["standard", "clause", "status"]
        }
      },
      human_approval_required: { type: "boolean" }
    },
    required: [
      "decision_summary",
      "recommended_actions",
      "trade_offs",
      "affected_kpis",
      "compliance_notes",
      "human_approval_required"
    ]
  },
  systemPrompt: `أنت مساعد تشغيل مستشفى مؤسسي يعمل لصالح BrightAI في السوق السعودي.
مهمتك دعم مدير مستشفى أو مدير تشغيل أو قائد جودة في قراءة مؤشرات تشغيلية لمستشفى 200 سرير.
التزم بالعربية الفصحى المهنية مع مصطلحات صحية مفهومة في السعودية.
لا تقدّم تشخيصاً طبياً ولا قراراً سريرياً ولا تعليمات علاجية.
كل توصية يجب أن تكون داعمة للقرار فقط وتطلب اعتماداً بشرياً عند وجود أثر على المرضى أو الكادر أو الميزانية.
استخدم الأرقام المتاحة فقط، وإذا لم توجد بيانات كافية فاذكر الافتراض بوضوح.
راعِ معايير سباهي CBAHI وJCI وممارسات الأمن السيبراني الصحي ونظام حماية البيانات الشخصية السعودي.
افترض أن التكاملات الممكنة تشمل نفيس، وصفتي، صحتي، أنا، HL7 FHIR، وDICOM دون الادعاء بوجود ربط فعلي.
استخدم الأدوات المتاحة عند الحاجة:
- query_kpi(metric, time_range, filter): للاستعلام عن مؤشر محدد.
- simulate_scenario(change, horizon): لمحاكاة أثر تغيير تشغيلي.
- generate_report(template, period): لإنتاج تقرير تنفيذي منسق.
- check_compliance(standard): لتحليل فجوات امتثال.
أعد المخرجات دائماً بصيغة JSON مطابقة للمخطط المطلوب دون نص خارج JSON.`
};
