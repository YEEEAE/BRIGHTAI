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
import ActionFeedback from './ui/ActionFeedback';

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
  const triggerRef = useRef<HTMLButtonElement>(null);
  const reasonRef = useRef<HTMLTextAreaElement>(null);

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

  useEffect(() => {
    if (open) reasonRef.current?.focus();
    else if (!requested) triggerRef.current?.focus();
  }, [open, requested]);

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
        setError(data.error ?? 'We couldn’t send the deletion request. No change was saved. Review the reason and try again; retrying is safe.');
        return;
      }
      setRequested(true);
      setOpen(false);
      setReason('');
    } catch (err) {
      console.error('[task] delete-request submission failed', err);
      setError('We couldn’t send the deletion request because the connection was interrupted. Your task was not deleted. Check your connection and try again; retrying is safe.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        ref={triggerRef}
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
            ref={reasonRef}
            rows={3}
            maxLength={MAX_REASON}
            value={reason}
            aria-describedby={`delete-reason-count-${taskId}`}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Why should this task be deleted?"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          />
          <p id={`delete-reason-count-${taskId}`} className="mt-1 text-right text-xs text-slate-500">{reason.length}/{MAX_REASON} characters</p>

          <ActionFeedback tone="error" message={error} />

          <div className="mt-4 flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="min-h-11 rounded-md border border-border-strong bg-surface px-4 py-2 text-sm font-semibold text-content-secondary transition-colors hover:bg-surface-muted active:bg-surface-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={submitting}
              aria-busy={submitting}
              className="min-h-11 rounded-md bg-danger px-4 py-2 text-sm font-semibold text-content-inverse transition-colors hover:bg-danger-hover active:bg-danger-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-danger disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? 'Sending request…' : 'Send deletion request'}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
