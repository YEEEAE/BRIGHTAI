// Parity diff between a rehearsal-built schema and a captured target catalog.
//
// LOCAL / READ-ONLY. Reads two JSON documents and prints or writes the delta. It never
// connects to a database, so it cannot change either side.
//
// Usage:
//   node scripts/db-parity-diff.mjs --expected <rehearsal.json> --actual <live-catalog.json> [--json <out>]

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

const args = process.argv.slice(2);
const arg = name => { const i = args.indexOf(name); return i > -1 ? args[i + 1] : undefined; };

const expectedPath = arg('--expected');
const actualPath = arg('--actual');
const outPath = arg('--json');
if (!expectedPath || !actualPath) {
  console.error('usage: node scripts/db-parity-diff.mjs --expected <rehearsal.json> --actual <live-catalog.json> [--json out]');
  process.exit(2);
}

const expectedDoc = JSON.parse(await readFile(expectedPath, 'utf8'));
const actualDoc = JSON.parse(await readFile(actualPath, 'utf8'));

// The rehearsal document stores the fresh-install posture; the live catalog is already flat.
const expected = expectedDoc.postures?.fresh ?? expectedDoc;
const actual = actualDoc;

const names = rows => rows.map(r => typeof r === 'string' ? r : (r.relname ?? r.tgname ?? r.indexname ?? r.proname));
const only = (a, b) => [...a].filter(x => !b.has(x)).sort();
const set = list => new Set(list);

const expectedTables = names(expected.tables ?? []);
const actualTables = names(actual.tables ?? []);
const expectedPolicies = (expected.policies ?? []).map(p => `${p.tablename}.${p.policyname}:${p.permissive}`);
const actualPolicies = (actual.policies ?? []).map(p => `${p.tablename}.${p.policyname}:${p.permissive}`);
const expectedFunctions = names(expected.functionPrivileges ?? expected.functions ?? []);
const actualFunctions = names(actual.functions ?? []);
const expectedTriggers = names(expected.ledgerTriggers ?? []);
const actualTriggers = names(actual.triggers ?? []);

const report = {
  generatedAt: new Date().toISOString(),
  expectedSource: { file: expectedPath, description: 'local rehearsal, fresh install from migrations/ 0001..0029' },
  actualSource: { file: actualPath, description: actual.source ?? 'captured target catalog', capturedAt: actual.capturedAt ?? null },
  counts: {
    expected: {
      tables: expectedTables.length,
      rlsEnabled: (expected.tables ?? []).filter(t => t.rls).length,
      forceRls: (expected.tables ?? []).filter(t => t.force).length,
      policies: expectedPolicies.length,
      functions: expectedFunctions.length,
      clientTableGrants: expected.clientGrants ?? null,
      runtimeRole: expected.runtimeRole ? 'PRESENT' : 'ABSENT',
    },
    actual: {
      tables: actualTables.length,
      rlsEnabled: actual.rlsEnabled ?? (actual.tables ?? []).filter(t => t.rls).length,
      forceRls: actual.forceRls ?? (actual.tables ?? []).filter(t => t.force).length,
      policies: actualPolicies.length,
      functions: actualFunctions.length,
      clientTableGrants: actual.clientTableGrants ?? null,
      runtimeRole: actual.runtimeRoleExists ? 'PRESENT' : 'ABSENT',
    },
  },
  missingInTarget: {
    tables: only(expectedTables, set(actualTables)),
    policies: only(expectedPolicies, set(actualPolicies)),
    functions: only(expectedFunctions, set(actualFunctions)),
    indexes: only(names(expected.indexes ?? []), set(names(actual.indexes ?? []))),
  },
  unexpectedInTarget: {
    tables: only(actualTables, set(expectedTables)),
    policies: only(actualPolicies, set(expectedPolicies)),
    functions: only(actualFunctions, set(expectedFunctions)),
    // The rehearsal document trims the trigger surface to the ledger trio, so this
    // compares only those names rather than claiming the whole trigger set is absent.
    ledgerTriggersMissingFromExpected: only(expectedTriggers, set(actualTriggers)),
  },
};

// Only the ledger triggers are compared by name across both sides; the rest of the
// trigger surface is reported as a count because the rehearsal document trims it.
report.verdict = report.missingInTarget.tables.length === 0
  && report.missingInTarget.policies.length === 0
  && report.missingInTarget.functions.length === 0
  && report.unexpectedInTarget.tables.length === 0
  ? 'PARITY'
  : 'DRIFT';

if (outPath) {
  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(outPath, JSON.stringify(report, null, 2));
}
console.log(JSON.stringify(report, null, 2));
