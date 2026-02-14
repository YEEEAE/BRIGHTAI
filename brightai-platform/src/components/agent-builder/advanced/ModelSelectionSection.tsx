import { خياراتالنماذج } from "../../../constants/agent-builder.constants";
import type { AdvancedSettingsCommonProps } from "./types";

const ModelSelectionSection = ({ form, onChangeForm }: AdvancedSettingsCommonProps) => {
  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-900/50 p-4">
      <h3 className="text-sm font-semibold text-slate-200">اختيار النموذج</h3>
      <div className="mt-3 grid gap-2">
        {خياراتالنماذج.map((model) => (
          <button
            key={model.id}
            type="button"
            onClick={() => onChangeForm({ النموذج: model.id })}
            className={`rounded-xl border px-3 py-2 text-right text-sm ${
              form.النموذج === model.id
                ? "border-emerald-400/50 bg-emerald-500/10 text-emerald-200"
                : "border-slate-700 bg-slate-950/60 text-slate-300"
            }`}
          >
            {model.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ModelSelectionSection;
