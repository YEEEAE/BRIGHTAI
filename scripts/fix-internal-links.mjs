import fs from "node:fs/promises";
import path from "node:path";
import { runAudit, writeAuditArtifacts } from "./internal-links-common.mjs";

function applyReplacements(content, replacements) {
  const sorted = [...replacements].sort((first, second) => second.valueStart - first.valueStart);
  let updatedContent = content;
  let lastStart = Number.POSITIVE_INFINITY;

  for (const replacement of sorted) {
    if (replacement.valueEnd > lastStart) {
      continue;
    }
    updatedContent =
      updatedContent.slice(0, replacement.valueStart) +
      replacement.nextValue +
      updatedContent.slice(replacement.valueEnd);
    lastStart = replacement.valueStart;
  }

  return updatedContent;
}

function shouldApplySuggestion(reference) {
  return (
    reference.status === "broken" &&
    Boolean(reference.suggestion) &&
    typeof reference.suggestionConfidence === "number" &&
    reference.suggestionConfidence >= 0.75
  );
}

function shouldNormalize(reference) {
  return (
    reference.status === "valid" &&
    reference.needsNormalization &&
    Boolean(reference.canonical) &&
    reference.original.trim() !== reference.canonical
  );
}

function isEligibleForRewrite(filePath) {
  const normalized = filePath.replace(/\\/g, "/").toLowerCase();
  if (normalized.includes("/vendor/")) {
    return false;
  }
  if (normalized.endsWith(".min.js") || normalized.endsWith(".min.css")) {
    return false;
  }
  return true;
}

const reportsDirectory = path.join(process.cwd(), "تقارير للمشروع");
const beforeJsonPath = path.join(reportsDirectory, "broken_links_before.json");
const beforeMarkdownPath = path.join(reportsDirectory, "broken_links_before.md");
const afterJsonPath = path.join(reportsDirectory, "broken_links_after.json");
const afterMarkdownPath = path.join(reportsDirectory, "broken_links_after.md");
const comparisonMarkdownPath = path.join(reportsDirectory, "broken_links_before_after.md");

const beforeReport = await runAudit();

await writeAuditArtifacts({
  report: beforeReport,
  jsonPath: beforeJsonPath,
  markdownPath: beforeMarkdownPath,
  title: "تقرير الروابط والمسارات المكسورة قبل الإصلاح"
});

const replacementsByFile = new Map();

for (const reference of beforeReport.references) {
  if (!isEligibleForRewrite(reference.file)) {
    continue;
  }

  let nextValue = null;

  if (shouldNormalize(reference)) {
    nextValue = reference.canonical;
  } else if (shouldApplySuggestion(reference)) {
    nextValue = reference.suggestion;
  }

  if (!nextValue || nextValue === reference.original) {
    continue;
  }

  if (!replacementsByFile.has(reference.file)) {
    replacementsByFile.set(reference.file, []);
  }

  replacementsByFile.get(reference.file).push({
    valueStart: reference.valueStart,
    valueEnd: reference.valueEnd,
    nextValue
  });
}

const fileChangeSummary = [];
for (const [file, replacements] of replacementsByFile.entries()) {
  const absolutePath = path.join(process.cwd(), file);
  const originalContent = await fs.readFile(absolutePath, "utf8");
  const updatedContent = applyReplacements(originalContent, replacements);

  if (updatedContent !== originalContent) {
    await fs.writeFile(absolutePath, updatedContent, "utf8");
    fileChangeSummary.push({ file, changes: replacements.length });
  }
}

fileChangeSummary.sort((first, second) => second.changes - first.changes || first.file.localeCompare(second.file));

const afterReport = await runAudit();

await writeAuditArtifacts({
  report: afterReport,
  jsonPath: afterJsonPath,
  markdownPath: afterMarkdownPath,
  title: "تقرير الروابط والمسارات المكسورة بعد الإصلاح"
});

const fixedBrokenCount = Math.max(0, beforeReport.brokenReferences - afterReport.brokenReferences);
const normalizedCount = Math.max(0, beforeReport.normalizationCandidates - afterReport.normalizationCandidates);

const comparisonLines = [
  "# مقارنة الروابط قبل وبعد الإصلاح",
  "",
  `- تاريخ التنفيذ: ${new Date().toISOString()}`,
  `- الروابط المكسورة قبل الإصلاح: ${beforeReport.brokenReferences}`,
  `- الروابط المكسورة بعد الإصلاح: ${afterReport.brokenReferences}`,
  `- عدد الأعطال التي تم إصلاحها: ${fixedBrokenCount}`,
  `- فرص توحيد النمط قبل الإصلاح: ${beforeReport.normalizationCandidates}`,
  `- فرص توحيد النمط بعد الإصلاح: ${afterReport.normalizationCandidates}`,
  `- توحيدات النمط المنجزة: ${normalizedCount}`,
  `- عدد الملفات المعدلة: ${fileChangeSummary.length}`,
  "",
  "## الملفات المعدلة",
  ""
];

if (!fileChangeSummary.length) {
  comparisonLines.push("- لم يتم تعديل أي ملف.");
} else {
  comparisonLines.push("| الملف | عدد التعديلات |");
  comparisonLines.push("| --- | ---: |");
  for (const row of fileChangeSummary) {
    comparisonLines.push(`| ${row.file.replace(/\|/g, "\\|")} | ${row.changes} |`);
  }
}

comparisonLines.push("");
comparisonLines.push("## المتبقي بعد الإصلاح");
comparisonLines.push("");

if (!afterReport.brokenRows.length) {
  comparisonLines.push("- لا توجد روابط مكسورة متبقية.");
} else {
  comparisonLines.push("| الملف | السطر | المرجع | الاقتراح |");
  comparisonLines.push("| --- | ---: | --- | --- |");
  for (const row of afterReport.brokenRows) {
    comparisonLines.push(
      `| ${row.file.replace(/\|/g, "\\|")} | ${row.line} | ${String(row.reference).replace(/\|/g, "\\|")} | ${String(
        row.suggestion || "—"
      ).replace(/\|/g, "\\|")} |`
    );
  }
}

comparisonLines.push("");
await fs.mkdir(reportsDirectory, { recursive: true });
await fs.writeFile(comparisonMarkdownPath, `${comparisonLines.join("\n")}\n`, "utf8");

console.log("اكتمل إصلاح الروابط وتوحيد النمط.");
console.log(`الملفات المعدلة: ${fileChangeSummary.length}`);
console.log(`المكسور قبل الإصلاح: ${beforeReport.brokenReferences}`);
console.log(`المكسور بعد الإصلاح: ${afterReport.brokenReferences}`);
console.log(`تم إصلاح: ${fixedBrokenCount}`);
console.log(`تم حفظ تقرير المقارنة: ${comparisonMarkdownPath}`);
