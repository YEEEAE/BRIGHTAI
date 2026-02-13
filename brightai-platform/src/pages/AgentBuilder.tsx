import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  AlertTriangle,
  Bot,
  Brain,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Coins,
  Download,
  FileJson,
  Hash,
  Loader2,
  MessageSquare,
  Play,
  Plus,
  RefreshCcw,
  Rocket,
  Save,
  SlidersHorizontal,
  Sparkles,
  Store,
  Upload,
  Wrench,
  X,
} from "lucide-react";
import supabase from "../lib/supabase";
import useAppToast from "../hooks/useAppToast";
import { trackFeatureUsed } from "../lib/analytics";
import { getLocalAdminUser } from "../lib/local-admin";
import AsyncErrorBoundary from "../components/layout/AsyncErrorBoundary";
import { lazyWithRetry } from "../lib/lazy";
import AgentPersonalityEditor, {
  type قيمةمحررالشخصية,
  type رابطمحرر,
  type ملفمعرفةمحرر,
  type شخصيةمحرر,
} from "../components/agent/AgentPersonalityEditor";

const WorkflowCanvas = lazyWithRetry(() => import("../components/agent/WorkflowCanvas"));

type خطوة = 1 | 2 | 3 | 4 | 5;
type وضعسير = "بسيط" | "متقدم";
type لهجة = قيمةمحررالشخصية["اللهجة"];
type لغةرد = قيمةمحررالشخصية["لغةالرد"];
type حدثويبهوك = "عند النجاح" | "عند الفشل" | "الكل";
type حالةحفظ = "غير محفوظ" | "جارٍ الحفظ..." | "تم الحفظ" | "تعذر الحفظ";
type نوعحفظ = "مسودة" | "تفعيل" | "سوق";

type ترويسةويبهوك = {
  id: string;
  key: string;
  value: string;
};

type ملفمعرفة = ملفمعرفةمحرر;
type رابطمصدر = رابطمحرر;

type بياناتنموذج = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  workflow: unknown;
  settings: Record<string, unknown> | null;
  tags: string[] | null;
};

type رسالةاختبار = {
  id: string;
  role: "مستخدم" | "الوكيل";
  text: string;
  createdAt: string;
};

type حالةنظام = {
  apiConnected: boolean;
  promptReady: boolean;
  workflowReady: boolean;
  warnings: string[];
};

type حالةالنموذج = {
  الاسم: string;
  الوصف: string;
  الفئة: string;
  فئةمخصصة: string;
  الايقونة: string;
  صورةايقونة: string;
  اللون: string;
  الوسوم: string[];

  وصفمولد: string;
  الموجهالنظامي: string;
  اللهجة: لهجة;
  لغةالرد: لغةرد;
  قواعدالسلوك: string[];
  روابطالمعرفة: رابطمصدر[];
  ملفاتالمعرفة: ملفمعرفة[];
  نصالمعرفة: string;
  الشخصية: شخصيةمحرر;

  وضعالسير: وضعسير;

  النموذج: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;

  حدتنفيذيومي: number;
  حدتكلفةيومية: number;
  timeoutSeconds: number;
  retries: number;

  عام: boolean;
  تسجيلالمحادثات: boolean;
  مشاركةمعالفريق: boolean;

  webhookUrl: string;
  webhookEvent: حدثويبهوك;
  webhookHeaders: ترويسةويبهوك[];
};

type ملخصسير = {
  nodes: number;
  edges: number;
  sizeKb: number;
  raw: Record<string, unknown> | null;
};

type نسخةمسودة = {
  agentId: string | null;
  form: حالةالنموذج;
  lastSavedAt: string;
  step?: خطوة;
  workflow?: Record<string, unknown> | null;
};

const WORKFLOW_STORAGE_KEY = "brightai_workflow_autosave";
const WORKFLOW_UPDATED_EVENT = "brightai-workflow-updated";
const DRAFT_STORAGE_PREFIX = "brightai_agent_builder_wizard_v2";

const فئاتالوكلاء = [
  "خدمة العملاء",
  "تحليل البيانات",
  "إنشاء المحتوى",
  "الترجمة",
  "البرمجة والتطوير",
  "التسويق",
  "المبيعات",
  "الموارد البشرية",
  "أخرى (مخصصة)",
];

const خياراتالنماذج = [
  { id: "llama-3.1-405b-reasoning", label: "جروك - لاما ٣٫١ ٤٠٥ مليار (الأقوى)" },
  { id: "llama-3.1-70b-versatile", label: "جروك - لاما ٣٫١ ٧٠ مليار (متوازن)" },
  { id: "llama-3.1-8b-instant", label: "جروك - لاما ٣٫١ ٨ مليار (الأسرع)" },
  { id: "mixtral-8x7b-32768", label: "جروك - ميكسترال ٨×٧" },
  { id: "gemma2-9b-it", label: "جروك - جيمّا٢ ٩ مليار" },
];

const خياراتالايقونات = [
  { id: "دعم", label: "دعم", icon: MessageSquare },
  { id: "تحليل", label: "تحليل", icon: Hash },
  { id: "محتوى", label: "محتوى", icon: Sparkles },
  { id: "ترجمة", label: "ترجمة", icon: Upload },
  { id: "برمجة", label: "برمجة", icon: Wrench },
  { id: "تسويق", label: "تسويق", icon: Rocket },
  { id: "مبيعات", label: "مبيعات", icon: Coins },
  { id: "موارد", label: "موارد", icon: Bot },
  { id: "أعمال", label: "أعمال", icon: Store },
  { id: "افتراضي", label: "افتراضي", icon: Bot },
];

const عناوينالخطوات = [
  { id: 1 as خطوة, title: "المعلومات الأساسية" },
  { id: 2 as خطوة, title: "إعداد الشخصية والسلوك" },
  { id: 3 as خطوة, title: "تصميم سير العمل" },
  { id: 4 as خطوة, title: "الإعدادات المتقدمة" },
  { id: 5 as خطوة, title: "الاختبار والنشر" },
];

const الحالةالافتراضية: حالةالنموذج = {
  الاسم: "",
  الوصف: "",
  الفئة: "خدمة العملاء",
  فئةمخصصة: "",
  الايقونة: "افتراضي",
  صورةايقونة: "",
  اللون: "#22c55e",
  الوسوم: [],

  وصفمولد: "",
  الموجهالنظامي:
    "أنت وكيل ذكاء اصطناعي لمنصة برايت. قدّم إجابات عملية ومباشرة، واطرح أسئلة توضيحية عند نقص المعلومات، ثم اقترح خطوات قابلة للتنفيذ.",
  اللهجة: "رسمي ومهني",
  لغةالرد: "العربية",
  قواعدالسلوك: ["التزم بنطاق المهمة المحدد.", "قدّم أمثلة عملية عند الحاجة."],
  روابطالمعرفة: [],
  ملفاتالمعرفة: [],
  نصالمعرفة: "",
  الشخصية: {
    اسم: "وكيل Bright AI",
    دور: "مساعد أعمال ذكي",
    خلفية: "وكيل متخصص في دعم فرق الأعمال واتخاذ القرار.",
    رسمية: 70,
    إيجاز: 45,
    إبداع: 55,
    جدية: 75,
    بساطة: 50,
    تحية: "مرحباً، أنا جاهز لمساعدتك.",
    عدمفهم: "أحتاج تفاصيل أكثر حتى أقدم إجابة دقيقة.",
    وداع: "سعيد بخدمتك، ويمكنني المتابعة عند الحاجة.",
    خطأ: "حدث خطأ أثناء المعالجة وسأحاول من جديد.",
    خارجالنطاق: "هذا الطلب خارج نطاق الوكيل الحالي، هل تريد توجيهًا بديلًا؟",
  },

  وضعالسير: "متقدم",

  النموذج: "llama-3.1-70b-versatile",
  temperature: 0.7,
  maxTokens: 2200,
  topP: 0.95,
  frequencyPenalty: 0,
  presencePenalty: 0,

  حدتنفيذيومي: 200,
  حدتكلفةيومية: 120,
  timeoutSeconds: 90,
  retries: 1,

  عام: false,
  تسجيلالمحادثات: true,
  مشاركةمعالفريق: false,

  webhookUrl: "",
  webhookEvent: "الكل",
  webhookHeaders: [],
};

const supabaseClient = supabase as unknown as {
  from: (table: string) => any;
};

const normalizeKnowledgeUrls = (input: unknown): رابطمصدر[] => {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .map((item, index) => {
      if (typeof item === "string") {
        return {
          id: `url_${index}_${Date.now()}`,
          url: item,
          words: 0,
          tokens: 0,
          status: "غير مفحوص" as const,
          updatedAt: new Date().toISOString(),
        };
      }

      if (item && typeof item === "object") {
        const row = item as Record<string, unknown>;
        const url = String(row.url || "");
        if (!url) {
          return null;
        }
        return {
          id: String(row.id || `url_${index}_${Date.now()}`),
          url,
          words: Number(row.words || 0),
          tokens: Number(row.tokens || 0),
          status:
            row.status === "جارٍ الجلب" ||
            row.status === "جاهز" ||
            row.status === "فشل" ||
            row.status === "غير مفحوص"
              ? (row.status as رابطمصدر["status"])
              : "غير مفحوص",
          updatedAt: String(row.updatedAt || new Date().toISOString()),
        };
      }

      return null;
    })
    .filter((item): item is رابطمصدر => Boolean(item));
};

const normalizeKnowledgeFiles = (input: unknown): ملفمعرفة[] => {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .map((item, index) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const row = item as Record<string, unknown>;
      const name = String(row.name || "");
      if (!name) {
        return null;
      }

      return {
        id: String(row.id || `file_${index}_${Date.now()}`),
        name,
        size: Number(row.size || 0),
        type: String(row.type || "application/octet-stream"),
        words: Number(row.words || 0),
        tokens: Number(row.tokens || 0),
        chunks: Number(row.chunks || 0),
        updatedAt: String(row.updatedAt || new Date().toISOString()),
      };
    })
    .filter((item): item is ملفمعرفة => Boolean(item));
};

const getDraftKey = (agentId?: string) => `${DRAFT_STORAGE_PREFIX}_${agentId || "new"}`;

const تقديرالرموز = (text: string) => {
  if (!text.trim()) {
    return 0;
  }
  return Math.ceil(text.trim().length / 4);
};

const delay = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));
const withTimeout = async <T,>(promise: Promise<T>, ms: number, fallback: T): Promise<T> => {
  const timeoutPromise = new Promise<T>((resolve) => {
    window.setTimeout(() => resolve(fallback), ms);
  });
  return Promise.race([promise, timeoutPromise]);
};

const evaluateStep = (stepId: خطوة, form: حالةالنموذج) => {
  if (stepId === 1) {
    const nameLength = form.الاسم.trim().length;
    const descLength = form.الوصف.trim().length;
    if (nameLength < 3 || nameLength > 50) {
      return { valid: false, message: "اسم الوكيل يجب أن يكون بين ٣ و ٥٠ حرفًا." };
    }
    if (descLength < 10 || descLength > 500) {
      return { valid: false, message: "الوصف يجب أن يكون بين ١٠ و ٥٠٠ حرف." };
    }
    if (form.الفئة === "أخرى (مخصصة)" && form.فئةمخصصة.trim().length < 2) {
      return { valid: false, message: "أدخل اسمًا واضحًا للفئة المخصصة." };
    }
  }

  if (stepId === 2) {
    if (form.الموجهالنظامي.trim().length < 30) {
      return { valid: false, message: "الموجه النظامي قصير، أضف تعليمات أدق." };
    }
  }

  if (stepId === 4) {
    if (form.maxTokens < 100 || form.maxTokens > 32000) {
      return { valid: false, message: "قيمة الحد الأقصى للرموز خارج النطاق." };
    }
    if (form.timeoutSeconds < 10 || form.timeoutSeconds > 600) {
      return { valid: false, message: "مهلة التنفيذ يجب أن تكون بين ١٠ و ٦٠٠ ثانية." };
    }
    if (form.webhookUrl && !/^https?:\/\//.test(form.webhookUrl)) {
      return { valid: false, message: "رابط الويب هوك غير صالح." };
    }
  }

  return { valid: true, message: "" };
};

const readWorkflowSummary = (): ملخصسير => {
  try {
    const raw = localStorage.getItem(WORKFLOW_STORAGE_KEY);
    if (!raw) {
      return { nodes: 0, edges: 0, sizeKb: 0, raw: null };
    }
    const parsed = JSON.parse(raw) as { nodes?: unknown[]; edges?: unknown[] };
    const nodes = Array.isArray(parsed.nodes) ? parsed.nodes.length : 0;
    const edges = Array.isArray(parsed.edges) ? parsed.edges.length : 0;
    const sizeKb = Number((new Blob([raw]).size / 1024).toFixed(2));
    return { nodes, edges, sizeKb, raw: parsed as Record<string, unknown> };
  } catch {
    return { nodes: 0, edges: 0, sizeKb: 0, raw: null };
  }
};

const AgentBuilder = () => {
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
  const initializedRef = useRef(false);
  const lastDraftFingerprintRef = useRef("");

  useEffect(() => {
    document.title = "مصمم الوكلاء المتقدم | منصة برايت";
  }, []);

  const applyPartialForm = useCallback((partial: Partial<حالةالنموذج>) => {
    setForm((prev) => ({ ...prev, ...partial }));
  }, []);

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

    const fingerprint = JSON.stringify({
      agentId: id || null,
      form,
      step,
      workflow: workflowSummary.raw || null,
    });
    if (lastDraftFingerprintRef.current === fingerprint) {
      return;
    }

    const key = getDraftKey(id);
    const payload: نسخةمسودة = {
      agentId: id || null,
      form,
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
  }, [form, id, step, workflowSummary.raw]);

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
    const result = evaluateStep(stepId, form);
    if (!result.valid && !silent) {
      showError(result.message);
    }
    return result.valid;
  }, [form, showError]);

  const goNext = useCallback(() => {
    if (!validateStep(step)) {
      return;
    }
    setStep((prev) => (prev >= 5 ? 5 : ((prev + 1) as خطوة)));
  }, [step, validateStep]);

  const goPrev = useCallback(() => {
    setStep((prev) => (prev <= 1 ? 1 : ((prev - 1) as خطوة)));
  }, []);

  const jumpToStep = useCallback((target: خطوة) => {
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
  }, [step, validateStep]);

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
    const resolvedCategory =
      form.الفئة === "أخرى (مخصصة)"
        ? form.فئةمخصصة.trim() || "أخرى"
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
      name: form.الاسم.trim(),
      description: form.الوصف.trim(),
      category: resolvedCategory,
      workflow,
      settings,
      status,
      is_public: isPublic,
      tags: form.الوسوم,
      user_id: userId,
      created_by: userId,
    };
  }, [form, userId, workflowSummary.raw]);

  const saveAgent = useCallback(async (saveType: نوعحفظ) => {
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
  }, [buildPayload, form.عام, id, localMode, navigate, saveDraftLocal, showError, showSuccess, userId, validateStep]);

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
    anchor.download = `${form.الاسم || "وكيل"}.json`;
    anchor.click();
    URL.revokeObjectURL(url);

    showSuccess("تم تصدير الوكيل كملف JSON.");
    trackFeatureUsed("تصدير JSON");
  }, [form, showSuccess, workflowSummary.raw]);

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

  if (loadingPage) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4 py-8 text-slate-200">
        <div className="inline-flex items-center gap-3 rounded-2xl border border-slate-700 bg-slate-900/70 px-5 py-4">
          <Loader2 className="h-5 w-5 animate-spin text-emerald-300" />
          جارٍ تجهيز مصمم الوكلاء...
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-4 px-3 py-4 md:px-6 md:py-6">
      <header className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950/30 p-4 shadow-2xl shadow-slate-950/30 md:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-xs text-emerald-300">مصمم الوكلاء المتقدم</p>
            <h1 className="mt-1 text-2xl font-extrabold text-slate-100 md:text-3xl">
              إنشاء وكيل ذكاء اصطناعي متكامل
            </h1>
            <p className="mt-1 text-sm text-slate-300">
              الخطوة الحالية: {currentStepTitle}
            </p>
            {localMode ? (
              <p className="mt-2 inline-flex items-center rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-xs text-amber-200">
                وضع محلي مؤقت: يمكنك حفظ المسودات محليًا فقط.
              </p>
            ) : null}
          </div>

          <div className="grid gap-2 sm:grid-cols-2 xl:flex xl:flex-wrap">
            <div className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-xs text-slate-200">
              <span>استيراد من قالب</span>
              <select
                value={selectedTemplateId}
                onChange={(event) => setSelectedTemplateId(event.target.value)}
                className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-xs"
              >
                <option value="">اختر قالب</option>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={applyTemplate}
                className="rounded-lg bg-emerald-500/20 px-2 py-1 text-emerald-200"
              >
                تطبيق
              </button>
            </div>

            <button
              type="button"
              onClick={() => importJsonRef.current?.click()}
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-xs text-slate-200"
            >
              <Upload className="h-4 w-4" />
              استيراد من JSON
            </button>

            <button
              type="button"
              onClick={exportJson}
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-xs text-slate-200"
            >
              <Download className="h-4 w-4" />
              تصدير كـ JSON
            </button>

            <button
              type="button"
              onClick={() => void saveAgent("مسودة")}
              disabled={saving}
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-emerald-400 px-4 py-2 text-sm font-bold text-slate-950 disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              حفظ مسودة
            </button>
          </div>
        </div>

        <input
          ref={importJsonRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={importJson}
        />

        <div className="mt-5">
          <div className="mb-3 h-2 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-sky-400 to-violet-400 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="grid gap-2 sm:grid-cols-5">
            {عناوينالخطوات.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => jumpToStep(item.id)}
                className={`rounded-xl border px-3 py-2 text-right text-xs transition ${
                  step === item.id
                    ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-200"
                    : step > item.id
                    ? "border-sky-400/30 bg-sky-500/10 text-sky-200"
                    : "border-slate-700 bg-slate-900/60 text-slate-300"
                }`}
              >
                <span className="block font-bold">الخطوة {item.id}</span>
                <span className="block mt-1">{item.title}</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="grid gap-4 xl:grid-cols-[1.8fr_0.8fr]">
        <section className="rounded-3xl border border-white/10 bg-slate-950/70 p-4 backdrop-blur-xl md:p-6">
          {step === 1 && (
            <div className="grid gap-5">
              <h2 className="text-xl font-bold text-slate-100">المعلومات الأساسية</h2>

              <div className="grid gap-2">
                <label className="text-sm text-slate-300">اسم الوكيل</label>
                <input
                  value={form.الاسم}
                  onChange={(event) => applyPartialForm({ الاسم: event.target.value })}
                  placeholder="مثال: مساعد خدمة العملاء"
                  className="min-h-[46px] rounded-xl border border-slate-700 bg-slate-900/70 px-4 text-slate-100"
                />
                <p className="text-xs text-slate-400">٣ إلى ٥٠ حرف ({form.الاسم.length}/50)</p>
              </div>

              <div className="grid gap-2">
                <label className="text-sm text-slate-300">الوصف</label>
                <textarea
                  value={form.الوصف}
                  onChange={(event) => applyPartialForm({ الوصف: event.target.value })}
                  placeholder="اشرح ماذا يفعل الوكيل وما القيمة التي يقدّمها"
                  className="min-h-[120px] rounded-xl border border-slate-700 bg-slate-900/70 px-4 py-3 text-slate-100"
                />
                <p className="text-xs text-slate-400">١٠ إلى ٥٠٠ حرف ({descriptionChars}/500)</p>
              </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <label className="text-sm text-slate-300">الفئة</label>
                  <select
                    value={form.الفئة}
                    onChange={(event) => applyPartialForm({ الفئة: event.target.value })}
                    className="min-h-[46px] rounded-xl border border-slate-700 bg-slate-900/70 px-3 text-slate-100"
                  >
                    {فئاتالوكلاء.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                  </div>

                  <div className="grid gap-2">
                  <label className="text-sm text-slate-300">اللون الرئيسي</label>
                  <div className="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-2">
                    <input
                      type="color"
                      value={form.اللون}
                      onChange={(event) => applyPartialForm({ اللون: event.target.value })}
                      className="h-9 w-11 cursor-pointer rounded-md border border-slate-700 bg-transparent"
                    />
                    <code className="text-xs text-slate-300">{form.اللون}</code>
                  </div>
                </div>

              {form.الفئة === "أخرى (مخصصة)" ? (
                <div className="grid gap-2">
                  <label className="text-sm text-slate-300">اسم الفئة المخصصة</label>
                  <input
                    value={form.فئةمخصصة}
                    onChange={(event) => applyPartialForm({ فئةمخصصة: event.target.value })}
                    placeholder="مثال: الامتثال القانوني"
                    className="min-h-[46px] rounded-xl border border-slate-700 bg-slate-900/70 px-4 text-slate-100"
                  />
                </div>
              ) : null}
              </div>

              <div className="grid gap-2">
                <label className="text-sm text-slate-300">أيقونة الوكيل</label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
                  {خياراتالايقونات.map((item) => {
                    const Icon = item.icon;
                    const active = form.الايقونة === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => applyPartialForm({ الايقونة: item.id, صورةايقونة: "" })}
                        className={`rounded-xl border px-2 py-3 text-center transition ${
                          active
                            ? "border-emerald-400/60 bg-emerald-500/10 text-emerald-200"
                            : "border-slate-700 bg-slate-900/60 text-slate-300"
                        }`}
                      >
                        <Icon className="mx-auto h-4 w-4" />
                        <span className="mt-1 block text-[11px]">{item.label}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-1 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => iconUploadRef.current?.click()}
                    className="inline-flex min-h-[40px] items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/70 px-3 text-xs text-slate-200"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    رفع صورة مخصصة
                  </button>
                  <input
                    ref={iconUploadRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleIconUpload}
                  />

                  <div className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-2">
                    {form.صورةايقونة ? (
                      <img src={form.صورةايقونة} alt="أيقونة مخصصة" className="h-7 w-7 rounded-lg object-cover" />
                    ) : (
                      <selectedIcon.icon className="h-4 w-4 text-emerald-300" />
                    )}
                    <span className="text-xs text-slate-300">المعاينة الحالية</span>
                  </div>
                </div>
              </div>

              <div className="grid gap-2">
                <label className="text-sm text-slate-300">الوسوم</label>
                <div className="flex flex-wrap gap-2">
                  {form.الوسوم.map((tag) => (
                    <span key={tag} className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-200">
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="rounded-full p-0.5 hover:bg-slate-900/40"
                        aria-label="حذف الوسم"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  <input
                    value={tagInput}
                    onChange={(event) => setTagInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === ",") {
                        event.preventDefault();
                        addTag();
                      }
                    }}
                    placeholder="أضف وسمًا ثم اضغط إدخال"
                    className="min-h-[44px] flex-1 rounded-xl border border-slate-700 bg-slate-900/70 px-3 text-sm text-slate-100"
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/70 px-3 text-sm text-slate-200"
                  >
                    <Plus className="h-4 w-4" />
                    إضافة
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="grid gap-5">
              <h2 className="text-xl font-bold text-slate-100">إعداد الشخصية والسلوك</h2>
              <AgentPersonalityEditor
                value={{
                  وصفتوليد: form.وصفمولد,
                  الموجهالنظامي: form.الموجهالنظامي,
                  اللهجة: form.اللهجة,
                  لغةالرد: form.لغةالرد,
                  قواعدالسلوك: form.قواعدالسلوك,
                  ملفاتالمعرفة: form.ملفاتالمعرفة,
                  روابطالمعرفة: form.روابطالمعرفة,
                  نصالمعرفة: form.نصالمعرفة,
                  الشخصية: form.الشخصية,
                  temperature: form.temperature,
                  model: form.النموذج,
                  maxTokens: form.maxTokens,
                }}
                onChange={(patch) => {
                  applyPartialForm({
                    وصفمولد: patch.وصفتوليد ?? form.وصفمولد,
                    الموجهالنظامي: patch.الموجهالنظامي ?? form.الموجهالنظامي,
                    اللهجة: patch.اللهجة ?? form.اللهجة,
                    لغةالرد: patch.لغةالرد ?? form.لغةالرد,
                    قواعدالسلوك: patch.قواعدالسلوك ?? form.قواعدالسلوك,
                    ملفاتالمعرفة: patch.ملفاتالمعرفة ?? form.ملفاتالمعرفة,
                    روابطالمعرفة: patch.روابطالمعرفة ?? form.روابطالمعرفة,
                    نصالمعرفة: patch.نصالمعرفة ?? form.نصالمعرفة,
                    الشخصية: patch.الشخصية ?? form.الشخصية,
                  });
                }}
              />
            </div>
          )}

          {step === 3 && (
            <div className="grid gap-4">
              <h2 className="text-xl font-bold text-slate-100">تصميم سير العمل</h2>

              <div className="flex flex-wrap gap-2">
                {(["بسيط", "متقدم"] as وضعسير[]).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => applyPartialForm({ وضعالسير: mode })}
                    className={`inline-flex min-h-[42px] items-center gap-2 rounded-xl border px-3 text-sm ${
                      form.وضعالسير === mode
                        ? "border-emerald-400/60 bg-emerald-500/10 text-emerald-200"
                        : "border-slate-700 bg-slate-900/60 text-slate-300"
                    }`}
                  >
                    {mode === "بسيط" ? <MessageSquare className="h-4 w-4" /> : <SlidersHorizontal className="h-4 w-4" />}
                    {mode === "بسيط" ? "وضع بسيط" : "وضع متقدم"}
                  </button>
                ))}
              </div>

              {form.وضعالسير === "بسيط" ? (
                <div className="rounded-2xl border border-slate-700 bg-slate-900/50 p-5">
                  <p className="text-sm text-slate-200">تم تفعيل الوضع البسيط.</p>
                  <p className="mt-1 text-xs text-slate-400">
                    الوكيل سيعمل بنمط محادثة مباشر اعتمادًا على الموجه النظامي بدون عقد سير عمل.
                  </p>
                </div>
              ) : (
                <div className="rounded-2xl border border-slate-700 bg-slate-900/40 p-3 md:p-4">
                  <AsyncErrorBoundary
                    title="تعذر تحميل مصمم سير العمل"
                    message="حدث خلل أثناء تحميل مكوّن المصمم. يمكنك إعادة المحاولة دون فقدان المسودة."
                    onRetry={() => {
                      setWorkflowKey((prev) => prev + 1);
                      void WorkflowCanvas.preload();
                    }}
                    className="flex h-[530px] flex-col items-center justify-center gap-3 rounded-2xl border border-rose-500/30 bg-rose-900/10 p-6 text-center"
                  >
                    <Suspense
                      fallback={
                        <div className="flex h-[530px] items-center justify-center rounded-2xl bg-slate-900 text-slate-300">
                          جارٍ تحميل مصمم سير العمل...
                        </div>
                      }
                    >
                      <WorkflowCanvas key={workflowKey} />
                    </Suspense>
                  </AsyncErrorBoundary>
                </div>
              )}
            </div>
          )}

          {step === 4 && (
            <div className="grid gap-5">
              <h2 className="text-xl font-bold text-slate-100">الإعدادات المتقدمة</h2>

              <div className="rounded-2xl border border-slate-700 bg-slate-900/50 p-4">
                <h3 className="text-sm font-semibold text-slate-200">اختيار النموذج</h3>
                <div className="mt-3 grid gap-2">
                  {خياراتالنماذج.map((model) => (
                    <button
                      key={model.id}
                      type="button"
                      onClick={() => applyPartialForm({ النموذج: model.id })}
                      className={`rounded-xl border px-3 py-2 text-right text-sm ${
                        form.النموذج === model.id
                          ? "border-emerald-400/50 bg-emerald-500/10 text-emerald-200"
                          : "border-slate-700 bg-slate-950/60 text-slate-300"
                      }`}
                    >
                      {model.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-700 bg-slate-900/50 p-4">
                  <h3 className="text-sm font-semibold text-slate-200">إعدادات النموذج</h3>

                  <label className="mt-3 block text-xs text-slate-400">Temperature: {form.temperature.toFixed(2)}</label>
                  <input
                    type="range"
                    min={0}
                    max={2}
                    step={0.01}
                    value={form.temperature}
                    onChange={(event) => applyPartialForm({ temperature: Number(event.target.value) })}
                    className="w-full"
                  />

                  <label className="mt-3 block text-xs text-slate-400">Max Tokens: {form.maxTokens}</label>
                  <input
                    type="range"
                    min={100}
                    max={32000}
                    step={100}
                    value={form.maxTokens}
                    onChange={(event) => applyPartialForm({ maxTokens: Number(event.target.value) })}
                    className="w-full"
                  />

                  <label className="mt-3 block text-xs text-slate-400">Top P: {form.topP.toFixed(2)}</label>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={form.topP}
                    onChange={(event) => applyPartialForm({ topP: Number(event.target.value) })}
                    className="w-full"
                  />

                  <label className="mt-3 block text-xs text-slate-400">
                    Frequency Penalty: {form.frequencyPenalty.toFixed(2)}
                  </label>
                  <input
                    type="range"
                    min={-2}
                    max={2}
                    step={0.01}
                    value={form.frequencyPenalty}
                    onChange={(event) => applyPartialForm({ frequencyPenalty: Number(event.target.value) })}
                    className="w-full"
                  />

                  <label className="mt-3 block text-xs text-slate-400">
                    Presence Penalty: {form.presencePenalty.toFixed(2)}
                  </label>
                  <input
                    type="range"
                    min={-2}
                    max={2}
                    step={0.01}
                    value={form.presencePenalty}
                    onChange={(event) => applyPartialForm({ presencePenalty: Number(event.target.value) })}
                    className="w-full"
                  />
                </div>

                <div className="rounded-2xl border border-slate-700 bg-slate-900/50 p-4">
                  <h3 className="text-sm font-semibold text-slate-200">إعدادات التشغيل</h3>
                  <div className="mt-3 grid gap-3">
                    <label className="grid gap-1 text-xs text-slate-400">
                      الحد الأقصى للتنفيذات يوميًا
                      <input
                        type="number"
                        min={1}
                        value={form.حدتنفيذيومي}
                        onChange={(event) => applyPartialForm({ حدتنفيذيومي: Number(event.target.value) })}
                        className="min-h-[40px] rounded-lg border border-slate-700 bg-slate-950/70 px-3 text-sm text-slate-100"
                      />
                    </label>

                    <label className="grid gap-1 text-xs text-slate-400">
                      الحد الأقصى للتكلفة يوميًا (ريال)
                      <input
                        type="number"
                        min={1}
                        value={form.حدتكلفةيومية}
                        onChange={(event) => applyPartialForm({ حدتكلفةيومية: Number(event.target.value) })}
                        className="min-h-[40px] rounded-lg border border-slate-700 bg-slate-950/70 px-3 text-sm text-slate-100"
                      />
                    </label>

                    <label className="grid gap-1 text-xs text-slate-400">
                      مهلة التنفيذ بالثواني
                      <input
                        type="number"
                        min={10}
                        max={600}
                        value={form.timeoutSeconds}
                        onChange={(event) => applyPartialForm({ timeoutSeconds: Number(event.target.value) })}
                        className="min-h-[40px] rounded-lg border border-slate-700 bg-slate-950/70 px-3 text-sm text-slate-100"
                      />
                    </label>

                    <label className="grid gap-1 text-xs text-slate-400">
                      عدد إعادة المحاولة
                      <input
                        type="number"
                        min={0}
                        max={5}
                        value={form.retries}
                        onChange={(event) => applyPartialForm({ retries: Number(event.target.value) })}
                        className="min-h-[40px] rounded-lg border border-slate-700 bg-slate-950/70 px-3 text-sm text-slate-100"
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-700 bg-slate-900/50 p-4">
                  <h3 className="text-sm font-semibold text-slate-200">إعدادات الخصوصية</h3>
                  <div className="mt-3 grid gap-2">
                    <label className="inline-flex min-h-[42px] items-center justify-between rounded-xl border border-slate-700 bg-slate-950/60 px-3 text-sm text-slate-200">
                      عام (يظهر في السوق)
                      <input
                        type="checkbox"
                        checked={form.عام}
                        onChange={(event) => applyPartialForm({ عام: event.target.checked })}
                      />
                    </label>

                    <label className="inline-flex min-h-[42px] items-center justify-between rounded-xl border border-slate-700 bg-slate-950/60 px-3 text-sm text-slate-200">
                      تسجيل المحادثات
                      <input
                        type="checkbox"
                        checked={form.تسجيلالمحادثات}
                        onChange={(event) =>
                          applyPartialForm({ تسجيلالمحادثات: event.target.checked })
                        }
                      />
                    </label>

                    <label className="inline-flex min-h-[42px] items-center justify-between rounded-xl border border-slate-700 bg-slate-950/60 px-3 text-sm text-slate-200">
                      مشاركة البيانات مع الفريق
                      <input
                        type="checkbox"
                        checked={form.مشاركةمعالفريق}
                        onChange={(event) =>
                          applyPartialForm({ مشاركةمعالفريق: event.target.checked })
                        }
                      />
                    </label>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-700 bg-slate-900/50 p-4">
                  <h3 className="text-sm font-semibold text-slate-200">Webhooks</h3>

                  <label className="mt-3 block text-xs text-slate-400">رابط الويب هوك</label>
                  <input
                    value={form.webhookUrl}
                    onChange={(event) => applyPartialForm({ webhookUrl: event.target.value })}
                    placeholder="https://example.com/hook"
                    className="mt-1 min-h-[40px] w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 text-sm text-slate-100"
                  />

                  <label className="mt-3 block text-xs text-slate-400">الحدث</label>
                  <select
                    value={form.webhookEvent}
                    onChange={(event) =>
                      applyPartialForm({ webhookEvent: event.target.value as حدثويبهوك })
                    }
                    className="mt-1 min-h-[40px] w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 text-sm text-slate-100"
                  >
                    <option value="عند النجاح">عند النجاح</option>
                    <option value="عند الفشل">عند الفشل</option>
                    <option value="الكل">الكل</option>
                  </select>

                  <p className="mt-3 text-xs text-slate-400">ترويسات مخصصة</p>
                  <div className="mt-1 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <input
                      value={headerKeyInput}
                      onChange={(event) => setHeaderKeyInput(event.target.value)}
                      placeholder="المفتاح"
                      className="min-h-[40px] rounded-lg border border-slate-700 bg-slate-950/70 px-2 text-xs text-slate-100"
                    />
                    <input
                      value={headerValueInput}
                      onChange={(event) => setHeaderValueInput(event.target.value)}
                      placeholder="القيمة"
                      className="min-h-[40px] rounded-lg border border-slate-700 bg-slate-950/70 px-2 text-xs text-slate-100"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={addWebhookHeader}
                    className="mt-2 min-h-[38px] rounded-lg border border-slate-700 px-3 text-xs text-slate-200"
                  >
                    إضافة ترويسة
                  </button>

                  <div className="mt-2 space-y-1">
                    {form.webhookHeaders.map((header) => (
                      <div key={header.id} className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-950/70 px-2 py-1 text-xs text-slate-300">
                        <span className="flex-1 truncate">{header.key}: {header.value}</span>
                        <button
                          type="button"
                          onClick={() => removeWebhookHeader(header.id)}
                          className="rounded p-0.5 hover:bg-slate-800"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="grid gap-5">
              <h2 className="text-xl font-bold text-slate-100">الاختبار والنشر</h2>

              <div className="rounded-2xl border border-slate-700 bg-slate-900/50 p-4">
                <h3 className="text-sm font-semibold text-slate-200">واجهة اختبار مباشرة</h3>

                <div className="mt-3 max-h-[320px] min-h-[220px] space-y-2 overflow-y-auto rounded-xl border border-slate-700 bg-slate-950/70 p-3">
                  {testMessages.length === 0 ? (
                    <p className="text-xs text-slate-400">ابدأ رسالة اختبار لرؤية الاستجابة الفورية.</p>
                  ) : (
                    testMessages.map((message) => (
                      <div
                        key={message.id}
                        className={`rounded-xl px-3 py-2 text-sm ${
                          message.role === "مستخدم"
                            ? "mr-8 bg-sky-500/20 text-sky-100"
                            : "ml-8 bg-emerald-500/20 text-emerald-100"
                        }`}
                      >
                        <p className="text-[11px] text-slate-300">{message.role}</p>
                        <pre className="whitespace-pre-wrap break-words font-sans leading-7">{message.text || (isStreaming ? "..." : "")}</pre>
                      </div>
                    ))
                  )}
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <input
                    value={testInput}
                    onChange={(event) => setTestInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        void runTestMessage(testInput);
                      }
                    }}
                    placeholder="اكتب رسالة للاختبار"
                    className="min-h-[44px] flex-1 rounded-xl border border-slate-700 bg-slate-950/70 px-3 text-sm text-slate-100"
                  />

                  <button
                    type="button"
                    onClick={() => void runTestMessage(testInput)}
                    disabled={isStreaming}
                    className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-emerald-500/20 px-3 text-sm font-semibold text-emerald-200 disabled:opacity-60"
                  >
                    {isStreaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                    إرسال
                  </button>

                  <button
                    type="button"
                    onClick={clearChat}
                    className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-slate-700 px-3 text-sm text-slate-200"
                  >
                    <RefreshCcw className="h-4 w-4" />
                    مسح المحادثة
                  </button>

                  <button
                    type="button"
                    onClick={runScenario}
                    className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-slate-700 px-3 text-sm text-slate-200"
                  >
                    <Sparkles className="h-4 w-4" />
                    تجربة سيناريو مختلف
                  </button>
                </div>

                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  <div className="rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2 text-xs text-slate-300">
                    <p>الرموز المستخدمة</p>
                    <p className="mt-1 text-sm font-bold text-slate-100">{testTokens}</p>
                  </div>
                  <div className="rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2 text-xs text-slate-300">
                    <p>التكلفة التقديرية (ر.س)</p>
                    <p className="mt-1 text-sm font-bold text-slate-100">{testCost.toFixed(4)}</p>
                  </div>
                  <div className="rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2 text-xs text-slate-300">
                    <p>وقت الاستجابة</p>
                    <p className="mt-1 text-sm font-bold text-slate-100">{testLatency} مللي ثانية</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-700 bg-slate-900/50 p-4">
                <h3 className="text-sm font-semibold text-slate-200">نتائج الاختبار</h3>
                <div className="mt-3 space-y-2 text-sm">
                  <div className="flex items-start gap-2 rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2">
                    {systemState.apiConnected ? (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-300" />
                    ) : (
                      <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-300" />
                    )}
                    <span className="text-slate-200">
                      {systemState.apiConnected
                        ? "الاتصال بمفتاح API متاح."
                        : "لم يتم العثور على مفتاح API نشط لـ Groq."}
                    </span>
                  </div>

                  <div className="flex items-start gap-2 rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2">
                    {systemState.promptReady ? (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-300" />
                    ) : (
                      <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-300" />
                    )}
                    <span className="text-slate-200">
                      {systemState.promptReady
                        ? "الموجه النظامي جاهز."
                        : "الموجه النظامي يحتاج تفاصيل إضافية."}
                    </span>
                  </div>

                  <div className="flex items-start gap-2 rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2">
                    {systemState.workflowReady ? (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-300" />
                    ) : (
                      <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-300" />
                    )}
                    <span className="text-slate-200">
                      {systemState.workflowReady
                        ? "سير العمل جاهز للتشغيل."
                        : "سير العمل المتقدم يحتاج عقدًا واحدة على الأقل."}
                    </span>
                  </div>

                  {systemState.warnings.map((warning) => (
                    <div key={warning} className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-amber-100">
                      <AlertTriangle className="mt-0.5 h-4 w-4" />
                      <span>{warning}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-2 md:grid-cols-3">
                <button
                  type="button"
                  onClick={() => void saveAgent("مسودة")}
                  disabled={saving}
                  className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900/70 text-sm font-semibold text-slate-200 disabled:opacity-60"
                >
                  <Save className="h-4 w-4" />
                  حفظ كمسودة
                </button>

                <button
                  type="button"
                  onClick={() => void saveAgent("تفعيل")}
                  disabled={saving}
                  className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl bg-emerald-500/20 text-sm font-semibold text-emerald-200 disabled:opacity-60"
                >
                  <Rocket className="h-4 w-4" />
                  نشر وتفعيل
                </button>

                <button
                  type="button"
                  onClick={() => void saveAgent("سوق")}
                  disabled={saving || !form.عام}
                  className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl bg-sky-500/20 text-sm font-semibold text-sky-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Store className="h-4 w-4" />
                  نشر في السوق
                </button>
              </div>
            </div>
          )}

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 pt-4">
            <button
              type="button"
              onClick={goPrev}
              disabled={step === 1}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/70 px-4 text-sm text-slate-200 disabled:opacity-50"
            >
              <ChevronRight className="h-4 w-4" />
              السابق
            </button>

            <div className="text-xs text-slate-400">
              استخدم اختصار
              <kbd className="mx-1 rounded border border-slate-700 px-1.5 py-0.5 text-[11px]">Ctrl+S</kbd>
              للحفظ
            </div>

            <button
              type="button"
              onClick={goNext}
              disabled={step === 5}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-emerald-400 px-4 text-sm font-semibold text-slate-950 disabled:opacity-50"
            >
              التالي
              <ChevronLeft className="h-4 w-4" />
            </button>
          </div>
        </section>

        <aside className="grid gap-4">
          <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-4">
            <h3 className="text-sm font-bold text-slate-100">بطاقة الوكيل</h3>
            <div className="mt-3 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: `${form.اللون}22`, color: form.اللون }}>
                {form.صورةايقونة ? (
                  <img src={form.صورةايقونة} alt="أيقونة" className="h-10 w-10 rounded-xl object-cover" />
                ) : (
                  <selectedIcon.icon className="h-5 w-5" />
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-100">{form.الاسم || "وكيل جديد"}</p>
                <p className="text-xs text-slate-400">{form.الفئة}</p>
              </div>
            </div>
            <p className="mt-3 text-xs leading-7 text-slate-300">
              {form.الوصف || "أضف وصفًا واضحًا لعرض قيمة الوكيل."}
            </p>
            <div className="mt-3 flex flex-wrap gap-1">
              {form.الوسوم.slice(0, 6).map((tag) => (
                <span key={tag} className="rounded-full bg-slate-800 px-2 py-1 text-[11px] text-slate-200">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-4">
            <h3 className="text-sm font-bold text-slate-100">مؤشرات سريعة</h3>
            <div className="mt-3 grid gap-2 text-xs">
              <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-slate-300">
                <span className="inline-flex items-center gap-1"><Hash className="h-3.5 w-3.5" /> عقد سير العمل</span>
                <strong className="text-slate-100">{workflowSummary.nodes}</strong>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-slate-300">
                <span className="inline-flex items-center gap-1"><Wrench className="h-3.5 w-3.5" /> روابط سير العمل</span>
                <strong className="text-slate-100">{workflowSummary.edges}</strong>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-slate-300">
                <span className="inline-flex items-center gap-1"><FileJson className="h-3.5 w-3.5" /> حجم المخطط</span>
                <strong className="text-slate-100">{workflowSummary.sizeKb} ك.ب</strong>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-slate-300">
                <span className="inline-flex items-center gap-1"><Coins className="h-3.5 w-3.5" /> حد التكلفة اليومية</span>
                <strong className="text-slate-100">{form.حدتكلفةيومية} ر.س</strong>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-slate-300">
                <span className="inline-flex items-center gap-1"><Brain className="h-3.5 w-3.5" /> النموذج</span>
                <strong className="text-slate-100">{form.النموذج}</strong>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-4">
            <h3 className="text-sm font-bold text-slate-100">تنبيهات الجودة</h3>
            <div className="mt-3 space-y-2 text-xs">
              <div className={`rounded-xl border px-3 py-2 ${stepHasError ? "border-rose-500/30 bg-rose-500/10 text-rose-200" : "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"}`}>
                {stepHasError ? "يوجد نواقص في الخطوة الحالية." : "الخطوة الحالية مكتملة."}
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-slate-300">
                إذا أردت تجربة سريعة استخدم
                <strong className="mx-1 text-slate-100">Ctrl+1..5</strong>
                للتنقل بين الخطوات.
              </div>
            </div>
          </div>
        </aside>
      </main>

      <footer className="sticky bottom-2 z-30 rounded-2xl border border-white/10 bg-slate-950/90 px-4 py-3 backdrop-blur-xl">
        <div className="grid gap-2 text-xs text-slate-300 md:grid-cols-3">
          <div className="inline-flex items-center gap-2">
            <Save className="h-3.5 w-3.5" />
            حالة الحفظ: <strong className="text-slate-100">{saveState}</strong>
          </div>
          <div className="inline-flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5" />
            آخر حفظ: <strong className="text-slate-100">{lastSavedAt || "لم يتم بعد"}</strong>
          </div>
          <div className="inline-flex items-center gap-2">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            حجم سير العمل: <strong className="text-slate-100">{workflowSummary.nodes} عقدة / {workflowSummary.edges} رابط</strong>
          </div>
        </div>

        <div className="mt-2 text-[11px] text-slate-500">
          آخر تعديل: {lastEditedAt || "-"}
        </div>
      </footer>
    </div>
  );
};

export default AgentBuilder;
