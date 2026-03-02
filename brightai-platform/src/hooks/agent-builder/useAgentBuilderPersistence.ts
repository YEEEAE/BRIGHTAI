import { useCallback, useEffect } from "react";
import { getDraftKey } from "../../lib/agent-builder.utils";
import type {
  حالةالنموذج,
  حالةحفظ,
  حقلمسودةنصي,
  خطوة,
  ملخصسير,
  نسخةمسودة,
} from "../../types/agent-builder.types";

type Params = {
  id?: string;
  form: حالةالنموذج;
  step: خطوة;
  workflowSummary: ملخصسير;
  initializedRef: { current: boolean };
  lastDraftFingerprintRef: { current: string };
  setLastSavedAt: (next: string) => void;
  setSaveState: (next: حالةحفظ) => void;
  getFieldValueFromRef: (field: حقلمسودةنصي) => string;
};

const useAgentBuilderPersistence = ({
  id,
  form,
  step,
  workflowSummary,
  initializedRef,
  lastDraftFingerprintRef,
  setLastSavedAt,
  setSaveState,
  getFieldValueFromRef,
}: Params) => {
  const saveDraftLocal = useCallback(() => {
    if (!initializedRef.current) {
      return;
    }

    const formForDraft = {
      ...form,
      الاسم: getFieldValueFromRef("الاسم"),
      الوصف: getFieldValueFromRef("الوصف"),
      فئةمخصصة: getFieldValueFromRef("فئةمخصصة"),
    };

    const fingerprint = JSON.stringify({
      agentId: id || null,
      form: formForDraft,
      step,
      workflow: workflowSummary.raw || null,
    });
    if (lastDraftFingerprintRef.current === fingerprint) {
      return;
    }

    const key = getDraftKey(id);
    const payload: نسخةمسودة = {
      agentId: id || null,
      form: formForDraft,
      step,
      workflow: workflowSummary.raw || null,
      lastSavedAt: new Date().toLocaleString("ar-SA"),
    };

    try {
      localStorage.setItem(key, JSON.stringify(payload));
      lastDraftFingerprintRef.current = fingerprint;
      setLastSavedAt(payload.lastSavedAt);
      setSaveState("تم الحفظ");
    } catch {
      setSaveState("تعذر الحفظ");
    }
  }, [
    form,
    getFieldValueFromRef,
    id,
    initializedRef,
    lastDraftFingerprintRef,
    setLastSavedAt,
    setSaveState,
    step,
    workflowSummary.raw,
  ]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      saveDraftLocal();
    }, 30000);
    return () => window.clearInterval(interval);
  }, [saveDraftLocal]);

  return {
    saveDraftLocal,
  };
};

export default useAgentBuilderPersistence;
