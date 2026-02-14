import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type SyntheticEvent,
} from "react";
import { GroqService } from "../services/groq.service";
import apiKeyService from "../services/apikey.service";
import {
  الامتداداتالمسموحة,
  الحدالأقصىللحجم,
  الحدالإجمالي,
  المتغيراتالافتراضية,
} from "../constants/agent-personality.constants";
import {
  بناءرسالةوكيل,
  stripHtml,
  تقسيملنص,
  تقديرالرموز,
  عددالكلمات,
} from "../lib/agent-personality.utils";
import { isValidUrl, sanitizeInput } from "../lib/validators";
import type {
  احصاءاتالمعرفة,
  حالةتحققالموجه,
  خصائصمحررالشخصية,
  رابطمحرر,
  رسالةمعاينة,
  شخصيةمحرر,
  ملفمعرفةمحرر,
  نوعتنسيق,
  وضعالتوليد,
} from "../types/agent-personality.types";

const useAgentPersonalityEditor = ({ value, onChange }: خصائصمحررالشخصية) => {
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

  const promptValidation = useMemo<حالةتحققالموجه>(() => {
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

    return { valid: errors.length === 0, errors };
  }, [value.الموجهالنظامي]);

  const promptSegments = useMemo(() => value.الموجهالنظامي.split(/(\{\{[^}]+\}\})/g), [value.الموجهالنظامي]);

  const suggestions = useMemo(() => {
    if (!variableOpen) {
      return [] as string[];
    }
    const query = variableQuery.trim();
    if (!query) {
      return [...المتغيراتالافتراضية];
    }
    return المتغيراتالافتراضية.filter((item) => item.includes(query));
  }, [variableOpen, variableQuery]);

  const stats = useMemo<احصاءاتالمعرفة>(() => {
    const fileWords = value.ملفاتالمعرفة.reduce((sum, item) => sum + item.words, 0);
    const fileTokens = value.ملفاتالمعرفة.reduce((sum, item) => sum + item.tokens, 0);
    const urlWords = value.روابطالمعرفة.reduce((sum, item) => sum + item.words, 0);
    const urlTokens = value.روابطالمعرفة.reduce((sum, item) => sum + item.tokens, 0);
    const directWords = عددالكلمات(value.نصالمعرفة);
    const directTokens = تقديرالرموز(value.نصالمعرفة);

    const totalSources = value.ملفاتالمعرفة.length + value.روابطالمعرفة.length + (value.نصالمعرفة.trim() ? 1 : 0);

    const lastTimes = [...value.ملفاتالمعرفة.map((item) => item.updatedAt), ...value.روابطالمعرفة.map((item) => item.updatedAt)].filter(Boolean);

    const latest =
      lastTimes.length > 0
        ? new Date(Math.max(...lastTimes.map((time) => new Date(time).getTime()))).toLocaleString("ar-SA")
        : "غير متاح";

    return {
      words: fileWords + urlWords + directWords,
      tokens: fileTokens + urlTokens + directTokens,
      sources: totalSources,
      updatedAt: latest,
    };
  }, [value.ملفاتالمعرفة, value.روابطالمعرفة, value.نصالمعرفة]);

  const update = useCallback(
    (patch: Partial<typeof value>) => {
      onChange(patch);
    },
    [onChange]
  );

  const updatePersona = useCallback(
    (patch: Partial<شخصيةمحرر>) => {
      update({ الشخصية: { ...value.الشخصية, ...patch } });
    },
    [update, value.الشخصية]
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

  const applyFormat = useCallback(
    (type: نوعتنسيق) => {
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

  const handlePromptChange = useCallback(
    (event: ChangeEvent<HTMLTextAreaElement>) => {
      const text = event.target.value;
      update({ الموجهالنظامي: text });
      detectVariableTrigger(text, event.target.selectionStart || 0);
    },
    [detectVariableTrigger, update]
  );

  const handlePromptCursorChange = useCallback(
    (event: SyntheticEvent<HTMLTextAreaElement>) => {
      const target = event.target as HTMLTextAreaElement;
      detectVariableTrigger(value.الموجهالنظامي, target.selectionStart || 0);
    },
    [detectVariableTrigger, value.الموجهالنظامي]
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
    async (mode: وضعالتوليد) => {
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
              content: "أنت خبير بناء شخصيات وكلاء ذكاء اصطناعي. اكتب Prompt System عربي احترافي، منظم، واضح، ومناسب لبيئة SaaS مؤسسية.",
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
        const backup =
          mode === "generate"
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
      update({ قواعدالسلوك: value.قواعدالسلوك.filter((_, i) => i !== index) });
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
        if (!الامتداداتالمسموحة.includes(ext as (typeof الامتداداتالمسموحة)[number])) {
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

    if (value.روابطالمعرفة.some((item) => item.url === raw)) {
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
      update({ روابطالمعرفة: value.روابطالمعرفة.filter((item) => item.id !== id) });
    },
    [update, value.روابطالمعرفة]
  );

  const fetchUrl = useCallback(
    async (entry: رابطمحرر) => {
      setFetchingUrlId(entry.id);
      update({
        روابطالمعرفة: value.روابطالمعرفة.map((item) => (item.id === entry.id ? { ...item, status: "جارٍ الجلب" } : item)),
      });

      try {
        const response = await fetch(entry.url, { method: "GET" });
        const raw = await response.text();
        const content = sanitizeInput(stripHtml(raw)).slice(0, 250000);

        update({
          روابطالمعرفة: value.روابطالمعرفة.map((item) =>
            item.id === entry.id
              ? {
                  ...item,
                  words: عددالكلمات(content),
                  tokens: تقديرالرموز(content),
                  status: "جاهز",
                  updatedAt: new Date().toISOString(),
                }
              : item
          ),
        });
      } catch {
        update({
          روابطالمعرفة: value.روابطالمعرفة.map((item) =>
            item.id === entry.id ? { ...item, status: "فشل", updatedAt: new Date().toISOString() } : item
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
      update({ ملفاتالمعرفة: value.ملفاتالمعرفة.filter((item) => item.id !== id) });
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

    const botMessage: رسالةمعاينة = {
      id: `${Date.now()}_a`,
      role: "الوكيل",
      text: بناءرسالةوكيل(clean, value),
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

  return {
    promptRef,
    fullscreen,
    setFullscreen,
    variableOpen,
    ruleInput,
    setRuleInput,
    urlInput,
    setUrlInput,
    fileBusy,
    dragOver,
    setDragOver,
    fetchingUrlId,
    previewInput,
    setPreviewInput,
    previewMessages,
    generating,
    improving,
    tokenEstimate,
    promptValidation,
    promptSegments,
    suggestions,
    update,
    updatePersona,
    applyFormat,
    handlePromptChange,
    handlePromptCursorChange,
    chooseVariable,
    generatePrompt,
    addRule,
    removeRule,
    onUploadFiles,
    onDropFiles,
    addUrl,
    removeUrl,
    fetchUrl,
    removeFile,
    stats,
    sendPreview,
    clearPreview,
  };
};

export default useAgentPersonalityEditor;
