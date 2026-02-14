import { X } from "lucide-react";
import type { حدثويبهوك } from "../../../types/agent-builder.types";
import type { WebhookSettingsProps } from "./types";

const WebhookSettingsSection = ({
  form,
  onChangeForm,
  headerKeyInput,
  headerValueInput,
  onChangeHeaderKeyInput,
  onChangeHeaderValueInput,
  onAddWebhookHeader,
  onRemoveWebhookHeader,
  onChangeWebhookEvent,
}: WebhookSettingsProps) => {
  return (
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
        onChange={(event) => onChangeWebhookEvent(event.target.value as حدثويبهوك)}
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
  );
};

export default WebhookSettingsSection;
