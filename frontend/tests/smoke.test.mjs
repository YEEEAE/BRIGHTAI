import assert from 'node:assert/strict';
import { readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const workspaceRoot = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const repoRoot = path.resolve(workspaceRoot, '..');

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
  for (const folder of ['css', 'js']) {
    const target = path.join(workspaceRoot, folder);
    assert.equal(statSync(target).isDirectory(), true, `${folder} folder is missing`);
  }
  for (const folder of ['blog', 'services', 'docs']) {
    const target = path.join(repoRoot, folder);
    assert.equal(statSync(target).isDirectory(), true, `${folder} folder is missing`);
  }
});

test('frontend workspace contains static entry files', () => {
  const htmlCount = ['index.html', 'blog', 'services', 'docs']
    .map((entry) => path.join(repoRoot, entry))
    .reduce((total, target) => {
      if (statSync(target).isFile()) return total + 1;
      return total + countFiles(target, new Set(['.html']));
    }, 0);
  const cssCount = countFiles(path.join(workspaceRoot, 'css'), new Set(['.css']));
  const jsCount = countFiles(path.join(workspaceRoot, 'js'), new Set(['.js']));

  assert.ok(htmlCount > 0, 'No HTML pages found in the static site');
  assert.ok(cssCount > 0, 'No CSS files found under frontend/css');
  assert.ok(jsCount > 0, 'No JS files found under frontend/js');
});
