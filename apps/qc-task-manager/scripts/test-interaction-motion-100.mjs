// QC-100-INTERACTION-MOTION-009 guard.
// Deterministic source contract for interaction feedback, motion tokens, and
// reduced-motion safety. It does not pretend to replace browser/UAT testing.
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const APP_DIR = fileURLToPath(new URL('..', import.meta.url));
const SRC = join(APP_DIR, 'src');
let checks = 0;
const failures = [];
const ok = (condition, label) => { checks += 1; if (!condition) failures.push(label); };
const read = (rel) => readFileSync(join(APP_DIR, rel), 'utf8');

const globalCss = read('src/styles/global.css');
const tailwind = read('tailwind.config.mjs');
const files = [];
function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const file = join(dir, entry.name);
    if (entry.isDirectory()) walk(file);
    else if (/\.(astro|tsx|ts|css)$/.test(entry.name)) files.push(file);
  }
}
walk(SRC);
const source = files.map((file) => readFileSync(file, 'utf8')).join('\n');

for (const token of ['--duration-instant', '--duration-fast', '--duration-standard', '--duration-moderate', '--ease-standard', '--ease-decelerate', '--ease-accelerate', '--ease-linear']) {
  ok(globalCss.includes(token), `motion token exists: ${token}`);
}
for (const utility of ['qc-instant', 'qc-fast', 'qc-standard', 'qc-moderate']) {
  ok(tailwind.includes(`'${utility}'`), `Tailwind duration utility exists: ${utility}`);
}
for (const utility of ['qc-standard', 'qc-decelerate', 'qc-accelerate', 'qc-linear']) {
  ok(tailwind.includes(`'${utility}'`), `Tailwind easing utility exists: ${utility}`);
}

ok(globalCss.includes('@media (prefers-reduced-motion: reduce)'), 'reduced motion media query exists');
ok(globalCss.includes('--duration-standard: 1ms'), 'reduced motion collapses standard duration');
ok(globalCss.includes('animation-iteration-count: 1ms') || globalCss.includes('animation-iteration-count: 1 !important'), 'reduced motion prevents animation loops');
ok(globalCss.includes('scroll-behavior: auto'), 'reduced motion disables smooth scrolling');
ok(!source.includes('transition-all'), 'no transition-all in application source');
ok(!source.includes('hover:-translate'), 'no hover lift in operational UI');
ok(!source.includes('hover:scale'), 'no hover scale in operational UI');
ok(!source.includes('duration-150'), 'no un-tokenized 150ms transition remains');
ok(globalCss.includes('.qc-motion-feedback'), 'shared feedback recipe exists');
ok(globalCss.includes('.qc-motion-enter'), 'shared enter recipe exists');
ok(read('src/components/ui/Toast.astro').includes('qc-motion-enter'), 'toast uses shared enter recipe');
ok(read('src/components/ui/Skeleton.astro').includes('aria-busy="true"'), 'skeleton exposes loading state');

const feedbackOwners = [
  ['src/components/CommentBox.tsx', ['aria-live', 'aria-busy', 'submitting']],
  ['src/components/AttachmentUploader.tsx', ['ActionFeedback', 'aria-busy', 'uploading']],
  ['src/components/AiReviewPanel.tsx', ['aria-busy', 'busy', 'AI-generated suggestions']],
  ['src/components/MarkReadButton.tsx', ['aria-busy', 'disabled={busy']],
  ['src/components/MarkAllReadButton.tsx', ['aria-busy', 'disabled={busy']],
  ['src/components/DeleteRequestDialog.tsx', ['<dialog', 'aria-busy', 'ActionFeedback']],
  ['src/components/TaskUpdatePanel.tsx', ['aria-busy', 'ActionFeedback']],
  ['src/components/lab/LabTestForm.tsx', ['aria-live', 'saveState', 'submitting']],
  ['src/components/ui/ActionFeedback.tsx', ['aria-live', 'role=', 'message']],
  ['src/components/ui/AppButton.astro', ['disabled', 'loading', 'active:']],
];
for (const [rel, markers] of feedbackOwners) {
  const content = read(rel);
  ok(true, `feedback owner scanned: ${rel}`);
  for (const marker of markers) ok(content.includes(marker), `${rel} exposes ${marker}`);
}

const dialogOwners = ['src/components/DeleteRequestDialog.tsx', 'src/components/ReviewDeleteRequestDialog.tsx', 'src/components/EsignDialog.astro', 'src/components/lab/LabTestForm.tsx', 'src/components/TaskLifecycle.tsx'];
for (const rel of dialogOwners) {
  const content = read(rel);
  ok(content.includes('<dialog') || content.includes('role="dialog"'), `dialog owner has dialog semantics: ${rel}`);
  ok(content.includes('Escape') || content.includes('showModal') || content.includes('setReviewOpen(false)'), `dialog owner has dismissal/focus contract: ${rel}`);
}

if (failures.length) {
  console.error(`INTERACTION-MOTION-100: FAIL (${failures.length} failures / ${checks} checks)`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log(`INTERACTION-MOTION-100: PASS (${checks} checks)`);
}
