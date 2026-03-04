"use client"

import { useState } from "react"
import { DateRangeFilter, DateRange } from "@/lib/dataProcessor"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import type { DateRange as DayPickerRange } from "react-day-picker"

const FILTER_OPTIONS: { label: string; value: DateRangeFilter }[] = [
  { label: "All Time", value: "all" },
  { label: "Last 7 Days", value: "7days" },
  { label: "Last 30 Days", value: "30days" },
  { label: "Custom Range", value: "custom" },
]

interface DateFilterProps {
  filter: DateRangeFilter
  customRange: DateRange
  onFilterChange: (f: DateRangeFilter) => void
  onCustomRangeChange: (r: DateRange) => void
  totalRows: number
  filteredRows: number
}

export function DateFilter({
  filter,
  customRange,
  onFilterChange,
  onCustomRangeChange,
  totalRows,
  filteredRows,
}: DateFilterProps) {
  const [open, setOpen] = useState(false)

  const dpRange: DayPickerRange | undefined =
    customRange.from && customRange.to
      ? { from: customRange.from, to: customRange.to }
      : undefined

  function handleSelect(range: DayPickerRange | undefined) {
    onCustomRangeChange({ from: range?.from ?? null, to: range?.to ?? null })
    if (range?.from && range?.to) setOpen(false)
  }

  const customLabel =
    customRange.from && customRange.to
      ? `${format(customRange.from, "MMM d, yyyy")} – ${format(customRange.to, "MMM d, yyyy")}`
      : "Pick dates"

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap gap-2">
        {FILTER_OPTIONS.map((opt) => (
          <Button
            key={opt.value}
            variant={filter === opt.value ? "default" : "outline"}
            size="sm"
            onClick={() => onFilterChange(opt.value)}
            className="text-xs"
          >
            {opt.label}
          </Button>
        ))}
      </div>

      {filter === "custom" && (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2 text-xs">
              <CalendarIcon className="w-3.5 h-3.5" />
              {customLabel}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="range"
              selected={dpRange}
              onSelect={handleSelect}
              numberOfMonths={2}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      )}

      <span className="text-xs text-muted-foreground whitespace-nowrap">
        Showing <span className="font-semibold text-foreground">{filteredRows}</span> of{" "}
        <span className="font-semibold text-foreground">{totalRows}</span> records
      </span>
    </div>
  )
}
