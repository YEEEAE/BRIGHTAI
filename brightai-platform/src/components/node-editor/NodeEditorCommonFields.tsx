import type { FieldError, NodeDraft } from "../../types/node-editor.types";

type NodeEditorCommonFieldsProps = {
  draft: NodeDraft;
  errors: FieldError[];
  onUpdateField: (key: string, value: unknown) => void;
};

const NodeEditorCommonFields = ({ draft, errors, onUpdateField }: NodeEditorCommonFieldsProps) => {
  const labelError = errors.find((error) => error.field === "label")?.message;

  return (
    <>
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold">اسم العقدة</label>
        <input
          className="auth-field rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-2 text-sm"
          value={String(draft.label || "")}
          onChange={(event) => onUpdateField("label", event.target.value)}
          placeholder="أدخل اسم العقدة"
        />
        {labelError ? <p className="text-xs text-red-300">{labelError}</p> : null}
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold">وصف مختصر</label>
        <input
          className="auth-field rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-2 text-sm"
          value={String(draft.description || "")}
          onChange={(event) => onUpdateField("description", event.target.value)}
          placeholder="وصف يظهر في العقدة"
        />
      </div>
    </>
  );
};

export default NodeEditorCommonFields;
