import { X } from "lucide-react";
import { خياراتالنماذج } from "../../constants/agent-builder.constants";
import type {
  حدثويبهوك,
  حالةالنموذج,
} from "../../types/agent-builder.types";

type BuilderStepAdvancedSettingsProps = {
  form: حالةالنموذج;
  onChangeForm: (patch: Partial<حالةالنموذج>) => void;
  headerKeyInput: string;
  headerValueInput: string;
  onChangeHeaderKeyInput: (value: string) => void;
  onChangeHeaderValueInput: (value: string) => void;
  onAddWebhookHeader: () => void;
  onRemoveWebhookHeader: (id: string) => void;
};

const BuilderStepAdvancedSettings = ({
  form,
  onChangeForm,
  headerKeyInput,
  headerValueInput,
  onChangeHeaderKeyInput,
  onChangeHeaderValueInput,
  onAddWebhookHeader,
  onRemoveWebhookHeader,
}: BuilderStepAdvancedSettingsProps) => {
  return (
    <div className="grid gap-5">
      <h2 className="text-xl font-bold text-slate-100">الإعدادات المتقدمة</h2>

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

      <div className="grid gap-4 md:grid-cols-2">
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
        </div>

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
      </div>

      <div className="grid gap-4 md:grid-cols-2">
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

        <div className="rounded-2xl border border-slate-700 bg-slate-900/50 p-4">
          <h3 className="text-sm font-semibold text-slate-200">Webhooks</h3>

          <label className="mt-3 block text-xs text-slate-400">رابط الويب هوك</label>
          <input
            value={form.webhookUrl}
            onChange={(event) => onChangeForm({ webhookUrl: event.target.value })}
            placeholder="https://example.com/hook"
            className="mt-1 min-h-[40px] w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 text-sm text-slate-100"
          />

          <label className="mt-3 block text-xs text-slate-400">الحدث</label>
          <select
            value={form.webhookEvent}
            onChange={(event) => onChangeForm({ webhookEvent: event.target.value as حدثويبهوك })}
            className="mt-1 min-h-[40px] w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 text-sm text-slate-100"
          >
            <option value="عند النجاح">عند النجاح</option>
            <option value="عند الفشل">عند الفشل</option>
            <option value="الكل">الكل</option>
          </select>

          <p className="mt-3 text-xs text-slate-400">ترويسات مخصصة</p>
          <div className="mt-1 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <input
              value={headerKeyInput}
              onChange={(event) => onChangeHeaderKeyInput(event.target.value)}
              placeholder="المفتاح"
              className="min-h-[40px] rounded-lg border border-slate-700 bg-slate-950/70 px-2 text-xs text-slate-100"
            />
            <input
              value={headerValueInput}
              onChange={(event) => onChangeHeaderValueInput(event.target.value)}
              placeholder="القيمة"
              className="min-h-[40px] rounded-lg border border-slate-700 bg-slate-950/70 px-2 text-xs text-slate-100"
            />
          </div>
          <button
            type="button"
            onClick={onAddWebhookHeader}
            className="mt-2 min-h-[38px] rounded-lg border border-slate-700 px-3 text-xs text-slate-200"
          >
            إضافة ترويسة
          </button>

          <div className="mt-2 space-y-1">
            {form.webhookHeaders.map((header) => (
              <div
                key={header.id}
                className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-950/70 px-2 py-1 text-xs text-slate-300"
              >
                <span className="flex-1 truncate">{header.key}: {header.value}</span>
                <button
                  type="button"
                  onClick={() => onRemoveWebhookHeader(header.id)}
                  className="rounded p-0.5 hover:bg-slate-800"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuilderStepAdvancedSettings;
