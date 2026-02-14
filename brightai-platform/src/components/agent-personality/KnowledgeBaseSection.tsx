import { ArrowUpRight, FileText, Loader2, X } from "lucide-react";
import type {
  احصاءاتالمعرفة,
  رابطمحرر,
  ملفمعرفةمحرر,
} from "../../types/agent-personality.types";

type KnowledgeBaseSectionProps = {
  files: ملفمعرفةمحرر[];
  urls: رابطمحرر[];
  directText: string;
  stats: احصاءاتالمعرفة;
  dragOver: boolean;
  fileBusy: boolean;
  fetchingUrlId: string;
  urlInput: string;
  formatFileSize: (size: number) => string;
  onSetDragOver: (value: boolean) => void;
  onDropFiles: (event: React.DragEvent<HTMLDivElement>) => void;
  onUploadFiles: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveFile: (id: string) => void;
  onSetUrlInput: (value: string) => void;
  onAddUrl: () => void;
  onFetchUrl: (entry: رابطمحرر) => Promise<void>;
  onRemoveUrl: (id: string) => void;
  onUpdateDirectText: (value: string) => void;
};

const KnowledgeBaseSection = ({
  files,
  urls,
  directText,
  stats,
  dragOver,
  fileBusy,
  fetchingUrlId,
  urlInput,
  formatFileSize,
  onSetDragOver,
  onDropFiles,
  onUploadFiles,
  onRemoveFile,
  onSetUrlInput,
  onAddUrl,
  onFetchUrl,
  onRemoveUrl,
  onUpdateDirectText,
}: KnowledgeBaseSectionProps) => {
  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-900/50 p-4">
      <h3 className="text-sm font-semibold text-slate-100">قاعدة المعرفة</h3>

      <div
        onDragOver={(event) => {
          event.preventDefault();
          onSetDragOver(true);
        }}
        onDragLeave={() => onSetDragOver(false)}
        onDrop={onDropFiles}
        className={`mt-3 rounded-2xl border-2 border-dashed p-4 text-center transition ${
          dragOver ? "border-emerald-400/70 bg-emerald-500/10" : "border-slate-700 bg-slate-950/60"
        }`}
      >
        <p className="text-sm text-slate-200">اسحب الملفات هنا أو اخترها يدويًا</p>
        <p className="mt-1 text-xs text-slate-400">PDF / DOCX / TXT / CSV / JSON بحد ١٠MB للملف و ٥٠MB إجمالي</p>
        <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-xs text-slate-200">
          <FileText className="h-3.5 w-3.5" />
          اختيار ملفات
          <input type="file" multiple accept=".pdf,.docx,.txt,.csv,.json" className="hidden" onChange={onUploadFiles} />
        </label>
        {fileBusy ? (
          <p className="mt-2 inline-flex items-center gap-2 text-xs text-emerald-200">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            جارٍ استخراج النص وتقسيمه...
          </p>
        ) : null}
      </div>

      <div className="mt-3 space-y-2">
        {files.map((file) => (
          <div
            key={file.id}
            className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-xs text-slate-300"
          >
            <span className="font-semibold text-slate-100">{file.name}</span>
            <span>{formatFileSize(file.size)}</span>
            <span>كلمات: {file.words}</span>
            <span>رموز: {file.tokens}</span>
            <span>أجزاء: {file.chunks}</span>
            <button type="button" onClick={() => onRemoveFile(file.id)} className="mr-auto rounded-md p-1 hover:bg-slate-800">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-xl border border-slate-700 bg-slate-950/60 p-3">
        <p className="text-xs text-slate-400">إضافة روابط</p>
        <div className="mt-2 flex gap-2">
          <input
            value={urlInput}
            onChange={(event) => onSetUrlInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                onAddUrl();
              }
            }}
            placeholder="https://example.com"
            className="min-h-[40px] flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3 text-xs text-slate-100"
          />
          <button type="button" onClick={onAddUrl} className="min-h-[40px] rounded-xl border border-slate-700 px-3 text-xs text-slate-200">
            إضافة
          </button>
        </div>

        <div className="mt-2 space-y-1">
          {urls.map((url) => (
            <div key={url.id} className="rounded-lg border border-slate-700 bg-slate-950/70 px-2 py-2 text-[11px] text-slate-300">
              <div className="flex items-center gap-2">
                <ArrowUpRight className="h-3.5 w-3.5" />
                <span className="flex-1 truncate">{url.url}</span>
                <button
                  type="button"
                  onClick={() => void onFetchUrl(url)}
                  disabled={fetchingUrlId === url.id}
                  className="rounded-md border border-slate-700 px-2 py-0.5 text-[11px]"
                >
                  {fetchingUrlId === url.id ? "جارٍ الجلب" : "جلب المحتوى"}
                </button>
                <button type="button" onClick={() => onRemoveUrl(url.id)} className="rounded-md p-0.5 hover:bg-slate-800">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="mt-1 flex items-center gap-3 text-slate-500">
                <span>الحالة: {url.status}</span>
                <span>كلمات: {url.words}</span>
                <span>رموز: {url.tokens}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <label className="mt-4 grid gap-1 text-xs text-slate-400">
        نص مباشر
        <textarea
          value={directText}
          onChange={(event) => onUpdateDirectText(event.target.value)}
          className="min-h-[120px] rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100"
          placeholder="أضف معلومات الشركة، السياسات، FAQ..."
        />
      </label>

      <div className="mt-3 grid gap-2 rounded-xl border border-slate-700 bg-slate-950/70 p-3 text-xs text-slate-300 sm:grid-cols-2">
        <div>
          إجمالي الكلمات: <strong className="text-slate-100">{stats.words}</strong>
        </div>
        <div>
          إجمالي الرموز: <strong className="text-slate-100">{stats.tokens}</strong>
        </div>
        <div>
          عدد المصادر: <strong className="text-slate-100">{stats.sources}</strong>
        </div>
        <div>
          آخر تحديث: <strong className="text-slate-100">{stats.updatedAt}</strong>
        </div>
      </div>
    </div>
  );
};

export default KnowledgeBaseSection;
