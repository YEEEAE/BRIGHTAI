import { parseISO, isWithinInterval, subDays, startOfDay, endOfDay } from "date-fns"

export interface QCRow {
  date: Date
  dateStr: string
  docNo: string
  machineName: string
  itemCode: string
  itemName: string
  producedQty: number
  rejectedQty: number
  rejectPct: number
  rmType: string
}

export type DateRangeFilter = "all" | "7days" | "30days" | "custom"

export interface DateRange {
  from: Date | null
  to: Date | null
}

export function parseRow(raw: Record<string, string>): QCRow {
  const dateStr = raw["Date"]?.trim() ?? ""
  return {
    date: parseISO(dateStr),
    dateStr,
    docNo: raw["DocNo"]?.trim() ?? "",
    machineName: raw["Machine Name"]?.trim() ?? "",
    itemCode: raw["Producted Item.Code"]?.trim() ?? "",
    itemName: raw["Producted Item.Name"]?.trim() ?? "",
    producedQty: parseFloat(raw["Producted Qty"] ?? "0") || 0,
    rejectedQty: parseFloat(raw["Quantity (Rejected)"] ?? "0") || 0,
    rejectPct: parseFloat(raw["Reject %"] ?? "0") || 0,
    rmType: raw["RM TYPE"]?.trim() ?? "",
  }
}

export function filterByDateRange(
  rows: QCRow[],
  filter: DateRangeFilter,
  customRange?: DateRange
): QCRow[] {
  const now = new Date()
  if (filter === "all") return rows

  if (filter === "7days") {
    const start = startOfDay(subDays(now, 6))
    const end = endOfDay(now)
    return rows.filter((r) => isWithinInterval(r.date, { start, end }))
  }

  if (filter === "30days") {
    const start = startOfDay(subDays(now, 29))
    const end = endOfDay(now)
    return rows.filter((r) => isWithinInterval(r.date, { start, end }))
  }

  if (filter === "custom" && customRange?.from && customRange?.to) {
    const start = startOfDay(customRange.from)
    const end = endOfDay(customRange.to)
    return rows.filter((r) => isWithinInterval(r.date, { start, end }))
  }

  return rows
}

export const CRITICAL_THRESHOLD = 5

export interface KPIs {
  totalProduced: number
  totalRejected: number
  avgRejectPct: number
  criticalAlerts: number
}

export function computeKPIs(rows: QCRow[]): KPIs {
  const totalProduced = rows.reduce((s, r) => s + r.producedQty, 0)
  const totalRejected = rows.reduce((s, r) => s + r.rejectedQty, 0)
  const avgRejectPct =
    rows.length > 0
      ? rows.reduce((s, r) => s + r.rejectPct, 0) / rows.length
      : 0
  const criticalAlerts = rows.filter(
    (r) => r.rejectPct > CRITICAL_THRESHOLD
  ).length
  return { totalProduced, totalRejected, avgRejectPct, criticalAlerts }
}

export interface ParetoPoint {
  itemCode: string
  itemName: string
  rejected: number
  cumulativePct: number
}

export function buildParetoData(rows: QCRow[]): ParetoPoint[] {
  const map: Record<string, { name: string; rejected: number }> = {}
  for (const r of rows) {
    if (!map[r.itemCode]) map[r.itemCode] = { name: r.itemName, rejected: 0 }
    map[r.itemCode].rejected += r.rejectedQty
  }
  const sorted = Object.entries(map)
    .map(([code, v]) => ({ itemCode: code, itemName: v.name, rejected: v.rejected }))
    .sort((a, b) => b.rejected - a.rejected)
  const total = sorted.reduce((s, p) => s + p.rejected, 0)
  let cumulative = 0
  return sorted.map((p) => {
    cumulative += p.rejected
    return {
      itemCode: p.itemCode,
      itemName: p.itemName,
      rejected: p.rejected,
      cumulativePct: total > 0 ? parseFloat(((cumulative / total) * 100).toFixed(1)) : 0,
    }
  })
}

export interface TrendPoint {
  date: string
  rejectPct: number
}

export function buildTrendData(rows: QCRow[]): TrendPoint[] {
  const map: Record<string, number[]> = {}
  for (const r of rows) {
    if (!map[r.dateStr]) map[r.dateStr] = []
    map[r.dateStr].push(r.rejectPct)
  }
  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, vals]) => ({
      date,
      rejectPct: parseFloat(
        (vals.reduce((s, v) => s + v, 0) / vals.length).toFixed(2)
      ),
    }))
}

export interface DonutPoint {
  name: string
  value: number
}

export function buildMachineDonut(rows: QCRow[]): DonutPoint[] {
  const map: Record<string, number> = {}
  for (const r of rows) {
    map[r.machineName] = (map[r.machineName] ?? 0) + r.rejectedQty
  }
  return Object.entries(map).map(([name, value]) => ({ name, value }))
}

export function buildRMDonut(rows: QCRow[]): DonutPoint[] {
  const map: Record<string, number> = {}
  for (const r of rows) {
    map[r.rmType] = (map[r.rmType] ?? 0) + r.rejectedQty
  }
  return Object.entries(map).map(([name, value]) => ({ name, value }))
}

export interface AggregatedCritical {
  machineName: string
  itemCode: string
  itemName: string
  avgRejectPct: number
  totalRejected: number
}

export function buildAIPayload(rows: QCRow[]): AggregatedCritical[] {
  const critical = rows.filter((r) => r.rejectPct > CRITICAL_THRESHOLD)
  const map: Record<string, { machine: string; item: string; name: string; vals: number[]; rejected: number }> = {}
  for (const r of critical) {
    const key = `${r.machineName}||${r.itemCode}`
    if (!map[key]) map[key] = { machine: r.machineName, item: r.itemCode, name: r.itemName, vals: [], rejected: 0 }
    map[key].vals.push(r.rejectPct)
    map[key].rejected += r.rejectedQty
  }
  return Object.values(map).map((v) => ({
    machineName: v.machine,
    itemCode: v.item,
    itemName: v.name,
    avgRejectPct: parseFloat((v.vals.reduce((s, x) => s + x, 0) / v.vals.length).toFixed(2)),
    totalRejected: v.rejected,
  }))
}
