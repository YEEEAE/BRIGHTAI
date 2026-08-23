import { spawnSync } from 'node:child_process';
import { CANONICAL_TEST_SCRIPTS } from './test-manifest.mjs';

const pnpm = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
const metaCommands = ['test:architecture'];

for (const script of ['test:manifest', ...metaCommands, ...CANONICAL_TEST_SCRIPTS]) {
  console.log(`\n▶ Full unit suite: ${script}`);
  const result = spawnSync(pnpm, ['run', script], { stdio: 'inherit', shell: false });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

console.log(`\n✅ Full unit manifest passed: ${CANONICAL_TEST_SCRIPTS.length} canonical suites.`);
