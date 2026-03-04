"use client"

import { KPIs, CRITICAL_THRESHOLD } from "@/lib/dataProcessor"
import { Factory, PackageX, AlertTriangle, TrendingUp } from "lucide-react"

interface KPICardsProps {
  kpis: KPIs
}

interface CardConfig {
  label: string
  value: string
  subtext: string
  icon: React.ReactNode
  accent: string
  textAccent: string
}

export function KPICards({ kpis }: KPICardsProps) {
  const avgIsCritical = kpis.avgRejectPct > CRITICAL_THRESHOLD
  const hasCritical = kpis.criticalAlerts > 0

  const cards: CardConfig[] = [
    {
      label: "Total Production",
      value: kpis.totalProduced.toLocaleString(),
      subtext: "units produced",
      icon: <Factory className="w-5 h-5" />,
      accent: "bg-primary/10",
      textAccent: "text-primary",
    },
    {
      label: "Total Rejected",
      value: kpis.totalRejected.toLocaleString(),
      subtext: "units rejected",
      icon: <PackageX className="w-5 h-5" />,
      accent: "bg-amber-50",
      textAccent: "text-amber-600",
    },
    {
      label: "Avg Reject Rate",
      value: `${kpis.avgRejectPct.toFixed(2)}%`,
      subtext: avgIsCritical ? "Above 5% threshold" : "Within 5% threshold",
      icon: <TrendingUp className="w-5 h-5" />,
      accent: avgIsCritical ? "bg-rose-50" : "bg-emerald-50",
      textAccent: avgIsCritical ? "text-rose-600" : "text-emerald-600",
    },
    {
      label: "Critical Alerts",
      value: kpis.criticalAlerts.toString(),
      subtext: "entries above 5%",
      icon: <AlertTriangle className="w-5 h-5" />,
      accent: hasCritical ? "bg-rose-50" : "bg-emerald-50",
      textAccent: hasCritical ? "text-rose-600" : "text-emerald-600",
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-card border border-border rounded-lg p-5 flex flex-col gap-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {card.label}
            </span>
            <span className={`p-2 rounded-md ${card.accent} ${card.textAccent}`}>
              {card.icon}
            </span>
          </div>
          <p className={`text-3xl font-bold font-mono ${card.textAccent}`}>
            {card.value}
          </p>
          <p className="text-xs text-muted-foreground">{card.subtext}</p>
        </div>
      ))}
    </div>
  )
}
