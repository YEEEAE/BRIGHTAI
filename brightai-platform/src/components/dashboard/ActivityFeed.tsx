import { memo } from "react";
import { Activity, Bot, Wrench } from "lucide-react";
import type { ActivityItem } from "../../types/dashboard.types";
import { toRelativeTime } from "../../lib/dashboard.utils";

type ActivityFeedProps = {
  loading: boolean;
  activities: ActivityItem[];
};

const ActivityFeed = ({ loading, activities }: ActivityFeedProps) => {
  return (
    <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-4 backdrop-blur-xl md:p-5">
      <h2 className="text-lg font-bold text-slate-100">النشاط الأخير</h2>
      {loading ? (
        <div className="mt-4 grid gap-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={`activity-loading-${index}`} className="h-10 animate-pulse rounded-lg bg-slate-800/60" />
          ))}
        </div>
      ) : activities.length === 0 ? (
        <p className="mt-4 text-sm text-slate-400">لا يوجد نشاط حديث.</p>
      ) : (
        <div className="mt-4 space-y-3">
          {activities.map((item) => (
            <div key={item.id} className="flex items-start gap-3">
              <div
                className={`mt-0.5 flex h-8 w-8 items-center justify-center rounded-full ${
                  item.type === "وكيل"
                    ? "bg-emerald-500/15 text-emerald-200"
                    : item.type === "تنفيذ"
                    ? "bg-sky-500/15 text-sky-200"
                    : "bg-violet-500/15 text-violet-200"
                }`}
              >
                {item.type === "وكيل" ? (
                  <Bot className="h-4 w-4" />
                ) : item.type === "تنفيذ" ? (
                  <Activity className="h-4 w-4" />
                ) : (
                  <Wrench className="h-4 w-4" />
                )}
              </div>
              <div className="flex-1 border-r border-slate-800 pr-3">
                <p className="text-xs font-semibold text-slate-200">{item.title}</p>
                <p className="text-[11px] text-slate-400">{item.subtitle}</p>
                <p className="text-[11px] text-slate-500">{toRelativeTime(item.created_at)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default memo(ActivityFeed);
