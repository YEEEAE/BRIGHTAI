/**
 * Kernel Journey — K1 (2026-07-18)
 *
 * بنية المعلومات العربية RTL أولاً لمسار Kernel.
 * خمس مراحل مترابطة بدون حذف أي وظيفة موجودة:
 *
 *   1) onboarding   — /kernel/                  (الرئيسية + شرح ما هو Kernel)
 *   2) scenario     — /kernel/scenarios/        (اختيار سيناريو سعودي)
 *   3) run          — /kernel/chat/             (تشغيل تفاعلي مع AI Firewall)
 *   4) interpret    — /kernel/policies|evidence|audit|compliance|stats|approvals|reports
 *   5) sales        — /kernel/* + /contact/     (CTA المبيعاتي)
 *
 * لا يتم تخزين أي PII في URL — كل البيانات (scenario + sector + riskBand)
 * تنتقل عبر data-* attributes على الـ <a> والـ <button>، ثم تُلتقَط في
 * KernelLeadForm dataLayer عند الإرسال.
 *
 * لا يدّعي هذا المسار امتثالاً قانونياً كاملاً — Kernel أداة تشغيلية
 * تساعد المنشآت السعودية على الجاهزية، والقرارات النهائية تتطلب
 * مراجعة بشرية متخصصة.
 *
 * المكوّنات المرتبطة:
 *   - KernelJourneyProgress.astro (شريط تقدم 5 مراحل)
 *   - KernelJourneyContext.astro  (ناقل البيانات بين الصفحات)
 *   - KernelLeadForm.astro        (يلتقط scenario + sector + riskBand)
 *   - scripts/playwright/kernel-journey-test.mjs (تحقق آلي)
 */

import { kernelNavItems } from './kernel';

// ── Types ──────────────────────────────────────────────────────────────────

export type JourneyStageId =
  | 'onboarding'
  | 'scenario'
  | 'run'
  | 'interpret'
  | 'sales';

export type Sector =
  | 'banking'
  | 'government'
  | 'healthcare'
  | 'hr'
  | 'legal'
  | 'finance'
  | 'code'
  | 'telecom'
  | 'manufacturing'
  | 'education';

export type RiskBand = 'minimal' | 'low' | 'medium' | 'high' | 'critical';

export type ExpectedAction = 'allow' | 'allow_with_review' | 'block' | 'block_pii';

export interface JourneyStage {
  id: JourneyStageId;
  number: number; // 1..5
  label: string; // Arabic short label
  subtitle: string; // Arabic 1-line subtitle
  description: string; // Arabic 1-2 sentence description
  pagePath: string; // Primary entry page
  pageLabel: string; // Primary entry page label
  nextStageId: JourneyStageId | null;
  expectedDuration: string; // Arabic human-readable ("5 دقائق" etc.)
  /** Which pages belong to this stage (paths relative to /kernel/). */
  pagePaths: string[];
}

export interface ScenarioMeta {
  id: string;
  title: string;
  sector: Sector;
  riskBand: RiskBand;
  category: string; // matches scenarios.astro `category`
  compliancePack: string;
  expectedAction: ExpectedAction;
  stage: 'scenario';
  /** Short hint shown in the chat composer when this scenario is loaded. */
  promptHint: string;
}

// ── Stages ─────────────────────────────────────────────────────────────────

export const JOURNEY_STAGES: JourneyStage[] = [
  {
    id: 'onboarding',
    number: 1,
    label: 'تعريف',
    subtitle: 'تعرّف على Kernel',
    description:
      'افهم وش هو Kernel، كيف يحمي منشأتك، وش تقدمه اللوحة من مؤشرات تشغيلية. لا التزام ولا تسجيل.',
    pagePath: '/kernel/',
    pageLabel: 'لوحة الحوكمة',
    nextStageId: 'scenario',
    expectedDuration: 'دقيقتان',
    pagePaths: ['/kernel/'],
  },
  {
    id: 'scenario',
    number: 2,
    label: 'سيناريو',
    subtitle: 'اختر سيناريو سعودي',
    description:
      'اختر من 12 سيناريو واقعي يغطي القطاعات المنظمة (بنوك، صحة، حكومي، قانوني، HR، كود). كل سيناريو يحمل القطاع ومستوى المخاطر وحزمة الامتثال.',
    pagePath: '/kernel/scenarios/',
    pageLabel: 'السيناريوهات',
    nextStageId: 'run',
    expectedDuration: 'دقيقة',
    pagePaths: ['/kernel/scenarios/'],
  },
  {
    id: 'run',
    number: 3,
    label: 'تشغيل',
    subtitle: 'شغّل المحادثة',
    description:
      'جرّب السيناريو في محادثة آمنة مع AI Firewall. يشمل فحص PII، تقييم المخاطر، تطبيق السياسات، والتسجيل في سجل التدقيق.',
    pagePath: '/kernel/chat/',
    pageLabel: 'المحادثة الآمنة',
    nextStageId: 'interpret',
    expectedDuration: '3-5 دقائق',
    pagePaths: ['/kernel/chat/'],
  },
  {
    id: 'interpret',
    number: 4,
    label: 'تفسير',
    subtitle: 'فهم السياسات والأدلة',
    description:
      'راجع كيف فسّر Kernel القرار: السياسات المطبّقة، الأدلة المولّدة، سجل التدقيق، وحالة الامتثال لأطر (PDPL، NCA ECC، SDAIA، SFDA).',
    pagePath: '/kernel/policies/',
    pageLabel: 'السياسات',
    nextStageId: 'sales',
    expectedDuration: '5 دقائق',
    pagePaths: [
      '/kernel/policies/',
      '/kernel/evidence/',
      '/kernel/audit/',
      '/kernel/compliance/',
      '/kernel/stats/',
      '/kernel/approvals/',
      '/kernel/reports/',
    ],
  },
  {
    id: 'sales',
    number: 5,
    label: 'مبيعات',
    subtitle: 'تواصل مع الحوكمة',
    description:
      'احجز عرضاً مفصّلاً مع فريق الحوكمة. الـ CTA يحمل القطاع ومستوى المخاطر المختار — بدون أي PII في الرابط.',
    pagePath: '/contact/',
    pageLabel: 'تواصل معنا',
    nextStageId: null,
    expectedDuration: 'دقيقة',
    pagePaths: ['/contact/'],
  },
];

// ── Stage lookup helpers ───────────────────────────────────────────────────

/** Get stage metadata by id. */
export function getJourneyStage(id: JourneyStageId): JourneyStage | null {
  return JOURNEY_STAGES.find(s => s.id === id) ?? null;
}

/** Get the next stage in the journey, or null if at the end. */
export function getNextJourneyStage(id: JourneyStageId): JourneyStage | null {
  const current = getJourneyStage(id);
  if (!current || !current.nextStageId) return null;
  return getJourneyStage(current.nextStageId);
}

/** Get the previous stage in the journey, or null if at the start. */
export function getPreviousJourneyStage(id: JourneyStageId): JourneyStage | null {
  const idx = JOURNEY_STAGES.findIndex(s => s.id === id);
  if (idx <= 0) return null;
  return JOURNEY_STAGES[idx - 1] ?? null;
}

/**
 * Resolve the journey stage for an arbitrary URL path.
 * Default: any /kernel/* path not in the map falls back to "interpret"
 * (covers the admin/operational units like /connectors/, /stats/).
 */
export function getStageForPath(path: string): JourneyStage | null {
  const normalized = path.endsWith('/') ? path : `${path}/`;
  for (const stage of JOURNEY_STAGES) {
    if (stage.pagePaths.includes(normalized)) return stage;
  }
  // /kernel/* that's not in the map: try prefix match for operational units
  if (normalized.startsWith('/kernel/') || normalized === '/kernel/') {
    return getJourneyStage('onboarding');
  }
  return null;
}

/** Get all kernel unit paths that fall under a given stage. */
export function getStageUnits(stage: JourneyStage): typeof kernelNavItems {
  return kernelNavItems.filter(u => stage.pagePaths.includes(u.path));
}

// ── Scenario metadata ──────────────────────────────────────────────────────

/**
 * Metadata for the 12 Saudi scenarios in /kernel/scenarios/.
 * Single source of truth for sector + riskBand + expectedAction.
 * Keep in sync with the `scenarios` array in src/pages/kernel/scenarios.astro.
 */
export const SCENARIO_META: Record<string, ScenarioMeta> = {
  'pdpl-id-leak': {
    id: 'pdpl-id-leak',
    title: 'كشف تسريب الهوية الوطنية (PDPL)',
    sector: 'legal',
    riskBand: 'critical',
    category: 'legal',
    compliancePack: 'pdpl',
    expectedAction: 'block',
    stage: 'scenario',
    promptHint:
      'سيناريو PDPL — محاولة مشاركة هوية وطنية سعودية. متوقع: حظر كامل وتسجيل في السجل.',
  },
  'procurement-contract': {
    id: 'procurement-contract',
    title: 'مراجعة عقود المشتريات الحكومية',
    sector: 'government',
    riskBand: 'minimal',
    category: 'finance',
    compliancePack: 'procurement',
    expectedAction: 'allow',
    stage: 'scenario',
    promptHint:
      'سيناريو المشتريات — مراجعة عقد توريد حكومي بدون بيانات حساسة. متوقع: سماح مباشر.',
  },
  'sfda-medical-export': {
    id: 'sfda-medical-export',
    title: 'تصدير السجلات الطبية الحساسة (SFDA)',
    sector: 'healthcare',
    riskBand: 'critical',
    category: 'healthcare',
    compliancePack: 'sfda',
    expectedAction: 'block',
    stage: 'scenario',
    promptHint:
      'سيناريو SFDA — محاولة تصدير سجلات طبية لهوية خارجية. متوقع: حظر + طلب اعتماد بشري.',
  },
  'nca-prompt-injection': {
    id: 'nca-prompt-injection',
    title: 'منع Prompt Injection (NCA ECC)',
    sector: 'code',
    riskBand: 'high',
    category: 'code',
    compliancePack: 'nca_ecc',
    expectedAction: 'block',
    stage: 'scenario',
    promptHint:
      'سيناريو NCA ECC — محاولة prompt injection لاستخراج API keys. متوقع: حظر + تنبيه.',
  },
  'hr-salary-export': {
    id: 'hr-salary-export',
    title: 'تصدير بيانات الرواتب (HR)',
    sector: 'hr',
    riskBand: 'high',
    category: 'hr',
    compliancePack: 'pdpl',
    expectedAction: 'block',
    stage: 'scenario',
    promptHint:
      'سيناريو HR — محاولة تصدير كشوف رواتب إلى بريد شخصي. متوقع: حظر PDPL.',
  },
  'finance-iban-leak': {
    id: 'finance-iban-leak',
    title: 'تسريب أرقام الآيبان البنكية (SAMA)',
    sector: 'banking',
    riskBand: 'critical',
    category: 'finance',
    compliancePack: 'pdpl',
    expectedAction: 'block',
    stage: 'scenario',
    promptHint:
      'سيناريو SAMA — مشاركة رقم آيبان سعودي مع نموذج خارجي. متوقع: حظر + تسجيل.',
  },
  'code-secret-extract': {
    id: 'code-secret-extract',
    title: 'استخراج أسرار من الكود (NCA)',
    sector: 'code',
    riskBand: 'high',
    category: 'code',
    compliancePack: 'nca_ecc',
    expectedAction: 'block',
    stage: 'scenario',
    promptHint:
      'سيناريو NCA ECC — محاولة استخراج أسرار من ملف .env. متوقع: حظر + تنبيه أمني.',
  },
  'healthcare-research': {
    id: 'healthcare-research',
    title: 'بحث طبي على مرضى مجهولين (SFDA)',
    sector: 'healthcare',
    riskBand: 'medium',
    category: 'healthcare',
    compliancePack: 'sfda',
    expectedAction: 'allow_with_review',
    stage: 'scenario',
    promptHint:
      'سيناريو SFDA شرعي — بحث طبي على مرضى مجهولين بعد إزالة PII. متوقع: سماح مع مراجعة.',
  },
  'legal-contract-summary': {
    id: 'legal-contract-summary',
    title: 'تلخيص عقد قانوني (مسموح)',
    sector: 'legal',
    riskBand: 'minimal',
    category: 'legal',
    compliancePack: 'procurement',
    expectedAction: 'allow',
    stage: 'scenario',
    promptHint:
      'سيناريو قانوني مسموح — تلخيص NDA بين شركتين. متوقع: سماح مباشر.',
  },
  'hr-cv-screening': {
    id: 'hr-cv-screening',
    title: 'فحص سير ذاتية مع PII (HR)',
    sector: 'hr',
    riskBand: 'medium',
    category: 'hr',
    compliancePack: 'pdpl',
    expectedAction: 'allow_with_review',
    stage: 'scenario',
    promptHint:
      'سيناريو HR — فحص سير ذاتية مع إخفاء PII. متوقع: سماح مع مراجعة بشرية.',
  },
  'finance-quarterly-report': {
    id: 'finance-quarterly-report',
    title: 'تقرير ربع سنوي بنوك (SAMA)',
    sector: 'banking',
    riskBand: 'medium',
    category: 'finance',
    compliancePack: 'pdpl',
    expectedAction: 'allow_with_review',
    stage: 'scenario',
    promptHint:
      'سيناريو SAMA — تقرير ربع سنوي بنوك مع إخفاء أرقام الحسابات. متوقع: سماح مع مراجعة.',
  },
  'code-sql-injection': {
    id: 'code-sql-injection',
    title: 'كشف حقن SQL (NCA)',
    sector: 'code',
    riskBand: 'high',
    category: 'code',
    compliancePack: 'nca_ecc',
    expectedAction: 'block',
    stage: 'scenario',
    promptHint:
      'سيناريو NCA ECC — محاولة حقن SQL في توليد الكود. متوقع: حظر + تنبيه.',
  },
};

export function getScenarioMeta(id: string): ScenarioMeta | null {
  return SCENARIO_META[id] ?? null;
}

/** All scenarios as an array (for the Stage 2 picker). */
export function listScenarios(): ScenarioMeta[] {
  return Object.values(SCENARIO_META);
}

// ── Scenario banner config (single sanitized serialized source) ────────────

/**
 * Sanitized scenario metadata for the chat scenario banner.
 *
 * This is the SINGLE source of truth that gets serialized into a JSON blob
 * (`#scenarios-banner-config`) and injected into /kernel/chat/ at build time.
 * The browser banner script reads from this blob — it does NOT duplicate
 * SCENARIO_META. This eliminates the drift between the scenario card
 * (scenarios.astro) and the chat banner (chat.astro).
 *
 * Sanitization rules:
 *   - Only fields safe for display are included (no PII, no prompt text).
 *   - `promptHint` is a short descriptive hint (not user data) — safe to show.
 *   - The blob is consumed build-time; no TS import in the browser.
 */
export interface ScenarioBannerMeta {
  id: string;
  title: string;
  sector: Sector;
  riskBand: RiskBand;
  compliancePack: string;
  expectedAction: ExpectedAction;
  promptHint: string;
}

/** Full banner config shape serialized into #scenarios-banner-config. */
export interface ScenarioBannerConfig {
  scenarios: ScenarioBannerMeta[];
  sectorLabels: Record<Sector, string>;
  riskLabels: Record<RiskBand, string>;
}

/**
 * Build the sanitized banner config from SCENARIO_META.
 * Single source of truth — serialized build-time into #scenarios-banner-config.
 * The browser banner script reads from this blob; it does NOT duplicate
 * SCENARIO_META or the label maps.
 */
export function buildScenarioBannerConfig(): ScenarioBannerConfig {
  return {
    scenarios: Object.values(SCENARIO_META).map((s) => ({
      id: s.id,
      title: s.title,
      sector: s.sector,
      riskBand: s.riskBand,
      compliancePack: s.compliancePack,
      expectedAction: s.expectedAction,
      promptHint: s.promptHint,
    })),
    sectorLabels: SECTOR_LABELS,
    riskLabels: RISK_BAND_LABELS,
  };
}

/** Look up a single sanitized banner entry by id (for SSR + runtime). */
export function getScenarioBannerMeta(id: string): ScenarioBannerMeta | null {
  const meta = SCENARIO_META[id];
  if (!meta) return null;
  return {
    id: meta.id,
    title: meta.title,
    sector: meta.sector,
    riskBand: meta.riskBand,
    compliancePack: meta.compliancePack,
    expectedAction: meta.expectedAction,
    promptHint: meta.promptHint,
  };
}

/**
 * Count scenarios by sector (for filter chips on the scenario picker).
 * The categories here match the `category` field in scenarios.astro.
 */
export const SCENARIO_CATEGORIES = [
  { id: 'all', label: 'الكل', sector: null as Sector | null },
  { id: 'finance', label: 'المالية والبنوك', sector: 'banking' as Sector },
  { id: 'hr', label: 'الموارد البشرية', sector: 'hr' as Sector },
  { id: 'legal', label: 'القانونية والامتثال', sector: 'legal' as Sector },
  { id: 'healthcare', label: 'الرعاية الصحية', sector: 'healthcare' as Sector },
  { id: 'code', label: 'أمن الكود', sector: 'code' as Sector },
  { id: 'government', label: 'الحكومي والمشتريات', sector: 'government' as Sector },
] as const;

// ── Risk band metadata ─────────────────────────────────────────────────────

export const RISK_BAND_LABELS: Record<RiskBand, string> = {
  minimal: 'منخفض جداً',
  low: 'منخفض',
  medium: 'متوسط',
  high: 'عالي',
  critical: 'حرج',
};

export const RISK_BAND_BADGE_CLASS: Record<RiskBand, string> = {
  minimal: 'kernel-badge--minimal',
  low: 'kernel-badge--low',
  medium: 'kernel-badge--medium',
  high: 'kernel-badge--high',
  critical: 'kernel-badge--critical',
};

export const SECTOR_LABELS: Record<Sector, string> = {
  banking: 'البنوك',
  government: 'الحكومي',
  healthcare: 'الرعاية الصحية',
  hr: 'الموارد البشرية',
  legal: 'القانوني',
  finance: 'المالية',
  code: 'أمن الكود',
  telecom: 'الاتصالات',
  manufacturing: 'التصنيع',
  education: 'التعليم',
};

// ── Persistence key (no PII — only an opaque journey id) ───────────────────

/**
 * Key for the sessionStorage where the active scenario metadata is held.
 * No PII, no prompt text — only { scenario, sector, riskBand, stage }.
 */
export const JOURNEY_STORAGE_KEY = 'brightai-kernel-journey';

/** Payload shape persisted across page transitions. */
export interface JourneyContextPayload {
  scenario: string; // scenario id
  sector: Sector;
  riskBand: RiskBand;
  stage: JourneyStageId;
  ts: number; // timestamp ms
}
