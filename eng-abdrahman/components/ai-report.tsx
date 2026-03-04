"use client"

import { useState } from "react"
import { AggregatedCritical } from "@/lib/dataProcessor"
import { Button } from "@/components/ui/button"
import { Sparkles, Loader2, AlertCircle } from "lucide-react"

interface AIReportProps {
  payload: AggregatedCritical[]
}

export function AIReport({ payload }: AIReportProps) {
  const [summary, setSummary] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleGenerate() {
    setLoading(true)
    setError(null)
    setSummary(null)
    try {
      const endpoint = "https://brightai.site/api/generate-summary"
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payload }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Request failed")
      setSummary(data.summary)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "An unexpected error occurred.")
    } finally {
      setLoading(false)
    }
  }

  // Parse the 3-bullet summary into structured items
  function parseBullets(text: string): string[] {
    return text
      .split(/\n/)
      .map((l) => l.trim())
      .filter((l) => l.startsWith("•") || l.startsWith("-") || l.startsWith("**") || /^\d\./.test(l))
      .map((l) => l.replace(/^[-•]\s*/, "").replace(/^\d\.\s*/, ""))
  }

  const bullets = summary ? parseBullets(summary) : []
  const displayLines = bullets.length >= 2 ? bullets : summary ? [summary] : []

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">AI Executive Summary Generator</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Powered by Groq — analyzes critical items ({'>'}{`5%`} reject rate) in the current filter
          </p>
        </div>
        <Button
          onClick={handleGenerate}
          disabled={loading || payload.length === 0}
          className="gap-2 shrink-0"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          {loading ? "Generating..." : "Generate AI Report"}
        </Button>
      </div>

      {payload.length === 0 && !loading && !summary && (
        <div className="px-5 py-6 flex items-center gap-3 text-emerald-600">
          <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
          <p className="text-sm">
            No critical items in the current selection. All rejection rates are within the 5% threshold.
          </p>
        </div>
      )}

      {error && (
        <div className="px-5 py-4 flex items-start gap-3 bg-rose-50 border-t border-rose-200">
          <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
          <p className="text-sm text-rose-700">{error}</p>
        </div>
      )}

      {summary && (
        <div className="px-5 py-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
            Executive Report
          </p>
          {displayLines.length > 0 ? (
            <ul className="flex flex-col gap-3">
              {displayLines.map((line, i) => {
                // Bold the label portion (**Label:**)
                const formatted = line.replace(
                  /\*\*(.+?)\*\*/g,
                  '<strong class="text-foreground">$1</strong>'
                )
                return (
                  <li key={i} className="flex gap-3">
                    <span className="mt-1.5 w-2 h-2 rounded-full bg-primary shrink-0" />
                    <p
                      className="text-sm text-foreground leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: formatted }}
                    />
                  </li>
                )
              })}
            </ul>
          ) : (
            <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{summary}</p>
          )}
          <p className="text-xs text-muted-foreground mt-5 pt-3 border-t border-border">
            Based on {payload.length} critical item–machine combination{payload.length !== 1 ? "s" : ""} exceeding the 5% threshold.
          </p>
        </div>
      )}
    </div>
  )
}
