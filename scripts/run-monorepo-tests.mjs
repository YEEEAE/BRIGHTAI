import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(fileURLToPath(new URL('..', import.meta.url)));

const workspaces = [
  { name: 'frontend', path: 'frontend', installHint: 'npm install --workspace frontend', setup: false },
  { name: 'backend', path: 'backend', installHint: 'npm install --workspace backend', setup: true },
  { name: 'brightai-platform', path: 'brightai-platform', installHint: 'npm install --workspace brightai-platform', setup: true }
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
  const workspaceCwd = path.join(repoRoot, workspace.path);
  const env = { ...process.env, FORCE_COLOR: '0', CI: 'true' };

  if (workspace.setup) {
    const setupResult = spawnSync('npm', ['run', 'test:setup'], {
      cwd: workspaceCwd,
      encoding: 'utf8',
      env
    });

    if (setupResult.stdout?.trim()) {
      process.stdout.write(setupResult.stdout);
    }
    if (setupResult.stderr?.trim()) {
      process.stderr.write(setupResult.stderr);
    }

    if (setupResult.status !== 0) {
      const setupOutput = `${setupResult.stdout || ''}\n${setupResult.stderr || ''}`.trim();
      return {
        workspace: workspace.name,
        passed: false,
        reason: `Dependency setup failed: ${explainFailure(setupOutput, setupResult.error, workspace)}`,
        code: typeof setupResult.status === 'number' ? setupResult.status : 1
      };
    }
  }

  const result = spawnSync('npm', ['run', 'test'], {
    cwd: workspaceCwd,
    encoding: 'utf8',
    env
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
