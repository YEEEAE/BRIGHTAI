import { useCallback, type KeyboardEvent } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Play,
  RefreshCcw,
  Rocket,
  Save,
  Sparkles,
  Store,
} from "lucide-react";
import type {
  مقطعمعرفةاختبار,
  حالةنظام,
  رسالةاختبار,
} from "../../types/agent-builder.types";

type BuilderStepTestPublishProps = {
  testMessages: رسالةاختبار[];
  testInput: string;
  onChangeTestInput: (value: string) => void;
  onRunTestMessage: (message: string) => Promise<void>;
  isStreaming: boolean;
  onClearChat: () => void;
  onRunScenario: () => void;
  testTokens: number;
  testCost: number;
  testLatency: number;
  lastKnowledgeContext: string;
  lastKnowledgeSegments: number;
  lastKnowledgeChunks: مقطعمعرفةاختبار[];
  onToggleKnowledgeChunk: (id: string) => void;
  systemState: حالةنظام;
  saving: boolean;
  canPublishMarket: boolean;
  onSaveDraft: () => void;
  onPublish: () => void;
  onPublishMarket: () => void;
};

const BuilderStepTestPublish = ({
  testMessages,
  testInput,
  onChangeTestInput,
  onRunTestMessage,
  isStreaming,
  onClearChat,
  onRunScenario,
  testTokens,
  testCost,
  testLatency,
  lastKnowledgeContext,
  lastKnowledgeSegments,
  lastKnowledgeChunks,
  onToggleKnowledgeChunk,
  systemState,
  saving,
  canPublishMarket,
  onSaveDraft,
  onPublish,
  onPublishMarket,
}: BuilderStepTestPublishProps) => {
  const onEnterPress = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        void onRunTestMessage(testInput);
      }
    },
    [onRunTestMessage, testInput]
  );

  return (
    <div className="grid gap-5">
      <h2 className="text-xl font-bold text-slate-100">الاختبار والنشر</h2>

      <div className="rounded-2xl border border-slate-700 bg-slate-900/50 p-4">
        <h3 className="text-sm font-semibold text-slate-200">واجهة اختبار مباشرة</h3>

        <div className="mt-3 max-h-[320px] min-h-[220px] space-y-2 overflow-y-auto rounded-xl border border-slate-700 bg-slate-950/70 p-3">
          {testMessages.length === 0 ? (
            <p className="text-xs text-slate-400">ابدأ رسالة اختبار لرؤية الاستجابة الفورية.</p>
          ) : (
            testMessages.map((message) => (
              <div
                key={message.id}
                className={`rounded-xl px-3 py-2 text-sm ${
                  message.role === "مستخدم"
                    ? "mr-8 bg-sky-500/20 text-sky-100"
                    : "ml-8 bg-emerald-500/20 text-emerald-100"
                }`}
              >
                <p className="text-[11px] text-slate-300">{message.role}</p>
                <pre className="whitespace-pre-wrap break-words font-sans leading-7">
                  {message.text || (isStreaming ? "..." : "")}
                </pre>
              </div>
            ))
          )}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <input
            value={testInput}
            onChange={(event) => onChangeTestInput(event.target.value)}
            onKeyDown={onEnterPress}
            placeholder="اكتب رسالة للاختبار"
            className="min-h-[44px] flex-1 rounded-xl border border-slate-700 bg-slate-950/70 px-3 text-sm text-slate-100"
          />

          <button
            type="button"
            onClick={() => void onRunTestMessage(testInput)}
            disabled={isStreaming}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-emerald-500/20 px-3 text-sm font-semibold text-emerald-200 disabled:opacity-60"
          >
            {isStreaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            إرسال
          </button>

          <button
            type="button"
            onClick={onClearChat}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-slate-700 px-3 text-sm text-slate-200"
          >
            <RefreshCcw className="h-4 w-4" />
            مسح المحادثة
          </button>

          <button
            type="button"
            onClick={onRunScenario}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-slate-700 px-3 text-sm text-slate-200"
          >
            <Sparkles className="h-4 w-4" />
            تجربة سيناريو مختلف
          </button>
        </div>

        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2 text-xs text-slate-300">
            <p>الرموز المستخدمة</p>
            <p className="mt-1 text-sm font-bold text-slate-100">{testTokens}</p>
          </div>
          <div className="rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2 text-xs text-slate-300">
            <p>التكلفة التقديرية (ر.س)</p>
            <p className="mt-1 text-sm font-bold text-slate-100">{testCost.toFixed(4)}</p>
          </div>
          <div className="rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2 text-xs text-slate-300">
            <p>وقت الاستجابة</p>
            <p className="mt-1 text-sm font-bold text-slate-100">{testLatency} مللي ثانية</p>
          </div>
        </div>

        <details className="mt-3 rounded-xl border border-slate-700 bg-slate-950/60">
          <summary className="cursor-pointer px-3 py-2 text-xs font-semibold text-slate-300">
            السياق المعرفي المستخدم في آخر اختبار
            {lastKnowledgeSegments > 0 ? ` (${lastKnowledgeSegments} مقطع)` : " (لا يوجد مقاطع)"}
          </summary>
          <div className="border-t border-slate-700 px-3 py-3">
            {lastKnowledgeChunks.length > 0 ? (
              <div className="mb-3 grid gap-2">
                {lastKnowledgeChunks.map((chunk, index) => (
                  <label
                    key={chunk.id}
                    className="inline-flex min-h-[38px] items-start justify-between gap-2 rounded-lg border border-slate-700 bg-slate-900/60 px-2 py-2 text-xs text-slate-300"
                  >
                    <span className="line-clamp-2">
                      [{index + 1}] {chunk.source}
                    </span>
                    <input
                      type="checkbox"
                      checked={chunk.enabled}
                      onChange={() => onToggleKnowledgeChunk(chunk.id)}
                    />
                  </label>
                ))}
              </div>
            ) : null}
            <pre className="max-h-48 overflow-y-auto whitespace-pre-wrap break-words text-xs leading-6 text-slate-200">
              {lastKnowledgeContext || "لم يتم حقن سياق معرفي بعد. أرسل رسالة اختبار أولاً."}
            </pre>
          </div>
        </details>
      </div>

      <div className="rounded-2xl border border-slate-700 bg-slate-900/50 p-4">
        <h3 className="text-sm font-semibold text-slate-200">نتائج الاختبار</h3>
        <div className="mt-3 space-y-2 text-sm">
          <div className="flex items-start gap-2 rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2">
            {systemState.apiConnected ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-300" />
            ) : (
              <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-300" />
            )}
            <span className="text-slate-200">
              {systemState.apiConnected
                ? "الاتصال بمفتاح API متاح."
                : "لم يتم العثور على مفتاح API نشط لـ Groq."}
            </span>
          </div>

          <div className="flex items-start gap-2 rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2">
            {systemState.promptReady ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-300" />
            ) : (
              <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-300" />
            )}
            <span className="text-slate-200">
              {systemState.promptReady
                ? "الموجه النظامي جاهز."
                : "الموجه النظامي يحتاج تفاصيل إضافية."}
            </span>
          </div>

          <div className="flex items-start gap-2 rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2">
            {systemState.workflowReady ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-300" />
            ) : (
              <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-300" />
            )}
            <span className="text-slate-200">
              {systemState.workflowReady
                ? "سير العمل جاهز للتشغيل."
                : "سير العمل المتقدم يحتاج عقدًا واحدة على الأقل."}
            </span>
          </div>

          {systemState.warnings.map((warning) => (
            <div
              key={warning}
              className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-amber-100"
            >
              <AlertTriangle className="mt-0.5 h-4 w-4" />
              <span>{warning}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-2 md:grid-cols-3">
        <button
          type="button"
          onClick={onSaveDraft}
          disabled={saving}
          className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900/70 text-sm font-semibold text-slate-200 disabled:opacity-60"
        >
          <Save className="h-4 w-4" />
          حفظ كمسودة
        </button>

        <button
          type="button"
          onClick={onPublish}
          disabled={saving}
          className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl bg-emerald-500/20 text-sm font-semibold text-emerald-200 disabled:opacity-60"
        >
          <Rocket className="h-4 w-4" />
          نشر وتفعيل
        </button>

        <button
          type="button"
          onClick={onPublishMarket}
          disabled={saving || !canPublishMarket}
          className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl bg-sky-500/20 text-sm font-semibold text-sky-200 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Store className="h-4 w-4" />
          نشر في السوق
        </button>
      </div>
    </div>
  );
};

export default BuilderStepTestPublish;
