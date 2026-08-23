import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const files = {
  documents: join(root, 'src/pages/lab/documents/index.astro'),
  detail: join(root, 'src/pages/lab/documents/[id].astro'),
  badge: join(root, 'src/components/lab/LabDocumentStatusBadge.astro'),
  versions: join(root, 'src/pages/lab/documents/[id]/versions.astro'),
  changes: join(root, 'src/pages/lab/change-requests/[id].astro'),
};

const source = Object.fromEntries(await Promise.all(Object.entries(files).map(async ([key, file]) => [key, await readFile(file, 'utf8')])));
const checks = [
  ['document states remain explicit', ['Missing Content', 'Draft', 'In Review', 'Approved', 'Superseded', 'Archived'].every((label) => source.documents.includes(label) && (source.detail.includes(label) || source.badge.includes(label)))],
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
