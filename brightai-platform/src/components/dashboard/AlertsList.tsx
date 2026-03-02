import { memo } from "react";
import { AlertTriangle, FileWarning, Sparkles, X } from "lucide-react";
import type { AlertItem } from "../../types/dashboard.types";

type AlertsListProps = {
  loading: boolean;
  alerts: AlertItem[];
  onDismiss: (id: string) => void;
};

const AlertsList = ({ loading, alerts, onDismiss }: AlertsListProps) => {
  return (
    <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-4 backdrop-blur-xl md:p-5">
      <h2 className="text-lg font-bold text-slate-100">التنبيهات والتوصيات</h2>
      {loading ? (
        <div className="mt-4 grid gap-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={`alert-loading-${index}`} className="h-20 animate-pulse rounded-xl bg-slate-800/60" />
          ))}
        </div>
      ) : alerts.length === 0 ? (
        <p className="mt-4 text-sm text-slate-400">لا توجد تنبيهات حالياً.</p>
      ) : (
        <div className="mt-4 space-y-2">
          {alerts.map((item) => (
            <article
              key={item.id}
              className={`rounded-xl border p-3 ${
                item.type === "خطر"
                  ? "border-rose-500/30 bg-rose-500/10"
                  : item.type === "تحذير"
                  ? "border-amber-500/30 bg-amber-500/10"
                  : "border-sky-500/30 bg-sky-500/10"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2">
                  {item.type === "خطر" ? (
                    <FileWarning className="mt-0.5 h-4 w-4 text-rose-200" />
                  ) : item.type === "تحذير" ? (
                    <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-200" />
                  ) : (
                    <Sparkles className="mt-0.5 h-4 w-4 text-sky-200" />
                  )}
                  <div>
                    <p className="text-xs font-semibold text-slate-100">{item.title}</p>
                    <p className="text-xs text-slate-200/90">{item.description}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onDismiss(item.id)}
                  className="rounded-md p-1 text-slate-300 hover:bg-slate-900/40"
                  aria-label="إخفاء"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default memo(AlertsList);
