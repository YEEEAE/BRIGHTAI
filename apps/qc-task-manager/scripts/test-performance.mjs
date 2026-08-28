import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';

const appDir = resolve(new URL('..', import.meta.url).pathname);
const outputDir = mkdtempSync(join(tmpdir(), 'brightai-qc-performance-output-'));

try {
  execFileSync(
    process.execPath,
    ['--import', '../../scripts/test-ts-loader.mjs', '--experimental-strip-types', 'scripts/run-performance.mjs', '--profile=ci', '--runs=3'],
    {
      cwd: appDir,
      env: { ...process.env, QC_PERF_OUTPUT_DIR: outputDir },
      stdio: 'inherit',
    },
  );

  const jsonPath = join(outputDir, 'qc-performance.json');
  const markdownPath = join(outputDir, 'qc-performance.md');
  assert.ok(existsSync(jsonPath), 'writes the requested qc-performance JSON artifact');
  assert.ok(existsSync(markdownPath), 'writes a Markdown performance summary');

  const result = JSON.parse(readFileSync(jsonPath, 'utf8'));
  assert.equal(result.profile.name, 'ci', 'records the selected fixture profile');
  assert.equal(result.integrity.integrity_check, 'ok', 'preserves SQLite integrity');
  assert.equal(result.integrity.foreign_key_violations, 0, 'preserves foreign-key integrity');
  assert.equal(result.scenarios.length, 11, 'benchmarks every requested QC surface');
  assert.deepEqual(
    result.scenarios.map((scenario) => scenario.id),
    ['dashboard', 'employee-tasks', 'task-search', 'lab-home', 'lab-search', 'tests-register', 'equipment', 'documents', 'change-requests', 'audit', 'reports'],
    'keeps the required benchmark scenario inventory',
  );
  for (const scenario of result.scenarios) {
    assert.equal(scenario.runs, 3, `${scenario.id}: records each measured run`);
    assert.ok(Number.isFinite(scenario.duration_ms.p50), `${scenario.id}: p50 is numeric`);
    assert.ok(Number.isFinite(scenario.duration_ms.p95), `${scenario.id}: p95 is numeric`);
    assert.ok(Number.isFinite(scenario.duration_ms.max), `${scenario.id}: max is numeric`);
    assert.ok(Number.isInteger(scenario.query_count), `${scenario.id}: query count is measured`);
  }
  assert.ok(Array.isArray(result.explain_query_plan), 'records query plans for evidence review');
  console.log('QC performance benchmark contract passed.');
} finally {
  rmSync(outputDir, { recursive: true, force: true });
}
