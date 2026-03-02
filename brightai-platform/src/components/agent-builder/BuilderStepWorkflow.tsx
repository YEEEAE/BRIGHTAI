import { Suspense } from "react";
import { MessageSquare, SlidersHorizontal } from "lucide-react";
import AsyncErrorBoundary from "../layout/AsyncErrorBoundary";
import { lazyWithRetry } from "../../lib/lazy";
import type { وضعسير } from "../../types/agent-builder.types";

const WorkflowCanvas = lazyWithRetry(() => import("../agent/WorkflowCanvas"));

type BuilderStepWorkflowProps = {
  mode: وضعسير;
  onChangeMode: (mode: وضعسير) => void;
  workflowKey: number;
  onReloadWorkflow: () => void;
};

const BuilderStepWorkflow = ({
  mode,
  onChangeMode,
  workflowKey,
  onReloadWorkflow,
}: BuilderStepWorkflowProps) => {
  return (
    <div className="grid gap-4">
      <h2 className="text-xl font-bold text-slate-100">تصميم سير العمل</h2>

      <div className="flex flex-wrap gap-2">
        {(["بسيط", "متقدم"] as وضعسير[]).map((itemMode) => (
          <button
            key={itemMode}
            type="button"
            onClick={() => onChangeMode(itemMode)}
            className={`inline-flex min-h-[42px] items-center gap-2 rounded-xl border px-3 text-sm ${
              mode === itemMode
                ? "border-emerald-400/60 bg-emerald-500/10 text-emerald-200"
                : "border-slate-700 bg-slate-900/60 text-slate-300"
            }`}
          >
            {itemMode === "بسيط" ? (
              <MessageSquare className="h-4 w-4" />
            ) : (
              <SlidersHorizontal className="h-4 w-4" />
            )}
            {itemMode === "بسيط" ? "وضع بسيط" : "وضع متقدم"}
          </button>
        ))}
      </div>

      {mode === "بسيط" ? (
        <div className="rounded-2xl border border-slate-700 bg-slate-900/50 p-5">
          <p className="text-sm text-slate-200">تم تفعيل الوضع البسيط.</p>
          <p className="mt-1 text-xs text-slate-400">
            الوكيل سيعمل بنمط محادثة مباشر اعتمادًا على الموجه النظامي بدون عقد سير عمل.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-700 bg-slate-900/40 p-3 md:p-4">
          <AsyncErrorBoundary
            title="تعذر تحميل مصمم سير العمل"
            message="حدث خلل أثناء تحميل مكوّن المصمم. يمكنك إعادة المحاولة دون فقدان المسودة."
            onRetry={onReloadWorkflow}
            className="flex h-[530px] flex-col items-center justify-center gap-3 rounded-2xl border border-rose-500/30 bg-rose-900/10 p-6 text-center"
          >
            <Suspense
              fallback={
                <div className="flex h-[530px] items-center justify-center rounded-2xl bg-slate-900 text-slate-300">
                  جارٍ تحميل مصمم سير العمل...
                </div>
              }
            >
              <WorkflowCanvas key={workflowKey} />
            </Suspense>
          </AsyncErrorBoundary>
        </div>
      )}
    </div>
  );
};

export default BuilderStepWorkflow;
