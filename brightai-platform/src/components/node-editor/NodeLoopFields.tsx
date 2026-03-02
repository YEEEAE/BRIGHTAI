import type { NodeDraft } from "../../types/node-editor.types";

type NodeLoopFieldsProps = {
  draft: NodeDraft;
  onUpdateField: (key: string, value: unknown) => void;
};

const NodeLoopFields = ({ draft, onUpdateField }: NodeLoopFieldsProps) => {
  return (
    <>
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold">عدد التكرارات</label>
        <input
          type="number"
          className="auth-field rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-2 text-sm"
          value={String(draft.iterations || 1)}
          onChange={(event) => onUpdateField("iterations", Number(event.target.value))}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold">اسم القائمة</label>
        <input
          className="auth-field rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-2 text-sm"
          value={String(draft.itemsVar || "")}
          onChange={(event) => onUpdateField("itemsVar", event.target.value)}
          placeholder="مثال: عناصر_القائمة"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold">قالب التكرار</label>
        <textarea
          className="auth-field min-h-[80px] rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-2 text-sm"
          value={String(draft.template || "")}
          onChange={(event) => onUpdateField("template", event.target.value)}
          placeholder="اكتب ما يجب تنفيذه لكل عنصر"
        />
      </div>
    </>
  );
};

export default NodeLoopFields;
