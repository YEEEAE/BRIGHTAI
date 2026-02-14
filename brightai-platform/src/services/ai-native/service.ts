import type {
  ComplianceInput,
  ComplianceOutput,
  ComplianceRisk,
  ImpactInput,
  ImpactOutput,
  OpportunityInput,
  OpportunityItem,
  OpportunityOutput,
} from "./types";

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const round = (value: number) => Number(value.toFixed(2));

const getSectorWeight = (sector: OpportunityInput["sector"]) => {
  switch (sector) {
    case "اللوجستيات":
      return { cost: 0.11, revenue: 0.06, speed: 0.09 };
    case "الصناعة":
      return { cost: 0.13, revenue: 0.05, speed: 0.08 };
    case "الطاقة":
      return { cost: 0.1, revenue: 0.05, speed: 0.07 };
    case "الصحة":
      return { cost: 0.08, revenue: 0.07, speed: 0.08 };
    case "المالية":
      return { cost: 0.09, revenue: 0.08, speed: 0.07 };
    case "الضيافة":
      return { cost: 0.07, revenue: 0.1, speed: 0.08 };
    case "التعليم":
      return { cost: 0.06, revenue: 0.06, speed: 0.07 };
    case "التجزئة":
    default:
      return { cost: 0.1, revenue: 0.09, speed: 0.08 };
  }
};

const getSizeComplexity = (size: OpportunityInput["organizationSize"]) => {
  switch (size) {
    case "صغيرة":
      return { multiplier: 0.8, complexity: "منخفض" as const, window: "٣-٥ أسابيع" };
    case "متوسطة":
      return { multiplier: 1, complexity: "متوسط" as const, window: "٥-٨ أسابيع" };
    case "كبيرة":
      return { multiplier: 1.2, complexity: "متوسط" as const, window: "٨-١٢ أسبوع" };
    case "مؤسسية":
    default:
      return { multiplier: 1.35, complexity: "مرتفع" as const, window: "١٢-١٦ أسبوع" };
  }
};

export class AiNativeExpansionService {
  generateSectorOpportunities(input: OpportunityInput): OpportunityOutput {
    const weights = getSectorWeight(input.sector);
    const size = getSizeComplexity(input.organizationSize);
    const errorRate = clamp(input.errorRatePercent / 100, 0, 0.5);
    const conversion = clamp(input.currentConversionRatePercent / 100, 0, 1);

    const automationValue = input.monthlyOperatingCostSar * weights.cost * size.multiplier;
    const leakageValue = input.monthlyOperatingCostSar * errorRate * 0.45 * size.multiplier;
    const speedValue =
      input.monthlyOperatingCostSar *
      (clamp(input.cycleTimeDays, 1, 60) / 30) *
      (weights.speed * 0.55) *
      size.multiplier;
    const growthValue =
      input.monthlyLeadCount * Math.max(conversion, 0.02) * 180 * weights.revenue * size.multiplier;

    const opportunities: OpportunityItem[] = [
      {
        id: "op-automation-core",
        title: "أتمتة مسار التشغيل عالي التكرار",
        lever: "تكلفة" as const,
        estimatedMonthlyValueSar: round(automationValue),
        expectedPaybackMonths: round(Math.max(1.2, 90000 / Math.max(automationValue, 1))),
        implementationComplexity: size.complexity,
        executionWindow: size.window,
        rationale: "تقليل العمل اليدوي يضغط تكلفة التشغيل ويزيد قابلية التوسع بدون زيادة مباشرة في التوظيف.",
      },
      {
        id: "op-quality-guard",
        title: "طبقة رقابة جودة تنبؤية قبل الإطلاق",
        lever: "جودة" as const,
        estimatedMonthlyValueSar: round(leakageValue),
        expectedPaybackMonths: round(Math.max(1, 65000 / Math.max(leakageValue, 1))),
        implementationComplexity: size.complexity === "مرتفع" ? "مرتفع" as const : "متوسط" as const,
        executionWindow: size.complexity === "مرتفع" ? "٨-١٢ أسبوع" : "٤-٧ أسابيع",
        rationale: "خفض الأخطاء قبل التسليم يقلل الهدر وإعادة التنفيذ ويرفع ثقة العميل النهائي.",
      },
      {
        id: "op-cycle-optimizer",
        title: "مُحسّن زمن الدورة واتخاذ القرار",
        lever: "سرعة" as const,
        estimatedMonthlyValueSar: round(speedValue),
        expectedPaybackMonths: round(Math.max(1, 50000 / Math.max(speedValue, 1))),
        implementationComplexity: "متوسط" as const,
        executionWindow: "٤-٦ أسابيع",
        rationale: "تقصير زمن الدورة يرفع إنتاجية الفريق ويزيد عدد الحالات المنجزة شهريًا.",
      },
      {
        id: "op-conversion-engine",
        title: "محرك تحسين التحويل التجاري المدعوم بالذكاء الاصطناعي",
        lever: "إيراد" as const,
        estimatedMonthlyValueSar: round(growthValue),
        expectedPaybackMonths: round(Math.max(1, 70000 / Math.max(growthValue, 1))),
        implementationComplexity: size.complexity,
        executionWindow: "٦-١٠ أسابيع",
        rationale: "تحسين جودة التأهيل والاستجابة يرفع إغلاق الفرص ويزيد الإيراد دون رفع إنفاق الاستحواذ.",
      },
    ].sort((a, b) => b.estimatedMonthlyValueSar - a.estimatedMonthlyValueSar);

    return {
      generatedAt: new Date().toISOString(),
      sector: input.sector,
      opportunities,
    };
  }

  evaluateSaudiCompliance(input: ComplianceInput): ComplianceOutput {
    const risks: ComplianceRisk[] = [];

    if (input.hostingLocation !== "داخل السعودية") {
      risks.push({
        id: "risk-hosting-location",
        title: "استضافة خارج النطاق السيادي المحلي",
        severity: "حرجة" as const,
        rootCause: "وجود بيانات تشغيلية أو تحليلية خارج بيئة محلية خاضعة للسيادة.",
        requiredAction: "نقل التخزين والمعالجة إلى بنية داخل السعودية قبل فتح الإنتاج.",
        owner: "فريق المنصة والبنية التحتية",
        regulationHint: "ضوابط سيادة البيانات واشتراطات الحوكمة الحكومية.",
      });
    }

    if (input.crossBorderTransfers) {
      risks.push({
        id: "risk-cross-border",
        title: "نقل بيانات عابر للحدود بدون ضوابط تشغيلية كافية",
        severity: "عالية" as const,
        rootCause: "تفعيل تبادلات خارجية دون مصفوفة موافقات وتقييم أثر واضح.",
        requiredAction: "إيقاف النقل العابر مؤقتًا أو فرض طبقة موافقات وتشفير وتدقيق إلزامي.",
        owner: "فريق الأمن والامتثال",
        regulationHint: "اشتراطات نقل البيانات الشخصية عبر الحدود.",
      });
    }

    if (!input.encryptionAtRest) {
      risks.push({
        id: "risk-encryption-at-rest",
        title: "تعطيل تشفير البيانات الساكنة",
        severity: "عالية" as const,
        rootCause: "البيانات محفوظة دون تشفير افتراضي على مخازن دائمة.",
        requiredAction: "تفعيل التشفير الساكن بمفاتيح مدارة وتدوير دوري للمفاتيح.",
        owner: "فريق الأمن السيبراني",
        regulationHint: "متطلبات الحماية التقنية للبيانات الحساسة.",
      });
    }

    if (!input.accessControlMfa) {
      risks.push({
        id: "risk-mfa",
        title: "ضعف ضوابط الوصول الإداري",
        severity: "عالية" as const,
        rootCause: "عدم فرض التحقق المتعدد على الحسابات الحساسة.",
        requiredAction: "فرض التحقق المتعدد وصلاحيات أقل امتيازًا للحسابات الإدارية.",
        owner: "فريق الهوية والوصول",
        regulationHint: "ضوابط التحكم بالوصول وإدارة الهوية.",
      });
    }

    if (!input.auditLoggingEnabled) {
      risks.push({
        id: "risk-audit-trail",
        title: "غياب سجل تدقيق غير قابل للعبث",
        severity: "متوسطة" as const,
        rootCause: "الأحداث الحرجة لا تُسجل بشكل يمكن الاعتماد عليه للتتبع والتحقيق.",
        requiredAction: "تفعيل سجل تدقيق مركزي مع احتفاظ زمني وسياسة تنبيه.",
        owner: "فريق التشغيل والأمن",
        regulationHint: "متطلبات التتبع والمراجعة الأمنية.",
      });
    }

    if (!input.consentTrackingEnabled && input.dataTypes.some((item) => /شخصية|هوية|صحية/.test(item))) {
      risks.push({
        id: "risk-consent",
        title: "عدم توثيق الموافقات للبيانات الشخصية",
        severity: "عالية" as const,
        rootCause: "لا يوجد سجل موافقات واضح للمعالجة والاستخدام.",
        requiredAction: "إضافة إدارة موافقات صريحة وربطها بكل عملية استخدام.",
        owner: "فريق المنتج والامتثال",
        regulationHint: "متطلبات معالجة البيانات الشخصية والشفافية.",
      });
    }

    if (input.retentionMonths > 36) {
      risks.push({
        id: "risk-retention",
        title: "فترة احتفاظ أطول من الحاجة التشغيلية",
        severity: "متوسطة" as const,
        rootCause: "الاحتفاظ طويل بلا مبرر تشغيلي أو قانوني موثق.",
        requiredAction: "تطبيق سياسة احتفاظ متدرجة مع حذف آلي وفق التصنيف.",
        owner: "فريق الحوكمة والبيانات",
        regulationHint: "مبدأ تقليل البيانات ومدة الاحتفاظ.",
      });
    }

    if (input.thirdPartyProcessors.length > 3) {
      risks.push({
        id: "risk-third-party-surface",
        title: "اتساع سطح الموردين الخارجيين",
        severity: "متوسطة" as const,
        rootCause: "تعدد معالجات خارجية يزيد مخاطر السلسلة.",
        requiredAction: "تقليص الموردين وربط كل طرف باتفاقية معالجة وضوابط أمنية.",
        owner: "فريق المشتريات والأمن",
        regulationHint: "حوكمة الأطراف الثالثة وإدارة مخاطر الموردين.",
      });
    }

    const severityWeight: Record<ComplianceRisk["severity"], number> = {
      حرجة: 30,
      عالية: 18,
      متوسطة: 10,
      منخفضة: 4,
    };
    const rawScore = risks.reduce((sum, risk) => sum + severityWeight[risk.severity], 0);
    const riskScore = clamp(rawScore, 0, 100);
    const publishAllowed = !risks.some((risk) => risk.severity === "حرجة" || risk.severity === "عالية");

    return {
      generatedAt: new Date().toISOString(),
      publishAllowed,
      riskScore,
      risks,
    };
  }

  measureExecutionImpact(input: ImpactInput): ImpactOutput {
    const before = Math.max(input.beforeCycleMinutes, 1);
    const after = Math.max(input.afterCycleMinutes, 0);
    const runs = Math.max(input.monthlyRuns, 1);

    const minutesSavedPerRun = Math.max(before - after, 0);
    const monthlyHoursSaved = (minutesSavedPerRun * runs) / 60;
    const monthlyOperationalSavingsSar = monthlyHoursSaved * Math.max(input.hourlyCostSar, 0);

    const conversionDelta = Math.max(input.conversionAfterPercent - input.conversionBeforePercent, 0) / 100;
    const monthlyRevenueUpliftSar = Math.max(input.monthlyRevenueAffectedSar, 0) * conversionDelta;

    const defectDelta = Math.max(input.defectRateBeforePercent - input.defectRateAfterPercent, 0) / 100;
    const monthlyQualitySavingsSar = runs * defectDelta * Math.max(input.defectIncidentCostSar, 0);

    const monthlyTotalImpactSar = monthlyOperationalSavingsSar + monthlyRevenueUpliftSar + monthlyQualitySavingsSar;
    const annualizedImpactSar = monthlyTotalImpactSar * 12;
    const implementationCost = Math.max(input.implementationCostSar, 0);
    const roiPercent =
      implementationCost > 0 ? ((annualizedImpactSar - implementationCost) / implementationCost) * 100 : 0;
    const paybackMonths = monthlyTotalImpactSar > 0 ? implementationCost / monthlyTotalImpactSar : 0;

    const timeIndex = ((before - after) / before) * 100;
    const qualityIndex =
      input.defectRateBeforePercent > 0
        ? ((input.defectRateBeforePercent - input.defectRateAfterPercent) / input.defectRateBeforePercent) * 100
        : 0;
    const operationalIndex = clamp(round(timeIndex * 0.6 + qualityIndex * 0.4), 0, 100);

    return {
      generatedAt: new Date().toISOString(),
      executionName: input.executionName,
      monthlyOperationalSavingsSar: round(monthlyOperationalSavingsSar),
      monthlyRevenueUpliftSar: round(monthlyRevenueUpliftSar),
      monthlyQualitySavingsSar: round(monthlyQualitySavingsSar),
      monthlyTotalImpactSar: round(monthlyTotalImpactSar),
      annualizedImpactSar: round(annualizedImpactSar),
      roiPercent: round(roiPercent),
      paybackMonths: round(paybackMonths),
      operationalIndex,
    };
  }
}

const aiNativeExpansionService = new AiNativeExpansionService();
export default aiNativeExpansionService;
