/**
 * kernel-evidence.ts — Deterministic evidence dataset for /kernel/evidence/ (REPORTS-15 + M22).
 *
 * Canonical-split (2026-08-09): REPLACES the inline 12-item array + inline ~52KB
 * engine that lived inside evidence.astro with a full deterministic generator,
 * mirroring the kernel canonical pattern (approvals/audit/replay/stats/reports).
 * The .astro page now imports buildEvidenceRows()/buildEvidenceStats() from here;
 * the browser/worker/node runtime gets the byte-identical mirror at
 * public/js/kernel-evidence-data.js (UMD). A verify gate at
 * scripts/verify-evidence.mjs locks the contract (determinism + count matrix +
 * TS↔JS parity + chain validity + hygiene).
 *
 * Exact count contract (must never drift — verified by scripts/verify-evidence.mjs):
 *   - total            = 12
 *   - allowed          = 6
 *   - blocked          = 2
 *   - pending_approval = 2
 *   - approved         = 1
 *   - draft            = 1
 *
 * Determinism strategy: the 12 published items are encoded verbatim as a frozen
 * SEED_ITEMS array (same ids, traceIds, Arabic-Indic-digit dates, hashes, sizes,
 * tags, certificates, retention labels — so published content is preserved
 * exactly). A FNV-1a hash chain is then computed deterministically over the
 * canonical form of each item (genesis = '0x00000000'), so the chain is
 * tamper-evident and reproducible across builds without changing any visible
 * value. EVIDENCE_SEED drives mulberry32 for the interactive generators
 * (generateNew / batch) inside the engine — not for reproducing the literal
 * field values here.
 *
 * Integrity: each row carries prevHash + hash. hash = fnv1a(prevHash + '|' +
 * evidenceCanonical(row)). The canonical form seals every decision-relevant
 * field (id, traceId, title, query, status, riskLevel, riskScore, sector, pack,
 * size, createdAt, signedAt, tags, certificateId, retention). fnv1a is
 * byte-identical to kernel-hash.js / kernel-audit.ts / kernel-approvals.ts /
 * kernel-datasets.ts.
 *
 * Determinism guarantee between TS (build) and JS (browser/worker):
 *   - No Math.random, no Date.now, no toLocaleString, no fetch.
 *   - mulberry32 is deterministic across JS engines (Math.imul, >>> 0).
 *   - All Arabic-Indic-digit strings are stored verbatim (no locale formatting).
 *
 * Published-content invariant (agent.md §2.1): the Arabic text in SEED_ITEMS —
 * titles, queries, dates, retention labels — is published content indexed by
 * search engines. Do NOT "correct" Saudi dialect or reformat the digits.
 */

// ── Status / risk types ──────────────────────────────────────────────────

export type EvidenceStatus =
  | 'allowed'
  | 'blocked'
  | 'pending_approval'
  | 'approved'
  | 'draft';

export type EvidenceRiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface EvidenceItem {
  id: string;
  traceId: string;
  title: string;
  query: string;
  status: EvidenceStatus;
  riskLevel: EvidenceRiskLevel;
  riskScore: number;
  sector: string;
  pack: string;
  hash: string;
  prevHash: string;
  signedAt: string | null;
  size: string;
  createdAt: string;
  tags: string[];
  certificateId: string;
  retention: string;
}

export interface EvidenceStats {
  total: number;
  allowed: number;
  blocked: number;
  pending_approval: number;
  approved: number;
  draft: number;
  totalSizeKb: number;
  packCount: number;
}

// ── Seed + counts ────────────────────────────────────────────────────────

/** Fixed seed — drives mulberry32 for the interactive (batch/generate) stream only. */
export const EVIDENCE_SEED = 0xe1d3a5c7;

export const EVIDENCE_TOTAL = 12;
export const EVIDENCE_ALLOWED = 6;
export const EVIDENCE_BLOCKED = 2;
export const EVIDENCE_PENDING_APPROVAL = 2;
export const EVIDENCE_APPROVED = 1;
export const EVIDENCE_DRAFT = 1;

/** Fixed "now" anchor for any time-derived interactive output (ms epoch). */
export const EVIDENCE_NOW = Date.UTC(2026, 6, 6, 18, 0, 0);

// ── Filter / label maps (shared with the page) ───────────────────────────

export interface FilterOption {
  value: string;
  label: string;
}

export const SECTORS: readonly FilterOption[] = [
  { value: '', label: 'كل القطاعات' },
  { value: 'banking', label: 'البنوك' },
  { value: 'government', label: 'الجهات الحكومية' },
  { value: 'healthcare', label: 'الرعاية الصحية' },
  { value: 'manufacturing', label: 'الصناعة' },
  { value: 'telecom', label: 'الاتصالات' },
];

export const COMPLIANCE_PACKS: readonly FilterOption[] = [
  { value: '', label: 'كل الحزم' },
  { value: 'pdpl', label: 'PDPL' },
  { value: 'nca', label: 'NCA ECC' },
  { value: 'sdaia', label: 'SDAIA' },
  { value: 'sfda', label: 'SFDA' },
  { value: 'sama', label: 'SAMA' },
  { value: 'iso42001', label: 'ISO 42001' },
  { value: 'iso27001', label: 'ISO 27001' },
];

export const TAGS: readonly FilterOption[] = [
  { value: '', label: 'كل الوسوم' },
  { value: 'audit', label: 'تدقيق' },
  { value: 'breach', label: 'اختراق' },
  { value: 'hr', label: 'موارد بشرية' },
  { value: 'fintech', label: 'تقنية مالية' },
  { value: 'medical', label: 'طبي' },
];

export const PACK_LABEL: Readonly<Record<string, string>> = {
  pdpl: 'PDPL',
  nca: 'NCA ECC',
  sdaia: 'SDAIA',
  sfda: 'SFDA',
  sama: 'SAMA',
  iso42001: 'ISO 42001',
  iso27001: 'ISO 27001',
};

export const SECTOR_LABEL: Readonly<Record<string, string>> = {
  banking: 'البنوك',
  government: 'الحكومة',
  healthcare: 'الرعاية الصحية',
  manufacturing: 'الصناعة',
  telecom: 'الاتصالات',
};

// ── Deterministic primitives (byte-identical to kernel-approvals.ts) ─────

/**
 * mulberry32 — deterministic 32-bit PRNG. Identical across TS/JS engines.
 * Byte-identical to kernel-approvals.ts / kernel-audit.ts mulberry32().
 */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * FNV-1a 32-bit → '0x' + 8 hex. Byte-identical to kernel-hash.js fnv1a().
 */
export function fnv1a(str: string): string {
  const s = String(str == null ? '' : str);
  let h = 2166136261;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return '0x' + (h >>> 0).toString(16).padStart(8, '0');
}

/** Deterministic Fisher–Yates shuffle (in-place) using the given RNG. */
export function shuffle<T>(arr: T[], rand: () => number): T[] {
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  return arr;
}

// ── Signature helpers (shared with the page) ─────────────────────────────

export function signatureClass(item: Pick<EvidenceItem, 'signedAt' | 'status'>): string {
  if (!item.signedAt) return 'kernel-evidence-item__signature--pending';
  if (item.status === 'draft') return 'kernel-evidence-item__signature--draft';
  return '';
}

export function signatureText(item: Pick<EvidenceItem, 'signedAt' | 'status'>): string {
  if (!item.signedAt) return 'بانتظار التوقيع';
  if (item.status === 'draft') return 'مسودة — غير موقّعة';
  return 'موقّع رقمياً';
}

// ── Canonical form (what the hash chain seals) ───────────────────────────

/**
 * Canonical string sealed by the hash chain. MUST match the JS mirror.
 * Includes every decision-relevant field so any tampering breaks the link.
 * Excludes prevHash/hash (they are the chain itself) and the id is included
 * so reordering or swapping two items also breaks the chain.
 */
export function evidenceCanonical(
  row: Omit<EvidenceItem, 'prevHash' | 'hash'>,
): string {
  return [
    row.id,
    row.traceId,
    row.title,
    row.query,
    row.status,
    row.riskLevel,
    String(row.riskScore),
    row.sector,
    row.pack,
    row.size,
    row.createdAt,
    row.signedAt === null ? '' : row.signedAt,
    row.tags.join(','),
    row.certificateId,
    row.retention,
  ].join('|');
}

// ── The 12 published items (seed — do NOT alter Arabic text or digits) ───

/**
 * SEED_ITEMS — the 12 published evidence items, encoded verbatim.
 *
 * PUBLISHED-CONTENT INVARIANT: titles, queries, signedAt/createdAt dates
 * (Arabic-Indic digits ٠-٩), retention labels, tags, and certificate ids are
 * part of the published page indexed by search engines. Do not "correct" the
 * Saudi dialect or reformat the digits. The hash chain is computed over the
 * canonical form of these exact values.
 *
 * Order: newest-first by id descending (10493 → 10465), matching the published
 * render order. The chain is computed in THIS order (not re-sorted) so the
 * genesis links to the topmost card visible to the user.
 */
const SEED_ITEMS: Omit<EvidenceItem, 'prevHash' | 'hash'>[] = [
  {
    id: 'EVD-2026-10493',
    traceId: 'AI-2026-10493',
    title: 'محاولة تصدير قائمة 2,400 عميل',
    query: 'تصدير قائمة 2,400 عميل مع PII (اسم + هاتف + بريد)',
    status: 'blocked',
    riskLevel: 'critical',
    riskScore: 87,
    sector: 'banking',
    pack: 'pdpl',
    signedAt: '٢٠٢٦/٠٧/٠٦ ١٧:٤٢',
    size: '142KB',
    createdAt: '٢٠٢٦/٠٧/٠٦',
    tags: ['audit', 'fintech'],
    certificateId: 'CERT-2026-0841',
    retention: '5 سنوات — PDPL م.21',
  },
  {
    id: 'EVD-2026-10492',
    traceId: 'AI-2026-10492',
    title: 'استعلام تلخيصي عن سياسة الإجازات',
    query: 'تلخيص لوائح الإجازات الداخلية',
    status: 'allowed',
    riskLevel: 'low',
    riskScore: 12,
    sector: 'government',
    pack: 'sdaia',
    signedAt: '٢٠٢٦/٠٧/٠٦ ١٧:٣٨',
    size: '38KB',
    createdAt: '٢٠٢٦/٠٧/٠٦',
    tags: ['hr'],
    certificateId: 'CERT-2026-0840',
    retention: 'سنتان — NCA ECC-3',
  },
  {
    id: 'EVD-2026-10491',
    traceId: 'AI-2026-10491',
    title: 'تشغيل نموذج على سجلات طبية',
    query: 'تحليل 580 سجل طبي مع PII متعدد',
    status: 'pending_approval',
    riskLevel: 'high',
    riskScore: 72,
    sector: 'healthcare',
    pack: 'sfda',
    signedAt: null,
    size: '86KB',
    createdAt: '٢٠٢٦/٠٧/٠٦',
    tags: ['medical'],
    certificateId: 'CERT-2026-0839',
    retention: '7 سنوات — SFDA م.19',
  },
  {
    id: 'EVD-2026-10490',
    traceId: 'AI-2026-10490',
    title: 'تحليل عقد مورد',
    query: 'مراجعة عقد شراء من مورّد خارجي',
    status: 'approved',
    riskLevel: 'medium',
    riskScore: 28,
    sector: 'manufacturing',
    pack: 'iso27001',
    signedAt: '٢٠٢٦/٠٧/٠٦ ١٧:٢٤',
    size: '124KB',
    createdAt: '٢٠٢٦/٠٧/٠٦',
    tags: ['audit'],
    certificateId: 'CERT-2026-0838',
    retention: '5 سنوات — ISO 27001 A.5.1',
  },
  {
    id: 'EVD-2026-10489',
    traceId: 'AI-2026-10489',
    title: 'استعلام لوائح البنك المركزي',
    query: 'بحث عن ضوابط SAMA الجديدة',
    status: 'allowed',
    riskLevel: 'low',
    riskScore: 18,
    sector: 'banking',
    pack: 'sama',
    signedAt: '٢٠٢٦/٠٧/٠٦ ١٧:٢٠',
    size: '42KB',
    createdAt: '٢٠٢٦/٠٧/٠٦',
    tags: ['fintech'],
    certificateId: 'CERT-2026-0837',
    retention: '5 سنوات — SAMA CSF-2',
  },
  {
    id: 'EVD-2026-10488',
    traceId: 'AI-2026-10488',
    title: 'دمج نموذج ثالث',
    query: 'جرّب دمج نموذج Cohere مع PII',
    status: 'pending_approval',
    riskLevel: 'high',
    riskScore: 64,
    sector: 'telecom',
    pack: 'nca',
    signedAt: null,
    size: '94KB',
    createdAt: '٢٠٢٦/٠٧/٠٦',
    tags: ['audit'],
    certificateId: 'CERT-2026-0836',
    retention: '5 سنوات — NCA ECC-2',
  },
  {
    id: 'EVD-2026-10487',
    traceId: 'AI-2026-10487',
    title: 'تصدير قائمة خفيفة (320)',
    query: 'تصدير قائمة 320 عميل بدون PII',
    status: 'allowed',
    riskLevel: 'low',
    riskScore: 8,
    sector: 'banking',
    pack: 'pdpl',
    signedAt: '٢٠٢٦/٠٧/٠٦ ١٧:٠٨',
    size: '28KB',
    createdAt: '٢٠٢٦/٠٧/٠٦',
    tags: ['fintech'],
    certificateId: 'CERT-2026-0835',
    retention: '5 سنوات — PDPL م.21',
  },
  {
    id: 'EVD-2026-10486',
    traceId: 'AI-2026-10486',
    title: 'فشل اتصال ERP',
    query: 'timeout عند محاولة جلب بيانات من SAP',
    status: 'draft',
    riskLevel: 'medium',
    riskScore: 36,
    sector: 'manufacturing',
    pack: 'iso42001',
    signedAt: null,
    size: '18KB',
    createdAt: '٢٠٢٦/٠٧/٠٦',
    tags: ['audit'],
    certificateId: '—',
    retention: 'سنتان — ISO 42001 A.7.2',
  },
  {
    id: 'EVD-2026-10485',
    traceId: 'AI-2026-10485',
    title: 'اختبار سيناريو تلخيصي',
    query: 'اختبار سيناريو تلخيص عمليات',
    status: 'allowed',
    riskLevel: 'low',
    riskScore: 22,
    sector: 'government',
    pack: 'sdaia',
    signedAt: '٢٠٢٦/٠٧/٠٦ ١٦:٥٦',
    size: '52KB',
    createdAt: '٢٠٢٦/٠٧/٠٦',
    tags: ['hr'],
    certificateId: 'CERT-2026-0834',
    retention: 'سنتان — SDAIA م.7',
  },
  {
    id: 'EVD-2026-10484',
    traceId: 'AI-2026-10484',
    title: 'استعلام عادي بدون PII',
    query: 'استعلام عام عن سياسات HR',
    status: 'allowed',
    riskLevel: 'low',
    riskScore: 8,
    sector: 'government',
    pack: 'iso27001',
    signedAt: '٢٠٢٦/٠٧/٠٦ ١٦:٤٨',
    size: '24KB',
    createdAt: '٢٠٢٦/٠٧/٠٦',
    tags: ['hr'],
    certificateId: 'CERT-2026-0833',
    retention: 'سنتان — ISO 27001 A.5.1',
  },
  {
    id: 'EVD-2026-10470',
    traceId: 'AI-2026-10470',
    title: 'استعلام بهوية عميل (مرفوض)',
    query: 'محاولة الوصول لبيانات عميل برقم هوية',
    status: 'blocked',
    riskLevel: 'critical',
    riskScore: 94,
    sector: 'banking',
    pack: 'pdpl',
    signedAt: '٢٠٢٦/٠٧/٠٦ ١٥:١٢',
    size: '68KB',
    createdAt: '٢٠٢٦/٠٧/٠٦',
    tags: ['audit', 'breach'],
    certificateId: 'CERT-2026-0832',
    retention: '5 سنوات — PDPL م.21',
  },
  {
    id: 'EVD-2026-10465',
    traceId: 'AI-2026-10465',
    title: 'تلخيص تقرير حوكمة شهري',
    query: 'تلخيص تقرير حوكمة شهري تلقائي',
    status: 'allowed',
    riskLevel: 'low',
    riskScore: 14,
    sector: 'telecom',
    pack: 'iso42001',
    signedAt: '٢٠٢٦/٠٧/٠٥ ١٨:٣٠',
    size: '76KB',
    createdAt: '٢٠٢٦/٠٧/٠٥',
    tags: ['audit'],
    certificateId: 'CERT-2026-0831',
    retention: 'سنتان — ISO 42001 A.5.2',
  },
];

// ── Builders ─────────────────────────────────────────────────────────────

/**
 * Builds the full deterministic dataset. Pure — same output on every call.
 * Renders in SEED_ITEMS order (newest id first). The hash chain is computed
 * in the same render order so genesis links to the topmost card.
 */
export function buildEvidenceRows(): EvidenceItem[] {
  const rows: EvidenceItem[] = SEED_ITEMS.map((seed) => ({
    ...seed,
    prevHash: '0x00000000',
    hash: '0x00000000',
  }));

  let prev = '0x00000000';
  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i];
    row.prevHash = prev;
    row.hash = fnv1a(prev + '|' + evidenceCanonical(row));
    prev = row.hash;
  }
  return rows;
}

/** Deterministic stats — recomputed from the generated rows each build. */
export function buildEvidenceStats(): EvidenceStats {
  const rows = buildEvidenceRows();
  let allowed = 0;
  let blocked = 0;
  let pending_approval = 0;
  let approved = 0;
  let draft = 0;
  let totalSizeKb = 0;
  const packs = new Set<string>();
  for (let i = 0; i < rows.length; i += 1) {
    const r = rows[i];
    if (r.status === 'allowed') allowed += 1;
    else if (r.status === 'blocked') blocked += 1;
    else if (r.status === 'pending_approval') pending_approval += 1;
    else if (r.status === 'approved') approved += 1;
    else draft += 1;
    const kb = parseFloat((r.size || '').replace(/[^\d.]/g, ''));
    if (!Number.isNaN(kb)) totalSizeKb += kb;
    packs.add(r.pack);
  }
  return {
    total: rows.length,
    allowed,
    blocked,
    pending_approval,
    approved,
    draft,
    totalSizeKb: Math.round(totalSizeKb),
    packCount: packs.size,
  };
}
