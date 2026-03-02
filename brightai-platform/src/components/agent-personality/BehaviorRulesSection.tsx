import { X } from "lucide-react";

type BehaviorRulesSectionProps = {
  rules: string[];
  ruleInput: string;
  onRuleInputChange: (value: string) => void;
  onAddRule: () => void;
  onRemoveRule: (index: number) => void;
};

const BehaviorRulesSection = ({
  rules,
  ruleInput,
  onRuleInputChange,
  onAddRule,
  onRemoveRule,
}: BehaviorRulesSectionProps) => {
  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-900/50 p-4">
      <h3 className="text-sm font-semibold text-slate-100">قواعد السلوك</h3>
      <div className="mt-3 space-y-2">
        {rules.map((rule, index) => (
          <div
            key={`${rule}-${index}`}
            className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-xs text-slate-200"
          >
            <span className="flex-1">{rule}</span>
            <button type="button" onClick={() => onRemoveRule(index)} className="rounded p-1 hover:bg-slate-800">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        <input
          value={ruleInput}
          onChange={(event) => onRuleInputChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              onAddRule();
            }
          }}
          placeholder="أضف قاعدة سلوك"
          className="min-h-[42px] flex-1 rounded-xl border border-slate-700 bg-slate-950/70 px-3 text-sm text-slate-100"
        />
        <button
          type="button"
          onClick={onAddRule}
          className="min-h-[42px] rounded-xl border border-slate-700 px-3 text-xs text-slate-200"
        >
          إضافة
        </button>
      </div>
    </div>
  );
};

export default BehaviorRulesSection;
