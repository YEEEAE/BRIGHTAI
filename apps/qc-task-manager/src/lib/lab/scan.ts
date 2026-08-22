// Scan resolver for the /lab/search "scan" input (PROMPT 48).
//
// A scanner (or a typed identifier) arrives as one string. QR payloads are
// "identifier\nabsolute URL" — the resolver accepts the raw payload, a bare
// identifier (LAB-TEST-00081 or LAB-TEST-00081-S03), or the URL alone, and
// resolves directly to the test/sample record.
//
// RBAC: same employee record-scope invariant as searchLab — employees only
// resolve tests they tested or created; anything else resolves to null
// (404-style non-discovery, never a leak).

import type { Role } from '../types';
import { getDb } from '../db';
import { labSampleAnchor } from './qrcodes';

export interface LabScanUserContext {
  role: Role;
  userId: number;
}

export interface LabScanTarget {
  href: string;
  identifier: string;
}

const IDENTIFIER_RE = /LAB-TEST-\d+(?:-S\d+)?/i;

/** Extract the identifier from a raw scanned value (payload, bare ID, or URL). */
export function normalizeScannedIdentifier(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  const match = trimmed.match(IDENTIFIER_RE);
  if (match) return match[0].toUpperCase();
  // No identifier pattern — fall back to the first whitespace-delimited token
  // (typed input, e.g. a test number pasted by hand).
  return trimmed.split(/\s+/)[0]!.toUpperCase();
}

/**
 * Resolve a scanned value to its record href, or null when no in-scope
 * record matches. Samples win over tests (most specific identifier first).
 */
export function resolveLabScan(raw: string, ctx: LabScanUserContext): LabScanTarget | null {
  const identifier = normalizeScannedIdentifier(raw);
  if (!identifier) return null;
  const db = getDb();

  const sampleSuffix = identifier.match(/^(LAB-TEST-\d+)-(S\d+)$/i);
  if (sampleSuffix) {
    const row = db
      .prepare(
        `SELECT s.id AS sample_id, s.sample_no, s.sample_identifier,
                t.id AS test_id, t.tested_by, t.created_by
           FROM lab_test_samples s
           JOIN lab_test_records t ON t.id = s.test_id
          WHERE UPPER(s.sample_identifier) = ?`,
      )
      .get(identifier) as
      | { sample_id: number; sample_no: number; sample_identifier: string | null; test_id: number; tested_by: number | null; created_by: number | null }
      | undefined;
    if (row && (ctx.role !== 'employee' || row.tested_by === ctx.userId || row.created_by === ctx.userId)) {
      return {
        href: `/lab/tests/${row.test_id}#${labSampleAnchor(row.sample_identifier, row.sample_no)}`,
        identifier,
      };
    }
    return null;
  }

  const testRow = db
    .prepare(
      `SELECT id, tested_by, created_by FROM lab_test_records WHERE UPPER(test_number) = ?`,
    )
    .get(identifier) as { id: number; tested_by: number | null; created_by: number | null } | undefined;
  if (testRow && (ctx.role !== 'employee' || testRow.tested_by === ctx.userId || testRow.created_by === ctx.userId)) {
    return { href: `/lab/tests/${testRow.id}`, identifier };
  }
  return null;
}
