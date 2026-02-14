import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../../lib/supabase";
import { trackFeatureUsed } from "../../lib/analytics";
import type {
  حالةالنموذج,
  خطوة,
  حقلمسودةنصي,
  ملخصسير,
  نوعحفظ,
  وضعسير,
  حدثويبهوك,
} from "../../types/agent-builder.types";

type Params = {
  id?: string;
  userId: string;
  localMode: boolean;
  form: حالةالنموذج;
  workflowSummary: ملخصسير;
  flushBasicTextDrafts: () => void;
  validateStep: (stepId: خطوة, silent?: boolean) => boolean;
  getFieldValueFromRef: (field: حقلمسودةنصي) => string;
  saveDraftLocal: () => void;
  setSaving: (next: boolean) => void;
  setSaveState: (next: "غير محفوظ" | "جارٍ الحفظ..." | "تم الحفظ" | "تعذر الحفظ") => void;
  showError: (msg: string) => void;
  showSuccess: (msg: string) => void;
};

const supabaseClient = supabase as unknown as {
  from: (table: string) => any;
};

type SupabaseSaveError = {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
};

const OPTIONAL_AGENT_FIELDS = ["created_by", "tags"] as const;

const getErrorText = (error: unknown) => {
  if (!error || typeof error !== "object") {
    return "سبب غير معروف";
  }
  const e = error as SupabaseSaveError;
  return [e.message, e.details, e.hint].filter(Boolean).join(" | ") || "سبب غير معروف";
};

const shouldRetryWithoutOptionalFields = (error: unknown) => {
  if (!error || typeof error !== "object") {
    return false;
  }
  const e = error as SupabaseSaveError;
  const msg = `${e.message || ""} ${e.details || ""}`.toLowerCase();
  return e.code === "42703" || msg.includes("column") || msg.includes("does not exist");
};

const removeOptionalFields = (payload: Record<string, unknown>) => {
  const next = { ...payload };
  OPTIONAL_AGENT_FIELDS.forEach((field) => {
    delete next[field];
  });
  return next;
};

const useAgentBuilderSaveActions = ({
  id,
  userId,
  localMode,
  form,
  workflowSummary,
  flushBasicTextDrafts,
  validateStep,
  getFieldValueFromRef,
  saveDraftLocal,
  setSaving,
  setSaveState,
  showError,
  showSuccess,
}: Params) => {
  const navigate = useNavigate();

  const buildPayload = useCallback((saveType: نوعحفظ) => {
    const effectiveName = getFieldValueFromRef("الاسم").trim();
    const effectiveDescription = getFieldValueFromRef("الوصف").trim();
    const effectiveCustomCategory = getFieldValueFromRef("فئةمخصصة").trim();
    const resolvedCategory =
      form.الفئة === "أخرى (مخصصة)" ? effectiveCustomCategory || "أخرى" : form.الفئة;

    const workflow =
      form.وضعالسير === "متقدم"
        ? workflowSummary.raw || { nodes: [], edges: [] }
        : { mode: "simple-chat", nodes: [], edges: [] };

    const settings = {
      workflowMode: form.وضعالسير as وضعسير,
      personality: {
        systemPrompt: form.الموجهالنظامي,
        generatorBrief: form.وصفمولد,
        tone: form.اللهجة,
        language: form.لغةالرد,
        rules: form.قواعدالسلوك,
        identity: {
          name: form.الشخصية.اسم,
          role: form.الشخصية.دور,
          background: form.الشخصية.خلفية,
        },
        traits: {
          formality: form.الشخصية.رسمية,
          brevity: form.الشخصية.إيجاز,
          creativity: form.الشخصية.إبداع,
          seriousness: form.الشخصية.جدية,
          simplicity: form.الشخصية.بساطة,
        },
        responseTemplates: {
          greeting: form.الشخصية.تحية,
          clarification: form.الشخصية.عدمفهم,
          farewell: form.الشخصية.وداع,
          error: form.الشخصية.خطأ,
          outOfScope: form.الشخصية.خارجالنطاق,
        },
      },
      knowledge: {
        urls: form.روابطالمعرفة.map((item) => item.url),
        urlDetails: form.روابطالمعرفة,
        files: form.ملفاتالمعرفة,
        text: form.نصالمعرفة,
        retrieval: {
          enabled: form.تفعيلالاسترجاعالمعرفي,
          maxChunks: form.حدالمقاطعالمعرفية,
          maxChunkChars: form.حدطولالمقطعالمعرفي,
        },
      },
      advanced: {
        model: form.النموذج,
        temperature: form.temperature,
        maxTokens: form.maxTokens,
        topP: form.topP,
        frequencyPenalty: form.frequencyPenalty,
        presencePenalty: form.presencePenalty,
        retrieval: {
          enabled: form.تفعيلالاسترجاعالمعرفي,
          maxChunks: form.حدالمقاطعالمعرفية,
          maxChunkChars: form.حدطولالمقطعالمعرفي,
        },
      },
      limits: {
        dailyExecutions: form.حدتنفيذيومي,
        dailyCostSar: form.حدتكلفةيومية,
        timeoutSeconds: form.timeoutSeconds,
        retries: form.retries,
      },
      privacy: {
        logConversations: form.تسجيلالمحادثات,
        shareWithTeam: form.مشاركةمعالفريق,
      },
      webhook: {
        url: form.webhookUrl,
        event: form.webhookEvent as حدثويبهوك,
        headers: form.webhookHeaders,
      },
      branding: {
        icon: form.الايقونة,
        iconImage: form.صورةايقونة,
        color: form.اللون,
      },
    };

    const status = saveType === "مسودة" ? "قيد المراجعة" : "نشط";
    const isPublic = saveType === "سوق" ? true : form.عام;

    return {
      name: effectiveName,
      description: effectiveDescription,
      category: resolvedCategory,
      workflow,
      settings,
      status,
      is_public: isPublic,
      tags: form.الوسوم,
      user_id: userId,
      created_by: userId,
    };
  }, [form, getFieldValueFromRef, userId, workflowSummary.raw]);

  const saveAgent = useCallback(async (saveType: نوعحفظ) => {
    flushBasicTextDrafts();
    if (!validateStep(1) || !validateStep(2) || !validateStep(4)) {
      return;
    }
    if (!userId) {
      showError("الجلسة غير متاحة حالياً.");
      return;
    }
    if (localMode) {
      if (saveType !== "مسودة") {
        showError("الوضع المحلي يدعم حفظ المسودة فقط حتى إصلاح الاتصال بقاعدة البيانات.");
        return;
      }
      saveDraftLocal();
      showSuccess("تم حفظ المسودة محليًا.");
      return;
    }
    if (saveType === "سوق" && !form.عام) {
      showError("لتفعيل النشر في السوق اجعل الوكيل عامًا أولاً.");
      return;
    }

    setSaving(true);
    setSaveState("جارٍ الحفظ...");

    const payload = buildPayload(saveType);
    let savedAgentId: string | null = null;

    try {
      const performSave = async (candidatePayload: Record<string, unknown>) => {
        if (id) {
          const { error } = await supabaseClient
            .from("agents")
            .update(candidatePayload)
            .eq("id", id)
            .eq("user_id", userId);

          if (error) {
            throw error;
          }
          return;
        }

        const { data, error } = await supabaseClient
          .from("agents")
          .insert(candidatePayload)
          .select("id")
          .single();

        if (error) {
          throw error;
        }

        if (data?.id) {
          savedAgentId = String(data.id);
        }
      };

      try {
        await performSave(payload as Record<string, unknown>);
      } catch (firstError) {
        if (!shouldRetryWithoutOptionalFields(firstError)) {
          throw firstError;
        }
        await performSave(removeOptionalFields(payload as Record<string, unknown>));
      }

      if (!id && savedAgentId) {
        navigate(`/agents/${savedAgentId}/builder`, { replace: true });
      }

      saveDraftLocal();
      setSaveState("تم الحفظ");
      showSuccess(
        saveType === "مسودة"
          ? "تم حفظ الوكيل كمسودة."
          : saveType === "سوق"
          ? "تم نشر الوكيل في السوق بنجاح."
          : "تم نشر الوكيل وتفعيله."
      );
      trackFeatureUsed("حفظ الوكيل", { النوع: saveType });
    } catch (error) {
      setSaveState("تعذر الحفظ");
      showError(`تعذر حفظ الوكيل في قاعدة البيانات. ${getErrorText(error)}`);
    } finally {
      setSaving(false);
    }
  }, [
    buildPayload,
    flushBasicTextDrafts,
    form.عام,
    id,
    localMode,
    navigate,
    saveDraftLocal,
    setSaveState,
    setSaving,
    showError,
    showSuccess,
    userId,
    validateStep,
  ]);

  return { buildPayload, saveAgent };
};

export default useAgentBuilderSaveActions;
