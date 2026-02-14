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

    try {
      if (id) {
        const { error } = await supabaseClient
          .from("agents")
          .update(payload)
          .eq("id", id)
          .eq("user_id", userId);

        if (error) {
          throw error;
        }
      } else {
        const { data, error } = await supabaseClient
          .from("agents")
          .insert(payload)
          .select("id")
          .single();

        if (error) {
          throw error;
        }

        if (data?.id) {
          navigate(`/agents/${data.id}/builder`, { replace: true });
        }
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
    } catch {
      setSaveState("تعذر الحفظ");
      showError("تعذر حفظ الوكيل في قاعدة البيانات.");
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
