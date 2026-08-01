/**
 * kernel-audit.ts — Deterministic audit dataset for /kernel/audit/ (REPORTS-15).
 *
 * REPORTS-15 update — REPLACED the 10 seeded rows with a FULL deterministic
 * generator producing 12,483 rows at BUILD time. No Math.random, no Date.now:
 * a single fixed seed (AUDIT_SEED) drives a mulberry32 PRNG, so every build
 * yields byte-identical rows. The same algorithm is mirrored byte-for-byte in
 * public/js/kernel-audit-data.js (browser + Web Worker + Node) so the client
 * can reconstruct the exact dataset deterministically without shipping a 2MB
 * JSON payload in the HTML (keeps the 30KB HTML budget).
 *
 * Exact KPI contract (must never drift — verified by scripts/verify-audit.mjs):
 *   - total        = 12,483 rows
 *   - allowed      = 11,210  (713 of them human-approved → approvals metric)
 *   - blocked      = 382
 *   - pending      = 841
 *   - error        = 50
 *   - approvals    = 1,554   (= 841 pending + 713 human-approved allowed)
 *
 * Integrity: each row carries a FNV-1a hash chained from the previous row's
 * hash (genesis = 0x00000000). The browser re-computes the chain and compares
 * — any tampered field (risk, action, ts, user, status) breaks the link.
 * fnv1a is byte-identical to kernel-hash.js / kernel-datasets.ts.
 *
 * Determinism guarantee between TS (build) and JS (browser/worker):
 *   - mulberry32 is deterministic across JS engines (Math.imul, >>> 0).
 *   - RNG call order is fixed; the statuses array is pre-built with exact
 *     counts then Fisher–Yates-shuffled with the same RNG stream.
 *   - Timestamps are UTC-based (Date.UTC), formatted manually — no locale,
 *     no toLocaleString, so outputs match across environments.
 */
export type KernelAuditStatus = 'allowed' | 'blocked' | 'pending_approval' | 'error';

export interface KernelAuditRow {
  /** 0-based index in the time-ascending build order. */
  index: number;
  /** UTC epoch ms (deterministic). */
  ts: number;
  /** Display label, Latin digits, UTC — '2026/07/06 17:42'. */
  tsLabel: string;
  /** ISO date for date filters — '2026-07-06'. */
  tsDate: string;
  userId: string;
  userLabel: string;
  role: string;
  action: string;
  risk: number;
  status: KernelAuditStatus;
  /** True only when this allowed row went through human approval. */
  humanApproved: boolean;
  traceId: string;
  /** Whether the row is flagged as an anomaly (blocked + risk >= 90). */
  anomaly: boolean;
  /** Previous row's hash in the chain (genesis = 0x00000000). */
  prevHash: string;
  /** FNV-1a(prevHash + '|' + canonical) — the integrity seal. */
  hash: string;
}

export interface KernelAuditStats {
  total: number;
  allowed: number;
  blocked: number;
  pending: number;
  error: number;
  /** 1,554 = pending + human-approved allowed rows. */
  approvals: number;
}

/** Fixed seed — changing it changes the whole dataset. Do not change. */
export const AUDIT_SEED = 0x5a4d11ed;

export const AUDIT_TOTAL = 12483;
export const AUDIT_ALLOWED = 11210;
export const AUDIT_BLOCKED = 382;
export const AUDIT_PENDING = 841;
export const AUDIT_ERROR = 50;
/** Number of allowed rows flagged as human-approved (approvals = 841 + 713). */
export const AUDIT_APPROVED_ALLOWED = 713;

export const AUDIT_USERS = [
  { id: 'm.alharbi', label: 'محمد الحربي', role: 'تسويق' },
  { id: 's.alfaisal', label: 'سارة الفيصل', role: 'مالية' },
  { id: 'a.alqahtani', label: 'أحمد القحطاني', role: 'عمليات' },
  { id: 'n.alshahrani', label: 'نورة الشهراني', role: 'قانونية' },
  { id: 'k.alghamdi', label: 'خالد الغامدي', role: 'تقنية' },
] as const;

/** Time window: 2026-05-20 00:00 → 2026-07-06 23:59 (UTC). */
const TS_START = Date.UTC(2026, 4, 20, 0, 0, 0);
const TS_END = Date.UTC(2026, 6, 6, 23, 59, 59);

/** Per-role action pools, keyed by status. Style mirrors the original demo rows. */
const ACTION_POOL: Record<string, Record<KernelAuditStatus, string[]>> = {
  'تسويق': {
    allowed: [
      'استعلام تلخيصي عن سياسة الإجازات',
      'استعلام عادي (لا PII)',
      'تصدير تقرير خفيف لقائمة عملاء',
      'تحليل أداء حملة سابقة',
    ],
    blocked: [
      'طلب تصدير قائمة 2,400 عميل (PII)',
      'استعلام عن بيانات عملاء عبر مزود خارجي',
      'توليد رسائل بريدية شخصية من سجلات العملاء',
    ],
    pending_approval: ['تشغيل نموذج توليدي على شرائح العملاء', 'دمج بيانات حملة مع CRM'],
    error: ['فشل اتصال بـ CRM (timeout)', 'خطأ في استجابة مزود النموذج'],
  },
  'مالية': {
    allowed: [
      'استعلام عن سياسة الصرف',
      'تلخيص تقرير مصروفات ربع سنوي',
      'استعلام عن رصيد بند',
    ],
    blocked: [
      'تشغيل نموذج توليدي على سجلات طبية',
      'تصدير ملف مكافآت الموظفين (PII)',
      'استعلام عن بيانات بنكية لعملاء',
    ],
    pending_approval: ['توليد تقرير مالي حساس', 'مراجعة مدفوعات آلية'],
    error: ['فشل اتصال بـ ERP (timeout)', 'انقطاع في خدمة المعاملات'],
  },
  'عمليات': {
    allowed: [
      'تحليل عقد مورد',
      'اختبار سيناريو تلخيصي',
      'استعلام عن جدولة إنتاج',
    ],
    blocked: ['نقل بيانات موردين إلى مزود خارجي', 'تعديل قاعدة مورد عبر نموذج'],
    pending_approval: ['توليد ملخص تفاوض مع مورد', 'مراجعة عقد قبل التوقيع'],
    error: ['فشل مزامنة مع نظام المخزون'],
  },
  'قانونية': {
    allowed: ['استعلام لوائح البنك المركزي', 'استعلام عن بند تعاقدي', 'تلخيص وثيقة قانونية عامة'],
    blocked: ['تصدير ملف قضية حساس', 'استعلام عن معلومات طرف ثالث محمية'],
    pending_approval: ['توليد مسودة اتفاقية', 'مراجعة امتثال صفقة'],
    error: ['فشل الاتصال بقاعدة اللوائح'],
  },
  'تقنية': {
    allowed: ['استعلام عن حالة الأنظمة', 'فحص إعدادات جدار الحماية', 'تلخيص سجل النظام'],
    blocked: ['دمج نموذج ثالث + كشف PII جديد', 'تثبيت مكتبة من مصدر غير موثوق', 'تصدير مفاتيح API'],
    pending_approval: ['تغيير إعدادات حساسة', 'تحديث نموذج على بيئة الإنتاج'],
    error: ['انقطاع في مزود النموذج', 'فشل قراءة سجل النظام'],
  },
};

/**
 * mulberry32 — deterministic 32-bit PRNG. Identical across TS/JS engines.
 * `Math.imul` is fully specified; `>>> 0` normalizes to unsigned.
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
function shuffle<T>(arr: T[], rand: () => number): T[] {
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  return arr;
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/** UTC display label 'YYYY/MM/DD HH:MM' (Latin digits, environment-stable). */
export function formatTsLabel(epochMs: number): string {
  const d = new Date(epochMs);
  return (
    d.getUTCFullYear() + '/' + pad2(d.getUTCMonth() + 1) + '/' + pad2(d.getUTCDate()) +
    ' ' + pad2(d.getUTCHours()) + ':' + pad2(d.getUTCMinutes())
  );
}

/** UTC ISO date 'YYYY-MM-DD' (for date filters). */
export function formatTsDate(epochMs: number): string {
  const d = new Date(epochMs);
  return d.getUTCFullYear() + '-' + pad2(d.getUTCMonth() + 1) + '-' + pad2(d.getUTCDate());
}

/** Canonical string that the hash chain seals. MUST match the JS mirror. */
export function auditCanonical(row: Omit<KernelAuditRow, 'prevHash' | 'hash'>): string {
  return [
    String(row.ts),
    row.userId,
    row.role,
    row.action,
    String(row.risk),
    row.status,
    row.traceId,
  ].join('|');
}

/**
 * Builds the full deterministic dataset. Pure — same output on every call.
 * Order after this function: time-ASCENDING; the UI renders it reversed
 * (newest first). The hash chain is computed in time-ascending order.
 */
export function buildAuditRows(): KernelAuditRow[] {
  const rand = mulberry32(AUDIT_SEED);
  const total = AUDIT_TOTAL;

  // 1) Exact status distribution, then deterministic shuffle.
  const statuses: KernelAuditStatus[] = [];
  for (let i = 0; i < AUDIT_ALLOWED; i += 1) statuses.push('allowed');
  for (let i = 0; i < AUDIT_BLOCKED; i += 1) statuses.push('blocked');
  for (let i = 0; i < AUDIT_PENDING; i += 1) statuses.push('pending_approval');
  for (let i = 0; i < AUDIT_ERROR; i += 1) statuses.push('error');
  shuffle(statuses, rand);

  // 2) Raw rows in generation order.
  const raw: Array<{ ts: number; userId: string; role: string; action: string; risk: number; status: KernelAuditStatus }> = [];
  const span = TS_END - TS_START;
  for (let i = 0; i < total; i += 1) {
    const status = statuses[i];
    const uIdx = Math.floor(rand() * AUDIT_USERS.length);
    const user = AUDIT_USERS[uIdx];
    const pool = ACTION_POOL[user.role][status];
    const action = pool[Math.floor(rand() * pool.length)];
    const ts = TS_START + Math.floor(rand() * span);

    // Risk bands per status (keeps the risk filters meaningful).
    let risk: number;
    if (status === 'allowed') risk = 1 + Math.floor(rand() * 45);
    else if (status === 'blocked') risk = 60 + Math.floor(rand() * 39);
    else if (status === 'pending_approval') risk = 40 + Math.floor(rand() * 46);
    else risk = 30 + Math.floor(rand() * 31);

    raw.push({ ts, userId: user.id, role: user.role, action, risk, status });
  }

  // 3) Sort time-ascending, assign index + traceId + humanApproved + anomaly.
  raw.sort((a, b) => a.ts - b.ts);

  const rows: KernelAuditRow[] = [];
  let allowedSeen = 0;
  for (let i = 0; i < total; i += 1) {
    const r = raw[i];
    // traceId: newest = highest number, mirroring the original 10493 sample.
    const traceId = 'AI-2026-' + String(10493 + (total - 1 - i));
    let humanApproved = false;
    if (r.status === 'allowed') {
      allowedSeen += 1;
      humanApproved = allowedSeen <= AUDIT_APPROVED_ALLOWED;
    }
    const anomaly = r.status === 'blocked' && r.risk >= 90;
    rows.push({
      index: i,
      ts: r.ts,
      tsLabel: formatTsLabel(r.ts),
      tsDate: formatTsDate(r.ts),
      userId: r.userId,
      userLabel: AUDIT_USERS.find((u) => u.id === r.userId)!.label,
      role: r.role,
      action: r.action,
      risk: r.risk,
      status: r.status,
      humanApproved,
      traceId,
      anomaly,
      prevHash: '0x00000000',
      hash: '0x00000000',
    });
  }

  // 4) Hash chain (time-ascending). prevHash of row i = hash of row i-1.
  let prev = '0x00000000';
  for (let i = 0; i < total; i += 1) {
    const row = rows[i];
    row.prevHash = prev;
    row.hash = fnv1a(prev + '|' + auditCanonical(row));
    prev = row.hash;
  }

  return rows;
}

/** Deterministic stats — recomputed from the generated rows each build. */
export function buildAuditStats(): KernelAuditStats {
  const rows = buildAuditRows();
  let allowed = 0;
  let blocked = 0;
  let pending = 0;
  let error = 0;
  let approved = 0;
  for (let i = 0; i < rows.length; i += 1) {
    const s = rows[i].status;
    if (s === 'allowed') allowed += 1;
    else if (s === 'blocked') blocked += 1;
    else if (s === 'pending_approval') pending += 1;
    else error += 1;
    if (s === 'pending_approval' || (s === 'allowed' && rows[i].humanApproved)) approved += 1;
  }
  return { total: rows.length, allowed, blocked, pending, error, approvals: approved };
}

/** Default filter window (mirrors the page's pre-filled date inputs). */
export const AUDIT_DEFAULT_FROM = '2026-06-01';
export const AUDIT_DEFAULT_TO = '2026-07-06';
