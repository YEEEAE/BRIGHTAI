import { actionLabelMap, modelLabelMap, outputLabelMap, variableOptions } from "../constants/node-editor.constants";
import type { NodeDraft } from "../types/node-editor.types";

export const normalizeTemplateText = (value: string): string => {
  let result = value;
  variableOptions.forEach((variable) => {
    const pattern = new RegExp(`\\{\\{\\s*${variable.token}\\s*\\}\\}`, "g");
    result = result.replace(pattern, `{{${variable.key}}}`);
  });
  return result;
};

export const normalizeDraft = (draft: NodeDraft): NodeDraft => {
  const normalized = { ...draft };
  ["text", "template", "systemPrompt", "payload"].forEach((key) => {
    if (typeof normalized[key] === "string") {
      normalized[key] = normalizeTemplateText(normalized[key] as string);
    }
  });
  return normalized;
};

export const formatModelLabel = (model: string): string => {
  return modelLabelMap[model] || "غير محدد";
};

export const formatActionLabel = (value: string): string => {
  return actionLabelMap[value] || "غير محدد";
};

export const formatOutputLabel = (value: string): string => {
  return outputLabelMap[value] || "نص";
};

export const estimateTokens = (draft: NodeDraft): number => {
  const base = `${draft.text || ""} ${draft.systemPrompt || ""}`;
  return Math.max(1, Math.ceil(base.length / 4));
};

export const formatCost = (tokens: number): string => {
  const rate = 0;
  const cost = (tokens / 1000) * rate;
  return cost.toLocaleString("ar-SA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export const buildSummary = (type: string | undefined, draft: NodeDraft): string => {
  if (!type) {
    return "";
  }
  if (type === "input") {
    return `قيمة افتراضية: ${draft.defaultValue || "غير محددة"}`;
  }
  if (type === "prompt") {
    return "موجه نصي مخصص للتنفيذ.";
  }
  if (type === "condition") {
    const count = Array.isArray(draft.conditions) ? draft.conditions.length : 0;
    return `عدد الشروط: ${count}`;
  }
  if (type === "groq") {
    return `نموذج: ${formatModelLabel(String(draft.model || ""))}`;
  }
  if (type === "action") {
    return `نوع الإجراء: ${formatActionLabel(String(draft.actionType || ""))}`;
  }
  if (type === "output") {
    return `صيغة المخرجات: ${formatOutputLabel(String(draft.format || ""))}`;
  }
  if (type === "loop") {
    return `عدد التكرارات: ${draft.iterations || "غير محدد"}`;
  }
  if (type === "variable") {
    return `المتغير: ${draft.key || "غير محدد"}`;
  }
  return "";
};
