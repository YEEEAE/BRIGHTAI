// CommentBox — React island for the task comments thread.
//
// Renders the initial comment list (passed as props) and appends new comments
// in place after POSTing to /api/tasks/[id]/comment. Posting is disabled when
// the task is completed (CORE BUSINESS RULE #3: completed tasks are read-only).
//
// Props are plain serializable data — no functions — so Astro can hydrate this
// island (client:visible) without any server coupling.

import { useState } from 'react';
import { formatDbDate } from '../lib/format';

export interface CommentItem {
  id: number;
  task_id: number;
  user_id: number;
  comment: string;
  created_at: string;
  full_name: string;
}

interface Props {
  taskId: number;
  taskStatus: string;
  comments: CommentItem[];
}

const MAX_LENGTH = 2000;

export default function CommentBox({ taskId, taskStatus, comments }: Props) {
  const [items, setItems] = useState<CommentItem[]>(comments);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const readOnly = taskStatus === 'completed' || taskStatus === 'cancelled';

  async function submit() {
    const body = text.trim();
    if (!body || body.length > MAX_LENGTH || submitting || readOnly) return;

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/tasks/${taskId}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ comment: body }).toString(),
      });
      const data = (await res.json()) as { ok: boolean; error?: string; comment?: CommentItem };
      if (!res.ok || !data.ok || !data.comment) {
        setError(data.error ?? 'Could not post the comment. Please try again.');
        return;
      }
      setItems((prev) => [...prev, data.comment as CommentItem]);
      setText('');
    } catch {
      setError('Network error while posting the comment.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="space-y-3" aria-live="polite">
        {items.map((c) => (
          <div key={c.id} className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-semibold text-slate-900">{c.full_name}</span>
              <span className="text-xs text-slate-500">{formatDbDate(c.created_at)}</span>
            </div>
            <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{c.comment}</p>
          </div>
        ))}
      </div>

      {readOnly ? (
        <p className="mt-4 rounded-md bg-slate-100 px-4 py-3 text-sm text-slate-600">
          This task is {taskStatus === 'cancelled' ? 'cancelled' : 'completed'} and read-only — commenting is disabled.
        </p>
      ) : (
        <div className="mt-4">
          <label htmlFor={`comment-${taskId}`} className="mb-1 block text-sm font-medium text-slate-700">
            Add a comment
          </label>
          <textarea
            id={`comment-${taskId}`}
            rows={3}
            maxLength={MAX_LENGTH}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write a comment…"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          />
          <div className="mt-2 flex items-center justify-between gap-3">
            <span className={`text-xs ${text.length > MAX_LENGTH - 100 ? 'text-amber-700' : 'text-slate-500'}`}>
              {text.length}/{MAX_LENGTH}
            </span>
            {error && <span className="text-xs font-medium text-red-600">{error}</span>}
          </div>
          <button
            type="button"
            onClick={submit}
            disabled={submitting || text.trim().length === 0}
            className="mt-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? 'Posting…' : 'Post comment'}
          </button>
        </div>
      )}
    </div>
  );
}
