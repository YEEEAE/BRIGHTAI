import fs from 'fs';
import path from 'path';

const SKIP_DIRS = new Set(['node_modules', '__MACOSX', '.git', '.netlify']);

function scanDir(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).flatMap((f) => {
    const full = path.join(dir, f);
    try {
      const stat = fs.statSync(full);
      if (stat.isDirectory()) {
        if (SKIP_DIRS.has(f)) return [];
        return scanDir(full);
      }
      return f.endsWith('.html') ? [full] : [];
    } catch {
      return [];
    }
  });
}

let fixed = 0;
let skipped = 0;
let changedFiles = 0;

for (const file of scanDir('.')) {
  const content = fs.readFileSync(file, 'utf8');

  const updated = content.replace(
    /<link([^>]+)rel="canonical"([^>]+)href="(https:\/\/brightai\.site\/[^"#?]+)"([^>]*)>/gi,
    (match, b1, b2, url, b3) => {
      // Skip file URLs and URLs already ending with slash
      if (url.endsWith('.html') || url.endsWith('.xml') || url.endsWith('/')) return match;
      fixed += 1;
      return `<link${b1}rel="canonical"${b2}href="${url}/"${b3}>`;
    }
  );

  if (updated !== content) {
    fs.writeFileSync(file, updated, 'utf8');
    changedFiles += 1;
    console.log(`Fixed: ${file}`);
  } else {
    skipped += 1;
  }
}

console.log(`\nDone! Fixed links: ${fixed} | Files changed: ${changedFiles} | Skipped files: ${skipped}`);
