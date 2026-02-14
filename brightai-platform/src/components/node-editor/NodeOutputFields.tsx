import type { FieldError, NodeDraft, VariableOption } from "../../types/node-editor.types";
import VariableChips from "./VariableChips";

type NodeOutputFieldsProps = {
  draft: NodeDraft;
  errors: FieldError[];
  activeVariables: VariableOption[];
  onUpdateField: (key: string, value: unknown) => void;
  onInsertVariable: (key: string, token: string) => void;
};

const NodeOutputFields = ({
  draft,
  errors,
  activeVariables,
  onUpdateField,
  onInsertVariable,
}: NodeOutputFieldsProps) => {
  const templateError = errors.find((error) => error.field === "template")?.message;

  return (
    <>
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold">صيغة المخرجات</label>
        <select
          className="auth-field rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-2 text-sm"
          value={String(draft.format || "text")}
          onChange={(event) => onUpdateField("format", event.target.value)}
        >
          <option value="text">نص</option>
          <option value="json">جيسون</option>
          <option value="file">ملف</option>
          <option value="webhook">ويب هوك</option>
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold">قالب المخرجات</label>
        <textarea
          className="auth-field min-h-[100px] rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-2 text-sm"
          value={String(draft.template || "")}
          onChange={(event) => onUpdateField("template", event.target.value)}
          placeholder="اكتب قالب المخرجات"
        />
        {templateError ? <p className="text-xs text-red-300">{templateError}</p> : null}
        <VariableChips variables={activeVariables} onInsert={(token) => onInsertVariable("template", token)} />
      </div>
    </>
  );
};

export default NodeOutputFields;
