// EvidenceRequirementsInput — React island for editing a template's evidence
// requirements as a list of rows. Emits the canonical JSON into a hidden input
// (`evidence_requirements_json`) the surrounding Astro form POSTs to the server.
//
// Each requirement row captures: type (slug), label, requirement (REQUIRED |
// OPTIONAL), allowed extensions (comma list, optional narrowing), maxFiles
// (optional), and a description. The server re-validates everything.

import { useMemo, useState } from 'react';

interface Requirement {
  type: string;
  label: string;
  requirement: 'REQUIRED' | 'OPTIONAL';
  allowedExtensions?: string[];
  maxFiles?: number;
  description?: string;
}

interface Props {
  /** Initial requirements (edit mode). JSON-decoded by the Astro page. */
  initial?: Requirement[];
}

const inputCls =
  'w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500';
const labelCls = 'block text-xs font-medium text-slate-600';

function parseInitial(raw: unknown): Requirement[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((r) => {
      const item = (r ?? {}) as Record<string, unknown>;
      return {
        type: String(item.type ?? '').trim().toLowerCase(),
        label: String(item.label ?? '').trim(),
        requirement: (String(item.requirement ?? 'REQUIRED').toUpperCase() === 'OPTIONAL'
          ? 'OPTIONAL'
          : 'REQUIRED') as 'REQUIRED' | 'OPTIONAL',
        allowedExtensions: Array.isArray(item.allowedExtensions)
          ? item.allowedExtensions.map((x) => String(x).trim().toLowerCase()).filter((x) => x)
          : Array.isArray(item.allowed_extensions)
            ? item.allowed_extensions.map((x) => String(x).trim().toLowerCase()).filter((x) => x)
            : undefined,
        maxFiles: item.maxFiles != null && item.maxFiles !== '' ? Number(item.maxFiles) : undefined,
        description: item.description ? String(item.description) : undefined,
      } as Requirement;
    })
    .filter((r) => r.type || r.label);
}

export default function EvidenceRequirementsInput({ initial = [] }: Props) {
  const [rows, setRows] = useState<Requirement[]>(() => parseInitial(initial));

  const serialized = useMemo(() => {
    const clean = rows
      .map((r) => {
        const out: Record<string, unknown> = {
          type: r.type,
          label: r.label,
          requirement: r.requirement,
        };
        if (r.allowedExtensions && r.allowedExtensions.length > 0) out.allowedExtensions = r.allowedExtensions;
        if (r.maxFiles != null && Number.isFinite(r.maxFiles)) out.maxFiles = r.maxFiles;
        if (r.description) out.description = r.description;
        return out;
      })
      .filter((r) => r.type && r.label);
    return JSON.stringify(clean);
  }, [rows]);

  function add() {
    setRows((prev) => [
      ...prev,
      { type: '', label: '', requirement: 'REQUIRED' },
    ]);
  }
  function remove(i: number) {
    setRows((prev) => prev.filter((_, idx) => idx !== i));
  }
  function patch(i: number, patch: Partial<Requirement>) {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  return (
    <div>
      <input type="hidden" name="evidence_requirements_json" value={serialized} />

      <div class="mb-3 flex items-center justify-between">
        <p class="text-sm text-slate-600">
          Declare the evidence this task requires. <span class="font-medium">Required</span> items block task completion until uploaded.
        </p>
        <button
          type="button"
          onClick={add}
          class="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          + Add requirement
        </button>
      </div>

      {rows.length === 0 ? (
        <p class="rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
          No evidence requirements — tasks from this template close without an evidence gate.
        </p>
      ) : (
        <div class="space-y-3">
          {rows.map((r, i) => (
            <div class="rounded-md border border-slate-200 bg-slate-50 p-3">
              <div class="grid gap-3 sm:grid-cols-2">
                <div>
                  <label class={labelCls} htmlFor={`er-type-${i}`}>Type (slug)</label>
                  <input
                    id={`er-type-${i}`}
                    class={inputCls}
                    value={r.type}
                    placeholder="e.g. inspection_report"
                    onChange={(e) => patch(i, { type: e.target.value.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_') })}
                  />
                </div>
                <div>
                  <label class={labelCls} htmlFor={`er-label-${i}`}>Label</label>
                  <input
                    id={`er-label-${i}`}
                    class={inputCls}
                    value={r.label}
                    placeholder="e.g. Inspection Report"
                    onChange={(e) => patch(i, { label: e.target.value })}
                  />
                </div>
                <div>
                  <label class={labelCls} htmlFor={`er-req-${i}`}>Requirement</label>
                  <select
                    id={`er-req-${i}`}
                    class={inputCls}
                    value={r.requirement}
                    onChange={(e) => patch(i, { requirement: e.target.value as 'REQUIRED' | 'OPTIONAL' })}
                  >
                    <option value="REQUIRED">Required</option>
                    <option value="OPTIONAL">Optional</option>
                  </select>
                </div>
                <div>
                  <label class={labelCls} htmlFor={`er-max-${i}`}>Max files (optional)</label>
                  <input
                    id={`er-max-${i}`}
                    type="number"
                    min={1}
                    class={inputCls}
                    value={r.maxFiles ?? ''}
                    onChange={(e) => patch(i, { maxFiles: e.target.value ? Number(e.target.value) : undefined })}
                  />
                </div>
                <div class="sm:col-span-2">
                  <label class={labelCls} htmlFor={`er-ext-${i}`}>Allowed extensions (optional, comma list)</label>
                  <input
                    id={`er-ext-${i}`}
                    class={inputCls}
                    value={(r.allowedExtensions ?? []).join(', ')}
                    placeholder="pdf, png, jpg — leave blank to accept all evidence types"
                    onChange={(e) =>
                      patch(i, {
                        allowedExtensions: e.target.value
                          .split(',')
                          .map((x) => x.trim().toLowerCase().replace(/^\./, ''))
                          .filter((x) => x)
                      })
                    }
                  />
                </div>
                <div class="sm:col-span-2">
                  <label class={labelCls} htmlFor={`er-desc-${i}`}>Description (optional)</label>
                  <input
                    id={`er-desc-${i}`}
                    class={inputCls}
                    value={r.description ?? ''}
                    onChange={(e) => patch(i, { description: e.target.value })}
                  />
                </div>
              </div>
              <div class="mt-2 text-left">
                <button
                  type="button"
                  onClick={() => remove(i)}
                  class="text-xs font-medium text-rose-600 hover:text-rose-700"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
