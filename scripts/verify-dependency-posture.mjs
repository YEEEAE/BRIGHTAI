import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';

// Repeatable, offline proof that the dependency-security exceptions recorded in
// docs/DEPENDENCY-SECURITY-2026-11-10.md are still valid for this checkout.
// Each exception rests on a code fact (an unreachable code path), so the fact is
// asserted here instead of being trusted from the report.
//
//   npm run build
//   node scripts/verify-dependency-posture.mjs
//
// No network, no secrets: it reads the committed manifest, lockfile, source tree
// and build output only.
const ROOT = new URL('../', import.meta.url);
const read = relative => readFileSync(new URL(relative, ROOT), 'utf8');
const exists = relative => existsSync(new URL(relative, ROOT));

const results = [];
const check = (name, fn) => {
  try {
    fn();
    results.push({ name, status: 'PASS' });
  } catch (error) {
    results.push({ name, status: 'FAIL', detail: error.message });
  }
};

function walk(relative, files = []) {
  const absolute = new URL(relative, ROOT);
  if (!existsSync(absolute)) return files;
  for (const entry of readdirSync(absolute)) {
    const child = `${relative}${entry}`;
    const info = statSync(new URL(child, ROOT));
    if (info.isDirectory()) walk(`${child}/`, files);
    else files.push(child);
  }
  return files;
}

function assertNoSourceMatch(label, files, pattern) {
  const hits = files.filter(file => pattern.test(read(file)));
  assert.deepEqual(hits, [], `${label} is used in: ${hits.join(', ')}`);
}

const pkg = JSON.parse(read('package.json'));
const lock = JSON.parse(read('package-lock.json'));
const lockRoot = lock.packages[''];
// Application code only: these checks describe what the shipped site can reach.
const sources = walk('src/').filter(file => /\.(astro|mjs|js|ts|mts|md|mdx)$/.test(file));
const pages = walk('src/pages/');

// ---------------------------------------------------------------- toolchain
check('D1 the committed lockfile is the only lockfile and matches the manifest', () => {
  assert(exists('package-lock.json'), 'package-lock.json is missing');
  assert(!exists('pnpm-lock.yaml'), 'a second lockfile would make the install non-reproducible');
  assert(!exists('yarn.lock'), 'a second lockfile would make the install non-reproducible');
  assert.equal(lock.lockfileVersion, 3);
  assert.deepEqual(lockRoot.dependencies, pkg.dependencies, 'lockfile dependencies must equal package.json');
  assert.equal(
    pkg.packageManager,
    undefined,
    'packageManager must not name a package manager whose lockfile is not committed',
  );
  assert.equal(pkg.engines?.pnpm, undefined, 'no pnpm engine when only package-lock.json is committed');
});

// ------------------------------------------------- AVIF RCE (GHSA-26w7-cxv4-gfx2)
// Reachable only when Astro's image service optimizes an untrusted AVIF through
// sharp. The site uses no astro:assets API and ships no /_image endpoint.
check('D2 no Astro image-service entry point exists (GHSA-26w7-cxv4-gfx2 precondition)', () => {
  assertNoSourceMatch('astro:assets', sources, /from\s+['"]astro:assets['"]/);
  assertNoSourceMatch('getImage', sources, /\bgetImage\s*\(/);
  assertNoSourceMatch('the <Image /> component', pages, /<Image\b/);
  assertNoSourceMatch('avif output', sources, /['"]avif['"]/i);
  assert(!/^\s*image\s*:/m.test(read('astro.config.mjs')), 'astro.config.mjs must not configure an image service');
  const endpoints = walk('dist/server/').filter(file => /_image/.test(file));
  assert.deepEqual(endpoints, [], `built output exposes an image endpoint: ${endpoints.join(', ')}`);
});

// ------------------------------------- renderer XSS (GHSA-f48w-9m4c-m7f5)
check('D3 no framework renderer or JSX/MDX page can reach the renderer XSS (GHSA-f48w-9m4c-m7f5)', () => {
  const frameworks = ['@astrojs/react', '@astrojs/preact', '@astrojs/vue', '@astrojs/svelte', '@astrojs/solid-js'];
  const declared = [...Object.keys(pkg.dependencies ?? {}), ...Object.keys(pkg.devDependencies ?? {})];
  assert.deepEqual(frameworks.filter(name => declared.includes(name)), []);
  const componentPages = pages.filter(file => /\.(jsx|tsx|mdx)$/.test(file));
  assert.deepEqual(componentPages, [], `component pages exist: ${componentPages.join(', ')}`);
  assert(!/renderers\s*:/.test(read('astro.config.mjs')), 'astro.config.mjs must not declare renderers');
});

// ------------------- transition/view-transition XSS (GHSA-7pw4-f3q4-r2p2, GHSA-4g3v-8h47-v7g6)
check('D4 no hydration or view-transition directive can reach the directive XSS', () => {
  assertNoSourceMatch('a client: directive', pages.filter(file => file.endsWith('.astro')), /\sclient:(load|idle|visible|media|only)/);
  assertNoSourceMatch('an Astro transition: directive', pages.filter(file => file.endsWith('.astro')), /\stransition:(animate|name|persist)\b/);
  assertNoSourceMatch('ClientRouter/ViewTransitions', sources, /\b(ClientRouter|ViewTransitions)\b/);
});

// ----------------------------- base stripping auth bypass (GHSA-376h-93r7-7g6f)
check('D5 no configured `base` can reach the base stripping bypass (GHSA-376h-93r7-7g6f)', () => {
  assert(!/^\s*base\s*:/m.test(read('astro.config.mjs')), 'astro.config.mjs must not set `base`');
});

// ----------------------------------------------- mutation XSS in JSX/MDX (GHSA-98hj-9722-w3j8)
check('D6 no JSX/MDX <script>/<style> rendering path exists (GHSA-98hj-9722-w3j8)', () => {
  const componentPages = [...walk('src/')].filter(file => /\.(jsx|tsx|mdx)$/.test(file));
  assert.deepEqual(componentPages, [], `JSX/MDX files exist: ${componentPages.join(', ')}`);
});

// ------------------------------------------------------------ exception ledger
check('D7 every recorded exception is complete and unexpired', () => {
  const allowlist = read('.github/security-allowlist.yml');
  const ids = [...allowlist.matchAll(/^\s*-\s+id:\s*'?"?([A-Za-z0-9-]+)'?"?\s*$/gm)].map(match => match[1]);
  const entries = allowlist.split(/^\s*-\s+id:/m).slice(1);
  const required = ['package:', 'severity:', 'justification:', 'expires:', 'added_by:', 'tracking_issue:'];
  const today = new Date().toISOString().slice(0, 10);
  const seen = new Set();
  entries.forEach((entry, index) => {
    const id = ids[index];
    assert.match(id, /^(CVE-\d{4}-\d{4,}|GHSA(-[0-9a-z]{4}){3})$/, `malformed advisory id: ${id}`);
    assert(!seen.has(id), `duplicate advisory id: ${id}`);
    seen.add(id);
    for (const field of required) assert(entry.includes(field), `${id} is missing ${field}`);
    assert.match(entry, /severity:\s*'?(critical|high|moderate|medium|low)'?/, `${id} has an invalid severity`);
    const expires = /expires:\s*'?(\d{4}-\d{2}-\d{2})'?/.exec(entry);
    assert(expires, `${id} has no readable expiry`);
    assert(expires[1] > today, `${id} expired on ${expires[1]}`);
  });
  // Kept in the ledger but never silently ignored: every entry names an owner.
  assert(!/added_by:\s*'?"?'?\s*$/m.test(allowlist), 'every entry needs an owner in added_by');
});

for (const { name, status, detail } of results) console.log(`${status}  ${name}${detail ? ` — ${detail}` : ''}`);
const count = status => results.filter(entry => entry.status === status).length;
console.log(`\n${count('PASS')} PASS / ${count('FAIL')} FAIL`);
if (count('FAIL')) process.exitCode = 1;
