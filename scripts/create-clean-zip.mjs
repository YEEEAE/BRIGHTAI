#!/usr/bin/env node
import { existsSync } from "node:fs";
import { basename, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const repoRoot = process.cwd();
const includeAgents = process.argv.includes("--include-agents");
const outputArg = process.argv.find((arg) => arg.endsWith(".zip")) || `${basename(repoRoot)}-clean.zip`;
const outputPath = resolve(repoRoot, outputArg);
const outputName = basename(outputPath);

if (existsSync(outputPath)) {
  console.error(`الملف موجود مسبقاً: ${outputPath}`);
  console.error("احذف الملف أو اختر اسماً آخر، مثال: npm run zip:clean -- brightai-production.zip");
  process.exit(1);
}

const excludePatterns = [
  ".git/*",
  "node_modules/*",
  "*/node_modules/*",
  ".venv/*",
  "*/.venv/*",
  "reports/*",
  "tmp/*",
  ".render-static/*",
  ".DS_Store",
  "*/.DS_Store",
  "*.log",
  "*.zip",
  outputName
];

if (!includeAgents) {
  excludePatterns.push(".agents/*");
}

const args = [
  "-r",
  outputPath,
  ".",
  ...excludePatterns.flatMap((pattern) => ["-x", pattern])
];

const result = spawnSync("zip", args, {
  cwd: repoRoot,
  stdio: "inherit"
});

if (result.error) {
  console.error("تعذر تشغيل zip. تأكد من توفر أداة zip في النظام.");
  process.exit(1);
}

process.exit(result.status || 0);
