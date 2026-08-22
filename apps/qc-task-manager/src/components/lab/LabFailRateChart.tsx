// FAIL-rate trend chart — React island, pure SVG (no chart library).
//
// Same CSP-safe patterns as LabDashboardCharts.tsx: every visual value is an
// SVG attribute (never an inline style attribute), the chart carries role="img"
// plus a descriptive aria-label, and every point has a native <title> fallback
// so it degrades gracefully without JS. Data is computed server-side by
// src/lib/lab/trends.ts (read-only, parameterized) and passed in as props.

import { useState } from 'react';
import type { LabFailRatePoint } from '../../lib/lab/trends';

interface Props {
  points: LabFailRatePoint[];
  granularity: 'week' | 'month';
}

const W = 640;
const H = 230;
const PAD_L = 36;
const PAD_R = 12;
const PAD_T = 16;
const PAD_B = 34;

export default function LabFailRateChart({ points, granularity }: Props) {
  const [active, setActive] = useState<number | null>(null);

  const innerW = W - PAD_L - PAD_R;
  const innerH = H - PAD_T - PAD_B;
  // Always show the full 0–100% scale so a single bad week doesn't look flat.
  const yFor = (v: number) => PAD_T + innerH - (v / 100) * innerH;
  const xFor = (i: number) =>
    PAD_L + (points.length <= 1 ? innerW / 2 : (i / (points.length - 1)) * innerW);

  // Only decided buckets (failRate !== null) are plotted; gaps keep the line honest.
  const plotted = points
    .map((p, i) => ({ ...p, x: xFor(i), y: p.failRate === null ? null : yFor(p.failRate) }))
    .filter((p) => p.y !== null) as Array<LabFailRatePoint & { x: number; y: number }>;

  // Split the path at gaps (null buckets) into separate segments.
  const segments: string[] = [];
  let current: string[] = [];
  for (const p of plotted) {
    current.push(`${current.length === 0 ? 'M' : 'L'}${p.x},${p.y}`);
  }
  if (current.length > 0) segments.push(current.join(' '));

  const gridVals = [0, 25, 50, 75, 100];
  const activePoint = active !== null ? points[active] : null;
  const totalDecided = points.reduce((sum, p) => sum + p.total, 0);
  const totalFail = points.reduce((sum, p) => sum + p.fail, 0);
  const noun = granularity === 'month' ? 'month' : 'week';

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        role="img"
        aria-label={`FAIL rate per ${noun} (last ${points.length} ${noun}s, VOID excluded): ${points
          .map((p) => `${p.label} ${p.failRate === null ? 'no decided tests' : `${p.failRate}% (${p.fail}/${p.total})`}`)
          .join(', ')}`}
      >
        {gridVals.map((g) => (
          <g key={g}>
            <line
              x1={PAD_L}
              x2={W - PAD_R}
              y1={yFor(g)}
              y2={yFor(g)}
              stroke="#e2e8f0"
              strokeDasharray={g === 0 ? undefined : '3 3'}
            />
            <text x={PAD_L - 6} y={yFor(g) + 3.5} textAnchor="end" className="fill-slate-400" fontSize={10}>
              {g}%
            </text>
          </g>
        ))}

        {segments.map((d, i) => (
          <path key={i} d={d} fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        ))}

        {points.map((p, i) => (
          <g
            key={p.bucket}
            onMouseEnter={() => setActive(i)}
            onMouseLeave={() => setActive(null)}
            onFocus={() => setActive(i)}
            onBlur={() => setActive(null)}
            className="cursor-pointer"
          >
            {p.failRate !== null && (
              <circle
                cx={xFor(i)}
                cy={yFor(p.failRate)}
                r={active === i ? 6.5 : 4.5}
                fill="#fff"
                stroke="#ef4444"
                strokeWidth="2.5"
                className="transition-all duration-150"
                tabIndex={0}
              >
                <title>{`${p.label}: ${p.failRate}% FAIL (${p.fail} of ${p.total} decided tests, VOID excluded)`}</title>
              </circle>
            )}
            <text
              x={xFor(i)}
              y={H - 12}
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
          ? activePoint.failRate === null
            ? `${activePoint.label}: no decided tests — selected point`
            : `${activePoint.label}: ${activePoint.failRate}% FAIL (${activePoint.fail}/${activePoint.total}) — selected point`
          : totalDecided === 0
            ? 'No decided tests in this window yet.'
            : `${totalFail} FAIL out of ${totalDecided} decided tests in the last ${points.length} ${noun}s (VOID excluded).`}
      </p>
    </div>
  );
}
