"use client"

import { QCRow, CRITICAL_THRESHOLD } from "@/lib/dataProcessor"
import { AlertTriangle } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

interface DataTableProps {
  rows: QCRow[]
}

const COLUMNS = [
  { label: "Doc No", key: "docNo" },
  { label: "Date", key: "dateStr" },
  { label: "Machine", key: "machineName" },
  { label: "Item Code", key: "itemCode" },
  { label: "Item Name", key: "itemName" },
  { label: "RM Type", key: "rmType" },
  { label: "Produced", key: "producedQty" },
  { label: "Rejected", key: "rejectedQty" },
  { label: "Reject %", key: "rejectPct" },
]

export function DataTable({ rows }: DataTableProps) {
  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">Raw Data — Filtered Records</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Rows highlighted in red exceed the 5% rejection threshold
          </p>
        </div>
        <span className="text-xs bg-secondary text-secondary-foreground px-2.5 py-1 rounded-md font-medium">
          {rows.length} records
        </span>
      </div>
      <ScrollArea className="h-[400px]">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-secondary z-10">
            <tr>
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  className="text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground px-4 py-3 whitespace-nowrap"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const isCritical = row.rejectPct > CRITICAL_THRESHOLD
              return (
                <tr
                  key={`${row.docNo}-${i}`}
                  className={`border-t border-border transition-colors ${
                    isCritical
                      ? "bg-rose-50 hover:bg-rose-100"
                      : "hover:bg-muted/40"
                  }`}
                >
                  <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground whitespace-nowrap">
                    {row.docNo}
                  </td>
                  <td className="px-4 py-2.5 text-xs whitespace-nowrap">{row.dateStr}</td>
                  <td className="px-4 py-2.5 text-xs whitespace-nowrap">{row.machineName}</td>
                  <td className="px-4 py-2.5 font-mono text-xs whitespace-nowrap">{row.itemCode}</td>
                  <td className="px-4 py-2.5 text-xs">{row.itemName}</td>
                  <td className="px-4 py-2.5 text-xs whitespace-nowrap">
                    <span className="bg-secondary text-secondary-foreground px-2 py-0.5 rounded text-xs">
                      {row.rmType}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-right font-mono whitespace-nowrap">
                    {row.producedQty.toLocaleString()}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-right font-mono whitespace-nowrap">
                    {row.rejectedQty.toLocaleString()}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-right whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1 font-semibold font-mono ${
                        isCritical ? "text-rose-600" : "text-emerald-600"
                      }`}
                    >
                      {isCritical && <AlertTriangle className="w-3 h-3" />}
                      {row.rejectPct.toFixed(2)}%
                    </span>
                  </td>
                </tr>
              )
            })}
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={COLUMNS.length}
                  className="text-center py-12 text-muted-foreground text-sm"
                >
                  No records found for the selected date range.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </ScrollArea>
    </div>
  )
}
