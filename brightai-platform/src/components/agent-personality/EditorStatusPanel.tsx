import { AlertTriangle, Bot, Brain, CheckCircle2, MessageSquare } from "lucide-react";
import type { حالةتحققالموجه } from "../../types/agent-personality.types";

type EditorStatusPanelProps = {
  promptValidation: حالةتحققالموجه;
  tokenEstimate: number;
  rulesCount: number;
  sourcesCount: number;
};

const EditorStatusPanel = ({ promptValidation, tokenEstimate, rulesCount, sourcesCount }: EditorStatusPanelProps) => {
  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-900/50 p-4 text-xs text-slate-300">
      <h4 className="text-sm font-semibold text-slate-100">حالة المحرر</h4>
      <div className="mt-2 space-y-2">
        <div className="flex items-center gap-2">
          {promptValidation.valid ? (
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />
          ) : (
            <AlertTriangle className="h-3.5 w-3.5 text-rose-300" />
          )}
          <span>{promptValidation.valid ? "تركيب الموجه سليم" : "يوجد خطأ في التركيب"}</span>
        </div>
        <div className="flex items-center gap-2">
          <Brain className="h-3.5 w-3.5 text-sky-300" />
          <span>{`تقدير الرموز: ${tokenEstimate}`}</span>
        </div>
        <div className="flex items-center gap-2">
          <MessageSquare className="h-3.5 w-3.5 text-violet-300" />
          <span>{`قواعد السلوك: ${rulesCount}`}</span>
        </div>
        <div className="flex items-center gap-2">
          <Bot className="h-3.5 w-3.5 text-amber-300" />
          <span>{`مصادر المعرفة: ${sourcesCount}`}</span>
        </div>
      </div>
    </div>
  );
};

export default EditorStatusPanel;
