#!/usr/bin/env node
/**
 * Fan the committed DotLottie background and renderer runtime out to each app.
 *
 * The animation is committed once at the repo root. Each app deploys independently
 * and therefore needs the asset inside its own public/ tree. Copying at prebuild
 * time keeps one source of truth and makes byte-identity a property of the build
 * rather than something a reviewer has to remember to check.
 *
 * Fails the build on any mismatch — a silently stale copy would ship a different
 * background to one app.
 *
 * Usage: node scripts/sync-background-media.mjs [--check]
 */
import { copyFileSync, mkdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname, relative } from 'node:path';

const REPO = new URL('..', import.meta.url).pathname.replace(/\/$/, '');
const CHECK_ONLY = process.argv.includes('--check');

// The user-supplied DotLottie is the animation source of truth. The runtime stays
// local so all apps keep their same-origin CSP.
const SOURCES = {
  animation: join(REPO, 'brightai-background.lottie'),
  wasm: join(REPO, 'public/media/dotlottie-player.wasm'),
};

const TARGETS = [
  { app: 'site', dir: join(REPO, 'public/media') },
  { app: 'dashboard', dir: join(REPO, 'apps/dashboard/public/media') },
  { app: 'qc-task-manager', dir: join(REPO, 'apps/qc-task-manager/public/media') },
];

const NAMES = { animation: 'brightai-background.lottie', wasm: 'dotlottie-player.wasm' };

const sha256 = (p) => createHash('sha256').update(readFileSync(p)).digest('hex');

let failed = 0;
const report = [];

for (const key of ['animation', 'wasm']) {
  const src = SOURCES[key];
  if (!existsSync(src)) {
    console.error(`✖ missing source: ${relative(REPO, src)}`);
    failed += 1;
    continue;
  }
  const srcHash = sha256(src);
  const srcSize = statSync(src).size;
  report.push({ role: `source:${key}`, path: relative(REPO, src), bytes: srcSize, sha256: srcHash });

  for (const t of TARGETS) {
    const dest = join(t.dir, NAMES[key]);
    const same = existsSync(dest) && sha256(dest) === srcHash;
    if (!same) {
      if (CHECK_ONLY) {
        console.error(`✖ ${t.app}: ${relative(REPO, dest)} ${existsSync(dest) ? 'differs from' : 'missing vs'} source`);
        failed += 1;
        continue;
      }
      mkdirSync(dirname(dest), { recursive: true });
      copyFileSync(src, dest);
    }
    const destHash = sha256(dest);
    if (destHash !== srcHash) {
      console.error(`✖ ${t.app}: copy verification failed for ${relative(REPO, dest)}`);
      failed += 1;
    }
    report.push({ role: `${t.app}:${key}`, path: relative(REPO, dest), bytes: statSync(dest).size, sha256: destHash, matchesSource: destHash === srcHash });
  }
}

for (const r of report) {
  console.log(`${r.matchesSource === false ? '✖' : '✔'} ${r.role.padEnd(34)} ${String(r.bytes).padStart(9)}B  ${r.sha256.slice(0, 16)}…  ${r.path}`);
}

if (failed) {
  console.error(`\nsync-background-media: ${failed} problem(s).`);
  process.exit(1);
}
console.log(`\nsync-background-media: ${report.length} asset(s) verified identical${CHECK_ONLY ? ' (check only)' : ''}.`);
