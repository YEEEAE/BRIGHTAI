#!/usr/bin/env node
/**
 * scripts/verify-prisma-drift.mjs — BAI-P1-TYPES-001 (2026-08-09)
 *
 * CI gate that asserts the generated Prisma client is in lockstep with
 * the canonical schema at packages/db/prisma/schema.prisma.
 *
 * The contract being enforced: every model + enum declared in
 * schema.prisma MUST have a corresponding export in the generated
 * `@prisma/client` (models as type aliases, enums as runtime const +
 * type). If a model/enum exists in the schema but not in the generated
 * client — or vice versa — the contract has drifted and typecheck will
 * fail on a clean install (TS2305 "no exported member").
 *
 * Why this exists: the audit BAI-P1-TYPES-001 caught a state where the
 * schema, the generated client, and packages/db/src/types.ts were out
 * of sync on a single commit. `pretypecheck → db:generate` masks the
 * drift locally (it regenerates before typecheck), so a fresh clone or
 * CI step that runs `tsc` directly would surface 40+ TS2305 errors.
 * This script makes the drift visible as an explicit, named check
 * instead of relying on the pretypecheck hook alone.
 *
 * What it does NOT do: it does not verify field-level fidelity (column
 * types, relations, defaults). Prisma's own `prisma generate` is the
 * authority there. This is a model/enum presence contract — the exact
 * thing that breaks imports in types.ts.
 *
 * EXIT CODES:
 *   0 — schema and generated client are in sync (model/enum level)
 *   1 — drift detected (missing models/enums, with a per-symbol diff)
 *   2 — fatal (schema missing, generated client missing, parse error)
 *
 * Usage:
 *   node scripts/verify-prisma-drift.mjs
 *   pnpm verify:prisma:drift        # via package.json script
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');

const SCHEMA_PATH = resolve(REPO_ROOT, 'packages/db/prisma/schema.prisma');
// Matches the generator `output` in schema.prisma
// (output = "../../../node_modules/.prisma/client" relative to the
// schema file, which resolves to <repo>/node_modules/.prisma/client).
const GENERATED_DIR = resolve(REPO_ROOT, 'node_modules/.prisma/client');
const GENERATED_INDEX = resolve(GENERATED_DIR, 'index.d.ts');

function die(code, msg) {
  console.error(msg);
  process.exit(code);
}

// ────────────────────────────────────────────────────────────────
// 1. Parse schema.prisma — extract model + enum names.
//    We use a line-scan instead of a full Prisma grammar parse: the
//    schema's `model Foo {` / `enum Bar {` declarations are
//    unambiguous at the line level, and a full parser dep would be
//    overkill for a presence check.
// ────────────────────────────────────────────────────────────────
function extractSchemaSymbols(schemaSrc) {
  const models = new Set();
  const enums = new Set();
  const lines = schemaSrc.split('\n');
  for (const raw of lines) {
    const line = raw.trim();
    // Match `model Name {` — allow extra leading/trailing whitespace.
    // Reject commented-out lines (`// model X {`).
    if (line.startsWith('//')) continue;
    const modelMatch = /^model\s+([A-Za-z_][A-Za-z0-9_]*)\s*\{/.exec(line);
    if (modelMatch) {
      models.add(modelMatch[1]);
      continue;
    }
    const enumMatch = /^enum\s+([A-Za-z_][A-Za-z0-9_]*)\s*\{/.exec(line);
    if (enumMatch) {
      enums.add(enumMatch[1]);
      continue;
    }
  }
  return { models, enums };
}

// ────────────────────────────────────────────────────────────────
// 2. Parse the generated index.d.ts — extract model + enum names.
//    Prisma emits, for each model, a type alias:
//      export type ModelName = $Result.DefaultSelection<...>
//    and for each enum, both a namespace-qualified type + const
//    (under `export type X = $Enums.X` / `export const X: typeof $Enums.X`)
//    plus a top-level runtime const. We look for the model type
//    alias pattern and the `$Enums.` re-export pattern — both are
//    stable across Prisma 5.x generate output.
// ────────────────────────────────────────────────────────────────
function extractGeneratedSymbols(indexSrc) {
  const models = new Set();
  const enums = new Set();

  // Models: Prisma emits a type alias per model of the form
  //   export type <Name> = $Result.DefaultSelection<Prisma.$<Name>Payload<...>>
  // Matching on the `export type X = $Result.DefaultSelection` prefix is
  // stable across Prisma 5.x generate output.
  const modelRe = /^export\s+type\s+([A-Za-z_][A-Za-z0-9_]*)\s*=\s*\$Result\.DefaultSelection/gm;
  let mm;
  while ((mm = modelRe.exec(indexSrc)) !== null) {
    models.add(mm[1]);
  }

  // Enums: Prisma re-exports each enum type from the internal $Enums
  // namespace in the generated client, as
  //   export type <Name> = $Enums.<Name>
  // Using a backreference (\1) keeps the LHS/RHS names identical.
  const enumRe = /^export\s+type\s+([A-Za-z_][A-Za-z0-9_]*)\s*=\s*\$Enums\.\1/gm;
  let em;
  while ((em = enumRe.exec(indexSrc)) !== null) {
    enums.add(em[1]);
  }

  return { models, enums };
}

// ────────────────────────────────────────────────────────────────
// Main
// ────────────────────────────────────────────────────────────────

if (!existsSync(SCHEMA_PATH)) {
  die(2, `❌ FATAL: schema.prisma not found at ${SCHEMA_PATH}`);
}
if (!existsSync(GENERATED_INDEX)) {
  console.error(`❌ Prisma generated client missing at ${GENERATED_INDEX}`);
  console.error('   Run `pnpm --filter @brightai/db db:generate` first.');
  die(2, '   This usually means postinstall/pretypecheck did not run.');
}

const schemaSrc = readFileSync(SCHEMA_PATH, 'utf8');
const indexSrc = readFileSync(GENERATED_INDEX, 'utf8');

const schema = extractSchemaSymbols(schemaSrc);
const generated = extractGeneratedSymbols(indexSrc);

const missingModels = [...schema.models].filter((m) => !generated.models.has(m));
const missingEnums = [...schema.enums].filter((e) => !generated.enums.has(e));
const staleModels = [...generated.models].filter((m) => !schema.models.has(m));
const staleEnums = [...generated.enums].filter((e) => !schema.enums.has(e));

const drift =
  missingModels.length || missingEnums.length || staleModels.length || staleEnums.length;

if (!drift) {
  console.log('✅ Prisma schema ↔ generated client in sync.');
  console.log(`   models: ${schema.models.size} · enums: ${schema.enums.size}`);
  process.exit(0);
}

console.error('❌ Prisma drift detected between schema.prisma and generated client.\n');
if (missingModels.length) {
  console.error(`   Models in schema but NOT in generated client (${missingModels.length}):`);
  for (const m of missingModels) console.error(`     • ${m}`);
}
if (missingEnums.length) {
  console.error(`   Enums in schema but NOT in generated client (${missingEnums.length}):`);
  for (const e of missingEnums) console.error(`     • ${e}`);
}
if (staleModels.length) {
  console.error(`   Models in generated client but NOT in schema (${staleModels.length}):`);
  for (const m of staleModels) console.error(`     • ${m}`);
}
if (staleEnums.length) {
  console.error(`   Enums in generated client but NOT in schema (${staleEnums.length}):`);
  for (const e of staleEnums) console.error(`     • ${e}`);
}
console.error('\n   Fix: pnpm --filter @brightai/db db:generate');
console.error('   If generation does not resolve the drift, the schema and the');
console.error('   generated client are genuinely out of sync — regenerate from a');
console.error('   clean install and commit the result.');
process.exit(1);
