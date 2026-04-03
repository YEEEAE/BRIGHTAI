import fs from 'node:fs';
import path from 'node:path';

const root = '/Users/yzydalshmry/Desktop/BRIGHTAI';

const targets = [
  {
    htmlPath: 'ai-scolecs/index.html',
    cssPath: 'frontend/css/ai-scolecs-inline.css',
  },
  {
    htmlPath: 'interview/index.html',
    cssPath: 'frontend/css/interview-inline.css',
  },
  {
    htmlPath: 'en/interview/index.html',
    cssPath: 'frontend/css/en-interview-inline.css',
  },
  {
    htmlPath: 'tenders/index.html',
    cssPath: 'frontend/css/tenders-index-inline.css',
  },
  {
    htmlPath: 'en/tenders/templates.html',
    cssPath: 'frontend/css/en-tenders-templates-inline.css',
  },
];

for (const target of targets) {
  const htmlAbs = path.join(root, target.htmlPath);
  const cssAbs = path.join(root, target.cssPath);
  const cssUrl = `/${target.cssPath}`;

  let html = fs.readFileSync(htmlAbs, 'utf8');
  if (html.includes(`href="${cssUrl}"`) || html.includes(`href='${cssUrl}'`)) {
    console.log(`skipped: ${target.htmlPath}`);
    continue;
  }

  const matches = [...html.matchAll(/<style([^>]*)>([\s\S]*?)<\/style>/gi)];
  if (!matches.length) {
    console.warn(`no-inline-style: ${target.htmlPath}`);
    continue;
  }

  const largest = matches.reduce((best, current) => current[2].length > best[2].length ? current : best);
  const fullMatch = largest[0];
  const cssBody = largest[2].trim();

  fs.mkdirSync(path.dirname(cssAbs), { recursive: true });
  fs.writeFileSync(cssAbs, `${cssBody}\n`);

  html = html.replace(fullMatch, `<link rel="stylesheet" href="${cssUrl}" />`);
  fs.writeFileSync(htmlAbs, html);
  console.log(`externalized: ${target.htmlPath} -> ${target.cssPath}`);
}
