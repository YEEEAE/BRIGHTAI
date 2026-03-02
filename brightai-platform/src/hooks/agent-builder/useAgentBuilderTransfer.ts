import { useCallback } from "react";
import { trackFeatureUsed } from "../../lib/analytics";
import { WORKFLOW_STORAGE_KEY } from "../../constants/agent-builder.constants";
import { readWorkflowSummary } from "../../lib/agent-builder.utils";
import type { حالةالنموذج, حقلمسودةنصي, ملخصسير } from "../../types/agent-builder.types";

type Params = {
  form: حالةالنموذج;
  workflowSummary: ملخصسير;
  getFieldValueFromRef: (field: حقلمسودةنصي) => string;
  applyPartialForm: (partial: Partial<حالةالنموذج>) => void;
  setWorkflowKey: (next: number | ((prev: number) => number)) => void;
  setWorkflowSummary: (next: ملخصسير | ((prev: ملخصسير) => ملخصسير)) => void;
  showError: (msg: string) => void;
  showSuccess: (msg: string) => void;
};

const useAgentBuilderTransfer = ({
  form,
  workflowSummary,
  getFieldValueFromRef,
  applyPartialForm,
  setWorkflowKey,
  setWorkflowSummary,
  showError,
  showSuccess,
}: Params) => {
  const exportJson = useCallback(() => {
    const payload = {
      schema: "brightai-agent-v1",
      savedAt: new Date().toISOString(),
      form,
      workflow: workflowSummary.raw,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${getFieldValueFromRef("الاسم") || form.الاسم || "وكيل"}.json`;
    anchor.click();
    URL.revokeObjectURL(url);

    showSuccess("تم تصدير الوكيل كملف JSON.");
    trackFeatureUsed("تصدير JSON");
  }, [form, getFieldValueFromRef, showSuccess, workflowSummary.raw]);

  const importJson = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || "{}")) as {
          form?: Partial<حالةالنموذج>;
          workflow?: Record<string, unknown>;
        };

        if (parsed.form) {
          applyPartialForm(parsed.form);
        }
        if (parsed.workflow) {
          localStorage.setItem(WORKFLOW_STORAGE_KEY, JSON.stringify(parsed.workflow));
          setWorkflowKey((prev) => prev + 1);
          setWorkflowSummary(readWorkflowSummary());
        }

        showSuccess("تم استيراد ملف JSON بنجاح.");
        trackFeatureUsed("استيراد JSON");
      } catch {
        showError("ملف JSON غير صالح.");
      }
    };
    reader.readAsText(file);
  }, [applyPartialForm, setWorkflowKey, setWorkflowSummary, showError, showSuccess]);

  return {
    exportJson,
    importJson,
  };
};

export default useAgentBuilderTransfer;
