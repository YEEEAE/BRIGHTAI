"use client"

import { useEffect, useState, useMemo } from "react"
import Papa from "papaparse"
import {
  QCRow,
  parseRow,
  filterByDateRange,
  computeKPIs,
  buildParetoData,
  buildTrendData,
  buildMachineDonut,
  buildRMDonut,
  buildAIPayload,
  DateRangeFilter,
  DateRange,
} from "@/lib/dataProcessor"
import { KPICards } from "@/components/kpi-cards"
import { DateFilter } from "@/components/date-filter"
import { ParetoChart, TrendChart, DonutChart } from "@/components/qc-charts"
import { DataTable } from "@/components/data-table"
import { AIReport } from "@/components/ai-report"
import { Loader2, ShieldAlert } from "lucide-react"

export function Dashboard() {
  const [allRows, setAllRows] = useState<QCRow[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [filter, setFilter] = useState<DateRangeFilter>("all")
  const [customRange, setCustomRange] = useState<DateRange>({ from: null, to: null })

  // Load CSV on mount
  useEffect(() => {
    Papa.parse<Record<string, string>>("/data.csv", {
      header: true,
      skipEmptyLines: true,
      download: true,
      complete: (result) => {
        const parsed = result.data.map(parseRow).filter((r) => !isNaN(r.date.getTime()))
        setAllRows(parsed)
        setLoading(false)
      },
      error: (err) => {
        setFetchError(err.message)
        setLoading(false)
      },
    })
  }, [])

  const filteredRows = useMemo(
    () => filterByDateRange(allRows, filter, customRange),
    [allRows, filter, customRange]
  )
  const kpis = useMemo(() => computeKPIs(filteredRows), [filteredRows])
  const paretoData = useMemo(() => buildParetoData(filteredRows), [filteredRows])
  const trendData = useMemo(() => buildTrendData(filteredRows), [filteredRows])
  const machineDonut = useMemo(() => buildMachineDonut(filteredRows), [filteredRows])
  const rmDonut = useMemo(() => buildRMDonut(filteredRows), [filteredRows])
  const aiPayload = useMemo(() => buildAIPayload(filteredRows), [filteredRows])

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground tracking-wide">
          Loading quality control data&hellip;
        </p>
      </div>
    )
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (fetchError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-background">
        <ShieldAlert className="w-10 h-10 text-destructive" />
        <p className="text-sm font-medium text-foreground">Failed to load data.csv</p>
        <p className="text-xs text-muted-foreground max-w-sm text-center">{fetchError}</p>
      </div>
    )
  }

  // ── Dashboard ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background font-sans">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-screen-xl mx-auto px-6 py-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg font-bold text-foreground tracking-tight">
              Executive Quality Control Dashboard
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Management view — data updated weekly via{" "}
              <code className="font-mono bg-secondary px-1 rounded">public/data.csv</code>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-xs text-muted-foreground">
              {allRows.length} total records loaded
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-6 py-6 flex flex-col gap-6">
        {/* Date Filter */}
        <DateFilter
          filter={filter}
          customRange={customRange}
          onFilterChange={setFilter}
          onCustomRangeChange={setCustomRange}
          totalRows={allRows.length}
          filteredRows={filteredRows.length}
        />

        {/* KPI Cards */}
        <KPICards kpis={kpis} />

        {/* Charts Row 1: Pareto */}
        <ParetoChart data={paretoData} />

        {/* Charts Row 2: Trend */}
        <TrendChart data={trendData} />

        {/* Charts Row 3: Donuts */}
        <div className="flex flex-col gap-4 md:flex-row">
          <DonutChart
            data={machineDonut}
            title="Rejection by Machine"
            subtitle="Total rejected units per machine name"
          />
          <DonutChart
            data={rmDonut}
            title="Rejection by Raw Material Type"
            subtitle="Total rejected units per RM type"
          />
        </div>

        {/* AI Report */}
        <AIReport payload={aiPayload} />

        {/* Data Table */}
        <DataTable rows={filteredRows} />
      </main>

      <footer className="border-t border-border mt-4">
        <p className="text-xs text-muted-foreground text-center py-4">
          Management view only — Reject rate threshold: 5% critical
        </p>
      </footer>
    </div>
  )
}
