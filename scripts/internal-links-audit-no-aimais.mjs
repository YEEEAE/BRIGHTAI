import path from "node:path";
import { runAudit, writeAuditArtifacts, DEFAULT_IGNORE_PATTERNS } from "./internal-links-common.mjs";

const reportsDirectory = path.join(process.cwd(), "reports", "internal-links");
const jsonOutput = path.join(reportsDirectory, "broken_links_no_ai_mais.json");
const markdownOutput = path.join(reportsDirectory, "broken_links_no_ai_mais.md");

const report = await runAudit({
  ignorePatterns: [...DEFAULT_IGNORE_PATTERNS, "ai-mais/**"]
});

await writeAuditArtifacts({
  report,
  jsonPath: jsonOutput,
  markdownPath: markdownOutput,
  title: "تقرير الروابط والمسارات المكسورة (بدون ai-mais)"
});

console.log("اكتمل تدقيق الروابط بدون ai-mais.");
console.log(`الملفات المفحوصة: ${report.filesScanned}`);
console.log(`إجمالي المراجع: ${report.referencesScanned}`);
console.log(`المراجع الداخلية: ${report.internalReferences}`);
console.log(`الأعطال المكتشفة: ${report.brokenReferences}`);
console.log(`الأعطال القابلة للإصلاح التلقائي: ${report.fixableBrokenReferences}`);
console.log(`فرص توحيد النمط: ${report.normalizationCandidates}`);
console.log(`تم حفظ التقرير: ${markdownOutput}`);
