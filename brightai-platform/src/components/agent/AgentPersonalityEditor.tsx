import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type KeyboardEvent,
} from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  Bold,
  Bot,
  Brain,
  CheckCircle2,
  FileText,
  Fullscreen,
  Italic,
  List,
  Loader2,
  MessageSquare,
  Sparkles,
  WandSparkles,
  X,
} from "lucide-react";
import { GroqService } from "../../services/groq.service";
import apiKeyService from "../../services/apikey.service";
import { isValidUrl, sanitizeInput } from "../../lib/validators";

export type لهجةمحرر = "رسمي ومهني" | "ودود وغير رسمي" | "تقني ودقيق" | "إبداعي ومرن" | "مخصص";
export type لغةمحرر = "العربية" | "الإنجليزية" | "تلقائي";

export type ملفمعرفةمحرر = {
  id: string;
  name: string;
  size: number;
  type: string;
  words: number;
  tokens: number;
  chunks: number;
  updatedAt: string;
};

export type رابطمحرر = {
  id: string;
  url: string;
  words: number;
  tokens: number;
  status: "غير مفحوص" | "جارٍ الجلب" | "جاهز" | "فشل";
  updatedAt: string;
};

export type شخصيةمحرر = {
  اسم: string;
  دور: string;
  خلفية: string;
  رسمية: number;
  إيجاز: number;
  إبداع: number;
  جدية: number;
  بساطة: number;
  تحية: string;
  عدمفهم: string;
  وداع: string;
  خطأ: string;
  خارجالنطاق: string;
};

export type قيمةمحررالشخصية = {
  وصفتوليد: string;
  الموجهالنظامي: string;
  اللهجة: لهجةمحرر;
  لغةالرد: لغةمحرر;
  قواعدالسلوك: string[];
  ملفاتالمعرفة: ملفمعرفةمحرر[];
  روابطالمعرفة: رابطمحرر[];
  نصالمعرفة: string;
  الشخصية: شخصيةمحرر;
  temperature: number;
  model: string;
  maxTokens: number;
};

type رسالةمعاينة = {
  id: string;
  role: "مستخدم" | "الوكيل";
  text: string;
  time: string;
};

type خصائصمحررالشخصية = {
  value: قيمةمحررالشخصية;
  onChange: (patch: Partial<قيمةمحررالشخصية>) => void;
};

const المتغيراتالافتراضية = [
  "اسم_العميل",
  "اسم_الشركة",
  "لغة_العميل",
  "رقم_الطلب",
  "اليوم",
  "المنطقة",
  "نوع_الخطة",
];

const الحدالأقصىللحجم = 10 * 1024 * 1024;
const الحدالإجمالي = 50 * 1024 * 1024;
const الامتداداتالمسموحة = ["pdf", "docx", "txt", "csv", "json"];

const تقديرالرموز = (text: string) => {
  if (!text.trim()) {
    return 0;
  }
  return Math.ceil(text.trim().length / 4);
};

const عددالكلمات = (text: string) => {
  return text
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean).length;
};

const حجمملف = (size: number) => {
  if (size < 1024) {
    return `${size} بايت`;
  }
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} ك.ب`;
  }
  return `${(size / (1024 * 1024)).toFixed(2)} م.ب`;
};

const تقسيملنص = (text: string, chunkSize = 1200, overlap = 120) => {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) {
    return [] as string[];
  }

  const chunks: string[] = [];
  let start = 0;
  while (start < normalized.length) {
    const end = Math.min(start + chunkSize, normalized.length);
    chunks.push(normalized.slice(start, end));
    if (end >= normalized.length) {
      break;
    }
    start = Math.max(0, end - overlap);
  }
  return chunks;
};

const stripHtml = (html: string) => {
  return html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

const بناءرسالةوكيل = (text: string, value: قيمةمحررالشخصية) => {
  const identity = value.الشخصية;
  const creativityRatio = value.temperature;
  const formalMode = identity.رسمية >= 55;
  const detailedMode = identity.إيجاز <= 45;

  const intro = identity.تحية.trim() || "مرحباً، يسعدني مساعدتك.";
  const base = [
    intro,
    `فهمت طلبك حول: ${text}`,
    detailedMode
      ? "سأعطيك خطوات مفصلة ومرتبة لتطبيق الحل مباشرة."
      : "سأعطيك إجابة مختصرة مع خطوة تنفيذ واضحة.",
    `مستوى الإبداع الحالي ${creativityRatio.toFixed(2)} والنبرة ${value.اللهجة}.`,
  ];

  if (formalMode) {
    base.push("سأحافظ على أسلوب مهني مباشر ومتزن.");
  } else {
    base.push("سأتحدث بنبرة ودية وواضحة مع الحفاظ على الدقة.");
  }

  if (value.قواعدالسلوك.length > 0) {
    base.push(`قاعدة سلوك مفعلة: ${value.قواعدالسلوك[0]}`);
  }

  if (creativityRatio > 1) {
    base.push("يمكنني اقتراح بدائل إضافية إذا رغبت بخيارات أكثر.");
  }

  const tail = identity.وداع.trim() || "إذا رغبت أتابع معك خطوة بخطوة.";
  base.push(tail);
  return base.join("\n");
};

const AgentPersonalityEditor = ({ value, onChange }: خصائصمحررالشخصية) => {
  const promptRef = useRef<HTMLTextAreaElement | null>(null);

  const [fullscreen, setFullscreen] = useState(false);
  const [variableOpen, setVariableOpen] = useState(false);
  const [variableQuery, setVariableQuery] = useState("");
  const [variableStart, setVariableStart] = useState<number | null>(null);

  const [ruleInput, setRuleInput] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [fileBusy, setFileBusy] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [fetchingUrlId, setFetchingUrlId] = useState("");

  const [previewInput, setPreviewInput] = useState("");
  const [previewMessages, setPreviewMessages] = useState<رسالةمعاينة[]>([]);

  const [generating, setGenerating] = useState(false);
  const [improving, setImproving] = useState(false);

  const tokenEstimate = useMemo(() => تقديرالرموز(value.الموجهالنظامي), [value.الموجهالنظامي]);

  const promptValidation = useMemo(() => {
    const text = value.الموجهالنظامي;
    const opens = (text.match(/\{\{/g) || []).length;
    const closes = (text.match(/\}\}/g) || []).length;
    const invalidVariables = Array.from(text.matchAll(/\{\{([^}]+)\}\}/g))
      .map((m) => m[1]?.trim() || "")
      .filter((name) => !/^[\u0600-\u06FFa-zA-Z0-9_ ]+$/.test(name));

    const errors: string[] = [];
    if (opens !== closes) {
      errors.push("تركيب المتغيرات غير متوازن: تأكد من إغلاق جميع الأقواس المزدوجة.");
    }
    if (invalidVariables.length > 0) {
      errors.push("بعض المتغيرات تحتوي رموزًا غير مدعومة.");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }, [value.الموجهالنظامي]);

  const promptSegments = useMemo(() => {
    return value.الموجهالنظامي.split(/(\{\{[^}]+\}\})/g);
  }, [value.الموجهالنظامي]);

  const suggestions = useMemo(() => {
    if (!variableOpen) {
      return [] as string[];
    }
    const query = variableQuery.trim();
    if (!query) {
      return المتغيراتالافتراضية;
    }
    return المتغيراتالافتراضية.filter((item) => item.includes(query));
  }, [variableOpen, variableQuery]);

  const stats = useMemo(() => {
    const fileWords = value.ملفاتالمعرفة.reduce((sum, item) => sum + item.words, 0);
    const fileTokens = value.ملفاتالمعرفة.reduce((sum, item) => sum + item.tokens, 0);
    const urlWords = value.روابطالمعرفة.reduce((sum, item) => sum + item.words, 0);
    const urlTokens = value.روابطالمعرفة.reduce((sum, item) => sum + item.tokens, 0);
    const directWords = عددالكلمات(value.نصالمعرفة);
    const directTokens = تقديرالرموز(value.نصالمعرفة);

    const totalSources =
      value.ملفاتالمعرفة.length + value.روابطالمعرفة.length + (value.نصالمعرفة.trim() ? 1 : 0);

    const lastTimes = [
      ...value.ملفاتالمعرفة.map((item) => item.updatedAt),
      ...value.روابطالمعرفة.map((item) => item.updatedAt),
    ].filter(Boolean);

    const latest =
      lastTimes.length > 0
        ? new Date(Math.max(...lastTimes.map((time) => new Date(time).getTime()))).toLocaleString(
            "ar-SA"
          )
        : "غير متاح";

    return {
      words: fileWords + urlWords + directWords,
      tokens: fileTokens + urlTokens + directTokens,
      sources: totalSources,
      updatedAt: latest,
    };
  }, [value.ملفاتالمعرفة, value.روابطالمعرفة, value.نصالمعرفة]);

  const update = useCallback(
    (patch: Partial<قيمةمحررالشخصية>) => {
      onChange(patch);
    },
    [onChange]
  );

  const updatePersona = useCallback(
    (patch: Partial<شخصيةمحرر>) => {
      update({
        الشخصية: {
          ...value.الشخصية,
          ...patch,
        },
      });
    },
    [update, value.الشخصية]
  );

  const applyFormat = useCallback(
    (type: "bold" | "italic" | "list") => {
      const textarea = promptRef.current;
      if (!textarea) {
        return;
      }

      const start = textarea.selectionStart || 0;
      const end = textarea.selectionEnd || 0;
      const text = value.الموجهالنظامي;
      const selected = text.slice(start, end) || "نص";

      let wrapped = selected;
      if (type === "bold") {
        wrapped = `**${selected}**`;
      }
      if (type === "italic") {
        wrapped = `*${selected}*`;
      }
      if (type === "list") {
        wrapped = selected
          .split("\n")
          .map((line) => (line.trim() ? `- ${line}` : "- "))
          .join("\n");
      }

      const next = `${text.slice(0, start)}${wrapped}${text.slice(end)}`;
      update({ الموجهالنظامي: next });

      requestAnimationFrame(() => {
        textarea.focus();
        const cursor = start + wrapped.length;
        textarea.setSelectionRange(cursor, cursor);
      });
    },
    [update, value.الموجهالنظامي]
  );

  const detectVariableTrigger = useCallback((text: string, caret: number) => {
    const before = text.slice(0, caret);
    const openIndex = before.lastIndexOf("{{");
    if (openIndex < 0) {
      setVariableOpen(false);
      setVariableQuery("");
      setVariableStart(null);
      return;
    }

    const closeIndex = before.lastIndexOf("}}");
    if (closeIndex > openIndex) {
      setVariableOpen(false);
      setVariableQuery("");
      setVariableStart(null);
      return;
    }

    const query = before.slice(openIndex + 2);
    if (/[^\u0600-\u06FFa-zA-Z0-9_ ]/.test(query)) {
      setVariableOpen(false);
      setVariableQuery("");
      setVariableStart(null);
      return;
    }

    setVariableOpen(true);
    setVariableQuery(query.trim());
    setVariableStart(openIndex);
  }, []);

  const handlePromptChange = useCallback(
    (event: ChangeEvent<HTMLTextAreaElement>) => {
      const text = event.target.value;
      update({ الموجهالنظامي: text });
      detectVariableTrigger(text, event.target.selectionStart || 0);
    },
    [detectVariableTrigger, update]
  );

  const chooseVariable = useCallback(
    (variable: string) => {
      const textarea = promptRef.current;
      if (!textarea) {
        return;
      }
      const caret = textarea.selectionStart || 0;
      const text = value.الموجهالنظامي;
      const start = variableStart === null ? text.lastIndexOf("{{", caret) : variableStart;
      if (start < 0) {
        return;
      }

      const next = `${text.slice(0, start)}{{${variable}}}${text.slice(caret)}`;
      update({ الموجهالنظامي: next });
      setVariableOpen(false);
      setVariableQuery("");
      setVariableStart(null);

      requestAnimationFrame(() => {
        textarea.focus();
        const cursor = start + variable.length + 4;
        textarea.setSelectionRange(cursor, cursor);
      });
    },
    [update, value.الموجهالنظامي, variableStart]
  );

  const resolveGroqClient = useCallback(async () => {
    if (process.env.REACT_APP_GROQ_API_KEY) {
      return new GroqService(process.env.REACT_APP_GROQ_API_KEY);
    }

    try {
      const key = await apiKeyService.getApiKey("groq");
      if (key) {
        return new GroqService(key);
      }
    } catch {
      return null;
    }

    return null;
  }, []);

  const generatePrompt = useCallback(
    async (mode: "generate" | "improve") => {
      const seed = mode === "generate" ? value.وصفتوليد.trim() : value.الموجهالنظامي.trim();
      if (!seed) {
        return;
      }

      if (mode === "generate") {
        setGenerating(true);
      } else {
        setImproving(true);
      }

      try {
        const client = await resolveGroqClient();
        if (!client) {
          const fallback = [
            "أنت وكيل ذكاء اصطناعي محترف لمنصة برايت.",
            `مهمتك الرئيسية: ${value.وصفتوليد || "تقديم دعم أعمال عملي"}.`,
            `نبرة الوكيل: ${value.اللهجة}.`,
            `لغة الاستجابة: ${value.لغةالرد}.`,
            "التزم بإجابات واضحة، مباشرة، وقابلة للتنفيذ ضمن سياق الأعمال.",
            "إذا كانت المعطيات ناقصة، اسأل سؤالًا توضيحيًا قبل إعطاء قرار نهائي.",
          ].join("\n");
          update({ الموجهالنظامي: fallback });
          return;
        }

        const response = await client.chat({
          model: value.model || "llama-3.1-70b-versatile",
          temperature: 0.4,
          max_tokens: Math.min(2200, value.maxTokens || 2200),
          messages: [
            {
              role: "system",
              content:
                "أنت خبير بناء شخصيات وكلاء ذكاء اصطناعي. اكتب Prompt System عربي احترافي، منظم، واضح، ومناسب لبيئة SaaS مؤسسية.",
            },
            {
              role: "user",
              content:
                mode === "generate"
                  ? `ابنِ System Prompt كامل بناء على الوصف التالي:\n${seed}\nالنبرة المطلوبة: ${value.اللهجة}\nلغة الرد: ${value.لغةالرد}`
                  : `قم بتحسين الـ System Prompt التالي دون تغيير الهدف الأساسي:\n${seed}`,
            },
          ],
        });

        const generated = response.choices?.[0]?.message?.content?.trim();
        if (generated) {
          update({ الموجهالنظامي: generated });
        }
      } catch {
        const backup = mode === "generate"
          ? "تعذر التوليد من الخدمة حالياً. استخدم الوصف الحالي وصِغ الأدوار والقواعد بشكل واضح."
          : "تعذر تحسين الموجه الحالي. يمكنك تعديل الهيكل يدويًا وإضافة قواعد أكثر دقة.";
        update({ الموجهالنظامي: `${value.الموجهالنظامي}\n${backup}`.trim() });
      } finally {
        setGenerating(false);
        setImproving(false);
      }
    },
    [resolveGroqClient, update, value.الموجهالنظامي, value.اللهجة, value.لغةالرد, value.maxTokens, value.model, value.وصفتوليد]
  );

  const addRule = useCallback(() => {
    const clean = sanitizeInput(ruleInput);
    if (!clean) {
      return;
    }
    if (value.قواعدالسلوك.includes(clean)) {
      setRuleInput("");
      return;
    }
    update({ قواعدالسلوك: [...value.قواعدالسلوك, clean] });
    setRuleInput("");
  }, [ruleInput, update, value.قواعدالسلوك]);

  const removeRule = useCallback(
    (index: number) => {
      update({
        قواعدالسلوك: value.قواعدالسلوك.filter((_, i) => i !== index),
      });
    },
    [update, value.قواعدالسلوك]
  );

  const processFiles = useCallback(
    async (files: File[]) => {
      if (files.length === 0) {
        return;
      }

      const totalCurrent = value.ملفاتالمعرفة.reduce((sum, item) => sum + item.size, 0);
      let total = totalCurrent;

      const accepted: File[] = [];
      for (const file of files) {
        const ext = file.name.split(".").pop()?.toLowerCase() || "";
        if (!الامتداداتالمسموحة.includes(ext)) {
          continue;
        }
        if (file.size > الحدالأقصىللحجم) {
          continue;
        }
        if (total + file.size > الحدالإجمالي) {
          continue;
        }
        total += file.size;
        accepted.push(file);
      }

      if (accepted.length === 0) {
        return;
      }

      setFileBusy(true);
      const nextFiles: ملفمعرفةمحرر[] = [];

      for (const file of accepted) {
        let text = "";
        try {
          text = await file.text();
        } catch {
          text = "";
        }

        const cleaned = sanitizeInput(text).slice(0, 250000);
        const chunks = تقسيملنص(cleaned);

        nextFiles.push({
          id: `${Date.now()}_${file.name}`,
          name: file.name,
          size: file.size,
          type: file.type || "application/octet-stream",
          words: عددالكلمات(cleaned),
          tokens: تقديرالرموز(cleaned),
          chunks: chunks.length,
          updatedAt: new Date().toISOString(),
        });
      }

      update({ ملفاتالمعرفة: [...value.ملفاتالمعرفة, ...nextFiles] });
      setFileBusy(false);
    },
    [update, value.ملفاتالمعرفة]
  );

  const onUploadFiles = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);
      void processFiles(files);
    },
    [processFiles]
  );

  const onDropFiles = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setDragOver(false);
      const files = Array.from(event.dataTransfer.files || []);
      void processFiles(files);
    },
    [processFiles]
  );

  const addUrl = useCallback(() => {
    const raw = urlInput.trim();
    if (!raw || !isValidUrl(raw)) {
      return;
    }

    const exists = value.روابطالمعرفة.some((item) => item.url === raw);
    if (exists) {
      setUrlInput("");
      return;
    }

    update({
      روابطالمعرفة: [
        ...value.روابطالمعرفة,
        {
          id: `${Date.now()}`,
          url: raw,
          words: 0,
          tokens: 0,
          status: "غير مفحوص",
          updatedAt: new Date().toISOString(),
        },
      ],
    });

    setUrlInput("");
  }, [update, urlInput, value.روابطالمعرفة]);

  const removeUrl = useCallback(
    (id: string) => {
      update({
        روابطالمعرفة: value.روابطالمعرفة.filter((item) => item.id !== id),
      });
    },
    [update, value.روابطالمعرفة]
  );

  const fetchUrl = useCallback(
    async (entry: رابطمحرر) => {
      setFetchingUrlId(entry.id);
      update({
        روابطالمعرفة: value.روابطالمعرفة.map((item) =>
          item.id === entry.id ? { ...item, status: "جارٍ الجلب" } : item
        ),
      });

      try {
        const response = await fetch(entry.url, { method: "GET" });
        const raw = await response.text();
        const content = sanitizeInput(stripHtml(raw)).slice(0, 250000);
        const words = عددالكلمات(content);
        const tokens = تقديرالرموز(content);

        update({
          روابطالمعرفة: value.روابطالمعرفة.map((item) =>
            item.id === entry.id
              ? {
                  ...item,
                  words,
                  tokens,
                  status: "جاهز",
                  updatedAt: new Date().toISOString(),
                }
              : item
          ),
        });
      } catch {
        update({
          روابطالمعرفة: value.روابطالمعرفة.map((item) =>
            item.id === entry.id
              ? {
                  ...item,
                  status: "فشل",
                  updatedAt: new Date().toISOString(),
                }
              : item
          ),
        });
      } finally {
        setFetchingUrlId("");
      }
    },
    [update, value.روابطالمعرفة]
  );

  const removeFile = useCallback(
    (id: string) => {
      update({
        ملفاتالمعرفة: value.ملفاتالمعرفة.filter((item) => item.id !== id),
      });
    },
    [update, value.ملفاتالمعرفة]
  );

  const sendPreview = useCallback(async () => {
    const clean = previewInput.trim();
    if (!clean) {
      return;
    }

    const userMessage: رسالةمعاينة = {
      id: `${Date.now()}_u`,
      role: "مستخدم",
      text: clean,
      time: new Date().toISOString(),
    };

    const reply = بناءرسالةوكيل(clean, value);

    const botMessage: رسالةمعاينة = {
      id: `${Date.now()}_a`,
      role: "الوكيل",
      text: reply,
      time: new Date().toISOString(),
    };

    setPreviewMessages((prev) => [...prev, userMessage, botMessage]);
    setPreviewInput("");
  }, [previewInput, value]);

  const clearPreview = useCallback(() => {
    setPreviewMessages([]);
  }, []);

  useEffect(() => {
    const summary = `تم تحديث الشخصية: ${value.الشخصية.اسم || "وكيل بدون اسم"} - نبرة ${value.اللهجة}`;
    setPreviewMessages((prev) => {
      const system: رسالةمعاينة = {
        id: "system_preview_note",
        role: "الوكيل",
        text: summary,
        time: new Date().toISOString(),
      };

      const withoutSystem = prev.filter((item) => item.id !== "system_preview_note");
      return [system, ...withoutSystem.slice(0, 8)];
    });
  }, [value.الشخصية.اسم, value.اللهجة, value.temperature]);

  const promptEditor = (
    <div className="rounded-2xl border border-slate-700 bg-slate-900/50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-100">محرر System Prompt الذكي</h3>
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span>{`رموز تقريبية: ${tokenEstimate}`}</span>
          <span>{`أحرف: ${value.الموجهالنظامي.length}`}</span>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => applyFormat("bold")}
          className="inline-flex min-h-[38px] items-center gap-1 rounded-lg border border-slate-700 bg-slate-950/70 px-2.5 text-xs text-slate-200"
        >
          <Bold className="h-3.5 w-3.5" />
          غامق
        </button>
        <button
          type="button"
          onClick={() => applyFormat("italic")}
          className="inline-flex min-h-[38px] items-center gap-1 rounded-lg border border-slate-700 bg-slate-950/70 px-2.5 text-xs text-slate-200"
        >
          <Italic className="h-3.5 w-3.5" />
          مائل
        </button>
        <button
          type="button"
          onClick={() => applyFormat("list")}
          className="inline-flex min-h-[38px] items-center gap-1 rounded-lg border border-slate-700 bg-slate-950/70 px-2.5 text-xs text-slate-200"
        >
          <List className="h-3.5 w-3.5" />
          قائمة
        </button>
        <button
          type="button"
          onClick={() => setFullscreen(true)}
          className="inline-flex min-h-[38px] items-center gap-1 rounded-lg border border-slate-700 bg-slate-950/70 px-2.5 text-xs text-slate-200"
        >
          <Fullscreen className="h-3.5 w-3.5" />
          ملء الشاشة
        </button>
      </div>

      <textarea
        ref={promptRef}
        value={value.الموجهالنظامي}
        onChange={handlePromptChange}
        onClick={(event) => {
          detectVariableTrigger(value.الموجهالنظامي, (event.target as HTMLTextAreaElement).selectionStart || 0);
        }}
        onKeyUp={(event) => {
          detectVariableTrigger(value.الموجهالنظامي, (event.target as HTMLTextAreaElement).selectionStart || 0);
        }}
        className="mt-3 min-h-[210px] w-full rounded-xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm leading-8 text-slate-100"
        placeholder="اكتب التعليمات الأساسية لسلوك الوكيل"
      />

      {variableOpen && suggestions.length > 0 ? (
        <div className="mt-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-2">
          <p className="mb-1 text-[11px] text-emerald-200">اقتراحات المتغيرات</p>
          <div className="flex flex-wrap gap-1.5">
            {suggestions.map((variable) => (
              <button
                key={variable}
                type="button"
                onClick={() => chooseVariable(variable)}
                className="rounded-lg border border-emerald-500/30 bg-slate-950/70 px-2 py-1 text-[11px] text-emerald-100"
              >
                {`{{${variable}}}`}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-3 rounded-xl border border-slate-700 bg-slate-950/70 p-3">
        <p className="mb-2 text-xs text-slate-400">معاينة تلوين المتغيرات</p>
        <pre className="whitespace-pre-wrap break-words text-sm leading-7 text-slate-300">
          {promptSegments.map((segment, index) => {
            const isVariable = /^\{\{[^}]+\}\}$/.test(segment);
            return (
              <span
                key={`${segment}-${index}`}
                className={isVariable ? "rounded bg-emerald-500/20 px-1 text-emerald-200" : ""}
              >
                {segment}
              </span>
            );
          })}
        </pre>
      </div>

      {!promptValidation.valid ? (
        <div className="mt-3 space-y-1 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-100">
          {promptValidation.errors.map((error) => (
            <p key={error}>{error}</p>
          ))}
        </div>
      ) : (
        <div className="mt-3 inline-flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
          <CheckCircle2 className="h-3.5 w-3.5" />
          تركيب الموجه سليم
        </div>
      )}

      <div className="mt-4 rounded-xl border border-slate-700 bg-slate-950/70 p-3">
        <p className="text-xs text-slate-400">مولّد System Prompt بالذكاء الاصطناعي</p>
        <textarea
          value={value.وصفتوليد}
          onChange={(event) => update({ وصفتوليد: event.target.value })}
          placeholder="صف ما تريد أن يفعله الـ Agent"
          className="mt-2 min-h-[90px] w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
        />
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void generatePrompt("generate")}
            disabled={generating}
            className="inline-flex min-h-[40px] items-center gap-2 rounded-xl bg-sky-500/20 px-3 text-sm text-sky-200 disabled:opacity-60"
          >
            {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            توليد
          </button>
          <button
            type="button"
            onClick={() => void generatePrompt("improve")}
            disabled={improving}
            className="inline-flex min-h-[40px] items-center gap-2 rounded-xl border border-slate-700 px-3 text-sm text-slate-200 disabled:opacity-60"
          >
            {improving ? <Loader2 className="h-4 w-4 animate-spin" /> : <WandSparkles className="h-4 w-4" />}
            تحسين
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="grid gap-4 xl:grid-cols-[1.4fr_0.9fr]">
      <div className="space-y-4">
        {promptEditor}

        <div className="rounded-2xl border border-slate-700 bg-slate-900/50 p-4">
          <h3 className="text-sm font-semibold text-slate-100">قواعد السلوك</h3>
          <div className="mt-3 space-y-2">
            {value.قواعدالسلوك.map((rule, index) => (
              <div
                key={`${rule}-${index}`}
                className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-xs text-slate-200"
              >
                <span className="flex-1">{rule}</span>
                <button
                  type="button"
                  onClick={() => removeRule(index)}
                  className="rounded p-1 hover:bg-slate-800"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <input
              value={ruleInput}
              onChange={(event) => setRuleInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  addRule();
                }
              }}
              placeholder="أضف قاعدة سلوك"
              className="min-h-[42px] flex-1 rounded-xl border border-slate-700 bg-slate-950/70 px-3 text-sm text-slate-100"
            />
            <button
              type="button"
              onClick={addRule}
              className="min-h-[42px] rounded-xl border border-slate-700 px-3 text-xs text-slate-200"
            >
              إضافة
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-700 bg-slate-900/50 p-4">
          <h3 className="text-sm font-semibold text-slate-100">بناء الشخصية البصري</h3>

          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <label className="grid gap-1 text-xs text-slate-400">
              اسم الشخصية
              <input
                value={value.الشخصية.اسم}
                onChange={(event) => updatePersona({ اسم: event.target.value })}
                placeholder="مثال: سارة - مساعدة خدمة العملاء"
                className="min-h-[42px] rounded-xl border border-slate-700 bg-slate-950/70 px-3 text-sm text-slate-100"
              />
            </label>
            <label className="grid gap-1 text-xs text-slate-400">
              الدور
              <input
                value={value.الشخصية.دور}
                onChange={(event) => updatePersona({ دور: event.target.value })}
                placeholder="خبيرة في حل مشاكل العملاء"
                className="min-h-[42px] rounded-xl border border-slate-700 bg-slate-950/70 px-3 text-sm text-slate-100"
              />
            </label>
          </div>

          <label className="mt-3 grid gap-1 text-xs text-slate-400">
            الخلفية
            <textarea
              value={value.الشخصية.خلفية}
              onChange={(event) => updatePersona({ خلفية: event.target.value })}
              placeholder="اكتب خلفية الشخصية ومجال خبرتها"
              className="min-h-[78px] rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100"
            />
          </label>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {[
              { key: "رسمية", label: "الرسمية ←→ الودية", value: value.الشخصية.رسمية },
              { key: "إيجاز", label: "الإيجاز ←→ التفصيل", value: value.الشخصية.إيجاز },
              { key: "إبداع", label: "الإبداع ←→ الدقة", value: value.الشخصية.إبداع },
              { key: "جدية", label: "الجدية ←→ المرح", value: value.الشخصية.جدية },
              { key: "بساطة", label: "البساطة ←→ التقنية", value: value.الشخصية.بساطة },
            ].map((item) => (
              <label key={item.key} className="grid gap-1 text-xs text-slate-400">
                {item.label}
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={item.value}
                  onChange={(event) => updatePersona({ [item.key]: Number(event.target.value) } as Partial<شخصيةمحرر>)}
                />
                <span className="text-[11px] text-slate-500">{item.value}%</span>
              </label>
            ))}
          </div>

          <div className="mt-4 grid gap-2">
            <h4 className="text-xs font-semibold text-slate-300">نماذج الإجابة</h4>
            {[
              { key: "تحية", label: "تحية افتتاحية" },
              { key: "عدمفهم", label: "رسالة عند عدم الفهم" },
              { key: "وداع", label: "رسالة الوداع" },
              { key: "خطأ", label: "رسالة عند الخطأ" },
              { key: "خارجالنطاق", label: "رسالة عند الخروج عن النطاق" },
            ].map((item) => (
              <label key={item.key} className="grid gap-1 text-xs text-slate-400">
                {item.label}
                <input
                  value={value.الشخصية[item.key as keyof شخصيةمحرر] as string}
                  onChange={(event) => updatePersona({ [item.key]: event.target.value } as Partial<شخصيةمحرر>)}
                  className="min-h-[40px] rounded-xl border border-slate-700 bg-slate-950/70 px-3 text-sm text-slate-100"
                />
              </label>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-700 bg-slate-900/50 p-4">
          <h3 className="text-sm font-semibold text-slate-100">قاعدة المعرفة</h3>

          <div
            onDragOver={(event) => {
              event.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDropFiles}
            className={`mt-3 rounded-2xl border-2 border-dashed p-4 text-center transition ${
              dragOver ? "border-emerald-400/70 bg-emerald-500/10" : "border-slate-700 bg-slate-950/60"
            }`}
          >
            <p className="text-sm text-slate-200">اسحب الملفات هنا أو اخترها يدويًا</p>
            <p className="mt-1 text-xs text-slate-400">PDF / DOCX / TXT / CSV / JSON بحد ١٠MB للملف و ٥٠MB إجمالي</p>
            <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-xs text-slate-200">
              <FileText className="h-3.5 w-3.5" />
              اختيار ملفات
              <input type="file" multiple accept=".pdf,.docx,.txt,.csv,.json" className="hidden" onChange={onUploadFiles} />
            </label>
            {fileBusy ? (
              <p className="mt-2 inline-flex items-center gap-2 text-xs text-emerald-200">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                جارٍ استخراج النص وتقسيمه...
              </p>
            ) : null}
          </div>

          <div className="mt-3 space-y-2">
            {value.ملفاتالمعرفة.map((file) => (
              <div key={file.id} className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-xs text-slate-300">
                <span className="font-semibold text-slate-100">{file.name}</span>
                <span>{حجمملف(file.size)}</span>
                <span>كلمات: {file.words}</span>
                <span>رموز: {file.tokens}</span>
                <span>أجزاء: {file.chunks}</span>
                <button
                  type="button"
                  onClick={() => removeFile(file.id)}
                  className="mr-auto rounded-md p-1 hover:bg-slate-800"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-xl border border-slate-700 bg-slate-950/60 p-3">
            <p className="text-xs text-slate-400">إضافة روابط</p>
            <div className="mt-2 flex gap-2">
              <input
                value={urlInput}
                onChange={(event) => setUrlInput(event.target.value)}
                onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addUrl();
                  }
                }}
                placeholder="https://example.com"
                className="min-h-[40px] flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3 text-xs text-slate-100"
              />
              <button
                type="button"
                onClick={addUrl}
                className="min-h-[40px] rounded-xl border border-slate-700 px-3 text-xs text-slate-200"
              >
                إضافة
              </button>
            </div>

            <div className="mt-2 space-y-1">
              {value.روابطالمعرفة.map((url) => (
                <div key={url.id} className="rounded-lg border border-slate-700 bg-slate-950/70 px-2 py-2 text-[11px] text-slate-300">
                  <div className="flex items-center gap-2">
                    <ArrowUpRight className="h-3.5 w-3.5" />
                    <span className="flex-1 truncate">{url.url}</span>
                    <button
                      type="button"
                      onClick={() => void fetchUrl(url)}
                      disabled={fetchingUrlId === url.id}
                      className="rounded-md border border-slate-700 px-2 py-0.5 text-[11px]"
                    >
                      {fetchingUrlId === url.id ? "جارٍ الجلب" : "جلب المحتوى"}
                    </button>
                    <button
                      type="button"
                      onClick={() => removeUrl(url.id)}
                      className="rounded-md p-0.5 hover:bg-slate-800"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-slate-500">
                    <span>الحالة: {url.status}</span>
                    <span>كلمات: {url.words}</span>
                    <span>رموز: {url.tokens}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <label className="mt-4 grid gap-1 text-xs text-slate-400">
            نص مباشر
            <textarea
              value={value.نصالمعرفة}
              onChange={(event) => update({ نصالمعرفة: event.target.value })}
              className="min-h-[120px] rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100"
              placeholder="أضف معلومات الشركة، السياسات، FAQ..."
            />
          </label>

          <div className="mt-3 grid gap-2 rounded-xl border border-slate-700 bg-slate-950/70 p-3 text-xs text-slate-300 sm:grid-cols-2">
            <div>إجمالي الكلمات: <strong className="text-slate-100">{stats.words}</strong></div>
            <div>إجمالي الرموز: <strong className="text-slate-100">{stats.tokens}</strong></div>
            <div>عدد المصادر: <strong className="text-slate-100">{stats.sources}</strong></div>
            <div>آخر تحديث: <strong className="text-slate-100">{stats.updatedAt}</strong></div>
          </div>
        </div>
      </div>

      <aside className="space-y-4">
        <div className="rounded-2xl border border-slate-700 bg-slate-900/50 p-4">
          <h3 className="text-sm font-semibold text-slate-100">المعاينة الحية</h3>
          <p className="mt-1 text-xs text-slate-400">سلوك الوكيل يتحدث تلقائياً عند تغيير الإعدادات</p>

          <div className="mt-3 max-h-[460px] min-h-[320px] space-y-2 overflow-y-auto rounded-xl border border-slate-700 bg-slate-950/70 p-3">
            {previewMessages.length === 0 ? (
              <p className="text-xs text-slate-400">لا توجد رسائل حتى الآن.</p>
            ) : (
              previewMessages.map((message) => (
                <div
                  key={message.id}
                  className={`rounded-xl px-3 py-2 text-xs leading-7 ${
                    message.role === "مستخدم"
                      ? "mr-6 bg-sky-500/20 text-sky-100"
                      : "ml-6 bg-emerald-500/20 text-emerald-100"
                  }`}
                >
                  <p className="mb-1 text-[10px] text-slate-300">{message.role}</p>
                  <p className="whitespace-pre-wrap break-words">{message.text}</p>
                </div>
              ))
            )}
          </div>

          <div className="mt-3 flex gap-2">
            <input
              value={previewInput}
              onChange={(event) => setPreviewInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void sendPreview();
                }
              }}
              placeholder="أرسل رسالة تجريبية"
              className="min-h-[42px] flex-1 rounded-xl border border-slate-700 bg-slate-950/70 px-3 text-xs text-slate-100"
            />
            <button
              type="button"
              onClick={() => void sendPreview()}
              className="min-h-[42px] rounded-xl bg-emerald-500/20 px-3 text-xs text-emerald-200"
            >
              إرسال
            </button>
          </div>

          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={clearPreview}
              className="inline-flex min-h-[36px] items-center gap-1 rounded-lg border border-slate-700 px-2 text-[11px] text-slate-300"
            >
              <X className="h-3 w-3" />
              مسح
            </button>
            <span className="inline-flex min-h-[36px] items-center rounded-lg border border-slate-700 px-2 text-[11px] text-slate-400">
              Temperature: {value.temperature.toFixed(2)}
            </span>
            <span className="inline-flex min-h-[36px] items-center rounded-lg border border-slate-700 px-2 text-[11px] text-slate-400">
              النموذج: {value.model}
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-700 bg-slate-900/50 p-4 text-xs text-slate-300">
          <h4 className="text-sm font-semibold text-slate-100">حالة المحرر</h4>
          <div className="mt-2 space-y-2">
            <div className="flex items-center gap-2">
              {promptValidation.valid ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />
              ) : (
                <AlertTriangle className="h-3.5 w-3.5 text-rose-300" />
              )}
              <span>{promptValidation.valid ? "تركيب الموجه سليم" : "يوجد خطأ في التركيب"}</span>
            </div>
            <div className="flex items-center gap-2">
              <Brain className="h-3.5 w-3.5 text-sky-300" />
              <span>{`تقدير الرموز: ${tokenEstimate}`}</span>
            </div>
            <div className="flex items-center gap-2">
              <MessageSquare className="h-3.5 w-3.5 text-violet-300" />
              <span>{`قواعد السلوك: ${value.قواعدالسلوك.length}`}</span>
            </div>
            <div className="flex items-center gap-2">
              <Bot className="h-3.5 w-3.5 text-amber-300" />
              <span>{`مصادر المعرفة: ${stats.sources}`}</span>
            </div>
          </div>
        </div>
      </aside>

      {fullscreen ? (
        <div className="fixed inset-0 z-[120] bg-slate-950/90 p-4 backdrop-blur-xl">
          <div className="mx-auto h-full max-w-6xl overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900/95 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-100">محرر System Prompt - ملء الشاشة</h3>
              <button
                type="button"
                onClick={() => setFullscreen(false)}
                className="inline-flex min-h-[38px] items-center gap-1 rounded-lg border border-slate-700 px-2 text-xs text-slate-200"
              >
                <X className="h-3.5 w-3.5" />
                إغلاق
              </button>
            </div>
            {promptEditor}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default AgentPersonalityEditor;
