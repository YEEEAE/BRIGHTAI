import type { AdvancedSettingsCommonProps } from "./types";

const PrivacySettingsSection = ({ form, onChangeForm }: AdvancedSettingsCommonProps) => {
  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-900/50 p-4">
      <h3 className="text-sm font-semibold text-slate-200">إعدادات الخصوصية</h3>
      <div className="mt-3 grid gap-2">
        <label className="inline-flex min-h-[42px] items-center justify-between rounded-xl border border-slate-700 bg-slate-950/60 px-3 text-sm text-slate-200">
          عام (يظهر في السوق)
          <input
            type="checkbox"
            checked={form.عام}
            onChange={(event) => onChangeForm({ عام: event.target.checked })}
          />
        </label>

        <label className="inline-flex min-h-[42px] items-center justify-between rounded-xl border border-slate-700 bg-slate-950/60 px-3 text-sm text-slate-200">
          تسجيل المحادثات
          <input
            type="checkbox"
            checked={form.تسجيلالمحادثات}
            onChange={(event) => onChangeForm({ تسجيلالمحادثات: event.target.checked })}
          />
        </label>

        <label className="inline-flex min-h-[42px] items-center justify-between rounded-xl border border-slate-700 bg-slate-950/60 px-3 text-sm text-slate-200">
          مشاركة البيانات مع الفريق
          <input
            type="checkbox"
            checked={form.مشاركةمعالفريق}
            onChange={(event) => onChangeForm({ مشاركةمعالفريق: event.target.checked })}
          />
        </label>
      </div>
    </div>
  );
};

export default PrivacySettingsSection;
