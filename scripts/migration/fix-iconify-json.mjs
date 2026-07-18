import fs from 'fs';
import path from 'path';

const dir = 'src/data/migrated-pages';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
let total = 0;

// iconify pattern for actual HTML (not JSON-escaped)
const pattern = /<iconify-icon[^>]*?icon="([^"]+)"[^>]*?>\s*<\/iconify-icon>/g;
// Also handle self-closing
const patternSelf = /<iconify-icon[^>]*?icon="([^"]+)"[^>]*?\/>/g;

for (const file of files) {
  const fp = path.join(dir, file);
  const raw = fs.readFileSync(fp, 'utf8');
  if (!raw.includes('iconify')) continue;

  // Parse JSON properly, process HTML fields, write back
  let data;
  try {
    data = JSON.parse(raw);
  } catch(e) {
    console.error('  PARSE ERROR in', file, e.message);
    continue;
  }

  let count = 0;
  
  function processHtml(html) {
    if (typeof html !== 'string') return html;
    let result = html;
    result = result.replace(pattern, (match, iconName) => {
      const spriteId = iconName.replace(':', '-');
      count++;
      return `<svg class="inline-icon" aria-hidden="true"><use href="/icons.svg#${spriteId}"></use></svg>`;
    });
    result = result.replace(patternSelf, (match, iconName) => {
      const spriteId = iconName.replace(':', '-');
      count++;
      return `<svg class="inline-icon" aria-hidden="true"><use href="/icons.svg#${spriteId}"></use></svg>`;
    });
    return result;
  }

  // Process all string fields that might contain HTML
  function processObj(obj) {
    if (typeof obj === 'string') return processHtml(obj);
    if (Array.isArray(obj)) return obj.map(processObj);
    if (obj && typeof obj === 'object') {
      const result = {};
      for (const [k, v] of Object.entries(obj)) {
        result[k] = processObj(v);
      }
      return result;
    }
    return obj;
  }

  data = processObj(data);
  
  if (count > 0) {
    fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
    total += count;
    console.log(`${file}: ${count}`);
  }
}
console.log('Total:', total);