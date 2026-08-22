// Display mapping for laboratory equipment status (PROMPT 11, A2).
//
// The canonical registry stores status_RAW exactly as the company provided it —
// mixed Arabic/English compound values are intentional business data and are
// NEVER rewritten. This module is the ONE documented place that maps a raw
// status to English display labels, and it is used by badges, filters, and
// dashboard counts. Keep it swappable: the company may later approve an
// official status dictionary (open decision).
//
// DISPLAY MAPPING (derived, display/filter ONLY — originals preserved):
//   مستخدم        -> "In Use"
//   تحت الصيانة   -> "Under Maintenance"
//   غير مستخدم    -> "Not In Use"
//   NEW           -> "New"
//   DONE          -> "Done"
// Compound values keep both parts (e.g. "تحت الصيانة / NEW" -> "Under Maintenance / New").

const STATUS_TOKEN_LABELS: Readonly<Record<string, string>> = {
  'مستخدم': 'In Use',
  'تحت الصيانة': 'Under Maintenance',
  'غير مستخدم': 'Not In Use',
  NEW: 'New',
  DONE: 'Done',
};

/** Split a compound raw status on separators (`/`, `،`, `,`) and trim. */
export function statusTokens(raw: string | null): string[] {
  if (!raw) return [];
  return raw
    .split(/[/،,]/)
    .map((part) => part.trim())
    .filter(Boolean);
}

/** One display label for a raw status (compound values keep every mapped part). */
export function statusLabels(raw: string | null): string {
  if (!raw) return '—';
  const tokens = statusTokens(raw);
  if (tokens.length === 0) return raw;
  return tokens.map((t) => STATUS_TOKEN_LABELS[t] ?? t).join(' / ');
}

/** Standard filter labels, derived from the token mapping above. */
export const STATUS_FILTER_LABELS: readonly string[] = [
  'In Use',
  'Under Maintenance',
  'Not In Use',
  'New',
  'Done',
];

/**
 * True if a raw status maps to the given display label — i.e. one of its
 * tokens has that label (compound values match both parts, so
 * "غير مستخدم / DONE" matches BOTH "Not In Use" and "Done" filters).
 */
export function statusMatchesLabel(raw: string | null, label: string): boolean {
  return statusTokens(raw).some((t) => (STATUS_TOKEN_LABELS[t] ?? t) === label);
}

/** Calibration flag display: "yes"/"no" verbatim, null -> "Unknown". */
export function calibrationLabel(value: string | null | undefined): string {
  if (value === 'yes') return 'Yes';
  if (value === 'no') return 'No';
  return 'Unknown';
}