// Dashboard analytics charts — React island, pure SVG (no chart library).
//
// The data is computed server-side (src/lib/dashboard.ts) with read-only,
// parameterized queries and passed in as props; this island only renders it.
// All charts are interactive (hover tooltips) but also carry native <title>
// fallbacks and descriptive aria-labels, so they degrade gracefully without JS.
//
// Six widgets live here: status donut, priority bars, per-employee stacked
// bars, overdue-by-employee bars, completed-per-week line, and the
// completion-rate-vs-previous-period card.

import { useState } from 'react';

// ── shared prop types (mirror src/lib/dashboard.ts) ──
export interface DonutSlice {
  status: string;
  label: string;
  color: string;
  count: number;
}

export interface PrioritySlice {
  priority: string;
  label: string;
  color: string;
  count: number;
}

export interface EmployeeBar {
  user_id: number;
  full_name: string;
  total: number;
  statuses: DonutSlice[];
}

export interface OverdueEmployee {
  user_id: number;
  full_name: string;
  count: number;
}

export interface WeekPoint {
  weekStart: string;
  label: string;
  count: number;
}

export interface CompletionRateProps {
  current: number | null;
  previous: number | null;
  delta_pp: number | null;
  current_from: string;
  current_to: string;
  previous_from: string;
  previous_to: string;
}

interface Props {
  donut: DonutSlice[];
  priority: PrioritySlice[];
  bar: EmployeeBar[];
  overdueByEmployee: OverdueEmployee[];
  line: WeekPoint[];
  completionRate: CompletionRateProps;
}

const TOOLTIP_CLS =
  'pointer-events-none absolute z-10 -translate-x-1/2 rounded-md bg-slate-900 px-2 py-1 text-xs font-medium text-white shadow';

// ─────────────────────────── Donut chart ───────────────────────────

function DonutChart({ data }: { data: DonutSlice[] }) {
  const [active, setActive] = useState<number | null>(null);
  const total = data.reduce((sum, d) => sum + d.count, 0);
  const R = 76;
  const C = 2 * Math.PI * R;
  let acc = 0;
  const segments = data
    .filter((d) => d.count > 0)
    .map((d) => {
      const frac = total > 0 ? d.count / total : 0;
      const seg = { ...d, start: acc, frac };
      acc += frac;
      return seg;
    });
  const activeSeg = active !== null ? segments[active] : null;

  return (
    <div className="relative flex flex-col items-center">
      <svg
        viewBox="0 0 200 200"
        className="h-52 w-52"
        role="img"
        aria-label={`Tasks by status: ${data
          .map((d) => `${d.label} ${d.count}`)
          .join(', ')}`}
      >
        {/* track */}
        <circle cx="100" cy="100" r={R} fill="none" stroke="#f1f5f9" strokeWidth="30" />
        {segments.map((s, i) => (
          <circle
            key={s.status}
            cx="100"
            cy="100"
            r={R}
            fill="none"
            stroke={s.color}
            strokeWidth="30"
            strokeDasharray={`${Math.max(s.frac * C - 2, 0.5)} ${C}`}
            strokeDashoffset={-(s.start * C)}
            transform="rotate(-90 100 100)"
            opacity={active === null || active === i ? 1 : 0.3}
            onMouseEnter={() => setActive(i)}
            onMouseLeave={() => setActive(null)}
            onFocus={() => setActive(i)}
            onBlur={() => setActive(null)}
            tabIndex={0}
            // outline-none already carries outline-offset 2px in Tailwind v3.4,
            // so no inline style attribute is needed here (CSP style-src 'self').
            className="cursor-pointer transition-opacity duration-qc-fast ease-qc-standard outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
          >
            <title>{`${s.label}: ${s.count} (${total > 0 ? Math.round(s.frac * 100) : 0}%)`}</title>
          </circle>
        ))}
        {/* center label — pointer-events none so the ring segments stay hoverable */}
        <text
          x="100"
          y="98"
          textAnchor="middle"
          className="fill-slate-900"
          fontSize={30}
          fontWeight={700}
          pointerEvents="none"
        >
          {activeSeg ? activeSeg.count : total}
        </text>
        <text
          x="100"
          y="118"
          textAnchor="middle"
          className="fill-slate-500"
          fontSize={11}
          pointerEvents="none"
        >
          {activeSeg ? activeSeg.label : 'tasks'}
        </text>
      </svg>

      {/* legend */}
      <ul className="mt-4 grid w-full grid-cols-2 gap-x-4 gap-y-1.5">
        {data.map((d) => (
          <li key={d.status} className="flex items-center gap-2 text-xs text-slate-600">
            <svg className="h-2.5 w-2.5 shrink-0" viewBox="0 0 10 10" aria-hidden="true">
              <circle cx="5" cy="5" r="5" fill={d.color} />
            </svg>
            <span className="flex-1 truncate">{d.label}</span>
            <span className="font-semibold tabular-nums text-slate-900">{d.count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─────────────────────────── Priority bar chart ───────────────────────────
// Horizontal bars, one per priority, with the count + share-of-total.

function PriorityChart({ data }: { data: PrioritySlice[] }) {
  const [hover, setHover] = useState<string | null>(null);
  const total = data.reduce((sum, d) => sum + d.count, 0);
  const max = Math.max(1, ...data.map((d) => d.count));

  return (
    <div className="relative">
      <ul className="space-y-3">
        {data.map((d) => {
          const pct = total > 0 ? Math.round((d.count / total) * 100) : 0;
          const widthPct = (d.count / max) * 100;
          const isHover = hover === d.priority;
          return (
            <li
              key={d.priority}
              data-priority-bar={d.priority}
              data-count={d.count}
              className="group relative"
              onMouseEnter={() => setHover(d.priority)}
              onMouseLeave={() => setHover(null)}
            >
              <div className="mb-1 flex items-baseline justify-between text-xs">
                <span className="font-medium text-slate-700">{d.label}</span>
                <span className="tabular-nums text-slate-500">
                  {d.count} <span className="text-slate-400">({pct}%)</span>
                </span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
                {/* width/fill/opacity are SVG attributes here (not inline style
                    attributes), so they are allowed by CSP style-src 'self'. */}
                <svg className="block h-full w-full" aria-hidden="true">
                  <rect
                    x="0"
                    y="0"
                    width={`${widthPct}%`}
                    height="100%"
                    fill={d.color}
                    opacity={hover === null || isHover ? 1 : 0.45}
                    rx="9999"
                  />
                </svg>
              </div>
            </li>
          );
        })}
      </ul>
      {total === 0 && (
        <p className="mt-2 text-center text-xs text-slate-400">
          No tasks match the current filters.
        </p>
      )}
      {hover && (() => {
        const d = data.find((x) => x.priority === hover)!;
        const pct = total > 0 ? Math.round((d.count / total) * 100) : 0;
        return (
          <div className={TOOLTIP_CLS} style={{ left: '50%', top: '-8px' }} role="tooltip">
            <span className="mr-1 inline-block h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} aria-hidden="true" />
            {d.label}: {d.count} ({pct}%)
          </div>
        );
      })()}
    </div>
  );
}

// ─────────────────────────── Stacked bar chart ───────────────────────────

const BAR_H = 210;
const BAR_PAD_L = 30;
const BAR_PAD_B = 38;
const BAR_PAD_T = 12;

function BarChart({ data }: { data: EmployeeBar[] }) {
  const [hover, setHover] = useState<{ user: number; status: string; label: string; value: number; color: string } | null>(null);
  const maxTotal = Math.max(1, ...data.map((d) => d.total));
  const slotW = 64;
  const width = Math.max(520, data.length * slotW + BAR_PAD_L + 8);
  const innerH = BAR_H - BAR_PAD_T - BAR_PAD_B;
  const yFor = (v: number) => BAR_PAD_T + innerH - (v / maxTotal) * innerH;
  // Rounding can collide for small maxima (e.g. maxTotal 3 → [0,1,2,2,3]), so
  // dedupe before using values as React keys.
  const gridVals = [...new Set([0, 0.25, 0.5, 0.75, 1].map((g) => Math.round(g * maxTotal)))];
  const barW = Math.min(34, slotW - 20);

  if (data.length === 0 || data.every((d) => d.total === 0)) {
    return (
      <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
        No tasks assigned to active users match the current filters.
      </p>
    );
  }

  return (
    <div className="relative min-w-0">
      <div className="min-w-0 overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${BAR_H}`}
          // Natural size: the width attribute (not an inline style) keeps the
          // chart at its designed pixel width, and the overflow-x-auto wrapper
          // scrolls when the team is large, so labels never get squashed by a
          // viewBox downscale (CSP style-src 'self' allows SVG attributes).
          width={width}
          role="img"
          aria-label={`Tasks per employee: ${data
            .map((d) => `${d.full_name} ${d.total}`)
            .join(', ')}`}
        >
          {/* gridlines + y labels */}
          {gridVals.map((g, gi) => (
            <g key={`y-${gi}`}>
              <line
                x1={BAR_PAD_L}
                x2={width - 4}
                y1={yFor(g)}
                y2={yFor(g)}
                stroke="#e2e8f0"
                strokeDasharray={g === 0 ? undefined : '3 3'}
              />
              <text x={BAR_PAD_L - 6} y={yFor(g) + 3.5} textAnchor="end" className="fill-slate-400" fontSize={10}>
                {g}
              </text>
            </g>
          ))}

          {data.map((user, ui) => {
            const slotX = BAR_PAD_L + ui * slotW;
            const barLeft = slotX + (slotW - barW) / 2;
            let cum = 0;
            const segments = user.statuses
              .filter((s) => s.count > 0)
              .map((s) => {
                const h = (s.count / maxTotal) * innerH;
                const seg = { ...s, y: yFor(cum + s.count), h, cum };
                cum += s.count;
                return seg;
              });
            return (
              <g key={user.user_id}>
                {segments.map((s) => (
                  <rect
                    key={s.status}
                    x={barLeft}
                    y={s.y}
                    width={barW}
                    height={s.h}
                    fill={s.color}
                    rx={2}
                    opacity={hover ? (hover.user === user.user_id && hover.status === s.status ? 1 : 0.65) : 1}
                    className="cursor-pointer transition-opacity duration-qc-fast ease-qc-standard"
                    onMouseEnter={() =>
                      setHover({ user: user.user_id, status: s.status, label: s.label, value: s.count, color: s.color })
                    }
                    onMouseLeave={() => setHover(null)}
                    onFocus={() =>
                      setHover({ user: user.user_id, status: s.status, label: s.label, value: s.count, color: s.color })
                    }
                    onBlur={() => setHover(null)}
                    tabIndex={0}
                  >
                    <title>{`${user.full_name} — ${s.label}: ${s.count}`}</title>
                  </rect>
                ))}
                {/* total on top */}
                <text
                  x={slotX + slotW / 2}
                  y={yFor(user.total) - 5}
                  textAnchor="middle"
                  className="fill-slate-600"
                  fontSize={11}
                  fontWeight={600}
                >
                  {user.total}
                </text>
                {/* name */}
                <text
                  x={slotX + slotW / 2}
                  y={BAR_H - 14}
                  textAnchor="middle"
                  className="fill-slate-600"
                  fontSize={10.5}
                >
                  <title>{user.full_name}</title>
                  {user.full_name.length > 13 ? `${user.full_name.slice(0, 12)}…` : user.full_name}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* status legend */}
      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
        {['not_started', 'in_progress', 'on_hold', 'completed', 'cancelled'].map((status) => {
          const slice = data[0]?.statuses.find((s) => s.status === status);
          return (
            <li key={status} className="flex items-center gap-1.5 text-xs text-slate-600">
              <svg className="h-2.5 w-2.5" viewBox="0 0 10 10" aria-hidden="true">
                <rect x="0" y="0" width="10" height="10" rx="2" fill={slice?.color ?? '#94a3b8'} />
              </svg>
              {slice?.label ?? status}
            </li>
          );
        })}
      </ul>

      {hover && (() => {
        const userIdx = data.findIndex((d) => d.user_id === hover.user);
        const leftPct =
          userIdx >= 0
            ? ((BAR_PAD_L + userIdx * slotW + slotW / 2) / width) * 100
            : 50;
        return (
          <div
            className={TOOLTIP_CLS}
            style={{ left: `${leftPct}%`, top: '-8px' }}
            role="tooltip"
          >
            <span className="mr-1 inline-block h-2 w-2 rounded-full" style={{ backgroundColor: hover.color }} aria-hidden="true" />
            {hover.label}: {hover.value}
          </div>
        );
      })()}
    </div>
  );
}

// ─────────────────────── Overdue by employee ───────────────────────
// Horizontal bars, one per active user with overdue tasks. Red-tinted so it
// reads as "needs attention". Users with zero overdue tasks are omitted.

function OverdueByEmployeeChart({ data }: { data: OverdueEmployee[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...data.map((d) => d.count));

  if (data.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
        No overdue tasks — great job! 🎉
      </p>
    );
  }

  return (
    <div className="relative">
      <ul className="space-y-2.5">
        {data.map((d) => {
          const widthPct = (d.count / max) * 100;
          const isHover = hover === d.user_id;
          return (
            <li
              key={d.user_id}
              data-overdue-emp={d.user_id}
              data-count={d.count}
              className="group relative"
              onMouseEnter={() => setHover(d.user_id)}
              onMouseLeave={() => setHover(null)}
            >
              <div className="mb-1 flex items-baseline justify-between text-xs">
                <span className="truncate font-medium text-slate-700">{d.full_name}</span>
                <span className="tabular-nums font-semibold text-rose-700">{d.count}</span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-rose-50">
                {/* SVG attributes instead of inline style (CSP style-src 'self'). */}
                <svg className="block h-full w-full" aria-hidden="true">
                  <rect
                    x="0"
                    y="0"
                    width={`${widthPct}%`}
                    height="100%"
                    fill="#dc2626"
                    opacity={hover === null || isHover ? 1 : 0.4}
                    rx="9999"
                  />
                </svg>
              </div>
            </li>
          );
        })}
      </ul>
      {hover !== null &&
        (() => {
          const d = data.find((x) => x.user_id === hover);
          if (!d) return null;
          return (
            <div className={TOOLTIP_CLS} style={{ left: '50%', top: '-8px' }} role="tooltip">
              {d.full_name}: {d.count} overdue
            </div>
          );
        })()}
    </div>
  );
}

// ─────────────────────────── Line chart ───────────────────────────

const LINE_W = 640;
const LINE_H = 230;
const LINE_PAD_L = 30;
const LINE_PAD_R = 12;
const LINE_PAD_T = 16;
const LINE_PAD_B = 34;

function LineChart({ data }: { data: WeekPoint[] }) {
  const [active, setActive] = useState<number | null>(null);
  const maxCount = Math.max(4, ...data.map((d) => d.count));
  const innerW = LINE_W - LINE_PAD_L - LINE_PAD_R;
  const innerH = LINE_H - LINE_PAD_T - LINE_PAD_B;
  const xFor = (i: number) =>
    LINE_PAD_L + (data.length <= 1 ? innerW / 2 : (i / (data.length - 1)) * innerW);
  const yFor = (v: number) => LINE_PAD_T + innerH - (v / maxCount) * innerH;
  const points = data.map((d, i) => ({ ...d, x: xFor(i), y: yFor(d.count) }));
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const areaPath =
    points.length > 0
      ? `${linePath} L${points[points.length - 1].x},${LINE_PAD_T + innerH} L${points[0].x},${LINE_PAD_T + innerH} Z`
      : '';
  const total = data.reduce((sum, w) => sum + w.count, 0);
  const gridVals = [...new Set([0, 0.25, 0.5, 0.75, 1].map((g) => Math.round(g * maxCount)))];
  const activePoint = active !== null ? points[active] : null;

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${LINE_W} ${LINE_H}`}
        className="w-full"
        role="img"
        aria-label={`Tasks completed per week (last 8 weeks): ${data
          .map((d) => `${d.label} ${d.count}`)
          .join(', ')}`}
      >
        <defs>
          <linearGradient id="line-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22c55e" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
          </linearGradient>
        </defs>

        {gridVals.map((g, gi) => (
          <g key={`y-${gi}`}>
            <line
              x1={LINE_PAD_L}
              x2={LINE_W - LINE_PAD_R}
              y1={yFor(g)}
              y2={yFor(g)}
              stroke="#e2e8f0"
              strokeDasharray={g === 0 ? undefined : '3 3'}
            />
            <text x={LINE_PAD_L - 6} y={yFor(g) + 3.5} textAnchor="end" className="fill-slate-400" fontSize={10}>
              {g}
            </text>
          </g>
        ))}

        {areaPath && <path d={areaPath} fill="url(#line-fill)" />}
        <path
          d={linePath}
          fill="none"
          stroke="#22c55e"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {points.map((p, i) => (
          <g
            key={p.weekStart}
            onMouseEnter={() => setActive(i)}
            onMouseLeave={() => setActive(null)}
            onFocus={() => setActive(i)}
            onBlur={() => setActive(null)}
            className="cursor-pointer"
          >
            <circle
              cx={p.x}
              cy={p.y}
              r={active === i ? 6.5 : 4.5}
              fill="#fff"
              stroke="#22c55e"
              strokeWidth="2.5"
              tabIndex={0}
            >
              <title>{`${p.label}: ${p.count} completed`}</title>
            </circle>
            <text
              x={p.x}
              y={LINE_H - 12}
              textAnchor="middle"
              className={active === i ? 'fill-slate-900' : 'fill-slate-500'}
              fontSize={10.5}
              fontWeight={active === i ? 600 : 400}
            >
              {p.label}
            </text>
          </g>
        ))}
      </svg>

      <p className="mt-2 text-xs text-slate-500">
        {total} task{total === 1 ? '' : 's'} completed in the last 8 weeks.
      </p>

      {activePoint && (
        <div
          className={TOOLTIP_CLS}
          style={{ left: `${(activePoint.x / LINE_W) * 100}%`, top: '-10px' }}
          role="tooltip"
        >
          {activePoint.label}: {activePoint.count} completed
        </div>
      )}
    </div>
  );
}

// ─────────────────────── Completion rate card ───────────────────────
// Big current rate, with the delta vs the previous period (percentage points)
// and a small comparison so the trend is obvious at a glance.

function CompletionRateCard({ data }: { data: CompletionRateProps }) {
  const cur = data.current;
  const prev = data.previous;
  const delta = data.delta_pp;
  const curPct = cur !== null ? Math.round(cur * 100) : null;
  const prevPct = prev !== null ? Math.round(prev * 100) : null;
  const up = delta !== null && delta > 0;
  const down = delta !== null && delta < 0;
  const flat = delta === 0;
  const deltaColor = up ? 'text-emerald-600' : down ? 'text-rose-600' : 'text-slate-500';
  const arrow = up ? '▲' : down ? '▼' : flat ? '■' : '';

  return (
    <div className="flex h-full flex-col" data-completion-card data-current={curPct ?? ''} data-previous={prevPct ?? ''} data-delta={delta ?? ''}>
      <div className="flex items-baseline gap-3">
        <span
          className="text-4xl font-semibold tabular-nums text-slate-900"
          aria-label={`Completion rate ${curPct ?? '—'} percent`}
        >
          {curPct !== null ? `${curPct}%` : '—'}
        </span>
        {delta !== null && (
          <span className={`text-sm font-semibold tabular-nums ${deltaColor}`}>
            <span aria-hidden="true">{arrow}</span>{' '}
            {Math.abs(delta) < 0.5 ? '< 1' : Math.abs(Math.round(delta))} pp
          </span>
        )}
      </div>
      <p className="mt-1 text-xs text-slate-500">
        vs previous period ({prevPct !== null ? `${prevPct}%` : '—'})
      </p>
      {/* progress bar representing the current rate */}
      <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
        {/* SVG width attribute instead of inline style (CSP style-src 'self'). */}
        <svg className="block h-full w-full" aria-hidden="true">
          <rect x="0" y="0" width={`${curPct ?? 0}%`} height="100%" fill="#10b981" rx="9999" />
        </svg>
      </div>
      <p className="mt-3 text-[11px] leading-relaxed text-slate-400">
        Current: {data.current_from} → {data.current_to}
        <br />
        Previous: {data.previous_from} → {data.previous_to}
      </p>
    </div>
  );
}

// ─────────────────────────── Island root ───────────────────────────

export default function DashboardCharts({
  donut,
  priority,
  bar,
  overdueByEmployee,
  line,
  completionRate,
}: Props) {
  return (
    <>
      <section aria-label="Analytics" className="mt-8 grid gap-4 lg:grid-cols-3">
        <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-900">Tasks by status</h2>
          <p className="mb-4 text-xs text-slate-500">Distribution across all statuses</p>
          <DonutChart data={donut} />
        </div>

        <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-900">Completion rate</h2>
          <p className="mb-4 text-xs text-slate-500">Completed vs total, current vs previous period</p>
          <CompletionRateCard data={completionRate} />
        </div>

        <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-900">Tasks by priority</h2>
          <p className="mb-4 text-xs text-slate-500">Count and share per priority</p>
          <PriorityChart data={priority} />
        </div>

        <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-5 lg:col-span-3">
          <h2 className="text-sm font-semibold text-slate-900">Completed per week</h2>
          <p className="mb-4 text-xs text-slate-500">Completions from completed_at, last 8 weeks</p>
          <LineChart data={line} />
        </div>

        <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-5 lg:col-span-2">
          <h2 className="text-sm font-semibold text-slate-900">Tasks per employee</h2>
          <p className="mb-4 text-xs text-slate-500">Assigned tasks, split by status</p>
          <BarChart data={bar} />
        </div>

        <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-900">Overdue by employee</h2>
          <p className="mb-4 text-xs text-slate-500">Overdue tasks assigned to each active user</p>
          <OverdueByEmployeeChart data={overdueByEmployee} />
        </div>
      </section>
    </>
  );
}
