import { memo } from "react";
import { Save, SlidersHorizontal, Sparkles } from "lucide-react";
import type { حالةحفظ, ملخصسير } from "../../types/agent-builder.types";

type BuilderStatusBarProps = {
  saveState: حالةحفظ;
  lastSavedAt: string;
  lastEditedAt: string;
  workflowSummary: ملخصسير;
};

const BuilderStatusBar = ({
  saveState,
  lastSavedAt,
  lastEditedAt,
  workflowSummary,
}: BuilderStatusBarProps) => {
  return (
    <footer className="sticky bottom-2 z-30 rounded-2xl border border-white/10 bg-slate-950/90 px-4 py-3 backdrop-blur-xl">
      <div className="grid gap-2 text-xs text-slate-300 md:grid-cols-3">
        <div className="inline-flex items-center gap-2">
          <Save className="h-3.5 w-3.5" />
          حالة الحفظ: <strong className="text-slate-100">{saveState}</strong>
        </div>
        <div className="inline-flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5" />
          آخر حفظ: <strong className="text-slate-100">{lastSavedAt || "لم يتم بعد"}</strong>
        </div>
        <div className="inline-flex items-center gap-2">
          <SlidersHorizontal className="h-3.5 w-3.5" />
          حجم سير العمل:
          <strong className="text-slate-100">
            {workflowSummary.nodes} عقدة / {workflowSummary.edges} رابط
          </strong>
        </div>
      </div>

      <div className="mt-2 text-[11px] text-slate-500">آخر تعديل: {lastEditedAt || "-"}</div>
    </footer>
  );
};

export default memo(BuilderStatusBar);
