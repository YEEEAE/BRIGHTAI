import { useEffect, useState } from "react";

const STORAGE_KEY = "brightai_notifications";

const NotificationsSettings = () => {
  const [emailReports, setEmailReports] = useState(true);
  const [executionAlerts, setExecutionAlerts] = useState(true);
  const [weeklySummary, setWeeklySummary] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored) as Record<string, boolean>;
      setEmailReports(Boolean(data.emailReports));
      setExecutionAlerts(Boolean(data.executionAlerts));
      setWeeklySummary(Boolean(data.weeklySummary));
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ emailReports, executionAlerts, weeklySummary })
      );
      setMessage("تم حفظ التفضيلات تلقائياً.");
    }, 600);
    return () => window.clearTimeout(timer);
  }, [emailReports, executionAlerts, weeklySummary]);

  return (
    <div className="flex flex-col gap-4">
      <label className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-3 text-sm text-slate-200">
        تقارير البريد الإلكتروني
        <input
          type="checkbox"
          checked={emailReports}
          onChange={(event) => setEmailReports(event.target.checked)}
          className="h-4 w-4 rounded border-slate-700 bg-slate-950/60 text-emerald-400"
        />
      </label>
      <label className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-3 text-sm text-slate-200">
        تنبيهات التنفيذ الفورية
        <input
          type="checkbox"
          checked={executionAlerts}
          onChange={(event) => setExecutionAlerts(event.target.checked)}
          className="h-4 w-4 rounded border-slate-700 bg-slate-950/60 text-emerald-400"
        />
      </label>
      <label className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-3 text-sm text-slate-200">
        ملخص أسبوعي
        <input
          type="checkbox"
          checked={weeklySummary}
          onChange={(event) => setWeeklySummary(event.target.checked)}
          className="h-4 w-4 rounded border-slate-700 bg-slate-950/60 text-emerald-400"
        />
      </label>
      {message ? (
        <div className="text-xs text-emerald-300">{message}</div>
      ) : null}
    </div>
  );
};

export default NotificationsSettings;
