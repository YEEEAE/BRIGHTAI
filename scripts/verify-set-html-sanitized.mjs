#!/usr/bin/env node
/**
 * verify-set-html-sanitized.mjs — KRN-012 CI guard
 *
 * Enforces that every `set:html={...}` in `src/` is either:
 *   (a) wrapped in DOMPurify.sanitize(...) — build-time sanitized, or
 *   (b) a string constant defined in the SAME source file (static literal),
 *       including:
 *         - top-level `const NAME = "..."` / `'...'` / `\`...\``
 *         - top-level `const OBJ = { ..., prop: "..." }` followed by `OBJ.prop`
 *         - Astro props destructure with string default: `{ consentLabel = '...' } = Astro.props`
 *         - `JSON.stringify(NAME)` when NAME is a top-level object literal
 *         - `someFn(arg)` when `someFn` is defined in same file (assumes safe,
 *           as functions in kernel/icon components always return static SVG strings
 *           from same-file consts)
 *
 * Rationale (KRN-012): build-time-authored HTML strings from JSON, TS modules,
 * content collections, or other files can contain <script> tags. set:html
 * bypasses Astro's default escaping, so every non-static source must be
 * sanitized through DOMPurify before render. This script prevents regressions.
 *
 * Forbidden patterns (will fail CI):
 *   <div set:html={someImportedVar.html} />               — imported HTML
 *   <div set:html={faqs[i].a} />                          — index access (non-static)
 *   <div set:html={data} />                               — non-static
 *
 * Usage:
 *   node scripts/verify-set-html-sanitized.mjs
 *   node scripts/verify-set-html-sanitized.mjs --src=./src
 *
 * Exit codes:
 *   0 — all set:html calls comply
 *   1 — at least one violation found (printed to stderr with file:line)
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, join, relative, resolve } from 'node:path';

const args = process.argv.slice(2);
let srcDir = './src';
for (const arg of args) {
  if (arg.startsWith('--src=')) srcDir = arg.slice('--src='.length);
}
const srcAbs = resolve(srcDir);

const EXTENSIONS = new Set(['.astro', '.tsx', '.ts', '.jsx', '.js']);
const SKIP_DIRS = new Set(['node_modules', '.astro', 'dist', '.git']);

/**
 * Walk `srcAbs` and yield all candidate source files.
 */
function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) yield* walk(full);
    else if (EXTENSIONS.has(extname(entry))) yield full;
  }
}

/**
 * Find all `set:html={...}` occurrences with brace counting.
 */
function findSetHtmlCalls(content) {
  const calls = [];
  const re = /set:html\s*=\s*\{/g;
  let m;
  while ((m = re.exec(content)) !== null) {
    const braceStart = m.index + m[0].length - 1;
    let depth = 1;
    let i = braceStart + 1;
    while (i < content.length && depth > 0) {
      const ch = content[i];
      if (ch === '{') depth++;
      else if (ch === '}') depth--;
      else if (ch === "'" || ch === '"' || ch === '`') {
        i = skipString(content, i, ch);
        continue;
      }
      i++;
    }
    if (depth !== 0) continue;
    const expr = content.slice(braceStart + 1, i - 1).trim();
    const line = content.slice(0, m.index).split('\n').length;
    calls.push({ expr, line });
  }
  return calls;
}

function skipString(content, start, quote) {
  let i = start + 1;
  while (i < content.length) {
    const ch = content[i];
    if (ch === '\\') { i += 2; continue; }
    if (ch === quote) return i + 1;
    i++;
  }
  return i;
}

/** Walk backwards past a string literal opened with `quote` at index `start`. */
function skipStringBackwards(content, start, quote) {
  let i = start - 1;
  while (i >= 0) {
    const ch = content[i];
    if (ch === quote) return i - 1;
    if (ch === '\\') { i -= 2; continue; }
    i--;
  }
  return i;
}

/**
 * Split the frontmatter from an .astro file.
 */
function splitFrontmatter(content) {
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---\n/);
  if (!fmMatch) return { frontmatter: '', body: content, hasFrontmatter: false };
  return {
    frontmatter: fmMatch[1],
    body: content.slice(fmMatch[0].length),
    hasFrontmatter: true,
  };
}

/**
 * Scan the frontmatter / body for static-literal definitions. The matcher uses
 * well-formed regex with backreference to the same quote char so multi-line
 * template literals and strings containing the other two quote kinds parse
 * correctly.
 *
 * @returns {{
 *   simpleConsts: Map<string, string>,
 *   objectProps: Array<{obj: string, prop: string, value: string}>,
 *   destructuredWithDefaults: Set<string>,
 *   functionDefs: Set<string>,
 * }}
 */
function scanStaticDefs(scope) {
  const simpleConsts = new Map();
  const objectProps = [];
  const objectConsts = new Set();
  const arrayConsts = new Set();
  const destructuredWithDefaults = new Set();
  const functionDefs = new Set();

  // (1) top-level const NAME = <quote>value<quote>
  //     allows the closing quote on the same or following line, then
  //     optional whitespace + ; | , | )
  const SIMPLE_CONST = /^\s*(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*(?::\s*[\w<>\s|,&[\]"'`]+)?\s*=\s*(['"`])((?:\\.|(?!\2)[\s\S])*?)\2\s*[,;)\n}]/gm;
  let m;
  while ((m = SIMPLE_CONST.exec(scope)) !== null) {
    const name = m[1];
    const value = m[3];
    if (!simpleConsts.has(name)) simpleConsts.set(name, value);
  }

  // (2) top-level object literal: const OBJ = { ... prop: '<value>', ... }
  //     For each, capture every "key: 'value'" pair. Multi-line tolerated.
  //     Use a brace-counting mini scanner per occurrence.
  const OBJ_DECL = /^\s*(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*(?::\s*[\w<>\s|,&[\]]+)?\s*=\s*\{/gm;
  while ((m = OBJ_DECL.exec(scope)) !== null) {
    const objName = m[1];
    objectConsts.add(objName);
    const openBraceIdx = m.index + m[0].length - 1;
    // find matching `}`
    let depth = 1;
    let i = openBraceIdx + 1;
    while (i < scope.length && depth > 0) {
      const ch = scope[i];
      if (ch === '{') depth++;
      else if (ch === '}') depth--;
      else if (ch === "'" || ch === '"' || ch === '`') {
        i = skipString(scope, i, ch);
        continue;
      }
      i++;
    }
    if (depth !== 0) continue;
    const block = scope.slice(openBraceIdx + 1, i - 1);
    const propRe = /([A-Za-z_$][\w$]*)\s*:\s*(['"`])((?:\\.|(?!\2)[\s\S])*?)\2/g;
    let pm;
    while ((pm = propRe.exec(block)) !== null) {
      objectProps.push({ obj: objName, prop: pm[1], value: pm[3] });
    }
  }

  // (2.5) top-level array literal
  const ARR_DECL = /^\s*(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*(?::\s*[\w<>\s,|&\[\]]+)?\s*=\s*\[/gm;
  while ((m = ARR_DECL.exec(scope)) !== null) {
    arrayConsts.add(m[1]);
  }

  // (3) Astro props destructure with string literal default
  //     `const { a, b = 'x', c } = Astro.props`
  // Strategy: match the WHOLE destructure at once with a regex. This avoids
  // the brittle brace-walking approach which fails on nested braces in
  // default values (e.g. `<svg>...</svg>` as iconSvg default).
  const propsDestrRe = /const\s*\{([^}]*)\}\s*=\s*Astro\s*\.\s*props/g;
  let pd;
  while ((pd = propsDestrRe.exec(scope)) !== null) {
    const inside = pd[1];
    const destDefaultRe = /([A-Za-z_$][\w$]*)\s*=\s*(['"`])((?:\\.|(?!\2)[\s\S])*?)\2/g;
    let dm;
    while ((dm = destDefaultRe.exec(inside)) !== null) {
      destructuredWithDefaults.add(dm[1]);
    }
  }

  // (4) function declarations: `function NAME(...) : TYPE? { ... }`
  const fnRe = /\bfunction\s+([A-Za-z_$][\w$]*)\s*\(/g;
  while ((m = fnRe.exec(scope)) !== null) {
    functionDefs.add(m[1]);
  }

  return {
    simpleConsts,
    objectProps,
    objectConsts,
    arrayConsts,
    destructuredWithDefaults,
    functionDefs,
  };
}

/** A "safe" literal: a string that does not contain `<script` (defense in depth). */
function isSafeLiteral(literal) {
  if (typeof literal !== 'string') return false;
  return !/<script\b/i.test(literal);
}

/** Evaluate one set:html expression against the file's static defs. */
function classify(expr, defs) {
  // (a) explicit sanitize
  if (/^DOMPurify\.sanitize\s*\(/.test(expr)) {
    return { ok: true, reason: 'wrapped in DOMPurify.sanitize()' };
  }
  // (b) JSON.stringify(NAME)
  const jsonStrMatch = expr.match(/^JSON\.stringify\s*\(\s*([A-Za-z_$][\w$]*)\s*\)$/);
  if (jsonStrMatch) {
    const name = jsonStrMatch[1];
    if (
      defs.simpleConsts.has(name) ||
      defs.objectConsts.has(name) ||
      defs.arrayConsts.has(name) ||
      defs.objectProps.some((p) => p.obj === name)
    ) {
      return { ok: true, reason: `JSON.stringify(${name}) — local const` };
    }
    return { ok: false, reason: `JSON.stringify(${name}) — ${name} not resolved to a local const` };
  }
  // (c) bare identifier
  const idMatch = expr.match(/^([A-Za-z_$][\w$]*)$/);
  if (idMatch) {
    const name = idMatch[1];
    if (defs.simpleConsts.has(name) && isSafeLiteral(defs.simpleConsts.get(name))) {
      return { ok: true, reason: `same-file const ${name}` };
    }
    if (defs.destructuredWithDefaults.has(name)) {
      return { ok: true, reason: `Astro.props destructure default for ${name}` };
    }
    return { ok: false, reason: `identifier "${name}" is not a top-level string-literal const in this file` };
  }
  // (d) NAME.PROP
  const propMatch = expr.match(/^([A-Za-z_$][\w$]*)\.([A-Za-z_$][\w$]*)$/);
  if (propMatch) {
    const obj = propMatch[1];
    const prop = propMatch[2];
    const def = defs.objectProps.find((p) => p.obj === obj && p.prop === prop);
    if (def && isSafeLiteral(def.value)) {
      return { ok: true, reason: `same-file ${obj}.${prop} property literal` };
    }
    return { ok: false, reason: `property "${obj}.${prop}" is not a same-file property literal` };
  }
  // (e) FUNC(ARGS)
  const fnMatch = expr.match(/^([A-Za-z_$][\w$]*)\s*\(([^)]*)\)$/);
  if (fnMatch) {
    const fn = fnMatch[1];
    if (defs.functionDefs.has(fn)) {
      return { ok: true, reason: `same-file function ${fn}() (static SVG/component)` };
    }
    return { ok: false, reason: `function "${fn}" not defined in this file (potentially external input)` };
  }
  return { ok: false, reason: `expression "${expr}" is not a same-file static literal` };
}

function checkFile(absPath) {
  const content = readFileSync(absPath, 'utf8');
  const { frontmatter, hasFrontmatter } = splitFrontmatter(content);
  const scope = hasFrontmatter ? frontmatter : content;
  const defs = scanStaticDefs(scope);
  if (process.env.DOM_PURIFY_DEBUG && absPath.endsWith('KernelEmptyState.astro')) {
    console.error('[debug]', absPath);
    console.error('  simpleConsts keys:', Array.from(defs.simpleConsts.keys()));
    console.error('  destructuredWithDefaults:', Array.from(defs.destructuredWithDefaults));
    console.error('  objectProps sample:', defs.objectProps.slice(0, 3));
  }
  const calls = findSetHtmlCalls(content);
  const violations = [];
  for (const call of calls) {
    const result = classify(call.expr, defs);
    if (!result.ok) {
      violations.push({
        file: relative(process.cwd(), absPath),
        line: call.line,
        expr: call.expr,
        reason: result.reason,
      });
    }
  }
  return violations;
}

function main() {
  const violations = [];
  for (const f of walk(srcAbs)) violations.push(...checkFile(f));
  if (violations.length === 0) {
    console.log(`[verify-set-html-sanitized] OK — every set:html call in ${srcDir}/ is sanitized or a same-file literal.`);
    process.exit(0);
  }
  console.error(`[verify-set-html-sanitized] FAIL — ${violations.length} non-sanitized set:html call(s) found:\n`);
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line}  ${v.expr}`);
    console.error(`    → ${v.reason}`);
  }
  console.error(`\nFix: wrap with DOMPurify.sanitize(...) in the frontmatter, or move the string to a same-file const this script can detect.`);
  process.exit(1);
}

main();
