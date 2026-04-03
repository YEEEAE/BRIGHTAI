import path from "node:path";
import {
  runAudit,
  writeAuditArtifacts,
  DEFAULT_IGNORE_PATTERNS as LINK_IGNORE,
} from "./internal-links-common.mjs";
import {
  runResourceAudit,
  writeResourceAuditArtifacts,
  DEFAULT_IGNORE_PATTERNS as RESOURCE_IGNORE,
} from "./resource-paths-common.mjs";

const reportsDirectory = path.join(process.cwd(), "reports", "internal-links");
const ignorePatterns = [...new Set([...LINK_IGNORE, ...RESOURCE_IGNORE, "ai-mais/**"])];

const linksReport = await runAudit({
  ignorePatterns,
});

await writeAuditArtifacts({
  report: linksReport,
  jsonPath: path.join(reportsDirectory, "broken_links_no_ai_mais.json"),
  markdownPath: path.join(reportsDirectory, "broken_links_no_ai_mais.md"),
  title: "تقرير الروابط والمسارات المكسورة (بدون ai-mais)",
});

const resourcesReport = await runResourceAudit({
  ignorePatterns,
});

await writeResourceAuditArtifacts({
  report: resourcesReport,
  jsonPath: path.join(reportsDirectory, "resource_paths_no_ai_mais.json"),
  markdownPath: path.join(reportsDirectory, "resource_paths_no_ai_mais.md"),
  title: "تقرير مسارات الموارد (بدون ai-mais)",
});

const summaryLines = [
  "# ملخص تدقيق الروابط والموارد (بدون ai-mais)",
  "",
  `- تاريخ التقرير: ${new Date().toISOString()}`,
  `- الملفات المفحوصة (روابط): ${linksReport.filesScanned}`,
  `- المراجع الداخلية (روابط): ${linksReport.internalReferences}`,
  `- الروابط المكسورة: ${linksReport.brokenReferences}`,
  `- الملفات المفحوصة (موارد): ${resourcesReport.filesScanned}`,
  `- مراجع الموارد: ${resourcesReport.resourcesScanned}`,
  `- مسارات الموارد المكسورة: ${resourcesReport.brokenResources}`,
  "",
  "## الملفات الناتجة",
  "",
  "- broken_links_no_ai_mais.md",
  "- broken_links_no_ai_mais.json",
  "- resource_paths_no_ai_mais.md",
  "- resource_paths_no_ai_mais.json",
];

await (await import("node:fs/promises")).writeFile(
  path.join(reportsDirectory, "audit_no_ai_mais_summary.md"),
  `${summaryLines.join("\n")}\n`,
  "utf8"
);

console.log("اكتمل تدقيق الروابط والموارد بدون ai-mais.");
console.log(`روابط مكسورة: ${linksReport.brokenReferences}`);
console.log(`مسارات موارد مكسورة: ${resourcesReport.brokenResources}`);
console.log(`تم حفظ الملخص: ${path.join(reportsDirectory, "audit_no_ai_mais_summary.md")}`);
