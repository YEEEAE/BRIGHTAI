// QC Laboratory FAIL-rate trends (read-only, over existing data only).
//
// Pure SELECT module — no new tables, no migrations, no writes. FAIL rate is
// computed on DECIDED records exactly like every existing aggregate in the
// lab (dashboard.ts getResultCounts): status <> 'VOID' AND final_result IS
// NOT NULL. Voided records never enter any rate.
//
// Bucketing reuses the dashboard week-alignment convention verbatim:
// Monday-start local calendar weeks (see startOfWeekLocal in dashboard.ts /
// getTestsByWeek). Monthly buckets are local calendar months (YYYY-MM).
//
// All queries run through prepared statements with bound parameters (?) —
// no user text is ever concatenated into SQL.

import { getDb } from '../db';
import { parseDbDate } from '../format';

// ─────────────────────────────── Types ───────────────────────────────

export type LabTrendGranularity = 'week' | 'month';

export const LAB_TREND_GRANULARITIES: LabTrendGranularity[] = ['week', 'month'];

export interface LabFailRatePoint {
  /** Bucket key — Monday date (YYYY-MM-DD) for weeks, YYYY-MM for months. */
  bucket: string;
  /** Human label (same style as dashboard week labels). */
  label: string;
  /** Decided (non-VOID, final_result set) records in the bucket. */
  total: number;
  /** FAIL records in the bucket. */
  fail: number;
  /** fail / total in percent (0–100, 1 decimal) — null when total is 0. */
  failRate: number | null;
}

export interface LabLotFailRateRow {
  lotNumber: string;
  total: number;
  fail: number;
  failRate: number | null;
  lastTestedAt: string;
}

export interface LabTrendComparison {
  /** FAIL rate over the current window (last `periods` buckets), or null. */
  currentFailRate: number | null;
  /** FAIL rate over the previous equal-length window, or null. */
  previousFailRate: number | null;
  /** previous → current change in percentage points (null if either is null). */
  deltaPercentagePoints: number | null;
  direction: 'up' | 'down' | 'flat' | 'insufficient';
}

export interface LabProductFailRateRow {
  productId: number;
  name: string;
  code: string;
  total: number;
  fail: number;
  failRate: number | null;
}

export interface LabFailRateTrends {
  granularity: LabTrendGranularity;
  points: LabFailRatePoint[];
  comparison: LabTrendComparison;
  lots: LabLotFailRateRow[];
}

// ─────────────────────────────── Bucket helpers ───────────────────────────────
// Same week-alignment convention as src/lib/dashboard.ts (Monday-start local).

function startOfWeekLocal(d: Date): Date {
  const copy = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diff = (copy.getDay() + 6) % 7; // days since Monday
  copy.setDate(copy.getDate() - diff);
  return copy;
}

function isoDay(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function isoMonth(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/** Last `periods` Monday-start weeks, oldest first (labels like dashboard.ts). */
function buildWeekBuckets(periods: number): Array<{ bucket: string; label: string }> {
  const thisMonday = startOfWeekLocal(new Date());
  const out: Array<{ bucket: string; label: string }> = [];
  for (let i = periods - 1; i >= 0; i--) {
    const monday = new Date(thisMonday);
    monday.setDate(monday.getDate() - 7 * i);
    out.push({
      bucket: isoDay(monday),
      label: monday.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
    });
  }
  return out;
}

/** Last `periods` local calendar months, oldest first. */
function buildMonthBuckets(periods: number): Array<{ bucket: string; label: string }> {
  const now = new Date();
  const out: Array<{ bucket: string; label: string }> = [];
  for (let i = periods - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push({
      bucket: isoMonth(d),
      label: d.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }),
    });
  }
  return out;
}

/** First day after the last bucket (exclusive upper bound for the window). */
function endAfterBuckets(
  granularity: LabTrendGranularity,
  buckets: Array<{ bucket: string }>,
): string {
  const last = buckets[buckets.length - 1].bucket;
  if (granularity === 'month') {
    const [y, m] = last.split('-').map(Number);
    return isoDay(new Date(y, m, 1)); // month index m == next month (1-based)
  }
  const [y, m, d] = last.split('-').map(Number);
  return isoDay(new Date(y, m - 1, d + 7));
}

/** First day of the equal-length window BEFORE the current one. */
function previousWindowStart(
  granularity: LabTrendGranularity,
  buckets: Array<{ bucket: string }>,
): string {
  const first = buckets[0].bucket;
  const periods = buckets.length;
  if (granularity === 'month') {
    const [y, m] = first.split('-').map(Number);
    return isoDay(new Date(y, m - 1 - periods, 1));
  }
  const [y, m, d] = first.split('-').map(Number);
  return isoDay(new Date(y, m - 1, d - 7 * periods));
}

function pct(fail: number, total: number): number | null {
  if (total <= 0) return null;
  return Math.round((fail / total) * 1000) / 10;
}

// ─────────────────────────────── Queries ───────────────────────────────

const LOT_BREAKDOWN_LIMIT = 20;
const PRODUCT_SUMMARY_LIMIT = 10;

/**
 * FAIL-rate trend for one product (or the whole lab when productId is
 * omitted). Read-only; every value is a bound parameter.
 */
export function getLabFailRateTrends(
  granularity: LabTrendGranularity = 'week',
  periods = 8,
  productId?: number,
): LabFailRateTrends {
  const count = Math.max(1, Math.min(52, Math.floor(periods)));
  const buckets =
    granularity === 'month' ? buildMonthBuckets(count) : buildWeekBuckets(count);
  // Month buckets are YYYY-MM keys — the SQL window bounds need real dates.
  const windowStart =
    granularity === 'month' ? `${buckets[0].bucket}-01` : buckets[0].bucket;
  const windowEnd = endAfterBuckets(granularity, buckets);

  const db = getDb();

  // Per-record fetch within the current window, bucketed in JS — same pattern
  // as dashboard.ts getTestsByWeek (local-time dates, Monday alignment).
  const productCond = productId !== undefined ? ' AND t.product_id = ?' : '';
  const rowParams: Array<string | number> = [windowStart, windowEnd];
  if (productId !== undefined) rowParams.push(productId);
  const rows = db
    .prepare(
      `SELECT t.created_at, t.final_result
       FROM lab_test_records t
       WHERE t.status <> 'VOID' AND t.final_result IS NOT NULL
         AND date(t.created_at, 'localtime') >= date(?)
         AND date(t.created_at, 'localtime') < date(?)${productCond}`,
    )
    .all(...rowParams) as Array<{ created_at: string; final_result: string }>;

  const points: LabFailRatePoint[] = buckets.map((b) => ({
    bucket: b.bucket,
    label: b.label,
    total: 0,
    fail: 0,
    failRate: null,
  }));
  const index = new Map(points.map((p, i) => [p.bucket, i]));
  for (const r of rows) {
    const d = parseDbDate(r.created_at);
    if (!d) continue;
    const key = granularity === 'month' ? isoMonth(d) : isoDay(startOfWeekLocal(d));
    const i = index.get(key);
    if (i === undefined) continue;
    points[i].total += 1;
    if (r.final_result === 'FAIL') points[i].fail += 1;
  }
  for (const p of points) p.failRate = pct(p.fail, p.total);

  // Moving comparison: current window vs the equal-length window before it.
  const prevStart = previousWindowStart(granularity, buckets);
  const windowRate = (from: string, to: string): { total: number; fail: number } => {
    const params: Array<string | number> = [from, to];
    if (productId !== undefined) params.push(productId);
    const r = db
      .prepare(
        `SELECT COUNT(*) AS total,
                SUM(CASE WHEN t.final_result = 'FAIL' THEN 1 ELSE 0 END) AS fail
         FROM lab_test_records t
         WHERE t.status <> 'VOID' AND t.final_result IS NOT NULL
           AND date(t.created_at, 'localtime') >= date(?)
           AND date(t.created_at, 'localtime') < date(?)${productCond}`,
      )
      .get(...params) as { total: number; fail: number | null };
    return { total: Number(r.total), fail: Number(r.fail ?? 0) };
  };
  const cur = windowRate(windowStart, windowEnd);
  const prev = windowRate(prevStart, windowStart);
  const currentFailRate = pct(cur.fail, cur.total);
  const previousFailRate = pct(prev.fail, prev.total);
  const deltaPercentagePoints =
    currentFailRate !== null && previousFailRate !== null
      ? Math.round((currentFailRate - previousFailRate) * 10) / 10
      : null;
  const comparison: LabTrendComparison = {
    currentFailRate,
    previousFailRate,
    deltaPercentagePoints,
    direction:
      deltaPercentagePoints === null
        ? 'insufficient'
        : deltaPercentagePoints > 0
          ? 'up'
          : deltaPercentagePoints < 0
            ? 'down'
            : 'flat',
  };

  // Per-lot breakdown (same decided-record rule; lots are a TEXT column on
  // lab_test_records — no lot master table exists by design).
  const lotsSql = `SELECT t.lot_number AS lot, COUNT(*) AS total,
                 SUM(CASE WHEN t.final_result = 'FAIL' THEN 1 ELSE 0 END) AS fail,
                 MAX(t.created_at) AS last_tested_at
          FROM lab_test_records t
          WHERE t.status <> 'VOID' AND t.final_result IS NOT NULL
            AND t.lot_number IS NOT NULL AND TRIM(t.lot_number) <> ''${productCond}
          GROUP BY t.lot_number
          ORDER BY total DESC, t.lot_number COLLATE NOCASE ASC
          LIMIT ?`;
  const lotParams: Array<string | number> = [];
  if (productId !== undefined) lotParams.push(productId);
  const lotRows = db.prepare(lotsSql).all(...lotParams, LOT_BREAKDOWN_LIMIT) as Array<{
    lot: string;
    total: number;
    fail: number | null;
    last_tested_at: string;
  }>;
  const lots: LabLotFailRateRow[] = lotRows.map((r) => ({
    lotNumber: r.lot,
    total: Number(r.total),
    fail: Number(r.fail ?? 0),
    failRate: pct(Number(r.fail ?? 0), Number(r.total)),
    lastTestedAt: r.last_tested_at,
  }));

  return { granularity, points, comparison, lots };
}

/** Per-product FAIL rate over the same window — worst first (reports view). */
export function getLabFailRateByProduct(
  granularity: LabTrendGranularity = 'week',
  periods = 8,
): LabProductFailRateRow[] {
  const count = Math.max(1, Math.min(52, Math.floor(periods)));
  const buckets =
    granularity === 'month' ? buildMonthBuckets(count) : buildWeekBuckets(count);
  const from = granularity === 'month' ? `${buckets[0].bucket}-01` : buckets[0].bucket;
  const to = endAfterBuckets(granularity, buckets);

  const rows = getDb()
    .prepare(
      `SELECT t.product_id AS productId, p.name, p.code,
              COUNT(*) AS total,
              SUM(CASE WHEN t.final_result = 'FAIL' THEN 1 ELSE 0 END) AS fail
       FROM lab_test_records t
       JOIN lab_products p ON p.id = t.product_id
       WHERE t.status <> 'VOID' AND t.final_result IS NOT NULL
         AND date(t.created_at, 'localtime') >= date(?)
         AND date(t.created_at, 'localtime') < date(?)
       GROUP BY t.product_id
       ORDER BY fail * 1.0 / total DESC, total DESC
       LIMIT ?`,
    )
    .all(from, to, PRODUCT_SUMMARY_LIMIT) as Array<{
    productId: number;
    name: string;
    code: string;
    total: number;
    fail: number | null;
  }>;
  return rows.map((r) => ({
    productId: Number(r.productId),
    name: r.name,
    code: r.code,
    total: Number(r.total),
    fail: Number(r.fail ?? 0),
    failRate: pct(Number(r.fail ?? 0), Number(r.total)),
  }));
}

// ─────────────────────────────── Drill-downs ───────────────────────────────

/**
 * Drill-down links to the implemented test register only (no new routes):
 * filtered by product (+ optional lot / result). Lot values are URL-encoded —
 * the register treats `lot` as free text (LIKE filter).
 */
export function labTrendDrilldown(productId?: number, lotNumber?: string, result?: 'FAIL'): string {
  const sp = new URLSearchParams();
  if (productId !== undefined) sp.set('product', String(productId));
  if (lotNumber !== undefined) sp.set('lot', lotNumber);
  if (result !== undefined) sp.set('result', result);
  const q = sp.toString();
  return q ? `/lab/tests?${q}` : '/lab/tests';
}
