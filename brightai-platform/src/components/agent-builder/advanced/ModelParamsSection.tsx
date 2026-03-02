import type { AdvancedSettingsCommonProps } from "./types";

const ModelParamsSection = ({ form, onChangeForm }: AdvancedSettingsCommonProps) => {
  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-900/50 p-4">
      <h3 className="text-sm font-semibold text-slate-200">إعدادات النموذج</h3>

      <label className="mt-3 block text-xs text-slate-400">Temperature: {form.temperature.toFixed(2)}</label>
      <input
        type="range"
        min={0}
        max={2}
        step={0.01}
        value={form.temperature}
        onChange={(event) => onChangeForm({ temperature: Number(event.target.value) })}
        className="w-full"
      />

      <label className="mt-3 block text-xs text-slate-400">Max Tokens: {form.maxTokens}</label>
      <input
        type="range"
        min={100}
        max={32000}
        step={100}
        value={form.maxTokens}
        onChange={(event) => onChangeForm({ maxTokens: Number(event.target.value) })}
        className="w-full"
      />

      <label className="mt-3 block text-xs text-slate-400">Top P: {form.topP.toFixed(2)}</label>
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={form.topP}
        onChange={(event) => onChangeForm({ topP: Number(event.target.value) })}
        className="w-full"
      />

      <label className="mt-3 block text-xs text-slate-400">
        Frequency Penalty: {form.frequencyPenalty.toFixed(2)}
      </label>
      <input
        type="range"
        min={-2}
        max={2}
        step={0.01}
        value={form.frequencyPenalty}
        onChange={(event) => onChangeForm({ frequencyPenalty: Number(event.target.value) })}
        className="w-full"
      />

      <label className="mt-3 block text-xs text-slate-400">
        Presence Penalty: {form.presencePenalty.toFixed(2)}
      </label>
      <input
        type="range"
        min={-2}
        max={2}
        step={0.01}
        value={form.presencePenalty}
        onChange={(event) => onChangeForm({ presencePenalty: Number(event.target.value) })}
        className="w-full"
      />

      <div className="mt-4 rounded-xl border border-slate-700 bg-slate-950/70 p-3">
        <label className="inline-flex min-h-[40px] w-full items-center justify-between gap-2 text-xs text-slate-300">
          <span>تفعيل الاسترجاع المعرفي</span>
          <input
            type="checkbox"
            checked={form.تفعيلالاسترجاعالمعرفي}
            onChange={(event) =>
              onChangeForm({ تفعيلالاسترجاعالمعرفي: event.target.checked })
            }
          />
        </label>

        <label className="mt-3 block text-xs text-slate-400">
          حد المقاطع المسترجعة: {form.حدالمقاطعالمعرفية}
        </label>
        <input
          type="range"
          min={1}
          max={20}
          step={1}
          value={form.حدالمقاطعالمعرفية}
          onChange={(event) =>
            onChangeForm({ حدالمقاطعالمعرفية: Number(event.target.value) })
          }
          className="w-full"
          disabled={!form.تفعيلالاسترجاعالمعرفي}
        />

        <label className="mt-3 block text-xs text-slate-400">
          حد طول كل مقطع: {form.حدطولالمقطعالمعرفي} حرف
        </label>
        <input
          type="range"
          min={120}
          max={1200}
          step={20}
          value={form.حدطولالمقطعالمعرفي}
          onChange={(event) =>
            onChangeForm({ حدطولالمقطعالمعرفي: Number(event.target.value) })
          }
          className="w-full"
          disabled={!form.تفعيلالاسترجاعالمعرفي}
        />
      </div>
    </div>
  );
};

export default ModelParamsSection;
