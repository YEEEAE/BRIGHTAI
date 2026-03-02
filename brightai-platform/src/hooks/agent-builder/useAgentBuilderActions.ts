import { useCallback } from "react";
import { trackFeatureUsed } from "../../lib/analytics";
import {
  WORKFLOW_STORAGE_KEY,
  الحالةالافتراضية,
  فئاتالوكلاء,
} from "../../constants/agent-builder.constants";
import {
  normalizeKnowledgeFiles,
  normalizeKnowledgeUrls,
  readWorkflowSummary,
} from "../../lib/agent-builder.utils";
import type {
  بياناتنموذج,
  حالةالنموذج,
  ترويسةويبهوك,
  خطوة,
  لهجة,
  لغةرد,
  ملخصسير,
} from "../../types/agent-builder.types";

type Params = {
  form: حالةالنموذج;
  templates: بياناتنموذج[];
  selectedTemplateId: string;
  tagInput: string;
  headerKeyInput: string;
  headerValueInput: string;
  applyPartialForm: (partial: Partial<حالةالنموذج>) => void;
  setTagInput: (value: string) => void;
  setHeaderKeyInput: (value: string) => void;
  setHeaderValueInput: (value: string) => void;
  setStep: (next: خطوة | ((prev: خطوة) => خطوة)) => void;
  setWorkflowKey: (next: number | ((prev: number) => number)) => void;
  setWorkflowSummary: (next: ملخصسير | ((prev: ملخصسير) => ملخصسير)) => void;
  flushBasicTextDrafts: () => void;
  validateStep: (stepId: خطوة, silent?: boolean) => boolean;
  showError: (msg: string) => void;
  showSuccess: (msg: string) => void;
};

const useAgentBuilderActions = ({
  form,
  templates,
  selectedTemplateId,
  tagInput,
  headerKeyInput,
  headerValueInput,
  applyPartialForm,
  setTagInput,
  setHeaderKeyInput,
  setHeaderValueInput,
  setStep,
  setWorkflowKey,
  setWorkflowSummary,
  flushBasicTextDrafts,
  validateStep,
  showError,
  showSuccess,
}: Params) => {
  const addTag = useCallback(() => {
    const value = tagInput.trim();
    if (!value) {
      return;
    }
    if (form.الوسوم.includes(value)) {
      setTagInput("");
      return;
    }
    applyPartialForm({ الوسوم: [...form.الوسوم, value] });
    setTagInput("");
  }, [applyPartialForm, form.الوسوم, setTagInput, tagInput]);

  const removeTag = useCallback((tag: string) => {
    applyPartialForm({ الوسوم: form.الوسوم.filter((item) => item !== tag) });
  }, [applyPartialForm, form.الوسوم]);

  const addWebhookHeader = useCallback(() => {
    const key = headerKeyInput.trim();
    const value = headerValueInput.trim();
    if (!key || !value) {
      showError("أدخل اسم وقيمة الترويسة.");
      return;
    }
    const next: ترويسةويبهوك = { id: `${Date.now()}`, key, value };
    applyPartialForm({ webhookHeaders: [...form.webhookHeaders, next] });
    setHeaderKeyInput("");
    setHeaderValueInput("");
  }, [
    applyPartialForm,
    form.webhookHeaders,
    headerKeyInput,
    headerValueInput,
    setHeaderKeyInput,
    setHeaderValueInput,
    showError,
  ]);

  const removeWebhookHeader = useCallback((idToRemove: string) => {
    applyPartialForm({
      webhookHeaders: form.webhookHeaders.filter((item) => item.id !== idToRemove),
    });
  }, [applyPartialForm, form.webhookHeaders]);

  const handleIconUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    if (!file.type.startsWith("image/")) {
      showError("يجب اختيار صورة صحيحة.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      applyPartialForm({ صورةايقونة: result });
      showSuccess("تم تحديث أيقونة الوكيل.");
    };
    reader.readAsDataURL(file);
  }, [applyPartialForm, showError, showSuccess]);

  const goNext = useCallback((step: خطوة) => {
    flushBasicTextDrafts();
    if (!validateStep(step)) {
      return;
    }
    setStep((prev) => (prev >= 5 ? 5 : ((prev + 1) as خطوة)));
  }, [flushBasicTextDrafts, setStep, validateStep]);

  const goPrev = useCallback(() => {
    setStep((prev) => (prev <= 1 ? 1 : ((prev - 1) as خطوة)));
  }, [setStep]);

  const jumpToStep = useCallback((target: خطوة, step: خطوة) => {
    flushBasicTextDrafts();
    if (target === step) {
      return;
    }
    if (target < step) {
      setStep(target);
      return;
    }
    for (let current = step; current < target; current += 1) {
      if (!validateStep(current as خطوة)) {
        return;
      }
    }
    setStep(target);
  }, [flushBasicTextDrafts, setStep, validateStep]);

  const applyTemplate = useCallback(() => {
    const template = templates.find((item) => item.id === selectedTemplateId);
    if (!template) {
      showError("اختر قالبًا أولاً.");
      return;
    }

    const settings = (template.settings || {}) as Record<string, any>;
    const personality = (settings.personality || {}) as Record<string, any>;
    const advanced = (settings.advanced || {}) as Record<string, any>;
    const identity = (personality.identity || {}) as Record<string, any>;
    const traits = (personality.traits || {}) as Record<string, any>;
    const responseTemplates = (personality.responseTemplates || {}) as Record<string, any>;
    const knowledge = (settings.knowledge || {}) as Record<string, any>;

    applyPartialForm({
      الاسم: template.name,
      الوصف: template.description || الحالةالافتراضية.الوصف,
      الفئة:
        template.category && فئاتالوكلاء.includes(template.category)
          ? template.category
          : "أخرى (مخصصة)",
      فئةمخصصة:
        template.category && !فئاتالوكلاء.includes(template.category)
          ? template.category
          : "",
      الوسوم: Array.isArray(template.tags) ? template.tags : الحالةالافتراضية.الوسوم,
      الموجهالنظامي:
        String(personality.systemPrompt || "") || الحالةالافتراضية.الموجهالنظامي,
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
      النموذج: String(advanced.model || الحالةالافتراضية.النموذج),
    });

    if (template.workflow) {
      localStorage.setItem(WORKFLOW_STORAGE_KEY, JSON.stringify(template.workflow));
      setWorkflowKey((prev) => prev + 1);
      setWorkflowSummary(readWorkflowSummary());
    }

    setStep(3);
    showSuccess("تم استيراد القالب بنجاح.");
    trackFeatureUsed("استيراد من قالب", { templateId: template.id });
  }, [
    applyPartialForm,
    selectedTemplateId,
    setWorkflowKey,
    setWorkflowSummary,
    setStep,
    showError,
    showSuccess,
    templates,
  ]);

  return {
    addTag,
    removeTag,
    addWebhookHeader,
    removeWebhookHeader,
    handleIconUpload,
    goNext,
    goPrev,
    jumpToStep,
    applyTemplate,
  };
};

export default useAgentBuilderActions;
