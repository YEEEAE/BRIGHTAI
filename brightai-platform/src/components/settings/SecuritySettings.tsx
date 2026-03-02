import { useState, type FormEvent } from "react";
import supabase from "../../lib/supabase";
import { trackSettingsChanged } from "../../lib/analytics";
import {
  getAgentDeleteSettings,
  saveAgentDeleteSettings,
} from "../../lib/agent-delete-settings";

const SecuritySettings = () => {
  const initialDeleteSettings = getAgentDeleteSettings();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [تأكيدمزدوج, setتأكيدمزدوج] = useState(initialDeleteSettings.تأكيدمزدوج);
  const [تأكيدبالاسم, setتأكيدبالاسم] = useState(initialDeleteSettings.تأكيدبالاسم);
  const [منعتلقائيعندوجودتنفيذات, setمنعتلقائيعندوجودتنفيذات] = useState(
    initialDeleteSettings.منعتلقائيعندوجودتنفيذات
  );

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
    trackSettingsChanged("الأمان");
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

      <div className="mt-2 rounded-xl border border-slate-800 bg-slate-950/50 p-4">
        <h3 className="text-sm font-bold text-slate-100">إعدادات حذف الوكلاء</h3>
        <p className="mt-1 text-xs text-slate-400">
          هذه الإعدادات تطبق على الحذف من لوحة التحكم وصفحة تفاصيل الوكيل.
        </p>

        <div className="mt-3 grid gap-2 text-sm">
          <label className="inline-flex items-center gap-2 text-slate-200">
            <input
              type="checkbox"
              checked={تأكيدمزدوج}
              onChange={(event) => setتأكيدمزدوج(event.target.checked)}
            />
            تفعيل تأكيد مزدوج قبل الحذف
          </label>
          <label className="inline-flex items-center gap-2 text-slate-200">
            <input
              type="checkbox"
              checked={تأكيدبالاسم}
              onChange={(event) => setتأكيدبالاسم(event.target.checked)}
            />
            إلزام كتابة اسم الوكيل قبل الحذف
          </label>
          <label className="inline-flex items-center gap-2 text-slate-200">
            <input
              type="checkbox"
              checked={منعتلقائيعندوجودتنفيذات}
              onChange={(event) => setمنعتلقائيعندوجودتنفيذات(event.target.checked)}
            />
            منع حذف الوكيل إذا كان لديه تنفيذات
          </label>
        </div>

        <button
          type="button"
          onClick={() => {
            saveAgentDeleteSettings({
              تأكيدمزدوج,
              تأكيدبالاسم,
              منعتلقائيعندوجودتنفيذات,
            });
            trackSettingsChanged("إعدادات حذف الوكلاء");
            setMessage("تم حفظ إعدادات حذف الوكلاء.");
          }}
          className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-200 hover:bg-emerald-500/20"
        >
          حفظ إعدادات الحذف
        </button>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-3 text-xs text-slate-400">
        سيتم تسجيل خروج الجلسات القديمة تلقائياً بعد التحديث.
      </div>
    </form>
  );
};

export default SecuritySettings;
