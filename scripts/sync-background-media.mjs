#!/usr/bin/env node
/**
 * Fan the single committed background video out to every app's public/ directory.
 *
 * The video is committed once at the repo root. Each app deploys independently and
 * therefore needs the asset inside its own public/ tree, but committing a second
 * and third 8 MB copy would triple the video weight in git history. Copying at
 * prebuild time keeps one source of truth and makes byte-identity a property of
 * the build rather than something a reviewer has to remember to check.
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

// Source of truth. `9.mp4` is the file the user supplied; the poster was extracted
// from that exact file at its native 1600x1200 and is reused verbatim.
const SOURCES = {
  video: join(REPO, '9.mp4'),
  poster: join(REPO, 'apps/qc-task-manager/public/media/qc-system-background-poster.jpg'),
};

const TARGETS = [
  { app: 'site', dir: join(REPO, 'public/media') },
  { app: 'dashboard', dir: join(REPO, 'apps/dashboard/public/media') },
];

const NAMES = { video: 'brightai-background.mp4', poster: 'brightai-background-poster.jpg' };

const sha256 = (p) => createHash('sha256').update(readFileSync(p)).digest('hex');

let failed = 0;
const report = [];

for (const key of ['video', 'poster']) {
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

// The QC app already owns a committed copy; verify it still matches rather than
// overwriting a file that is under version control.
const QC = join(REPO, 'apps/qc-task-manager/public/media/qc-system-background.mp4');
if (existsSync(QC)) {
  const h = sha256(QC);
  const ok = h === sha256(SOURCES.video);
  report.push({ role: 'qc-task-manager:video (committed)', path: relative(REPO, QC), bytes: statSync(QC).size, sha256: h, matchesSource: ok });
  if (!ok) { console.error('✖ qc-task-manager committed video no longer matches 9.mp4'); failed += 1; }
}

for (const r of report) {
  console.log(`${r.matchesSource === false ? '✖' : '✔'} ${r.role.padEnd(34)} ${String(r.bytes).padStart(9)}B  ${r.sha256.slice(0, 16)}…  ${r.path}`);
}

if (failed) {
  console.error(`\nsync-background-media: ${failed} problem(s).`);
  process.exit(1);
}
console.log(`\nsync-background-media: ${report.length} asset(s) verified identical${CHECK_ONLY ? ' (check only)' : ''}.`);
