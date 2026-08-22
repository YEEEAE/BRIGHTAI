// Deterministic (non-AI) approved-reference resolution for the test form
// (QC-LAB-APPROVED-REF-001).
//
// Pure module — NO server/db imports — so the LabTestForm island and the
// plain-node unit tests share the exact same resolution logic. The panel it
// describes is DISPLAY-ONLY: values come verbatim from the approved current
// version of an ACTIVE template (already version-locked upstream by
// resolveLabTemplateVersion + listLabTemplateReferences), missing keys render
// as '—', and NOTHING is ever guessed, defaulted from the static printed-form
// constants, copied into measured fields, or used to auto-fill/overwrite user
// input. When no approved version is linked the panel reports the explicit
// empty state below — it never fabricates a reference.

/** Explicit empty-state text shown when no approved reference is linked. */
export const LAB_REFERENCE_EMPTY_STATE_TEXT = 'No approved reference linked';

/** The fields the resolver needs — satisfied structurally by LabTemplateReference. */
export interface LabTemplateRefLite {
  version_id: number;
  name: string;
  code: string;
  test_type: 'air' | 'vacuum';
  version: number;
  parameters_json: string;
  sop_code: string | null;
  sop_title: string | null;
  sop_version: number | null;
  sop_status: string | null;
  wi_code: string | null;
  wi_title: string | null;
  wi_version: number | null;
  wi_status: string | null;
}

export interface LabReferenceParameter {
  key: 'standard_parameter' | 'acceptance_criteria' | 'holding_time';
  label: string;
  /** Exact stored value, or '—' when absent — never a fallback. */
  value: string;
}

export interface LabReferenceDocument {
  code: string;
  title: string;
  version: number;
}

export interface LabReferencePanelLinked {
  state: 'linked';
  templateName: string;
  templateCode: string;
  templateVersion: number;
  /** Stored parameter values from the approved version's parameters_json. */
  parameters: LabReferenceParameter[];
  /** Approved SOP linked to the approved template version, if any. */
  sop: LabReferenceDocument | null;
  /** Approved WI linked to the approved template version, if any. */
  wi: LabReferenceDocument | null;
}

export type LabReferencePanel =
  | LabReferencePanelLinked
  | { state: 'unlinked'; emptyStateText: string };

const PARAMETER_LABELS: Record<LabReferenceParameter['key'], string> = {
  standard_parameter: 'Standard Parameter',
  acceptance_criteria: 'Acceptance Criteria',
  holding_time: 'Holding Time',
};

/** Extracts a parameter exactly as stored; '' / non-string / broken JSON → '—'. */
function storedParameter(parsed: Record<string, unknown> | null, key: LabReferenceParameter['key']): string {
  const raw = parsed?.[key];
  return typeof raw === 'string' && raw.trim() !== '' ? raw : '—';
}

/**
 * Resolves the display-only approved reference panel for the currently
 * selected template version. `refs` must already contain only ACTIVE
 * templates with their approved current version (listLabTemplateReferences).
 * Returns the explicit empty state when no version is selected, the version
 * is unknown to the list (e.g. superseded/never approved), or the test type
 * does not match — never a guess.
 */
export function resolveApprovedReferencePanel(
  refs: readonly LabTemplateRefLite[],
  templateVersionId: number | null,
  testType: 'air' | 'vacuum',
): LabReferencePanel {
  if (templateVersionId === null) {
    return { state: 'unlinked', emptyStateText: LAB_REFERENCE_EMPTY_STATE_TEXT };
  }
  const ref = refs.find((r) => r.version_id === templateVersionId && r.test_type === testType);
  if (!ref) {
    return { state: 'unlinked', emptyStateText: LAB_REFERENCE_EMPTY_STATE_TEXT };
  }
  let parsed: Record<string, unknown> | null = null;
  try {
    const value = JSON.parse(ref.parameters_json) as unknown;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      parsed = value as Record<string, unknown>;
    }
  } catch {
    parsed = null;
  }
  const approvedDoc = (
    code: string | null,
    title: string | null,
    version: number | null,
    status: string | null,
  ): LabReferenceDocument | null =>
    code && title && version !== null && status === 'APPROVED' ? { code, title, version } : null;
  return {
    state: 'linked',
    templateName: ref.name,
    templateCode: ref.code,
    templateVersion: ref.version,
    parameters: (Object.keys(PARAMETER_LABELS) as LabReferenceParameter['key'][]).map((key) => ({
      key,
      label: PARAMETER_LABELS[key],
      value: storedParameter(parsed, key),
    })),
    sop: approvedDoc(ref.sop_code, ref.sop_title, ref.sop_version, ref.sop_status),
    wi: approvedDoc(ref.wi_code, ref.wi_title, ref.wi_version, ref.wi_status),
  };
}
