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

export default function ReviewDeleteRequestDialog({ requestId, taskTitle }: Props) {
  const [mode, setMode] = useState<'approve' | 'reject' | null>(null);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const lastTriggerRef = useRef<HTMLButtonElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const actionRef = useRef<HTMLInputElement>(null);
  const noteInputRef = useRef<HTMLInputElement>(null);
  const noteRef = useRef<HTMLTextAreaElement>(null);

  // Native <dialog> needs showModal()/close() for correct modal behaviour.
  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    if (mode && !dlg.open) {
      dlg.showModal();
      window.requestAnimationFrame(() => {
        if (mode === 'reject') noteRef.current?.focus();
        else dialogRef.current?.querySelector<HTMLButtonElement>('button[data-dialog-confirm]')?.focus();
      });
    }
    if (!mode && dlg.open) dlg.close();
  }, [mode]);

  // Keep React state in sync when the browser closes the dialog itself
  // (Escape key / backdrop click).
  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    const onClose = () => {
      setMode(null);
      lastTriggerRef.current?.focus();
    };
    dlg.addEventListener('close', onClose);
    return () => dlg.removeEventListener('close', onClose);
  }, []);

  function open(m: 'approve' | 'reject', trigger: HTMLButtonElement) {
    lastTriggerRef.current = trigger;
    setError(null);
    setNote('');
    setMode(m);
  }

  function confirm() {
    if (!mode || !formRef.current || !actionRef.current || !noteInputRef.current) return;
    if (mode === 'reject' && note.length > MAX_NOTE) {
      setError(`Reason must be ${MAX_NOTE} characters or fewer.`);
      return;
    }
    actionRef.current.value = mode;
    noteInputRef.current.value = mode === 'reject' ? note.trim() : '';
    formRef.current.submit();
  }

  const confirmLabel = mode === 'approve' ? 'Delete task permanently' : 'Reject deletion request';

  return (
    <>
      <div className="flex shrink-0 gap-2">
        <button
          type="button"
          onClick={(event) => open('approve', event.currentTarget)}
          data-review-action="approve"
          className="min-h-11 rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
          title="Approve permanent deletion of this task"
        >
          Review and delete task
        </button>
        <button
          type="button"
          onClick={(event) => open('reject', event.currentTarget)}
          data-review-action="reject"
          className="min-h-11 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-600"
          title="Keep the task and reject this request"
        >
          Keep task and reject request
        </button>
      </div>

      {/* Hidden native form — values are set right before submission. */}
      <form ref={formRef} method="POST" action="/manager/requests/api" className="hidden" aria-hidden="true">
        <input ref={actionRef} type="hidden" name="action" value="approve" />
        <input type="hidden" name="request_id" value={requestId} />
        <input ref={noteInputRef} type="hidden" name="review_note" value="" />
      </form>

      <dialog
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        onCancel={(event) => {
          event.preventDefault();
          setMode(null);
        }}
        aria-labelledby={`review-dialog-title-${requestId}`}
        aria-describedby={`review-dialog-description-${requestId}`}
        className="m-auto w-full max-w-md rounded-lg border border-slate-200 bg-white p-0 shadow-xl backdrop:bg-slate-900/40"
      >
        <div className="p-5">
          {mode === 'approve' ? (
            <>
              <h2 id={`review-dialog-title-${requestId}`} className="text-lg font-semibold text-slate-900">
                Delete task permanently?
              </h2>
              <p id={`review-dialog-description-${requestId}`} className="mt-2 text-sm text-slate-600">
                This will <span className="font-semibold text-red-700">permanently delete</span> the task{' '}
                <span className="font-medium text-slate-900">“{taskTitle}”</span> along with its comments,
                attachments, and activity history. This cannot be undone. The deletion request will be recorded after confirmation. Retrying is not safe once deletion starts.
              </p>
            </>
          ) : (
            <>
              <h2 id={`review-dialog-title-${requestId}`} className="text-lg font-semibold text-slate-900">
                Keep the task and reject the request
              </h2>
              <p id={`review-dialog-description-${requestId}`} className="mt-1 text-sm text-slate-600">
                The task “{taskTitle}” will be kept. Add a reason so the requester knows what to change (optional).
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
                ref={noteRef}
                aria-describedby={`review-note-count-${requestId}`}
                placeholder="Explain why this request is being rejected (optional)."
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              />
              <p id={`review-note-count-${requestId}`} className="mt-1 text-right text-xs text-slate-500">{note.length}/{MAX_NOTE} characters</p>
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
              className="min-h-11 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-600"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirm}
              data-dialog-confirm
              className={
                mode === 'approve'
                  ? 'min-h-11 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600'
                  : 'min-h-11 rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-800'
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
