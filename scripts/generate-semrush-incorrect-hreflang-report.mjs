#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const DATE_STAMP = "2026-03-08";
const INPUT_PATH =
  process.argv[2] || "/tmp/semrush-incorrect-hreflang-links-2026-03-08.json";
const OUTPUT_JSON = path.join(
  ROOT,
  "reports",
  `semrush-incorrect-hreflang-links-${DATE_STAMP}.json`,
);
const OUTPUT_CSV = path.join(
  ROOT,
  "reports",
  `semrush-incorrect-hreflang-links-${DATE_STAMP}.csv`,
);
const OUTPUT_MD = path.join(
  ROOT,
  "reports",
  `semrush-incorrect-hreflang-links-${DATE_STAMP}.md`,
);

function csvEscape(value) {
  const normalized = String(value ?? "");
  if (/[",\n]/.test(normalized)) {
    return `"${normalized.replace(/"/g, "\"\"")}"`;
  }

  return normalized;
}

function formatDiscovered(value) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) {
    return "";
  }

  return new Date(number).toISOString();
}

function topCounts(items, getKey, limit = 10) {
  const counts = new Map();

  for (const item of items) {
    const key = getKey(item);
    if (!key) {
      continue;
    }

    counts.set(key, (counts.get(key) || 0) + 1);
  }

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit);
}

const raw = await fs.readFile(INPUT_PATH, "utf8");
const report = JSON.parse(raw);
const rows = Array.isArray(report.data) ? report.data : [];

const uniquePages = new Set(rows.map((row) => row.source_url).filter(Boolean)).size;
const uniqueTargets = new Set(rows.map((row) => row.target_url).filter(Boolean)).size;
const errorTypeCounts = topCounts(rows, (row) => row.info?.errorType, 10);
const httpCodeCounts = topCounts(rows, (row) => row.info?.code, 10);
const topPages = topCounts(rows, (row) => row.source_url, 10);
const topTargets = topCounts(rows, (row) => row.target_url, 10);

const csvLines = [
  [
    "Page URL",
    "Hreflang Link URL",
    "Error Type",
    "HTTP Code",
    "Occurrences",
    "Discovered At",
    "Title",
  ].join(","),
];

for (const row of rows) {
  csvLines.push(
    [
      csvEscape(row.source_url),
      csvEscape(row.target_url),
      csvEscape(row.info?.errorType),
      csvEscape(row.info?.code),
      csvEscape(row.num),
      csvEscape(formatDiscovered(row.discovered)),
      csvEscape(row.title),
    ].join(","),
  );
}

const summaryLines = [
  "# Semrush Incorrect Hreflang Links Report",
  `**Date:** ${DATE_STAMP}`,
  `**Snapshot ID:** ${report.data?.[0]?.page_id ? "69acca82f4a4d73f2cc00ba8" : "69acca82f4a4d73f2cc00ba8"}`,
  `**Issue ID:** \`${report.issue_id}\``,
  "",
  "## Summary",
  `- Total issues: \`${report.total ?? rows.length}\``,
  `- Affected pages: \`${uniquePages}\``,
  `- Unique hreflang targets: \`${uniqueTargets}\``,
  "",
  "## Error Types",
  ...errorTypeCounts.map(([key, count]) => `- errorType \`${key}\`: \`${count}\``),
  "",
  "## HTTP Codes",
  ...(httpCodeCounts.length
    ? httpCodeCounts.map(([key, count]) => `- HTTP \`${key}\`: \`${count}\``)
    : ["- No HTTP codes returned in this payload"]),
  "",
  "## Most Frequent Source Pages",
  ...topPages.map(([key, count]) => `- \`${key}\` = \`${count}\``),
  "",
  "## Most Frequent Hreflang Targets",
  ...topTargets.map(([key, count]) => `- \`${key}\` = \`${count}\``),
  "",
  "## Pattern Notes",
  "- جزء من السجلات يشير إلى hreflang targets نظيفة لكنها تعمل `301` من مسارات عامة مثل `/try/...` و`/interview` و`/demo/...`.",
  "- الجزء الأكبر يشير إلى targets من نوع `/frontend/pages/...`، وهذا ليس public URL صالح للنشر وغالباً هو سبب `errorType 10`.",
];

await fs.mkdir(path.join(ROOT, "reports"), { recursive: true });
await fs.writeFile(OUTPUT_JSON, `${JSON.stringify(report, null, 2)}\n`);
await fs.writeFile(OUTPUT_CSV, `${csvLines.join("\n")}\n`);
await fs.writeFile(OUTPUT_MD, `${summaryLines.join("\n")}\n`);

console.log(
  JSON.stringify(
    {
      output_json: OUTPUT_JSON,
      output_csv: OUTPUT_CSV,
      output_md: OUTPUT_MD,
      total: report.total ?? rows.length,
      affected_pages: uniquePages,
      unique_targets: uniqueTargets,
      error_types: Object.fromEntries(errorTypeCounts),
      http_codes: Object.fromEntries(httpCodeCounts),
    },
    null,
    2,
  ),
);
