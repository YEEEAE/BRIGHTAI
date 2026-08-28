// Laboratory analytics charts — React island, pure SVG (no chart library).
//
// Data is computed server-side (src/lib/lab/dashboard.ts) with read-only,
// parameterized queries and passed in as props; this island only renders it.
// Every chart carries a native <title> fallback + descriptive aria-label so it
// degrades gracefully without JS, and all fills/widths use SVG attributes (NOT
// inline style attributes) so they pass CSP style-src 'self' — same rule as
// DashboardCharts.tsx.
//
// Six widgets: tests-by-week line, AIR vs VACUUM bars, PASS/FAIL/HOLD bars,
// equipment status bars, calibration donut, document review-status bars.

import { useState } from 'react';
import type { LabChartSlice, LabWeekPoint } from '../lib/lab/dashboard';

interface Props {
  testsByWeek: LabWeekPoint[];
  testsByType: LabChartSlice[];
  results: LabChartSlice[];
  equipmentStatus: LabChartSlice[];
  calibration: LabChartSlice[];
  documentStatus: LabChartSlice[];
}

// ───────────────────────── Horizontal slice bars ─────────────────────────
// One horizontal bar per slice (count + share-of-total). SVG attributes only.

function SliceBars({ data, emptyText }: { data: LabChartSlice[]; emptyText: string }) {
  const [hover, setHover] = useState<string | null>(null);
  const total = data.reduce((sum, d) => sum + d.count, 0);
  const max = Math.max(1, ...data.map((d) => d.count));

  return (
    <div className="relative">
      <ul className="space-y-3">
        {data.map((d) => {
          const pct = total > 0 ? Math.round((d.count / total) * 100) : 0;
          const widthPct = (d.count / max) * 100;
          const isHover = hover === d.key;
          return (
            <li
              key={d.key}
              data-lab-slice={d.key}
              data-count={d.count}
              className="group relative"
              onMouseEnter={() => setHover(d.key)}
              onMouseLeave={() => setHover(null)}
            >
              <div className="mb-1 flex items-baseline justify-between text-xs">
                <span className="font-medium text-slate-700">{d.label}</span>
                <span className="tabular-nums text-slate-500">
                  {d.count} <span className="text-slate-400">({pct}%)</span>
                </span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
                {/* width/fill/opacity are SVG attributes (CSP style-src 'self'). */}
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
      {total === 0 && <p className="mt-2 text-center text-xs text-slate-400">{emptyText}</p>}
    </div>
  );
}

// ─────────────────────────────── Donut chart ───────────────────────────────

function LabDonut({ data, centerLabel }: { data: LabChartSlice[]; centerLabel: string }) {
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
        aria-label={`${centerLabel}: ${data.map((d) => `${d.label} ${d.count}`).join(', ')}`}
      >
        <circle cx="100" cy="100" r={R} fill="none" stroke="#f1f5f9" strokeWidth="30" />
        {segments.map((s, i) => (
          <circle
            key={s.key}
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
            className="cursor-pointer transition-opacity duration-150 outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
          >
            <title>{`${s.label}: ${s.count} (${total > 0 ? Math.round(s.frac * 100) : 0}%)`}</title>
          </circle>
        ))}
        <text x="100" y="98" textAnchor="middle" className="fill-slate-900" fontSize={30} fontWeight={700} pointerEvents="none">
          {activeSeg ? activeSeg.count : total}
        </text>
        <text x="100" y="118" textAnchor="middle" className="fill-slate-500" fontSize={11} pointerEvents="none">
          {activeSeg ? activeSeg.label : centerLabel}
        </text>
      </svg>

      <ul className="mt-4 grid w-full grid-cols-1 gap-x-4 gap-y-1.5">
        {data.map((d) => (
          <li key={d.key} className="flex items-center gap-2 text-xs text-slate-600">
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

// ─────────────────────────────── Line chart ───────────────────────────────

const LINE_W = 640;
const LINE_H = 230;
const LINE_PAD_L = 30;
const LINE_PAD_R = 12;
const LINE_PAD_T = 16;
const LINE_PAD_B = 34;

function LabLineChart({ data }: { data: LabWeekPoint[] }) {
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
        aria-label={`Tests created per week (last 8 weeks): ${data
          .map((d) => `${d.label} ${d.count}`)
          .join(', ')}`}
      >
        <defs>
          <linearGradient id="lab-line-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
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

        {areaPath && <path d={areaPath} fill="url(#lab-line-fill)" />}
        <path
          d={linePath}
          fill="none"
          stroke="#6366f1"
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
              stroke="#6366f1"
              strokeWidth="2.5"
              tabIndex={0}
            >
              <title>{`${p.label}: ${p.count} tests created`}</title>
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

      <p className="mt-2 text-xs text-slate-500" aria-live="polite">
        {activePoint
          ? `${activePoint.label}: ${activePoint.count} test${activePoint.count === 1 ? '' : 's'} created — selected point`
          : `${total} test${total === 1 ? '' : 's'} created in the last 8 weeks.`}
      </p>
    </div>
  );
}

// ─────────────────────────── Island root ───────────────────────────

export default function LabDashboardCharts({
  testsByWeek,
  testsByType,
  results,
  equipmentStatus,
  calibration,
  documentStatus,
}: Props) {
  return (
    <div className="mt-6 grid gap-4 lg:grid-cols-3">
      <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-5 lg:col-span-3">
        <h3 className="text-sm font-semibold text-slate-900">Tests by date</h3>
        <p className="mb-4 text-xs text-slate-500">Tests created per week, last 8 weeks</p>
        <LabLineChart data={testsByWeek} />
      </div>

      <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-5">
        <h3 className="text-sm font-semibold text-slate-900">AIR vs VACUUM</h3>
        <p className="mb-4 text-xs text-slate-500">Tests by type</p>
        <SliceBars data={testsByType} emptyText="No tests recorded yet." />
      </div>

      <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-5">
        <h3 className="text-sm font-semibold text-slate-900">Final results</h3>
        <p className="mb-4 text-xs text-slate-500">PASS / FAIL / HOLD (excludes voided)</p>
        <SliceBars data={results} emptyText="No final results yet." />
      </div>

      <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-5">
        <h3 className="text-sm font-semibold text-slate-900">Equipment status</h3>
        <p className="mb-4 text-xs text-slate-500">Non-archived equipment by registry status</p>
        <SliceBars data={equipmentStatus} emptyText="No equipment registered." />
      </div>

      <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-5">
        <h3 className="text-sm font-semibold text-slate-900">Calibration</h3>
        <p className="mb-4 text-xs text-slate-500">Derived from the latest calibration due date</p>
        <LabDonut data={calibration} centerLabel="equipment" />
      </div>

      <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-5 lg:col-span-2">
        <h3 className="text-sm font-semibold text-slate-900">Document review status</h3>
        <p className="mb-4 text-xs text-slate-500">Controlled documents (SOP / WI) by lifecycle status</p>
        <SliceBars data={documentStatus} emptyText="No controlled documents yet." />
      </div>
    </div>
  );
}
