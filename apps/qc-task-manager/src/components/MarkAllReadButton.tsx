// MarkAllReadButton — tiny React island. POSTs to /api/notifications/read-all
// then reloads so the server-rendered list and badge count stay in sync.
// (A plain <form> can't POST to a JSON API without navigating away, and inline
// handlers are blocked by the strict CSP, hence the island.)

import { useState } from 'react';
import ActionFeedback from './ui/ActionFeedback';

// Where to land after marking everything read. The global /notifications page
// (the default) reloads itself; the lab-filtered view (/lab/notifications)
// passes its own href so it stays in place. Both hit the SAME read-all
// endpoint — one table, one read state.
export default function MarkAllReadButton({ redirectTo = '/notifications' }: { redirectTo?: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function markAllRead(ev: React.FormEvent) {
    ev.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/notifications/read-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (res.ok && data.ok) {
        window.location.href = redirectTo;
        return;
      }
      setError(data.error ?? 'Could not mark notifications as read. Try again.');
    } catch {
      setError('Network error. Check your connection, then try Mark all as read again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={markAllRead} className="flex flex-col items-start gap-1">
      <button
        type="submit"
        disabled={busy}
        aria-busy={busy}
        className="min-h-11 rounded-md border border-border-strong bg-surface px-4 py-2.5 text-sm font-semibold text-content-secondary transition-colors hover:bg-surface-muted active:bg-surface-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:opacity-50"
      >
        {busy ? 'Marking…' : '✓ Mark all as read'}
      </button>
      <ActionFeedback tone="error" message={error} />
    </form>
  );
}
