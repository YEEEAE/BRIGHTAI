import { useMemo, useState } from "react";
import { ShieldCheck, LineChart, Target } from "lucide-react";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import aiNativeExpansionService from "../services/ai-native/service";
import type { ComplianceOutput, ImpactOutput, OpportunityOutput } from "../services/ai-native/types";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("ar-SA", {
    style: "currency",
    currency: "SAR",
    maximumFractionDigits: 0,
  }).format(value || 0);

const AiNativeExpansion = () => {
  const [opportunityResult, setOpportunityResult] = useState<OpportunityOutput | null>(null);
  const [complianceResult, setComplianceResult] = useState<ComplianceOutput | null>(null);
  const [impactResult, setImpactResult] = useState<ImpactOutput | null>(null);

  const [opportunityInput, setOpportunityInput] = useState({
    sector: "التجزئة" as const,
    organizationSize: "متوسطة" as const,
    monthlyOperatingCostSar: 350000,
    cycleTimeDays: 12,
    errorRatePercent: 6,
    monthlyLeadCount: 1200,
    currentConversionRatePercent: 14,
  });

  const [complianceInput, setComplianceInput] = useState({
    dataTypes: "بيانات شخصية,بيانات تشغيلية,بيانات مالية",
    hostingLocation: "داخل السعودية" as const,
    retentionMonths: 24,
    encryptionAtRest: true,
    accessControlMfa: true,
    auditLoggingEnabled: true,
    consentTrackingEnabled: true,
    thirdPartyProcessors: "مزود بريد,مزود إشعارات",
    crossBorderTransfers: false,
  });

  const [impactInput, setImpactInput] = useState({
    executionName: "أتمتة معالجة طلبات العملاء",
    beforeCycleMinutes: 52,
    afterCycleMinutes: 17,
    monthlyRuns: 1800,
    hourlyCostSar: 140,
    implementationCostSar: 185000,
    monthlyRevenueAffectedSar: 950000,
    conversionBeforePercent: 11.5,
    conversionAfterPercent: 14.2,
    defectRateBeforePercent: 8.1,
    defectRateAfterPercent: 3.2,
    defectIncidentCostSar: 220,
  });

  const publishStatusStyle = useMemo(() => {
    if (!complianceResult) {
      return "text-slate-300";
    }
    return complianceResult.publishAllowed ? "text-emerald-300" : "text-rose-300";
  }, [complianceResult]);

  const handleOpportunityRun = () => {
    const output = aiNativeExpansionService.generateSectorOpportunities(opportunityInput);
    setOpportunityResult(output);
  };

  const handleComplianceRun = () => {
    const output = aiNativeExpansionService.evaluateSaudiCompliance({
      ...complianceInput,
      dataTypes: complianceInput.dataTypes
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      thirdPartyProcessors: complianceInput.thirdPartyProcessors
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    });
    setComplianceResult(output);
  };

  const handleImpactRun = () => {
    const output = aiNativeExpansionService.measureExecutionImpact(impactInput);
    setImpactResult(output);
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8">
      <section className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950/40 p-6">
        <p className="text-xs font-semibold text-emerald-300">تفعيل توسعات الذكاء الاصطناعي الأصلية</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-100 md:text-3xl">
          مركز الوكلاء الذكيين: فرص قطاعية، امتثال قبل النشر، وقياس أثر تلقائي
        </h1>
        <p className="mt-2 text-sm text-slate-300">
          هذه الصفحة تشغّل الوكلاء الثلاثة مباشرة وتنتج قرارات قابلة للتنفيذ والقياس.
        </p>
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <Card variant="glass" className="h-full">
          <div className="inline-flex items-center gap-2 text-emerald-300">
            <Target className="h-5 w-5" />
            <h2 className="text-lg font-bold text-slate-100">وكيل اكتشاف الفرص القطاعي</h2>
          </div>
          <div className="mt-4 grid gap-3">
            <label className="text-xs text-slate-400">القطاع</label>
            <select
              className="auth-field rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm text-slate-100"
              value={opportunityInput.sector}
              onChange={(event) =>
                setOpportunityInput((prev) => ({ ...prev, sector: event.target.value as typeof prev.sector }))
              }
            >
              {["التجزئة", "اللوجستيات", "الصناعة", "الطاقة", "الصحة", "المالية", "الضيافة", "التعليم"].map((sector) => (
                <option key={sector} value={sector}>
                  {sector}
                </option>
              ))}
            </select>
            <Input
              label="تكلفة التشغيل الشهرية"
              type="number"
              value={opportunityInput.monthlyOperatingCostSar}
              onChange={(event) =>
                setOpportunityInput((prev) => ({ ...prev, monthlyOperatingCostSar: Number(event.target.value || 0) }))
              }
            />
            <Input
              label="عدد الفرص الشهرية"
              type="number"
              value={opportunityInput.monthlyLeadCount}
              onChange={(event) =>
                setOpportunityInput((prev) => ({ ...prev, monthlyLeadCount: Number(event.target.value || 0) }))
              }
            />
            <Button onClick={handleOpportunityRun} fullWidth gradient>
              تشغيل الوكيل القطاعي
            </Button>
          </div>
          {opportunityResult ? (
            <div className="mt-4 space-y-3">
              {opportunityResult.opportunities.slice(0, 3).map((item) => (
                <div key={item.id} className="rounded-xl border border-slate-700/70 bg-slate-900/50 p-3 text-sm">
                  <p className="font-semibold text-slate-100">{item.title}</p>
                  <p className="mt-1 text-emerald-300">{formatCurrency(item.estimatedMonthlyValueSar)} شهريًا</p>
                  <p className="text-xs text-slate-400">الاسترداد المتوقع: {item.expectedPaybackMonths} شهر</p>
                </div>
              ))}
            </div>
          ) : null}
        </Card>

        <Card variant="glass" className="h-full">
          <div className="inline-flex items-center gap-2 text-sky-300">
            <ShieldCheck className="h-5 w-5" />
            <h2 className="text-lg font-bold text-slate-100">وكيل امتثال البيانات السعودي</h2>
          </div>
          <div className="mt-4 grid gap-3">
            <label className="text-xs text-slate-400">موقع الاستضافة</label>
            <select
              className="auth-field rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm text-slate-100"
              value={complianceInput.hostingLocation}
              onChange={(event) =>
                setComplianceInput((prev) => ({
                  ...prev,
                  hostingLocation: event.target.value as typeof prev.hostingLocation,
                }))
              }
            >
              {["داخل السعودية", "خارج السعودية", "مختلط"].map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <Input
              label="أنواع البيانات (مفصولة بفاصلة)"
              value={complianceInput.dataTypes}
              onChange={(event) => setComplianceInput((prev) => ({ ...prev, dataTypes: event.target.value }))}
            />
            <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={complianceInput.encryptionAtRest}
                  onChange={(event) =>
                    setComplianceInput((prev) => ({ ...prev, encryptionAtRest: event.target.checked }))
                  }
                />
                تشفير ساكن
              </label>
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={complianceInput.accessControlMfa}
                  onChange={(event) =>
                    setComplianceInput((prev) => ({ ...prev, accessControlMfa: event.target.checked }))
                  }
                />
                وصول متعدد العوامل
              </label>
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={complianceInput.auditLoggingEnabled}
                  onChange={(event) =>
                    setComplianceInput((prev) => ({ ...prev, auditLoggingEnabled: event.target.checked }))
                  }
                />
                سجل تدقيق
              </label>
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={complianceInput.crossBorderTransfers}
                  onChange={(event) =>
                    setComplianceInput((prev) => ({ ...prev, crossBorderTransfers: event.target.checked }))
                  }
                />
                نقل عابر للحدود
              </label>
            </div>
            <Button onClick={handleComplianceRun} fullWidth>
              فحص المخاطر قبل النشر
            </Button>
          </div>
          {complianceResult ? (
            <div className="mt-4 space-y-2 text-sm">
              <p className={`font-semibold ${publishStatusStyle}`}>
                حالة النشر: {complianceResult.publishAllowed ? "مسموح" : "ممنوع حتى الإغلاق"}
              </p>
              <p className="text-slate-300">درجة المخاطر: {complianceResult.riskScore}/100</p>
              {complianceResult.risks.slice(0, 2).map((risk) => (
                <div key={risk.id} className="rounded-xl border border-slate-700/70 bg-slate-900/50 p-3 text-xs">
                  <p className="font-semibold text-slate-100">{risk.title}</p>
                  <p className="mt-1 text-slate-400">{risk.requiredAction}</p>
                </div>
              ))}
            </div>
          ) : null}
        </Card>

        <Card variant="glass" className="h-full">
          <div className="inline-flex items-center gap-2 text-amber-300">
            <LineChart className="h-5 w-5" />
            <h2 className="text-lg font-bold text-slate-100">وكيل قياس الأثر التلقائي</h2>
          </div>
          <div className="mt-4 grid gap-3">
            <Input
              label="اسم التنفيذ"
              value={impactInput.executionName}
              onChange={(event) => setImpactInput((prev) => ({ ...prev, executionName: event.target.value }))}
            />
            <Input
              label="زمن الدورة قبل (دقيقة)"
              type="number"
              value={impactInput.beforeCycleMinutes}
              onChange={(event) =>
                setImpactInput((prev) => ({ ...prev, beforeCycleMinutes: Number(event.target.value || 0) }))
              }
            />
            <Input
              label="زمن الدورة بعد (دقيقة)"
              type="number"
              value={impactInput.afterCycleMinutes}
              onChange={(event) =>
                setImpactInput((prev) => ({ ...prev, afterCycleMinutes: Number(event.target.value || 0) }))
              }
            />
            <Input
              label="مرات التنفيذ الشهرية"
              type="number"
              value={impactInput.monthlyRuns}
              onChange={(event) => setImpactInput((prev) => ({ ...prev, monthlyRuns: Number(event.target.value || 0) }))}
            />
            <Button onClick={handleImpactRun} fullWidth variant="secondary">
              قياس الأثر الآن
            </Button>
          </div>
          {impactResult ? (
            <div className="mt-4 space-y-2 text-sm">
              <p className="font-semibold text-emerald-300">
                إجمالي الأثر الشهري: {formatCurrency(impactResult.monthlyTotalImpactSar)}
              </p>
              <p className="text-slate-300">العائد السنوي: {formatCurrency(impactResult.annualizedImpactSar)}</p>
              <p className="text-slate-300">العائد على الاستثمار: {impactResult.roiPercent}%</p>
              <p className="text-slate-300">فترة الاسترداد: {impactResult.paybackMonths} شهر</p>
              <p className="text-slate-300">مؤشر التحسن التشغيلي: {impactResult.operationalIndex}/100</p>
            </div>
          ) : null}
        </Card>
      </section>
    </div>
  );
};

export default AiNativeExpansion;
