import { estimateTokens, formatCost } from "../../lib/node-editor.utils";
import type { NodeDraft } from "../../types/node-editor.types";

type NodeGroqFieldsProps = {
  draft: NodeDraft;
  onUpdateField: (key: string, value: unknown) => void;
};

const NodeGroqFields = ({ draft, onUpdateField }: NodeGroqFieldsProps) => {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold">النموذج</label>
          <select
            className="auth-field rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-2 text-sm"
            value={String(draft.model || "llama-3.1-70b-versatile")}
            onChange={(event) => onUpdateField("model", event.target.value)}
          >
            <option value="llama-3.1-405b-reasoning">لاما ٤٠٥ استدلال</option>
            <option value="llama-3.1-70b-versatile">لاما ٧٠ متعدد</option>
            <option value="llama-3.1-8b-instant">لاما ٨ سريع</option>
            <option value="mixtral-8x7b-32768">ميكسترال ٨×٧بي</option>
            <option value="gemma2-9b-it">جيما ٢</option>
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold">الحد الأعلى للرموز</label>
          <input
            type="number"
            className="auth-field rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-2 text-sm"
            value={String(draft.max_tokens || 800)}
            onChange={(event) => onUpdateField("max_tokens", Number(event.target.value))}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold">درجة الإبداع</label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={Number(draft.temperature || 0.4)}
          onChange={(event) => onUpdateField("temperature", Number(event.target.value))}
          className="w-full"
        />
        <div className="text-xs text-slate-400">القيمة الحالية: {Number(draft.temperature || 0.4).toFixed(2)}</div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold">نص النظام</label>
        <textarea
          className="auth-field min-h-[80px] rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-2 text-sm"
          value={String(draft.systemPrompt || "")}
          onChange={(event) => onUpdateField("systemPrompt", event.target.value)}
          placeholder="أضف تعليمات خاصة للنموذج"
        />
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-xs text-slate-300">
        التكلفة التقديرية: {formatCost(estimateTokens(draft))} دولار أمريكي
      </div>
    </>
  );
};

export default NodeGroqFields;
