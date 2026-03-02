import { useEffect, useMemo, useState } from "react";
import { variableOptions } from "../constants/node-editor.constants";
import { buildSummary, normalizeDraft } from "../lib/node-editor.utils";
import type { FieldError, NodeDraft, NodeEditorProps, DraftCondition } from "../types/node-editor.types";
import type { WorkflowNodeData } from "../components/agent/CustomNodes";

const useNodeEditor = ({ open, node, onClose, onSave }: NodeEditorProps) => {
  const [draft, setDraft] = useState<NodeDraft>({});
  const [errors, setErrors] = useState<FieldError[]>([]);

  useEffect(() => {
    if (node) {
      setDraft({
        label: node.data.label || "",
        description: node.data.description || "",
        ...(node.data.config || {}),
      });
      setErrors([]);
    }
  }, [node]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  const activeVariables = variableOptions;

  const updateField = (key: string, value: unknown) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const addCondition = () => {
    setDraft((prev) => {
      const current = Array.isArray(prev.conditions) ? (prev.conditions as DraftCondition[]) : [];
      return {
        ...prev,
        conditions: [...current, { variable: "", operator: "equals", value: "" }],
      };
    });
  };

  const updateCondition = (index: number, patch: Record<string, unknown>) => {
    setDraft((prev) => {
      const current = Array.isArray(prev.conditions) ? (prev.conditions as DraftCondition[]) : [];
      const next = current.map((item, idx) => (idx === index ? { ...item, ...patch } : item));
      return { ...prev, conditions: next };
    });
  };

  const removeCondition = (index: number) => {
    setDraft((prev) => {
      const current = Array.isArray(prev.conditions) ? (prev.conditions as DraftCondition[]) : [];
      const next = current.filter((_, idx) => idx !== index);
      return { ...prev, conditions: next };
    });
  };

  const insertVariable = (key: string, token: string) => {
    const current = String(draft[key] || "");
    updateField(key, `${current} {{${token}}}`.trim());
  };

  const validation = useMemo(() => {
    const nextErrors: FieldError[] = [];

    if (!String(draft.label || "").trim()) {
      nextErrors.push({ field: "label", message: "اسم العقدة مطلوب." });
    }

    if (node?.type === "prompt" || node?.type === "groq") {
      if (!String(draft.text || "").trim()) {
        nextErrors.push({ field: "text", message: "المحتوى النصي مطلوب." });
      }
    }

    if (node?.type === "condition") {
      if (!Array.isArray(draft.conditions) || (draft.conditions as unknown[]).length === 0) {
        nextErrors.push({ field: "conditions", message: "يجب تحديد شرط واحد على الأقل." });
      }
    }

    if (node?.type === "action") {
      if (!String(draft.actionType || "").trim()) {
        nextErrors.push({ field: "actionType", message: "نوع الإجراء مطلوب." });
      }
    }

    if (node?.type === "output") {
      if (!String(draft.template || "").trim()) {
        nextErrors.push({ field: "template", message: "قالب المخرجات مطلوب." });
      }
    }

    return nextErrors;
  }, [draft, node?.type]);

  const previewText = useMemo(() => {
    const template = String(draft.template || draft.text || "");
    if (!template) {
      return "لا توجد معاينة حالياً.";
    }
    return template.replace(/\{\{(.*?)\}\}/g, (_, key) => `«${String(key).trim()}»`);
  }, [draft]);

  const handleSave = () => {
    if (!node) {
      return;
    }

    if (validation.length > 0) {
      setErrors(validation);
      return;
    }

    const updated: WorkflowNodeData = {
      ...node.data,
      label: String(draft.label || ""),
      description: String(draft.description || ""),
      summary: buildSummary(node.type, draft),
      config: {
        ...normalizeDraft(draft),
      },
    };

    onSave(node.id, updated);
    onClose();
  };

  return {
    draft,
    errors,
    validation,
    previewText,
    activeVariables,
    updateField,
    addCondition,
    updateCondition,
    removeCondition,
    insertVariable,
    handleSave,
  };
};

export default useNodeEditor;
