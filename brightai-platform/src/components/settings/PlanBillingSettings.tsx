import { useEffect, useState } from "react";
import supabase from "../../lib/supabase";

const supabaseClient = supabase as unknown as {
  from: (table: string) => any;
};

const planOptions = [
  { id: "starter", label: "أساسي", price: "٢٩٩ ر.س" },
  { id: "growth", label: "احترافي", price: "٧٩٩ ر.س" },
  { id: "enterprise", label: "مؤسسي", price: "حسب الطلب" },
];

const PlanBillingSettings = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [plan, setPlan] = useState("starter");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        return;
      }
      setUserId(data.user.id);
      const { data: profile } = await supabaseClient
        .from("profiles")
        .select("plan")
        .eq("id", data.user.id)
        .maybeSingle();
      setPlan(profile?.plan || "starter");
    };
    load();
  }, []);

  const handleSelect = async (value: string) => {
    if (!userId) {
      return;
    }
    setPlan(value);
    setSaving(true);
    await supabaseClient.from("profiles").upsert({
      id: userId,
      plan: value,
      updated_at: new Date().toISOString(),
    });
    setSaving(false);
    setMessage("تم تحديث الخطة بنجاح.");
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 md:grid-cols-3">
        {planOptions.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => handleSelect(option.id)}
            className={`flex flex-col gap-2 rounded-2xl border px-4 py-4 text-right transition ${
              plan === option.id
                ? "border-emerald-400 bg-emerald-400/10"
                : "border-slate-800 bg-slate-950/50"
            }`}
          >
            <span className="text-sm font-semibold text-slate-100">
              {option.label}
            </span>
            <span className="text-xs text-slate-400">{option.price}</span>
          </button>
        ))}
      </div>
      <div className="text-xs text-slate-400">
        {saving ? "جارٍ حفظ التغييرات..." : "يمكنك تغيير الخطة في أي وقت."}
      </div>
      {message ? (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {message}
        </div>
      ) : null}
    </div>
  );
};

export default PlanBillingSettings;
