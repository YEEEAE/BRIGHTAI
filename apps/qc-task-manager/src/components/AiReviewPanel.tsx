import { useState } from 'react';
import ActionFeedback from './ui/ActionFeedback';

type Props = { feature: string; requestBody: Record<string, unknown>; title: string; consent?: boolean };

export default function AiReviewPanel({ feature, requestBody, title, consent = false }: Props) {
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [allow, setAllow] = useState(false);
  // Controlled unavailable state: the deployment has NO provider configured.
  // Distinct from a transient failure — retrying cannot help, so the run
  // button disables and the panel explains that core workflows are unaffected.
  const [unavailable, setUnavailable] = useState(false);
  async function run() {
    setBusy(true); setError(null);
    try {
      const response = await fetch(`/api/ai/${feature}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...requestBody, ...(consent ? { allow_ai_processing: allow } : {}) }) });
      const payload = await response.json() as { ok?: boolean; aiUnavailable?: boolean; result?: { data?: Record<string, unknown> } & Record<string, unknown>; error?: string };
      if (!response.ok || !payload.ok) {
        if (payload.aiUnavailable) { setUnavailable(true); setError(null); return; }
        throw new Error(payload.error ?? 'AI assistance could not complete. Continue manually, or try Run AI review again.');
      }
      setResult(payload.result?.data ?? payload.result ?? null);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'AI assistance could not complete. Continue manually, or try Run AI review again.'); }
    finally { setBusy(false); }
  }
  return <section className="mt-4 rounded-lg border border-info-border bg-info-soft p-4" aria-label={`${title} AI assistant`}>
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-semibold text-content">{title}</h2><p className="mt-1 text-xs text-info">AI-generated suggestions · Human review required · Advisory only</p><p className="mt-1 text-xs text-info">AI does not approve, reject, or decide QC outcomes.</p></div><button type="button" onClick={run} disabled={busy || unavailable || (consent && !allow)} aria-busy={busy} className="min-h-11 rounded-md bg-accent px-3 py-2 text-sm font-semibold text-content-inverse transition-colors hover:bg-accent-hover active:bg-accent-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:opacity-50">{busy ? 'Analyzing…' : 'Run AI review'}</button></div>
    {consent && <label className="mt-3 flex items-start gap-2 text-xs text-indigo-900"><input type="checkbox" checked={allow} onChange={(event) => setAllow(event.target.checked)} className="mt-0.5" /> I authorize minimized evidence metadata processing for this review.</label>}
    <ActionFeedback tone="warning" message={unavailable ? 'AI assistance is not configured for this deployment. Continue manually; core QC workflows are unaffected.' : null} />
    <ActionFeedback tone="error" message={error} />
    {result && <div className="mt-3 space-y-2"><div className="flex flex-wrap gap-2 text-xs"><span className="rounded-full bg-white px-2 py-1 text-indigo-900">Confidence: {typeof result.confidence === 'number' ? `${Math.round(result.confidence * 100)}%` : '—'}</span><span className="rounded-full bg-white px-2 py-1 text-indigo-900">Evidence Used: {Array.isArray(result.evidence_used) ? result.evidence_used.length : 0}</span><span className="rounded-full bg-amber-100 px-2 py-1 font-semibold text-amber-900">Human Review Required</span></div><pre className="max-h-80 overflow-auto whitespace-pre-wrap rounded-md bg-white p-3 text-xs text-slate-800">{JSON.stringify(result, null, 2)}</pre></div>}
  </section>;
}
