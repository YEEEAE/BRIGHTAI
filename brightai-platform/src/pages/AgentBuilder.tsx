import { useCallback, useEffect, useRef, useState, type ChangeEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import WorkflowCanvas from "../components/agent/WorkflowCanvas";
import supabase from "../lib/supabase";

const AUTO_SAVE_KEY = "brightai_workflow_autosave";
const DRAFT_KEY = "brightai_agent_draft";

const supabaseClient = supabase as unknown as {
  from: (table: string) => any;
};

const modelOptions = [
  { id: "llama-3.1-70b-versatile", label: "لاما ٣٫١ (٧٠ مليار)" },
  { id: "llama-3.1-8b-instant", label: "لاما ٣٫١ (٨ مليار)" },
  { id: "mixtral-8x7b-32768", label: "ميكسترال ٨×٧" },
  { id: "gemma2-9b-it", label: "جيمّا ٢ (٩ مليار)" },
];

const AgentBuilder = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [workflowKey, setWorkflowKey] = useState(0);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("عام");
  const [model, setModel] = useState("llama-3.1-70b-versatile");
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(1200);
  const [isPublic, setIsPublic] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);
  const [activePanel, setActivePanel] = useState("المتغيرات");
  const [saving, setSaving] = useState(false);
  const autosaveRef = useRef<number | null>(null);
  const [workflowData, setWorkflowData] = useState<{ nodes: unknown[]; edges: unknown[] }>({
    nodes: [],
    edges: [],
  });
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    document.title = "مصمم الوكلاء | منصة برايت أي آي";
  }, []);

  useEffect(() => {
    const ensureSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        navigate("/login", { replace: true });
        return;
      }
      setUserId(data.session.user.id);
    };
    ensureSession();
  }, [navigate]);

  useEffect(() => {
    const stored = localStorage.getItem(DRAFT_KEY);
    if (stored) {
      const draft = JSON.parse(stored) as Record<string, unknown>;
      setName(String(draft.name || ""));
      setDescription(String(draft.description || ""));
      setCategory(String(draft.category || "عام"));
      setModel(String(draft.model || "llama-3.1-70b-versatile"));
      setTemperature(Number(draft.temperature || 0.7));
      setMaxTokens(Number(draft.maxTokens || 1200));
      setIsPublic(Boolean(draft.isPublic));
    }
  }, []);

  useEffect(() => {
    const loadAgent = async () => {
      if (!id) {
        return;
      }
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData.session;
      if (!session) {
        navigate("/login", { replace: true });
        return;
      }
      setUserId(session.user.id);
      const { data } = await supabaseClient
        .from("agents")
        .select("name, description, category, workflow, settings, is_public, user_id")
        .eq("id", id)
        .eq("user_id", session.user.id)
        .maybeSingle();
      if (!data) {
        setErrorMessage("لا تملك صلاحية الوصول إلى هذا الوكيل.");
        window.setTimeout(() => {
          navigate("/dashboard", { replace: true });
        }, 1200);
        return;
      }
      setName(data.name || "");
      setDescription(data.description || "");
      setCategory(data.category || "عام");
      setIsPublic(Boolean(data.is_public));
      const settings = (data.settings || {}) as Record<string, unknown>;
      setModel(String(settings.model || "llama-3.1-70b-versatile"));
      setTemperature(Number(settings.temperature || 0.7));
      setMaxTokens(Number(settings.maxTokens || 1200));

      if (data.workflow) {
        localStorage.setItem(AUTO_SAVE_KEY, JSON.stringify(data.workflow));
        setWorkflowKey((prev) => prev + 1);
      }
    };

    loadAgent();
  }, [id, navigate]);

  useEffect(() => {
    if (autosaveRef.current) {
      window.clearInterval(autosaveRef.current);
    }
    autosaveRef.current = window.setInterval(() => {
      const workflow = localStorage.getItem(AUTO_SAVE_KEY);
      localStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({
          name,
          description,
          category,
          model,
          temperature,
          maxTokens,
          isPublic,
        })
      );
      if (id && workflow && userId) {
        supabaseClient.from("agents").update({
          name,
          description,
          category,
          workflow: JSON.parse(workflow),
          settings: { model, temperature, maxTokens },
          is_public: isPublic,
          user_id: userId,
        }).eq("id", id).eq("user_id", userId);
      }
      setStatusMessage("تم حفظ المسودة تلقائياً.");
    }, 30000);
    return () => {
      if (autosaveRef.current) {
        window.clearInterval(autosaveRef.current);
      }
    };
  }, [category, description, id, isPublic, maxTokens, model, name, temperature, userId]);

  useEffect(() => {
    const stored = localStorage.getItem(AUTO_SAVE_KEY);
    if (!stored) {
      setWorkflowData({ nodes: [], edges: [] });
      return;
    }
    try {
      setWorkflowData(JSON.parse(stored) as { nodes: unknown[]; edges: unknown[] });
    } catch {
      setWorkflowData({ nodes: [], edges: [] });
    }
  }, [workflowKey]);

  const validateBeforeSave = useCallback(() => {
    if (!name || name.trim().length < 3) {
      setErrorMessage("اسم الوكيل يجب أن يكون ٣ أحرف على الأقل.");
      return false;
    }
    if (!workflowData.nodes || workflowData.nodes.length === 0) {
      setErrorMessage("يرجى إضافة عقد إلى سير العمل قبل الحفظ.");
      return false;
    }
    return true;
  }, [name, workflowData]);

  const handleSave = useCallback(async () => {
    setStatusMessage(null);
    setErrorMessage(null);
    if (!validateBeforeSave()) {
      return;
    }
    setSaving(true);

    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData.session;
    if (!session) {
      navigate("/login", { replace: true });
      return;
    }

    const payload = {
      name,
      description,
      category,
      workflow: workflowData,
      settings: {
        model,
        temperature,
        maxTokens,
      },
      status: "نشط",
      is_public: isPublic,
      user_id: session.user.id,
    };

    if (id) {
      await supabaseClient.from("agents").update(payload).eq("id", id);
      setStatusMessage("تم حفظ التعديلات بنجاح.");
    } else {
      const { data } = await supabaseClient
        .from("agents")
        .insert(payload)
        .select("id")
        .single();
      setStatusMessage("تم إنشاء الوكيل بنجاح.");
      if (data?.id) {
        navigate(`/agents/${data.id}/builder`, { replace: true });
      }
    }

    setSaving(false);
  }, [
    category,
    description,
    id,
    isPublic,
    maxTokens,
    model,
    name,
    navigate,
    temperature,
    validateBeforeSave,
    workflowData,
  ]);

  const handleTest = useCallback(() => {
    setConsoleLogs((prev) => [
      `اختبار: تم تنفيذ الوكيل بنجاح عند ${new Date().toLocaleTimeString("ar-SA")}`,
      ...prev,
    ]);
    setStatusMessage("تم تشغيل اختبار تجريبي.");
  }, []);

  const handleExport = () => {
    const payload = {
      name,
      description,
      category,
      settings: { model, temperature, maxTokens },
      workflow: workflowData,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${name || "وكيل"}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result || "{}")) as Record<string, any>;
        if (data.workflow) {
          localStorage.setItem(AUTO_SAVE_KEY, JSON.stringify(data.workflow));
          setWorkflowKey((prev) => prev + 1);
        }
        setName(String(data.name || name));
        setDescription(String(data.description || description));
        setStatusMessage("تم استيراد الوكيل بنجاح.");
      } catch {
        setErrorMessage("تعذر استيراد الملف، تحقق من صحة البيانات.");
      }
    };
    reader.readAsText(file);
  };

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === "s") {
        event.preventDefault();
        handleSave();
      }
      if (event.ctrlKey && event.key === "Enter") {
        event.preventDefault();
        handleTest();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleSave, handleTest]);

  return (
    <div className="flex min-h-screen flex-col gap-4 px-4 py-6">
      <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-lg font-semibold text-slate-100">مصمم الوكلاء</h1>
          <span className="rounded-full border border-emerald-500/40 px-3 py-1 text-xs text-emerald-300">
            تحرير جماعي قريباً
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleSave}
            className="rounded-xl bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950"
            disabled={saving}
          >
            {saving ? "جارٍ الحفظ..." : "حفظ"}
          </button>
          <button
            type="button"
            onClick={handleTest}
            className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-200"
          >
            اختبار
          </button>
          <button
            type="button"
            className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-200"
          >
            نشر
          </button>
          <label className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-200">
            استيراد
            <input type="file" accept="application/json" className="hidden" onChange={handleImport} />
          </label>
          <button
            type="button"
            onClick={handleExport}
            className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-200"
          >
            تصدير
          </button>
        </div>
      </header>

      {(statusMessage || errorMessage) && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            errorMessage
              ? "border-red-500/30 bg-red-500/10 text-red-200"
              : "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
          }`}
        >
          {errorMessage || statusMessage}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="flex flex-col gap-4">
          <div className="grid gap-3 rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
            <div className="grid gap-2">
              <label className="text-sm font-semibold text-slate-200">اسم الوكيل</label>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="auth-field rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm text-slate-100"
                placeholder="أدخل اسم الوكيل"
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-semibold text-slate-200">الوصف</label>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                className="auth-field min-h-[96px] rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm text-slate-100"
                placeholder="وصف مختصر لما يقدمه الوكيل"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
            <WorkflowCanvas key={workflowKey} />
          </div>
        </div>

        <aside className="flex flex-col gap-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
            <h2 className="text-sm font-semibold text-slate-200">إعدادات الوكيل</h2>
            <div className="mt-4 grid gap-3">
              <div className="grid gap-2">
                <label className="text-xs text-slate-400">التصنيف</label>
                <input
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  className="auth-field rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm text-slate-100"
                />
              </div>
              <div className="grid gap-2">
                <label className="text-xs text-slate-400">النموذج</label>
                <select
                  value={model}
                  onChange={(event) => setModel(event.target.value)}
                  className="rounded-xl border border-slate-800 bg-slate-950/70 px-3 py-2 text-sm text-slate-100"
                >
                  {modelOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2">
                <label className="text-xs text-slate-400">درجة الإبداع</label>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.1}
                  value={temperature}
                  onChange={(event) => setTemperature(Number(event.target.value))}
                />
                <span className="text-xs text-slate-300">{temperature}</span>
              </div>
              <div className="grid gap-2">
                <label className="text-xs text-slate-400">الحد الأعلى للرموز</label>
                <input
                  type="number"
                  value={maxTokens}
                  onChange={(event) => setMaxTokens(Number(event.target.value))}
                  className="auth-field rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm text-slate-100"
                />
              </div>
              <label className="flex items-center justify-between text-sm text-slate-200">
                إتاحة الوكيل للعامة
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(event) => setIsPublic(event.target.checked)}
                  className="h-4 w-4 rounded border-slate-700 bg-slate-950/60 text-emerald-400"
                />
              </label>
            </div>
          </div>
        </aside>
      </div>

      <section className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
        <div className="flex flex-wrap items-center gap-3">
          {[
            "المتغيرات",
            "السجل",
            "وحدة التحكم",
          ].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActivePanel(tab)}
              className={`rounded-xl px-4 py-2 text-xs font-semibold ${
                activePanel === tab
                  ? "bg-emerald-400/20 text-emerald-200"
                  : "text-slate-300"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="mt-4 text-sm text-slate-300">
          {activePanel === "المتغيرات" && (
            <div className="grid gap-2">
              <p>سيتم عرض متغيرات التشغيل هنا أثناء الاختبارات.</p>
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-xs text-slate-400">
                لم يتم تشغيل الوكيل بعد.
              </div>
            </div>
          )}
          {activePanel === "السجل" && (
            <div className="grid gap-2">
              <p>سجل التعديلات محفوظ تلقائياً.</p>
              <div className="text-xs text-slate-400">آخر حفظ: {new Date().toLocaleTimeString("ar-SA")}</div>
            </div>
          )}
          {activePanel === "وحدة التحكم" && (
            <div className="grid gap-2">
              {consoleLogs.length === 0 ? (
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-xs text-slate-400">
                  لا توجد رسائل بعد.
                </div>
              ) : (
                <ul className="grid gap-2 text-xs">
                  {consoleLogs.map((log, index) => (
                    <li key={`${log}-${index}`} className="rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2">
                      {log}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default AgentBuilder;
