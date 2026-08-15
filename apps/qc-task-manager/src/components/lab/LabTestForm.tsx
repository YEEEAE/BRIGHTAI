// LabTestForm — the shared AIR/VACUUM test form island (PROMPT 05).
//
// One component renders the full printed form (sections 1–8) for both
// /lab/tests/new?type=air and ?type=vacuum — only testType differs. Only
// printed/black fields from the approved form become inputs; handwritten-only
// content is never invented. Reference values (§3 Actual Pressure, §5 Test
// Parameters) are DISPLAYED ONLY — never validated against measurements, and
// no scientific formula is applied anywhere (§78).
//
// The island owns: the sample grid (bounded by No. of Samples Tested,
// 1–20 — no arbitrary row growth), client-side validation mirroring the
// server Zod rules, unsaved-change detection (beforeunload + visible
// indicator), and the Save Draft / Save and Continue / Submit / Cancel
// actions. Submission is a native form POST to the same URL (query param
// carries test_type; the server re-validates everything).
//
// Results (sample + final) are HUMAN decisions entered here — the server and
// this component never compute or suggest them (§19, §76).

import { useEffect, useRef, useState } from 'react';

export interface LabResultOption {
  value: 'PASS' | 'FAIL' | 'HOLD';
  label: string;
}

export interface LabReferenceValues {
  actualPressure: string;
  standardParameter: string;
  acceptanceCriteria: string;
  holdingTime: string;
}

interface Props {
  testType: 'air' | 'vacuum';
  userName: string;
  equipment: Array<{
    id: number;
    name: string;
    code: string;
    calibration_state: string;
    calibration_due: string | null;
  }>;
  products: Array<{ id: number; name: string; code: string }>;
  /** Active Product Master rows with defaults + approved linked documents (§28). */
  productRefs: Array<{
    id: number;
    name: string;
    code: string;
    connector_type: string | null;
    default_test_type: string | null;
    template_name: string | null;
    sop_title: string | null;
    sop_code: string | null;
    wi_title: string | null;
    wi_code: string | null;
  }>;
  connectorTypes: readonly string[];
  resultOptions: LabResultOption[];
  reference: LabReferenceValues;
  sampleCountMin: number;
  sampleCountMax: number;
  sampleCountDefault: number;
}

interface SampleRow {
  sample_no: number;
  part_name: string;
  set_pressure: string;
  actual_pressure: string;
  volume_sec: string;
  pressure_difference: string;
  holding_time_sec: string;
  leakage_rate: string;
  result: '' | 'PASS' | 'FAIL' | 'HOLD';
}

interface Errors {
  [field: string]: string;
}

const inputCls =
  'w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500';
const inputErrorCls =
  'w-full rounded-md border border-red-400 bg-red-50/30 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500';
const labelCls = 'block text-sm font-medium text-slate-700';
const sectionCls = 'rounded-xl border border-slate-200 bg-white p-5 shadow-sm';
const sectionTitleCls = 'text-base font-semibold text-slate-900';
const refCls = 'rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700';

function emptyRow(n: number): SampleRow {
  return {
    sample_no: n,
    part_name: '',
    set_pressure: '',
    actual_pressure: '',
    volume_sec: '',
    pressure_difference: '',
    holding_time_sec: '',
    leakage_rate: '',
    result: '',
  };
}

function isRowEmpty(row: SampleRow): boolean {
  return (
    !row.part_name &&
    !row.set_pressure &&
    !row.actual_pressure &&
    !row.volume_sec &&
    !row.pressure_difference &&
    !row.holding_time_sec &&
    !row.leakage_rate &&
    !row.result
  );
}

const SAMPLE_COLUMNS: Array<{ key: keyof Omit<SampleRow, 'sample_no' | 'result'>; label: string }> = [
  { key: 'part_name', label: 'Part Name' },
  { key: 'set_pressure', label: 'Set Pressure (in./Hg)' },
  { key: 'actual_pressure', label: 'Actual Pressure' },
  { key: 'volume_sec', label: 'Volume (Sec.)' },
  { key: 'pressure_difference', label: 'Pressure Difference' },
  { key: 'holding_time_sec', label: 'Holding Time (Sec.)' },
  { key: 'leakage_rate', label: 'Leakage Rate' },
];

export default function LabTestForm({
  testType,
  userName,
  equipment,
  products,
  productRefs,
  connectorTypes,
  resultOptions,
  reference,
  sampleCountMin,
  sampleCountMax,
  sampleCountDefault,
}: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const actionRef = useRef<HTMLInputElement>(null);
  const samplesJsonRef = useRef<HTMLInputElement>(null);
  const dirtyRef = useRef(false);

  const [formAction, setFormAction] = useState<'draft' | 'continue' | 'submit'>('draft');
  const [sampleCount, setSampleCount] = useState<number>(sampleCountDefault);
  const [samples, setSamples] = useState<SampleRow[]>(() =>
    Array.from({ length: sampleCountDefault }, (_, i) => emptyRow(i + 1)),
  );
  const [errors, setErrors] = useState<Errors>({});
  const [dirty, setDirty] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [productDescription, setProductDescription] = useState('');
  // Set once the tester deliberately changes Connector Type — after that the
  // product default never touches it again ("populate, never overwrite", §28).
  const connectorTouchedRef = useRef(false);

  const matchedRef = productRefs.find(
    (p) => productDescription.trim() !== '' && p.name.trim().toLowerCase() === productDescription.trim().toLowerCase(),
  );

  // Prefill Connector Type from the Product Master ONLY while untouched/empty.
  useEffect(() => {
    if (!matchedRef || connectorTouchedRef.current) return;
    const select = formRef.current?.elements.namedItem('connector_type') as HTMLSelectElement | null;
    if (select && select.value === '' && matchedRef.connector_type) {
      select.value = matchedRef.connector_type;
      // Display-only prefill — not a measured value, but still mark the form
      // dirty so the tester knows the sheet changed.
      markDirty();
    }
  }, [matchedRef]);

  const markDirty = () => {
    dirtyRef.current = true;
    setDirty(true);
  };

  // Unsaved-change detection: warn before leaving with unsaved edits. The
  // prompt is suppressed right before a deliberate form submission.
  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => {
      if (!dirtyRef.current) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, []);

  function updateSampleField(index: number, field: keyof SampleRow, value: string) {
    setSamples((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
    markDirty();
  }

  function handleSampleCountChange(raw: string) {
    const next = Number(raw);
    if (!Number.isInteger(next)) return;
    const clamped = Math.min(Math.max(next, sampleCountMin), sampleCountMax);
    if (clamped === sampleCount) return;
    if (clamped < sampleCount) {
      const losing = samples.slice(clamped);
      if (losing.some((row) => !isRowEmpty(row))) {
        const keep = window.confirm(
          `Lowering No. of Samples Tested to ${clamped} removes rows ${clamped + 1}–${sampleCount} with their entered values. Continue?`,
        );
        if (!keep) return;
      }
    }
    setSampleCount(clamped);
    setSamples((prev) =>
      Array.from({ length: clamped }, (_, i) => prev[i] ?? emptyRow(i + 1)),
    );
    markDirty();
  }

  function validateSubmit(): Errors {
    const next: Errors = {};
    const need = (value: string, label: string) => {
      if (value.trim() === '') next[label] = `${label} is required.`;
    };
    const text = (name: string) =>
      (formRef.current?.elements.namedItem(name) as HTMLInputElement | HTMLSelectElement | null)?.value ?? '';
    need(text('product_description'), 'Product Description');
    need(text('connector_type'), 'Connector Type');
    need(text('lot_number'), 'Lot Number');
    need(text('sampling_area'), 'Sampling Area');
    need(text('equipment_id'), 'Machine Name');
    if (text('final_result') === '') next['Final Result'] = 'Final Result is required.';

    const incomplete: string[] = [];
    for (const row of samples) {
      if (!row.result) incomplete.push(String(row.sample_no));
    }
    if (samples.length !== sampleCount) {
      next['Samples'] = `The number of sample rows (${samples.length}) must match No. of Samples Tested (${sampleCount}).`;
    } else if (incomplete.length > 0) {
      next['Samples'] = `Every sample needs a Result — missing: ${incomplete.join(', ')}.`;
    }
    return next;
  }

  function submit(action: 'draft' | 'continue' | 'submit') {
    if (submitting) return;
    if (action === 'submit') {
      const next = validateSubmit();
      setErrors(next);
      const first = Object.keys(next)[0];
      if (first) {
        const el = formRef.current?.querySelector(`[data-field="${first}"]`) as HTMLElement | null;
        el?.focus();
        return;
      }
    } else {
      setErrors({});
    }
    setSubmitting(true);
    dirtyRef.current = false;
    setDirty(false);
    if (actionRef.current) actionRef.current.value = action;
    if (samplesJsonRef.current) {
      samplesJsonRef.current.value = JSON.stringify(
        samples.slice(0, sampleCount).map((row) => ({ ...row, sample_no: row.sample_no })),
      );
    }
    // Keep the sample grid in sync with the count for the server (rows are
    // derived from sample_count — the server also re-checks the match).
    formRef.current?.submit();
  }

  const equipmentOptionLabel = (e: Props['equipment'][number]) => `${e.name} (${e.code})`;
  const calibrationLabel: Record<string, string> = {
    COMPLIANT: 'Calibration: COMPLIANT',
    DUE_SOON: 'Calibration: DUE SOON',
    DUE_TODAY: 'Calibration: DUE TODAY',
    OVERDUE: 'Calibration: OVERDUE',
    UNKNOWN: 'Calibration: UNKNOWN',
  };

  return (
    <form ref={formRef} action={`/lab/tests/new?type=${testType}`} method="POST" noValidate>
      <input ref={actionRef} type="hidden" name="form_action" value={formAction} />
      <input ref={samplesJsonRef} type="hidden" name="samples_json" value="" />

      {dirty && (
        <p role="status" className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700">
          Unsaved changes — save before leaving this page.
        </p>
      )}

      {Object.keys(errors).length > 0 && (
        <div role="alert" className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm font-semibold text-red-700">The test could not be submitted:</p>
          <ul className="mt-1 list-inside list-disc text-sm text-red-700">
            {Object.values(errors).map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="space-y-6">
        {/* ── Section 1 — Sample Identification ── */}
        <section aria-labelledby="sec-sample-identification" className={sectionCls}>
          <h2 id="sec-sample-identification" className={sectionTitleCls}>Section 1 — Sample Identification</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="product_description" className={labelCls}>Product Description</label>
              <input
                id="product_description"
                name="product_description"
                type="text"
                required
                list="lab-product-options"
                maxLength={200}
                data-field="Product Description"
                aria-invalid={errors['Product Description'] ? 'true' : undefined}
                value={productDescription}
                onChange={(e) => {
                  setProductDescription(e.target.value);
                  markDirty();
                }}
                className={errors['Product Description'] ? inputErrorCls : inputCls}
              />
              <datalist id="lab-product-options">
                {products.map((p) => (
                  <option key={p.id} value={p.name} label={`${p.name} (${p.code})`} />
                ))}
              </datalist>
              <p className="mt-1 text-xs text-slate-500">Start typing to pick from the Product Master.</p>
            </div>
            {/* Product Master suggestions (§28): populated when the typed
                description matches an active product; every measured value
                below stays editable and is never silently overwritten. */}
            {matchedRef && (
              <div className="sm:col-span-2 rounded-md border border-brand-200 bg-brand-50 px-4 py-3" data-testid="product-reference-panel">
                <p className="text-sm font-semibold text-brand-800">
                  Product Master — {matchedRef.name} ({matchedRef.code})
                </p>
                <dl className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Connector Type (default)</dt>
                    <dd className="text-slate-800">{matchedRef.connector_type ?? '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Default Test Type</dt>
                    <dd className="uppercase text-slate-800">{matchedRef.default_test_type ?? '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Test Template</dt>
                    <dd className="text-slate-800">{matchedRef.template_name ?? '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Applicable SOP</dt>
                    <dd className="text-slate-800">{matchedRef.sop_title ? `${matchedRef.sop_code} — ${matchedRef.sop_title}` : '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Applicable WI</dt>
                    <dd className="text-slate-800">{matchedRef.wi_title ? `${matchedRef.wi_code} — ${matchedRef.wi_title}` : '—'}</dd>
                  </div>
                </dl>
                <p className="mt-2 text-xs text-slate-600">
                  Suggestions from the approved Product Master. All entries on this form remain editable — nothing you
                  typed is overwritten.
                </p>
              </div>
            )}
            <div className="sm:col-span-2">
              <label htmlFor="connector_type" className={labelCls}>Connector Type</label>
              <select
                id="connector_type"
                name="connector_type"
                required
                data-field="Connector Type"
                aria-invalid={errors['Connector Type'] ? 'true' : undefined}
                onChange={markDirty}
                className={errors['Connector Type'] ? inputErrorCls : inputCls}
              >
                <option value="">Select connector type</option>
                {connectorTypes.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="sample_count" className={labelCls}>No. of Samples Tested</label>
              <input
                id="sample_count"
                name="sample_count"
                type="number"
                min={sampleCountMin}
                max={sampleCountMax}
                value={sampleCount}
                onChange={(e) => handleSampleCountChange(e.target.value)}
                className={inputCls}
              />
              <p className="mt-1 text-xs text-slate-500">Controls the sample table below ({sampleCountMin}–{sampleCountMax}).</p>
            </div>
            <div>
              <label htmlFor="lot_number" className={labelCls}>Lot Number</label>
              <input
                id="lot_number"
                name="lot_number"
                type="text"
                required
                maxLength={200}
                data-field="Lot Number"
                aria-invalid={errors['Lot Number'] ? 'true' : undefined}
                onChange={markDirty}
                className={errors['Lot Number'] ? inputErrorCls : inputCls}
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="sampling_area" className={labelCls}>Sampling Area</label>
              <input
                id="sampling_area"
                name="sampling_area"
                type="text"
                required
                maxLength={200}
                data-field="Sampling Area"
                aria-invalid={errors['Sampling Area'] ? 'true' : undefined}
                onChange={markDirty}
                className={errors['Sampling Area'] ? inputErrorCls : inputCls}
              />
            </div>
          </div>
        </section>

        {/* ── Section 2 — Equipment Used ── */}
        <section aria-labelledby="sec-equipment" className={sectionCls}>
          <h2 id="sec-equipment" className={sectionTitleCls}>Section 2 — Equipment Used</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="equipment_id" className={labelCls}>Machine Name</label>
              <select
                id="equipment_id"
                name="equipment_id"
                required
                data-field="Machine Name"
                aria-invalid={errors['Machine Name'] ? 'true' : undefined}
                onChange={markDirty}
                className={errors['Machine Name'] ? inputErrorCls : inputCls}
              >
                <option value="">Select machine</option>
                {equipment.map((e) => (
                  <option key={e.id} value={e.id}>{equipmentOptionLabel(e)}</option>
                ))}
              </select>
              {equipment.length === 0 && (
                <p className="mt-1 text-xs text-amber-700">No equipment registered yet — tests can be saved as drafts, but submission needs a machine from the equipment registry.</p>
              )}
              {errors['Machine Name'] && (
                <p className="mt-1 text-xs text-red-700">{errors['Machine Name']}</p>
              )}
            </div>
            <div>
              <label htmlFor="medium_used" className={labelCls}>Medium Used</label>
              <input id="medium_used" name="medium_used" type="text" maxLength={200} onChange={markDirty} className={inputCls} />
            </div>
            <div className="sm:col-span-2">
              {equipment.length > 0 && (
                <ul className="space-y-1 text-sm">
                  {equipment.map((e) => (
                    <li key={e.id} className={refCls}>
                      <span className="font-medium">{e.name}</span>
                      <span className="ms-2 text-slate-500">{e.code}</span>
                      <span className={`ms-3 font-medium ${e.calibration_state === 'OVERDUE' ? 'text-rose-700' : 'text-slate-600'}`}>
                        {calibrationLabel[e.calibration_state] ?? 'Calibration: UNKNOWN'}
                      </span>
                      {e.calibration_state === 'OVERDUE' && (
                        <span className="ms-2 text-rose-700">⚠ Review equipment status before proceeding.</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>

        {/* ── Section 3 — Connector Assembly ── */}
        <section aria-labelledby="sec-connector-assembly" className={sectionCls}>
          <h2 id="sec-connector-assembly" className={sectionTitleCls}>Section 3 — Connector Assembly</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label htmlFor="actual_pressure" className={labelCls}>Actual Pressure</label>
              <input id="actual_pressure" name="actual_pressure" type="text" maxLength={50} onChange={markDirty} className={inputCls} />
              <p className="mt-1 text-xs text-slate-500">Reference: <span dir="ltr" className="font-medium">{reference.actualPressure}</span></p>
            </div>
            <div>
              <label htmlFor="torque_in_lb" className={labelCls}>Torque (in.lb)</label>
              <input id="torque_in_lb" name="torque_in_lb" type="text" inputMode="decimal" maxLength={50} onChange={markDirty} className={inputCls} />
            </div>
            <div>
              <label htmlFor="time_sec" className={labelCls}>Time (Sec.)</label>
              <input id="time_sec" name="time_sec" type="text" inputMode="decimal" maxLength={50} onChange={markDirty} className={inputCls} />
            </div>
            <div>
              <label htmlFor="angle" className={labelCls}>Angle</label>
              <input id="angle" name="angle" type="text" maxLength={200} onChange={markDirty} className={inputCls} />
            </div>
          </div>
        </section>

        {/* ── Section 4 — Differential Conversion ── */}
        <section aria-labelledby="sec-differential" className={sectionCls}>
          <h2 id="sec-differential" className={sectionTitleCls}>Section 4 — Differential Conversion</h2>
          <div className="mt-4 max-w-sm">
            <label htmlFor="temperature_measured" className={labelCls}>Temperature (Measured)</label>
            <input id="temperature_measured" name="temperature_measured" type="text" maxLength={50} onChange={markDirty} className={inputCls} />
            <p className="mt-1 text-xs text-slate-500">Measured value only — no conversion is applied.</p>
          </div>
        </section>

        {/* ── Section 5 — Test Parameters (reference display only) ── */}
        <section aria-labelledby="sec-parameters" className={sectionCls}>
          <h2 id="sec-parameters" className={sectionTitleCls}>Section 5 — Test Parameters</h2>
          <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-500">Controlled reference values — recorded for traceability, not validated against measurements.</p>
          <dl className="mt-3 grid gap-3 sm:grid-cols-3">
            <div className={refCls}>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Standard Parameter</dt>
              <dd className="mt-1 text-sm font-medium text-slate-900" dir="ltr">{reference.standardParameter}</dd>
            </div>
            <div className={refCls}>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Acceptance Criteria</dt>
              <dd className="mt-1 text-sm font-medium text-slate-900" dir="ltr">{reference.acceptanceCriteria}</dd>
            </div>
            <div className={refCls}>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Holding Time</dt>
              <dd className="mt-1 text-sm font-medium text-slate-900" dir="ltr">{reference.holdingTime}</dd>
            </div>
          </dl>
        </section>

        {/* ── Section 6 — Test Results ── */}
        <section aria-labelledby="sec-results" className={sectionCls}>
          <h2 id="sec-results" className={sectionTitleCls}>Section 6 — Test Results</h2>
          <div className="mt-4 overflow-x-auto contain-layout contain-paint">
            <table className="min-w-[1080px] w-full border-collapse text-sm" aria-describedby="results-caption">
              <caption id="results-caption" className="sr-only">
                Sample results — one row per sample. Each measurement is entered by the tester; the Result is a human decision.
              </caption>
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th scope="col" className="px-3 py-2 font-semibold">Sample No.</th>
                  {SAMPLE_COLUMNS.map((col) => (
                    <th key={col.key} scope="col" className="px-3 py-2 font-semibold">{col.label}</th>
                  ))}
                  <th scope="col" className="px-3 py-2 font-semibold">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {samples.map((row, index) => (
                  <tr key={row.sample_no}>
                    <td className="px-3 py-2 font-medium text-slate-900" aria-label={`Sample ${row.sample_no}`}>{row.sample_no}</td>
                    {SAMPLE_COLUMNS.map((col) => (
                      <td key={col.key} className="px-3 py-2">
                        <label className="sr-only" htmlFor={`sample_${row.sample_no}_${col.key}`}>
                          Sample {row.sample_no} — {col.label}
                        </label>
                        <input
                          id={`sample_${row.sample_no}_${col.key}`}
                          type="text"
                          maxLength={col.key === 'part_name' ? 200 : 50}
                          value={row[col.key]}
                          onChange={(e) => updateSampleField(index, col.key, e.target.value)}
                          className="w-full min-w-24 rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                        />
                      </td>
                    ))}
                    <td className="px-3 py-2">
                      <label className="sr-only" htmlFor={`sample_${row.sample_no}_result`}>
                        Sample {row.sample_no} — Result
                      </label>
                      <select
                        id={`sample_${row.sample_no}_result`}
                        value={row.result}
                        onChange={(e) => updateSampleField(index, 'result', e.target.value)}
                        className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                      >
                        <option value="">Select result</option>
                        {resultOptions.map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {errors['Samples'] && (
            <p role="alert" className="mt-2 text-sm text-red-700">{errors['Samples']}</p>
          )}
          <div className="mt-4">
            <label htmlFor="remarks" className={labelCls}>Any Remarks</label>
            <textarea
              id="remarks"
              name="remarks"
              rows={3}
              maxLength={5000}
              onChange={markDirty}
              className={`mt-1 ${inputCls}`}
            ></textarea>
          </div>
        </section>

        {/* ── Section 7 — Authorization (system-controlled identities) ── */}
        <section aria-labelledby="sec-authorization" className={sectionCls}>
          <h2 id="sec-authorization" className={sectionTitleCls}>Section 7 — Authorization</h2>
          <dl className="mt-4 grid gap-4 sm:grid-cols-3">
            <div className={refCls}>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Tested By</dt>
              <dd className="mt-1 text-sm font-medium text-slate-900">{userName}</dd>
            </div>
            <div className={refCls}>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Reviewed By</dt>
              <dd className="mt-1 text-sm text-slate-500">— assigned during review</dd>
            </div>
            <div className={refCls}>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Approved By: Q.C.M.</dt>
              <dd className="mt-1 text-sm text-slate-500">— assigned during approval</dd>
            </div>
          </dl>
        </section>

        {/* ── Section 8 — Final Result (human decision only) ── */}
        <section aria-labelledby="sec-final-result" className={sectionCls}>
          <h2 id="sec-final-result" className={sectionTitleCls}>Section 8 — Final Result</h2>
          <fieldset className="mt-4" data-field="Final Result" aria-invalid={errors['Final Result'] ? 'true' : undefined}>
            <legend className="text-sm font-medium text-slate-700">
              Final Result <span aria-hidden="true">(required to submit)</span>
            </legend>
            <div className="mt-2 flex flex-wrap gap-4">
              {resultOptions.map((o) => (
                <label key={o.value} className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="radio"
                    name="final_result"
                    value={o.value}
                    onChange={markDirty}
                    className="h-4 w-4 border-slate-300 text-brand-600 focus:ring-brand-500"
                  />
                  {o.label}
                </label>
              ))}
            </div>
            {errors['Final Result'] && (
              <p role="alert" className="mt-1 text-sm text-red-700">{errors['Final Result']}</p>
            )}
          </fieldset>
        </section>

        {/* ── Actions ── */}
        <div className="flex flex-wrap items-center justify-end gap-3">
          <a
            href="/lab"
            className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
          >
            Cancel
          </a>
          <button
            type="button"
            onClick={() => submit('draft')}
            disabled={submitting}
            className="rounded-lg border border-brand-200 bg-white px-4 py-2.5 text-sm font-semibold text-brand-700 shadow-sm hover:bg-brand-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:opacity-60"
          >
            Save Draft
          </button>
          <button
            type="button"
            onClick={() => submit('continue')}
            disabled={submitting}
            className="rounded-lg border border-brand-300 bg-brand-50 px-4 py-2.5 text-sm font-semibold text-brand-700 shadow-sm hover:bg-brand-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:opacity-60"
          >
            Save and Continue
          </button>
          <button
            type="button"
            onClick={() => submit('submit')}
            disabled={submitting}
            className="rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:opacity-60"
          >
            {submitting ? 'Submitting…' : 'Submit'}
          </button>
        </div>
      </div>
    </form>
  );
}