const fs = require('fs');
const path = require('path');
const glob = require('glob');
const { getIconData } = require('@iconify/utils');

const root = path.resolve(__dirname, '..');

const patterns = [
  'index.html',
  'docs.html',
  '404.html',
  '500.html',
  'frontend/**/*.html',
  'frontend/**/*.js',
  'services/**/*.html',
  'docs/**/*.html'
];

const files = patterns.flatMap((pattern) => glob.sync(path.join(root, pattern), { nodir: true }));

const iconNames = new Set();
const regexes = [
  /icon\s*=\s*["']([a-z0-9-]+:[a-z0-9-]+)["']/gi,
  /data-icon\s*=\s*["']([a-z0-9-]+:[a-z0-9-]+)["']/gi,
  /icon\s*:\s*["']([a-z0-9-]+:[a-z0-9-]+)["']/gi
];

for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');
  for (const re of regexes) {
    let match;
    while ((match = re.exec(text)) !== null) {
      const name = match[1];
      if (!name || name.startsWith('http')) continue;
      iconNames.add(name);
    }
  }
}

const byPrefix = new Map();
for (const icon of iconNames) {
  const [prefix, name] = icon.split(':');
  if (!prefix || !name) continue;
  if (!byPrefix.has(prefix)) byPrefix.set(prefix, new Set());
  byPrefix.get(prefix).add(name);
}

const output = [];
const missingIcons = [];
const missingSets = [];

for (const [prefix, names] of byPrefix.entries()) {
  let iconSet;
  try {
    iconSet = require(`@iconify/json/json/${prefix}.json`);
  } catch (err) {
    missingSets.push(prefix);
    continue;
  }

  const icons = {};
  for (const name of names) {
    const data = getIconData(iconSet, name);
    if (!data) {
      missingIcons.push(`${prefix}:${name}`);
      continue;
    }
    icons[name] = data;
  }

  if (Object.keys(icons).length) {
    output.push({
      prefix,
      icons,
      width: iconSet.width,
      height: iconSet.height
    });
  }
}

const outPath = path.join(root, 'frontend/js/iconify-preload.js');
let js = '/* Auto-generated: Iconify preload */\n';
js += 'window.IconifyPreload = window.IconifyPreload || [];\n';
for (const set of output) {
  js += `window.IconifyPreload.push(${JSON.stringify(set)});\n`;
}
fs.writeFileSync(outPath, js);

const reportPath = path.join(root, 'brightai_orchestrator_output/iconify-missing.json');
fs.writeFileSync(reportPath, JSON.stringify({ missingSets, missingIcons }, null, 2));

console.log(`Icons found: ${iconNames.size}`);
console.log(`Icon sets: ${output.length}`);
if (missingSets.length) console.log('Missing sets:', missingSets.join(', '));
if (missingIcons.length) console.log('Missing icons:', missingIcons.length);
