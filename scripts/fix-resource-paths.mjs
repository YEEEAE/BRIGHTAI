import path from "node:path";
import {
  runResourceAudit,
  writeResourceAuditArtifacts,
  applyResourceFixes,
  writeResourceComparisonReport
} from "./resource-paths-common.mjs";

const reportsDirectory = path.join(process.cwd(), "تقارير للمشروع");

const beforeReport = await runResourceAudit();
await writeResourceAuditArtifacts({
  report: beforeReport,
  jsonPath: path.join(reportsDirectory, "resource_paths_before.json"),
  markdownPath: path.join(reportsDirectory, "resource_paths_before.md"),
  title: "تقرير مسارات الموارد قبل الإصلاح"
});

const fixResult = await applyResourceFixes({
  auditReport: beforeReport
});

const afterReport = await runResourceAudit();
await writeResourceAuditArtifacts({
  report: afterReport,
  jsonPath: path.join(reportsDirectory, "resource_paths_after.json"),
  markdownPath: path.join(reportsDirectory, "resource_paths_after.md"),
  title: "تقرير مسارات الموارد بعد الإصلاح"
});

await writeResourceComparisonReport({
  beforeReport,
  afterReport,
  fixResult,
  markdownPath: path.join(reportsDirectory, "resource_paths_before_after.md")
});

console.log("Completed resource path fix process.");
console.log(`Broken paths before: ${beforeReport.brokenResources}`);
console.log(`Broken paths after: ${afterReport.brokenResources}`);
console.log(`Duplicate loads before: ${beforeReport.duplicateResources}`);
console.log(`Duplicate loads after: ${afterReport.duplicateResources}`);
console.log(`Changed files: ${fixResult.changedFiles.length}`);
