import fs from 'node:fs';
import path from 'node:path';

const root = '/Users/yzydalshmry/Desktop/BRIGHTAI';

const targets = [
  {
    htmlPath: 'ai-scolecs/index.html',
    jsPath: 'frontend/js/ai-scolecs-app.js',
  },
  {
    htmlPath: 'interview/index.html',
    jsPath: 'frontend/js/interview-app.js',
  },
  {
    htmlPath: 'en/interview/index.html',
    jsPath: 'frontend/js/en-interview-app.js',
  },
  {
    htmlPath: 'tenders/index.html',
    jsPath: 'frontend/js/tenders-index-app.js',
  },
  {
    htmlPath: 'en/tenders/templates.html',
    jsPath: 'frontend/js/en-tenders-templates-app.js',
  },
];

for (const target of targets) {
  const htmlAbs = path.join(root, target.htmlPath);
  const jsAbs = path.join(root, target.jsPath);
  const jsUrl = `/${target.jsPath}`;

  let html = fs.readFileSync(htmlAbs, 'utf8');
  if (html.includes(`src="${jsUrl}"`) || html.includes(`src='${jsUrl}'`)) {
    console.log(`skipped: ${target.htmlPath}`);
    continue;
  }

  const matches = [...html.matchAll(/<script(?![^>]*src=)([^>]*)>([\s\S]*?)<\/script>/gi)];
  if (!matches.length) {
    console.warn(`no-inline-script: ${target.htmlPath}`);
    continue;
  }

  const largest = matches.reduce((best, current) => current[2].length > best[2].length ? current : best);
  const fullMatch = largest[0];
  const scriptBody = largest[2].trim();

  fs.mkdirSync(path.dirname(jsAbs), { recursive: true });
  fs.writeFileSync(jsAbs, `${scriptBody}\n`);

  html = html.replace(fullMatch, `<script src="${jsUrl}"></script>`);
  fs.writeFileSync(htmlAbs, html);
  console.log(`externalized: ${target.htmlPath} -> ${target.jsPath}`);
}
