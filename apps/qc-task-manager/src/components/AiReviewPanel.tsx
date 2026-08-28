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
  const [sessionExpired, setSessionExpired] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  async function run() {
    setBusy(true); setError(null); setSessionExpired(false); setPermissionDenied(false);
    try {
      const response = await fetch(`/api/ai/${feature}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...requestBody, ...(consent ? { allow_ai_processing: allow } : {}) }) });
      const payload = await response.json() as { ok?: boolean; aiUnavailable?: boolean; result?: { data?: Record<string, unknown> } & Record<string, unknown>; error?: string };
      if (!response.ok || !payload.ok) {
        if (payload.aiUnavailable) { setUnavailable(true); setError(null); return; }
        if (response.status === 401) { setSessionExpired(true); setError(null); return; }
        if (response.status === 403) { setPermissionDenied(true); setError(payload.error ?? 'You do not have access to use this advisory feature. Ask your administrator if you need access.'); return; }
        throw new Error(payload.error ?? 'AI assistance could not complete. Continue manually, or try Run AI review again.');
      }
      setResult(payload.result?.data ?? payload.result ?? null);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'AI assistance could not complete. Continue manually, or try Run AI review again.'); }
    finally { setBusy(false); }
  }
  return <section className="mt-4 rounded-lg border border-info-border bg-info-soft p-4" aria-label={`${title} AI assistant`}>
    <div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold text-content">{title}</h2><span className="inline-flex items-center rounded-full border border-info-border bg-white px-2 py-1 text-xs font-semibold text-info"><span aria-hidden="true">✦</span><span className="ms-1">AI advisory</span></span></div><p className="mt-2 text-xs text-info">AI-generated suggestions · Human review required · Advisory only</p><p className="mt-1 text-xs text-info">AI does not approve, reject, or decide QC outcomes.</p></div><button type="button" onClick={run} disabled={busy || unavailable || sessionExpired || permissionDenied || (consent && !allow)} aria-busy={busy} className="min-h-11 rounded-md bg-accent px-3 py-2 text-sm font-semibold text-content-inverse transition-colors hover:bg-accent-hover active:bg-accent-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:opacity-50">{busy ? 'Analyzing…' : 'Run AI review'}</button></div>
    {consent && <label className="mt-3 flex items-start gap-2 text-xs text-indigo-900"><input type="checkbox" checked={allow} onChange={(event) => setAllow(event.target.checked)} className="mt-0.5" /> I authorize minimized evidence metadata processing for this review.</label>}
    <ActionFeedback tone="warning" message={unavailable ? 'AI assistance is not configured for this deployment. Continue manually; core QC workflows are unaffected.' : null} />
    <ActionFeedback tone="warning" message={sessionExpired ? 'Your session has expired. Sign in again to use AI assistance; your saved QC data is unchanged.' : null} recovery={sessionExpired ? <a className="ms-auto font-semibold underline" href="/login">Sign in</a> : undefined} />
    <ActionFeedback tone="error" message={permissionDenied ? error : null} />
    <ActionFeedback tone="error" message={!permissionDenied ? error : null} />
    {result && <div className="mt-3 space-y-3"><div className="rounded-md border border-info-border bg-white p-3 text-sm"><p className="font-semibold text-content">How to read this result</p><dl className="mt-2 grid gap-2 text-xs text-content-secondary sm:grid-cols-3"><div><dt className="font-semibold text-content">System data</dt><dd>Current QC record supplied by the server.</dd></div><div><dt className="font-semibold text-content">AI suggestion</dt><dd>Advisory output shown below for review.</dd></div><div><dt className="font-semibold text-content">User decision</dt><dd>Not recorded by AI. Use the existing QC controls.</dd></div></dl></div><div className="flex flex-wrap gap-2 text-xs"><span className="rounded-full bg-white px-2 py-1 text-indigo-900">Confidence: {typeof result.confidence === 'number' ? `${Math.round(result.confidence * 100)}%` : '—'}</span><span className="rounded-full bg-white px-2 py-1 text-indigo-900">Evidence Used: {Array.isArray(result.evidence_used) ? result.evidence_used.length : 0}</span><span className="rounded-full bg-amber-100 px-2 py-1 font-semibold text-amber-900">Human Review Required</span></div><details className="rounded-md border border-info-border bg-white"><summary className="cursor-pointer px-3 py-2 text-sm font-semibold text-content focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus">View AI suggestion details</summary><pre className="max-h-80 overflow-auto whitespace-pre-wrap border-t border-border px-3 py-3 text-xs text-slate-800">{JSON.stringify(result, null, 2)}</pre></details></div>}
  </section>;
}
