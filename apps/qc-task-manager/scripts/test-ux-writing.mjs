import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const doc = readFileSync(join(root, 'docs/UX-WRITING.md'), 'utf8');
const checks = [
  ['terminology dictionary', '## Terminology dictionary'],
  ['submit label', 'Submit for review'],
  ['return label', 'Return for changes'],
  ['AI boundary', 'AI does not approve, reject, or decide QC outcomes.'],
  ['error recovery pattern', 'What happened'],
  ['localization guidance', 'Arabic'],
];

for (const [name, text] of checks) {
  if (!doc.includes(text)) throw new Error(`UX writing contract missing: ${name}`);
}

const sourceChecks = [
  ['task completion action', 'src/components/TaskLifecycle.tsx', 'Complete task'],
  ['task cancellation escape', 'src/components/TaskLifecycle.tsx', 'Keep task'],
  ['deletion confirmation', 'src/components/ReviewDeleteRequestDialog.tsx', 'Confirm deletion'],
  ['AI advisory label', 'src/components/AiReviewPanel.tsx', 'Human review required'],
];

for (const [name, file, text] of sourceChecks) {
  const source = readFileSync(join(root, file), 'utf8');
  if (!source.toLowerCase().includes(text.toLowerCase())) throw new Error(`UX writing source contract missing: ${name}`);
}

console.log(`UX writing contract: ${checks.length + sourceChecks.length}/${checks.length + sourceChecks.length}`);
