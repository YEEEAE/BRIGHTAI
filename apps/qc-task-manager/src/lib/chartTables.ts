// Chart → accessible-table data transforms (PROMPT-07 / P1-4).
//
// Every SVG chart on the dashboard and laboratory panels must have a 1-to-1
// semantic HTML table equivalent. The React chart islands render these specs
// via ChartTableToggle, and scripts/test-dashboard-analytics-100.mjs asserts
// the equivalence contract (row counts, headers, totals) directly against this
// module so chart and table can never drift apart.
//
// This module is PURE — no DB, no React — so the equivalence test is
// deterministic.

/** Structural minimum shared by every chart slice (dashboard + lab). */
export interface SliceLike {
  label: string;
  count: number;
}

/** Mirror of DashboardCharts' EmployeeBar (kept structural to avoid cycles). */
export interface EmployeeBarLike {
  full_name: string;
  total: number;
  statuses: SliceLike[];
}

export interface WeekPointLike {
  label: string;
  count: number;
}

export interface CompletionRateLike {
  current: number | null;
  previous: number | null;
  delta_pp: number | null;
  current_from: string;
  current_to: string;
  previous_from: string;
  previous_to: string;
}

/**
 * The 1-to-1 table spec a chart renders when the user asks for
 * "عرض كجدول بيانات". rows[0] is the row header (th scope="row"); footer is
 * the summary row (totals / change).
 */
export interface ChartTableSpec {
  caption: string;
  columns: string[];
  rows: string[][];
  footer: string[];
}

/** Share of total as a rounded percentage; never NaN, "—" when total = 0. */
function pct(count: number, total: number): string {
  return total > 0 ? `${Math.round((count / total) * 100)}%` : '—';
}

/**
 * The screen-reader takeaway for a categorical chart (largest slice), without
 * the chart title. Composed into aria-labels as
 * `<title> (<takeaway>): <full data listing>` so the takeaway is heard first
 * and the data part after the single ": " separator stays machine-parseable.
 */
export function chartTakeaway(data: SliceLike[]): string {
  const total = data.reduce((sum, d) => sum + d.count, 0);
  if (total === 0) return 'no records match the current filters';
  const top = data.reduce((a, b) => (b.count > a.count ? b : a), data[0]);
  return `${total} total, largest ${top.label} ${top.count} (${pct(top.count, total)})`;
}

// ─────────────────────────── Dashboard charts ───────────────────────────

export function statusDistributionTable(data: SliceLike[]): ChartTableSpec {
  const total = data.reduce((sum, d) => sum + d.count, 0);
  return {
    caption: 'Tasks by status — exact figures for the current filter scope',
    columns: ['Status', 'Tasks', 'Share'],
    rows: data.map((d) => [d.label, String(d.count), pct(d.count, total)]),
    footer: ['Total', String(total), total > 0 ? '100%' : '—'],
  };
}

export function priorityDistributionTable(data: SliceLike[]): ChartTableSpec {
  const total = data.reduce((sum, d) => sum + d.count, 0);
  return {
    caption: 'Tasks by priority — exact figures for the current filter scope',
    columns: ['Priority', 'Tasks', 'Share'],
    rows: data.map((d) => [d.label, String(d.count), pct(d.count, total)]),
    footer: ['Total', String(total), total > 0 ? '100%' : '—'],
  };
}

export function perEmployeeTable(data: EmployeeBarLike[]): ChartTableSpec {
  if (data.length === 0) {
    return {
      caption: 'Tasks per employee — exact figures for the current filter scope',
      columns: ['Employee', 'Total'],
      rows: [],
      footer: ['Total', '0'],
    };
  }
  const statusLabels = data[0].statuses.map((s) => s.label);
  const columns = ['Employee', ...statusLabels, 'Total'];
  const rows = data.map((u) => [
    u.full_name,
    ...u.statuses.map((s) => String(s.count)),
    String(u.total),
  ]);
  const statusTotals = statusLabels.map((_, i) =>
    data.reduce((sum, u) => sum + (u.statuses[i]?.count ?? 0), 0),
  );
  const grand = statusTotals.reduce((a, b) => a + b, 0);
  return {
    caption: 'Tasks per employee — exact figures for the current filter scope',
    columns,
    rows,
    footer: ['Total', ...statusTotals.map(String), String(grand)],
  };
}

export function overdueByEmployeeTable(data: Array<{ full_name: string; count: number }>): ChartTableSpec {
  const slices = data.map((d) => ({ label: d.full_name, count: d.count }));
  const total = slices.reduce((sum, d) => sum + d.count, 0);
  return {
    caption: 'Overdue tasks per employee — exact figures for the current filter scope',
    columns: ['Employee', 'Overdue tasks'],
    rows: slices.map((d) => [d.label, String(d.count)]),
    footer: ['Total', String(total)],
  };
}

export function completedPerWeekTable(data: WeekPointLike[]): ChartTableSpec {
  const total = data.reduce((sum, w) => sum + w.count, 0);
  return {
    caption: 'Tasks completed per week — exact figures for the last 8 weeks',
    columns: ['Week starting', 'Completed tasks'],
    rows: data.map((w) => [w.label, String(w.count)]),
    footer: ['Total', String(total)],
  };
}

/** "N/A (N=0)" per the executive-metric rule; else a rounded percentage. */
function rateCell(rate: number | null): string {
  return rate === null ? 'N/A (N=0)' : `${Math.round(rate * 100)}%`;
}

export function completionRateTable(rate: CompletionRateLike): ChartTableSpec {
  const delta =
    rate.delta_pp === null
      ? '—'
      : `${rate.delta_pp > 0 ? '+' : ''}${Math.round(rate.delta_pp * 10) / 10} pp`;
  return {
    caption: 'Completion rate — exact figures for the current and previous period',
    columns: ['Period', 'Completion rate'],
    rows: [
      [`Current (${rate.current_from} → ${rate.current_to})`, rateCell(rate.current)],
      [`Previous (${rate.previous_from} → ${rate.previous_to})`, rateCell(rate.previous)],
    ],
    footer: ['Change', delta],
  };
}

// ─────────────────────────── Laboratory charts ───────────────────────────

export function labSliceTable(caption: string, data: SliceLike[]): ChartTableSpec {
  const total = data.reduce((sum, d) => sum + d.count, 0);
  return {
    caption: `${caption} — exact figures for all laboratory records`,
    columns: ['Category', 'Records', 'Share'],
    rows: data.map((d) => [d.label, String(d.count), pct(d.count, total)]),
    footer: ['Total', String(total), total > 0 ? '100%' : '—'],
  };
}

export function labWeeklyTable(data: WeekPointLike[]): ChartTableSpec {
  const total = data.reduce((sum, w) => sum + w.count, 0);
  return {
    caption: 'Tests created per week — exact figures for the last 8 weeks',
    columns: ['Week starting', 'Tests created'],
    rows: data.map((w) => [w.label, String(w.count)]),
    footer: ['Total', String(total)],
  };
}
