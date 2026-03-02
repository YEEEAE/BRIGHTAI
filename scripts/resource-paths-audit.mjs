import path from "node:path";
import { runResourceAudit, writeResourceAuditArtifacts } from "./resource-paths-common.mjs";

const stageArg = process.argv[2];
const stage = stageArg === "after" ? "after" : "before";
const reportsDirectory = path.join(process.cwd(), "تقارير للمشروع");

const jsonOutput = path.join(reportsDirectory, `resource_paths_${stage}.json`);
const markdownOutput = path.join(reportsDirectory, `resource_paths_${stage}.md`);

const report = await runResourceAudit();
await writeResourceAuditArtifacts({
  report,
  jsonPath: jsonOutput,
  markdownPath: markdownOutput,
  title: `تقرير مسارات الموارد ${stage === "before" ? "قبل الإصلاح" : "بعد الإصلاح"}`
});

console.log(`Audit stage: ${stage}`);
console.log(`Files scanned: ${report.filesScanned}`);
console.log(`Resource references: ${report.resourcesScanned}`);
console.log(`Broken paths: ${report.brokenResources}`);
console.log(`Duplicate loads: ${report.duplicateResources}`);
console.log(`Saved report: ${markdownOutput}`);
