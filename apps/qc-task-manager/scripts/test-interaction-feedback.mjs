// Interaction feedback contract: deterministic source guard for React islands.
// It protects the shared live-region pattern and prevents async actions from
// regressing to silent failures or unlabelled busy states.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const APP_DIR = fileURLToPath(new URL('..', import.meta.url));
const read = (relative) => readFileSync(join(APP_DIR, relative), 'utf8');
const checks = [];
const ok = (condition, message) => checks.push({ condition, message });

const feedback = read('src/components/ui/ActionFeedback.tsx');
ok(feedback.includes('aria-live'), 'ActionFeedback exposes a live region');
ok(feedback.includes('aria-atomic="true"'), 'ActionFeedback announces complete messages');
ok(feedback.includes("role={tone === 'error' ? 'alert' : 'status'}"), 'errors and routine updates use distinct roles');
ok(feedback.includes('toneClasses'), 'ActionFeedback uses semantic tone classes');

for (const relative of [
  'src/components/CommentBox.tsx',
  'src/components/AttachmentUploader.tsx',
  'src/components/AiReviewPanel.tsx',
  'src/components/MarkReadButton.tsx',
  'src/components/MarkAllReadButton.tsx',
  'src/components/DeleteRequestDialog.tsx',
  'src/components/TaskUpdatePanel.tsx',
]) {
  const source = read(relative);
  ok(source.includes("from './ui/ActionFeedback'"), `${relative}: uses shared action feedback`);
  ok(source.includes('aria-busy'), `${relative}: exposes busy state to assistive technology`);
}

const recoveryCopy = [
  ['CommentBox.tsx', 'try again'],
  ['AttachmentUploader.tsx', 'try again'],
  ['AiReviewPanel.tsx', 'try Run AI review again'],
  ['MarkReadButton.tsx', 'try Mark as read again'],
  ['MarkAllReadButton.tsx', 'try Mark all as read again'],
  ['DeleteRequestDialog.tsx', 'retrying is safe'],
  ['TaskUpdatePanel.tsx', 'try Save changes again'],
];
for (const [file, phrase] of recoveryCopy) {
  ok(read(`src/components/${file}`).includes(phrase), `${file}: error gives a recovery action`);
}

const failed = checks.filter(({ condition }) => !condition);
for (const { condition, message } of checks) console.log(`${condition ? '✅' : '❌'} ${message}`);
console.log(`\n${checks.length - failed.length} passed, ${failed.length} failed`);
if (failed.length) process.exit(1);
