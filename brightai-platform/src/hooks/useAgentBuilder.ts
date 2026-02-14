import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import { useNavigate, useParams } from "react-router-dom";
import supabase from "../lib/supabase";
import useAppToast from "../hooks/useAppToast";
import { trackFeatureUsed } from "../lib/analytics";
import { getLocalAdminUser } from "../lib/local-admin";
import { lazyWithRetry } from "../lib/lazy";
import {
  WORKFLOW_STORAGE_KEY,
  WORKFLOW_UPDATED_EVENT,
  الحالةالافتراضية,
  خياراتالايقونات,
  عناوينالخطوات,
  فئاتالوكلاء,
} from "../constants/agent-builder.constants";
import {
  delay,
  evaluateStep,
  getDraftKey,
  normalizeKnowledgeFiles,
  normalizeKnowledgeUrls,
  readWorkflowSummary,
  withTimeout,
  تقديرالرموز,
  type حقلمسودةنصي,
} from "../lib/agent-builder.utils";
import type {
  بياناتنموذج,
  حدثويبهوك,
  حالةحفظ,
  حالةالنموذج,
  حالةنظام,
  ترويسةويبهوك,
  خطوة,
  لغةرد,
  ملخصسير,
  نوعحفظ,
  رسالةاختبار,
  نسخةمسودة,
  وضعسير,
  لهجة,
} from "../types/agent-builder.types";

const WorkflowCanvas = lazyWithRetry(() => import("../components/agent/WorkflowCanvas"));

const supabaseClient = supabase as unknown as {
  from: (table: string) => any;
};

const useAgentBuilder = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { showError, showSuccess } = useAppToast();

  const [step, setStep] = useState<خطوة>(1);
  const [form, setForm] = useState<حالةالنموذج>(الحالةالافتراضية);
  const [userId, setUserId] = useState<string>("");
  const [workflowSummary, setWorkflowSummary] = useState<ملخصسير>({
    nodes: 0,
    edges: 0,
    sizeKb: 0,
    raw: null,
  });
  const [workflowKey, setWorkflowKey] = useState(0);

  const [loadingPage, setLoadingPage] = useState(true);
  const [saving, setSaving] = useState(false);
  const [localMode, setLocalMode] = useState(false);
  const [saveState, setSaveState] = useState<حالةحفظ>("غير محفوظ");
  const [lastSavedAt, setLastSavedAt] = useState<string>("");
  const [lastEditedAt, setLastEditedAt] = useState<string>("");

  const [tagInput, setTagInput] = useState("");
  const [headerKeyInput, setHeaderKeyInput] = useState("");
  const [headerValueInput, setHeaderValueInput] = useState("");

  const [templates, setTemplates] = useState<بياناتنموذج[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");

  const [testMessages, setTestMessages] = useState<رسالةاختبار[]>([]);
  const [testInput, setTestInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [testTokens, setTestTokens] = useState(0);
  const [testCost, setTestCost] = useState(0);
  const [testLatency, setTestLatency] = useState(0);

  const [systemState, setSystemState] = useState<حالةنظام>({
    apiConnected: false,
    promptReady: false,
    workflowReady: false,
    warnings: [],
  });

  const importJsonRef = useRef<HTMLInputElement | null>(null);
  const iconUploadRef = useRef<HTMLInputElement | null>(null);
  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const descriptionInputRef = useRef<HTMLTextAreaElement | null>(null);
  const customCategoryInputRef = useRef<HTMLInputElement | null>(null);
  const textDraftTimersRef = useRef<Record<حقلمسودةنصي, number | null>>({
    الاسم: null,
    الوصف: null,
    فئةمخصصة: null,
  });
  const initializedRef = useRef(false);
  const lastDraftFingerprintRef = useRef("");

  useEffect(() => {
    document.title = "مصمم الوكلاء المتقدم | منصة برايت";
  }, []);

  const applyPartialForm = useCallback((partial: Partial<حالةالنموذج>) => {
    setForm((prev) => ({ ...prev, ...partial }));
  }, []);

  useEffect(() => {
    const timers = textDraftTimersRef.current;
    return () => {
      (Object.keys(timers) as حقلمسودةنصي[]).forEach((field) => {
        if (timers[field]) {
          window.clearTimeout(timers[field] as number);
        }
      });
    };
  }, []);

  const getFieldValueFromRef = useCallback(
    (field: حقلمسودةنصي) => {
      if (field === "الاسم") {
        return nameInputRef.current?.value ?? form.الاسم;
      }
      if (field === "الوصف") {
        return descriptionInputRef.current?.value ?? form.الوصف;
      }
      return customCategoryInputRef.current?.value ?? form.فئةمخصصة;
    },
    [form.الاسم, form.الوصف, form.فئةمخصصة]
  );

  const commitTextDraft = useCallback((field: حقلمسودةنصي, nextValue: string) => {
    setForm((prev) => {
      if (prev[field] === nextValue) {
        return prev;
      }
      return {
        ...prev,
        [field]: nextValue,
      };
    });
  }, []);

  const scheduleTextDraftCommit = useCallback(
    (field: حقلمسودةنصي, value: string, delayMs = 260) => {
      const timers = textDraftTimersRef.current;
      if (timers[field]) {
        window.clearTimeout(timers[field] as number);
      }
      timers[field] = window.setTimeout(() => {
        commitTextDraft(field, value);
        textDraftTimersRef.current[field] = null;
      }, delayMs);
    },
    [commitTextDraft]
  );

  const flushTextDraft = useCallback(
    (field: حقلمسودةنصي) => {
      const timers = textDraftTimersRef.current;
      if (timers[field]) {
        window.clearTimeout(timers[field] as number);
        timers[field] = null;
      }
      commitTextDraft(field, getFieldValueFromRef(field));
    },
    [commitTextDraft, getFieldValueFromRef]
  );

  const flushBasicTextDrafts = useCallback(() => {
    flushTextDraft("الاسم");
    flushTextDraft("الوصف");
    if (form.الفئة === "أخرى (مخصصة)") {
      flushTextDraft("فئةمخصصة");
    }
  }, [flushTextDraft, form.الفئة]);

  useEffect(() => {
    const nameInput = nameInputRef.current;
    if (nameInput && document.activeElement !== nameInput && nameInput.value !== form.الاسم) {
      nameInput.value = form.الاسم;
    }

    const descriptionInput = descriptionInputRef.current;
    if (
      descriptionInput &&
      document.activeElement !== descriptionInput &&
      descriptionInput.value !== form.الوصف
    ) {
      descriptionInput.value = form.الوصف;
    }

    const customCategoryInput = customCategoryInputRef.current;
    if (
      customCategoryInput &&
      document.activeElement !== customCategoryInput &&
      customCategoryInput.value !== form.فئةمخصصة
    ) {
      customCategoryInput.value = form.فئةمخصصة;
    }
  }, [form.الاسم, form.الوصف, form.فئةمخصصة]);

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
  }, []);

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
    const identity = (personality.identity || {}) as Record<string, any>;
    const traits = (personality.traits || {}) as Record<string, any>;
    const responseTemplates = (personality.responseTemplates || {}) as Record<string, any>;

    applyPartialForm({
      الاسم: String(data.name || ""),
      الوصف: String(data.description || ""),
      الفئة: فئاتالوكلاء.includes(String(data.category || ""))
        ? String(data.category || "خدمة العملاء")
        : "أخرى (مخصصة)",
      فئةمخصصة: !فئاتالوكلاء.includes(String(data.category || ""))
        ? String(data.category || "")
        : "",
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
        عدمفهم: String(
          responseTemplates.clarification || الحالةالافتراضية.الشخصية.عدمفهم
        ),
        وداع: String(responseTemplates.farewell || الحالةالافتراضية.الشخصية.وداع),
        خطأ: String(responseTemplates.error || الحالةالافتراضية.الشخصية.خطأ),
        خارجالنطاق: String(
          responseTemplates.outOfScope || الحالةالافتراضية.الشخصية.خارجالنطاق
        ),
      },
      وضعالسير:
        settings.workflowMode === "بسيط" || settings.workflowMode === "متقدم"
          ? (settings.workflowMode as وضعسير)
          : الحالةالافتراضية.وضعالسير,
      النموذج: String(advanced.model || الحالةالافتراضية.النموذج),
      temperature: Number(advanced.temperature ?? الحالةالافتراضية.temperature),
      maxTokens: Number(advanced.maxTokens ?? الحالةالافتراضية.maxTokens),
      topP: Number(advanced.topP ?? الحالةالافتراضية.topP),
      frequencyPenalty: Number(
        advanced.frequencyPenalty ?? الحالةالافتراضية.frequencyPenalty
      ),
      presencePenalty: Number(
        advanced.presencePenalty ?? الحالةالافتراضية.presencePenalty
      ),
      حدتنفيذيومي: Number(limits.dailyExecutions ?? الحالةالافتراضية.حدتنفيذيومي),
      حدتكلفةيومية: Number(limits.dailyCostSar ?? الحالةالافتراضية.حدتكلفةيومية),
      timeoutSeconds: Number(limits.timeoutSeconds ?? الحالةالافتراضية.timeoutSeconds),
      retries: Number(limits.retries ?? الحالةالافتراضية.retries),
      عام: Boolean(data.is_public ?? الحالةالافتراضية.عام),
      تسجيلالمحادثات: Boolean(
        privacy.logConversations ?? الحالةالافتراضية.تسجيلالمحادثات
      ),
      مشاركةمعالفريق: Boolean(
        privacy.shareWithTeam ?? الحالةالافتراضية.مشاركةمعالفريق
      ),
      webhookUrl: String(webhook.url || ""),
      webhookEvent: (webhook.event || الحالةالافتراضية.webhookEvent) as حدثويبهوك,
      webhookHeaders: Array.isArray(webhook.headers)
        ? (webhook.headers as ترويسةويبهوك[])
        : [],
      اللون: String(branding.color || الحالةالافتراضية.اللون),
      الايقونة: String(branding.icon || الحالةالافتراضية.الايقونة),
      صورةايقونة: String(branding.iconImage || ""),
    });

    if (data.workflow) {
      localStorage.setItem(WORKFLOW_STORAGE_KEY, JSON.stringify(data.workflow));
      setWorkflowKey((prev) => prev + 1);
    }
  }, [applyPartialForm, id, showError]);

  const hydrateFromDraft = useCallback(() => {
    const key = getDraftKey(id);
    const raw = localStorage.getItem(key);
    if (!raw) {
      return;
    }

    try {
      const parsed = JSON.parse(raw) as نسخةمسودة;
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
  }, [applyPartialForm, id, showError]);

  useEffect(() => {
    let active = true;

    const init = async () => {
      setLoadingPage(true);
      try {
        const sessionPayload = await withTimeout(
          supabase.auth
            .getSession()
            .catch(() => ({ data: { session: null } })),
          3500,
          { data: { session: null } }
        );
        const { data } = sessionPayload as { data: { session: { user: { id: string } } | null } };
        if (!active) {
          return;
        }

        const sessionUser = data.session?.user || null;
        const localUser = getLocalAdminUser();
        const activeUserId = sessionUser?.id || localUser?.id || "";

        if (!activeUserId) {
          navigate("/login", { replace: true });
          return;
        }

        const isLocal = !sessionUser && Boolean(localUser);
        setLocalMode(isLocal);

        const uid = activeUserId;
        setUserId(uid);

        hydrateFromDraft();
        setWorkflowSummary(readWorkflowSummary());
        initializedRef.current = true;
        setLoadingPage(false);

        void (async () => {
          const templatesPromise = withTimeout(
            loadTemplates().catch(() => undefined),
            5000,
            undefined
          );
          const hydratePromise =
            id && !isLocal
              ? withTimeout(
                  hydrateFromDatabase(uid).catch(() => undefined),
                  5000,
                  undefined
                )
              : Promise.resolve(undefined);
          const apiStatusPromise: Promise<number> = isLocal
            ? Promise.resolve(0)
            : withTimeout(
                supabaseClient
                  .from("api_keys")
                  .select("id", { count: "exact", head: true })
                  .eq("user_id", uid)
                  .eq("provider", "groq")
                  .eq("is_active", true)
                  .then(({ count }: { count?: number | null }) => Number(count || 0))
                  .catch(() => 0),
                5000,
                0
              );

          const results = await Promise.allSettled([
            templatesPromise,
            hydratePromise,
            apiStatusPromise,
          ]);
          if (!active) {
            return;
          }

          const apiResult = results[2];
          const apiCount =
            apiResult && apiResult.status === "fulfilled"
              ? Number(apiResult.value || 0)
              : 0;

          setSystemState((prev) => ({
            ...prev,
            apiConnected: apiCount > 0,
          }));
        })();
      } catch {
        if (!active) {
          return;
        }

        const localUser = getLocalAdminUser();
        if (localUser) {
          setLocalMode(true);
          setUserId(localUser.id);
          hydrateFromDraft();
          setWorkflowSummary(readWorkflowSummary());
          initializedRef.current = true;
          setLoadingPage(false);
        } else {
          showError("تعذر تهيئة مصمم الوكلاء. حاول تحديث الصفحة.");
          navigate("/login", { replace: true });
        }
      } finally {
        if (active) {
          setLoadingPage(false);
        }
      }
    };

    void init();

    return () => {
      active = false;
    };
  }, [hydrateFromDatabase, hydrateFromDraft, id, loadTemplates, navigate, showError]);

  useEffect(() => {
    if (step >= 2 || form.وضعالسير === "متقدم") {
      void WorkflowCanvas.preload();
    }
  }, [form.وضعالسير, step]);

  useEffect(() => {
    const syncWorkflow = () => {
      const next = readWorkflowSummary();
      setWorkflowSummary((prev) => {
        if (
          prev.nodes === next.nodes &&
          prev.edges === next.edges &&
          prev.sizeKb === next.sizeKb
        ) {
          return prev;
        }
        return next;
      });
    };

    syncWorkflow();
    const handleWorkflowUpdated = () => syncWorkflow();
    const handleStorage = (event: StorageEvent) => {
      if (event.key === WORKFLOW_STORAGE_KEY) {
        syncWorkflow();
      }
    };
    window.addEventListener(WORKFLOW_UPDATED_EVENT, handleWorkflowUpdated);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(WORKFLOW_UPDATED_EVENT, handleWorkflowUpdated);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  useEffect(() => {
    if (!initializedRef.current) {
      return;
    }
    setSaveState("غير محفوظ");
    setLastEditedAt(new Date().toLocaleTimeString("ar-SA"));
  }, [form, workflowSummary.nodes, workflowSummary.edges]);

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
  }, [form, getFieldValueFromRef, id, step, workflowSummary.raw]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      saveDraftLocal();
    }, 30000);
    return () => window.clearInterval(interval);
  }, [saveDraftLocal]);

  useEffect(() => {
    if (saveState !== "غير محفوظ") {
      return;
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [saveState]);

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
  }, [applyPartialForm, form.الوسوم, tagInput]);

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
    const next: ترويسةويبهوك = {
      id: `${Date.now()}`,
      key,
      value,
    };
    applyPartialForm({ webhookHeaders: [...form.webhookHeaders, next] });
    setHeaderKeyInput("");
    setHeaderValueInput("");
  }, [applyPartialForm, form.webhookHeaders, headerKeyInput, headerValueInput, showError]);

  const removeWebhookHeader = useCallback((idToRemove: string) => {
    applyPartialForm({
      webhookHeaders: form.webhookHeaders.filter((item) => item.id !== idToRemove),
    });
  }, [applyPartialForm, form.webhookHeaders]);

  const handleIconUpload = useCallback(async (event: ChangeEvent<HTMLInputElement>) => {
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

  const validateStep = useCallback((stepId: خطوة, silent = false) => {
    const draftAwareForm =
      stepId === 1
        ? {
            ...form,
            الاسم: getFieldValueFromRef("الاسم"),
            الوصف: getFieldValueFromRef("الوصف"),
            فئةمخصصة: getFieldValueFromRef("فئةمخصصة"),
          }
        : form;
    const result = evaluateStep(stepId, draftAwareForm);
    if (!result.valid && !silent) {
      showError(result.message);
    }
    return result.valid;
  }, [form, getFieldValueFromRef, showError]);

  const goNext = useCallback(() => {
    flushBasicTextDrafts();
    if (!validateStep(step)) {
      return;
    }
    setStep((prev) => (prev >= 5 ? 5 : ((prev + 1) as خطوة)));
  }, [flushBasicTextDrafts, step, validateStep]);

  const goPrev = useCallback(() => {
    setStep((prev) => (prev <= 1 ? 1 : ((prev - 1) as خطوة)));
  }, []);

  const jumpToStep = useCallback((target: خطوة) => {
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
  }, [flushBasicTextDrafts, step, validateStep]);

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
        عدمفهم: String(
          responseTemplates.clarification || الحالةالافتراضية.الشخصية.عدمفهم
        ),
        وداع: String(responseTemplates.farewell || الحالةالافتراضية.الشخصية.وداع),
        خطأ: String(responseTemplates.error || الحالةالافتراضية.الشخصية.خطأ),
        خارجالنطاق: String(
          responseTemplates.outOfScope || الحالةالافتراضية.الشخصية.خارجالنطاق
        ),
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
  }, [applyPartialForm, selectedTemplateId, showError, showSuccess, templates]);

  const buildPayload = useCallback((saveType: نوعحفظ) => {
    const effectiveName = getFieldValueFromRef("الاسم").trim();
    const effectiveDescription = getFieldValueFromRef("الوصف").trim();
    const effectiveCustomCategory = getFieldValueFromRef("فئةمخصصة").trim();
    const resolvedCategory =
      form.الفئة === "أخرى (مخصصة)"
        ? effectiveCustomCategory || "أخرى"
        : form.الفئة;

    const workflow =
      form.وضعالسير === "متقدم"
        ? workflowSummary.raw || { nodes: [], edges: [] }
        : { mode: "simple-chat", nodes: [], edges: [] };

    const settings = {
      workflowMode: form.وضعالسير,
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
      },
      advanced: {
        model: form.النموذج,
        temperature: form.temperature,
        maxTokens: form.maxTokens,
        topP: form.topP,
        frequencyPenalty: form.frequencyPenalty,
        presencePenalty: form.presencePenalty,
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
        event: form.webhookEvent,
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
    showError,
    showSuccess,
    userId,
    validateStep,
  ]);

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

  const importJson = useCallback((event: ChangeEvent<HTMLInputElement>) => {
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
  }, [applyPartialForm, showError, showSuccess]);

  const buildTestReply = useCallback((message: string) => {
    const resolvedCategory =
      form.الفئة === "أخرى (مخصصة)"
        ? form.فئةمخصصة.trim() || "أخرى"
        : form.الفئة;

    const bullets = [
      `تلقيت طلبك حول: ${message}`,
      `سأتعامل معه وفق فئة: ${resolvedCategory}`,
      `نبرة الإجابة: ${form.اللهجة}`,
      "الخطوة المقترحة: ابدأ بتحديد الهدف التجاري والقيود المتاحة ثم نفذ خطة قصيرة من ثلاث مراحل.",
    ];

    if (form.قواعدالسلوك.length > 0) {
      bullets.push(`قاعدة مطبقة: ${form.قواعدالسلوك[0]}`);
    }

    return bullets.join("\n");
  }, [form.فئةمخصصة, form.الفئة, form.اللهجة, form.قواعدالسلوك]);

  const runTestMessage = useCallback(async (message: string) => {
    if (!message.trim() || isStreaming) {
      return;
    }

    const started = performance.now();
    const userMessage: رسالةاختبار = {
      id: `${Date.now()}_u`,
      role: "مستخدم",
      text: message.trim(),
      createdAt: new Date().toISOString(),
    };

    const botMessage: رسالةاختبار = {
      id: `${Date.now()}_a`,
      role: "الوكيل",
      text: "",
      createdAt: new Date().toISOString(),
    };

    setTestMessages((prev) => [...prev, userMessage, botMessage]);
    setTestInput("");
    setIsStreaming(true);

    const full = buildTestReply(message);
    let current = "";
    const updateAssistantText = (nextText: string) => {
      setTestMessages((prev) => {
        const clone = [...prev];
        const last = clone[clone.length - 1];
        if (last && last.role === "الوكيل") {
          clone[clone.length - 1] = { ...last, text: nextText };
        }
        return clone;
      });
    };

    for (const char of full) {
      current += char;
      updateAssistantText(current);
      await delay(14);
    }

    const latency = Math.round(performance.now() - started);
    const tokens = تقديرالرموز(`${form.الموجهالنظامي}\n${message}\n${full}`);
    const costSar = Number((tokens * 0.00024).toFixed(4));

    setTestLatency(latency);
    setTestTokens(tokens);
    setTestCost(costSar);
    setIsStreaming(false);

    trackFeatureUsed("اختبار الوكيل", {
      tokens,
      latency,
    });
  }, [buildTestReply, form.الموجهالنظامي, isStreaming]);

  const clearChat = useCallback(() => {
    setTestMessages([]);
    setTestTokens(0);
    setTestCost(0);
    setTestLatency(0);
  }, []);

  const runScenario = useCallback(() => {
    const scenario = "أريد بناء خطة رد تلقائي لشكاوى العملاء المتكررة";
    runTestMessage(scenario);
  }, [runTestMessage]);

  useEffect(() => {
    const promptReady = form.الموجهالنظامي.trim().length >= 30;
    const workflowReady =
      form.وضعالسير === "بسيط" ? true : workflowSummary.nodes > 0 && workflowSummary.edges >= 0;

    const warnings: string[] = [];

    if (!form.webhookUrl && form.webhookHeaders.length > 0) {
      warnings.push("تمت إضافة ترويسات ويب هوك بدون رابط." );
    }

    if (form.maxTokens > 12000) {
      warnings.push("قيمة الرموز مرتفعة وقد تزيد التكلفة اليومية.");
    }

    if (form.temperature > 1.2) {
      warnings.push("درجة الإبداع عالية وقد تقلل الثبات في الردود.");
    }
    if (localMode) {
      warnings.push("أنت في وضع محلي مؤقت. النشر على قاعدة البيانات غير متاح حالياً.");
    }

    setSystemState((prev) => ({
      ...prev,
      promptReady,
      workflowReady,
      warnings,
    }));
  }, [form.maxTokens, form.الموجهالنظامي, form.temperature, form.webhookHeaders.length, form.webhookUrl, form.وضعالسير, localMode, workflowSummary.edges, workflowSummary.nodes]);

  useEffect(() => {
    const handleKeys = (event: KeyboardEvent) => {
      const metaOrCtrl = event.ctrlKey || event.metaKey;
      if (!metaOrCtrl) {
        return;
      }

      if (event.key.toLowerCase() === "s") {
        event.preventDefault();
        void saveAgent("مسودة");
      }

      if (["1", "2", "3", "4", "5"].includes(event.key)) {
        event.preventDefault();
        jumpToStep(Number(event.key) as خطوة);
      }
    };

    window.addEventListener("keydown", handleKeys);
    return () => window.removeEventListener("keydown", handleKeys);
  }, [jumpToStep, saveAgent]);

  const progress = useMemo(() => ((step - 1) / 4) * 100, [step]);

  const selectedIcon = useMemo(() => {
    return خياراتالايقونات.find((item) => item.id === form.الايقونة) || خياراتالايقونات[0];
  }, [form.الايقونة]);

  const descriptionChars = form.الوصف.length;

  const stepHasError = useMemo(() => {
    return !validateStep(step, true);
  }, [step, validateStep]);

  const currentStepTitle = عناوينالخطوات.find((item) => item.id === step)?.title || "";

  const previewName = getFieldValueFromRef("الاسم") || form.الاسم || "وكيل جديد";

  const reloadWorkflowBuilder = useCallback(() => {
    setWorkflowKey((prev) => prev + 1);
    void WorkflowCanvas.preload();
  }, []);

  return {
    step,
    setStep,
    form,
    userId,
    workflowSummary,
    workflowKey,
    loadingPage,
    saving,
    localMode,
    saveState,
    lastSavedAt,
    lastEditedAt,
    tagInput,
    setTagInput,
    headerKeyInput,
    setHeaderKeyInput,
    headerValueInput,
    setHeaderValueInput,
    templates,
    selectedTemplateId,
    setSelectedTemplateId,
    testMessages,
    testInput,
    setTestInput,
    isStreaming,
    testTokens,
    testCost,
    testLatency,
    systemState,
    importJsonRef,
    iconUploadRef,
    nameInputRef,
    descriptionInputRef,
    customCategoryInputRef,
    applyPartialForm,
    scheduleTextDraftCommit,
    flushTextDraft,
    flushBasicTextDrafts,
    loadTemplates,
    hydrateFromDatabase,
    hydrateFromDraft,
    saveDraftLocal,
    addTag,
    removeTag,
    addWebhookHeader,
    removeWebhookHeader,
    handleIconUpload,
    validateStep,
    goNext,
    goPrev,
    jumpToStep,
    applyTemplate,
    buildPayload,
    saveAgent,
    exportJson,
    importJson,
    runTestMessage,
    clearChat,
    runScenario,
    progress,
    selectedIcon,
    descriptionChars,
    stepHasError,
    currentStepTitle,
    previewName,
    reloadWorkflowBuilder,
  };
};

export default useAgentBuilder;
