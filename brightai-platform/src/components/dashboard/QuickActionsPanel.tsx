import { memo } from "react";
import { Link } from "react-router-dom";
import { Plus, Settings2, Sparkles, Workflow } from "lucide-react";

const QuickActionsPanel = () => {
  return (
    <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-4 backdrop-blur-xl md:p-5">
      <h2 className="text-lg font-bold text-slate-100">الإجراءات السريعة</h2>
      <p className="mt-1 text-xs text-slate-400">تنقل سريع لأهم المهام التشغيلية</p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
        <Link
          to="/agents/new"
          className="group rounded-2xl bg-gradient-to-br from-emerald-500/25 to-emerald-900/20 p-4 transition hover:-translate-y-1"
        >
          <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-400/20 text-emerald-200">
            <Plus className="h-4 w-4" />
          </div>
          <p className="mt-3 text-sm font-bold text-slate-100">إنشاء وكيل جديد</p>
          <p className="text-xs text-slate-300">ابدأ تدفق أتمتة جديد خلال دقائق</p>
        </Link>

        <Link
          to="/templates"
          className="group rounded-2xl bg-gradient-to-br from-sky-500/25 to-sky-900/20 p-4 transition hover:-translate-y-1"
        >
          <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-sky-400/20 text-sky-200">
            <Sparkles className="h-4 w-4" />
          </div>
          <p className="mt-3 text-sm font-bold text-slate-100">استعراض القوالب</p>
          <p className="text-xs text-slate-300">اختر قالب جاهز للتشغيل الفوري</p>
        </Link>

        <Link
          to="/settings"
          className="group rounded-2xl bg-gradient-to-br from-violet-500/25 to-violet-900/20 p-4 transition hover:-translate-y-1"
        >
          <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-violet-400/20 text-violet-200">
            <Settings2 className="h-4 w-4" />
          </div>
          <p className="mt-3 text-sm font-bold text-slate-100">إعدادات واجهات البرمجة</p>
          <p className="text-xs text-slate-300">أضف المفاتيح واضبط حدود الاستخدام</p>
        </Link>

        <Link
          to="/workflow"
          className="group rounded-2xl bg-gradient-to-br from-amber-500/25 to-amber-900/20 p-4 transition hover:-translate-y-1"
        >
          <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-amber-400/20 text-amber-200">
            <Workflow className="h-4 w-4" />
          </div>
          <p className="mt-3 text-sm font-bold text-slate-100">مصمم سير العمل</p>
          <p className="text-xs text-slate-300">صمّم تدفقات مرئية مع عقد ذكية</p>
        </Link>
      </div>
    </div>
  );
};

export default memo(QuickActionsPanel);
