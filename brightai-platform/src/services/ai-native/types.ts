export type SaudiSector =
  | "التجزئة"
  | "اللوجستيات"
  | "الصناعة"
  | "الطاقة"
  | "الصحة"
  | "المالية"
  | "الضيافة"
  | "التعليم";

export type OrganizationSize = "صغيرة" | "متوسطة" | "كبيرة" | "مؤسسية";

export type OpportunityInput = {
  sector: SaudiSector;
  organizationSize: OrganizationSize;
  monthlyOperatingCostSar: number;
  cycleTimeDays: number;
  errorRatePercent: number;
  monthlyLeadCount: number;
  currentConversionRatePercent: number;
};

export type OpportunityItem = {
  id: string;
  title: string;
  lever: "تكلفة" | "إيراد" | "جودة" | "سرعة";
  estimatedMonthlyValueSar: number;
  expectedPaybackMonths: number;
  implementationComplexity: "منخفض" | "متوسط" | "مرتفع";
  executionWindow: string;
  rationale: string;
};

export type OpportunityOutput = {
  generatedAt: string;
  sector: SaudiSector;
  opportunities: OpportunityItem[];
};

export type ComplianceInput = {
  dataTypes: string[];
  hostingLocation: "داخل السعودية" | "خارج السعودية" | "مختلط";
  retentionMonths: number;
  encryptionAtRest: boolean;
  accessControlMfa: boolean;
  auditLoggingEnabled: boolean;
  consentTrackingEnabled: boolean;
  thirdPartyProcessors: string[];
  crossBorderTransfers: boolean;
};

export type ComplianceSeverity = "حرجة" | "عالية" | "متوسطة" | "منخفضة";

export type ComplianceRisk = {
  id: string;
  title: string;
  severity: ComplianceSeverity;
  rootCause: string;
  requiredAction: string;
  owner: string;
  regulationHint: string;
};

export type ComplianceOutput = {
  generatedAt: string;
  publishAllowed: boolean;
  riskScore: number;
  risks: ComplianceRisk[];
};

export type ImpactInput = {
  executionName: string;
  beforeCycleMinutes: number;
  afterCycleMinutes: number;
  monthlyRuns: number;
  hourlyCostSar: number;
  implementationCostSar: number;
  monthlyRevenueAffectedSar: number;
  conversionBeforePercent: number;
  conversionAfterPercent: number;
  defectRateBeforePercent: number;
  defectRateAfterPercent: number;
  defectIncidentCostSar: number;
};

export type ImpactOutput = {
  generatedAt: string;
  executionName: string;
  monthlyOperationalSavingsSar: number;
  monthlyRevenueUpliftSar: number;
  monthlyQualitySavingsSar: number;
  monthlyTotalImpactSar: number;
  annualizedImpactSar: number;
  roiPercent: number;
  paybackMonths: number;
  operationalIndex: number;
};
