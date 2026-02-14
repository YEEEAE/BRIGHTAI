import { ChevronLeft, ChevronRight } from "lucide-react";
import type { خطوة } from "../../types/agent-builder.types";

type BuilderStepNavigationProps = {
  step: خطوة;
  onPrev: () => void;
  onNext: () => void;
};

const BuilderStepNavigation = ({ step, onPrev, onNext }: BuilderStepNavigationProps) => {
  return (
    <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 pt-4">
      <button
        type="button"
        onClick={onPrev}
        disabled={step === 1}
        className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/70 px-4 text-sm text-slate-200 disabled:opacity-50"
      >
        <ChevronRight className="h-4 w-4" />
        السابق
      </button>

      <div className="text-xs text-slate-400">
        استخدم اختصار
        <kbd className="mx-1 rounded border border-slate-700 px-1.5 py-0.5 text-[11px]">Ctrl+S</kbd>
        للحفظ
      </div>

      <button
        type="button"
        onClick={onNext}
        disabled={step === 5}
        className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-emerald-400 px-4 text-sm font-semibold text-slate-950 disabled:opacity-50"
      >
        التالي
        <ChevronLeft className="h-4 w-4" />
      </button>
    </div>
  );
};

export default BuilderStepNavigation;
