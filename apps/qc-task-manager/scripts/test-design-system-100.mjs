import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const failures = [];
const assert = (condition, message) => { if (!condition) failures.push(message); };
const global = read('src/styles/global.css');
const tailwind = read('tailwind.config.mjs');
const uiDirectory = path.join(root, 'src/components/ui');
const uiFiles = fs.readdirSync(uiDirectory).filter((file) => /\.(astro|tsx|ts)$/.test(file));

const tokenNames = [
  'font-sans', 'font-size-xs', 'font-size-2xl', 'line-height-relaxed', 'font-weight-semibold',
  'space-1', 'space-16', 'radius-sm', 'radius-pill', 'border-width-default', 'shadow-raised',
  'shadow-overlay', 'elevation-overlay', 'color-surface-page', 'color-surface-elevated', 'color-overlay',
  'color-glass', 'icon-size-md', 'container-content', 'breakpoint-lg', 'motion-fast',
  'motion-ease-standard', 'focus-ring-width', 'color-success', 'color-warning', 'color-danger',
  'color-info', 'color-neutral', 'color-disabled',
];
for (const token of tokenNames) assert(global.includes(`--${token}:`), `Missing token --${token}`);

for (const alias of ['surface', 'content', 'accent', 'success', 'warning', 'danger', 'info', 'neutral', 'disabled', 'overlay', 'glass', 'chart']) {
  assert(tailwind.includes(`${alias}:`), `Missing Tailwind semantic alias ${alias}`);
}

const requiredPrimitives = [
  'AppButton.astro', 'IconButton.astro', 'Input.astro', 'Textarea.astro', 'Select.astro',
  'Checkbox.astro', 'Radio.astro', 'Switch.astro', 'DateControl.astro', 'SearchInput.astro',
  'FormField.astro', 'StatusPill.astro', 'Banner.astro', 'Card.astro', 'Pagination.astro',
  'Breadcrumbs.astro', 'EmptyState.astro', 'Skeleton.astro', 'Toast.astro', 'PageHeader.astro',
  'SectionHeader.astro',
];
for (const primitive of requiredPrimitives) {
  const location = primitive === 'Breadcrumbs.astro' || primitive === 'EmptyState.astro'
    ? path.join(root, 'src/components', primitive)
    : path.join(uiDirectory, primitive);
  assert(fs.existsSync(location), `Missing canonical primitive ${primitive}`);
}

const rawPalette = /(?:bg|text|border|ring|shadow)-(?:slate|gray|blue|red|green|emerald|amber|orange|yellow|sky|indigo|white|black)-\d{2,3}/;
for (const file of uiFiles) {
  const source = fs.readFileSync(path.join(uiDirectory, file), 'utf8');
  assert(!rawPalette.test(source), `Raw palette class in canonical primitive: src/components/ui/${file}`);
  assert(!source.includes('transition-all'), `Unbounded transition in canonical primitive: src/components/ui/${file}`);
}

const docs = read('docs/UI-DESIGN-SYSTEM.md');
assert(docs.includes('Canonical component catalogue'), 'Design-system documentation lacks component catalogue');
assert(docs.includes('Legacy migration boundary'), 'Design-system documentation lacks legacy migration boundary');

if (failures.length) {
  console.error(`DESIGN-SYSTEM-100: FAIL (${failures.length})`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log(`DESIGN-SYSTEM-100: PASS (${tokenNames.length} token checks, ${requiredPrimitives.length} primitive checks, ${uiFiles.length} canonical files)`);
