import type { NodeDraft } from "../../types/node-editor.types";

type NodeInputFieldsProps = {
  draft: NodeDraft;
  onUpdateField: (key: string, value: unknown) => void;
};

const NodeInputFields = ({ draft, onUpdateField }: NodeInputFieldsProps) => {
  return (
    <>
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold">قيمة افتراضية</label>
        <input
          className="auth-field rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-2 text-sm"
          value={String(draft.defaultValue || "")}
          onChange={(event) => onUpdateField("defaultValue", event.target.value)}
          placeholder="القيمة الافتراضية للمدخل"
        />
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold">قواعد التحقق</label>
        <input
          className="auth-field rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-2 text-sm"
          value={String(draft.validation || "")}
          onChange={(event) => onUpdateField("validation", event.target.value)}
          placeholder="مثال: مطلوب، رقم، بريد"
        />
      </div>
    </>
  );
};

export default NodeInputFields;
