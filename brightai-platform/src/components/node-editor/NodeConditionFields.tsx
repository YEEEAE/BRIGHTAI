import type { FieldError, NodeDraft, VariableOption } from "../../types/node-editor.types";

type NodeConditionFieldsProps = {
  draft: NodeDraft;
  errors: FieldError[];
  activeVariables: VariableOption[];
  onAddCondition: () => void;
  onUpdateCondition: (index: number, patch: Record<string, unknown>) => void;
  onRemoveCondition: (index: number) => void;
  onUpdateField: (key: string, value: unknown) => void;
};

const NodeConditionFields = ({
  draft,
  errors,
  activeVariables,
  onAddCondition,
  onUpdateCondition,
  onRemoveCondition,
  onUpdateField,
}: NodeConditionFieldsProps) => {
  const conditions = Array.isArray(draft.conditions) ? draft.conditions : [];
  const conditionError = errors.find((error) => error.field === "conditions")?.message;

  return (
    <div className="flex flex-col gap-3">
      <label className="text-sm font-semibold">شروط التفرع</label>
      <div className="flex flex-col gap-3">
        {conditions.map((condition, index) => (
          <div key={`cond-${index}`} className="rounded-xl border border-slate-800 bg-slate-950/50 p-3">
            <div className="grid gap-3 md:grid-cols-3">
              <div className="flex flex-col gap-2">
                <label className="text-xs text-slate-400">المتغير</label>
                <select
                  className="auth-field rounded-xl border border-slate-800 bg-slate-950/50 px-2 py-2 text-xs"
                  value={String((condition as Record<string, unknown>).variable || "")}
                  onChange={(event) => onUpdateCondition(index, { variable: event.target.value })}
                >
                  <option value="">اختر متغيراً</option>
                  {activeVariables.map((variable) => (
                    <option key={variable.key} value={variable.key}>
                      {variable.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs text-slate-400">العامل</label>
                <select
                  className="auth-field rounded-xl border border-slate-800 bg-slate-950/50 px-2 py-2 text-xs"
                  value={String((condition as Record<string, unknown>).operator || "equals")}
                  onChange={(event) => onUpdateCondition(index, { operator: event.target.value })}
                >
                  <option value="equals">يساوي</option>
                  <option value="not_equals">لا يساوي</option>
                  <option value="includes">يحتوي على</option>
                  <option value="greater_than">أكبر من</option>
                  <option value="less_than">أقل من</option>
                  <option value="exists">موجود</option>
                  <option value="not_exists">غير موجود</option>
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs text-slate-400">القيمة</label>
                <input
                  className="auth-field rounded-xl border border-slate-800 bg-slate-950/50 px-2 py-2 text-xs"
                  value={String((condition as Record<string, unknown>).value || "")}
                  onChange={(event) => onUpdateCondition(index, { value: event.target.value })}
                  placeholder="أدخل القيمة"
                />
              </div>
            </div>
            <button type="button" onClick={() => onRemoveCondition(index)} className="mt-2 text-xs text-red-300 hover:text-red-200">
              حذف الشرط
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={onAddCondition}
          className="rounded-xl border border-emerald-400/40 px-3 py-2 text-xs text-emerald-300 hover:border-emerald-300"
        >
          إضافة شرط جديد
        </button>

        <div className="flex flex-col gap-2">
          <label className="text-xs text-slate-400">طريقة الربط بين الشروط</label>
          <select
            className="auth-field rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-2 text-xs"
            value={String(draft.conditionOperator || "AND")}
            onChange={(event) => onUpdateField("conditionOperator", event.target.value)}
          >
            <option value="AND">تطابق جميع الشروط</option>
            <option value="OR">تطابق شرط واحد</option>
          </select>
          <p className="text-xs text-slate-400">يتم توجيه المخرجات إلى مسار صحيح أو خطأ بناءً على النتيجة.</p>
        </div>
      </div>

      {conditionError ? <p className="text-xs text-red-300">{conditionError}</p> : null}
    </div>
  );
};

export default NodeConditionFields;
