// Accessible chart→table toggle (PROMPT-07 / AC-03, AC-05).
//
// Every dashboard/laboratory SVG chart renders this control. Closed by
// default; when opened it renders a 1-to-1 semantic <table> (caption, th
// scope="col", th scope="row", tfoot summary) derived from the SAME data the
// chart draws — the equivalence contract is asserted by
// scripts/test-dashboard-analytics-100.mjs.
//
// The table is conditionally rendered (not display:none), so it is fully
// available to screen readers whenever it is on screen.

import { useState } from 'react';
import type { ChartTableSpec } from '../../lib/chartTables';

interface Props {
  spec: ChartTableSpec;
  /** Deterministic id — one chart per id per page (used as aria-controls). */
  tableId: string;
}

export default function ChartTableToggle({ spec, tableId }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-4" aria-label={spec.caption}>
      <button
        type="button"
        data-chart-table-toggle={tableId}
        aria-expanded={open}
        aria-controls={tableId}
        className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 qc-focus"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? 'عرض كرسم بياني' : 'عرض كجدول بيانات'}
      </button>

      {open && (
        <div className="mt-3 overflow-x-auto" data-chart-table-wrapper={tableId}>
          <table id={tableId} data-chart-table={tableId} className="w-full min-w-max border-collapse text-sm">
            <caption className="caption-bottom pb-2 text-left text-xs text-slate-500">
              {spec.caption}
            </caption>
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-600">
                {spec.columns.map((column) => (
                  <th key={column} scope="col" className="px-3 py-2 font-semibold">
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {spec.rows.map((row, rowIndex) => (
                <tr key={rowIndex} className="hover:bg-slate-50">
                  {row.map((cell, cellIndex) =>
                    cellIndex === 0 ? (
                      <th key={cellIndex} scope="row" className="px-3 py-2 text-left font-medium text-slate-800">
                        {cell}
                      </th>
                    ) : (
                      <td key={cellIndex} className="px-3 py-2 tabular-nums text-slate-700">
                        {cell}
                      </td>
                    ),
                  )}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-slate-300 bg-slate-50 font-semibold text-slate-900">
                {spec.footer.map((cell, cellIndex) =>
                  cellIndex === 0 ? (
                    <th key={cellIndex} scope="row" className="px-3 py-2 text-left">
                      {cell}
                    </th>
                  ) : (
                    <td key={cellIndex} className="px-3 py-2 tabular-nums">
                      {cell}
                    </td>
                  ),
                )}
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
