#!/usr/bin/env node

import { promises as fs } from "fs";
import path from "path";

const ROOT = process.cwd();
const OUTPUT_DIR = path.join(ROOT, ".render-static");

const TOP_LEVEL_EXCLUDES = new Set([
  ".git",
  ".github",
  ".agents",
  ".render-static",
  "node_modules",
  "backend",
  "brightai-platform",
  "coverage",
  "dist",
  "build",
  "tmp",
]);

const PATH_EXCLUDES = [
  /^frontend\/pages(?:\/|$)/i,
];

function toPosix(relPath) {
  return relPath.split(path.sep).join("/");
}

function shouldExclude(relPath) {
  const normalized = toPosix(relPath);
  return PATH_EXCLUDES.some((pattern) => pattern.test(normalized));
}

async function copyEntry(sourcePath, destinationPath, relPath = "") {
  if (relPath && shouldExclude(relPath)) {
    return;
  }

  const stat = await fs.stat(sourcePath);
  if (stat.isDirectory()) {
    await fs.mkdir(destinationPath, { recursive: true });
    const entries = await fs.readdir(sourcePath, { withFileTypes: true });
    for (const entry of entries) {
      const childSource = path.join(sourcePath, entry.name);
      const childDestination = path.join(destinationPath, entry.name);
      const childRelPath = relPath ? path.join(relPath, entry.name) : entry.name;
      await copyEntry(childSource, childDestination, childRelPath);
    }
    return;
  }

  await fs.mkdir(path.dirname(destinationPath), { recursive: true });
  await fs.copyFile(sourcePath, destinationPath);
}

async function main() {
  await fs.rm(OUTPUT_DIR, { recursive: true, force: true });
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  const rootEntries = await fs.readdir(ROOT, { withFileTypes: true });
  for (const entry of rootEntries) {
    if (TOP_LEVEL_EXCLUDES.has(entry.name)) {
      continue;
    }

    const sourcePath = path.join(ROOT, entry.name);
    const destinationPath = path.join(OUTPUT_DIR, entry.name);
    await copyEntry(sourcePath, destinationPath, entry.name);
  }

  process.stdout.write(`Prepared clean Render publish directory at ${OUTPUT_DIR}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error?.stack || error}\n`);
  process.exitCode = 1;
});
