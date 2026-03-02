type NodeEditorPreviewPanelProps = {
  previewText: string;
};

const NodeEditorPreviewPanel = ({ previewText }: NodeEditorPreviewPanelProps) => {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
      <p className="text-sm font-semibold text-emerald-300">معاينة سريعة</p>
      <p className="mt-3 text-xs text-slate-300">{previewText}</p>
      <div className="mt-6 space-y-2 text-xs text-slate-400">
        <p className="font-semibold text-slate-200">إرشادات سريعة</p>
        <p>انقر مرتين على العقدة لفتح التحرير.</p>
        <p>استخدم المتغيرات بين أقواس مزدوجة.</p>
      </div>
    </div>
  );
};

export default NodeEditorPreviewPanel;
