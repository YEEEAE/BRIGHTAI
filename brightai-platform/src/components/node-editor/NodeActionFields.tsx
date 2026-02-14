import type { FieldError, NodeDraft } from "../../types/node-editor.types";

type NodeActionFieldsProps = {
  draft: NodeDraft;
  errors: FieldError[];
  onUpdateField: (key: string, value: unknown) => void;
};

const NodeActionFields = ({ draft, errors, onUpdateField }: NodeActionFieldsProps) => {
  const actionError = errors.find((error) => error.field === "actionType")?.message;
  const actionType = String(draft.actionType || "http");

  return (
    <>
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold">نوع الإجراء</label>
        <select
          className="auth-field rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-2 text-sm"
          value={actionType}
          onChange={(event) => onUpdateField("actionType", event.target.value)}
        >
          <option value="http">نداء ويب</option>
          <option value="database">قاعدة بيانات</option>
          <option value="transform">تحويل بيانات</option>
          <option value="compute">حساب داخلي</option>
        </select>
        {actionError ? <p className="text-xs text-red-300">{actionError}</p> : null}
      </div>

      {actionType === "http" ? (
        <>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold">رابط الطلب</label>
            <input
              className="auth-field rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-2 text-sm"
              value={String(draft.url || "")}
              onChange={(event) => onUpdateField("url", event.target.value)}
              placeholder="أدخل رابط الواجهة"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold">طريقة الطلب</label>
            <select
              className="auth-field rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-2 text-sm"
              value={String(draft.method || "POST")}
              onChange={(event) => onUpdateField("method", event.target.value)}
            >
              <option value="GET">جلب</option>
              <option value="POST">إرسال</option>
              <option value="PUT">تحديث</option>
              <option value="DELETE">حذف</option>
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold">الترويسات</label>
            <textarea
              className="auth-field min-h-[70px] rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-2 text-sm"
              value={String(draft.headers || "")}
              onChange={(event) => onUpdateField("headers", event.target.value)}
              placeholder="أدخل الترويسات المطلوبة"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold">بيانات الطلب</label>
            <textarea
              className="auth-field min-h-[80px] rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-2 text-sm"
              value={String(draft.payload || "")}
              onChange={(event) => onUpdateField("payload", event.target.value)}
              placeholder="أدخل بيانات الطلب أو الجسم"
            />
          </div>
        </>
      ) : null}

      {actionType === "database" ? (
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold">استعلام البيانات</label>
          <textarea
            className="auth-field min-h-[90px] rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-2 text-sm"
            value={String(draft.query || "")}
            onChange={(event) => onUpdateField("query", event.target.value)}
            placeholder="اكتب الاستعلام المطلوب"
          />
        </div>
      ) : null}

      {actionType === "transform" ? (
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold">قواعد التحويل</label>
          <textarea
            className="auth-field min-h-[90px] rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-2 text-sm"
            value={String(draft.transformRules || "")}
            onChange={(event) => onUpdateField("transformRules", event.target.value)}
            placeholder="اكتب تعليمات التحويل"
          />
        </div>
      ) : null}

      {actionType === "compute" ? (
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold">معادلة الحساب</label>
          <input
            className="auth-field rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-2 text-sm"
            value={String(draft.expression || "")}
            onChange={(event) => onUpdateField("expression", event.target.value)}
            placeholder="اكتب معادلة الحساب"
          />
        </div>
      ) : null}

      <button
        type="button"
        className="rounded-xl border border-emerald-400/40 px-4 py-2 text-sm text-emerald-300 hover:border-emerald-300"
      >
        اختبار الإجراء
      </button>
    </>
  );
};

export default NodeActionFields;
