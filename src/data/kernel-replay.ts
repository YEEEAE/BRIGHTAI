/**
 * kernel-replay.ts — Deterministic time-machine dataset for /kernel/replay/ (M20).
 *
 * M20 — REPLACES the hand-written ROWS-10 / hardcoded stats sample with a FULL
 * deterministic generator producing 520 historical requests at BUILD time.
 * No Math.random, no Date.now: a single fixed seed (REPLAY_SEED) drives a
 * mulberry32 PRNG, so every build yields byte-identical rows. The same
 * algorithm is mirrored byte-for-byte in public/js/kernel-time-machine-data.js
 * (browser + Web Worker + Node) so the client reconstructs the exact dataset
 * deterministically without shipping a JSON payload in the HTML.
 *
 * Exact contract (must never drift — verified by scripts/verify-replay.mjs):
 *   - total     = 520
 *   - blocked   = 340  (before=allowed → after=blocked, across 4 block policies)
 *   - released  = 12   (before=blocked → after=allowed, p-email masking)
 *   - falsePos  = 48   (subset of the 340 blocked rows flagged as false positives)
 *   - untouched = 168  (before === after, no proposed policy applies)
 *   - Default full-run simulation (Feb–Jul 2026, all depts, all policies):
 *     extraBlocked=340 · extraAllowed=12 · falsePos=48 · net=328
 *
 * Security contract (Prompt 20 immutable rule — M20): the replay simulation
 * NEVER sends historical request data to an external provider. simulateReplay()
 * enforces a consent gate: external mode without externalConsented=true returns
 * consentRequired=true and ZERO simulation data. The engine renders the consent
 * modal before any external-mode run; local mode is always the default. No
 * fetch, no remote ledger — the entire replay is computed in-process.
 *
 * Integrity: each row carries a FNV-1a hash chained from the previous row's
 * hash (genesis = 0x00000000). fnv1a is byte-identical to kernel-hash.js /
 * kernel-audit-data.js / kernel-datasets.ts / kernel-approvals.ts.
 *
 * Determinism guarantee between TS (build) and JS (browser/worker):
 *   - mulberry32 is deterministic across JS engines (Math.imul, >>> 0).
 *   - RNG call order is fixed; false-positive budgets are pre-built with exact
 *     counts then Fisher–Yates-shuffled with the same RNG stream.
 *   - Timestamps are UTC-based (Date.UTC), formatted manually — no locale,
 *     no toLocaleString.
 *   - Rows are sorted by ts with an explicit `ord` tie-breaker (stable across
 *     engines), so the hash-chain order is environment-independent.
 */
export type KernelReplayVerdict = 'allowed' | 'blocked';

export interface KernelReplayRow {
  /** 0-based index in the time-ascending build order. */
  index: number;
  /** UTC epoch ms (deterministic). */
  ts: number;
  /** Display label, Latin digits, UTC — '2026/07/31 17:42'. */
  tsLabel: string;
  /** ISO date for date filters — '2026-07-31'. */
  tsDate: string;
  traceId: string;
  /** Department label (التسويق/المالية/…). */
  dept: string;
  /** Request description. */
  req: string;
  /** Actual (historical) verdict. */
  before: KernelReplayVerdict;
  /** Verdict under ALL proposed policies active. */
  after: KernelReplayVerdict;
  /** Proposed policy id that changes this request ('' = unaffected). */
  policy: string;
  /** True only for blocked rows that are false positives (legitimate). */
  falsePos: boolean;
  /** Previous row's hash in the chain (genesis = 0x00000000). */
  prevHash: string;
  /** FNV-1a(prevHash + '|' + canonical) — the integrity seal. */
  hash: string;
}

export interface KernelReplayPolicy {
  id: string;
  name: string;
  pack: string;
  highFalsePos: boolean;
}

export interface ReplayMonthlyBar {
  m: string;
  before: number;
  after: number;
}

export interface ReplayDeptAgg {
  dept: string;
  affected: number;
  blocks: number;
  released: number;
}

export interface ReplayWarning {
  policyId: string;
  policyName: string;
  /** Legitimate (non-false-positive) requests the policy would block. */
  count: number;
  /** False-positive count for the same policy in scope. */
  falsePos: number;
  /** Department with the most affected requests for this policy. */
  dept: string;
}

export interface ReplayAffectedRow {
  trace: string;
  dept: string;
  req: string;
  before: KernelReplayVerdict;
  after: KernelReplayVerdict;
  policy: string;
  falsePos: boolean;
}

export interface ReplayResult {
  /** True when external mode was requested without explicit consent. */
  consentRequired: boolean;
  mode: 'local' | 'external';
  /** Number of requests in the selected scope. */
  scoped: number;
  stats: { extraBlocked: number; extraAllowed: number; falsePos: number; net: number };
  monthly: ReplayMonthlyBar[];
  affected: ReplayAffectedRow[];
  depts: ReplayDeptAgg[];
  warning: ReplayWarning | null;
}

export interface ReplaySimParams {
  fromMs: number;
  toMs: number;
  /** '' = all departments, else exact dept label. */
  dept: string;
  policyIds: string[];
  mode: 'local' | 'external';
  externalConsented: boolean;
}

export interface TimelineStage {
  i: string;
  title: string;
  ts: string;
  meta: string;
  verdict: KernelReplayVerdict;
}

/** Fixed seed — changing it changes the whole dataset. Do not change. */
export const REPLAY_SEED = 0x5c0ffee0;

export const REPLAY_TOTAL = 520;
export const REPLAY_BLOCKED = 340;
export const REPLAY_RELEASED = 12;
export const REPLAY_FALSE_POS = 48;
export const REPLAY_UNTOUCHED = 168;

/** Time window: 2026-02-01 00:00 → 2026-07-31 23:59 (UTC) — six months. */
export const REPLAY_TS_START = Date.UTC(2026, 1, 1, 0, 0, 0);
export const REPLAY_TS_END = Date.UTC(2026, 6, 31, 23, 59, 59);

export const REPLAY_MONTHS = ['فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو'];

export const REPLAY_POLICIES: KernelReplayPolicy[] = [
  { id: 'p-pii-export', name: 'حظر تصدير قوائم العملاء (PII)', pack: 'PDPL', highFalsePos: true },
  { id: 'p-medical', name: 'حظر الهوية في السياق الطبي', pack: 'SFDA', highFalsePos: false },
  { id: 'p-iban', name: 'حظر SA-IBAN في المخرجات', pack: 'SAMA', highFalsePos: false },
  { id: 'p-email', name: 'تعمية البريد الإلكتروني', pack: 'PDPL', highFalsePos: false },
  { id: 'p-prompt-inj', name: 'كشف حقن الأوامر', pack: 'NCA', highFalsePos: true },
];

export const REPLAY_DEPTS = ['التسويق', 'المالية', 'العمليات', 'القانونية', 'تقنية', 'الموارد البشرية'];

/** Block-policy → exact affected count + false-positive budget + dept + requests. */
const BLOCK_POLICIES: Array<{
  id: string;
  count: number;
  falsePosBudget: number;
  dept: string;
  reqs: string[];
}> = [
  { id: 'p-pii-export', count: 200, falsePosBudget: 32, dept: 'التسويق', reqs: [
    'تصدير قائمة 2,400 عميل',
    'تقرير حملة بأسماء العملاء',
    'دمج بيانات عملاء مع CRM خارجي',
    'استعلام عن شريحة عملاء بالاسم والهاتف',
  ] },
  { id: 'p-medical', count: 60, falsePosBudget: 6, dept: 'العمليات', reqs: [
    'تلخيص سجل طبي لمتابعة حالة',
    'استعلام عن سجل موظف (بيانات طبية)',
    'تحليل 580 سجل طبي مع PII',
  ] },
  { id: 'p-iban', count: 40, falsePosBudget: 4, dept: 'المالية', reqs: [
    'كشف SA-IBAN في فاتورة مورد',
    'مراجعة أرقام حسابات في عقد',
    'تسوية بنكية بتفاصيل حسابات',
  ] },
  { id: 'p-prompt-inj', count: 40, falsePosBudget: 6, dept: 'تقنية', reqs: [
    'حقن أمر تجاوز التعليمات',
    'محاولة استخراج أسرار من النموذج',
    'تجاوز قواعد الرفض عبر prompt',
  ] },
];

const EMAIL_DEPTS = ['التسويق', 'الموارد البشرية', 'المالية'];
const EMAIL_REQS = [
  'إرسال كشوف رواتب بريدياً',
  'بريد ترويجي لأسماء العملاء',
  'إرسال قائمة مرشحين بريدياً',
];

const UNTOUCHED_REQS: Record<string, string[]> = {
  'التسويق': ['تحليل أداء حملة سابقة (مجاميع فقط)', 'استعلام عن سياسة الإجازات', 'تقرير إعلانات مجمع'],
  'المالية': ['توليد تقرير مصاريف ربعي', 'مراجعة مدفوعات داخلية', 'تلخيص مصروفات تشغيلية'],
  'العمليات': ['ملخص عقد مورد', 'جدولة صيانة', 'استعلام عن جدول إنتاج'],
  'القانونية': ['استعلام لوائح عام', 'تلخيص وثيقة منشورة', 'توليد مسودة اتفاقية قياسية'],
  'تقنية': ['استعلام SQL بسيط', 'تصدير سجلات تدقيق', 'استعلام توثيق API'],
  'الموارد البشرية': ['استعلام عن سياسة الإجازات', 'تلخيص وصف وظيفي', 'استعلام عن دليل الموظف'],
};

/** Timeline step templates — the investigation drawer rebuilds a deterministic
 * journey for any Trace ID by seeding a local RNG with the trace hash. */
const TIMELINE_STEPS = [
  { title: 'الاستلام', meta: 'طلب مستلم، توكنز 142، عربي' },
  { title: 'فحص PII', meta: 'كُشف: هوية وطنية + جوال' },
  { title: 'تقييم المخاطر', meta: 'الدرجة 87/100 — حرج' },
  { title: 'مطابقة السياسات', meta: 'سياسة حظر تصدير PII' },
  { title: 'استدعاء النموذج', meta: 'لم يُستدعَ — حُظر قبله' },
  { title: 'توليد الدليل', meta: 'EVD + hash 0xa7c8…2c1b' },
];

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

/** UTC ISO date 'YYYY-MM-DD'. */
export function formatTsDate(epochMs: number): string {
  const d = new Date(epochMs);
  return d.getUTCFullYear() + '-' + pad2(d.getUTCMonth() + 1) + '-' + pad2(d.getUTCDate());
}

/** Month index 0-5 (فبراير..يوليو) for a ts inside the replay window. */
function monthIndexOf(ts: number): number {
  return new Date(ts).getUTCMonth() - 1;
}

/**
 * Canonical string that the hash chain seals. MUST match the JS mirror.
 */
export function replayCanonical(row: Omit<KernelReplayRow, 'prevHash' | 'hash' | 'tsLabel' | 'tsDate'>): string {
  return [
    String(row.ts),
    row.dept,
    row.req,
    row.before,
    row.after,
    row.policy,
    row.falsePos ? '1' : '0',
    row.traceId,
  ].join('|');
}

/**
 * Builds the full deterministic dataset. Pure — same output on every call.
 * Order after this function: time-ASCENDING (tie-broken by `ord`).
 */
export function buildReplayRows(): KernelReplayRow[] {
  const rand = mulberry32(REPLAY_SEED);
  const raw: Array<{
    ts: number;
    dept: string;
    req: string;
    before: KernelReplayVerdict;
    after: KernelReplayVerdict;
    policy: string;
    falsePos: boolean;
    ord: number;
  }> = [];
  let ord = 0;

  // 1) Block rows (exact counts + exact false-positive budgets).
  for (let p = 0; p < BLOCK_POLICIES.length; p += 1) {
    const bp = BLOCK_POLICIES[p];
    const fpBudget: boolean[] = [];
    for (let i = 0; i < bp.count; i += 1) {
      fpBudget.push(i < bp.falsePosBudget);
    }
    shuffle(fpBudget, rand);
    for (let i = 0; i < bp.count; i += 1) {
      const ts = REPLAY_TS_START +
        Math.floor(rand() * 6) * (30 * 86400000) +
        Math.floor(rand() * 28) * 86400000 +
        Math.floor(rand() * 24) * 3600000 +
        Math.floor(rand() * 60) * 60000;
      raw.push({
        ts,
        dept: bp.dept,
        req: bp.reqs[Math.floor(rand() * bp.reqs.length)],
        before: 'allowed',
        after: 'blocked',
        policy: bp.id,
        falsePos: fpBudget[i],
        ord: ord++,
      });
    }
  }

  // 2) Release rows (p-email masking: previously blocked → allowed).
  for (let i = 0; i < REPLAY_RELEASED; i += 1) {
    const ts = REPLAY_TS_START +
      Math.floor(rand() * 6) * (30 * 86400000) +
      Math.floor(rand() * 28) * 86400000 +
      Math.floor(rand() * 24) * 3600000 +
      Math.floor(rand() * 60) * 60000;
    raw.push({
      ts,
      dept: EMAIL_DEPTS[Math.floor(rand() * EMAIL_DEPTS.length)],
      req: EMAIL_REQS[Math.floor(rand() * EMAIL_REQS.length)],
      before: 'blocked',
      after: 'allowed',
      policy: 'p-email',
      falsePos: false,
      ord: ord++,
    });
  }

  // 3) Untouched rows (before === after, no policy applies).
  for (let i = 0; i < REPLAY_UNTOUCHED; i += 1) {
    const dept = REPLAY_DEPTS[Math.floor(rand() * REPLAY_DEPTS.length)];
    const ts = REPLAY_TS_START +
      Math.floor(rand() * 6) * (30 * 86400000) +
      Math.floor(rand() * 28) * 86400000 +
      Math.floor(rand() * 24) * 3600000 +
      Math.floor(rand() * 60) * 60000;
    const before: KernelReplayVerdict = rand() < 0.5 ? 'blocked' : 'allowed';
    raw.push({
      ts,
      dept,
      req: UNTOUCHED_REQS[dept][Math.floor(rand() * UNTOUCHED_REQS[dept].length)],
      before,
      after: before,
      policy: '',
      falsePos: false,
      ord: ord++,
    });
  }

  // 4) Sort time-ascending, tie-broken by `ord` (engine-stable).
  raw.sort((a, b) => (a.ts - b.ts) || (a.ord - b.ord));

  const rows: KernelReplayRow[] = [];
  for (let i = 0; i < REPLAY_TOTAL; i += 1) {
    const r = raw[i];
    rows.push({
      index: i,
      ts: r.ts,
      tsLabel: formatTsLabel(r.ts),
      tsDate: formatTsDate(r.ts),
      traceId: 'AI-2026-' + String(10000 + (REPLAY_TOTAL - 1 - i)),
      dept: r.dept,
      req: r.req,
      before: r.before,
      after: r.after,
      policy: r.policy,
      falsePos: r.falsePos,
      prevHash: '0x00000000',
      hash: '0x00000000',
    });
  }

  // 5) Hash chain (time-ascending). prevHash of row i = hash of row i-1.
  let prev = '0x00000000';
  for (let i = 0; i < REPLAY_TOTAL; i += 1) {
    const row = rows[i];
    row.prevHash = prev;
    row.hash = fnv1a(prev + '|' + replayCanonical(row));
    prev = row.hash;
  }

  return rows;
}

/**
 * Runs the replay simulation over the given scope. Pure and deterministic.
 *
 * SECURITY (consent gate): external mode WITHOUT externalConsented=true returns
 * a result with consentRequired=true and zero simulation data — the historical
 * requests are never evaluated against an external provider until the engine
 * has shown the disclosure and obtained explicit consent. No fetch happens here
 * or anywhere in the module.
 */
export function simulateReplay(rows: KernelReplayRow[], params: ReplaySimParams): ReplayResult {
  const mode = params.mode === 'external' ? 'external' : 'local';
  const policyIds = params.policyIds || [];
  const dept = params.dept || '';

  const zero = { extraBlocked: 0, extraAllowed: 0, falsePos: 0, net: 0 };
  if (mode === 'external' && !params.externalConsented) {
    return {
      consentRequired: true,
      mode,
      scoped: 0,
      stats: zero,
      monthly: REPLAY_MONTHS.map((m) => ({ m, before: 0, after: 0 })),
      affected: [],
      depts: [],
      warning: null,
    };
  }

  const from = params.fromMs;
  const to = params.toMs;
  const monthly: ReplayMonthlyBar[] = REPLAY_MONTHS.map((m) => ({ m, before: 0, after: 0 }));
  const affected: ReplayAffectedRow[] = [];
  const deptAgg: Record<string, ReplayDeptAgg> = {};
  let scoped = 0;
  let extraBlocked = 0;
  let extraAllowed = 0;
  let falsePos = 0;

  const policySet: Record<string, boolean> = {};
  for (let i = 0; i < policyIds.length; i += 1) policySet[policyIds[i]] = true;

  for (let i = 0; i < rows.length; i += 1) {
    const r = rows[i];
    if (r.ts < from || r.ts > to) continue;
    if (dept !== '' && r.dept !== dept) continue;
    scoped += 1;

    const verdict: KernelReplayVerdict = policySet[r.policy] === true ? r.after : r.before;
    const mi = monthIndexOf(r.ts);
    if (mi >= 0 && mi < monthly.length) {
      if (r.before === 'blocked') monthly[mi].before += 1;
      if (verdict === 'blocked') monthly[mi].after += 1;
    }

    if (r.before === 'allowed' && verdict === 'blocked') {
      extraBlocked += 1;
    } else if (r.before === 'blocked' && verdict === 'allowed') {
      extraAllowed += 1;
    }
    if (verdict === 'blocked' && r.falsePos) falsePos += 1;

    if (r.before !== verdict) {
      affected.push({
        trace: r.traceId,
        dept: r.dept,
        req: r.req,
        before: r.before,
        after: verdict,
        policy: r.policy,
        falsePos: r.falsePos,
      });
      if (!deptAgg[r.dept]) {
        deptAgg[r.dept] = { dept: r.dept, affected: 0, blocks: 0, released: 0 };
      }
      const agg = deptAgg[r.dept];
      agg.affected += 1;
      if (r.before === 'allowed' && verdict === 'blocked') agg.blocks += 1;
      else if (r.before === 'blocked' && verdict === 'allowed') agg.released += 1;
    }
  }

  // Affected departments, ranked by affected count descending.
  const depts = Object.keys(deptAgg)
    .map((k) => deptAgg[k])
    .sort((a, b) => b.affected - a.affected);

  // Side-effect warning: among SELECTED high-false-positive policies, pick the
  // one with the most false positives in scope; report its legitimate count.
  let warning: ReplayWarning | null = null;
  for (let p = 0; p < REPLAY_POLICIES.length; p += 1) {
    const pol = REPLAY_POLICIES[p];
    if (!pol.highFalsePos) continue;
    if (policySet[pol.id] !== true) continue;
    let fp = 0;
    let legit = 0;
    const deptHits: Record<string, number> = {};
    for (let i = 0; i < affected.length; i += 1) {
      const a = affected[i];
      if (a.policy !== pol.id) continue;
      if (a.after === 'blocked') {
        if (a.falsePos) fp += 1;
        else legit += 1;
      }
      deptHits[a.dept] = (deptHits[a.dept] || 0) + 1;
    }
    if (fp === 0) continue;
    let topDept = '';
    let topCount = -1;
    Object.keys(deptHits).forEach((d) => {
      if (deptHits[d] > topCount) {
        topCount = deptHits[d];
        topDept = d;
      }
    });
    if (!warning || fp > warning.falsePos) {
      warning = { policyId: pol.id, policyName: pol.name, count: legit, falsePos: fp, dept: topDept };
    }
  }

  return {
    consentRequired: false,
    mode,
    scoped,
    stats: { extraBlocked, extraAllowed, falsePos, net: extraBlocked - extraAllowed },
    monthly,
    affected,
    depts,
    warning,
  };
}

/**
 * Deterministic timeline reconstruction for the investigation tab. Any Trace ID
 * yields a stable 6-step journey: the local RNG is seeded from fnv1a(traceId)
 * and the final verdict reflects the dataset row when the trace is found.
 */
export function buildTimeline(traceId: string, rows?: KernelReplayRow[]): TimelineStage[] {
  const id = String(traceId || '');
  const seedHash = parseInt(fnv1a(id).slice(2), 16);
  const rand = mulberry32(seedHash >>> 0);

  let finalVerdict: KernelReplayVerdict = 'allowed';
  if (rows) {
    for (let i = 0; i < rows.length; i += 1) {
      if (rows[i].traceId === id) {
        finalVerdict = rows[i].after === 'blocked' ? 'blocked' : 'allowed';
        break;
      }
    }
  }

  // Offsets make the timeline feel alive while staying deterministic.
  const t0 = [0, 4, 12, 18, 34, 58];
  const stages: TimelineStage[] = [];
  for (let i = 0; i < TIMELINE_STEPS.length; i += 1) {
    const st = TIMELINE_STEPS[i];
    const verdict: KernelReplayVerdict =
      i < 2 ? 'allowed' : (finalVerdict === 'blocked' && i >= 2 ? 'blocked' : (i === 5 ? 'blocked' : 'allowed'));
    stages.push({
      i: String(i + 1),
      title: st.title,
      ts: 'T+' + (t0[i] + Math.floor(rand() * 3)) + 'ms',
      meta: st.meta,
      verdict,
    });
  }
  return stages;
}
