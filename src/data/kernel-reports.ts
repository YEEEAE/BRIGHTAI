/**
 * kernel-reports.ts — Deterministic reports dataset for /kernel/reports/ (M23).
 *
 * M23 — Full deterministic generator producing 42 reports + 4 scheduled + 5
 * template versions. No Math.random, no Date.now: a single fixed seed
 * (REPORT_SEED) drives a mulberry32 PRNG, so every build yields byte-identical
 * rows. The same algorithm is mirrored byte-for-byte in
 * public/js/kernel-reports-data.js (browser + Web Worker + Node).
 *
 * Exact count contract (verified by scripts/verify-reports.mjs):
 *   - total reports   = 42
 *   - ready           = 38
 *   - generating      = 1
 *   - scheduled       = 4  (3 active + 1 paused)
 *   - recipients      = 18 (role-based: CISO/DPO/Governance/CTO/Compliance/Audit)
 *   - template versions = 5 (v1.0–v1.4, hash-chained)
 *
 * Report types (7): governance · compliance · audit · risk · custom · pii · connectors
 * Formats (4): PDF · JSON · CSV · XLSX
 * Languages (5): ar · en · fr · es · de
 *
 * Integrity: each report carries a FNV-1a hash chained from the previous
 * report's hash (genesis = 0x00000000). The chain seals every field — any
 * tampered field breaks the link. fnv1a is byte-identical to kernel-hash.js /
 * kernel-audit.ts / kernel-approvals.ts.
 *
 * Prompt 23 features covered:
 *   - governance/compliance/audit/risk/custom report types
 *   - PDF/JSON/CSV formats
 *   - report preview (executive summary auto-generated)
 *   - report builder (widgets: KPI/chart/table/text/page-break)
 *   - 5 languages
 *   - scheduled reports + role recipients
 *   - Trace coverage (each report lists Trace IDs it covers)
 *   - Certificate coverage (each report lists certificates it references)
 *   - report template versions (hash-chained, rollback-safe)
 */

// ── Types ────────────────────────────────────────────────────────────────────

export type KernelReportType =
  | 'governance'
  | 'compliance'
  | 'audit'
  | 'risk'
  | 'custom'
  | 'pii'
  | 'connectors';

export type KernelReportStatus = 'ready' | 'generating' | 'failed';

export type KernelReportFormat = 'PDF' | 'JSON' | 'CSV' | 'XLSX';

export type KernelReportLanguage = 'ar' | 'en' | 'fr' | 'es' | 'de';

export type KernelWidgetType = 'kpi' | 'chart' | 'table' | 'text' | 'page-break';

export interface KernelWidget {
  id: string;
  type: KernelWidgetType;
  label: string;
  /** For kpi widgets: the metric key. */
  metricKey?: string;
  /** For chart widgets: chart kind. */
  chartKind?: 'line' | 'bar' | 'pie' | 'gauge';
  /** For table widgets: columns count. */
  columns?: number;
  /** For text widgets: body text. */
  body?: string;
}

export interface KernelReportTemplate {
  id: string;
  name: string;
  type: KernelReportType;
  widgets: KernelWidget[];
  language: KernelReportLanguage;
}

export interface KernelTemplateVersion {
  version: string;
  createdAt: number;
  createdAtLabel: string;
  note: string;
  hash: string;
  certifiedBy: string | null;
}

export interface KernelReportRow {
  index: number;
  id: string;
  title: string;
  type: KernelReportType;
  typeLabel: string;
  status: KernelReportStatus;
  format: KernelReportFormat;
  language: KernelReportLanguage;
  period: string;
  sizeMb: number;
  createdAt: number;
  createdAtLabel: string;
  /** Role-based recipients (not emails). */
  recipients: string[];
  /** Trace IDs this report covers. */
  traceCoverage: string[];
  traceCoverageCount: number;
  /** Certificate IDs this report references. */
  certificateCoverage: string[];
  certificateCoverageCount: number;
  /** Auto-generated executive summary (3 sentences). */
  executiveSummary: string;
  /** Template version used. */
  templateVersion: string;
  /** Progress for generating reports (0-100). */
  progress: number;
  /** Previous report's hash in the chain. */
  prevHash: string;
  /** FNV-1a hash — integrity seal. */
  hash: string;
}

export interface KernelScheduledReport {
  id: string;
  title: string;
  type: KernelReportType;
  typeLabel: string;
  frequency: string;
  nextRun: string;
  recipients: string[];
  recipientsCount: number;
  status: 'active' | 'paused';
  language: KernelReportLanguage;
}

export interface KernelReportStats {
  total: number;
  ready: number;
  generating: number;
  scheduled: number;
  recipients: number;
  byType: Record<KernelReportType, number>;
  byFormat: Record<KernelReportFormat, number>;
  byLanguage: number;
}

// ── Constants ────────────────────────────────────────────────────────────────

/** Fixed seed — changing it changes the whole dataset. Do not change. */
export const REPORT_SEED = 0x7e3a1c50;

export const REPORT_TOTAL = 42;
export const REPORT_READY = 38;
export const REPORT_GENERATING = 1;
export const REPORT_FAILED = 3;
export const SCHEDULED_TOTAL = 4;
export const SCHEDULED_ACTIVE = 3;
export const SCHEDULED_PAUSED = 1;
export const TEMPLATE_VERSIONS_TOTAL = 5;
export const RECIPIENTS_TOTAL = 18;

/** Time window: 2026-05-01 → 2026-05-31 (UTC). */
const TS_START = Date.UTC(2026, 4, 1, 0, 0, 0);
const TS_END = Date.UTC(2026, 4, 31, 23, 59, 59);

export const REPORT_TYPES: { id: KernelReportType; label: string; icon: string }[] = [
  { id: 'governance', label: 'تقرير حوكمة', icon: '⚖️' },
  { id: 'compliance', label: 'تقرير امتثال', icon: '🛡️' },
  { id: 'audit', label: 'تقرير تدقيق', icon: '📋' },
  { id: 'risk', label: 'تقرير مخاطر', icon: '⚠️' },
  { id: 'custom', label: 'تقرير مخصص', icon: '⚙️' },
  { id: 'pii', label: 'كشف PII', icon: '🔒' },
  { id: 'connectors', label: 'الموصلات', icon: '🔌' },
];

export const REPORT_FORMATS: KernelReportFormat[] = ['PDF', 'JSON', 'CSV', 'XLSX'];

export const REPORT_LANGUAGES: { id: KernelReportLanguage; label: string; native: string }[] = [
  { id: 'ar', label: 'العربية', native: 'العربية' },
  { id: 'en', label: 'English', native: 'English' },
  { id: 'fr', label: 'Français', native: 'Français' },
  { id: 'es', label: 'Español', native: 'Español' },
  { id: 'de', label: 'Deutsch', native: 'Deutsch' },
];

export const REPORT_RECIPIENTS: { id: string; label: string; role: string }[] = [
  { id: 'ciso', label: 'CISO', role: 'الرئيس التنفيذي للأمن السيبراني' },
  { id: 'dpo', label: 'DPO', role: 'مسؤول حماية البيانات' },
  { id: 'governance', label: 'مكتب الحوكمة', role: 'لجنة الحوكمة والمخاطر' },
  { id: 'cto', label: 'CTO', role: 'الرئيس التنفيذي للتقنية' },
  { id: 'compliance', label: 'فريق الامتثال', role: 'مدير الامتثال' },
  { id: 'audit', label: 'التدقيق الداخلي', role: 'مدير التدقيق الداخلي' },
];

export const REPORT_WIDGETS: { type: KernelWidgetType; label: string; icon: string }[] = [
  { type: 'kpi', label: 'مؤشر KPI', icon: '📊' },
  { type: 'chart', label: 'مخطط', icon: '📈' },
  { type: 'table', label: 'جدول', icon: '📋' },
  { type: 'text', label: 'نص', icon: '📝' },
  { type: 'page-break', label: 'فاصل صفحة', icon: '📄' },
];

// ── PRNG + Hash (byte-identical to kernel-approvals.ts) ──────────────────────

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function fnv1a(str: string): string {
  const s = String(str == null ? '' : str);
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return '0x' + h.toString(16).padStart(8, '0');
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatTsLabel(ts: number): string {
  const d = new Date(ts);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  const h = String(d.getUTCHours()).padStart(2, '0');
  const min = String(d.getUTCMinutes()).padStart(2, '0');
  return `${y}/${m}/${day} ${h}:${min}`;
}

function formatTsDate(ts: number): string {
  const d = new Date(ts);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function pick<T>(arr: readonly T[], rand: () => number): T {
  return arr[Math.floor(rand() * arr.length)];
}

function pickN<T>(arr: readonly T[], n: number, rand: () => number): T[] {
  const copy = [...arr];
  const out: T[] = [];
  for (let i = 0; i < n && copy.length > 0; i += 1) {
    const idx = Math.floor(rand() * copy.length);
    out.push(copy.splice(idx, 1)[0]);
  }
  return out;
}

// ── Report title templates per type ──────────────────────────────────────────

const TITLE_TEMPLATES: Record<KernelReportType, string[]> = {
  governance: [
    'تقرير حوكمة AI التوليدي — {period}',
    'تقرير حوكمة AI الشهري — {period}',
    'تقرير حوكمة AI الربع سنوي — {period}',
    'تقرير حوكمة AI السنوي — {period}',
  ],
  compliance: [
    'تقرير جاهزية PDPL — {period}',
    'تقرير امتثال NCA ECC — {period}',
    'تقرير امتثال SDAIA — {period}',
    'تقرير امتثال SFDA — {period}',
    'تقرير امتثال SAMA — {period}',
    'تقرير امتثال ISO 42001 — {period}',
  ],
  audit: [
    'تدقيق NCA ECC — {period}',
    'تدقيق PDPL — {period}',
    'تدقيق سجل AI — {period}',
    'تدقيق الموصلات — {period}',
  ],
  risk: [
    'تقرير المخاطر الشهري — {period}',
    'تقرير المخاطر الربع سنوي — {period}',
    'تحليل المخاطر عالية المستوى — {period}',
    'تقرير المخاطر التشغيلية — {period}',
  ],
  custom: [
    'تقرير مخصص — {period}',
    'تحليل استخدام AI — {period}',
    'تقرير مخصص للإدارة — {period}',
  ],
  pii: [
    'كشف PII للموارد البشرية — {period}',
    'كشف PII للعملاء — {period}',
    'كشف PII للمرضى — {period}',
    'كشف PII الشامل — {period}',
  ],
  connectors: [
    'تقرير الموصلات والاستخدام — {period}',
    'تقرير صحة الموصلات — {period}',
    'تقرير مزامنة الموصلات — {period}',
  ],
};

const PERIODS = [
  'Q2 2026',
  'مايو 2026',
  'يونيو 2026',
  'الأسبوع 21',
  'الأسبوع 22',
  'آخر 30 يوم',
  'آخر 7 أيام',
  '2026 كامل',
];

const EXECUTIVE_SUMMARIES: Record<KernelReportType, string[]> = {
  governance: [
    'يغطي هذا التقرير حوكمة AI التوليدي في {period}. تم فحص {traces} طلب، مع 89.8% سماح و3.1% حظر. الالتزام بسياسات SDAIA مرتفع.',
    'تلخص هذه الوثيقة نشاط حوكمة AI لـ {period}. {traces} طلب تمت معالجته، مع تطبيق 11 سياسة. لا توجد حوادث حرجة.',
  ],
  compliance: [
    'يوضح هذا التقرير حالة الامتثال للأطر التنظيمية في {period}. النتيجة الإجمالية 83% مع 4 أطر مكتملة و2 جزئية.',
    'تقرير امتثال شامل لـ {period}. يغطي PDPL وNCA ECC وSDAIA وSFDA. {traces} طلب موثّق كدليل امتثال.',
  ],
  audit: [
    'سجل تدقيق كامل لـ {period}. {traces} سجل موثّق بسلسلة هاش غير قابلة للتعديل. تم التحقق من سلامة السلسلة.',
    'تقرير تدقيق لـ {period}. يغطي {traces} قرار AI مع Trace ID فريد لكل قرار. سلسلة الهاش سليمة.',
  ],
  risk: [
    'تحليل المخاطر لـ {period}. {traces} طلب فُحص، 382 محظور، 87% متوسط المخاطر. أعلى مخاطر في قسم التسويق.',
    'تقرير المخاطر الشهري لـ {period}. توزيع المخاطر: 12 حرج، 34 مرتفع، 68 متوسط. {traces} طلب مغطى.',
  ],
  custom: [
    'تقرير مخصص لـ {period}. تم بناؤه باستخدام widgets مخصصة. يغطي {traces} طلب.',
    'تحليل مخصص لـ {period}. يجمع بين مؤشرات حوكمة وامتثال ومخاطر. {traces} طلب في النطاق.',
  ],
  pii: [
    'كشف PII شامل لـ {period}. {traces} طلب فُحص، 1,554 يحتوي PII. الأنواع الأكثر كشفًا: الهوية والجوال.',
    'تقرير PII لـ {period}. يغطي {traces} طلب، مع 12.4% نسبة كشف. تم تطبيق التعمية على جميع الحالات.',
  ],
  connectors: [
    'تقرير الموصلات لـ {period}. 8 موصلات نشطة، 2,148 استعلام. زمن الاستجابة الوسيط 128ms.',
    'حالة الموصلات لـ {period}. {traces} طلب عبر الموصلات. Salesforce يحتاج تجديد التوكن.',
  ],
};

// ── Template versions (hash-chained) ─────────────────────────────────────────

export function buildTemplateVersions(): KernelTemplateVersion[] {
  const rand = mulberry32(REPORT_SEED ^ 0x7e65);
  const versions: KernelTemplateVersion[] = [];
  const notes = [
    'الإصدار الأول — widgets أساسية (KPI + table)',
    'إضافة widgets: chart + text + page-break',
    'إضافة 5 لغات + role recipients',
    'إضافة Trace coverage + Certificate coverage',
    'إضافة executive summary مولّد آليًا',
  ];
  let prev = '0x00000000';
  for (let i = 0; i < TEMPLATE_VERSIONS_TOTAL; i += 1) {
    const ts = TS_START + Math.floor(rand() * (TS_END - TS_START));
    const version = `1.${i}`;
    const canonical = `${version}|${ts}|${notes[i]}`;
    const hash = fnv1a(prev + '|' + canonical);
    versions.push({
      version,
      createdAt: ts,
      createdAtLabel: formatTsLabel(ts),
      note: notes[i],
      hash,
      certifiedBy: i < 2 ? 'CERT-2026-001' : null,
    });
    prev = hash;
  }
  return versions;
}

// ── Report rows (deterministic) ──────────────────────────────────────────────

function reportCanonical(r: {
  id: string;
  title: string;
  type: KernelReportType;
  status: KernelReportStatus;
  format: KernelReportFormat;
  language: KernelReportLanguage;
  period: string;
  sizeMb: number;
  ts: number;
  recipients: string[];
  traceCoverage: string[];
  certificateCoverage: string[];
  templateVersion: string;
  progress: number;
}): string {
  return [
    r.id,
    r.title,
    r.type,
    r.status,
    r.format,
    r.language,
    r.period,
    r.sizeMb,
    r.ts,
    r.recipients.join(','),
    r.traceCoverage.join(','),
    r.certificateCoverage.join(','),
    r.templateVersion,
    r.progress,
  ].join('|');
}

export function buildReportRows(): KernelReportRow[] {
  const rand = mulberry32(REPORT_SEED);
  const total = REPORT_TOTAL;
  const span = TS_END - TS_START;

  // Pre-build status array with exact counts, then shuffle.
  const statuses: KernelReportStatus[] = [];
  for (let i = 0; i < REPORT_READY; i += 1) statuses.push('ready');
  for (let i = 0; i < REPORT_GENERATING; i += 1) statuses.push('generating');
  for (let i = 0; i < REPORT_FAILED; i += 1) statuses.push('failed');
  // Fisher-Yates shuffle (deterministic).
  for (let i = statuses.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    const tmp = statuses[i];
    statuses[i] = statuses[j];
    statuses[j] = tmp;
  }

  const rows: KernelReportRow[] = [];
  let prev = '0x00000000';

  for (let i = 0; i < total; i += 1) {
    const status = statuses[i];
    const type = pick(REPORT_TYPES, rand);
    const format = pick(REPORT_FORMATS, rand);
    const language = pick(REPORT_LANGUAGES, rand);
    const period = pick(PERIODS, rand);
    const titlePool = TITLE_TEMPLATES[type.id];
    const titleTemplate = titlePool[Math.floor(rand() * titlePool.length)];
    const title = titleTemplate.replace('{period}', period);

    const ts = TS_START + Math.floor(rand() * span);
    const sizeMb = Math.round((0.3 + rand() * 4.5) * 10) / 10;

    // Recipients: 1-4 role-based.
    const recipientsCount = 1 + Math.floor(rand() * 4);
    const recipients = pickN(REPORT_RECIPIENTS, recipientsCount, rand).map((r) => r.label);

    // Trace coverage: 5-50 Trace IDs.
    const traceCount = 5 + Math.floor(rand() * 46);
    const traceCoverage: string[] = [];
    for (let t = 0; t < traceCount; t += 1) {
      traceCoverage.push('AI-2026-' + String(10000 + Math.floor(rand() * 9000)));
    }

    // Certificate coverage: 0-3 certificates.
    const certCount = Math.floor(rand() * 4);
    const certificateCoverage: string[] = [];
    for (let c = 0; c < certCount; c += 1) {
      certificateCoverage.push('CERT-2026-' + String(1 + Math.floor(rand() * 99)).padStart(3, '0'));
    }

    // Executive summary.
    const summaryPool = EXECUTIVE_SUMMARIES[type.id];
    const summaryTemplate = summaryPool[Math.floor(rand() * summaryPool.length)];
    const executiveSummary = summaryTemplate
      .replace('{period}', period)
      .replace('{traces}', String(traceCount));

    // Template version.
    const templateVersion = `1.${Math.floor(rand() * TEMPLATE_VERSIONS_TOTAL)}`;

    // Progress for generating reports.
    const progress = status === 'generating' ? 30 + Math.floor(rand() * 60) : 100;

    const id = 'r-' + String(i + 1).padStart(3, '0');

    const raw = {
      id,
      title,
      type: type.id,
      status,
      format,
      language: language.id,
      period,
      sizeMb,
      ts,
      recipients,
      traceCoverage,
      certificateCoverage,
      templateVersion,
      progress,
    };

    const hash = fnv1a(prev + '|' + reportCanonical(raw));

    rows.push({
      index: i,
      id,
      title,
      type: type.id,
      typeLabel: type.label,
      status,
      format,
      language: language.id,
      period,
      sizeMb,
      createdAt: ts,
      createdAtLabel: formatTsLabel(ts),
      recipients,
      traceCoverage,
      traceCoverageCount: traceCount,
      certificateCoverage,
      certificateCoverageCount: certCount,
      executiveSummary,
      templateVersion,
      progress,
      prevHash: prev,
      hash,
    });

    prev = hash;
  }

  return rows;
}

// ── Scheduled reports (deterministic) ────────────────────────────────────────

export function buildScheduledReports(): KernelScheduledReport[] {
  const rand = mulberry32(REPORT_SEED ^ 0x5c1);
  const scheduled: KernelScheduledReport[] = [];
  const freqs = ['يومي', 'أسبوعي', 'شهري', 'ربع سنوي'];
  const nextRuns = [
    'غدًا 09:00',
    'الأحد 09:00',
    'الاثنين 08:00',
    '2026-07-01',
    '2026-08-15',
  ];

  for (let i = 0; i < SCHEDULED_TOTAL; i += 1) {
    const type = pick(REPORT_TYPES, rand);
    const language = pick(REPORT_LANGUAGES, rand);
    const recipientsCount = 1 + Math.floor(rand() * 4);
    const recipients = pickN(REPORT_RECIPIENTS, recipientsCount, rand).map((r) => r.label);
    const status: 'active' | 'paused' = i < SCHEDULED_ACTIVE ? 'active' : 'paused';

    scheduled.push({
      id: 'sch-' + String(i + 1),
      title: `${type.label} — ${pick(freqs, rand)}`,
      type: type.id,
      typeLabel: type.label,
      frequency: pick(freqs, rand),
      nextRun: pick(nextRuns, rand),
      recipients,
      recipientsCount: recipients.length,
      status,
      language: language.id,
    });
  }

  return scheduled;
}

// ── Report stats (deterministic) ─────────────────────────────────────────────

export function buildReportStats(): KernelReportStats {
  const rows = buildReportRows();
  const scheduled = buildScheduledReports();

  const byType: Record<KernelReportType, number> = {
    governance: 0,
    compliance: 0,
    audit: 0,
    risk: 0,
    custom: 0,
    pii: 0,
    connectors: 0,
  };
  const byFormat: Record<KernelReportFormat, number> = {
    PDF: 0,
    JSON: 0,
    CSV: 0,
    XLSX: 0,
  };

  let ready = 0;
  let generating = 0;
  const allRecipients = new Set<string>();

  for (let i = 0; i < rows.length; i += 1) {
    const r = rows[i];
    byType[r.type] += 1;
    byFormat[r.format] += 1;
    if (r.status === 'ready') ready += 1;
    else if (r.status === 'generating') generating += 1;
    for (let j = 0; j < r.recipients.length; j += 1) {
      allRecipients.add(r.recipients[j]);
    }
  }

  for (let i = 0; i < scheduled.length; i += 1) {
    for (let j = 0; j < scheduled[i].recipients.length; j += 1) {
      allRecipients.add(scheduled[i].recipients[j]);
    }
  }

  return {
    total: rows.length,
    ready,
    generating,
    scheduled: scheduled.length,
    recipients: allRecipients.size,
    byType,
    byFormat,
    byLanguage: REPORT_LANGUAGES.length,
  };
}

// ── Default report templates (for builder) ───────────────────────────────────

export function buildDefaultTemplates(): KernelReportTemplate[] {
  return REPORT_TYPES.map((t, idx) => ({
    id: 'tpl-' + String(idx + 1).padStart(2, '0'),
    name: `${t.label} — قالب افتراضي`,
    type: t.id,
    language: 'ar',
    widgets: [
      { id: 'w-1', type: 'kpi' as KernelWidgetType, label: 'إجمالي الطلبات', metricKey: 'total' },
      { id: 'w-2', type: 'kpi' as KernelWidgetType, label: 'المسموح', metricKey: 'allowed' },
      { id: 'w-3', type: 'kpi' as KernelWidgetType, label: 'المحظور', metricKey: 'blocked' },
      { id: 'w-4', type: 'chart' as KernelWidgetType, label: 'الطلبات عبر الزمن', chartKind: 'line' as const },
      { id: 'w-5', type: 'table' as KernelWidgetType, label: 'أعلى الأقسام', columns: 3 },
      { id: 'w-6', type: 'text' as KernelWidgetType, label: 'ملخص تنفيذي', body: 'ملخص تنفيذي مولّد آليًا.' },
      { id: 'w-7', type: 'page-break' as KernelWidgetType, label: 'فاصل صفحة' },
    ],
  }));
}