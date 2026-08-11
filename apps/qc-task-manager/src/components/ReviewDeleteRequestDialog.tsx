// ReviewDeleteRequestDialog — React island for the manager/admin review flow
// on /manager/requests.
//
// Replaces the bare Approve/Reject forms with a guarded two-step interaction
// (spec: "approval requires confirmation" + "rejection may include a reason"):
//   - Approve → opens a confirmation dialog spelling out the permanent delete
//     (task + comments + attachments + activity history). Nothing is sent to
//     the server until the reviewer confirms.
//   - Reject → opens a dialog with an OPTIONAL reason. The reason is persisted
//     on the request row (review_note), shown in the history, carried in the
//     delete_rejected activity entry, and included in the requester's
//     notification.
//
// Confirming submits the native hidden form to /manager/requests/api — the
// server redirects back with a one-shot flash, so this island needs no fetch.

import { useEffect, useRef, useState } from 'react';

interface Props {
  requestId: number;
  taskId: number;
  taskTitle: string;
}

const MAX_NOTE = 500;

export default function ReviewDeleteRequestDialog({ requestId, taskId, taskTitle }: Props) {
  const [mode, setMode] = useState<'approve' | 'reject' | null>(null);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const actionRef = useRef<HTMLInputElement>(null);
  const noteRef = useRef<HTMLInputElement>(null);

  // Native <dialog> needs showModal()/close() for correct modal behaviour.
  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    if (mode && !dlg.open) dlg.showModal();
    if (!mode && dlg.open) dlg.close();
  }, [mode]);

  // Keep React state in sync when the browser closes the dialog itself
  // (Escape key / backdrop click).
  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    const onClose = () => setMode(null);
    dlg.addEventListener('close', onClose);
    return () => dlg.removeEventListener('close', onClose);
  }, []);

  function open(m: 'approve' | 'reject') {
    setError(null);
    setNote('');
    setMode(m);
  }

  function confirm() {
    if (!mode || !formRef.current || !actionRef.current || !noteRef.current) return;
    if (mode === 'reject' && note.length > MAX_NOTE) {
      setError(`Reason must be ${MAX_NOTE} characters or fewer.`);
      return;
    }
    actionRef.current.value = mode;
    noteRef.current.value = mode === 'reject' ? note.trim() : '';
    formRef.current.submit();
  }

  const confirmLabel = mode === 'approve' ? 'Confirm deletion' : 'Reject request';

  return (
    <>
      <div className="flex shrink-0 gap-2">
        <button
          type="button"
          onClick={() => open('approve')}
          data-review-action="approve"
          className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40"
          title="Delete the task and approve this request"
        >
          Approve
        </button>
        <button
          type="button"
          onClick={() => open('reject')}
          data-review-action="reject"
          className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/40"
          title="Keep the task and reject this request"
        >
          Reject
        </button>
      </div>

      {/* Hidden native form — values are set right before submission. */}
      <form ref={formRef} method="POST" action="/manager/requests/api" className="hidden" aria-hidden="true">
        <input ref={actionRef} type="hidden" name="action" value="approve" />
        <input type="hidden" name="request_id" value={requestId} />
        <input ref={noteRef} type="hidden" name="review_note" value="" />
      </form>

      <dialog
        ref={dialogRef}
        aria-labelledby={`review-dialog-title-${requestId}`}
        className="m-auto w-full max-w-md rounded-lg border border-slate-200 bg-white p-0 shadow-xl backdrop:bg-slate-900/40"
      >
        <div className="p-5">
          {mode === 'approve' ? (
            <>
              <h2 id={`review-dialog-title-${requestId}`} className="text-lg font-semibold text-slate-900">
                Confirm deletion
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                This will <span className="font-semibold text-red-700">permanently delete</span> the task{' '}
                <span className="font-medium text-slate-900">“{taskTitle}”</span> along with its comments,
                attachments, and activity history. This cannot be undone.
              </p>
            </>
          ) : (
            <>
              <h2 id={`review-dialog-title-${requestId}`} className="text-lg font-semibold text-slate-900">
                Reject deletion request
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                The task “{taskTitle}” will be kept. Tell the requester why (optional).
              </p>
              <label htmlFor={`review-note-${requestId}`} className="mt-4 block text-sm font-medium text-slate-700">
                Reason <span className="font-normal text-slate-400">(optional)</span>
              </label>
              <textarea
                id={`review-note-${requestId}`}
                rows={3}
                maxLength={MAX_NOTE}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Why was this request rejected?"
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              />
              <p className="mt-1 text-right text-xs text-slate-400">{note.length}/{MAX_NOTE}</p>
            </>
          )}

          {error && (
            <p className="mt-2 rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-600" role="alert">
              {error}
            </p>
          )}

          <div className="mt-4 flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={() => setMode(null)}
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirm}
              className={
                mode === 'approve'
                  ? 'rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700'
                  : 'rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700'
              }
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
