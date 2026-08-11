// TaskUpdatePanel — React island for editing a task in place.
//
// Three responsibilities, all permission-gated server-side too:
//   1. Progress: status (non-completed states), progress %, blocker note.
//   2. Details (supervisor/manager/admin only): title, description, assignee,
//      due date, priority.
//   3. Closure flow (CORE BUSINESS RULE #3): completion comment (mandatory) +
//      evidence file or recorded skip → POST /api/tasks/[id]/close.
//
// Every successful mutation reloads the page so the server-rendered sections
// (status badges, activity timeline, attachments) stay in sync. Submit buttons
// show a loading state while the request is in flight.

import { useState } from 'react';

export interface TaskSnapshot {
  id: number;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  progress_percent: number;
  assigned_to: number | null;
  due_date: string | null;
  blocker_note: string | null;
}

export interface UserOption {
  id: number;
  full_name: string;
  role: string;
}

interface Props {
  task: TaskSnapshot;
  canEditLocked: boolean;
  users: UserOption[];
}

const MAX_BLOCKER = 1000;
const MAX_COMMENT = 2000;
const MAX_TITLE = 200;
const MAX_DESCRIPTION = 5000;

const STATUS_OPTIONS: { value: string; label: string; emoji: string }[] = [
  { value: 'not_started', label: 'Not started', emoji: '🔴' },
  { value: 'in_progress', label: 'In progress', emoji: '🟡' },
  { value: 'on_hold', label: 'On hold', emoji: '🟠' },
];

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

export default function TaskUpdatePanel({ task, canEditLocked, users }: Props) {
  // ── progress group ──
  const [status, setStatus] = useState(task.status);
  const [progress, setProgress] = useState(String(task.progress_percent));
  const [blocker, setBlocker] = useState(task.blocker_note ?? '');
  // ── details group (locked fields) ──
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? '');
  const [assignee, setAssignee] = useState(task.assigned_to != null ? String(task.assigned_to) : '');
  const [dueDate, setDueDate] = useState(task.due_date ?? '');
  const [priority, setPriority] = useState(task.priority);
  // ── closure group ──
  const [comment, setComment] = useState('');
  const [evidence, setEvidence] = useState<File | null>(null);
  const [skipEvidence, setSkipEvidence] = useState(false);
  // ── ui state ──
  const [saving, setSaving] = useState<'update' | 'close' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const progressNum = Number(progress);

  function reload() {
    window.location.href = window.location.pathname;
  }

  async function postUpdate(fields: Record<string, string>) {
    setSaving('update');
    setError(null);
    setNotice(null);
    try {
      const body = new URLSearchParams(fields);
      const res = await fetch(`/api/tasks/${task.id}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
      });
      const data = (await res.json()) as { ok: boolean; error?: string; message?: string };
      if (!res.ok || !data.ok) {
        setError(data.error ?? 'Could not save the changes.');
        return;
      }
      setNotice(data.message ?? 'Task updated.');
      reload();
    } catch {
      setError('Network error while saving the changes.');
      setSaving(null);
    }
  }

  /** Progress group only (status / progress / blocker) — every editor. */
  async function saveProgress(ev: React.FormEvent) {
    ev.preventDefault();
    if (saving) return;
    if (!Number.isFinite(progressNum) || progressNum < 0 || progressNum > 100) {
      setError('Progress must be a number between 0 and 100.');
      return;
    }
    await postUpdate({ status, progress_percent: progress, blocker_note: blocker });
  }

  /** Locked-fields group only (title/description/assignee/due/priority). */
  async function saveDetails(ev: React.FormEvent) {
    ev.preventDefault();
    if (saving) return;
    await postUpdate({
      title,
      description,
      assigned_to: assignee,
      due_date: dueDate,
      priority,
    });
  }

  async function saveClose(ev: React.FormEvent) {
    ev.preventDefault();
    if (saving) return;
    if (!comment.trim()) {
      setError('A completion comment is required to complete the task.');
      return;
    }
    if (evidence && !skipEvidence) {
      if (evidence.size > 10 * 1024 * 1024) {
        setError('The evidence file exceeds the 10 MB upload limit.');
        return;
      }
    }
    setSaving('close');
    setError(null);
    setNotice(null);
    try {
      const form = new FormData();
      form.set('completion_comment', comment.trim());
      if (evidence && !skipEvidence) {
        form.set('evidence', evidence);
      } else {
        form.set('skip_evidence', '1');
      }
      const res = await fetch(`/api/tasks/${task.id}/close`, {
        method: 'POST',
        body: form,
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error ?? 'Could not complete the task.');
        return;
      }
      reload();
    } catch {
      setError('Network error while completing the task.');
      setSaving(null);
    }
  }

  const inputCls =
    'w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500';
  const labelCls = 'block text-sm font-medium text-slate-700';
  const sectionTitle = 'text-sm font-semibold text-slate-900';

  return (
    <div className="space-y-5">
      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700" role="alert">
          {error}
        </p>
      )}
      {notice && (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700" role="status">
          {notice}
        </p>
      )}

      {/* ── Progress group ── */}
      <form onSubmit={saveProgress} className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className={sectionTitle}>Update progress</h2>
        <p className="mt-0.5 text-xs text-slate-500">
          Status, progress, and blocker notes — editable by anyone assigned to the task.
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor={`status-${task.id}`} className={labelCls}>Status</label>
            <select
              id={`status-${task.id}`}
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className={`${inputCls} mt-1`}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.emoji} {s.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-slate-400">
              Mark as <span className="font-medium text-emerald-600">Completed</span> using the completion flow below.
            </p>
          </div>

          <div>
            <label htmlFor={`progress-${task.id}`} className={labelCls}>
              Progress: <span className="font-semibold tabular-nums text-slate-900">{progressNum || 0}%</span>
            </label>
            <input
              id={`progress-${task.id}`}
              type="range"
              min={0}
              max={100}
              step={5}
              value={progress}
              onChange={(e) => setProgress(e.target.value)}
              className="mt-3 w-full accent-brand-600"
            />
            <input
              type="number"
              min={0}
              max={100}
              value={progress}
              onChange={(e) => setProgress(e.target.value)}
              aria-label="Progress percent"
              className="mt-2 w-24 rounded-md border border-slate-300 px-2 py-1 text-sm tabular-nums focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
        </div>

        <div className="mt-4">
          <label htmlFor={`blocker-${task.id}`} className={labelCls}>
            Blocker note <span className="font-normal text-slate-400">(optional)</span>
          </label>
          <textarea
            id={`blocker-${task.id}`}
            rows={2}
            maxLength={MAX_BLOCKER}
            value={blocker}
            onChange={(e) => setBlocker(e.target.value)}
            placeholder="Anything blocking this task?"
            className={`${inputCls} mt-1`}
          />
          <p className="mt-1 text-right text-xs text-slate-400">{blocker.length}/{MAX_BLOCKER}</p>
        </div>

        <button
          type="submit"
          disabled={saving !== null}
          className="mt-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving === 'update' ? 'Saving…' : 'Save changes'}
        </button>
      </form>

      {/* ── Details group (locked fields) ── */}
      {canEditLocked && (
        <form onSubmit={saveDetails} className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className={sectionTitle}>Task details</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Title, description, assignee, due date, and priority — supervisor/manager/admin only.
          </p>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor={`title-${task.id}`} className={labelCls}>Title</label>
              <input
                id={`title-${task.id}`}
                type="text"
                maxLength={MAX_TITLE}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className={`${inputCls} mt-1`}
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor={`description-${task.id}`} className={labelCls}>Description</label>
              <textarea
                id={`description-${task.id}`}
                rows={3}
                maxLength={MAX_DESCRIPTION}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={`${inputCls} mt-1`}
              />
            </div>
            <div>
              <label htmlFor={`assignee-${task.id}`} className={labelCls}>Assignee</label>
              <select
                id={`assignee-${task.id}`}
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                className={`${inputCls} mt-1`}
              >
                <option value="">Unassigned</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.full_name} ({u.role})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor={`duedate-${task.id}`} className={labelCls}>Due date</label>
              <input
                id={`duedate-${task.id}`}
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className={`${inputCls} mt-1`}
              />
            </div>
            <div>
              <label htmlFor={`priority-${task.id}`} className={labelCls}>Priority</label>
              <select
                id={`priority-${task.id}`}
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className={`${inputCls} mt-1`}
              >
                {PRIORITY_OPTIONS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving !== null}
            className="mt-4 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving === 'update' ? 'Saving…' : 'Save details'}
          </button>
        </form>
      )}

      {/* ── Closure group ── */}
      <form onSubmit={saveClose} className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-5">
        <h2 className="text-sm font-semibold text-emerald-900">Complete this task</h2>
        <p className="mt-0.5 text-xs text-emerald-700">
          Closure flow: completion comment (required) + evidence (optional — you may skip, and the skip is recorded).
        </p>

        <div className="mt-4">
          <label htmlFor={`close-comment-${task.id}`} className="block text-sm font-medium text-emerald-900">
            Completion comment <span className="text-emerald-600">*</span>
          </label>
          <textarea
            id={`close-comment-${task.id}`}
            rows={3}
            maxLength={MAX_COMMENT}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Summarize the outcome, results, or next steps…"
            required
            className={`${inputCls} mt-1`}
          />
          <p className="mt-1 text-right text-xs text-slate-400">{comment.length}/{MAX_COMMENT}</p>
        </div>

        <div className="mt-3">
          <label htmlFor={`evidence-${task.id}`} className="block text-sm font-medium text-emerald-900">
            Evidence file <span className="font-normal text-emerald-700">(optional)</span>
          </label>
          <input
            id={`evidence-${task.id}`}
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.gif,.webp,.txt,.md,.csv,.json,.log,.xml,.sql,.xlsx,.xls,.docx,.doc,.pptx,.ppt,.zip"
            disabled={skipEvidence}
            onChange={(e) => setEvidence(e.target.files?.[0] ?? null)}
            className="mt-1 block w-full text-sm text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-emerald-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-emerald-700 hover:file:bg-emerald-200"
          />
          <label className="mt-2 flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={skipEvidence}
              onChange={(e) => {
                setSkipEvidence(e.target.checked);
                if (e.target.checked) setEvidence(null);
              }}
              className="h-4 w-4 rounded border-slate-300 text-emerald-600"
            />
            Skip evidence upload <span className="text-xs text-slate-400">(recorded in the activity log)</span>
          </label>
          {evidence && !skipEvidence && (
            <p className="mt-1 text-xs text-slate-500">Selected: {evidence.name} ({Math.round(evidence.size / 1024)} KB)</p>
          )}
        </div>

        <button
          type="submit"
          disabled={saving !== null}
          className="mt-4 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving === 'close' ? 'Completing…' : '✅ Mark as completed'}
        </button>
      </form>
    </div>
  );
}
