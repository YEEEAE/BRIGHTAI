import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const files = [
  'src/components/lab/LabEquipmentForm.astro',
  'src/components/lab/LabProductForm.astro',
  'src/components/lab/LabCalibrationForm.astro',
  'src/components/lab/LabTemplateForm.astro',
  'src/components/lab/LabDocumentEditor.astro',
  'src/components/NewTaskForm.astro',
];

let passed = 0;
let failed = 0;
function ok(condition, message) {
  if (condition) {
    passed += 1;
    console.log(`  ✅ ${message}`);
  } else {
    failed += 1;
    console.log(`  ❌ ${message}`);
  }
}

for (const relative of files) {
  const source = readFileSync(join(root, relative), 'utf8');
  ok(source.includes('data-qc-form'), `${relative}: shared productivity contract`);
  ok(source.includes('data-qc-actions'), `${relative}: action bar contract`);
}

const helper = readFileSync(join(root, 'public/scripts/form-productivity.js'), 'utf8');
ok(helper.includes('beforeunload'), 'shared helper protects unsaved changes');
ok(helper.includes('checkValidity'), 'shared helper owns validation summary');
ok(helper.includes('submitted'), 'shared helper prevents double submit and shows loading');

const labTest = readFileSync(join(root, 'src/components/lab/LabTestForm.tsx'), 'utf8');
ok(labTest.includes('Duplicate previous row'), 'lab test grid exposes duplicate previous row');
ok(labTest.includes('Undo last paste'), 'lab test grid exposes paste undo');
ok(labTest.includes('Review before sending') && labTest.includes('Confirm and send for review'), 'lab test submit has explicit review confirmation');
ok(labTest.includes("type SaveState = 'saved' | 'unsaved' | 'saving' | 'failed'"), 'lab test exposes explicit save state contract');
ok(labTest.includes('aria-label="Form sections"') && labTest.includes('Not started') && labTest.includes('In progress'), 'lab test section navigation exposes text status');

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
