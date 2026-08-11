// Evidence platform — pure policy module (single source of truth for the
// evidence architecture rules).
//
// Persistence, file I/O, and authorization live OUTSIDE this module (mirrors
// the capa/findings pure-module convention). Everything here is dependency-free
// (types + constants + pure functions only) so it can be imported from server
// libs, Astro pages, React islands, and the Node test runner alike.
//
// Responsibilities:
//   * Evidence-requirement shape + normalization
//   * Completion-gate arithmetic (which REQUIRED evidence types are missing)
//   * Verification-status enum + transitions
//   * Re-export the file-security allowlists owned by task-policy.ts so callers
//     have ONE evidence module to import from.
//
// If an evidence rule changes, it changes HERE.

import {
  EVIDENCE_EXTENSIONS,
  EVIDENCE_SIGNATURES,
  isEvidenceExtension,
} from '../task-policy';

// Re-export the canonical allowlists so consumers import from a single module.
export {
  EVIDENCE_EXTENSIONS,
  EVIDENCE_EXTENSIONS_HINT,
  EVIDENCE_EXT_MIME,
  EVIDENCE_SIGNATURES,
  isEvidenceExtension,
} from '../task-policy';

// ─────────────────────────── Verification status ───────────────────────────

/**
 * Verification lifecycle for an evidence record. UNVERIFIED is the default at
 * upload time; the remaining states are advanced by review flows
 * (auto-validation, AI review, or human sign-off).
 */
export const VERIFICATION_STATUSES = [
  'UNVERIFIED',
  'VALID',
  'REJECTED',
  'AI_REVIEWED',
  'AI_PENDING',
  'HUMAN_VERIFIED',
] as const;
export type VerificationStatus = (typeof VERIFICATION_STATUSES)[number];

/** Human-readable label for a verification status (UI + activity log). */
export const VERIFICATION_LABELS: Record<VerificationStatus, string> = {
  UNVERIFIED: 'Unverified',
  VALID: 'Valid',
  REJECTED: 'Rejected',
  AI_REVIEWED: 'AI Reviewed',
  AI_PENDING: 'AI Review Pending',
  HUMAN_VERIFIED: 'Human Verified',
};

export function isVerificationStatus(value: string): value is VerificationStatus {
  return (VERIFICATION_STATUSES as readonly string[]).includes(value);
}

// ─────────────────────────── Requirement level ───────────────────────────

/** Whether a given evidence type is mandatory or optional for a task type. */
export const EVIDENCE_REQUIREMENT = ['REQUIRED', 'OPTIONAL'] as const;
export type EvidenceRequirement = (typeof EVIDENCE_REQUIREMENT)[number];

export function isEvidenceRequirement(value: string): value is EvidenceRequirement {
  return (EVIDENCE_REQUIREMENT as readonly string[]).includes(value);
}

// ─────────────────────────── Evidence sources ───────────────────────────

/** Provenance of an evidence record. Extensible but constrained to a known set. */
export const EVIDENCE_SOURCES = [
  'manual_upload',
  'sensor',
  'system_generated',
  'integration',
  'import',
] as const;
export type EvidenceSource = (typeof EVIDENCE_SOURCES)[number];

export function isEvidenceSource(value: string): value is EvidenceSource {
  return (EVIDENCE_SOURCES as readonly string[]).includes(value);
}

// ─────────────────────────── Evidence requirement spec ───────────────────────────

/**
 * A single evidence requirement declared by a Task Template (or a task's frozen
 * snapshot). `type` is the stable slug that ties uploaded evidence files to a
 * requirement (e.g. 'inspection_report', 'photo', 'measurement_xlsx').
 *
 * - `allowedExtensions`, when set, NARROWS the global evidence allowlist for
 *   this requirement (e.g. an XLSX-only measurement). When omitted, all
 *   evidence extensions are accepted.
 * - `maxFiles` caps how many files may satisfy this requirement (default 1).
 * - `description` is a human note shown in the UI.
 */
export interface EvidenceRequirementSpec {
  type: string;
  label: string;
  requirement: EvidenceRequirement;
  allowedExtensions?: string[];
  maxFiles?: number;
  description?: string;
}

/** Max lengths for normalization — mirrors task-policy text caps. */
const MAX_TYPE_LENGTH = 60;
const MAX_LABEL_LENGTH = 120;
const MAX_DESC_LENGTH = 500;

/**
 * Normalize + validate a raw evidence-requirements payload (from JSON column or
 * form input). Returns a clean array or throws on structural problems. Duplicate
 * `type` values are rejected because each type must map to at most one slot.
 */
export function normalizeEvidenceRequirements(input: unknown): EvidenceRequirementSpec[] {
  if (!Array.isArray(input)) return [];
  const seen = new Set<string>();
  const out: EvidenceRequirementSpec[] = [];
  for (const raw of input) {
    if (!raw || typeof raw !== 'object') continue;
    const r = raw as Record<string, unknown>;
    const type = String(r.type ?? '').trim().toLowerCase();
    const label = String(r.label ?? '').trim();
    if (!type || !label) {
      throw new Error('Each evidence requirement must have a non-empty type and label.');
    }
    if (type.length > MAX_TYPE_LENGTH) {
      throw new Error(`Evidence requirement type must be ${MAX_TYPE_LENGTH} characters or fewer.`);
    }
    if (label.length > MAX_LABEL_LENGTH) {
      throw new Error(`Evidence requirement label must be ${MAX_LABEL_LENGTH} characters or fewer.`);
    }
    if (!/^[a-z0-9_]+$/.test(type)) {
      throw new Error(`Evidence requirement type "${type}" may only contain lowercase letters, digits, and underscores.`);
    }
    if (seen.has(type)) {
      throw new Error(`Duplicate evidence requirement type "${type}" — each type must be unique.`);
    }
    seen.add(type);
    const requirementRaw = String(r.requirement ?? 'REQUIRED').toUpperCase();
    if (!isEvidenceRequirement(requirementRaw)) {
      throw new Error(`Evidence requirement for "${type}" must be REQUIRED or OPTIONAL.`);
    }
    let allowedExtensions: string[] | undefined;
    if (r.allowedExtensions !== undefined && r.allowedExtensions !== null) {
      const arr = Array.isArray(r.allowedExtensions) ? r.allowedExtensions : [r.allowedExtensions];
      allowedExtensions = arr
        .map((v) => String(v).trim().toLowerCase().replace(/^\./, ''))
        .filter((v) => v.length > 0);
      const invalid = allowedExtensions.filter((v) => !isEvidenceExtension(v));
      if (invalid.length > 0) {
        throw new Error(`Evidence requirement "${type}" lists unsupported extension(s): ${invalid.join(', ')}.`);
      }
      if (allowedExtensions.length === 0) allowedExtensions = undefined;
    }
    let maxFiles: number | undefined;
    if (r.maxFiles !== undefined && r.maxFiles !== null && r.maxFiles !== '') {
      const n = Number(r.maxFiles);
      if (!Number.isInteger(n) || n < 1) {
        throw new Error(`Evidence requirement "${type}" maxFiles must be a positive integer.`);
      }
      maxFiles = n;
    }
    let description: string | undefined;
    if (r.description !== undefined && r.description !== null) {
      const d = String(r.description).trim();
      if (d.length > MAX_DESC_LENGTH) {
        throw new Error(`Evidence requirement "${type}" description must be ${MAX_DESC_LENGTH} characters or fewer.`);
      }
      if (d.length > 0) description = d;
    }
    out.push({
      type,
      label,
      requirement: requirementRaw,
      allowedExtensions,
      maxFiles,
      description,
    });
  }
  return out;
}

/** Serialize back to JSON-storable form (stable key order). */
export function serializeEvidenceRequirements(reqs: EvidenceRequirementSpec[]): EvidenceRequirementSpec[] {
  return reqs.map((r) => ({
    type: r.type,
    label: r.label,
    requirement: r.requirement,
    ...(r.allowedExtensions ? { allowedExtensions: r.allowedExtensions } : {}),
    ...(r.maxFiles != null ? { maxFiles: r.maxFiles } : {}),
    ...(r.description ? { description: r.description } : {}),
  }));
}

// ─────────────────────────── Completion gate ───────────────────────────

/** The REQUIRED requirement types only (the ones the completion gate enforces). */
export function requiredEvidenceTypes(requirements: readonly EvidenceRequirementSpec[]): string[] {
  return requirements.filter((r) => r.requirement === 'REQUIRED').map((r) => r.type);
}

/** The OPTIONAL requirement types only (informational, never enforced). */
export function optionalEvidenceTypes(requirements: readonly EvidenceRequirementSpec[]): string[] {
  return requirements.filter((r) => r.requirement === 'OPTIONAL').map((r) => r.type);
}

/**
 * The heart of the completion gate. Given the declared requirements and the set
 * of evidence types that have at least one uploaded file, return the REQUIRED
 * types that are NOT yet covered. An empty result means the task may close.
 *
 * Pure and deterministic — callers compute `uploadedTypes` from the DB and pass
 * them in; this function never touches the database.
 */
export function computeMissingEvidence(
  requirements: readonly EvidenceRequirementSpec[],
  uploadedTypes: readonly string[],
): EvidenceRequirementSpec[] {
  const covered = new Set(uploadedTypes.map((t) => t.toLowerCase()));
  return requirements.filter(
    (r) => r.requirement === 'REQUIRED' && !covered.has(r.type),
  );
}

// ─────────────────────── Per-requirement extension gating ───────────────────────

/**
 * Resolve the effective allowed extensions for a requirement. If the spec
 * narrows the list, intersect with the global evidence allowlist; otherwise
 * return the full evidence allowlist. Returns lowercase extensions.
 */
export function effectiveExtensionsFor(
  requirement: EvidenceRequirementSpec | undefined,
): string[] {
  const globalList = EVIDENCE_EXTENSIONS;
  if (!requirement?.allowedExtensions || requirement.allowedExtensions.length === 0) {
    return globalList;
  }
  const allowed = new Set(requirement.allowedExtensions);
  return globalList.filter((ext) => allowed.has(ext));
}

/**
 * True when a file extension is acceptable for a requirement. Used by the
 * server to apply per-requirement narrowing in addition to the global check.
 */
export function isExtensionAllowedFor(
  requirement: EvidenceRequirementSpec | undefined,
  ext: string,
): boolean {
  const e = ext.toLowerCase();
  return effectiveExtensionsFor(requirement).includes(e);
}

/** Find a requirement by type (case-insensitive). */
export function findRequirement(
  requirements: readonly EvidenceRequirementSpec[],
  type: string,
): EvidenceRequirementSpec | undefined {
  const t = type.toLowerCase();
  return requirements.find((r) => r.type === t);
}

// ─────────────────────────── Magic-byte lookup ───────────────────────────

/**
 * Magic bytes (file signatures) for the evidence types that have one. Re-exported
 * here from task-policy.ts (the owner) so evidence callers have a single import.
 * The signature is checked IN ADDITION to extension + MIME.
 */
export { EVIDENCE_SIGNATURES as EVIDENCE_MAGIC_BYTES };

/** True when `ext` has a known file signature that the validator must check. */
export function hasMagicBytes(ext: string): boolean {
  return ext.toLowerCase() in EVIDENCE_SIGNATURES;
}
