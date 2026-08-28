// MarkReadButton — tiny React island for marking ONE persisted notification as
// read. POSTs to /api/notifications/[id]/read then reloads so the server-
// rendered list and the navbar badge stay in sync. (Inline handlers are
// blocked by the strict CSP, hence the island — same pattern as
// MarkAllReadButton.)

import { useState } from 'react';
import ActionFeedback from './ui/ActionFeedback';

interface MarkReadButtonProps {
  notificationId: number;
}

export default function MarkReadButton({ notificationId }: MarkReadButtonProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function markRead(ev: React.FormEvent) {
    ev.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/notifications/${notificationId}/read`, { method: 'POST' });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (res.ok && data.ok) {
        window.location.reload();
        return;
      }
      setError(data.error ?? 'Could not mark this notification as read. Try again.');
    } catch {
      setError('Network error. Check your connection, then try Mark as read again.');
    } finally {
      setBusy(false);
    }
  }

  return <div className="flex flex-col items-start gap-1">
    <button type="button" onClick={markRead} disabled={busy} aria-busy={busy} className="min-h-11 shrink-0 rounded-md border border-border-strong bg-surface px-3 py-2 text-sm font-semibold text-content-secondary transition-colors hover:bg-surface-muted active:bg-surface-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:opacity-50">
      {busy ? 'Marking…' : 'Mark as read'}
    </button>
    <ActionFeedback tone="error" message={error} />
  </div>;
}
