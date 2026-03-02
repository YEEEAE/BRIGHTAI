import { useEffect, useState } from "react";
import i18n, { setDocumentDirection } from "../../i18n";
import { trackSettingsChanged } from "../../lib/analytics";

const STORAGE_KEY = "brightai_preferences";

const PreferencesSettings = () => {
  const [language, setLanguage] = useState("ar");
  const [timezone, setTimezone] = useState("Asia/Riyadh");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored) as Record<string, string>;
      setLanguage(data.language || "ar");
      setTimezone(data.timezone || "Asia/Riyadh");
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ language, timezone })
      );
      i18n.changeLanguage(language === "ar" ? "ar" : "en");
      setDocumentDirection(language === "ar" ? "ar" : "en");
      trackSettingsChanged("التفضيلات");
      setMessage("تم حفظ التفضيلات تلقائياً.");
    }, 600);
    return () => window.clearTimeout(timer);
  }, [language, timezone]);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-2">
        <label className="text-sm font-semibold text-slate-200">اللغة</label>
        <select
          value={language}
          onChange={(event) => setLanguage(event.target.value)}
          className="rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-sm text-slate-100"
        >
          <option value="ar">العربية</option>
          <option value="en">الإنجليزية</option>
        </select>
      </div>
      <div className="grid gap-2">
        <label className="text-sm font-semibold text-slate-200">المنطقة الزمنية</label>
        <select
          value={timezone}
          onChange={(event) => setTimezone(event.target.value)}
          className="rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-sm text-slate-100"
        >
          <option value="Asia/Riyadh">الرياض</option>
          <option value="Asia/Dubai">دبي</option>
          <option value="Europe/London">لندن</option>
        </select>
      </div>
      {message ? <div className="text-xs text-emerald-300">{message}</div> : null}
    </div>
  );
};

export default PreferencesSettings;
