import { Bold, CheckCircle2, Fullscreen, Italic, List, Loader2, Sparkles, WandSparkles } from "lucide-react";
import type { خصائصقسمالموجه } from "../../types/agent-personality.types";

const PromptEditorSection = ({
  value,
  promptRef,
  tokenEstimate,
  promptValidation,
  promptSegments,
  variableOpen,
  suggestions,
  generating,
  improving,
  onApplyFormat,
  onSetFullscreen,
  onPromptChange,
  onPromptCursorChange,
  onChooseVariable,
  onUpdateGenerateDescription,
  onGeneratePrompt,
}: خصائصقسمالموجه) => {
  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-900/50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-100">محرر System Prompt الذكي</h3>
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span>{`رموز تقريبية: ${tokenEstimate}`}</span>
          <span>{`أحرف: ${value.الموجهالنظامي.length}`}</span>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => onApplyFormat("bold")}
          className="inline-flex min-h-[38px] items-center gap-1 rounded-lg border border-slate-700 bg-slate-950/70 px-2.5 text-xs text-slate-200"
        >
          <Bold className="h-3.5 w-3.5" />
          غامق
        </button>
        <button
          type="button"
          onClick={() => onApplyFormat("italic")}
          className="inline-flex min-h-[38px] items-center gap-1 rounded-lg border border-slate-700 bg-slate-950/70 px-2.5 text-xs text-slate-200"
        >
          <Italic className="h-3.5 w-3.5" />
          مائل
        </button>
        <button
          type="button"
          onClick={() => onApplyFormat("list")}
          className="inline-flex min-h-[38px] items-center gap-1 rounded-lg border border-slate-700 bg-slate-950/70 px-2.5 text-xs text-slate-200"
        >
          <List className="h-3.5 w-3.5" />
          قائمة
        </button>
        <button
          type="button"
          onClick={() => onSetFullscreen(true)}
          className="inline-flex min-h-[38px] items-center gap-1 rounded-lg border border-slate-700 bg-slate-950/70 px-2.5 text-xs text-slate-200"
        >
          <Fullscreen className="h-3.5 w-3.5" />
          ملء الشاشة
        </button>
      </div>

      <textarea
        ref={promptRef}
        value={value.الموجهالنظامي}
        onChange={onPromptChange}
        onClick={onPromptCursorChange}
        onKeyUp={onPromptCursorChange}
        className="mt-3 min-h-[210px] w-full rounded-xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm leading-8 text-slate-100"
        placeholder="اكتب التعليمات الأساسية لسلوك الوكيل"
      />

      {variableOpen && suggestions.length > 0 ? (
        <div className="mt-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-2">
          <p className="mb-1 text-[11px] text-emerald-200">اقتراحات المتغيرات</p>
          <div className="flex flex-wrap gap-1.5">
            {suggestions.map((variable) => (
              <button
                key={variable}
                type="button"
                onClick={() => onChooseVariable(variable)}
                className="rounded-lg border border-emerald-500/30 bg-slate-950/70 px-2 py-1 text-[11px] text-emerald-100"
              >
                {`{{${variable}}}`}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-3 rounded-xl border border-slate-700 bg-slate-950/70 p-3">
        <p className="mb-2 text-xs text-slate-400">معاينة تلوين المتغيرات</p>
        <pre className="whitespace-pre-wrap break-words text-sm leading-7 text-slate-300">
          {promptSegments.map((segment, index) => {
            const isVariable = /^\{\{[^}]+\}\}$/.test(segment);
            return (
              <span key={`${segment}-${index}`} className={isVariable ? "rounded bg-emerald-500/20 px-1 text-emerald-200" : ""}>
                {segment}
              </span>
            );
          })}
        </pre>
      </div>

      {!promptValidation.valid ? (
        <div className="mt-3 space-y-1 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-100">
          {promptValidation.errors.map((error) => (
            <p key={error}>{error}</p>
          ))}
        </div>
      ) : (
        <div className="mt-3 inline-flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
          <CheckCircle2 className="h-3.5 w-3.5" />
          تركيب الموجه سليم
        </div>
      )}

      <div className="mt-4 rounded-xl border border-slate-700 bg-slate-950/70 p-3">
        <p className="text-xs text-slate-400">مولّد System Prompt بالذكاء الاصطناعي</p>
        <textarea
          value={value.وصفتوليد}
          onChange={(event) => onUpdateGenerateDescription(event.target.value)}
          placeholder="صف ما تريد أن يفعله الـ Agent"
          className="mt-2 min-h-[90px] w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
        />
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void onGeneratePrompt("generate")}
            disabled={generating}
            className="inline-flex min-h-[40px] items-center gap-2 rounded-xl bg-sky-500/20 px-3 text-sm text-sky-200 disabled:opacity-60"
          >
            {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            توليد
          </button>
          <button
            type="button"
            onClick={() => void onGeneratePrompt("improve")}
            disabled={improving}
            className="inline-flex min-h-[40px] items-center gap-2 rounded-xl border border-slate-700 px-3 text-sm text-slate-200 disabled:opacity-60"
          >
            {improving ? <Loader2 className="h-4 w-4 animate-spin" /> : <WandSparkles className="h-4 w-4" />}
            تحسين
          </button>
        </div>
      </div>
    </div>
  );
};

export default PromptEditorSection;
