import { useCallback } from "react";
import { WORKFLOW_STORAGE_KEY } from "../../constants/agent-builder.constants";
import { getDraftKey, readWorkflowSummary } from "../../lib/agent-builder.utils";
import type { حالةالنموذج, خطوة } from "../../types/agent-builder.types";

type Params = {
  id?: string;
  applyPartialForm: (partial: Partial<حالةالنموذج>) => void;
  setLastSavedAt: (next: string) => void;
  setStep: (next: خطوة) => void;
  setWorkflowKey: (next: number | ((prev: number) => number)) => void;
  setWorkflowSummary: (next: ReturnType<typeof readWorkflowSummary>) => void;
  setSaveState: (next: "غير محفوظ" | "جارٍ الحفظ..." | "تم الحفظ" | "تعذر الحفظ") => void;
  showError: (msg: string) => void;
};

const useAgentBuilderDraftRestore = ({
  id,
  applyPartialForm,
  setLastSavedAt,
  setStep,
  setWorkflowKey,
  setWorkflowSummary,
  setSaveState,
  showError,
}: Params) => {
  return useCallback(() => {
    const key = getDraftKey(id);
    const raw = localStorage.getItem(key);
    if (!raw) {
      return;
    }

    try {
      const parsed = JSON.parse(raw) as {
        form?: Partial<حالةالنموذج>;
        lastSavedAt?: string;
        step?: خطوة;
        workflow?: Record<string, unknown> | null;
      };
      if (parsed.form) {
        applyPartialForm(parsed.form);
      }
      setLastSavedAt(parsed.lastSavedAt || "");
      if (parsed.step && parsed.step >= 1 && parsed.step <= 5) {
        setStep(parsed.step);
      }
      if (parsed.workflow) {
        localStorage.setItem(WORKFLOW_STORAGE_KEY, JSON.stringify(parsed.workflow));
        setWorkflowKey((prev) => prev + 1);
        setWorkflowSummary(readWorkflowSummary());
      }
      setSaveState("تم الحفظ");
    } catch {
      showError("تعذر استعادة المسودة المحلية.");
    }
  }, [
    applyPartialForm,
    id,
    setLastSavedAt,
    setSaveState,
    setStep,
    setWorkflowKey,
    setWorkflowSummary,
    showError,
  ]);
};

export default useAgentBuilderDraftRestore;
