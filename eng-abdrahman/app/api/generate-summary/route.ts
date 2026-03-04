import { createGroq } from "@ai-sdk/groq"
import { generateText } from "ai"
import { NextRequest, NextResponse } from "next/server"
import { AggregatedCritical } from "@/lib/dataProcessor"

const groq = createGroq({ apiKey: process.env.GROQ_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const payload: AggregatedCritical[] = body.payload

    if (!payload || payload.length === 0) {
      return NextResponse.json(
        { error: "No critical data provided. All items are within the 5% threshold." },
        { status: 400 }
      )
    }

    const dataStr = JSON.stringify(payload, null, 2)

    const prompt = `Act as a Senior Manufacturing Quality Engineer. Analyze this aggregated critical rejection data (>5% reject rate):

${dataStr}

Write a concise 3-bullet-point Executive Summary. Focus on:
1. Root Cause Analysis — link specific machines to problematic item codes
2. Quantified impact — mention the highest avg reject % figures
3. Actionable recommendations for management to reduce rejection rates

Format your response as exactly 3 bullet points, each starting with a bold label like **Root Cause:**, **Impact:**, **Recommendation:**. Keep each bullet to 2-3 sentences.`

    const { text } = await generateText({
      model: groq("llama3-70b-8192"),
      prompt,
      maxTokens: 512,
    })

    return NextResponse.json({ summary: text })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
