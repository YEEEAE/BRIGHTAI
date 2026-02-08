import { useCallback, useEffect, useMemo, useState } from "react";
import supabase from "../lib/supabase";
import { trackTemplateUsed } from "../lib/analytics";

const supabaseClient = supabase as unknown as {
  from: (table: string) => any;
  channel: (name: string) => any;
  removeChannel: (channel: unknown) => void;
};

type TemplateRow = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  workflow: Record<string, unknown> | null;
  settings: Record<string, unknown> | null;
  preview_image_url: string | null;
  author_id: string | null;
  downloads: number;
  rating: number | null;
  is_featured: boolean;
  created_at: string;
};

const sortOptions = ["الأكثر استخداماً", "الأحدث", "الأعلى تقييماً"];

const Templates = () => {
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<TemplateRow[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("الكل");
  const [sortKey, setSortKey] = useState(sortOptions[0]);
  const [preview, setPreview] = useState<TemplateRow | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    document.title = "القوالب | منصة برايت أي آي";
  }, []);

  const loadTemplates = useCallback(async () => {
    setLoading(true);
    const { data } = await supabaseClient
      .from("templates")
      .select("*")
      .order("created_at", { ascending: false });
    setTemplates((data || []) as TemplateRow[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    let channel: any;
    let active = true;
    const init = async () => {
      await loadTemplates();
      if (!active) {
        return;
      }
      channel = supabaseClient
        .channel("templates-updates")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "templates" },
          () => {
            loadTemplates();
          }
        )
        .subscribe();
    };
    init();
    return () => {
      active = false;
      if (channel) {
        supabaseClient.removeChannel(channel);
      }
    };
  }, [loadTemplates]);

  const categories = useMemo(() => {
    const values = new Set<string>();
    templates.forEach((template) => {
      if (template.category) {
        values.add(template.category);
      }
    });
    return ["الكل", ...Array.from(values)];
  }, [templates]);

  const filteredTemplates = useMemo(() => {
    return templates
      .filter((template) => (category === "الكل" ? true : template.category === category))
      .filter((template) => {
        if (!search) {
          return true;
        }
        const query = search.toLowerCase();
        return (
          template.name.toLowerCase().includes(query) ||
          template.description?.toLowerCase().includes(query)
        );
      })
      .sort((a, b) => {
        if (sortKey === "الأحدث") {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
        if (sortKey === "الأعلى تقييماً") {
          return (b.rating || 0) - (a.rating || 0);
        }
        return b.downloads - a.downloads;
      });
  }, [category, search, sortKey, templates]);

  const featuredTemplates = filteredTemplates.filter((template) => template.is_featured);
  const normalTemplates = filteredTemplates.filter((template) => !template.is_featured);

  const handleUseTemplate = async (template: TemplateRow) => {
    setMessage(null);
    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData.session;
    if (!session) {
      setMessage("يرجى تسجيل الدخول لاستخدام القالب.");
      return;
    }
    await supabaseClient.from("agents").insert({
      name: template.name,
      description: template.description,
      category: template.category,
      workflow: template.workflow,
      settings: template.settings,
      status: "نشط",
      is_public: false,
      user_id: session.user.id,
    });
    await supabaseClient
      .from("templates")
      .update({ downloads: template.downloads + 1 })
      .eq("id", template.id);
    trackTemplateUsed(template.id, template.category || undefined);
    setMessage("تم نسخ القالب إلى الوكلاء الخاصة بك.");
  };

  const handleRate = async (template: TemplateRow, rating: number) => {
    await supabaseClient
      .from("templates")
      .update({ rating })
      .eq("id", template.id);
    setTemplates((prev) =>
      prev.map((item) => (item.id === template.id ? { ...item, rating } : item))
    );
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">سوق القوالب</h1>
          <p className="mt-1 text-sm text-slate-400">استخدم قوالب جاهزة لتسريع بناء الوكلاء.</p>
        </div>
        <div className="grid w-full gap-2 sm:w-auto sm:grid-cols-[1fr_auto_auto] sm:items-center">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="ابحث عن قالب"
            className="auth-field w-full rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-2 text-base text-slate-100 sm:w-56 sm:text-sm"
          />
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="w-full rounded-xl border border-slate-800 bg-slate-950/70 px-3 py-2 text-base text-slate-200 sm:w-auto sm:text-sm"
          >
            {categories.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
          <select
            value={sortKey}
            onChange={(event) => setSortKey(event.target.value)}
            className="w-full rounded-xl border border-slate-800 bg-slate-950/70 px-3 py-2 text-base text-slate-200 sm:w-auto sm:text-sm"
          >
            {sortOptions.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </div>
      </header>

      {message ? (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {message}
        </div>
      ) : null}

      <section className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
        <h2 className="text-sm font-semibold text-slate-200">القوالب المميزة</h2>
        {loading ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={`featured-${index}`} className="h-40 animate-pulse rounded-xl bg-slate-800" />
            ))}
          </div>
        ) : featuredTemplates.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-slate-700 p-4 text-sm text-slate-400">
            لا توجد قوالب مميزة حالياً.
          </div>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {featuredTemplates.map((template) => (
              <div key={template.id} className="rounded-xl border border-emerald-400/30 bg-emerald-400/5 p-4">
                <p className="text-sm font-semibold text-slate-100">{template.name}</p>
                <p className="mt-2 text-xs text-slate-400">{template.description || "بدون وصف"}</p>
                <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                  <span>التنزيلات: {template.downloads}</span>
                  <span>التقييم: {template.rating || 0}</span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setPreview(template)}
                    className="rounded-lg border border-slate-700 px-3 py-1 text-xs text-slate-200"
                  >
                    معاينة
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUseTemplate(template)}
                    className="rounded-lg bg-emerald-400 px-3 py-1 text-xs font-semibold text-slate-950"
                  >
                    استخدام القالب
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
        <h2 className="text-sm font-semibold text-slate-200">جميع القوالب</h2>
        {loading ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={`template-${index}`} className="h-40 animate-pulse rounded-xl bg-slate-800" />
            ))}
          </div>
        ) : normalTemplates.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-slate-700 p-4 text-sm text-slate-400">
            لا توجد قوالب مطابقة للبحث.
          </div>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {normalTemplates.map((template) => (
              <div key={template.id} className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                <p className="text-sm font-semibold text-slate-100">{template.name}</p>
                <p className="mt-2 text-xs text-slate-400">{template.description || "بدون وصف"}</p>
                <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                  <span>التنزيلات: {template.downloads}</span>
                  <span>التقييم: {template.rating || 0}</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setPreview(template)}
                    className="rounded-lg border border-slate-700 px-3 py-1 text-xs text-slate-200"
                  >
                    معاينة
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUseTemplate(template)}
                    className="rounded-lg bg-emerald-400 px-3 py-1 text-xs font-semibold text-slate-950"
                  >
                    استخدام القالب
                  </button>
                </div>
                <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
                  <span>قيّم القالب:</span>
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={`${template.id}-${value}`}
                      type="button"
                      onClick={() => handleRate(template, value)}
                      className="rounded-lg border border-slate-700 px-2 py-1 text-xs text-slate-200"
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {preview ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-950 p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-100">{preview.name}</h3>
              <button
                type="button"
                onClick={() => setPreview(null)}
                className="text-sm text-slate-400"
              >
                إغلاق
              </button>
            </div>
            <p className="mt-2 text-sm text-slate-400">
              {preview.description || "بدون وصف"}
            </p>
            <div className="mt-4 max-h-72 overflow-auto rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-xs text-slate-400">
              <pre className="whitespace-pre-wrap">
                {JSON.stringify(preview.workflow || {}, null, 2)}
              </pre>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => handleUseTemplate(preview)}
                className="rounded-lg bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950"
              >
                استخدام القالب
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default Templates;
