import { memo } from "react";
import { Brain, Coins, FileJson, Hash, Wrench } from "lucide-react";
import type { ملخصسير, حالةالنموذج } from "../../types/agent-builder.types";
type خيارايقونة =
  (typeof import("../../constants/agent-builder.constants").خياراتالايقونات)[number];

type BuilderSidebarProps = {
  form: حالةالنموذج;
  previewName: string;
  selectedIcon: خيارايقونة;
  workflowSummary: ملخصسير;
  stepHasError: boolean;
};

const BuilderSidebar = ({
  form,
  previewName,
  selectedIcon,
  workflowSummary,
  stepHasError,
}: BuilderSidebarProps) => {
  return (
    <aside className="grid gap-4">
      <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-4">
        <h3 className="text-sm font-bold text-slate-100">بطاقة الوكيل</h3>
        <div className="mt-3 flex items-center gap-3">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-xl"
            style={{ background: `${form.اللون}22`, color: form.اللون }}
          >
            {form.صورةايقونة ? (
              <img src={form.صورةايقونة} alt="أيقونة" className="h-10 w-10 rounded-xl object-cover" />
            ) : (
              <selectedIcon.icon className="h-5 w-5" />
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-100">{previewName || "وكيل جديد"}</p>
            <p className="text-xs text-slate-400">{form.الفئة}</p>
          </div>
        </div>
        <p className="mt-3 text-xs leading-7 text-slate-300">
          {form.الوصف || "أضف وصفًا واضحًا لعرض قيمة الوكيل."}
        </p>
        <div className="mt-3 flex flex-wrap gap-1">
          {form.الوسوم.slice(0, 6).map((tag) => (
            <span key={tag} className="rounded-full bg-slate-800 px-2 py-1 text-[11px] text-slate-200">
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-4">
        <h3 className="text-sm font-bold text-slate-100">مؤشرات سريعة</h3>
        <div className="mt-3 grid gap-2 text-xs">
          <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-slate-300">
            <span className="inline-flex items-center gap-1"><Hash className="h-3.5 w-3.5" /> عقد سير العمل</span>
            <strong className="text-slate-100">{workflowSummary.nodes}</strong>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-slate-300">
            <span className="inline-flex items-center gap-1"><Wrench className="h-3.5 w-3.5" /> روابط سير العمل</span>
            <strong className="text-slate-100">{workflowSummary.edges}</strong>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-slate-300">
            <span className="inline-flex items-center gap-1"><FileJson className="h-3.5 w-3.5" /> حجم المخطط</span>
            <strong className="text-slate-100">{workflowSummary.sizeKb} ك.ب</strong>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-slate-300">
            <span className="inline-flex items-center gap-1"><Coins className="h-3.5 w-3.5" /> حد التكلفة اليومية</span>
            <strong className="text-slate-100">{form.حدتكلفةيومية} ر.س</strong>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-slate-300">
            <span className="inline-flex items-center gap-1"><Brain className="h-3.5 w-3.5" /> النموذج</span>
            <strong className="text-slate-100">{form.النموذج}</strong>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-4">
        <h3 className="text-sm font-bold text-slate-100">تنبيهات الجودة</h3>
        <div className="mt-3 space-y-2 text-xs">
          <div
            className={`rounded-xl border px-3 py-2 ${
              stepHasError
                ? "border-rose-500/30 bg-rose-500/10 text-rose-200"
                : "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
            }`}
          >
            {stepHasError ? "يوجد نواقص في الخطوة الحالية." : "الخطوة الحالية مكتملة."}
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-slate-300">
            إذا أردت تجربة سريعة استخدم
            <strong className="mx-1 text-slate-100">Ctrl+1..5</strong>
            للتنقل بين الخطوات.
          </div>
        </div>
      </div>
    </aside>
  );
};

export default memo(BuilderSidebar);
