import { X } from "lucide-react";
import type { رسالةمعاينة } from "../../types/agent-personality.types";

type LivePreviewPanelProps = {
  previewMessages: رسالةمعاينة[];
  previewInput: string;
  temperature: number;
  model: string;
  onPreviewInputChange: (value: string) => void;
  onSendPreview: () => Promise<void>;
  onClearPreview: () => void;
};

const LivePreviewPanel = ({
  previewMessages,
  previewInput,
  temperature,
  model,
  onPreviewInputChange,
  onSendPreview,
  onClearPreview,
}: LivePreviewPanelProps) => {
  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-900/50 p-4">
      <h3 className="text-sm font-semibold text-slate-100">المعاينة الحية</h3>
      <p className="mt-1 text-xs text-slate-400">سلوك الوكيل يتحدث تلقائياً عند تغيير الإعدادات</p>

      <div className="mt-3 max-h-[460px] min-h-[320px] space-y-2 overflow-y-auto rounded-xl border border-slate-700 bg-slate-950/70 p-3">
        {previewMessages.length === 0 ? (
          <p className="text-xs text-slate-400">لا توجد رسائل حتى الآن.</p>
        ) : (
          previewMessages.map((message) => (
            <div
              key={message.id}
              className={`rounded-xl px-3 py-2 text-xs leading-7 ${
                message.role === "مستخدم" ? "mr-6 bg-sky-500/20 text-sky-100" : "ml-6 bg-emerald-500/20 text-emerald-100"
              }`}
            >
              <p className="mb-1 text-[10px] text-slate-300">{message.role}</p>
              <p className="whitespace-pre-wrap break-words">{message.text}</p>
            </div>
          ))
        )}
      </div>

      <div className="mt-3 flex gap-2">
        <input
          value={previewInput}
          onChange={(event) => onPreviewInputChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              void onSendPreview();
            }
          }}
          placeholder="أرسل رسالة تجريبية"
          className="min-h-[42px] flex-1 rounded-xl border border-slate-700 bg-slate-950/70 px-3 text-xs text-slate-100"
        />
        <button
          type="button"
          onClick={() => void onSendPreview()}
          className="min-h-[42px] rounded-xl bg-emerald-500/20 px-3 text-xs text-emerald-200"
        >
          إرسال
        </button>
      </div>

      <div className="mt-2 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onClearPreview}
          className="inline-flex min-h-[36px] items-center gap-1 rounded-lg border border-slate-700 px-2 text-[11px] text-slate-300"
        >
          <X className="h-3 w-3" />
          مسح
        </button>
        <span className="inline-flex min-h-[36px] items-center rounded-lg border border-slate-700 px-2 text-[11px] text-slate-400">
          Temperature: {temperature.toFixed(2)}
        </span>
        <span className="inline-flex min-h-[36px] items-center rounded-lg border border-slate-700 px-2 text-[11px] text-slate-400">
          النموذج: {model}
        </span>
      </div>
    </div>
  );
};

export default LivePreviewPanel;
