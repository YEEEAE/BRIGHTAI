import {
  DRAFT_STORAGE_PREFIX,
  WORKFLOW_STORAGE_KEY,
} from "../constants/agent-builder.constants";
import type {
  حقلمسودةنصي,
  خطوة,
  حالةالنموذج,
  ملفمعرفة,
  ملخصسير,
  رابطمصدر,
} from "../types/agent-builder.types";

const MODEL_CONTEXT_WINDOWS: Record<string, number> = {
  "llama-3.1-405b-reasoning": 128000,
  "llama-3.1-70b-versatile": 128000,
  "llama-3.1-8b-instant": 128000,
  "mixtral-8x7b-32768": 32768,
  "gemma2-9b-it": 8192,
};

export const normalizeKnowledgeUrls = (input: unknown): رابطمصدر[] => {
  if (!Array.isArray(input)) {
    return [];
  }

  const out: رابطمصدر[] = [];

  for (let index = 0; index < input.length; index += 1) {
    const item = input[index];
    if (typeof item === "string") {
      out.push({
        id: `url_${index}_${Date.now()}`,
        url: item,
        words: 0,
        tokens: 0,
        status: "غير مفحوص",
        updatedAt: new Date().toISOString(),
        content: "",
        chunksData: [],
      });
      continue;
    }

    if (item && typeof item === "object") {
      const row = item as Record<string, unknown>;
      const url = String(row.url || "");
      if (!url) {
        continue;
      }

      out.push({
        id: String(row.id || `url_${index}_${Date.now()}`),
        url,
        words: Number(row.words || 0),
        tokens: Number(row.tokens || 0),
        status:
          row.status === "جارٍ الجلب" ||
          row.status === "جاهز" ||
          row.status === "فشل" ||
          row.status === "غير مفحوص"
            ? (row.status as رابطمصدر["status"])
            : "غير مفحوص",
        updatedAt: String(row.updatedAt || new Date().toISOString()),
        content: typeof row.content === "string" ? row.content : "",
        chunksData: Array.isArray(row.chunksData)
          ? row.chunksData.filter((entry): entry is string => typeof entry === "string")
          : [],
      });
    }
  }

  return out;
};

export const normalizeKnowledgeFiles = (input: unknown): ملفمعرفة[] => {
  if (!Array.isArray(input)) {
    return [];
  }

  const out: ملفمعرفة[] = [];

  for (let index = 0; index < input.length; index += 1) {
    const item = input[index];
    if (!item || typeof item !== "object") {
      continue;
    }

    const row = item as Record<string, unknown>;
    const name = String(row.name || "");
    if (!name) {
      continue;
    }

    out.push({
      id: String(row.id || `file_${index}_${Date.now()}`),
      name,
      size: Number(row.size || 0),
      type: String(row.type || "application/octet-stream"),
      words: Number(row.words || 0),
      tokens: Number(row.tokens || 0),
      chunks: Number(row.chunks || 0),
      updatedAt: String(row.updatedAt || new Date().toISOString()),
      content: typeof row.content === "string" ? row.content : "",
      chunksData: Array.isArray(row.chunksData)
        ? row.chunksData.filter((entry): entry is string => typeof entry === "string")
        : [],
    });
  }

  return out;
};

const tokenize = (text: string): string[] =>
  text
    .toLowerCase()
    .replace(/[^A-Za-z0-9\u0600-\u06FF\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter((part) => part.length >= 2);

const scoreChunk = (queryTerms: Set<string>, chunk: string): number => {
  if (!chunk.trim() || queryTerms.size === 0) {
    return 0;
  }

  const terms = tokenize(chunk);
  if (terms.length === 0) {
    return 0;
  }

  let hits = 0;
  for (const term of terms) {
    if (queryTerms.has(term)) {
      hits += 1;
    }
  }

  return hits / Math.max(terms.length, 1);
};

const detectIntentBoost = (question: string, source: string, chunk: string): number => {
  const q = question.toLowerCase();
  const s = source.toLowerCase();
  const c = chunk.toLowerCase();

  let boost = 0;

  const hasCodeIntent =
    q.includes("كود") || q.includes("برمجة") || q.includes("api") || q.includes("تقني");
  const hasPolicyIntent =
    q.includes("سياسة") || q.includes("شروط") || q.includes("خصوصية") || q.includes("امتثال");
  const hasCostIntent = q.includes("تكلفة") || q.includes("سعر") || q.includes("اشتراك");
  const hasSupportIntent = q.includes("عميل") || q.includes("دعم") || q.includes("مشكلة");

  if (hasCodeIntent && (s.includes("ملف") || c.includes("api") || c.includes("sdk"))) {
    boost += 0.18;
  }
  if (hasPolicyIntent && (c.includes("سياسة") || c.includes("شروط") || c.includes("امتثال"))) {
    boost += 0.2;
  }
  if (hasCostIntent && (c.includes("تكلفة") || c.includes("سعر") || c.includes("خطة"))) {
    boost += 0.22;
  }
  if (hasSupportIntent && (c.includes("عميل") || c.includes("دعم") || c.includes("خدمة"))) {
    boost += 0.16;
  }

  if (s.includes("نص مباشر")) {
    boost += 0.04;
  }

  return boost;
};

const compressChunk = (chunk: string, maxChars = 520): string => {
  const normalized = chunk.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxChars) {
    return normalized;
  }
  return `${normalized.slice(0, maxChars)}...`;
};

const dedupeChunks = (rows: Array<{ source: string; text: string; score: number }>) => {
  const seen = new Set<string>();
  const out: Array<{ source: string; text: string; score: number }> = [];
  for (const row of rows) {
    const key = row.text.toLowerCase().slice(0, 220);
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    out.push(row);
  }
  return out;
};

const chunkText = (text: string, chunkSize = 1000, overlap = 120): string[] => {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) {
    return [];
  }

  const chunks: string[] = [];
  let start = 0;
  while (start < normalized.length) {
    const end = Math.min(start + chunkSize, normalized.length);
    chunks.push(normalized.slice(start, end));
    if (end >= normalized.length) {
      break;
    }
    start = Math.max(0, end - overlap);
  }

  return chunks;
};

export type مقطعمعرفةمسترجع = {
  id: string;
  source: string;
  text: string;
  score: number;
};

export const retrieveKnowledgeChunks = (
  question: string,
  directText: string,
  urls: رابطمصدر[],
  files: ملفمعرفة[],
  maxChunks = 8,
  maxChunkChars = 520
): مقطعمعرفةمسترجع[] => {
  const queryTerms = new Set(tokenize(question));
  const candidates: Array<{ source: string; text: string; score: number }> = [];

  const pushChunks = (source: string, chunks: string[]) => {
    for (const chunk of chunks) {
      const text = chunk.trim();
      if (!text) {
        continue;
      }
      const base = scoreChunk(queryTerms, text);
      const boost = detectIntentBoost(question, source, text);
      const score = base + boost;
      candidates.push({ source, text: compressChunk(text, maxChunkChars), score });
    }
  };

  if (directText.trim()) {
    pushChunks("نص مباشر", chunkText(directText, 1000, 120));
  }

  for (const item of urls) {
    const source = `رابط: ${item.url}`;
    if (Array.isArray(item.chunksData) && item.chunksData.length > 0) {
      pushChunks(source, item.chunksData.slice(0, 120));
    } else if (item.content) {
      pushChunks(source, chunkText(item.content, 1000, 120));
    }
  }

  for (const item of files) {
    const source = `ملف: ${item.name}`;
    if (Array.isArray(item.chunksData) && item.chunksData.length > 0) {
      pushChunks(source, item.chunksData.slice(0, 120));
    } else if (item.content) {
      pushChunks(source, chunkText(item.content, 1000, 120));
    }
  }

  return dedupeChunks(candidates)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxChunks)
    .map((item, index) => ({
      id: `${item.source}_${index}_${item.score.toFixed(4)}`,
      source: item.source,
      text: item.text,
      score: item.score,
    }));
};

export const extractKnowledgeContext = (
  question: string,
  directText: string,
  urls: رابطمصدر[],
  files: ملفمعرفة[],
  maxChunks = 8
) => {
  const ranked = retrieveKnowledgeChunks(question, directText, urls, files, maxChunks).map(
    (item, index) => `[${index + 1}] ${item.source}\n${item.text}`
  );

  if (ranked.length === 0) {
    return "";
  }

  return `مقاطع معرفة مسترجعة (الأكثر صلة بالسؤال):\n${ranked.join("\n\n")}`;
};

export const resolveModelContextWindow = (model: string): number => {
  return MODEL_CONTEXT_WINDOWS[model] || 32768;
};

export const clampKnowledgeContext = (
  text: string,
  model: string,
  reservedTokens = 2500
): string => {
  const windowTokens = resolveModelContextWindow(model);
  const budgetTokens = Math.max(1200, Math.floor(windowTokens - reservedTokens));
  const estimated = تقديرالرموز(text);
  if (estimated <= budgetTokens) {
    return text;
  }
  const ratio = budgetTokens / Math.max(estimated, 1);
  const chars = Math.max(1200, Math.floor(text.length * ratio));
  return `${text.slice(0, chars)}\n\n[تم اختصار سياق المعرفة تلقائيًا ليتوافق مع سعة النموذج]`;
};

export const getDraftKey = (agentId?: string) => `${DRAFT_STORAGE_PREFIX}_${agentId || "new"}`;

export const تقديرالرموز = (text: string) => {
  if (!text.trim()) {
    return 0;
  }
  return Math.ceil(text.trim().length / 4);
};

export const delay = (ms: number) =>
  new Promise<void>((resolve) => window.setTimeout(resolve, ms));

export const withTimeout = async <T,>(
  promise: Promise<T>,
  ms: number,
  fallback: T
): Promise<T> => {
  const timeoutPromise = new Promise<T>((resolve) => {
    window.setTimeout(() => resolve(fallback), ms);
  });
  return Promise.race([promise, timeoutPromise]);
};

export const evaluateStep = (stepId: خطوة, form: حالةالنموذج) => {
  if (stepId === 1) {
    const nameLength = form.الاسم.trim().length;
    const descLength = form.الوصف.trim().length;
    if (nameLength < 3 || nameLength > 50) {
      return { valid: false, message: "اسم الوكيل يجب أن يكون بين ٣ و ٥٠ حرفًا." };
    }
    if (descLength < 10 || descLength > 500) {
      return { valid: false, message: "الوصف يجب أن يكون بين ١٠ و ٥٠٠ حرف." };
    }
    if (form.الفئة === "أخرى (مخصصة)" && form.فئةمخصصة.trim().length < 2) {
      return { valid: false, message: "أدخل اسمًا واضحًا للفئة المخصصة." };
    }
  }

  if (stepId === 2) {
    if (form.الموجهالنظامي.trim().length < 30) {
      return { valid: false, message: "الموجه النظامي قصير، أضف تعليمات أدق." };
    }
  }

  if (stepId === 4) {
    if (form.maxTokens < 100 || form.maxTokens > 32000) {
      return { valid: false, message: "قيمة الحد الأقصى للرموز خارج النطاق." };
    }
    if (form.timeoutSeconds < 10 || form.timeoutSeconds > 600) {
      return { valid: false, message: "مهلة التنفيذ يجب أن تكون بين ١٠ و ٦٠٠ ثانية." };
    }
    if (form.webhookUrl && !/^https?:\/\//.test(form.webhookUrl)) {
      return { valid: false, message: "رابط الويب هوك غير صالح." };
    }
    if (form.حدالمقاطعالمعرفية < 1 || form.حدالمقاطعالمعرفية > 20) {
      return { valid: false, message: "حد المقاطع المعرفية يجب أن يكون بين ١ و ٢٠." };
    }
    if (form.حدطولالمقطعالمعرفي < 120 || form.حدطولالمقطعالمعرفي > 1200) {
      return { valid: false, message: "طول المقطع المعرفي يجب أن يكون بين ١٢٠ و ١٢٠٠ حرف." };
    }
  }

  return { valid: true, message: "" };
};

export const readWorkflowSummary = (): ملخصسير => {
  try {
    const raw = localStorage.getItem(WORKFLOW_STORAGE_KEY);
    if (!raw) {
      return { nodes: 0, edges: 0, sizeKb: 0, raw: null };
    }
    const parsed = JSON.parse(raw) as { nodes?: unknown[]; edges?: unknown[] };
    const nodes = Array.isArray(parsed.nodes) ? parsed.nodes.length : 0;
    const edges = Array.isArray(parsed.edges) ? parsed.edges.length : 0;
    const sizeKb = Number((new Blob([raw]).size / 1024).toFixed(2));
    return { nodes, edges, sizeKb, raw: parsed as Record<string, unknown> };
  } catch {
    return { nodes: 0, edges: 0, sizeKb: 0, raw: null };
  }
};

export type { حقلمسودةنصي };
