// MarkAllReadButton — tiny React island. POSTs to /api/notifications/read-all
// then reloads so the server-rendered list and badge count stay in sync.
// (A plain <form> can't POST to a JSON API without navigating away, and inline
// handlers are blocked by the strict CSP, hence the island.)

import { useState } from 'react';

// Where to land after marking everything read. The global /notifications page
// (the default) reloads itself; the lab-filtered view (/lab/notifications)
// passes its own href so it stays in place. Both hit the SAME read-all
// endpoint — one table, one read state.
export default function MarkAllReadButton({ redirectTo = '/notifications' }: { redirectTo?: string }) {
  const [busy, setBusy] = useState(false);

  async function markAllRead(ev: React.FormEvent) {
    ev.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch('/api/notifications/read-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
      const data = (await res.json()) as { ok: boolean };
      if (res.ok && data.ok) {
        window.location.href = redirectTo;
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={markAllRead}>
      <button
        type="submit"
        disabled={busy}
        className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {busy ? 'Marking…' : '✓ Mark all as read'}
      </button>
    </form>
  );
}
