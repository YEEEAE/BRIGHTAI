#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import { glob } from "glob";

const ROOT = process.cwd();
const BASE_DIR = "ai-mais/public";

function toPosix(filePath) {
  return filePath.split(path.sep).join("/");
}

function ensureDotPrefix(relPath) {
  if (!relPath || relPath.startsWith(".") || relPath.startsWith("/")) {
    return relPath;
  }
  return `./${relPath}`;
}

function buildRelative(fromFile, targetFile) {
  const fromDir = path.posix.dirname(fromFile);
  const rel = path.posix.relative(fromDir, targetFile);
  return ensureDotPrefix(rel || "./");
}

const htmlFiles = await glob(`${BASE_DIR}/**/*.html`, {
  cwd: ROOT,
  nodir: true,
});

let changedFiles = 0;
let changedLinks = 0;

for (const relFile of htmlFiles) {
  const posixFile = toPosix(relFile);
  const absPath = path.join(ROOT, relFile);
  const original = await fs.readFile(absPath, "utf8");

  const dashboardPath = buildRelative(posixFile, `${BASE_DIR}/dashboard.html`);
  const uploadsPath = buildRelative(posixFile, `${BASE_DIR}/uploads.html`);
  const rejectsPath = buildRelative(posixFile, `${BASE_DIR}/analytics/rejects.html`);
  const areasPath = buildRelative(posixFile, `${BASE_DIR}/analytics/areas.html`);

  const replacements = new Map([
    ["/dashboard", dashboardPath],
    ["/tasks", `${dashboardPath}#tasks`],
    ["/plans", `${dashboardPath}#plans`],
    ["/ai-mais/public/analytics/rejects", rejectsPath.replace(/\.html$/, "")],
    ["/ai-mais/public/analytics/areas", areasPath.replace(/\.html$/, "")],
    ["/ai-mais/public/uploads", uploadsPath.replace(/\.html$/, "")],
  ]);

  let updated = original;
  for (const [fromValue, toValue] of replacements.entries()) {
    if (updated.includes(fromValue)) {
      const next = updated.split(fromValue).join(toValue);
      if (next !== updated) {
        const delta = updated.split(fromValue).length - 1;
        changedLinks += delta;
        updated = next;
      }
    }
  }

  if (updated !== original) {
    await fs.writeFile(absPath, updated, "utf8");
    changedFiles += 1;
  }
}

console.log(`AI-MAIS nav links updated in ${changedFiles} files.`);
console.log(`Links rewritten: ${changedLinks}`);
