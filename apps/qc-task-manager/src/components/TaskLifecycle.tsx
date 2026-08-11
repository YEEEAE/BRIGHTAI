// TaskLifecycle — React island for the task lifecycle actions on the task page.
//
// Renders (based on server-computed permissions passed as props):
//   1. "Complete task"  → the 3-step COMPLETION WIZARD modal:
//        Step 1  Evidence — upload one or more files (pdf/png/jpg/jpeg/xlsx/
//                 docx only, ≤ 10 MB each, extension + MIME + magic-bytes
//                 checked client-side; the server re-checks everything) or
//                 skip (the skip is recorded as evidence_skipped).
//        Step 2  Completion comment — mandatory; stored with
//                 is_completion_comment = 1.
//        Step 3  Confirmation summary — one multipart POST to /close; the
//                 server executes ONE transaction (evidence BLOBs → comment →
//                 status/completed_at/completed_by → activity → notifications).
//      Cancelling the wizard at any point sends NOTHING: no status change, no
//      temporary evidence, no comment (spec). Nothing is persisted server-side
//      unless the final confirm fires.
//   2. "Cancel task"    → reason dialog (manager/admin only). POST /cancel.
//   3. "Reopen task"    → confirm → POST /reopen (manager/admin only, for
//      completed tasks).
//
// Every successful mutation reloads the page so the server-rendered sections
// (status badge, activity timeline, evidence panel) stay in sync.

import { useEffect, useRef, useState } from 'react';

interface Props {
  taskId: number;
  title: string;
  status: string;
  /** Actor may edit this task and it is active → show the Complete wizard. */
  canComplete: boolean;
  /** manager/admin on an active task → show Cancel. */
  canCancel: boolean;
  /** manager/admin on a completed task → show Reopen. */
  canReopen: boolean;
  incompleteChecklist?: number;
  canOverrideChecklist?: boolean;
  /** Evidence requirements declared on the task's template snapshot (server-supplied). */
  evidenceRequirements?: { type: string; label: string; requirement: string; allowedExtensions?: string[] }[];
  /** Non-rejected evidence already persisted on the task (for reopened tasks). */
  existingEvidenceTypes?: string[];
  /** manager/admin may override the required-evidence gate with a reason. */
  canOverrideEvidence?: boolean;
}

// ── evidence rules (mirror src/lib/task-policy.ts EVIDENCE_* constants) ──
const MAX_BYTES = 10 * 1024 * 1024;
const EVIDENCE_EXTS = ['pdf', 'png', 'jpg', 'jpeg', 'xlsx', 'docx'];
const ACCEPT = '.pdf,.png,.jpg,.jpeg,.xlsx,.docx';
const HINT = 'pdf, png, jpg, jpeg, xlsx, docx';
const SIGS: Record<string, number[]> = {
  pdf: [0x25, 0x50, 0x44, 0x46, 0x2d], // %PDF-
  png: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  jpg: [0xff, 0xd8, 0xff],
  jpeg: [0xff, 0xd8, 0xff],
  xlsx: [0x50, 0x4b, 0x03, 0x04], // ZIP (OOXML)
  docx: [0x50, 0x4b, 0x03, 0x04], // ZIP (OOXML)
};

function extOf(name: string): string {
  const dot = name.lastIndexOf('.');
  return dot >= 0 ? name.slice(dot + 1).toLowerCase() : '';
}

/** Client-side evidence check — a friendly first line; the server is final. */
async function evidenceError(file: File): Promise<string | null> {
  if (file.size === 0) return 'The file is empty.';
  if (file.size > MAX_BYTES) return 'The file exceeds the 10 MB upload limit.';
  const ext = extOf(file.name);
  if (!EVIDENCE_EXTS.includes(ext)) {
    return `File type ".${ext || 'unknown'}" is not allowed for evidence. Allowed: ${HINT}.`;
  }
  const sig = SIGS[ext];
  if (sig) {
    const head = new Uint8Array(await file.slice(0, sig.length).arrayBuffer());
    for (let i = 0; i < sig.length; i++) {
      if (head[i] !== sig[i]) {
        return `The file's content does not match a ".${ext}" file — upload a valid file.`;
      }
    }
  }
  return null;
}

function humanSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(bytes < 10240 ? 1 : 0)} KB`;
}

const inputCls =
  'w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500';
const labelCls = 'block text-sm font-medium text-slate-700';

export default function TaskLifecycle({ taskId, title, status, canComplete, canCancel, canReopen, incompleteChecklist = 0, canOverrideChecklist = false, evidenceRequirements = [], existingEvidenceTypes = [], canOverrideEvidence = false }: Props) {
  // ── wizard state ──
  const [wizardOpen, setWizardOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [accepted, setAccepted] = useState<File[]>([]);
  const [invalid, setInvalid] = useState<string[]>([]);
  const [skipEvidence, setSkipEvidence] = useState(false);
  const [comment, setComment] = useState('');
  const [checklistOverrideReason, setChecklistOverrideReason] = useState('');
  /** Selected evidence_type per accepted-file index (keyed by position). */
  const [fileTypes, setFileTypes] = useState<Record<number, string>>({});
  /** Manager/admin override reason when required evidence is missing. */
  const [evidenceOverrideReason, setEvidenceOverrideReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // ── cancel dialog state ──
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelSubmitting, setCancelSubmitting] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  // ── reopen state ──
  const [reopening, setReopening] = useState(false);
  const [reopenError, setReopenError] = useState<string | null>(null);

  const dialogRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (wizardOpen) {
      dialogRef.current?.querySelector<HTMLElement>('input, textarea, button')?.focus();
    }
  }, [wizardOpen, step]);

  useEffect(() => {
    if (!wizardOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeWizard();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [wizardOpen, step, accepted, skipEvidence, comment]);

  function closeWizard() {
    // Spec: cancelling before confirmation discards EVERYTHING — no status
    // change, no temporary evidence, no comment. Nothing was sent.
    setWizardOpen(false);
    setStep(0);
    setAccepted([]);
    setInvalid([]);
    setSkipEvidence(false);
    setComment('');
    setChecklistOverrideReason('');
    setFileTypes({});
    setEvidenceOverrideReason('');
    setError(null);
  }

  function reload() {
    window.location.href = window.location.pathname;
  }

  async function pickFiles(list: FileList | null) {
    if (!list) return;
    const errs: string[] = [];
    const good: File[] = [];
    for (const f of Array.from(list)) {
      const err = await evidenceError(f);
      if (err) errs.push(`${f.name}: ${err}`);
      else good.push(f);
    }
    setAccepted((prev) => [...prev, ...good]);
    setInvalid((prev) => [...prev, ...errs]);
  }

  function removeFile(index: number) {
    setAccepted((prev) => prev.filter((_, i) => i !== index));
  }

  // Required-evidence coverage (mirrors the server gate for the UI hint).
  const requiredTypes = evidenceRequirements.filter((r) => r.requirement === 'REQUIRED');
  const coveredTypes = new Set([
    ...existingEvidenceTypes,
    ...Object.values(fileTypes).filter(Boolean),
  ]);
  const missingRequired = requiredTypes.filter((r) => !coveredTypes.has(r.type));

  async function confirmCompletion() {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const form = new FormData();
      form.set('completion_comment', comment.trim());
      if (checklistOverrideReason.trim()) form.set('checklist_override_reason', checklistOverrideReason.trim());
      if (skipEvidence || accepted.length === 0) {
        form.set('skip_evidence', '1');
      } else {
        for (const f of accepted) form.append('evidence', f);
        // Parallel evidence_type field (same order as the files above) ties each
        // uploaded file to one of the task's declared evidence requirements.
        for (let i = 0; i < accepted.length; i += 1) {
          form.append('evidence_type', fileTypes[i] ?? '');
        }
      }
      // Manager/admin override reason when required evidence is still missing.
      if (missingRequired.length > 0 && canOverrideEvidence && evidenceOverrideReason.trim()) {
        form.set('evidence_override_reason', evidenceOverrideReason.trim());
      }
      const res = await fetch(`/api/tasks/${taskId}/close`, { method: 'POST', body: form });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error ?? 'Could not complete the task.');
        setSubmitting(false);
        return;
      }
      reload();
    } catch {
      setError('Network error while completing the task.');
      setSubmitting(false);
    }
  }

  async function submitCancel() {
    if (cancelSubmitting) return;
    if (!cancelReason.trim()) {
      setCancelError('A cancellation reason is required.');
      return;
    }
    setCancelSubmitting(true);
    setCancelError(null);
    try {
      const res = await fetch(`/api/tasks/${taskId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ reason: cancelReason.trim() }).toString(),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setCancelError(data.error ?? 'Could not cancel the task.');
        setCancelSubmitting(false);
        return;
      }
      reload();
    } catch {
      setCancelError('Network error while cancelling the task.');
      setCancelSubmitting(false);
    }
  }

  async function confirmReopen() {
    if (reopening) return;
    if (!window.confirm('Reopen this completed task? It will return to In Progress and become editable again.')) {
      return;
    }
    setReopening(true);
    setReopenError(null);
    try {
      const res = await fetch(`/api/tasks/${taskId}/reopen`, { method: 'POST' });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setReopenError(data.error ?? 'Could not reopen the task.');
        setReopening(false);
        return;
      }
      reload();
    } catch {
      setReopenError('Network error while reopening the task.');
      setReopening(false);
    }
  }

  const active = status !== 'completed' && status !== 'cancelled';
  // Step 0 gate: when the task declares required evidence, the user must either
  // (a) cover every REQUIRED type with an uploaded file, or (b) be a
  // manager/admin supplying an override reason. Skipping is allowed only when
  // there are no required types.
  const requiredGateOk =
    requiredTypes.length === 0 ||
    missingRequired.length === 0 ||
    (canOverrideEvidence && evidenceOverrideReason.trim().length > 0);
  const canGoNext =
    step === 0
      ? (skipEvidence || accepted.length > 0) && requiredGateOk
      : step === 1
        ? comment.trim().length > 0
        : true;

  const overlayCls =
    'fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4';
  const panelCls =
    'w-full max-w-lg rounded-xl bg-white shadow-xl';

  return (
    <div className="space-y-3" aria-label="Task actions">
      {reopenError && (
        <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700" role="alert">
          {reopenError}
        </p>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        {canComplete && active && (
          <button
            type="button"
            onClick={() => {
              setWizardOpen(true);
              setStep(0);
              setError(null);
            }}
            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
          >
            ✅ Complete task
          </button>
        )}
        {canCancel && active && (
          <button
            type="button"
            onClick={() => {
              setCancelOpen(true);
              setCancelReason('');
              setCancelError(null);
            }}
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:border-red-300 hover:bg-red-50 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500/30"
          >
            Cancel task
          </button>
        )}
        {canReopen && status === 'completed' && (
          <button
            type="button"
            onClick={confirmReopen}
            disabled={reopening}
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand-500/30 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {reopening ? 'Reopening…' : '↩ Reopen task'}
          </button>
        )}
      </div>

      {/* ────────────── Completion wizard ────────────── */}
      {wizardOpen && (
        <div
          className={overlayCls}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeWizard();
          }}
        >
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="completion-wizard-title"
            className={panelCls}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <h2 id="completion-wizard-title" className="text-base font-semibold text-slate-900">
                  Complete this task
                </h2>
                <p className="mt-0.5 truncate text-xs text-slate-500" title={title}>
                  {title}
                </p>
              </div>
              <button
                type="button"
                onClick={closeWizard}
                aria-label="Cancel completion (discard changes)"
                className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* step indicator */}
            <ol className="flex items-center gap-1 border-b border-slate-100 px-5 py-3 text-xs">
              {['Evidence', 'Comment', 'Confirm'].map((label, i) => (
                <li key={label} className="flex items-center gap-1">
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold ${
                      i < step
                        ? 'bg-emerald-100 text-emerald-700'
                        : i === step
                          ? 'bg-brand-600 text-white'
                          : 'bg-slate-100 text-slate-400'
                    }`}
                    aria-hidden="true"
                  >
                    {i < step ? '✓' : i + 1}
                  </span>
                  <span className={i === step ? 'font-semibold text-slate-800' : 'text-slate-500'}>{label}</span>
                  {i < 2 && <span className="mx-1 h-px w-5 bg-slate-200" aria-hidden="true" />}
                </li>
              ))}
            </ol>

            <div className="px-5 py-4">
              {error && (
                <p className="mb-3 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700" role="alert">
                  {error}
                </p>
              )}

              {step === 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Step 1 — Evidence</h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Upload proof of completion ({HINT}, max 10 MB per file — extension, MIME type and file signature are
                    validated). {requiredTypes.length > 0 ? 'Required items cannot be skipped unless a manager/admin override is supplied.' : 'You may skip; the skip is recorded in the activity log.'}
                  </p>

                  {evidenceRequirements.length > 0 && (
                    <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-3">
                      <p className="text-xs font-semibold text-slate-700">Required evidence for this task</p>
                      <ul className="mt-2 space-y-1 text-xs">
                        {evidenceRequirements.map((r) => {
                          const covered = coveredTypes.has(r.type);
                          return (
                            <li key={r.type} className="flex items-center gap-2">
                              <span aria-hidden="true">{covered ? '✅' : r.requirement === 'REQUIRED' ? '⬜' : '➖'}</span>
                              <span className={covered ? 'text-slate-500 line-through' : 'text-slate-700'}>
                                {r.label}
                              </span>
                              <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${r.requirement === 'REQUIRED' ? 'bg-rose-100 text-rose-700' : 'bg-slate-200 text-slate-600'}`}>
                                {r.requirement === 'REQUIRED' ? 'Required' : 'Optional'}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                      {missingRequired.length > 0 && (
                        <p className="mt-2 text-xs font-medium text-rose-700">
                          Still missing: {missingRequired.map((r) => r.label).join(', ')}.
                        </p>
                      )}
                    </div>
                  )}

                  <input
                    type="file"
                    multiple
                    accept={ACCEPT}
                    disabled={skipEvidence}
                    onChange={(e) => {
                      setInvalid([]);
                      void pickFiles(e.target.files);
                      e.target.value = '';
                    }}
                    aria-label="Choose evidence files"
                    className="mt-3 block w-full text-sm text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-emerald-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-emerald-700 hover:file:bg-emerald-200"
                  />

                  {accepted.length > 0 && (
                    <ul className="mt-3 space-y-1.5" data-wizard-evidence>
                      {accepted.map((f, i) => (
                        <li
                          key={`${f.name}-${f.size}-${i}`}
                          className="rounded-md border border-emerald-200 bg-emerald-50/60 px-3 py-2 text-sm"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="min-w-0 truncate text-emerald-900" title={f.name}>
                              📎 {f.name}
                            </span>
                            <span className="flex shrink-0 items-center gap-2">
                              <span className="text-xs text-emerald-700">{humanSize(f.size)}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  removeFile(i);
                                  setFileTypes((prev) => {
                                    const next = { ...prev };
                                    delete next[i];
                                    return next;
                                  });
                                }}
                                aria-label={`Remove ${f.name}`}
                                className="rounded-md px-1 text-slate-400 hover:text-red-600"
                              >
                                ✕
                              </button>
                            </span>
                          </div>
                          {evidenceRequirements.length > 0 && (
                            <label className="mt-1.5 flex items-center gap-2 text-xs text-slate-600">
                              Type:
                              <select
                                value={fileTypes[i] ?? ''}
                                onChange={(e) => setFileTypes((prev) => ({ ...prev, [i]: e.target.value }))}
                                className="flex-1 rounded-md border border-slate-300 bg-white px-2 py-1 text-xs focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                              >
                                <option value="">— Unassigned —</option>
                                {evidenceRequirements.map((r) => (
                                  <option key={r.type} value={r.type}>
                                    {r.label}
                                  </option>
                                ))}
                              </select>
                            </label>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                  {invalid.length > 0 && (
                    <ul className="mt-3 space-y-1 rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                      {invalid.map((msg, i) => (
                        <li key={i}>⚠️ {msg}</li>
                      ))}
                    </ul>
                  )}

                  {missingRequired.length > 0 && canOverrideEvidence && (
                    <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-3">
                      <label className={`${labelCls} text-amber-900`} htmlFor="evidence-override-reason">
                        Manager/admin override reason
                      </label>
                      <input
                        id="evidence-override-reason"
                        type="text"
                        maxLength={500}
                        value={evidenceOverrideReason}
                        onChange={(e) => setEvidenceOverrideReason(e.target.value)}
                        placeholder="Explain why the missing required evidence is waived."
                        className={`${inputCls} mt-1`}
                      />
                      <p className="mt-1 text-xs text-amber-800">Required to complete without: {missingRequired.map((r) => r.label).join(', ')}.</p>
                    </div>
                  )}

                  <label className="mt-3 flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={skipEvidence}
                      onChange={(e) => {
                        setSkipEvidence(e.target.checked);
                        if (e.target.checked) {
                          setAccepted([]);
                          setInvalid([]);
                          setFileTypes({});
                        }
                      }}
                      className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    Skip evidence upload <span className="text-xs text-slate-400">(recorded in the activity log)</span>
                  </label>
                </div>
              )}

              {step === 1 && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Step 2 — Completion comment</h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Mandatory. Summarize the outcome, results, or next steps — it is stored as the task's completion
                    comment.
                  </p>
                  <label className={`${labelCls} mt-3`} htmlFor="wizard-comment">
                    Completion comment <span className="text-emerald-600">*</span>
                  </label>
                  <textarea
                    id="wizard-comment"
                    rows={5}
                    maxLength={2000}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="What was accomplished, and what are the next steps?"
                    className={`${inputCls} mt-1`}
                  />
                  <p className="mt-1 text-right text-xs text-slate-400">{comment.length}/2000</p>
                </div>
              )}

                {step === 2 && (
                  <>
                    {incompleteChecklist > 0 && (
                      <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                        <p>{incompleteChecklist} checklist item(s) remain incomplete.</p>
                        {canOverrideChecklist ? <label className={`${labelCls} mt-2`}>Manager/admin override reason<input value={checklistOverrideReason} onChange={(e) => setChecklistOverrideReason(e.target.value)} maxLength={500} className={`${inputCls} mt-1`} required /></label> : <p className="mt-1">Complete the checklist before confirming.</p>}
                      </div>
                    )}
                  </>
                )}
                {step === 2 && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Step 3 — Confirm</h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Everything is saved in a single transaction. This cannot be undone (only an admin/manager may reopen).
                  </p>
                  <dl className="mt-3 space-y-2 rounded-md border border-slate-200 bg-slate-50 p-4 text-sm">
                    <div className="flex justify-between gap-3">
                      <dt className="text-slate-500">Status</dt>
                      <dd className="font-medium text-slate-900">Completed (100%)</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-slate-500">Evidence</dt>
                      <dd className="max-w-[60%] text-right font-medium text-slate-900">
                        {skipEvidence || accepted.length === 0 ? (
                          <span className="text-amber-700">Skipped (recorded)</span>
                        ) : (
                          <ul className="space-y-0.5" data-wizard-summary>
                            {accepted.map((f, i) => (
                              <li key={i} className="truncate" title={f.name}>
                                📎 {f.name} <span className="font-normal text-slate-500">({humanSize(f.size)})</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3 border-t border-slate-200 pt-2">
                      <dt className="text-slate-500">Completion comment</dt>
                      <dd className="max-w-[60%] whitespace-pre-wrap text-right font-medium text-slate-900">
                        {comment.trim()}
                      </dd>
                    </div>
                  </dl>
                  {submitting && (
                    <p className="mt-3 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700" role="status">
                      Saving — this may take a moment…
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* footer nav */}
            <div className="flex items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4">
              <button
                type="button"
                onClick={closeWizard}
                disabled={submitting}
                className="rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200/70 focus:outline-none focus:ring-2 focus:ring-slate-400/40 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {step === 2 ? 'Cancel' : 'Cancel'}
              </button>
              <div className="flex gap-2">
                {step > 0 && (
                  <button
                    type="button"
                    onClick={() => setStep((s) => s - 1)}
                    disabled={submitting}
                    className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand-500/30 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Back
                  </button>
                )}
                {step < 2 ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (step === 0 && !canGoNext) {
                        setInvalid((prev) => [
                          ...prev,
                          skipEvidence ? '' : 'Add at least one evidence file or choose to skip.',
                        ]);
                        return;
                      }
                      setStep((s) => s + 1);
                    }}
                    disabled={step === 1 && !canGoNext}
                    className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500/40 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={confirmCompletion}
                    disabled={submitting}
                    className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {submitting ? 'Completing…' : 'Confirm completion'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ────────────── Cancel dialog ────────────── */}
      {cancelOpen && (
        <div
          className={overlayCls}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !cancelSubmitting) setCancelOpen(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="cancel-dialog-title"
            className={panelCls}
          >
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 id="cancel-dialog-title" className="text-base font-semibold text-slate-900">
                Cancel this task
              </h2>
              <p className="mt-0.5 truncate text-xs text-slate-500" title={title}>
                {title}
              </p>
            </div>
            <div className="px-5 py-4">
              {cancelError && (
                <p className="mb-3 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700" role="alert">
                  {cancelError}
                </p>
              )}
              <p className="text-sm text-slate-600">
                Cancelling requires manager/admin approval and is recorded in the activity log. This cannot be undone
                through the regular edit form.
              </p>
              <label className={`${labelCls} mt-3`} htmlFor="cancel-reason">
                Cancellation reason <span className="text-red-500">*</span>
              </label>
              <textarea
                id="cancel-reason"
                rows={3}
                maxLength={1000}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Why is this task being cancelled?"
                className={`${inputCls} mt-1`}
              />
              <p className="mt-1 text-right text-xs text-slate-400">{cancelReason.length}/1000</p>
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4">
              <button
                type="button"
                onClick={() => setCancelOpen(false)}
                disabled={cancelSubmitting}
                className="rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200/70 focus:outline-none focus:ring-2 focus:ring-slate-400/40 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Keep task
              </button>
              <button
                type="button"
                onClick={submitCancel}
                disabled={cancelSubmitting}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500/40 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {cancelSubmitting ? 'Cancelling…' : 'Cancel task'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
