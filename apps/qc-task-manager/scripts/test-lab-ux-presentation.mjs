import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const files = {
  contextualHelp: join(root, 'src/components/ui/ContextualHelp.astro'),
  accountSecurity: join(root, 'src/pages/account/security.astro'),
  labHome: join(root, 'src/pages/lab/index.astro'),
  newTest: join(root, 'src/pages/lab/tests/new.astro'),
  testForm: join(root, 'src/components/lab/LabTestForm.tsx'),
  review: join(root, 'src/pages/lab/tests/review.astro'),
  documentEditor: join(root, 'src/components/lab/LabDocumentEditor.astro'),
  newChangeRequest: join(root, 'src/pages/lab/change-requests/new.astro'),
  pilotUat: join(root, 'docs/PILOT-UAT.md'),
  documents: join(root, 'src/pages/lab/documents/index.astro'),
  detail: join(root, 'src/pages/lab/documents/[id].astro'),
  badge: join(root, 'src/components/lab/LabDocumentStatusBadge.astro'),
  // Canonical owner of the document status label text (QC-100-ARCHITECTURE-002
  // de-duplicated the copy that used to live in the detail page).
  documentLabels: join(root, 'src/lib/lab/documents.ts'),
  versions: join(root, 'src/pages/lab/documents/[id]/versions.astro'),
  changes: join(root, 'src/pages/lab/change-requests/[id].astro'),
};

const source = Object.fromEntries(await Promise.all(Object.entries(files).map(async ([key, file]) => [key, await readFile(file, 'utf8')])));
const checks = [
  ['contextual help is reusable and disclosure-based', source.contextualHelp.includes('<details') && source.contextualHelp.includes('<summary')],
  ['first-login password help is present', source.accountSecurity.includes('First sign-in')],
  ['role dashboard explains its action queue', source.labHome.includes('Your role dashboard')],
  ['test creation explains draft and submission decisions', source.newTest.includes('Before you start') && source.testForm.includes('Save draft') && source.testForm.includes('Submit for review')],
  ['review and approval help explains the e-signature boundary', source.review.includes('Electronic signature')],
  ['controlled-document lifecycle help is present', source.documentEditor.includes('Document lifecycle')],
  ['change-request help explains proposal handling', source.newChangeRequest.includes('Change request workflow')],
  ['pilot UAT runbook covers roles, capture fields, and classifications', ['Employee scenarios', 'Supervisor scenarios', 'Manager scenarios', 'Admin scenarios', 'Success (Yes / No)', 'P0 — Blocks work, data integrity, or security', 'Do not record results in this runbook before a participant performs the scenario'].every((text) => source.pilotUat.includes(text))],
  ['document states remain explicit', ['Missing Content', 'Draft', 'In Review', 'Approved', 'Superseded', 'Archived'].every((label) => source.documents.includes(label) && (source.detail.includes(label) || source.badge.includes(label) || source.documentLabels.includes(label)))],
  ['shared document badge is used', Object.values(source).some((text) => text.includes('LabDocumentStatusBadge'))],
  ['mobile fallback exists for document list', source.documents.includes('md:hidden') && /hidden[\s\S]{0,100}md:block/.test(source.documents)],
  ['change request exposes audit correlation', source.changes.includes('Audit correlation') || source.changes.includes('audit correlation')],
  ['review note is explicitly announced', source.changes.includes('aria-describedby') && source.changes.includes('review_note')],
  ['primary and destructive actions have focus-visible styles', Object.values(source).every((text) => !text.includes('bg-red-600') || text.includes('focus-visible:'))],
];

let failed = 0;
for (const [label, pass] of checks) {
  console.log(`${pass ? '✅' : '❌'} ${label}`);
  if (!pass) failed += 1;
}
if (failed) process.exit(1);
console.log(`\n${checks.length} UX presentation checks passed.`);
