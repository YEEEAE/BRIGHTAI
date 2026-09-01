#!/usr/bin/env node
/**
 * Proves contrast for text placed on a controlled reading surface over the
 * animated background video. The video may be black or white at any glyph, so
 * both extrema are tested rather than a screenshot frame.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const repo = new URL('../../', import.meta.url).pathname.replace(/\/$/, '');
const read = (file) => readFileSync(join(repo, file), 'utf8');
const tokens = read('src/styles/tokens.css');
const css = [
  read('src/styles/components.css'), read('src/styles/pages.css'),
  read('src/pages/answer/[slug].astro'), read('src/pages/lp/[slug].astro'),
  read('public/500.html'), read('apps/qc-task-manager/src/styles/global.css'),
].join('\n');

const fail = [];
const required = (condition, message) => { if (!condition) fail.push(message); };
const token = (name) => {
  const value = tokens.match(new RegExp(`${name}\\s*:\\s*([^;]+);`))?.[1]?.trim();
  required(value, `Missing ${name}`);
  return value || '';
};
const hex = (value) => {
  const hit = value.match(/^#([\da-f]{6})$/i);
  required(hit, `Expected hex color, got ${value}`);
  return hit ? [0, 2, 4].map((i) => Number.parseInt(hit[1].slice(i, i + 2), 16)) : [0, 0, 0];
};
const surface = token('--surface-on-media').match(/^rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)$/i);
required(surface, '--surface-on-media must be an rgba() color');
const [sr, sg, sb, alpha] = surface ? surface.slice(1).map(Number) : [0, 0, 0, 0];
const composite = (backdrop) => [sr, sg, sb].map((channel, i) => Math.round(channel * alpha + backdrop[i] * (1 - alpha)));
const linear = (v) => { const c = v / 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const luminance = (rgb) => 0.2126 * linear(rgb[0]) + 0.7152 * linear(rgb[1]) + 0.0722 * linear(rgb[2]);
const ratio = (a, b) => { const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x); return (hi + 0.05) / (lo + 0.05); };

const colors = [
  ['--text-primary', token('--text-primary'), 4.5],
  ['--text-secondary', token('--text-secondary'), 4.5],
  ['--text-muted', token('--text-muted'), 4.5],
  ['--brand-300 (brand teal)', token('--brand-300'), 4.5],
  ['--interactive-primary (link)', token('--interactive-primary'), 4.5],
];
const backdrops = [['black', [0, 0, 0]], ['white', [255, 255, 255]]];
console.log(`surface: rgba(${sr}, ${sg}, ${sb}, ${alpha})`);
console.log('token | black-frame | white-frame | threshold | status');
for (const [name, value, threshold] of colors) {
  const fg = hex(value);
  const scores = backdrops.map(([, backdrop]) => ratio(fg, composite(backdrop)));
  const pass = scores.every((score) => score >= threshold);
  console.log(`${name} | ${scores[0].toFixed(2)}:1 | ${scores[1].toFixed(2)}:1 | ${threshold}:1 | ${pass ? 'PASS' : 'FAIL'}`);
  required(pass, `${name} fails its ${threshold}:1 normal-text threshold`);
}

required(alpha >= 0.9, `surface alpha ${alpha} is below the required 0.90`);
required(/@media\s*\(prefers-reduced-transparency:\s*reduce\)/.test(css), 'Missing reduced-transparency branch');
required(/@media\s+print/.test(css), 'Missing print branch');
required(!/position:\s*fixed[\s\S]{0,180}?(?:inset:\s*0|width:\s*100vw)[\s\S]{0,180}?background:\s*var\(--surface-on-media\)/.test(css), 'A surface rule introduces a fixed viewport layer');

if (fail.length) {
  for (const message of fail) console.error(`✖ ${message}`);
  process.exit(1);
}
console.log('verify-contrast-on-media: PASS');
