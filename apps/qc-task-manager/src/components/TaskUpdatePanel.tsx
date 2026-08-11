// TaskUpdatePanel — React island for editing a task in place.
//
// Responsibilities, all permission-gated server-side too:
//   1. Progress: status (non-completed states), progress %, blocker note.
//      Moving to In Progress is BLOCKED while dependencies are incomplete;
//      admin/manager may override ONLY with an explicit logged reason.
//   2. Details (supervisor/manager/admin only): title, description, department,
//      assignee, due date, priority, recurrence, recurrence end date.
//   3. Checklist: anyone who can edit the task may toggle items; add/remove
//      items requires supervisor+.
//   4. Dependencies (supervisor+): add / remove blocking tasks.
//   The COMPLETION flow is NOT here — it lives in TaskLifecycle.tsx (the
//   3-step wizard), mounted on the task page.
//
// Every successful mutation reloads the page so the server-rendered sections
// (status badges, activity timeline, attachments) stay in sync.

import { useState } from 'react';

export interface TaskSnapshot {
  id: number;
  title: string;
  description: string | null;
  department: string;
  status: string;
  priority: string;
  progress_percent: number;
  assigned_to: number | null;
  due_date: string | null;
  recurrence: string;
  recurrence_end_date: string | null;
  blocker_note: string | null;
}

export interface ChecklistItemSnapshot {
  id: number;
  title: string;
  is_completed: boolean;
}

export interface DependencySnapshot {
  task_id: number;
  title: string;
  status: string;
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
  checklist: ChecklistItemSnapshot[];
  dependencies: DependencySnapshot[];
  /** Candidate tasks for the dependency add-picker. */
  dependencyTasks: DependencySnapshot[];
  /** Dependencies that are NOT completed (they block In Progress). */
  blockingDependencies: DependencySnapshot[];
  /** Admin/manager may force past a block with a logged reason. */
  canOverrideDependencies: boolean;
}

const MAX_BLOCKER = 1000;
const MAX_TITLE = 200;
const MAX_DESCRIPTION = 5000;
const MAX_DEPARTMENT = 50;
const MAX_CHECKLIST_ITEM = 200;
const MAX_OVERRIDE_REASON = 500;

const STATUS_OPTIONS: { value: string; label: string; emoji: string }[] = [
  { value: 'not_started', label: 'Not started', emoji: '🔴' },
  { value: 'in_progress', label: 'In progress', emoji: '🟡' },
  { value: 'on_hold', label: 'On hold', emoji: '🟠' },
];

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent 🔴' },
];

const RECURRENCE_OPTIONS = [
  { value: 'none', label: 'No recurrence' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
];

export default function TaskUpdatePanel({
  task,
  canEditLocked,
  users,
  checklist,
  dependencies,
  dependencyTasks,
  blockingDependencies,
  canOverrideDependencies,
}: Props) {
  // ── progress group ──
  const [status, setStatus] = useState(task.status);
  const [progress, setProgress] = useState(String(task.progress_percent));
  const [blocker, setBlocker] = useState(task.blocker_note ?? '');
  const [overrideReason, setOverrideReason] = useState('');
  // ── details group (locked fields) ──
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? '');
  const [department, setDepartment] = useState(task.department);
  const [assignee, setAssignee] = useState(task.assigned_to != null ? String(task.assigned_to) : '');
  const [dueDate, setDueDate] = useState(task.due_date ?? '');
  const [priority, setPriority] = useState(task.priority);
  const [recurrence, setRecurrence] = useState(task.recurrence);
  const [recurrenceEndDate, setRecurrenceEndDate] = useState(task.recurrence_end_date ?? '');
  // ── checklist / dependency group ──
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [depPick, setDepPick] = useState('');
  // ── ui state ──
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const progressNum = Number(progress);
  const blocked = status === 'in_progress' && blockingDependencies.length > 0;
  // on_hold from not_started/in_progress requires a blocker note (spec) — the
  // server enforces it; this hint explains why Save will be rejected.
  const holdNeedsBlocker =
    status === 'on_hold' &&
    (task.status === 'not_started' || task.status === 'in_progress') &&
    blocker.trim().length === 0;

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
        setSaving(null);
        return;
      }
      setNotice(data.message ?? 'Task updated.');
      reload();
    } catch {
      setError('Network error while saving the changes.');
      setSaving(null);
    }
  }

  /** Progress group (status / progress / blocker + dependency override). */
  async function saveProgress(ev: React.FormEvent) {
    ev.preventDefault();
    if (saving) return;
    if (!Number.isFinite(progressNum) || progressNum < 0 || progressNum > 100) {
      setError('Progress must be a number between 0 and 100.');
      return;
    }
    const fields: Record<string, string> = { status, progress_percent: progress, blocker_note: blocker };
    if (blocked && canOverrideDependencies) {
      if (!overrideReason.trim()) {
        setError('An explicit reason is required to override blocked dependencies.');
        return;
      }
      fields.dependency_override_reason = overrideReason.trim();
    }
    await postUpdate(fields);
  }

  /** Locked-fields group (title/description/department/assignee/due/priority/recurrence). */
  async function saveDetails(ev: React.FormEvent) {
    ev.preventDefault();
    if (saving) return;
    await postUpdate({
      title,
      description,
      department,
      assigned_to: assignee,
      due_date: dueDate,
      priority,
      recurrence,
      recurrence_end_date: recurrenceEndDate,
    });
  }

  async function addChecklistItem(ev: React.FormEvent) {
    ev.preventDefault();
    if (saving) return;
    if (!newChecklistItem.trim()) {
      setError('Checklist item cannot be empty.');
      return;
    }
    await postUpdate({ checklist_add: newChecklistItem.trim() });
  }

  async function toggleChecklist(id: number, checked: boolean) {
    if (saving) return;
    await postUpdate({ checklist_toggle: String(id) });
  }

  async function removeChecklistItem(id: number) {
    if (saving) return;
    await postUpdate({ checklist_remove: String(id) });
  }

  async function addDependency(ev: React.FormEvent) {
    ev.preventDefault();
    if (saving) return;
    if (!depPick) {
      setError('Select a task to add as a dependency.');
      return;
    }
    await postUpdate({ dependency_add: depPick });
  }

  async function removeDependency(id: number) {
    if (saving) return;
    await postUpdate({ dependency_remove: String(id) });
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
              Mark as <span className="font-medium text-emerald-600">Completed</span> using the Complete task button.
            </p>
            {holdNeedsBlocker && (
              <p className="mt-1 text-xs font-medium text-red-600">
                Moving to On hold requires a blocker note — fill in the blocker field below.
              </p>
            )}
            {blocked && !canOverrideDependencies && (
              <p className="mt-1 text-xs font-medium text-red-600">
                Blocked by {blockingDependencies.length} incomplete dependenc{blockingDependencies.length === 1 ? 'y' : 'ies'}. Ask a manager/admin to override.
              </p>
            )}
            {blocked && canOverrideDependencies && (
              <label className="mt-2 block">
                <span className="text-xs font-medium text-red-700">
                  Override reason <span className="text-red-500">* (required, logged)</span>
                </span>
                <textarea
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  maxLength={MAX_OVERRIDE_REASON}
                  rows={2}
                  placeholder="Why is it safe to start despite incomplete dependencies?"
                  className={`${inputCls} mt-1`}
                />
              </label>
            )}
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
            Title, description, department, assignee, due date, priority, recurrence — supervisor/manager/admin only.
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
              <label htmlFor={`department-${task.id}`} className={labelCls}>Department</label>
              <input
                id={`department-${task.id}`}
                type="text"
                maxLength={MAX_DEPARTMENT}
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
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
            <div>
              <label htmlFor={`recurrence-${task.id}`} className={labelCls}>Recurrence</label>
              <select
                id={`recurrence-${task.id}`}
                value={recurrence}
                onChange={(e) => setRecurrence(e.target.value)}
                className={`${inputCls} mt-1`}
              >
                {RECURRENCE_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor={`recurrence-end-${task.id}`} className={labelCls}>Recurrence end date</label>
              <input
                id={`recurrence-end-${task.id}`}
                type="date"
                value={recurrenceEndDate}
                onChange={(e) => setRecurrenceEndDate(e.target.value)}
                className={`${inputCls} mt-1`}
              />
              <p className="mt-1 text-xs text-slate-400">Empty = keep recurring (on completion) indefinitely.</p>
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

      {/* ── Checklist group ── */}
      <div className="rounded-lg border border-slate-200 bg-white p-5" aria-label="Checklist">
        <h2 className={sectionTitle}>Checklist</h2>
        <p className="mt-0.5 text-xs text-slate-500">
          {checklist.length} item{checklist.length === 1 ? '' : 's'} — anyone assigned may tick items off;
          {canEditLocked ? ' add/remove requires supervisor+.' : ' items are managed by supervisors and above.'}
        </p>
        {checklist.length === 0 ? (
          <p className="mt-3 rounded-md border border-dashed border-slate-300 bg-slate-50 p-3 text-sm text-slate-500">
            No checklist items yet.
          </p>
        ) : (
          <ul className="mt-3 space-y-1.5" data-checklist>
            {checklist.map((item) => (
              <li key={item.id} className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2">
                <input
                  type="checkbox"
                  checked={item.is_completed}
                  onChange={(e) => toggleChecklist(item.id, e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  aria-label={`Mark "${item.title}" as ${item.is_completed ? 'not done' : 'done'}`}
                />
                <span className={`flex-1 text-sm ${item.is_completed ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                  {item.title}
                </span>
                {canEditLocked && (
                  <button
                    type="button"
                    onClick={() => removeChecklistItem(item.id)}
                    aria-label={`Remove checklist item "${item.title}"`}
                    className="rounded-md px-1.5 py-0.5 text-sm text-slate-400 hover:bg-red-50 hover:text-red-600"
                  >
                    ✕
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
        {canEditLocked && (
          <form onSubmit={addChecklistItem} className="mt-3 flex gap-2">
            <input
              type="text"
              value={newChecklistItem}
              onChange={(e) => setNewChecklistItem(e.target.value)}
              maxLength={MAX_CHECKLIST_ITEM}
              placeholder="New checklist item…"
              aria-label="New checklist item title"
              className={inputCls}
            />
            <button
              type="submit"
              disabled={saving !== null}
              className="shrink-0 rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Add
            </button>
          </form>
        )}
      </div>

      {/* ── Dependencies group (supervisor+) ── */}
      {canEditLocked && (
        <form onSubmit={addDependency} className="rounded-lg border border-slate-200 bg-white p-5" aria-label="Dependencies">
          <h2 className={sectionTitle}>Dependencies</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Tasks that must be completed before this one can start. Blocking is enforced on the server.
          </p>
          {dependencies.length === 0 ? (
            <p className="mt-3 rounded-md border border-dashed border-slate-300 bg-slate-50 p-3 text-sm text-slate-500">
              No dependencies — this task can start any time.
            </p>
          ) : (
            <ul className="mt-3 space-y-1.5" data-dependencies>
              {dependencies.map((d) => {
                const blocked = d.status !== 'completed' && d.status !== 'cancelled';
                return (
                  <li
                    key={d.task_id}
                    className={`flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm ${
                      blocked ? 'border-red-200 bg-red-50/60' : 'border-slate-200 bg-white'
                    }`}
                  >
                    <a href={`/tasks/${d.task_id}`} className="font-medium text-slate-800 hover:underline">
                      #{d.task_id} {d.title}
                    </a>
                    <span className="flex items-center gap-2">
                      <span className={`text-xs uppercase ${blocked ? 'font-semibold text-red-600' : 'text-emerald-600'}`}>
                        {d.status.replace(/_/g, ' ')}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeDependency(d.task_id)}
                        aria-label={`Remove dependency #${d.task_id}`}
                        className="rounded-md px-1.5 py-0.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                      >
                        ✕
                      </button>
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
          <div className="mt-3 flex gap-2">
            <select
              value={depPick}
              onChange={(e) => setDepPick(e.target.value)}
              aria-label="Add dependency task"
              className={inputCls}
            >
              <option value="">Select a task to depend on…</option>
              {dependencyTasks
                .filter((t) => t.task_id !== task.id && !dependencies.some((d) => d.task_id === t.task_id))
                .map((t) => (
                  <option key={t.task_id} value={t.task_id}>
                    #{t.task_id} {t.title} ({t.status.replace(/_/g, ' ')})
                  </option>
                ))}
            </select>
            <button
              type="submit"
              disabled={saving !== null}
              className="shrink-0 rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700"
            >
              Add
            </button>
          </div>
        </form>
      )}

    </div>
  );
}
