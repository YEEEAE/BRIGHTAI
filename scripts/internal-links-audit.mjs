import path from "node:path";
import { runAudit, writeAuditArtifacts } from "./internal-links-common.mjs";

const reportsDirectory = path.join(process.cwd(), "تقارير للمشروع");
const jsonOutput = path.join(reportsDirectory, "broken_links_before.json");
const markdownOutput = path.join(reportsDirectory, "broken_links_before.md");

const report = await runAudit();

await writeAuditArtifacts({
  report,
  jsonPath: jsonOutput,
  markdownPath: markdownOutput,
  title: "تقرير الروابط والمسارات المكسورة قبل الإصلاح"
});

console.log("اكتمل تدقيق الروابط.");
console.log(`الملفات المفحوصة: ${report.filesScanned}`);
console.log(`إجمالي المراجع: ${report.referencesScanned}`);
console.log(`المراجع الداخلية: ${report.internalReferences}`);
console.log(`الأعطال المكتشفة: ${report.brokenReferences}`);
console.log(`الأعطال القابلة للإصلاح التلقائي: ${report.fixableBrokenReferences}`);
console.log(`فرص توحيد النمط: ${report.normalizationCandidates}`);
console.log(`تم حفظ التقرير: ${markdownOutput}`);

