import assert from 'node:assert/strict';
import { readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const workspaceRoot = path.resolve(fileURLToPath(new URL('..', import.meta.url)));

function countFiles(dirPath, extensions) {
  let count = 0;
  const entries = readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      count += countFiles(fullPath, extensions);
      continue;
    }

    if (extensions.has(path.extname(entry.name).toLowerCase())) {
      count += 1;
    }
  }

  return count;
}

test('frontend workspace keeps expected top-level folders', () => {
  for (const folder of ['css', 'js', 'pages']) {
    const target = path.join(workspaceRoot, folder);
    assert.equal(statSync(target).isDirectory(), true, `${folder} folder is missing`);
  }
});

test('frontend workspace contains static entry files', () => {
  const htmlCount = countFiles(path.join(workspaceRoot, 'pages'), new Set(['.html']));
  const cssCount = countFiles(path.join(workspaceRoot, 'css'), new Set(['.css']));
  const jsCount = countFiles(path.join(workspaceRoot, 'js'), new Set(['.js']));

  assert.ok(htmlCount > 0, 'No HTML pages found under frontend/pages');
  assert.ok(cssCount > 0, 'No CSS files found under frontend/css');
  assert.ok(jsCount > 0, 'No JS files found under frontend/js');
});
