import fs from "node:fs/promises";
import path from "node:path";
import { glob } from "glob";

export const DEFAULT_FILE_PATTERNS = [
  "*.html",
  "*.htm",
  "*.js",
  "*.css",
  "frontend/**/*.html",
  "frontend/**/*.htm",
  "frontend/**/*.js",
  "frontend/**/*.mjs",
  "frontend/**/*.css"
];

export const DEFAULT_IGNORE_PATTERNS = [
  "**/.git/**",
  "**/node_modules/**",
  "backend/**",
  "server/**",
  "scripts/**",
  "brightai_orchestrator_output/**"
];

const ATTR_REFERENCE_REGEX = /\b(href|src|action|poster|data-href|data-src)\s*=\s*(['"])([^"'<>]+)\2/gi;
const CSS_URL_REGEX = /url\(\s*(['"]?)([^'")]+)\1\s*\)/gi;
const JS_URL_KEY_REGEX = /\b(?:url|href|path|link)\s*:\s*(['"`])([^"'`\n\r]+)\1/g;
const JS_QUOTED_KEY_REGEX = /(['"`])(?:url|href|path|link)\1\s*:\s*(['"`])([^"'`\n\r]+)\2/g;
const JS_ASSIGNMENT_REGEX = /\b(?:href|src|action)\s*=\s*(['"`])([^"'`\n\r]+)\1/g;
const JS_SET_ATTRIBUTE_REGEX = /\bsetAttribute\(\s*['"](?:href|src|action|data-href|data-src)['"]\s*,\s*(['"`])([^"'`\n\r]+)\1\s*\)/g;

const SKIP_PREFIXES = [
  "http://",
  "https://",
  "//",
  "mailto:",
  "tel:",
  "javascript:",
  "data:",
  "blob:",
  "sms:",
  "geo:",
  "ftp:",
  "ws:",
  "wss:",
  "whatsapp:",
  "chrome-extension:",
  "about:"
];

const API_PREFIXES = ["/api/", "api/", "/backend/", "backend/", "/server/", "server/"];

const HTML_FILE_REGEX = /\.(?:html?|xhtml)$/i;
const JS_FILE_REGEX = /\.(?:m?js)$/i;

export function toPosix(filePath) {
  return filePath.split(path.sep).join("/");
}

function normalizeRelativePath(inputPath) {
  if (!inputPath) {
    return "";
  }

  let normalized = inputPath.replace(/\\/g, "/");
  normalized = path.posix.normalize(normalized);
  normalized = normalized.replace(/^\.\/+/, "");
  normalized = normalized.replace(/^\/+/, "");
  if (normalized === ".") {
    return "";
  }

  return normalized;
}

function buildLineStarts(content) {
  const starts = [0];
  for (let index = 0; index < content.length; index += 1) {
    if (content.charCodeAt(index) === 10) {
      starts.push(index + 1);
    }
  }
  return starts;
}

function indexToLine(lineStarts, targetIndex) {
  let low = 0;
  let high = lineStarts.length - 1;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const start = lineStarts[mid];
    const next = mid + 1 < lineStarts.length ? lineStarts[mid + 1] : Number.POSITIVE_INFINITY;
    if (targetIndex >= start && targetIndex < next) {
      return mid + 1;
    }
    if (targetIndex < start) {
      high = mid - 1;
    } else {
      low = mid + 1;
    }
  }

  return lineStarts.length;
}

function pushRegexMatches({
  references,
  seen,
  content,
  regex,
  valueGroup,
  file,
  lineStarts,
  patternType,
  extraFieldsBuilder
}) {
  regex.lastIndex = 0;
  let match = regex.exec(content);
  while (match) {
    const value = match[valueGroup];
    if (value) {
      const valueOffset = match[0].indexOf(value);
      if (valueOffset >= 0) {
        const valueStart = match.index + valueOffset;
        const valueEnd = valueStart + value.length;
        const dedupeKey = `${valueStart}:${valueEnd}:${value}`;
        if (!seen.has(dedupeKey)) {
          seen.add(dedupeKey);
          references.push({
            file,
            patternType,
            original: value,
            valueStart,
            valueEnd,
            line: indexToLine(lineStarts, valueStart),
            ...(typeof extraFieldsBuilder === "function" ? extraFieldsBuilder(match) : {})
          });
        }
      }
    }
    match = regex.exec(content);
  }
}

function extractReferencesFromContent(file, content) {
  const references = [];
  const seen = new Set();
  const lineStarts = buildLineStarts(content);
  const lowerFile = file.toLowerCase();
  const isJavaScriptFile = JS_FILE_REGEX.test(lowerFile);

  pushRegexMatches({
    references,
    seen,
    content,
    regex: ATTR_REFERENCE_REGEX,
    valueGroup: 3,
    file,
    lineStarts,
    patternType: "attr",
    extraFieldsBuilder: (match) => ({
      attributeName: String(match[1] || "").toLowerCase()
    })
  });

  if (!isJavaScriptFile) {
    pushRegexMatches({
      references,
      seen,
      content,
      regex: CSS_URL_REGEX,
      valueGroup: 2,
      file,
      lineStarts,
      patternType: "css-url"
    });
  }

  if (isJavaScriptFile) {
    pushRegexMatches({
      references,
      seen,
      content,
      regex: JS_URL_KEY_REGEX,
      valueGroup: 2,
      file,
      lineStarts,
      patternType: "js-key"
    });

    pushRegexMatches({
      references,
      seen,
      content,
      regex: JS_QUOTED_KEY_REGEX,
      valueGroup: 3,
      file,
      lineStarts,
      patternType: "js-key"
    });

    pushRegexMatches({
      references,
      seen,
      content,
      regex: JS_ASSIGNMENT_REGEX,
      valueGroup: 2,
      file,
      lineStarts,
      patternType: "js-assignment"
    });

    pushRegexMatches({
      references,
      seen,
      content,
      regex: JS_SET_ATTRIBUTE_REGEX,
      valueGroup: 2,
      file,
      lineStarts,
      patternType: "js-set-attribute"
    });
  }

  references.sort((first, second) => first.valueStart - second.valueStart);
  return references;
}

function splitReferenceAndSuffix(reference) {
  const queryIndex = reference.indexOf("?");
  const hashIndex = reference.indexOf("#");
  let splitIndex = -1;

  if (queryIndex >= 0 && hashIndex >= 0) {
    splitIndex = Math.min(queryIndex, hashIndex);
  } else if (queryIndex >= 0) {
    splitIndex = queryIndex;
  } else if (hashIndex >= 0) {
    splitIndex = hashIndex;
  }

  if (splitIndex < 0) {
    return { referencePath: reference, suffix: "" };
  }

  return {
    referencePath: reference.slice(0, splitIndex),
    suffix: reference.slice(splitIndex)
  };
}

function getIgnoreReason(reference) {
  const trimmed = reference.original.trim();
  if (!trimmed) {
    return "قيمة فارغة";
  }

  const lowerTrimmed = trimmed.toLowerCase();

  if (trimmed.startsWith("#")) {
    return "مرساة داخل الصفحة";
  }

  if (trimmed.includes("${") || trimmed.includes("{{") || trimmed.includes("}}") || trimmed.includes("<%")) {
    return "مسار ديناميكي";
  }

  if (trimmed.includes("%PUBLIC_URL%")) {
    return "متغير بيئة";
  }

  if (/^\$\d+$/.test(trimmed)) {
    return "مرجع استبدال برمجي";
  }

  if (/^[A-Za-z_$][A-Za-z0-9_$]*(\.[A-Za-z_$][A-Za-z0-9_$]*)+$/.test(trimmed) && !trimmed.includes("/")) {
    return "متغير جافاسكربت";
  }

  if (reference.patternType === "attr" && reference.attributeName === "action") {
    if (!trimmed.includes("/") && !trimmed.includes(".")) {
      return "مسار إجراء غير ملفي";
    }
  }

  if (
    (reference.patternType === "css-url" || reference.patternType === "attr") &&
    /^[A-Za-z0-9_-]+$/.test(trimmed) &&
    !trimmed.includes(".") &&
    !trimmed.includes("/")
  ) {
    return "قيمة معرف غير ملفية";
  }

  if (/^[a-z]+\/[a-z0-9.+-]+$/i.test(trimmed) && !trimmed.includes(".")) {
    return "نوع وسائط";
  }

  if (reference.patternType === "css-url" && (lowerTrimmed === "blob" || lowerTrimmed.startsWith("var("))) {
    return "قيمة تصميم غير ملفية";
  }

  if (SKIP_PREFIXES.some((prefix) => lowerTrimmed.startsWith(prefix))) {
    return "رابط خارجي أو غير ملفي";
  }

  if (API_PREFIXES.some((prefix) => lowerTrimmed.startsWith(prefix))) {
    return "مسار واجهة برمجية";
  }

  return null;
}

function normalizeReferencePath(referencePath) {
  if (referencePath === "/") {
    return "/";
  }

  let normalized = referencePath.trim();
  if (!normalized) {
    return "";
  }

  normalized = normalized.replace(/\\/g, "/");
  normalized = normalized.replace(/\/{2,}/g, "/");
  if (normalized.startsWith("./")) {
    normalized = normalized.slice(2);
  }

  try {
    normalized = decodeURI(normalized);
  } catch {
    // Keep original string on malformed escape sequences.
  }

  return normalized;
}

function toProjectRelativePath(sourceFile, normalizedReferencePath) {
  if (normalizedReferencePath === "/" || normalizedReferencePath === "") {
    return "";
  }

  if (normalizedReferencePath.startsWith("/")) {
    return normalizeRelativePath(normalizedReferencePath.slice(1));
  }

  const sourceDir = path.posix.dirname(sourceFile);
  const combined = normalizeRelativePath(path.posix.join(sourceDir, normalizedReferencePath));
  if (combined.startsWith("..")) {
    return null;
  }

  return combined;
}

function expandCandidates(referenceRelativePath) {
  const normalized = normalizeRelativePath(referenceRelativePath);
  const candidates = new Set();

  if (!normalized) {
    candidates.add("index.html");
    candidates.add("index.htm");
    return [...candidates];
  }

  candidates.add(normalized);
  if (normalized.endsWith("/")) {
    candidates.add(`${normalized}index.html`);
    candidates.add(`${normalized}index.htm`);
    return [...candidates];
  }

  const extension = path.posix.extname(normalized).toLowerCase();
  if (!extension) {
    candidates.add(`${normalized}.html`);
    candidates.add(`${normalized}.htm`);
    candidates.add(`${normalized}/index.html`);
    candidates.add(`${normalized}/index.htm`);
  }

  return [...candidates];
}

function scorePathSimilarity(candidatePath, wantedPath) {
  const candidateParts = candidatePath.toLowerCase().split("/");
  const wantedParts = wantedPath.toLowerCase().split("/");
  let score = 0;

  const candidateBase = candidateParts[candidateParts.length - 1];
  const wantedBase = wantedParts[wantedParts.length - 1];
  if (candidateBase === wantedBase) {
    score += 8;
  }

  let pointer = 1;
  while (
    pointer <= candidateParts.length &&
    pointer <= wantedParts.length &&
    candidateParts[candidateParts.length - pointer] === wantedParts[wantedParts.length - pointer]
  ) {
    score += 3;
    pointer += 1;
  }

  if (candidateParts[0] === wantedParts[0]) {
    score += 1;
  }

  return score;
}

function chooseBestCandidate(candidates, wantedPath) {
  if (!candidates.length) {
    return null;
  }

  if (candidates.length === 1) {
    return { path: candidates[0], confidence: 0.92 };
  }

  if (!wantedPath) {
    return null;
  }

  const scored = candidates
    .map((candidate) => ({ candidate, score: scorePathSimilarity(candidate, wantedPath) }))
    .sort((first, second) => second.score - first.score);

  if (!scored.length) {
    return null;
  }

  const first = scored[0];
  const second = scored[1];
  if (!second || first.score >= second.score + 3) {
    return { path: first.candidate, confidence: 0.78 };
  }

  return null;
}

function suggestPath(referencePath, sourceFile, fileIndex) {
  const normalized = normalizeReferencePath(referencePath);
  if (normalized === "" || normalized === "/") {
    return null;
  }

  const rootCandidate = normalizeRelativePath(normalized.startsWith("/") ? normalized.slice(1) : normalized);
  if (rootCandidate) {
    const rootCandidates = expandCandidates(rootCandidate);
    for (const candidate of rootCandidates) {
      if (fileIndex.files.has(candidate)) {
        return { path: candidate, confidence: 0.95 };
      }
    }
  }

  const wantedRelative = toProjectRelativePath(sourceFile, normalized);
  if (wantedRelative) {
    const wantedCandidates = expandCandidates(wantedRelative);
    for (const candidate of wantedCandidates) {
      if (fileIndex.files.has(candidate)) {
        return { path: candidate, confidence: 0.95 };
      }
    }
  }

  const baseName = path.posix.basename(normalized).toLowerCase();
  if (baseName) {
    const byBasename = fileIndex.basenameMap.get(baseName) || [];
    const picked = chooseBestCandidate(byBasename, wantedRelative || rootCandidate);
    if (picked) {
      return picked;
    }
  }

  const stemName = path.posix.basename(normalized, path.posix.extname(normalized)).toLowerCase();
  if (stemName) {
    const byStem = (fileIndex.stemMap.get(stemName) || []).filter((candidate) =>
      HTML_FILE_REGEX.test(candidate)
    );
    const picked = chooseBestCandidate(byStem, wantedRelative || rootCandidate);
    if (picked) {
      return picked;
    }
  }

  if (wantedRelative) {
    const lowerWanted = wantedRelative.toLowerCase();
    const suffixMatches = fileIndex.allFilesArray.filter((candidate) => candidate.toLowerCase().endsWith(lowerWanted));
    if (suffixMatches.length === 1) {
      return { path: suffixMatches[0], confidence: 0.85 };
    }
  }

  return null;
}

async function buildFileIndex({ root, ignorePatterns }) {
  const projectFiles = await glob("**/*", {
    cwd: root,
    nodir: true,
    ignore: ignorePatterns
  });

  const normalizedFiles = projectFiles.map((file) => normalizeRelativePath(toPosix(file)));
  const files = new Set(normalizedFiles);

  const basenameMap = new Map();
  const stemMap = new Map();

  for (const file of files) {
    const baseName = path.posix.basename(file).toLowerCase();
    const stemName = path.posix.basename(file, path.posix.extname(file)).toLowerCase();

    if (!basenameMap.has(baseName)) {
      basenameMap.set(baseName, []);
    }
    basenameMap.get(baseName).push(file);

    if (!stemMap.has(stemName)) {
      stemMap.set(stemName, []);
    }
    stemMap.get(stemName).push(file);
  }

  for (const values of basenameMap.values()) {
    values.sort();
  }

  for (const values of stemMap.values()) {
    values.sort();
  }

  return {
    files,
    basenameMap,
    stemMap,
    allFilesArray: [...files].sort()
  };
}

function evaluateReference(reference, fileIndex) {
  const ignoreReason = getIgnoreReason(reference);
  if (ignoreReason) {
    return {
      status: "ignored",
      ignoreReason
    };
  }

  const { referencePath, suffix } = splitReferenceAndSuffix(reference.original);
  const normalizedReferencePath = normalizeReferencePath(referencePath);
  if (!normalizedReferencePath) {
    return {
      status: "ignored",
      ignoreReason: "مسار فارغ بعد التنظيف"
    };
  }

  const projectRelativePath = toProjectRelativePath(reference.file, normalizedReferencePath);
  if (projectRelativePath === null) {
    const suggestedOutsideRoot = suggestPath(normalizedReferencePath, reference.file, fileIndex);
    return {
      status: "broken",
      reason: "المسار يشير إلى خارج جذر المشروع",
      normalizedReferencePath,
      suggestion: suggestedOutsideRoot ? `/${suggestedOutsideRoot.path}${suffix}` : null,
      suggestionPath: suggestedOutsideRoot?.path || null,
      suggestionConfidence: suggestedOutsideRoot?.confidence
    };
  }

  const candidates = expandCandidates(projectRelativePath);
  let matchedPath = null;
  for (const candidate of candidates) {
    if (fileIndex.files.has(candidate)) {
      matchedPath = candidate;
      break;
    }
  }

  if (matchedPath) {
    const canonical = `/${matchedPath}${suffix}`;
    const current = reference.original.trim();
    return {
      status: "valid",
      matchedPath,
      canonical,
      normalizedReferencePath,
      needsNormalization: canonical !== current
    };
  }

  const suggested = suggestPath(normalizedReferencePath, reference.file, fileIndex);
  if (suggested) {
    return {
      status: "broken",
      reason: "المسار غير موجود",
      normalizedReferencePath,
      suggestion: `/${suggested.path}${suffix}`,
      suggestionPath: suggested.path,
      suggestionConfidence: suggested.confidence
    };
  }

  return {
    status: "broken",
    reason: "المسار غير موجود",
    normalizedReferencePath,
    suggestion: null
  };
}

function buildTopFileStats(rows) {
  const counts = new Map();
  for (const row of rows) {
    const current = counts.get(row.file) || 0;
    counts.set(row.file, current + 1);
  }
  return [...counts.entries()]
    .sort((first, second) => second[1] - first[1] || first[0].localeCompare(second[0]))
    .map(([file, count]) => ({ file, count }));
}

export async function runAudit({
  root = process.cwd(),
  filePatterns = DEFAULT_FILE_PATTERNS,
  ignorePatterns = DEFAULT_IGNORE_PATTERNS
} = {}) {
  const fileSet = new Set();
  for (const pattern of filePatterns) {
    const matchedFiles = await glob(pattern, {
      cwd: root,
      nodir: true,
      ignore: ignorePatterns
    });
    for (const file of matchedFiles) {
      fileSet.add(normalizeRelativePath(toPosix(file)));
    }
  }

  const files = [...fileSet].sort();
  const fileIndex = await buildFileIndex({ root, ignorePatterns });
  const references = [];

  for (const file of files) {
    const absoluteFilePath = path.join(root, file);
    const content = await fs.readFile(absoluteFilePath, "utf8");
    const fileReferences = extractReferencesFromContent(file, content);
    for (const fileReference of fileReferences) {
      const evaluation = evaluateReference(fileReference, fileIndex);
      references.push({
        ...fileReference,
        ...evaluation
      });
    }
  }

  const internalReferences = references.filter((reference) => reference.status !== "ignored");
  const brokenReferences = internalReferences.filter((reference) => reference.status === "broken");
  const fixableBrokenReferences = brokenReferences.filter((reference) => Boolean(reference.suggestion));
  const normalizationCandidates = internalReferences.filter(
    (reference) => reference.status === "valid" && reference.needsNormalization
  );

  const brokenRows = brokenReferences
    .map((reference) => ({
      file: reference.file,
      line: reference.line,
      patternType: reference.patternType,
      reference: reference.original,
      normalizedReferencePath: reference.normalizedReferencePath || "",
      reason: reference.reason || "",
      suggestion: reference.suggestion || ""
    }))
    .sort((first, second) => {
      if (first.file !== second.file) {
        return first.file.localeCompare(second.file);
      }
      return first.line - second.line;
    });

  return {
    generatedAt: new Date().toISOString(),
    root: toPosix(root),
    filesScanned: files.length,
    referencesScanned: references.length,
    internalReferences: internalReferences.length,
    brokenReferences: brokenReferences.length,
    fixableBrokenReferences: fixableBrokenReferences.length,
    normalizationCandidates: normalizationCandidates.length,
    topBrokenFiles: buildTopFileStats(brokenRows),
    brokenRows,
    references
  };
}

function escapePipe(value) {
  return String(value).replace(/\|/g, "\\|");
}

function buildMarkdownReport(report, title) {
  const lines = [];
  lines.push(`# ${title}`);
  lines.push("");
  lines.push(`- تاريخ التقرير: ${report.generatedAt}`);
  lines.push(`- عدد الملفات المفحوصة: ${report.filesScanned}`);
  lines.push(`- إجمالي المراجع المكتشفة: ${report.referencesScanned}`);
  lines.push(`- المراجع الداخلية المفحوصة: ${report.internalReferences}`);
  lines.push(`- الروابط/المسارات المكسورة: ${report.brokenReferences}`);
  lines.push(`- المكسور القابل للإصلاح التلقائي: ${report.fixableBrokenReferences}`);
  lines.push(`- فرص توحيد نمط الروابط: ${report.normalizationCandidates}`);
  lines.push("");

  lines.push("## الملفات الأعلى أعطالًا");
  lines.push("");
  if (!report.topBrokenFiles.length) {
    lines.push("- لا توجد ملفات تحتوي على روابط مكسورة.");
  } else {
    lines.push("| الملف | عدد الأعطال |");
    lines.push("| --- | ---: |");
    for (const row of report.topBrokenFiles.slice(0, 25)) {
      lines.push(`| ${escapePipe(row.file)} | ${row.count} |`);
    }
  }
  lines.push("");

  lines.push("## تفاصيل الأعطال");
  lines.push("");
  if (!report.brokenRows.length) {
    lines.push("- لا توجد روابط مكسورة.");
  } else {
    lines.push("| الملف | السطر | النوع | المرجع | الاقتراح | السبب |");
    lines.push("| --- | ---: | --- | --- | --- | --- |");
    for (const row of report.brokenRows) {
      lines.push(
        `| ${escapePipe(row.file)} | ${row.line} | ${escapePipe(row.patternType)} | ${escapePipe(
          row.reference
        )} | ${escapePipe(row.suggestion || "—")} | ${escapePipe(row.reason || "—")} |`
      );
    }
  }
  lines.push("");

  return `${lines.join("\n")}\n`;
}

export async function writeAuditArtifacts({
  report,
  jsonPath,
  markdownPath,
  title
}) {
  const jsonDirectory = path.dirname(jsonPath);
  const markdownDirectory = path.dirname(markdownPath);
  await fs.mkdir(jsonDirectory, { recursive: true });
  await fs.mkdir(markdownDirectory, { recursive: true });

  const serializable = {
    generatedAt: report.generatedAt,
    root: report.root,
    filesScanned: report.filesScanned,
    referencesScanned: report.referencesScanned,
    internalReferences: report.internalReferences,
    brokenReferences: report.brokenReferences,
    fixableBrokenReferences: report.fixableBrokenReferences,
    normalizationCandidates: report.normalizationCandidates,
    topBrokenFiles: report.topBrokenFiles,
    brokenRows: report.brokenRows
  };

  await fs.writeFile(jsonPath, `${JSON.stringify(serializable, null, 2)}\n`, "utf8");
  await fs.writeFile(markdownPath, buildMarkdownReport(report, title), "utf8");
}
