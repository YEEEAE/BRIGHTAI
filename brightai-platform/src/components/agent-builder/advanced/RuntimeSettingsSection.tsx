import type { AdvancedSettingsCommonProps } from "./types";

const RuntimeSettingsSection = ({ form, onChangeForm }: AdvancedSettingsCommonProps) => {
  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-900/50 p-4">
      <h3 className="text-sm font-semibold text-slate-200">إعدادات التشغيل</h3>
      <div className="mt-3 grid gap-3">
        <label className="grid gap-1 text-xs text-slate-400">
          الحد الأقصى للتنفيذات يوميًا
          <input
            type="number"
            min={1}
            value={form.حدتنفيذيومي}
            onChange={(event) => onChangeForm({ حدتنفيذيومي: Number(event.target.value) })}
            className="min-h-[40px] rounded-lg border border-slate-700 bg-slate-950/70 px-3 text-sm text-slate-100"
          />
        </label>

        <label className="grid gap-1 text-xs text-slate-400">
          الحد الأقصى للتكلفة يوميًا (ريال)
          <input
            type="number"
            min={1}
            value={form.حدتكلفةيومية}
            onChange={(event) => onChangeForm({ حدتكلفةيومية: Number(event.target.value) })}
            className="min-h-[40px] rounded-lg border border-slate-700 bg-slate-950/70 px-3 text-sm text-slate-100"
          />
        </label>

        <label className="grid gap-1 text-xs text-slate-400">
          مهلة التنفيذ بالثواني
          <input
            type="number"
            min={10}
            max={600}
            value={form.timeoutSeconds}
            onChange={(event) => onChangeForm({ timeoutSeconds: Number(event.target.value) })}
            className="min-h-[40px] rounded-lg border border-slate-700 bg-slate-950/70 px-3 text-sm text-slate-100"
          />
        </label>

        <label className="grid gap-1 text-xs text-slate-400">
          عدد إعادة المحاولة
          <input
            type="number"
            min={0}
            max={5}
            value={form.retries}
            onChange={(event) => onChangeForm({ retries: Number(event.target.value) })}
            className="min-h-[40px] rounded-lg border border-slate-700 bg-slate-950/70 px-3 text-sm text-slate-100"
          />
        </label>
      </div>
    </div>
  );
};

export default RuntimeSettingsSection;
