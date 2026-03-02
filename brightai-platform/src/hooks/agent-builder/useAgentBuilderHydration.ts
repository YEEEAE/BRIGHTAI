import { useCallback } from "react";
import supabase from "../../lib/supabase";
import { الحالةالافتراضية, فئاتالوكلاء } from "../../constants/agent-builder.constants";
import { normalizeKnowledgeFiles, normalizeKnowledgeUrls } from "../../lib/agent-builder.utils";
import type {
  بياناتنموذج,
  حالةالنموذج,
  ترويسةويبهوك,
  لغةرد,
  لهجة,
  وضعسير,
} from "../../types/agent-builder.types";

type Params = {
  id?: string;
  showError: (msg: string) => void;
  setTemplates: (next: بياناتنموذج[]) => void;
  applyPartialForm: (partial: Partial<حالةالنموذج>) => void;
  setWorkflowKey: (next: number | ((prev: number) => number)) => void;
};

const supabaseClient = supabase as unknown as {
  from: (table: string) => any;
};

const useAgentBuilderHydration = ({
  id,
  showError,
  setTemplates,
  applyPartialForm,
  setWorkflowKey,
}: Params) => {
  const loadTemplates = useCallback(async () => {
    try {
      const { data, error } = await supabaseClient
        .from("templates")
        .select("id, name, description, category, workflow, settings, tags")
        .eq("is_public", true)
        .limit(30);

      if (error) {
        setTemplates([]);
        return;
      }

      const mapped: بياناتنموذج[] = (data || []).map((item: any) => ({
        id: String(item.id),
        name: String(item.name || "قالب"),
        description: item.description ? String(item.description) : null,
        category: item.category ? String(item.category) : null,
        workflow: item.workflow || null,
        settings: (item.settings || null) as Record<string, unknown> | null,
        tags: Array.isArray(item.tags) ? (item.tags as string[]) : null,
      }));

      setTemplates(mapped);
    } catch {
      setTemplates([]);
    }
  }, [setTemplates]);

  const hydrateFromDatabase = useCallback(async (uid: string) => {
    if (!id || !uid) {
      return;
    }

    const { data, error } = await supabaseClient
      .from("agents")
      .select("id, name, description, category, workflow, settings, tags, is_public")
      .eq("id", id)
      .eq("user_id", uid)
      .maybeSingle();

    if (error || !data) {
      showError("تعذر تحميل بيانات الوكيل الحالي.");
      return;
    }

    const settings = (data.settings || {}) as Record<string, any>;
    const personality = (settings.personality || {}) as Record<string, any>;
    const advanced = (settings.advanced || {}) as Record<string, any>;
    const limits = (settings.limits || {}) as Record<string, any>;
    const privacy = (settings.privacy || {}) as Record<string, any>;
    const webhook = (settings.webhook || {}) as Record<string, any>;
    const branding = (settings.branding || {}) as Record<string, any>;
    const knowledge = (settings.knowledge || {}) as Record<string, any>;
    const retrieval = (knowledge.retrieval || advanced.retrieval || {}) as Record<string, any>;
    const identity = (personality.identity || {}) as Record<string, any>;
    const traits = (personality.traits || {}) as Record<string, any>;
    const responseTemplates = (personality.responseTemplates || {}) as Record<string, any>;

    applyPartialForm({
      الاسم: String(data.name || ""),
      الوصف: String(data.description || ""),
      الفئة: فئاتالوكلاء.includes(String(data.category || ""))
        ? String(data.category || "خدمة العملاء")
        : "أخرى (مخصصة)",
      فئةمخصصة: !فئاتالوكلاء.includes(String(data.category || "")) ? String(data.category || "") : "",
      الوسوم: Array.isArray(data.tags) ? (data.tags as string[]) : [],
      الموجهالنظامي: String(personality.systemPrompt || الحالةالافتراضية.الموجهالنظامي),
      وصفمولد: String(personality.generatorBrief || ""),
      اللهجة: (personality.tone || الحالةالافتراضية.اللهجة) as لهجة,
      لغةالرد: (personality.language || الحالةالافتراضية.لغةالرد) as لغةرد,
      قواعدالسلوك: Array.isArray(personality.rules)
        ? (personality.rules as string[])
        : الحالةالافتراضية.قواعدالسلوك,
      روابطالمعرفة: normalizeKnowledgeUrls(knowledge.urlDetails || knowledge.urls),
      ملفاتالمعرفة: normalizeKnowledgeFiles(knowledge.files),
      نصالمعرفة: String(knowledge.text || ""),
      الشخصية: {
        اسم: String(identity.name || الحالةالافتراضية.الشخصية.اسم),
        دور: String(identity.role || الحالةالافتراضية.الشخصية.دور),
        خلفية: String(identity.background || الحالةالافتراضية.الشخصية.خلفية),
        رسمية: Number(traits.formality ?? الحالةالافتراضية.الشخصية.رسمية),
        إيجاز: Number(traits.brevity ?? الحالةالافتراضية.الشخصية.إيجاز),
        إبداع: Number(traits.creativity ?? الحالةالافتراضية.الشخصية.إبداع),
        جدية: Number(traits.seriousness ?? الحالةالافتراضية.الشخصية.جدية),
        بساطة: Number(traits.simplicity ?? الحالةالافتراضية.الشخصية.بساطة),
        تحية: String(responseTemplates.greeting || الحالةالافتراضية.الشخصية.تحية),
        عدمفهم: String(responseTemplates.clarification || الحالةالافتراضية.الشخصية.عدمفهم),
        وداع: String(responseTemplates.farewell || الحالةالافتراضية.الشخصية.وداع),
        خطأ: String(responseTemplates.error || الحالةالافتراضية.الشخصية.خطأ),
        خارجالنطاق: String(responseTemplates.outOfScope || الحالةالافتراضية.الشخصية.خارجالنطاق),
      },
      وضعالسير:
        settings.workflowMode === "بسيط" || settings.workflowMode === "متقدم"
          ? (settings.workflowMode as وضعسير)
          : الحالةالافتراضية.وضعالسير,
      النموذج: String(advanced.model || الحالةالافتراضية.النموذج),
      temperature: Number(advanced.temperature ?? الحالةالافتراضية.temperature),
      maxTokens: Number(advanced.maxTokens ?? الحالةالافتراضية.maxTokens),
      topP: Number(advanced.topP ?? الحالةالافتراضية.topP),
      frequencyPenalty: Number(advanced.frequencyPenalty ?? الحالةالافتراضية.frequencyPenalty),
      presencePenalty: Number(advanced.presencePenalty ?? الحالةالافتراضية.presencePenalty),
      تفعيلالاسترجاعالمعرفي: Boolean(
        retrieval.enabled ?? الحالةالافتراضية.تفعيلالاسترجاعالمعرفي
      ),
      حدالمقاطعالمعرفية: Number(
        retrieval.maxChunks ?? الحالةالافتراضية.حدالمقاطعالمعرفية
      ),
      حدطولالمقطعالمعرفي: Number(
        retrieval.maxChunkChars ?? الحالةالافتراضية.حدطولالمقطعالمعرفي
      ),
      حدتنفيذيومي: Number(limits.dailyExecutions ?? الحالةالافتراضية.حدتنفيذيومي),
      حدتكلفةيومية: Number(limits.dailyCostSar ?? الحالةالافتراضية.حدتكلفةيومية),
      timeoutSeconds: Number(limits.timeoutSeconds ?? الحالةالافتراضية.timeoutSeconds),
      retries: Number(limits.retries ?? الحالةالافتراضية.retries),
      عام: Boolean(data.is_public ?? الحالةالافتراضية.عام),
      تسجيلالمحادثات: Boolean(privacy.logConversations ?? الحالةالافتراضية.تسجيلالمحادثات),
      مشاركةمعالفريق: Boolean(privacy.shareWithTeam ?? الحالةالافتراضية.مشاركةمعالفريق),
      webhookUrl: String(webhook.url || ""),
      webhookEvent: webhook.event || الحالةالافتراضية.webhookEvent,
      webhookHeaders: Array.isArray(webhook.headers)
        ? (webhook.headers as ترويسةويبهوك[])
        : [],
      اللون: String(branding.color || الحالةالافتراضية.اللون),
      الايقونة: String(branding.icon || الحالةالافتراضية.الايقونة),
      صورةايقونة: String(branding.iconImage || ""),
    });

    if (data.workflow) {
      localStorage.setItem("brightai_workflow_autosave", JSON.stringify(data.workflow));
      setWorkflowKey((prev) => prev + 1);
    }
  }, [applyPartialForm, id, setWorkflowKey, showError]);

  return {
    loadTemplates,
    hydrateFromDatabase,
  };
};

export default useAgentBuilderHydration;
