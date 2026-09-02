import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const sourceRoot = join(root, 'src');
const files = [];
function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) walk(path);
    else if (/\.(astro|tsx|ts)$/.test(entry.name)) files.push(path);
  }
}
walk(sourceRoot);
const source = files.map((file) => readFileSync(file, 'utf8')).join('\n');
const rules = [
  ['source inventory', files.length >= 300],
  ['error recovery contract', source.includes('No changes were saved') && source.includes('retrying is safe')],
  ['destructive action names object and consequence', source.includes('Delete task permanently')],
  ['empty state gives next action', source.includes('Create the first record')],
  ['AI decision boundary', source.includes('AI does not approve, reject, or decide QC outcomes.')],
  ['no bare Delete button', !/>\s*Delete\s*</.test(source)],
  ['no bare Submit button', !/>\s*Submit\s*</.test(source)],
  ['no bare Reset button', !/>\s*Reset\s*</.test(source)],
  ['no implementation error language', !source.includes('Something went wrong')],
];
const failures = rules.filter(([, pass]) => !pass);
if (failures.length) throw new Error(`CONTENT-QUALITY-100 failed: ${failures.map(([name]) => name).join(', ')}`);
console.log(`CONTENT-QUALITY-100: PASS (${rules.length}/${rules.length} rules; ${files.length} source files inventoried)`);
