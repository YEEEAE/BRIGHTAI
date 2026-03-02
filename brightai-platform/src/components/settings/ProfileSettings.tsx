import { useEffect, useState } from "react";
import supabase from "../../lib/supabase";
import { trackSettingsChanged } from "../../lib/analytics";

const supabaseClient = supabase as unknown as {
  from: (table: string) => any;
};

const ProfileSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [company, setCompany] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  useEffect(() => {
    let active = true;

    const loadProfile = async () => {
      setLoading(true);
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        if (active) {
          setLoading(false);
        }
        return;
      }
      setUserId(data.user.id);
      const { data: profile } = await supabaseClient
        .from("profiles")
        .select("full_name, company, avatar_url")
        .eq("id", data.user.id)
        .maybeSingle();

      if (active) {
        setFullName(profile?.full_name || data.user.user_metadata?.full_name || "");
        setCompany(profile?.company || "");
        setAvatarUrl(profile?.avatar_url || "");
        setLoading(false);
      }
    };

    loadProfile();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!userId || loading) {
      return;
    }

    const timer = window.setTimeout(async () => {
      setSaving(true);
      setStatusMessage(null);
      await supabaseClient.from("profiles").upsert({
        id: userId,
        full_name: fullName || null,
        company: company || null,
        avatar_url: avatarUrl || null,
        updated_at: new Date().toISOString(),
      });
      trackSettingsChanged("الملف الشخصي");
      setSaving(false);
      setStatusMessage("تم حفظ التحديثات تلقائياً.");
    }, 900);

    return () => window.clearTimeout(timer);
  }, [avatarUrl, company, fullName, loading, userId]);

  if (loading) {
    return (
      <div className="grid gap-4">
        <div className="h-10 w-2/3 animate-pulse rounded-xl bg-slate-800" />
        <div className="h-10 w-1/2 animate-pulse rounded-xl bg-slate-800" />
        <div className="h-10 w-full animate-pulse rounded-xl bg-slate-800" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-2">
        <label className="text-sm font-semibold text-slate-200">الاسم الكامل</label>
        <input
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          className="auth-field rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm text-slate-100"
          placeholder="اسمك الكامل"
        />
      </div>
      <div className="grid gap-2">
        <label className="text-sm font-semibold text-slate-200">الشركة</label>
        <input
          value={company}
          onChange={(event) => setCompany(event.target.value)}
          className="auth-field rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm text-slate-100"
          placeholder="اسم الشركة"
        />
      </div>
      <div className="grid gap-2">
        <label className="text-sm font-semibold text-slate-200">رابط الصورة الشخصية</label>
        <input
          value={avatarUrl}
          onChange={(event) => setAvatarUrl(event.target.value)}
          className="auth-field rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm text-slate-100"
          placeholder="https://"
        />
      </div>
      <div className="flex items-center gap-3 text-xs text-slate-400">
        {saving ? "جارٍ الحفظ..." : "الحفظ التلقائي مفعل"}
        {statusMessage ? <span className="text-emerald-300">{statusMessage}</span> : null}
      </div>
    </div>
  );
};

export default ProfileSettings;
