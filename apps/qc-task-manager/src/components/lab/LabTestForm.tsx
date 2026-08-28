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

import { useEffect, useRef, useState, type ClipboardEvent, type KeyboardEvent } from 'react';
import { resolveApprovedReferencePanel } from '../../lib/lab/reference-panel';

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

/** Edit-mode prefill (PROMPT 43-B) — a DRAFT test loaded server-side. */
export interface LabTestInitialValues {
  product_description: string;
  connector_type: string | null;
  sample_count: number;
  lot_number: string | null;
  sampling_area: string | null;
  equipment_id: number | null;
  medium_used: string | null;
  actual_pressure: string | null;
  actual_force: string | null;
  torque_in_lb: string | null;
  torque_value: string | null;
  time_sec: string | null;
  angle: string | null;
  temperature_measured: string | null;
  testing_date: string | null;
  humidity_measured: string | null;
  remarks: string | null;
  final_result: string | null;
  template_version_id: number | null;
  samples: Array<Omit<SampleRow, 'sample_no'> & { sample_no: number }>;
  /** Supplementary session environment readings (PROMPT 51). */
  environmentReadings: Array<{ reading_at: string; temperature: string; humidity: string; notes: string }>;
}

interface Props {
  testType: 'air' | 'vacuum';
  userName: string;
  /** When set, the form is in edit mode: it POSTs to /lab/tests/[testId]/edit and prefills the stored DRAFT. */
  testId?: number;
  testNumber?: string;
  initial?: LabTestInitialValues;
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
  /** ACTIVE templates with their approved current version (§29-§30, PROMPT 10). */
  templateRefs: Array<{
    version_id: number;
    name: string;
    code: string;
    test_type: 'air' | 'vacuum';
    version: number;
    default_sample_count: number | null;
    connector_choices_json: string | null;
    parameters_json: string;
    sop_title: string | null;
    sop_code: string | null;
    sop_version: number | null;
    sop_status: string | null;
    wi_title: string | null;
    wi_code: string | null;
    wi_version: number | null;
    wi_status: string | null;
    effective_date: string | null;
    requires_approved_template_for_submission: number;
  }>;
  sampleResultOptions: LabResultOption[];
  finalResultOptions: LabResultOption[];
  reference: LabReferenceValues;
  sampleCountMin: number;
  sampleCountMax: number;
  sampleCountDefault: number;
  /** Bound on the supplementary environment readings list (PROMPT 51). */
  envReadingsMax: number;
}

interface SampleRow {
  sample_no: number;
  part_name: string;
  set_pressure: string;
  actual_pressure: string;
  applied_pressure: string;
  volume_sec: string;
  volume_liter: string;
  pressure_difference: string;
  holding_time_sec: string;
  leakage_rate: string;
  result: '' | 'PASS' | 'FAIL' | 'HOLD';
}

/** One session environment reading row (PROMPT 51) — all cells free text. */
interface ReadingRow {
  reading_at: string;
  temperature: string;
  humidity: string;
  notes: string;
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
    applied_pressure: '',
    volume_sec: '',
    volume_liter: '',
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
    !row.applied_pressure &&
    !row.volume_sec &&
    !row.volume_liter &&
    !row.pressure_difference &&
    !row.holding_time_sec &&
    !row.leakage_rate &&
    !row.result
  );
}

function isReadingEmpty(row: ReadingRow): boolean {
  return !row.reading_at.trim() && !row.temperature.trim() && !row.humidity.trim() && !row.notes.trim();
}

const SAMPLE_COLUMNS: Array<{ key: keyof Omit<SampleRow, 'sample_no' | 'result'>; label: string }> = [
  { key: 'part_name', label: 'Part Name' },
  { key: 'set_pressure', label: 'Set pressure (kpa)' },
  { key: 'applied_pressure', label: 'Applied Pressure (kpa)' },
  { key: 'volume_liter', label: 'Volume (liter)' },
  { key: 'pressure_difference', label: 'Pressure Difference' },
  { key: 'holding_time_sec', label: 'Holding Time (Sec.)' },
  { key: 'leakage_rate', label: 'Leakage Rate' },
];

export default function LabTestForm({
  testType,
  userName,
  testId,
  testNumber,
  initial,
  equipment,
  products,
  productRefs,
  connectorTypes,
  templateRefs,
  sampleResultOptions,
  finalResultOptions,
  reference,
  sampleCountMin,
  sampleCountMax,
  sampleCountDefault,
  envReadingsMax,
}: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const actionRef = useRef<HTMLInputElement>(null);
  const samplesJsonRef = useRef<HTMLInputElement>(null);
  const readingsJsonRef = useRef<HTMLInputElement>(null);
  const dirtyRef = useRef(false);

  const [formAction, setFormAction] = useState<'draft' | 'continue' | 'submit'>('draft');
  const [sampleCount, setSampleCount] = useState<number>(sampleCountDefault);
  const [samples, setSamples] = useState<SampleRow[]>(() =>
    Array.from({ length: sampleCountDefault }, (_, i) => emptyRow(i + 1)),
  );
  // Session environment readings (PROMPT 51): supplementary log, draft-stage
  // only. The headline temperature_measured field stays untouched.
  const [readings, setReadings] = useState<ReadingRow[]>(
    () => initial?.environmentReadings?.map((r) => ({ ...r })) ?? [],
  );
  const [errors, setErrors] = useState<Errors>({});
  const [dirty, setDirty] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [productDescription, setProductDescription] = useState('');
  // Set once the tester deliberately changes Connector Type — after that the
  // product default never touches it again ("populate, never overwrite", §28).
  const connectorTouchedRef = useRef(false);
  // Same rule for No. of Samples Tested: template defaults prefill an
  // untouched field only and never replace a tester-entered count.
  const sampleCountTouchedRef = useRef(false);
  const [templateVersionId, setTemplateVersionId] = useState<number | null>(initial?.template_version_id ?? null);
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [pasteUndo, setPasteUndo] = useState<SampleRow[] | null>(null);

  // Edit-mode prefill (PROMPT 43-B): load the stored DRAFT's values into the
  // uncontrolled inputs and the sample grid once, on mount. The loaded values
  // are NOT "unsaved changes" — the existing dirty tracking starts clean and
  // fires only after the tester edits something (reused, not rebuilt).
  useEffect(() => {
    if (!initial) return;
    const el = formRef.current;
    if (!el) return;
    const setVal = (name: string, value: string | number | null | undefined) => {
      if (value === null || value === undefined || value === '') return;
      const input = el.elements.namedItem(name) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null;
      if (input) input.value = String(value);
    };
    setVal('connector_type', initial.connector_type);
    setVal('lot_number', initial.lot_number);
    setVal('sampling_area', initial.sampling_area);
    setVal('equipment_id', initial.equipment_id);
    setVal('medium_used', initial.medium_used);
    setVal('actual_pressure', initial.actual_pressure);
    setVal('actual_force', initial.actual_force);
    setVal('torque_in_lb', initial.torque_in_lb);
    setVal('torque_value', initial.torque_value);
    setVal('time_sec', initial.time_sec);
    setVal('angle', initial.angle);
    setVal('temperature_measured', initial.temperature_measured);
    setVal('testing_date', initial.testing_date);
    setVal('humidity_measured', initial.humidity_measured);
    setVal('remarks', initial.remarks);
    if (initial.final_result) {
      const radio = el.querySelector(`input[name="final_result"][value="${initial.final_result}"]`) as HTMLInputElement | null;
      if (radio) radio.checked = true;
    }
    setProductDescription(initial.product_description ?? '');
    setSampleCount(initial.sample_count);
    setSamples(initial.samples.map((s) => ({ ...s, result: s.result ?? '' })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const matchingTemplates = templateRefs.filter((t) => t.test_type === testType);
  const selectedTemplate = matchingTemplates.find((t) => t.version_id === templateVersionId) ?? null;

  // Deterministic (non-AI) approved reference panel beside Sections 5/6:
  // display-only values from the version-locked approved template version —
  // never copied into measured fields, never auto-filling results, and the
  // explicit empty state when nothing approved is linked.
  const referencePanel = resolveApprovedReferencePanel(templateRefs, templateVersionId, testType);

  const selectedTemplateParameters = (() => {
    if (!selectedTemplate) return null;
    try {
      const parsed = JSON.parse(selectedTemplate.parameters_json) as Record<string, unknown>;
      return {
        standardParameter: typeof parsed.standard_parameter === 'string' ? parsed.standard_parameter : 'No approved reference available.',
        acceptanceCriteria: typeof parsed.acceptance_criteria === 'string' ? parsed.acceptance_criteria : 'No approved reference available.',
        holdingTime: typeof parsed.holding_time === 'string' ? parsed.holding_time : 'No approved reference available.',
      };
    } catch {
      return null;
    }
  })();

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

  function sampleFieldId(row: number, col: number): string {
    const key = col < SAMPLE_COLUMNS.length ? SAMPLE_COLUMNS[col].key : 'result';
    return `sample_${row + 1}_${String(key)}`;
  }

  function focusSampleCell(row: number, col: number) {
    if (row < 0 || row >= sampleCount || col < 0 || col > SAMPLE_COLUMNS.length) return;
    setSelectedCell({ row, col });
    document.getElementById(sampleFieldId(row, col))?.focus();
  }

  function handleSampleKeyDown(event: KeyboardEvent<HTMLInputElement | HTMLSelectElement>, row: number, col: number) {
    if (event.key === 'ArrowDown') { event.preventDefault(); focusSampleCell(row + 1, col); }
    if (event.key === 'ArrowUp') { event.preventDefault(); focusSampleCell(row - 1, col); }
    if (event.key === 'ArrowRight' && event.currentTarget instanceof HTMLInputElement && event.currentTarget.selectionStart === event.currentTarget.value.length) {
      event.preventDefault(); focusSampleCell(row, col + 1);
    }
    if (event.key === 'ArrowLeft' && event.currentTarget instanceof HTMLInputElement && event.currentTarget.selectionStart === 0) {
      event.preventDefault(); focusSampleCell(row, col - 1);
    }
  }

  function handleSamplePaste(event: ClipboardEvent, row: number, col: number) {
    const text = event.clipboardData.getData('text/plain');
    if (!text.includes('\t') && !text.includes('\n')) return;
    event.preventDefault();
    const matrix = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter((line) => line.length > 0).map((line) => line.split('\t'));
    if (row + matrix.length > sampleCount) {
      setErrors((prev) => ({ ...prev, Samples: `Paste would exceed No. of Samples Tested (${sampleCount}).` }));
      return;
    }
    setSamples((prev) => {
      setPasteUndo(prev.map((sample) => ({ ...sample })));
      return prev.map((target, rowIndex) => {
      const pasted = matrix[rowIndex - row];
      if (!pasted) return target;
      const next = { ...target };
      pasted.slice(0, SAMPLE_COLUMNS.length + 1).forEach((value, offset) => {
        const key = offset + col < SAMPLE_COLUMNS.length ? SAMPLE_COLUMNS[offset + col].key : offset + col === SAMPLE_COLUMNS.length ? 'result' : null;
        if (key) next[key] = value.trim() as never;
      });
      return next;
      });
    });
    markDirty();
  }

  function duplicatePreviousRow() {
    if (!selectedCell || selectedCell.row < 1) return;
    setSamples((prev) => prev.map((sample, index) => index === selectedCell.row ? {
      ...prev[selectedCell.row - 1], sample_no: sample.sample_no,
    } : sample));
    markDirty();
  }

  function undoLastPaste() {
    if (!pasteUndo) return;
    setSamples(pasteUndo);
    setPasteUndo(null);
    markDirty();
  }

  function copyDownSelected() {
    if (!selectedCell) return;
    const key = selectedCell.col < SAMPLE_COLUMNS.length ? SAMPLE_COLUMNS[selectedCell.col].key : 'result';
    const value = samples[selectedCell.row]?.[key] ?? '';
    setSamples((prev) => prev.map((sample, index) => index < selectedCell.row ? sample : { ...sample, [key]: value }));
    markDirty();
  }

  function clearSampleRow(index: number) {
    setSamples((prev) => prev.map((sample, rowIndex) => rowIndex === index ? emptyRow(index + 1) : sample));
    markDirty();
  }

  // Environment readings log (PROMPT 51): accessible dynamic list — every
  // control is a native input/button (keyboard operable), labels are explicit,
  // and the remove button carries a visible 44px touch target.
  function updateReadingField(index: number, field: keyof ReadingRow, value: string) {
    setReadings((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
    markDirty();
  }

  function addReading() {
    if (readings.length >= envReadingsMax) return;
    setReadings((prev) => [...prev, { reading_at: '', temperature: '', humidity: '', notes: '' }]);
    markDirty();
  }

  function removeReading(index: number) {
    setReadings((prev) => prev.filter((_, i) => i !== index));
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

  /**
   * Template selection (§29-§30): prefills ONLY untouched fields — sample
   * count and connector type — and never touches any measured value. The
   * selected version id rides a hidden input; the server re-validates that
   * it names the approved current version of an ACTIVE template.
   */
  function handleTemplateChange(raw: string) {
    const id = raw === '' ? null : Number(raw);
    setTemplateVersionId(id);
    const ref = matchingTemplates.find((t) => t.version_id === id) ?? null;
    if (!ref) {
      markDirty();
      return;
    }
    if (!sampleCountTouchedRef.current && ref.default_sample_count !== null) {
      const clamped = Math.min(Math.max(ref.default_sample_count, sampleCountMin), sampleCountMax);
      if (clamped !== sampleCount) {
        setSampleCount(clamped);
        setSamples((prev) =>
          Array.from({ length: clamped }, (_, i) => prev[i] ?? emptyRow(i + 1)),
        );
      }
    }
    if (!connectorTouchedRef.current) {
      const select = formRef.current?.elements.namedItem('connector_type') as HTMLSelectElement | null;
      const choices = (() => {
        if (!ref.connector_choices_json) return [] as string[];
        try {
          const parsed = JSON.parse(ref.connector_choices_json) as unknown;
          return Array.isArray(parsed) ? parsed.filter((c): c is string => typeof c === 'string') : [];
        } catch {
          return [];
        }
      })();
      if (select && select.value === '' && choices.length === 1) {
        select.value = choices[0];
      }
    }
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
    setFormAction(action);
    dirtyRef.current = false;
    setDirty(false);
    if (actionRef.current) actionRef.current.value = action;
    if (samplesJsonRef.current) {
      samplesJsonRef.current.value = JSON.stringify(
        samples.slice(0, sampleCount).map((row) => ({ ...row, sample_no: row.sample_no })),
      );
    }
    if (readingsJsonRef.current) {
      // Fully-empty rows are dropped; partially-filled rows are sent so the
      // server's completeness rule can flag them.
      readingsJsonRef.current.value = JSON.stringify(readings.filter((r) => !isReadingEmpty(r)));
    }
    // Keep the sample grid in sync with the count for the server (rows are
    // derived from sample_count — the server also re-checks the match).
    formRef.current?.submit();
  }

  function focusErrorField(field: string) {
    const targetId = field === 'Samples' ? 'sec-results' : field === 'Final Result' ? 'sec-final-result' : field === 'Product Description' ? 'product_description' : field === 'Connector Type' ? 'connector_type' : field === 'Lot Number' ? 'lot_number' : field === 'Sampling Area' ? 'sampling_area' : field === 'Machine Name' ? 'equipment_id' : 'sec-sample-identification';
    const target = document.getElementById(targetId);
    target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    if (target instanceof HTMLInputElement || target instanceof HTMLSelectElement || target instanceof HTMLTextAreaElement) target.focus();
  }

  const equipmentOptionLabel = (e: Props['equipment'][number]) => `${e.name} (${e.code})`;
  const calibrationLabel: Record<string, string> = {
    COMPLIANT: 'Calibration: COMPLIANT',
    DUE_SOON: 'Calibration: DUE SOON',
    DUE_TODAY: 'Calibration: DUE TODAY',
    OVERDUE: 'Calibration: OVERDUE',
    NOT_COMPLIANT: 'Calibration: NOT COMPLIANT',
    UNKNOWN: 'Calibration: UNKNOWN',
  };

  return (
    <form ref={formRef} action={testId ? `/lab/tests/${testId}/edit` : `/lab/tests/new?type=${testType}`} method="POST" noValidate>
      <input ref={actionRef} type="hidden" name="form_action" value={formAction} />
      <input ref={samplesJsonRef} type="hidden" name="samples_json" value="" />
      <input ref={readingsJsonRef} type="hidden" name="environment_readings_json" value="" />
      <input type="hidden" name="template_version_id" value={templateVersionId ?? ''} />
      {initial?.actual_pressure && <input type="hidden" name="actual_pressure" value={initial.actual_pressure} />}
      {initial?.torque_in_lb && <input type="hidden" name="torque_in_lb" value={initial.torque_in_lb} />}

      {testNumber && (
        <p className="mb-4 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-800">
          Editing draft {testNumber} — every change is audited; Submit sends it for review.
        </p>
      )}

      {dirty && (
        <p role="status" className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700">
          Unsaved changes — save before leaving this page.
        </p>
      )}

      <nav aria-label="Form sections" className="sticky top-0 z-10 mb-4 rounded-lg border border-slate-200 bg-white/95 p-3 shadow-sm backdrop-blur">
        <ol className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4 lg:grid-cols-8">
          {[
            ['1 Sample Identification', 'sec-sample-identification', Boolean(productDescription && samples.length === sampleCount)],
            ['2 Equipment', 'sec-equipment', Boolean((formRef.current?.elements.namedItem('equipment_id') as HTMLSelectElement | null)?.value)],
            ['3 Requirements', 'sec-parameters', Boolean(selectedTemplate || reference.standardParameter !== 'No approved reference available.')],
            ['4 Connector Assembly', 'sec-connector-assembly', true],
            ['5 Environment', 'sec-differential', true],
            ['6 Samples', 'sec-results', samples.every((row) => Boolean(row.result))],
            ['7 Final Result', 'sec-final-result', Boolean(formRef.current?.querySelector('input[name="final_result"]:checked'))],
            ['8 Review', 'sec-authorization', true],
          ].map(([label, id, complete]) => (
            <li key={id as string}>
              <a href={`#${id}`} className="block rounded-md px-2 py-2 font-medium text-slate-700 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-600">
                <span aria-hidden="true">{complete ? '✓' : '○'}</span> {label as string}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      {initial && (initial.actual_pressure || initial.torque_in_lb || initial.samples.some((row) => row.actual_pressure || row.volume_sec)) && (
        <details className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <summary className="cursor-pointer font-semibold text-amber-900">Legacy Recorded Data</summary>
          <p className="mt-2 text-sm text-amber-800">Historical values are read-only and preserved exactly as recorded.</p>
          <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
            {initial.actual_pressure && <div><dt className="font-medium text-slate-600">Actual Pressure (legacy)</dt><dd dir="ltr">{initial.actual_pressure}</dd></div>}
            {initial.torque_in_lb && <div><dt className="font-medium text-slate-600">Torque (in.lb) (legacy)</dt><dd dir="ltr">{initial.torque_in_lb}</dd></div>}
            {initial.samples.some((row) => row.actual_pressure || row.volume_sec) && <div className="sm:col-span-2"><dt className="font-medium text-slate-600">Sample legacy values</dt><dd>Stored per sample row and preserved on save.</dd></div>}
          </dl>
        </details>
      )}

      {Object.keys(errors).length > 0 && (
        <div role="alert" className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm font-semibold text-red-700">The test could not be submitted:</p>
          <ul className="mt-1 list-inside list-disc text-sm text-red-700">
            {Object.entries(errors).map(([field, message]) => (
              <li key={field}><a className="underline" href={`#${field === 'Samples' ? 'sec-results' : field === 'Final Result' ? 'sec-final-result' : field === 'Product Description' ? 'product_description' : field === 'Connector Type' ? 'connector_type' : field === 'Lot Number' ? 'lot_number' : field === 'Sampling Area' ? 'sampling_area' : field === 'Machine Name' ? 'equipment_id' : 'sec-sample-identification'}`} onClick={(event) => { event.preventDefault(); focusErrorField(field); }}>{message}</a></li>
            ))}
          </ul>
        </div>
      )}

      <div className="space-y-6">
        {/* ── Section 1 — Sample Identification ── */}
        <section aria-labelledby="sec-sample-identification" className={sectionCls}>
          <h2 id="sec-sample-identification" className={sectionTitleCls}>Section 1 — Sample Identification</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {matchingTemplates.length > 0 && (
              <div className="sm:col-span-2">
                <label htmlFor="template_version_id" className={labelCls}>Test Template</label>
                <select
                  id="template_version_id"
                  onChange={(e) => handleTemplateChange(e.target.value)}
                  className={inputCls}
                >
                  <option value="">No template — manual entry</option>
                  {matchingTemplates.map((t) => (
                    <option key={t.version_id} value={t.version_id}>
                      {t.name} ({t.code}) — v{t.version}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-slate-500">
                  Prefills untouched defaults only — every entry on this form stays editable and is never overwritten.
                </p>
              </div>
            )}
            {/* Template reference panel (§29-§30): display-only. The template
                version id is stored on the test record; measured values are
                never taken from the template. */}
            {selectedTemplate && (
              <div className="sm:col-span-2 rounded-md border border-blue-200 bg-blue-50 px-4 py-3" data-testid="template-reference-panel">
                <p className="text-sm font-semibold text-blue-800">
                  Template — {selectedTemplate.name} ({selectedTemplate.code}) — v{selectedTemplate.version}
                </p>
                <dl className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Default Samples</dt>
                    <dd className="text-slate-800">{selectedTemplate.default_sample_count ?? '—'}</dd>
                  </div>
                  {selectedTemplateParameters && (
                    <>
                      <div>
                        <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Standard Parameter</dt>
                        <dd className="text-slate-800" dir="ltr">{selectedTemplateParameters.standardParameter}</dd>
                      </div>
                      <div>
                        <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Acceptance Criteria</dt>
                        <dd className="text-slate-800" dir="ltr">{selectedTemplateParameters.acceptanceCriteria}</dd>
                      </div>
                      <div>
                        <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Holding Time</dt>
                        <dd className="text-slate-800" dir="ltr">{selectedTemplateParameters.holdingTime}</dd>
                      </div>
                    </>
                  )}
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Applicable SOP</dt>
                    <dd className="text-slate-800">{selectedTemplate.sop_title ? `${selectedTemplate.sop_code} — ${selectedTemplate.sop_title}` : '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Applicable WI</dt>
                    <dd className="text-slate-800">{selectedTemplate.wi_title ? `${selectedTemplate.wi_code} — ${selectedTemplate.wi_title}` : '—'}</dd>
                  </div>
                </dl>
                <p className="mt-2 text-xs text-slate-600">
                  Reference values from the approved template version — recorded with the test, never validated against measurements.
                </p>
              </div>
            )}
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
                onChange={(e) => {
                  sampleCountTouchedRef.current = true;
                  handleSampleCountChange(e.target.value);
                }}
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
              <label htmlFor="sampling_area" className={labelCls}>Testing Area</label>
              <input
                id="sampling_area"
                name="sampling_area"
                type="text"
                required
                maxLength={200}
                data-field="Sampling Area"
                aria-invalid={errors['Sampling Area'] ? 'true' : undefined}
                aria-describedby={errors['Sampling Area'] ? 'error-sampling-area' : undefined}
                onChange={markDirty}
                className={errors['Sampling Area'] ? inputErrorCls : inputCls}
              />
              {errors['Sampling Area'] && <p id="error-sampling-area" className="mt-1 text-sm text-red-700">{errors['Sampling Area']}</p>}
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
              <label htmlFor="actual_force" className={labelCls}>Actual Force</label>
              <input id="actual_force" name="actual_force" type="text" maxLength={50} onChange={markDirty} className={inputCls} />
              <p className="mt-1 text-xs text-slate-500">Reference: <span dir="ltr" className="font-medium">{reference.actualPressure}</span></p>
            </div>
            <div>
              <label htmlFor="torque_value" className={labelCls}>Torque (N.m)</label>
              <input id="torque_value" name="torque_value" type="text" inputMode="decimal" maxLength={50} onChange={markDirty} className={inputCls} />
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
            <label htmlFor="testing_date" className={labelCls}>Testing Date</label>
            <input id="testing_date" name="testing_date" type="text" maxLength={50} onChange={markDirty} className={inputCls} />
            <p className="mt-1 text-xs text-slate-500">Stored as entered; no date normalization is applied.</p>
          </div>
          <div className="mt-4 max-w-sm">
            <label htmlFor="temperature_measured" className={labelCls}>Temperature (Measured)</label>
            <input id="temperature_measured" name="temperature_measured" type="text" maxLength={50} onChange={markDirty} className={inputCls} />
            <p className="mt-1 text-xs text-slate-500">Measured value only — no conversion is applied.</p>
          </div>
          <div className="mt-4 max-w-sm">
            <label htmlFor="humidity_measured" className={labelCls}>Humidity (Measured)</label>
            <input id="humidity_measured" name="humidity_measured" type="text" maxLength={50} onChange={markDirty} className={inputCls} />
          </div>

          {/* Supplementary session environment readings (PROMPT 51). This log
              NEVER replaces or reinterprets the headline Temperature
              (Measured) field above — it records extra timestamped
              observations taken during the session, draft-stage only. */}
          <div className="mt-6 border-t border-slate-100 pt-5">
            <h3 className="text-sm font-semibold text-slate-900">Session Environment Readings <span className="font-normal text-slate-500">(optional)</span></h3>
            <p className="mt-1 text-xs text-slate-500">
              Timestamped readings taken during the test session. Editable while this test is a draft;
              frozen once it is approved.
            </p>
            {readings.length > 0 && (
              <ul className="mt-3 space-y-3">
                {readings.map((row, index) => (
                  <li key={index} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <div>
                        <label htmlFor={`reading_${index}_at`} className={labelCls}>
                          Timestamp <span aria-hidden="true">*</span>
                        </label>
                        <input
                          id={`reading_${index}_at`}
                          type="datetime-local"
                          maxLength={40}
                          value={row.reading_at}
                          onChange={(e) => updateReadingField(index, 'reading_at', e.target.value)}
                          className={`mt-1 ${inputCls}`}
                        />
                      </div>
                      <div>
                        <label htmlFor={`reading_${index}_temperature`} className={labelCls}>
                          Temperature <span aria-hidden="true">*</span>
                        </label>
                        <input
                          id={`reading_${index}_temperature`}
                          type="text"
                          inputMode="decimal"
                          maxLength={50}
                          value={row.temperature}
                          onChange={(e) => updateReadingField(index, 'temperature', e.target.value)}
                          className={`mt-1 ${inputCls}`}
                        />
                      </div>
                      <div>
                        <label htmlFor={`reading_${index}_humidity`} className={labelCls}>Humidity</label>
                        <input
                          id={`reading_${index}_humidity`}
                          type="text"
                          inputMode="decimal"
                          maxLength={50}
                          value={row.humidity}
                          onChange={(e) => updateReadingField(index, 'humidity', e.target.value)}
                          className={`mt-1 ${inputCls}`}
                        />
                      </div>
                      <div>
                        <label htmlFor={`reading_${index}_notes`} className={labelCls}>Notes</label>
                        <input
                          id={`reading_${index}_notes`}
                          type="text"
                          maxLength={2000}
                          value={row.notes}
                          onChange={(e) => updateReadingField(index, 'notes', e.target.value)}
                          className={`mt-1 ${inputCls}`}
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeReading(index)}
                      className="mt-3 inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-red-200 bg-white px-4 py-2.5 text-sm font-medium text-red-700 shadow-sm hover:bg-red-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
                    >
                      Remove reading {index + 1}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {readings.length >= envReadingsMax ? (
              <p className="mt-3 text-xs font-medium text-slate-500">Maximum of {envReadingsMax} readings reached.</p>
            ) : (
              <button
                type="button"
                onClick={addReading}
                className="mt-3 inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-brand-300 bg-white px-4 py-2.5 text-sm font-medium text-brand-700 shadow-sm hover:bg-brand-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
              >
                Add reading
              </button>
            )}
          </div>
        </section>

        {/* Section 5 + the deterministic approved-reference aside. The aside is
            read-only reference for the tester while entering Section 5/6
            values — it never feeds the measured inputs above or the sample
            grid below. */}
        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
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

          {/* ── Approved reference panel (deterministic, non-AI) ── */}
          <aside
            aria-labelledby="approved-reference-heading"
            data-testid="approved-reference-panel"
            className="rounded-xl border border-blue-200 bg-blue-50 p-5 shadow-sm"
          >
            <h2 id="approved-reference-heading" className="text-sm font-semibold text-blue-900">
              Approved Reference <span className="font-normal text-blue-700">(deterministic)</span>
            </h2>
            {referencePanel.state === 'linked' ? (
              <>
                <p className="mt-2 text-sm font-medium text-blue-900" data-testid="approved-reference-template">
                  {referencePanel.templateName} ({referencePanel.templateCode}) — v{referencePanel.templateVersion}
                </p>
                <dl className="mt-2 grid gap-2 text-xs text-slate-700 sm:grid-cols-2">
                  <div><dt className="font-semibold">Template Version</dt><dd>v{referencePanel.templateVersion}</dd></div>
                  <div><dt className="font-semibold">Effective Date</dt><dd>{referencePanel.effectiveDate ?? 'No approved reference available.'}</dd></div>
                  <div className="sm:col-span-2"><dt className="font-semibold">Source document reference</dt><dd>{referencePanel.sourceReference ?? 'No approved reference available.'}</dd></div>
                </dl>
                <dl className="mt-3 space-y-3">
                  {referencePanel.parameters.map((param) => (
                    <div key={param.key} data-testid={`approved-reference-${param.key}`}>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{param.label}</dt>
                      <dd className="mt-0.5 text-sm font-medium text-slate-900" dir="ltr">{param.value}</dd>
                    </div>
                  ))}
                  <div data-testid="approved-reference-sop">
                    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Applicable SOP (approved)</dt>
                    <dd className="mt-0.5 text-sm font-medium text-slate-900">
                      {referencePanel.sop ? (
                        <span dir="ltr">{referencePanel.sop.code} — {referencePanel.sop.title} (v{referencePanel.sop.version})</span>
                      ) : (
                        '—'
                      )}
                    </dd>
                  </div>
                  <div data-testid="approved-reference-wi">
                    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Applicable WI (approved)</dt>
                    <dd className="mt-0.5 text-sm font-medium text-slate-900">
                      {referencePanel.wi ? (
                        <span dir="ltr">{referencePanel.wi.code} — {referencePanel.wi.title} (v{referencePanel.wi.version})</span>
                      ) : (
                        '—'
                      )}
                    </dd>
                  </div>
                </dl>
                <p className="mt-3 text-xs text-slate-600">
                  Read-only values stored on the approved template version. They are shown for direct comparison while
                  you enter results and are never copied into any field on this form.
                </p>
              </>
            ) : (
              <p
                data-testid="approved-reference-empty"
                className="mt-3 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-500"
              >
                {referencePanel.emptyStateText}
              </p>
            )}
          </aside>
        </div>

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
                          onFocus={() => setSelectedCell({ row: index, col: SAMPLE_COLUMNS.findIndex((item) => item.key === col.key) })}
                          onKeyDown={(e) => handleSampleKeyDown(e, index, SAMPLE_COLUMNS.findIndex((item) => item.key === col.key))}
                          onPaste={(e) => handleSamplePaste(e, index, SAMPLE_COLUMNS.findIndex((item) => item.key === col.key))}
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
                        onFocus={() => setSelectedCell({ row: index, col: SAMPLE_COLUMNS.length })}
                        onKeyDown={(e) => handleSampleKeyDown(e, index, SAMPLE_COLUMNS.length)}
                        onPaste={(e) => handleSamplePaste(e, index, SAMPLE_COLUMNS.length)}
                        className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                      >
                        <option value="">Select result</option>
                        {sampleResultOptions.map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={duplicatePreviousRow} disabled={!selectedCell || selectedCell.row < 1} className="min-h-[44px] rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 disabled:opacity-50">Duplicate previous row</button>
            <button type="button" onClick={copyDownSelected} disabled={!selectedCell} className="min-h-[44px] rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 disabled:opacity-50">Copy down selected value / Fill down</button>
            <button type="button" onClick={undoLastPaste} disabled={!pasteUndo} className="min-h-[44px] rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 disabled:opacity-50">Undo last paste</button>
            {selectedCell && <button type="button" onClick={() => clearSampleRow(selectedCell.row)} className="min-h-[44px] rounded-md border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-700">Clear row {selectedCell.row + 1}</button>}
            <span className="self-center text-xs text-slate-500">Paste values from a spreadsheet with tabs/new lines. Server validation still applies.</span>
          </div>
          {errors['Samples'] && (
            <p id="error-samples" role="alert" className="mt-2 text-sm text-red-700">{errors['Samples']}</p>
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
          <fieldset className="mt-4" data-field="Final Result" aria-invalid={errors['Final Result'] ? 'true' : undefined} aria-describedby={errors['Final Result'] ? 'error-final-result' : undefined}>
            <legend className="text-sm font-medium text-slate-700">
              Final Result <span aria-hidden="true">(required to submit)</span>
            </legend>
            <div className="mt-2 flex flex-wrap gap-4">
              {finalResultOptions.map((o) => (
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
              <p id="error-final-result" role="alert" className="mt-1 text-sm text-red-700">{errors['Final Result']}</p>
            )}
          </fieldset>
        </section>

        {/* ── Actions ── */}
        {/* Bleed matches the page's px-4 (main) exactly — a -mx-5 bleed used
            to push 4px past the viewport at tablet widths (page-level
            horizontal overflow guard in scripts/ui-screenshots.mjs). */}
        <div className="sticky bottom-0 z-20 -mx-4 mt-6 flex flex-wrap items-center justify-end gap-3 border-t border-slate-200 bg-white/95 px-4 py-3 shadow-[0_-4px_12px_rgba(15,23,42,0.08)] backdrop-blur">
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
            {submitting ? 'Submitting…' : 'Submit for Review'}
          </button>
        </div>
      </div>
    </form>
  );
}
