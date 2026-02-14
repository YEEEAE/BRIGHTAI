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

export const normalizeKnowledgeUrls = (input: unknown): رابطمصدر[] => {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .map((item, index) => {
      if (typeof item === "string") {
        return {
          id: `url_${index}_${Date.now()}`,
          url: item,
          words: 0,
          tokens: 0,
          status: "غير مفحوص" as const,
          updatedAt: new Date().toISOString(),
        };
      }

      if (item && typeof item === "object") {
        const row = item as Record<string, unknown>;
        const url = String(row.url || "");
        if (!url) {
          return null;
        }
        return {
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
        };
      }

      return null;
    })
    .filter((item): item is رابطمصدر => Boolean(item));
};

export const normalizeKnowledgeFiles = (input: unknown): ملفمعرفة[] => {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .map((item, index) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const row = item as Record<string, unknown>;
      const name = String(row.name || "");
      if (!name) {
        return null;
      }

      return {
        id: String(row.id || `file_${index}_${Date.now()}`),
        name,
        size: Number(row.size || 0),
        type: String(row.type || "application/octet-stream"),
        words: Number(row.words || 0),
        tokens: Number(row.tokens || 0),
        chunks: Number(row.chunks || 0),
        updatedAt: String(row.updatedAt || new Date().toISOString()),
      };
    })
    .filter((item): item is ملفمعرفة => Boolean(item));
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
