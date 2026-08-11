// TaskDependencyInput — React island for the "create task" form.
// Lets the creator pick tasks this task depends on (hidden inputs named
// `dependencies`). SSR-rendered selected chips still submit without JS.

import { useState } from 'react';

export interface DependencyTaskOption {
  id: number;
  title: string;
  status: string;
}

interface Props {
  tasks: DependencyTaskOption[];
}

export default function TaskDependencyInput({ tasks }: Props) {
  const [selected, setSelected] = useState<number[]>([]);
  const [pick, setPick] = useState('');

  const add = () => {
    const id = Number(pick);
    if (Number.isInteger(id) && id > 0 && !selected.includes(id)) {
      setSelected((v) => [...v, id]);
    }
    setPick('');
  };

  const remove = (id: number) => setSelected((v) => v.filter((x) => x !== id));

  const selectCls =
    'w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500';

  return (
    <div className="space-y-2">
      {selected.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {selected.map((id) => {
            const t = tasks.find((x) => x.id === id);
            return (
              <li
                key={id}
                className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 py-1 pl-3 pr-1.5 text-xs font-medium text-slate-700"
              >
                <input type="hidden" name="dependencies" value={id} />
                #{id} {t?.title ?? 'Unknown task'}
                <button
                  type="button"
                  onClick={() => remove(id)}
                  aria-label={`Remove dependency #${id}`}
                  className="rounded-full p-0.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
                >
                  ✕
                </button>
              </li>
            );
          })}
        </ul>
      )}
      <div className="flex gap-2">
        <select value={pick} onChange={(e) => setPick(e.target.value)} className={selectCls} aria-label="Dependency task">
          <option value="">Select a task to depend on…</option>
          {tasks.map((t) => (
            <option key={t.id} value={t.id}>
              #{t.id} {t.title} ({t.status.replace(/_/g, ' ')})
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={add}
          className="shrink-0 rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          Add
        </button>
      </div>
      <p className="text-xs text-slate-400">
        This task cannot move to In Progress until every dependency is completed.
      </p>
    </div>
  );
}
