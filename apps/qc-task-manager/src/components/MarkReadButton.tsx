// MarkReadButton — tiny React island for marking ONE persisted notification as
// read. POSTs to /api/notifications/[id]/read then reloads so the server-
// rendered list and the navbar badge stay in sync. (Inline handlers are
// blocked by the strict CSP, hence the island — same pattern as
// MarkAllReadButton.)

import { useState } from 'react';

interface MarkReadButtonProps {
  notificationId: number;
}

export default function MarkReadButton({ notificationId }: MarkReadButtonProps) {
  const [busy, setBusy] = useState(false);

  async function markRead(ev: React.FormEvent) {
    ev.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/notifications/${notificationId}/read`, { method: 'POST' });
      const data = (await res.json()) as { ok: boolean };
      if (res.ok && data.ok) {
        window.location.reload();
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={markRead}
      disabled={busy}
      aria-busy={busy}
      className="shrink-0 rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {busy ? 'Marking…' : 'Mark as read'}
    </button>
  );
}
