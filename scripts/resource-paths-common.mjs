import fs from "node:fs/promises";
import path from "node:path";
import { glob } from "glob";

export const DEFAULT_HTML_PATTERNS = [
  "*.html",
  "*.htm",
  "frontend/**/*.html",
  "frontend/**/*.htm",
  "brightai-platform/public/**/*.html",
  "brightai-platform/public/**/*.htm"
];

export const DEFAULT_IGNORE_PATTERNS = [
  "**/.git/**",
  "**/node_modules/**",
  "backend/**",
  "server/**",
  "scripts/**",
  "brightai_orchestrator_output/**"
];

const RESOURCE_TAG_REGEX =
  /<script\b[^>]*\bsrc\s*=\s*(['"])([^"'<>]+)\1[^>]*>|<link\b[^>]*\bhref\s*=\s*(['"])([^"'<>]+)\3[^>]*>/gi;
const NOSCRIPT_BLOCK_REGEX = /<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi;
const ASSET_FILE_REGEX = /\.(?:m?js|css)$/i;

const SKIP_PREFIXES = [
  "http://",
  "https://",
  "//",
  "mailto:",
  "tel:",
  "javascript:",
  "data:",
  "blob:",
  "ws:",
  "wss:",
  "ftp:"
];

function toPosix(filePath) {
  return filePath.split(path.sep).join("/");
}

function normalizeRelativePath(filePath) {
  const normalized = path.posix.normalize(filePath.replace(/\\/g, "/"));
  if (normalized === ".") {
    return "";
  }
  return normalized.replace(/^\.\/+/, "").replace(/^\/+/, "");
}

function decodePathSafe(inputPath) {
  try {
    return decodeURI(inputPath);
  } catch {
    return inputPath;
  }
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
    return {
      referencePath: reference,
      suffix: ""
    };
  }

  return {
    referencePath: reference.slice(0, splitIndex),
    suffix: reference.slice(splitIndex)
  };
}

function normalizeReferencePath(referencePath) {
  if (!referencePath) {
    return "";
  }

  const decoded = decodePathSafe(referencePath.trim());
  if (!decoded) {
    return "";
  }

  let normalized = decoded.replace(/\\/g, "/");
  normalized = normalized.replace(/\/{2,}/g, "/");

  if (normalized.startsWith("./")) {
    normalized = normalized.slice(2);
  }

  return normalized;
}

function shouldSkipReference(reference) {
  if (!reference) {
    return true;
  }

  const trimmed = reference.trim();
  if (!trimmed || trimmed.startsWith("#")) {
    return true;
  }

  if (trimmed.includes("${") || trimmed.includes("{{") || trimmed.includes("%PUBLIC_URL%")) {
    return true;
  }

  const lowerTrimmed = trimmed.toLowerCase();
  return SKIP_PREFIXES.some((prefix) => lowerTrimmed.startsWith(prefix));
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

function buildNoscriptRanges(content) {
  const ranges = [];
  NOSCRIPT_BLOCK_REGEX.lastIndex = 0;

  let match = NOSCRIPT_BLOCK_REGEX.exec(content);
  while (match) {
    ranges.push({
      start: match.index,
      end: match.index + match[0].length
    });
    match = NOSCRIPT_BLOCK_REGEX.exec(content);
  }

  return ranges;
}

function isInsideRanges(index, ranges) {
  for (const range of ranges) {
    if (index >= range.start && index < range.end) {
      return true;
    }
  }
  return false;
}

function getAttributeValue(tag, attributeName) {
  const escapedName = attributeName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const quotedRegex = new RegExp(`(?:^|\\s)${escapedName}\\s*=\\s*(['"])([^'"]*)\\1`, "i");
  const quotedMatch = quotedRegex.exec(tag);
  if (quotedMatch) {
    return quotedMatch[2].trim();
  }

  const unquotedRegex = new RegExp(`(?:^|\\s)${escapedName}\\s*=\\s*([^\\s>]+)`, "i");
  const unquotedMatch = unquotedRegex.exec(tag);
  return unquotedMatch ? unquotedMatch[1].trim() : "";
}

function classifyResourceTag(tag) {
  const lowerTag = tag.toLowerCase();
  if (lowerTag.startsWith("<script")) {
    return "script";
  }

  if (!lowerTag.startsWith("<link")) {
    return null;
  }

  const relValue = getAttributeValue(lowerTag, "rel").toLowerCase();
  const asValue = getAttributeValue(lowerTag, "as").toLowerCase();
  const relParts = relValue.split(/\s+/).filter(Boolean);

  if (relParts.includes("stylesheet")) {
    return "style-sheet";
  }

  if (relParts.includes("preload") && asValue === "style") {
    return "style-preload";
  }

  return null;
}

function toProjectRelativePath(sourceFile, normalizedReferencePath) {
  if (!normalizedReferencePath) {
    return "";
  }

  let projectRelative = "";
  if (normalizedReferencePath.startsWith("/")) {
    projectRelative = normalizeRelativePath(normalizedReferencePath.slice(1));
  } else {
    const sourceDir = path.posix.dirname(sourceFile);
    projectRelative = normalizeRelativePath(path.posix.join(sourceDir, normalizedReferencePath));
  }

  if (!projectRelative) {
    return "";
  }

  if (projectRelative.startsWith("..")) {
    return null;
  }

  return projectRelative;
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
  if (!candidates.length || !wantedPath) {
    return null;
  }

  if (candidates.length === 1) {
    return candidates[0];
  }

  const scored = candidates
    .map((candidate) => ({
      candidate,
      score: scorePathSimilarity(candidate, wantedPath)
    }))
    .sort((first, second) => second.score - first.score);

  const first = scored[0];
  const second = scored[1];
  if (!second || first.score >= second.score + 3) {
    return first.candidate;
  }

  return null;
}

async function buildProjectIndex({ root, ignorePatterns }) {
  const projectFiles = await glob("**/*", {
    cwd: root,
    nodir: true,
    ignore: ignorePatterns
  });

  const files = new Set(projectFiles.map((file) => normalizeRelativePath(toPosix(file))));
  const assets = [...files].filter((file) => ASSET_FILE_REGEX.test(file));

  const assetBasenameMap = new Map();
  for (const asset of assets) {
    const basename = path.posix.basename(asset).toLowerCase();
    if (!assetBasenameMap.has(basename)) {
      assetBasenameMap.set(basename, []);
    }
    assetBasenameMap.get(basename).push(asset);
  }

  for (const candidates of assetBasenameMap.values()) {
    candidates.sort();
  }

  return {
    files,
    assets,
    assetBasenameMap
  };
}

function suggestAssetPath(reference, fileIndex) {
  const extension = path.posix.extname(reference.normalizedReferencePath || "").toLowerCase();
  if (extension !== ".js" && extension !== ".mjs" && extension !== ".css") {
    return null;
  }

  const wantedPath = reference.projectRelativePathCandidate || reference.normalizedReferencePath.replace(/^\/+/, "");
  const basename = path.posix.basename(reference.normalizedReferencePath || "").toLowerCase();
  const basenameCandidates = fileIndex.assetBasenameMap.get(basename) || [];

  if (basenameCandidates.length === 1) {
    return basenameCandidates[0];
  }

  if (basenameCandidates.length > 1 && wantedPath) {
    const picked = chooseBestCandidate(basenameCandidates, wantedPath);
    if (picked) {
      return picked;
    }
  }

  if (wantedPath) {
    const suffixMatches = fileIndex.assets.filter((candidate) => candidate.toLowerCase().endsWith(wantedPath.toLowerCase()));
    if (suffixMatches.length === 1) {
      return suffixMatches[0];
    }
  }

  return null;
}

function evaluateResourceReference(reference, fileIndex) {
  if (shouldSkipReference(reference.original)) {
    return {
      status: "ignored",
      reason: "external_or_non_file"
    };
  }

  const { referencePath, suffix } = splitReferenceAndSuffix(reference.original);
  const normalizedReferencePath = normalizeReferencePath(referencePath);

  if (!normalizedReferencePath) {
    return {
      status: "ignored",
      reason: "empty_reference"
    };
  }

  const projectRelativePath = toProjectRelativePath(reference.file, normalizedReferencePath);
  if (projectRelativePath === null) {
    const suggestion = suggestAssetPath(
      {
        normalizedReferencePath,
        projectRelativePathCandidate: ""
      },
      fileIndex
    );

    return {
      status: "broken",
      reason: "outside_project_root",
      suffix,
      normalizedReferencePath,
      projectRelativePathCandidate: "",
      suggestion: suggestion ? `/${suggestion}${suffix}` : null
    };
  }

  if (!projectRelativePath) {
    return {
      status: "ignored",
      reason: "empty_after_normalization",
      suffix,
      normalizedReferencePath
    };
  }

  if (fileIndex.files.has(projectRelativePath)) {
    const canonical = `/${projectRelativePath}${suffix}`;
    const rawReference = reference.original.trim();
    const needsNormalization =
      referencePath.includes("\\") ||
      referencePath.includes("/./") ||
      referencePath.startsWith("./") ||
      referencePath.includes("../") ||
      referencePath.includes("//");

    return {
      status: "valid",
      suffix,
      normalizedReferencePath,
      projectRelativePath,
      canonical,
      needsNormalization: needsNormalization && canonical !== rawReference
    };
  }

  const suggestion = suggestAssetPath(
    {
      normalizedReferencePath,
      projectRelativePathCandidate: projectRelativePath
    },
    fileIndex
  );

  return {
    status: "broken",
    reason: "path_not_found",
    suffix,
    normalizedReferencePath,
    projectRelativePathCandidate: projectRelativePath,
    suggestion: suggestion ? `/${suggestion}${suffix}` : null
  };
}

function referencePriorityScore(reference) {
  let score = 0;
  if (/[?&]v=\d+/i.test(reference.suffix || "")) {
    score += 50;
  } else if (reference.suffix) {
    score += 10;
  }
  if (/\.min\./i.test(reference.normalizedReferencePath || "")) {
    score += 2;
  }
  return score;
}

function selectDuplicateKeeper(references) {
  const sorted = [...references].sort((first, second) => {
    const scoreDifference = referencePriorityScore(second) - referencePriorityScore(first);
    if (scoreDifference !== 0) {
      return scoreDifference;
    }
    return first.tagStart - second.tagStart;
  });

  return sorted[0];
}

function buildTopFileStats(rows) {
  const counts = new Map();
  for (const row of rows) {
    counts.set(row.file, (counts.get(row.file) || 0) + 1);
  }

  return [...counts.entries()]
    .sort((first, second) => second[1] - first[1] || first[0].localeCompare(second[0]))
    .map(([file, count]) => ({ file, count }));
}

function extractResourceReferencesFromContent(file, content) {
  const references = [];
  const lineStarts = buildLineStarts(content);
  const noscriptRanges = buildNoscriptRanges(content);

  RESOURCE_TAG_REGEX.lastIndex = 0;
  let match = RESOURCE_TAG_REGEX.exec(content);
  while (match) {
    const tag = match[0];
    const kind = classifyResourceTag(tag);
    if (!kind) {
      match = RESOURCE_TAG_REGEX.exec(content);
      continue;
    }

    const original = (match[2] || match[4] || "").trim();
    if (!original) {
      match = RESOURCE_TAG_REGEX.exec(content);
      continue;
    }

    const valueStartOffset = tag.indexOf(original);
    if (valueStartOffset < 0) {
      match = RESOURCE_TAG_REGEX.exec(content);
      continue;
    }

    const valueStart = match.index + valueStartOffset;
    const valueEnd = valueStart + original.length;
    const tagStart = match.index;
    const tagEnd = match.index + tag.length;

    references.push({
      file,
      kind,
      original,
      tag,
      line: indexToLine(lineStarts, tagStart),
      tagStart,
      tagEnd,
      valueStart,
      valueEnd,
      inNoscript: isInsideRanges(tagStart, noscriptRanges)
    });

    match = RESOURCE_TAG_REGEX.exec(content);
  }

  return references;
}

export async function runResourceAudit({
  root = process.cwd(),
  filePatterns = DEFAULT_HTML_PATTERNS,
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
  const fileIndex = await buildProjectIndex({ root, ignorePatterns });
  const references = [];

  for (const file of files) {
    const absolutePath = path.join(root, file);
    const content = await fs.readFile(absolutePath, "utf8");
    const fileReferences = extractResourceReferencesFromContent(file, content);
    for (const fileReference of fileReferences) {
      const evaluation = evaluateResourceReference(fileReference, fileIndex);
      references.push({
        ...fileReference,
        ...evaluation
      });
    }
  }

  const localReferences = references.filter((reference) => reference.status !== "ignored");
  const brokenReferences = localReferences.filter((reference) => reference.status === "broken");
  const fixableBrokenReferences = brokenReferences.filter((reference) => Boolean(reference.suggestion));
  const normalizationCandidates = localReferences.filter(
    (reference) => reference.status === "valid" && reference.needsNormalization
  );

  const duplicateRows = [];
  const groupedByFile = new Map();
  for (const reference of localReferences) {
    if (!groupedByFile.has(reference.file)) {
      groupedByFile.set(reference.file, []);
    }
    groupedByFile.get(reference.file).push(reference);
  }

  for (const fileReferences of groupedByFile.values()) {
    const dedupeGroups = new Map();
    for (const reference of fileReferences) {
      if (reference.inNoscript) {
        continue;
      }

      const resourceKey = String(
        reference.projectRelativePath ||
          reference.projectRelativePathCandidate ||
          reference.normalizedReferencePath ||
          ""
      ).toLowerCase();
      if (!resourceKey) {
        continue;
      }

      const dedupeKey = `${reference.kind}|${resourceKey}`;
      if (!dedupeGroups.has(dedupeKey)) {
        dedupeGroups.set(dedupeKey, []);
      }
      dedupeGroups.get(dedupeKey).push(reference);
    }

    for (const [dedupeKey, groupReferences] of dedupeGroups.entries()) {
      if (groupReferences.length <= 1) {
        continue;
      }

      const keeper = selectDuplicateKeeper(groupReferences);
      for (const reference of groupReferences) {
        if (reference === keeper) {
          reference.isDuplicateLeader = true;
          continue;
        }

        reference.isDuplicate = true;
        reference.duplicateKey = dedupeKey;
        reference.duplicateKeeperLine = keeper.line;
        reference.duplicateKeeperReference = keeper.original;

        duplicateRows.push({
          file: reference.file,
          line: reference.line,
          kind: reference.kind,
          reference: reference.original,
          duplicateOfLine: keeper.line,
          duplicateOfReference: keeper.original
        });
      }
    }
  }

  duplicateRows.sort((first, second) => {
    if (first.file !== second.file) {
      return first.file.localeCompare(second.file);
    }
    return first.line - second.line;
  });

  const brokenRows = brokenReferences
    .map((reference) => ({
      file: reference.file,
      line: reference.line,
      kind: reference.kind,
      reference: reference.original,
      reason: reference.reason,
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
    resourcesScanned: references.length,
    localResources: localReferences.length,
    brokenResources: brokenReferences.length,
    fixableBrokenResources: fixableBrokenReferences.length,
    duplicateResources: duplicateRows.length,
    normalizationCandidates: normalizationCandidates.length,
    topBrokenFiles: buildTopFileStats(brokenRows),
    topDuplicateFiles: buildTopFileStats(duplicateRows),
    brokenRows,
    duplicateRows,
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
  lines.push(`- إجمالي مراجع JS/CSS: ${report.resourcesScanned}`);
  lines.push(`- المراجع المحلية المفحوصة: ${report.localResources}`);
  lines.push(`- المسارات المكسورة: ${report.brokenResources}`);
  lines.push(`- المسارات القابلة للإصلاح التلقائي: ${report.fixableBrokenResources}`);
  lines.push(`- التحميلات المكررة داخل الصفحة: ${report.duplicateResources}`);
  lines.push(`- فرص توحيد المسارات: ${report.normalizationCandidates}`);
  lines.push("");

  lines.push("## الملفات الأعلى تكرارًا");
  lines.push("");
  if (!report.topDuplicateFiles.length) {
    lines.push("- لا يوجد تكرار موارد.");
  } else {
    lines.push("| الملف | عدد التكرارات |");
    lines.push("| --- | ---: |");
    for (const row of report.topDuplicateFiles.slice(0, 25)) {
      lines.push(`| ${escapePipe(row.file)} | ${row.count} |`);
    }
  }
  lines.push("");

  lines.push("## تفاصيل المسارات المكسورة");
  lines.push("");
  if (!report.brokenRows.length) {
    lines.push("- لا توجد مسارات مكسورة.");
  } else {
    lines.push("| الملف | السطر | النوع | المسار | الاقتراح | السبب |");
    lines.push("| --- | ---: | --- | --- | --- | --- |");
    for (const row of report.brokenRows) {
      lines.push(
        `| ${escapePipe(row.file)} | ${row.line} | ${escapePipe(row.kind)} | ${escapePipe(row.reference)} | ${escapePipe(
          row.suggestion || "—"
        )} | ${escapePipe(row.reason || "—")} |`
      );
    }
  }
  lines.push("");

  lines.push("## تفاصيل التكرارات");
  lines.push("");
  if (!report.duplicateRows.length) {
    lines.push("- لا توجد تحميلات مكررة.");
  } else {
    lines.push("| الملف | السطر | النوع | المرجع المكرر | النسخة المعتمدة |");
    lines.push("| --- | ---: | --- | --- | --- |");
    for (const row of report.duplicateRows) {
      const keeper = `${row.duplicateOfReference} (line ${row.duplicateOfLine})`;
      lines.push(
        `| ${escapePipe(row.file)} | ${row.line} | ${escapePipe(row.kind)} | ${escapePipe(row.reference)} | ${escapePipe(
          keeper
        )} |`
      );
    }
  }
  lines.push("");

  return `${lines.join("\n")}\n`;
}

export async function writeResourceAuditArtifacts({
  report,
  jsonPath,
  markdownPath,
  title
}) {
  await fs.mkdir(path.dirname(jsonPath), { recursive: true });
  await fs.mkdir(path.dirname(markdownPath), { recursive: true });

  const serializable = {
    generatedAt: report.generatedAt,
    root: report.root,
    filesScanned: report.filesScanned,
    resourcesScanned: report.resourcesScanned,
    localResources: report.localResources,
    brokenResources: report.brokenResources,
    fixableBrokenResources: report.fixableBrokenResources,
    duplicateResources: report.duplicateResources,
    normalizationCandidates: report.normalizationCandidates,
    topBrokenFiles: report.topBrokenFiles,
    topDuplicateFiles: report.topDuplicateFiles,
    brokenRows: report.brokenRows,
    duplicateRows: report.duplicateRows
  };

  await fs.writeFile(jsonPath, `${JSON.stringify(serializable, null, 2)}\n`, "utf8");
  await fs.writeFile(markdownPath, buildMarkdownReport(report, title), "utf8");
}

function extendRemovalToNoscript(content, removalEnd, normalizedReferencePath) {
  const tail = content.slice(removalEnd);
  const trailingNoscriptMatch = /^\s*<noscript\b[^>]*>[\s\S]*?<\/noscript>/i.exec(tail);
  if (!trailingNoscriptMatch) {
    return removalEnd;
  }

  const noscriptBlock = trailingNoscriptMatch[0];
  const normalizedCandidate = normalizedReferencePath.toLowerCase();
  if (noscriptBlock.toLowerCase().includes(normalizedCandidate)) {
    return removalEnd + noscriptBlock.length;
  }

  return removalEnd;
}

function extendRemovalToScriptClose(content, removalEnd) {
  const tail = content.slice(removalEnd);
  const trailingCloseMatch = /^\s*<\/script\s*>/i.exec(tail);
  if (!trailingCloseMatch) {
    return removalEnd;
  }
  return removalEnd + trailingCloseMatch[0].length;
}

function isInsideAnyRange(start, end, ranges) {
  for (const range of ranges) {
    if (start >= range.start && end <= range.end) {
      return true;
    }
  }
  return false;
}

export async function applyResourceFixes({
  root = process.cwd(),
  auditReport
} = {}) {
  const report = auditReport || (await runResourceAudit({ root }));
  const referencesByFile = new Map();

  for (const reference of report.references) {
    if (!referencesByFile.has(reference.file)) {
      referencesByFile.set(reference.file, []);
    }
    referencesByFile.get(reference.file).push(reference);
  }

  const changedFiles = [];
  let duplicateTagsRemoved = 0;
  let brokenPathsFixed = 0;

  for (const [file, fileReferences] of referencesByFile.entries()) {
    const absoluteFilePath = path.join(root, file);
    const content = await fs.readFile(absoluteFilePath, "utf8");
    const edits = [];
    const removalRanges = [];

    for (const reference of fileReferences) {
      if (!reference.isDuplicate) {
        continue;
      }

      let removalEnd = reference.tagEnd;
      if (reference.kind === "style-preload") {
        removalEnd = extendRemovalToNoscript(content, removalEnd, reference.normalizedReferencePath || "");
      } else if (reference.kind === "script") {
        removalEnd = extendRemovalToScriptClose(content, removalEnd);
      }

      edits.push({
        start: reference.tagStart,
        end: removalEnd,
        value: "",
        type: "remove-duplicate"
      });
      removalRanges.push({
        start: reference.tagStart,
        end: removalEnd
      });
      duplicateTagsRemoved += 1;
    }

    for (const reference of fileReferences) {
      if (reference.status !== "broken" || !reference.suggestion) {
        continue;
      }

      if (isInsideAnyRange(reference.valueStart, reference.valueEnd, removalRanges)) {
        continue;
      }

      edits.push({
        start: reference.valueStart,
        end: reference.valueEnd,
        value: reference.suggestion,
        type: "fix-broken"
      });
      brokenPathsFixed += 1;
    }

    if (!edits.length) {
      continue;
    }

    edits.sort((first, second) => {
      if (first.start !== second.start) {
        return second.start - first.start;
      }
      return second.end - first.end;
    });

    let updatedContent = content;
    for (const edit of edits) {
      updatedContent = `${updatedContent.slice(0, edit.start)}${edit.value}${updatedContent.slice(edit.end)}`;
    }

    if (updatedContent !== content) {
      await fs.writeFile(absoluteFilePath, updatedContent, "utf8");
      changedFiles.push(file);
    }
  }

  return {
    changedFiles,
    duplicateTagsRemoved,
    brokenPathsFixed
  };
}

export async function writeResourceComparisonReport({
  beforeReport,
  afterReport,
  fixResult,
  markdownPath
}) {
  const lines = [];
  lines.push("# تقرير مقارنة قبل/بعد إصلاح مسارات الموارد");
  lines.push("");
  lines.push(`- تاريخ الإنشاء: ${new Date().toISOString()}`);
  lines.push(`- الملفات المعدلة: ${fixResult.changedFiles.length}`);
  lines.push(`- وسوم التحميل المكررة المحذوفة: ${fixResult.duplicateTagsRemoved}`);
  lines.push(`- المسارات المكسورة المصححة: ${fixResult.brokenPathsFixed}`);
  lines.push("");
  lines.push("| المؤشر | قبل | بعد | الفرق |");
  lines.push("| --- | ---: | ---: | ---: |");
  lines.push(
    `| المسارات المكسورة | ${beforeReport.brokenResources} | ${afterReport.brokenResources} | ${
      afterReport.brokenResources - beforeReport.brokenResources
    } |`
  );
  lines.push(
    `| التحميلات المكررة | ${beforeReport.duplicateResources} | ${afterReport.duplicateResources} | ${
      afterReport.duplicateResources - beforeReport.duplicateResources
    } |`
  );
  lines.push(
    `| فرص التوحيد | ${beforeReport.normalizationCandidates} | ${afterReport.normalizationCandidates} | ${
      afterReport.normalizationCandidates - beforeReport.normalizationCandidates
    } |`
  );
  lines.push("");
  lines.push("## الملفات التي تم تعديلها");
  lines.push("");
  if (!fixResult.changedFiles.length) {
    lines.push("- لا توجد ملفات احتاجت تعديل.");
  } else {
    for (const file of fixResult.changedFiles) {
      lines.push(`- ${file}`);
    }
  }
  lines.push("");

  await fs.mkdir(path.dirname(markdownPath), { recursive: true });
  await fs.writeFile(markdownPath, `${lines.join("\n")}\n`, "utf8");
}
