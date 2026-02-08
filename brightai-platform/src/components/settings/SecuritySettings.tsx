import { useState, type FormEvent } from "react";
import supabase from "../../lib/supabase";

const SecuritySettings = () => {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleUpdate = async (event: FormEvent) => {
    event.preventDefault();
    setErrorMessage(null);
    setMessage(null);

    if (password.length < 8) {
      setErrorMessage("كلمة المرور يجب أن تكون ٨ أحرف على الأقل.");
      return;
    }
    if (password !== confirm) {
      setErrorMessage("كلمتا المرور غير متطابقتين.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setErrorMessage("تعذر تحديث كلمة المرور حالياً.");
      setLoading(false);
      return;
    }
    setMessage("تم تحديث كلمة المرور بنجاح.");
    setPassword("");
    setConfirm("");
    setLoading(false);
  };

  return (
    <form className="flex flex-col gap-4" onSubmit={handleUpdate}>
      <div className="grid gap-2">
        <label className="text-sm font-semibold text-slate-200">كلمة المرور الجديدة</label>
        <input
          type="password"
          className="auth-field rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm text-slate-100"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="أدخل كلمة المرور الجديدة"
        />
      </div>
      <div className="grid gap-2">
        <label className="text-sm font-semibold text-slate-200">تأكيد كلمة المرور</label>
        <input
          type="password"
          className="auth-field rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm text-slate-100"
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
          placeholder="أعد إدخال كلمة المرور"
        />
      </div>
      {errorMessage ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {errorMessage}
        </div>
      ) : null}
      {message ? (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {message}
        </div>
      ) : null}
      <button
        type="submit"
        className="rounded-xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-slate-950 hover:bg-emerald-300 disabled:opacity-60"
        disabled={loading}
      >
        {loading ? "جارٍ الحفظ..." : "تحديث كلمة المرور"}
      </button>
      <div className="rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-3 text-xs text-slate-400">
        سيتم تسجيل خروج الجلسات القديمة تلقائياً بعد التحديث.
      </div>
    </form>
  );
};

export default SecuritySettings;
