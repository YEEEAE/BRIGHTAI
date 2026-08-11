// DeleteRequestDialog — React island for the employee "Request Deletion" flow.
//
// Renders one of three states:
//   hasPendingRequest  → a "🗑️ Deletion requested" badge (no further actions)
//   canRequest         → a "Request Deletion" button that opens a dialog with an
//                        optional reason; POSTs to /api/tasks/[id]/delete-request
//                        and flips to the badge on success
//   otherwise          → nothing (completed tasks, on-hold tasks, non-employees)
//
// Props are plain serializable data so the island hydrates cleanly (client:visible).

import { useEffect, useRef, useState } from 'react';

interface Props {
  taskId: number;
  canRequest: boolean;
  hasPendingRequest: boolean;
}

const MAX_REASON = 500;

export default function DeleteRequestDialog({ taskId, canRequest, hasPendingRequest }: Props) {
  const [requested, setRequested] = useState(hasPendingRequest);
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  // Native <dialog> needs showModal()/close() for correct modal behaviour.
  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    if (open && !dlg.open) {
      try {
        if (typeof dlg.showModal === 'function') dlg.showModal();
        else dlg.setAttribute('open', '');
      } catch {
        // Keep the workflow usable if the browser rejects a second modal
        // transition during hydration/navigation; the server still enforces
        // the request authorization and CSRF rules.
        dlg.setAttribute('open', '');
      }
    }
    if (!open && dlg.open) dlg.close();
  }, [open]);

  if (requested) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700">
        🗑️ Deletion requested
      </span>
    );
  }

  if (!canRequest) return null;

  async function submit() {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/tasks/${taskId}/delete-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ reason }).toString(),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error ?? 'Could not submit the request. Please try again.');
        return;
      }
      setRequested(true);
      setOpen(false);
      setReason('');
    } catch {
      setError('Network error while submitting the request.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
        className="inline-flex items-center gap-1.5 rounded-md border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
      >
        🗑️ Request Deletion
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby={`delete-request-title-${taskId}`}
        className="m-auto w-full max-w-md rounded-lg border border-slate-200 bg-white p-0 shadow-xl backdrop:bg-slate-900/40"
      >
        <form method="dialog" className="p-5">
          <h2 id={`delete-request-title-${taskId}`} className="text-lg font-semibold text-slate-900">
            Request deletion
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            A manager will review this request. Your task stays in place until it is
            approved or rejected.
          </p>

          <label htmlFor={`delete-reason-${taskId}`} className="mt-4 block text-sm font-medium text-slate-700">
            Reason <span className="font-normal text-slate-400">(optional)</span>
          </label>
          <textarea
            id={`delete-reason-${taskId}`}
            rows={3}
            maxLength={MAX_REASON}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Why should this task be deleted?"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          />
          <p className="mt-1 text-right text-xs text-slate-400">{reason.length}/{MAX_REASON}</p>

          {error && (
            <p className="mt-2 rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-600" role="alert">
              {error}
            </p>
          )}

          <div className="mt-4 flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={submitting}
              className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? 'Submitting…' : 'Submit request'}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
