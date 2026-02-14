import { memo } from "react";
import type { ChangeEvent, RefObject } from "react";
import { Download, Loader2, Save, Upload } from "lucide-react";
import type { بياناتنموذج, خطوة } from "../../types/agent-builder.types";
import { عناوينالخطوات } from "../../constants/agent-builder.constants";

type BuilderHeaderProps = {
  localMode: boolean;
  currentStepTitle: string;
  templates: بياناتنموذج[];
  selectedTemplateId: string;
  onSelectTemplateId: (value: string) => void;
  onApplyTemplate: () => void;
  onOpenImportJson: () => void;
  onExportJson: () => void;
  onSaveDraft: () => void;
  saving: boolean;
  importJsonRef: RefObject<HTMLInputElement | null>;
  onImportJson: (event: ChangeEvent<HTMLInputElement>) => void;
  progress: number;
  step: خطوة;
  onJumpToStep: (target: خطوة) => void;
};

const BuilderHeader = ({
  localMode,
  currentStepTitle,
  templates,
  selectedTemplateId,
  onSelectTemplateId,
  onApplyTemplate,
  onOpenImportJson,
  onExportJson,
  onSaveDraft,
  saving,
  importJsonRef,
  onImportJson,
  progress,
  step,
  onJumpToStep,
}: BuilderHeaderProps) => {
  return (
    <header className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950/30 p-4 shadow-2xl shadow-slate-950/30 md:p-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="text-xs text-emerald-300">مصمم الوكلاء المتقدم</p>
          <h1 className="mt-1 text-2xl font-extrabold text-slate-100 md:text-3xl">
            إنشاء وكيل ذكاء اصطناعي متكامل
          </h1>
          <p className="mt-1 text-sm text-slate-300">الخطوة الحالية: {currentStepTitle}</p>
          {localMode ? (
            <p className="mt-2 inline-flex items-center rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-xs text-amber-200">
              وضع محلي مؤقت: يمكنك حفظ المسودات محليًا فقط.
            </p>
          ) : null}
        </div>

        <div className="grid gap-2 sm:grid-cols-2 xl:flex xl:flex-wrap">
          <div className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-xs text-slate-200">
            <span>استيراد من قالب</span>
            <select
              value={selectedTemplateId}
              onChange={(event) => onSelectTemplateId(event.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-xs"
            >
              <option value="">اختر قالب</option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={onApplyTemplate}
              className="rounded-lg bg-emerald-500/20 px-2 py-1 text-emerald-200"
            >
              تطبيق
            </button>
          </div>

          <button
            type="button"
            onClick={onOpenImportJson}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-xs text-slate-200"
          >
            <Upload className="h-4 w-4" />
            استيراد من JSON
          </button>

          <button
            type="button"
            onClick={onExportJson}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-xs text-slate-200"
          >
            <Download className="h-4 w-4" />
            تصدير كـ JSON
          </button>

          <button
            type="button"
            onClick={onSaveDraft}
            disabled={saving}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-emerald-400 px-4 py-2 text-sm font-bold text-slate-950 disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            حفظ مسودة
          </button>
        </div>
      </div>

      <input
        ref={importJsonRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={onImportJson}
      />

      <div className="mt-5">
        <div className="mb-3 h-2 w-full overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-sky-400 to-violet-400 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="grid gap-2 sm:grid-cols-5">
          {عناوينالخطوات.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onJumpToStep(item.id)}
              className={`rounded-xl border px-3 py-2 text-right text-xs transition ${
                step === item.id
                  ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-200"
                  : step > item.id
                  ? "border-sky-400/30 bg-sky-500/10 text-sky-200"
                  : "border-slate-700 bg-slate-900/60 text-slate-300"
              }`}
            >
              <span className="block font-bold">الخطوة {item.id}</span>
              <span className="mt-1 block">{item.title}</span>
            </button>
          ))}
        </div>
      </div>
    </header>
  );
};

export default memo(BuilderHeader);
