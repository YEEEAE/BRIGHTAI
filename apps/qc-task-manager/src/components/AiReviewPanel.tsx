import { useState } from 'react';

type Props = { feature: string; requestBody: Record<string, unknown>; title: string; consent?: boolean };

export default function AiReviewPanel({ feature, requestBody, title, consent = false }: Props) {
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [allow, setAllow] = useState(false);
  async function run() {
    setBusy(true); setError(null);
    try {
      const response = await fetch(`/api/ai/${feature}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...requestBody, ...(consent ? { allow_ai_processing: allow } : {}) }) });
      const payload = await response.json() as { ok?: boolean; result?: { data?: Record<string, unknown> } & Record<string, unknown>; error?: string };
      if (!response.ok || !payload.ok) throw new Error(payload.error ?? 'AI is temporarily unavailable. Continue manually.');
      setResult(payload.result?.data ?? payload.result ?? null);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'AI is temporarily unavailable. Continue manually.'); }
    finally { setBusy(false); }
  }
  return <section className="mt-4 rounded-lg border border-indigo-200 bg-indigo-50 p-4" aria-label={`${title} AI assistant`}>
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-semibold text-indigo-950">{title}</h3><p className="mt-1 text-xs text-indigo-800">AI Generated · Human Review Required · advisory only</p></div><button type="button" onClick={run} disabled={busy || (consent && !allow)} className="rounded-md bg-indigo-700 px-3 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">{busy ? 'Analyzing…' : 'Run AI review'}</button></div>
    {consent && <label className="mt-3 flex items-start gap-2 text-xs text-indigo-900"><input type="checkbox" checked={allow} onChange={(event) => setAllow(event.target.checked)} className="mt-0.5" /> I authorize minimized evidence metadata processing for this review.</label>}
    {error && <p role="alert" className="mt-3 rounded-md bg-rose-100 p-2 text-xs text-rose-800">{error}</p>}
    {result && <div className="mt-3 space-y-2"><div className="flex flex-wrap gap-2 text-xs"><span className="rounded-full bg-white px-2 py-1 text-indigo-900">Confidence: {typeof result.confidence === 'number' ? `${Math.round(result.confidence * 100)}%` : '—'}</span><span className="rounded-full bg-white px-2 py-1 text-indigo-900">Evidence Used: {Array.isArray(result.evidence_used) ? result.evidence_used.length : 0}</span><span className="rounded-full bg-amber-100 px-2 py-1 font-semibold text-amber-900">Human Review Required</span></div><pre className="max-h-80 overflow-auto whitespace-pre-wrap rounded-md bg-white p-3 text-xs text-slate-800">{JSON.stringify(result, null, 2)}</pre></div>}
  </section>;
}
