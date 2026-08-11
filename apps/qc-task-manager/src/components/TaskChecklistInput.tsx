// TaskChecklistInput — React island for the "create task" form.
// Renders one text input per checklist item (all named `checklist` so FormData
// delivers them as an array) plus add/remove controls. SSR-rendered inputs
// still submit without JS; the buttons just make the list editable.

import { useState } from 'react';

interface Props {
  maxItems?: number;
}

export default function TaskChecklistInput({ maxItems = 30 }: Props) {
  const [items, setItems] = useState<string[]>(['']);

  const update = (i: number, value: string) =>
    setItems((v) => v.map((x, j) => (j === i ? value : x)));
  const remove = (i: number) => setItems((v) => v.filter((_, j) => j !== i));
  const add = () =>
    setItems((v) => (v.length >= maxItems ? v : [...v, '']));

  const inputCls =
    'w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500';

  return (
    <div className="space-y-2">
      {items.map((value, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            type="text"
            name="checklist"
            maxLength={200}
            value={value}
            onChange={(e) => update(i, e.target.value)}
            placeholder={`Checklist item ${i + 1}`}
            aria-label={`Checklist item ${i + 1}`}
            className={inputCls}
          />
          {items.length > 1 && (
            <button
              type="button"
              onClick={() => remove(i)}
              aria-label={`Remove checklist item ${i + 1}`}
              className="shrink-0 rounded-md border border-slate-300 px-2.5 py-2 text-sm text-slate-500 hover:bg-red-50 hover:text-red-600"
            >
              ✕
            </button>
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        disabled={items.length >= maxItems}
        className="rounded-md border border-dashed border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:border-brand-400 hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
      >
        + Add checklist item
      </button>
      <p className="text-xs text-slate-400">Up to {maxItems} items — empty rows are ignored.</p>
    </div>
  );
}
