import { useEffect, useMemo, useState, type FormEvent } from "react";
import supabase from "../../lib/supabase";
import ApiKeyService, { ApiKey, ApiProvider } from "../../services/apikey.service";

const supabaseClient = supabase as unknown as {
  from: (table: string) => any;
};

const providerLabels: Record<ApiProvider, string> = {
  groq: "غروك",
  openai: "أوبن أي آي",
  anthropic: "كلود",
  google: "جيميني",
  custom: "مزود مخصص",
};

const ApiKeysSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [provider, setProvider] = useState<ApiProvider>("groq");
  const [name, setName] = useState("");
  const [keyValue, setKeyValue] = useState("");
  const [userId, setUserId] = useState<string | null>(null);

  const providerOptions = useMemo(() => Object.entries(providerLabels), []);

  const loadKeys = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const data = await ApiKeyService.listApiKeys();
      setKeys(data);
    } catch {
      setErrorMessage("تعذر تحميل المفاتيح حالياً.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    const init = async () => {
      const { data } = await supabase.auth.getUser();
      if (active) {
        setUserId(data.user?.id || null);
      }
      await loadKeys();
    };
    init();
    return () => {
      active = false;
    };
  }, []);

  const handleAdd = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setStatusMessage(null);
    setErrorMessage(null);

    try {
      await ApiKeyService.saveApiKey(provider, keyValue, name || undefined);
      setStatusMessage("تم حفظ المفتاح بنجاح.");
      setName("");
      setKeyValue("");
      await loadKeys();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "تعذر حفظ المفتاح."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("هل تريد حذف هذا المفتاح؟")) {
      return;
    }
    setSaving(true);
    try {
      await ApiKeyService.deleteApiKey(id);
      await loadKeys();
    } catch {
      setErrorMessage("تعذر حذف المفتاح.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (id: string, active: boolean) => {
    setSaving(true);
    await supabaseClient
      .from("api_keys")
      .update({ is_active: active })
      .eq("id", id);
    await loadKeys();
    setSaving(false);
  };

  const handleSetDefault = (id: string, providerValue: ApiProvider) => {
    if (!userId) {
      return;
    }
    const storageKey = `brightai_apikey:default:${userId}`;
    const stored = localStorage.getItem(storageKey);
    const defaults = stored ? (JSON.parse(stored) as Record<string, string>) : {};
    defaults[providerValue] = id;
    localStorage.setItem(storageKey, JSON.stringify(defaults));
    setStatusMessage("تم تعيين المفتاح الافتراضي.");
    setKeys((prev) =>
      prev.map((item) => ({
        ...item,
        is_default: item.id === id && item.provider === providerValue,
      }))
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <form className="grid gap-4" onSubmit={handleAdd}>
        <div className="grid gap-2">
          <label className="text-sm font-semibold text-slate-200">المزود</label>
          <select
            value={provider}
            onChange={(event) => setProvider(event.target.value as ApiProvider)}
            className="rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-sm text-slate-100"
          >
            {providerOptions.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-semibold text-slate-200">اسم المفتاح</label>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="auth-field rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm text-slate-100"
            placeholder="مثال: مفتاح الفريق"
          />
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-semibold text-slate-200">المفتاح السري</label>
          <input
            value={keyValue}
            onChange={(event) => setKeyValue(event.target.value)}
            className="auth-field rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm text-slate-100"
            placeholder="أدخل المفتاح"
            type="password"
          />
          <p className="text-xs text-slate-400">لن يتم عرض المفتاح بعد الحفظ.</p>
        </div>
        <button
          type="submit"
          className="rounded-xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-slate-950 hover:bg-emerald-300 disabled:opacity-60"
          disabled={saving || !keyValue}
        >
          {saving ? "جارٍ الحفظ..." : "حفظ المفتاح"}
        </button>
        {statusMessage ? (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            {statusMessage}
          </div>
        ) : null}
        {errorMessage ? (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {errorMessage}
          </div>
        ) : null}
      </form>

      <div className="grid gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-200">المفاتيح المحفوظة</h3>
          <span className="text-xs text-slate-400">
            {loading ? "جارٍ التحميل..." : `${keys.length} مفتاح`}
          </span>
        </div>
        {loading ? (
          <div className="grid gap-3">
            <div className="h-14 animate-pulse rounded-xl bg-slate-800" />
            <div className="h-14 animate-pulse rounded-xl bg-slate-800" />
          </div>
        ) : keys.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-700 p-4 text-sm text-slate-400">
            لا توجد مفاتيح محفوظة حتى الآن.
          </div>
        ) : (
          <div className="grid gap-3">
            {keys.map((item) => (
              <div
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-200">
                    {item.name || "مفتاح بدون اسم"}
                  </p>
                  <p className="text-xs text-slate-400">
                    {providerLabels[item.provider]} · {item.is_active ? "مفعل" : "موقوف"}
                    {item.is_default ? " · افتراضي" : ""}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleActive(item.id, !item.is_active)}
                    className="rounded-lg border border-slate-700 px-3 py-1 text-xs text-slate-200 hover:border-emerald-400"
                  >
                    {item.is_active ? "إيقاف" : "تفعيل"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetDefault(item.id, item.provider)}
                    className="rounded-lg border border-slate-700 px-3 py-1 text-xs text-slate-200 hover:border-emerald-400"
                  >
                    تعيين افتراضي
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    className="rounded-lg border border-red-500/40 px-3 py-1 text-xs text-red-200 hover:border-red-400"
                  >
                    حذف
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ApiKeysSettings;
