import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(fileURLToPath(new URL('..', import.meta.url)));

const workspaces = [
  { name: 'frontend', installHint: 'npm install --workspace frontend' },
  { name: 'backend', installHint: 'npm install --workspace backend' },
  { name: 'brightai-platform', installHint: 'npm install --workspace brightai-platform' }
];

function explainFailure(output, error, workspace) {
  if (error && error.code === 'ENOENT') {
    return 'npm is not available in PATH.';
  }

  if (/Missing script:\s*"test"/i.test(output)) {
    return 'No test script is defined in this workspace package.';
  }

  if (/react-scripts:\s+not found|react-scripts:\s+command not found|not recognized as an internal or external command/i.test(output)) {
    return `react-scripts is missing. Install dependencies: ${workspace.installHint}`;
  }

  if (/vitest:\s+not found|vitest:\s+command not found|Cannot find package 'vitest'|ERR_MODULE_NOT_FOUND.*vitest/i.test(output)) {
    return `Vitest is missing. Install dependencies: ${workspace.installHint}`;
  }

  if (/Cannot find module|ERR_MODULE_NOT_FOUND/i.test(output)) {
    return `Workspace dependency is missing. Install dependencies: ${workspace.installHint}`;
  }

  const assertionMatch = output.match(/AssertionError:\s*(.+)/i);
  if (assertionMatch) {
    return `Assertions failed: ${assertionMatch[1]}`;
  }

  return 'Test command failed. Check logs above for details.';
}

function runWorkspaceTests(workspace) {
  const result = spawnSync('npm', ['run', 'test', '--workspace', workspace.name], {
    cwd: repoRoot,
    encoding: 'utf8',
    env: { ...process.env, FORCE_COLOR: '0' }
  });

  const stdout = result.stdout || '';
  const stderr = result.stderr || '';
  const combinedOutput = `${stdout}\n${stderr}`.trim();

  if (stdout.trim()) {
    process.stdout.write(stdout);
  }

  if (stderr.trim()) {
    process.stderr.write(stderr);
  }

  const passed = result.status === 0;
  const reason = passed ? 'All tests passed.' : explainFailure(combinedOutput, result.error, workspace);

  return {
    workspace: workspace.name,
    passed,
    reason,
    code: typeof result.status === 'number' ? result.status : 1
  };
}

const results = [];

for (const workspace of workspaces) {
  console.log(`\n=== Testing ${workspace.name} ===`);
  results.push(runWorkspaceTests(workspace));
}

console.log('\n=== Monorepo Test Summary ===');
for (const item of results) {
  const marker = item.passed ? 'PASS' : 'FAIL';
  console.log(`- ${item.workspace}: ${marker} (${item.reason})`);
}

const failedCount = results.filter(item => !item.passed).length;

if (failedCount > 0) {
  process.exit(1);
}
