import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { Node } from "reactflow";
import { WorkflowNodeData } from "./CustomNodes";

type NodeEditorProps = {
  open: boolean;
  node: Node<WorkflowNodeData> | null;
  onClose: () => void;
  onSave: (id: string, data: WorkflowNodeData) => void;
  variables?: string[];
};

type FieldError = {
  field: string;
  message: string;
};

const variableOptions = [
  { key: "userMessage", label: "رسالة المستخدم", token: "رسالة_المستخدم" },
  { key: "last_output", label: "آخر مخرجات", token: "آخر_مخرجات" },
  { key: "company", label: "اسم الشركة", token: "اسم_الشركة" },
  { key: "plan", label: "الخطة الحالية", token: "الخطة" },
];

const NodeEditor = ({ open, node, onClose, onSave, variables }: NodeEditorProps) => {
  const [draft, setDraft] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<FieldError[]>([]);

  useEffect(() => {
    if (node) {
      setDraft({
        label: node.data.label || "",
        description: node.data.description || "",
        ...(node.data.config || {}),
      });
      setErrors([]);
    }
  }, [node]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  const activeVariables = variableOptions;

  const updateField = (key: string, value: unknown) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const addCondition = () => {
    setDraft((prev) => {
      const current = Array.isArray(prev.conditions) ? prev.conditions : [];
      return {
        ...prev,
        conditions: [
          ...current,
          { variable: "", operator: "equals", value: "" },
        ],
      };
    });
  };

  const updateCondition = (index: number, patch: Record<string, unknown>) => {
    setDraft((prev) => {
      const current = Array.isArray(prev.conditions) ? prev.conditions : [];
      const next = current.map((item, idx) =>
        idx === index ? { ...item, ...patch } : item
      );
      return { ...prev, conditions: next };
    });
  };

  const removeCondition = (index: number) => {
    setDraft((prev) => {
      const current = Array.isArray(prev.conditions) ? prev.conditions : [];
      const next = current.filter((_, idx) => idx !== index);
      return { ...prev, conditions: next };
    });
  };

  const insertVariable = (key: string, token: string) => {
    const current = String(draft[key] || "");
    updateField(key, `${current} {{${token}}}`.trim());
  };

  const validation = useMemo(() => {
    const nextErrors: FieldError[] = [];
    if (!String(draft.label || "").trim()) {
      nextErrors.push({ field: "label", message: "اسم العقدة مطلوب." });
    }
    if (node?.type === "prompt" || node?.type === "groq") {
      if (!String(draft.text || "").trim()) {
        nextErrors.push({ field: "text", message: "المحتوى النصي مطلوب." });
      }
    }
    if (node?.type === "condition") {
      if (
        !Array.isArray(draft.conditions) ||
        (draft.conditions as []).length === 0
      ) {
        nextErrors.push({
          field: "conditions",
          message: "يجب تحديد شرط واحد على الأقل.",
        });
      }
    }
    if (node?.type === "action") {
      if (!String(draft.actionType || "").trim()) {
        nextErrors.push({
          field: "actionType",
          message: "نوع الإجراء مطلوب.",
        });
      }
    }
    if (node?.type === "output") {
      if (!String(draft.template || "").trim()) {
        nextErrors.push({
          field: "template",
          message: "قالب المخرجات مطلوب.",
        });
      }
    }
    return nextErrors;
  }, [draft, node?.type]);

  const handleSave = () => {
    if (!node) {
      return;
    }
    if (validation.length > 0) {
      setErrors(validation);
      return;
    }
    const updated: WorkflowNodeData = {
      ...node.data,
      label: String(draft.label || ""),
      description: String(draft.description || ""),
      summary: buildSummary(node.type, draft),
      config: {
        ...normalizeDraft(draft),
      },
    };
    onSave(node.id, updated);
    onClose();
  };

  const previewText = useMemo(() => {
    const template = String(draft.template || draft.text || "");
    if (!template) {
      return "لا توجد معاينة حالياً.";
    }
    return template.replace(/\{\{(.*?)\}\}/g, (_, key) => {
      const token = String(key).trim();
      return `«${token}»`;
    });
  }, [draft]);

  if (!open || !node) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-8"
      role="dialog"
      aria-modal="true"
      aria-label="تحرير العقدة"
    >
      <div className="auth-card w-full max-w-4xl rounded-3xl p-6 text-slate-100">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-emerald-300">تحرير العقدة</p>
            <h2 className="text-xl font-bold">{node.data.label}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-100"
            aria-label="إغلاق التحرير"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold">اسم العقدة</label>
              <input
                className="auth-field rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-2 text-sm"
                value={String(draft.label || "")}
                onChange={(event) => updateField("label", event.target.value)}
                placeholder="أدخل اسم العقدة"
              />
              {errors.find((error) => error.field === "label") ? (
                <p className="text-xs text-red-300">
                  {errors.find((error) => error.field === "label")?.message}
                </p>
              ) : null}
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold">وصف مختصر</label>
              <input
                className="auth-field rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-2 text-sm"
                value={String(draft.description || "")}
                onChange={(event) => updateField("description", event.target.value)}
                placeholder="وصف يظهر في العقدة"
              />
            </div>

            {node.type === "input" ? (
              <>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold">قيمة افتراضية</label>
                  <input
                    className="auth-field rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-2 text-sm"
                    value={String(draft.defaultValue || "")}
                    onChange={(event) => updateField("defaultValue", event.target.value)}
                    placeholder="القيمة الافتراضية للمدخل"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold">قواعد التحقق</label>
                  <input
                    className="auth-field rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-2 text-sm"
                    value={String(draft.validation || "")}
                    onChange={(event) => updateField("validation", event.target.value)}
                    placeholder="مثال: مطلوب، رقم، بريد"
                  />
                </div>
              </>
            ) : null}

            {node.type === "prompt" || node.type === "groq" ? (
              <>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold">
                    النص الأساسي
                    <span className="text-xs text-slate-400" title="يمكنك استخدام المتغيرات بين أقواس مزدوجة">
                      {" "}
                      (يدعم المتغيرات)
                    </span>
                  </label>
                  <textarea
                    className="auth-field min-h-[120px] rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-2 text-sm"
                    value={String(draft.text || "")}
                    onChange={(event) => updateField("text", event.target.value)}
                    placeholder="اكتب الموجه أو التعليمات هنا"
                  />
                  {errors.find((error) => error.field === "text") ? (
                    <p className="text-xs text-red-300">
                      {errors.find((error) => error.field === "text")?.message}
                    </p>
                  ) : null}
                  <div className="flex flex-wrap gap-2">
                    {activeVariables.map((variable) => (
                      <button
                        key={variable.token}
                        type="button"
                        onClick={() => insertVariable("text", variable.token)}
                        className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300 hover:border-emerald-400/60 hover:text-emerald-300"
                      >
                        {variable.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {templateSuggestions.map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => updateField("text", suggestion)}
                        className="rounded-full border border-slate-800 px-3 py-1 text-xs text-slate-300 hover:border-emerald-400/60 hover:text-emerald-300"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            ) : null}

            {node.type === "instruction" ? (
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold">تعليمات النظام</label>
                <textarea
                  className="auth-field min-h-[120px] rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-2 text-sm"
                  value={String(draft.text || "")}
                  onChange={(event) => updateField("text", event.target.value)}
                  placeholder="اكتب التعليمات التي توجه سلوك الوكيل"
                />
              </div>
            ) : null}

            {node.type === "condition" ? (
              <div className="flex flex-col gap-3">
                <label className="text-sm font-semibold">شروط التفرع</label>
                <div className="flex flex-col gap-3">
                  {(Array.isArray(draft.conditions) ? draft.conditions : []).map(
                    (condition, index) => (
                      <div
                        key={`cond-${index}`}
                        className="rounded-xl border border-slate-800 bg-slate-950/50 p-3"
                      >
                        <div className="grid gap-3 md:grid-cols-3">
                          <div className="flex flex-col gap-2">
                            <label className="text-xs text-slate-400">
                              المتغير
                            </label>
                            <select
                              className="auth-field rounded-xl border border-slate-800 bg-slate-950/50 px-2 py-2 text-xs"
                              value={String((condition as any).variable || "")}
                              onChange={(event) =>
                                updateCondition(index, {
                                  variable: event.target.value,
                                })
                              }
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
                            <label className="text-xs text-slate-400">
                              العامل
                            </label>
                            <select
                              className="auth-field rounded-xl border border-slate-800 bg-slate-950/50 px-2 py-2 text-xs"
                              value={String((condition as any).operator || "equals")}
                              onChange={(event) =>
                                updateCondition(index, {
                                  operator: event.target.value,
                                })
                              }
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
                            <label className="text-xs text-slate-400">
                              القيمة
                            </label>
                            <input
                              className="auth-field rounded-xl border border-slate-800 bg-slate-950/50 px-2 py-2 text-xs"
                              value={String((condition as any).value || "")}
                              onChange={(event) =>
                                updateCondition(index, {
                                  value: event.target.value,
                                })
                              }
                              placeholder="أدخل القيمة"
                            />
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeCondition(index)}
                          className="mt-2 text-xs text-red-300 hover:text-red-200"
                        >
                          حذف الشرط
                        </button>
                      </div>
                    )
                  )}
                  <button
                    type="button"
                    onClick={addCondition}
                    className="rounded-xl border border-emerald-400/40 px-3 py-2 text-xs text-emerald-300 hover:border-emerald-300"
                  >
                    إضافة شرط جديد
                  </button>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs text-slate-400">
                      طريقة الربط بين الشروط
                    </label>
                    <select
                      className="auth-field rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-2 text-xs"
                      value={String(draft.conditionOperator || "AND")}
                      onChange={(event) =>
                        updateField("conditionOperator", event.target.value)
                      }
                    >
                      <option value="AND">تطابق جميع الشروط</option>
                      <option value="OR">تطابق شرط واحد</option>
                    </select>
                    <p className="text-xs text-slate-400">
                      يتم توجيه المخرجات إلى مسار صحيح أو خطأ بناءً على النتيجة.
                    </p>
                  </div>
                </div>
                {errors.find((error) => error.field === "conditions") ? (
                  <p className="text-xs text-red-300">
                    {errors.find((error) => error.field === "conditions")?.message}
                  </p>
                ) : null}
              </div>
            ) : null}

            {node.type === "groq" ? (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold">النموذج</label>
                    <select
                      className="auth-field rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-2 text-sm"
                      value={String(draft.model || "llama-3.1-70b-versatile")}
                      onChange={(event) => updateField("model", event.target.value)}
                    >
                      <option value="llama-3.1-405b-reasoning">لاما ٤٠٥ استدلال</option>
                      <option value="llama-3.1-70b-versatile">لاما ٧٠ متعدد</option>
                      <option value="llama-3.1-8b-instant">لاما ٨ سريع</option>
                      <option value="mixtral-8x7b-32768">ميكسترال ٨×٧بي</option>
                      <option value="gemma2-9b-it">جيما ٢</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold">الحد الأعلى للرموز</label>
                  <input
                    type="number"
                    className="auth-field rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-2 text-sm"
                    value={String(draft.max_tokens || 800)}
                    onChange={(event) => updateField("max_tokens", Number(event.target.value))}
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold">درجة الإبداع</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={Number(draft.temperature || 0.4)}
                    onChange={(event) => updateField("temperature", Number(event.target.value))}
                    className="w-full"
                  />
                  <div className="text-xs text-slate-400">
                    القيمة الحالية: {Number(draft.temperature || 0.4).toFixed(2)}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold">نص النظام</label>
                  <textarea
                    className="auth-field min-h-[80px] rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-2 text-sm"
                    value={String(draft.systemPrompt || "")}
                    onChange={(event) => updateField("systemPrompt", event.target.value)}
                    placeholder="أضف تعليمات خاصة للنموذج"
                  />
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-xs text-slate-300">
                  التكلفة التقديرية: {formatCost(estimateTokens(draft))} دولار أمريكي
                </div>
              </>
            ) : null}

            {node.type === "action" ? (
              <>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold">نوع الإجراء</label>
                  <select
                    className="auth-field rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-2 text-sm"
                    value={String(draft.actionType || "http")}
                    onChange={(event) => updateField("actionType", event.target.value)}
                  >
                    <option value="http">نداء ويب</option>
                    <option value="database">قاعدة بيانات</option>
                    <option value="transform">تحويل بيانات</option>
                    <option value="compute">حساب داخلي</option>
                  </select>
                  {errors.find((error) => error.field === "actionType") ? (
                    <p className="text-xs text-red-300">
                      {errors.find((error) => error.field === "actionType")?.message}
                    </p>
                  ) : null}
                </div>
                {String(draft.actionType || "http") === "http" ? (
                  <>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold">رابط الطلب</label>
                      <input
                        className="auth-field rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-2 text-sm"
                        value={String(draft.url || "")}
                        onChange={(event) => updateField("url", event.target.value)}
                        placeholder="أدخل رابط الواجهة"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold">طريقة الطلب</label>
                      <select
                        className="auth-field rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-2 text-sm"
                        value={String(draft.method || "POST")}
                        onChange={(event) => updateField("method", event.target.value)}
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
                        onChange={(event) => updateField("headers", event.target.value)}
                        placeholder="أدخل الترويسات المطلوبة"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold">بيانات الطلب</label>
                      <textarea
                        className="auth-field min-h-[80px] rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-2 text-sm"
                        value={String(draft.payload || "")}
                        onChange={(event) => updateField("payload", event.target.value)}
                        placeholder="أدخل بيانات الطلب أو الجسم"
                      />
                    </div>
                  </>
                ) : null}

                {String(draft.actionType || "") === "database" ? (
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold">استعلام البيانات</label>
                    <textarea
                      className="auth-field min-h-[90px] rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-2 text-sm"
                      value={String(draft.query || "")}
                      onChange={(event) => updateField("query", event.target.value)}
                      placeholder="اكتب الاستعلام المطلوب"
                    />
                  </div>
                ) : null}

                {String(draft.actionType || "") === "transform" ? (
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold">قواعد التحويل</label>
                    <textarea
                      className="auth-field min-h-[90px] rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-2 text-sm"
                      value={String(draft.transformRules || "")}
                      onChange={(event) => updateField("transformRules", event.target.value)}
                      placeholder="اكتب تعليمات التحويل"
                    />
                  </div>
                ) : null}

                {String(draft.actionType || "") === "compute" ? (
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold">معادلة الحساب</label>
                    <input
                      className="auth-field rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-2 text-sm"
                      value={String(draft.expression || "")}
                      onChange={(event) => updateField("expression", event.target.value)}
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
            ) : null}

            {node.type === "output" ? (
              <>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold">صيغة المخرجات</label>
                  <select
                    className="auth-field rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-2 text-sm"
                    value={String(draft.format || "text")}
                    onChange={(event) => updateField("format", event.target.value)}
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
                    onChange={(event) => updateField("template", event.target.value)}
                    placeholder="اكتب قالب المخرجات"
                  />
                  {errors.find((error) => error.field === "template") ? (
                    <p className="text-xs text-red-300">
                      {errors.find((error) => error.field === "template")?.message}
                    </p>
                  ) : null}
                  <div className="flex flex-wrap gap-2">
                    {activeVariables.map((variable) => (
                      <button
                        key={variable.token}
                        type="button"
                        onClick={() => insertVariable("template", variable.token)}
                        className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300 hover:border-emerald-400/60 hover:text-emerald-300"
                      >
                        {variable.label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            ) : null}

            {node.type === "loop" ? (
              <>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold">عدد التكرارات</label>
                  <input
                    type="number"
                    className="auth-field rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-2 text-sm"
                    value={String(draft.iterations || 1)}
                    onChange={(event) => updateField("iterations", Number(event.target.value))}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold">اسم القائمة</label>
                  <input
                    className="auth-field rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-2 text-sm"
                    value={String(draft.itemsVar || "")}
                    onChange={(event) => updateField("itemsVar", event.target.value)}
                    placeholder="مثال: عناصر_القائمة"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold">قالب التكرار</label>
                  <textarea
                    className="auth-field min-h-[80px] rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-2 text-sm"
                    value={String(draft.template || "")}
                    onChange={(event) => updateField("template", event.target.value)}
                    placeholder="اكتب ما يجب تنفيذه لكل عنصر"
                  />
                </div>
              </>
            ) : null}

            {node.type === "variable" ? (
              <>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold">عملية المتغير</label>
                  <select
                    className="auth-field rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-2 text-sm"
                    value={String(draft.operation || "set")}
                    onChange={(event) => updateField("operation", event.target.value)}
                  >
                    <option value="set">تخزين قيمة</option>
                    <option value="get">قراءة قيمة</option>
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold">اسم المتغير</label>
                  <input
                    className="auth-field rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-2 text-sm"
                    value={String(draft.key || "")}
                    onChange={(event) => updateField("key", event.target.value)}
                    placeholder="اسم المتغير"
                  />
                </div>
                {String(draft.operation || "set") === "set" ? (
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold">قيمة المتغير</label>
                    <input
                      className="auth-field rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-2 text-sm"
                      value={String(draft.value || "")}
                      onChange={(event) => updateField("value", event.target.value)}
                      placeholder="أدخل قيمة المتغير"
                    />
                  </div>
                ) : null}
              </>
            ) : null}
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
            <p className="text-sm font-semibold text-emerald-300">معاينة سريعة</p>
            <p className="mt-3 text-xs text-slate-300">{previewText}</p>
            <div className="mt-6 space-y-2 text-xs text-slate-400">
              <p className="font-semibold text-slate-200">إرشادات سريعة</p>
              <p>انقر مرتين على العقدة لفتح التحرير.</p>
              <p>استخدم المتغيرات بين أقواس مزدوجة.</p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:border-slate-500"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="rounded-xl bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-300"
          >
            حفظ التعديلات
          </button>
        </div>
      </div>
    </div>
  );
};

const buildSummary = (type: string | undefined, draft: Record<string, unknown>) => {
  if (!type) {
    return "";
  }
  if (type === "input") {
    return `قيمة افتراضية: ${draft.defaultValue || "غير محددة"}`;
  }
  if (type === "prompt") {
    return "موجه نصي مخصص للتنفيذ.";
  }
  if (type === "condition") {
    const count = Array.isArray(draft.conditions) ? draft.conditions.length : 0;
    return `عدد الشروط: ${count}`;
  }
  if (type === "groq") {
    return `نموذج: ${formatModelLabel(String(draft.model || ""))}`;
  }
  if (type === "action") {
    return `نوع الإجراء: ${formatActionLabel(String(draft.actionType || ""))}`;
  }
  if (type === "output") {
    return `صيغة المخرجات: ${formatOutputLabel(String(draft.format || ""))}`;
  }
  if (type === "loop") {
    return `عدد التكرارات: ${draft.iterations || "غير محدد"}`;
  }
  if (type === "variable") {
    return `المتغير: ${draft.key || "غير محدد"}`;
  }
  return "";
};

const templateSuggestions = [
  "قدم ملخصاً تنفيذياً عن الطلب التالي: {{رسالة_المستخدم}}",
  "صغ تقريراً مختصراً مع توصيات قابلة للتنفيذ بناءً على {{آخر_مخرجات}}",
  "أعد صياغة المدخل بأسلوب رسمي لإرساله للإدارة العليا.",
];

const normalizeDraft = (draft: Record<string, unknown>) => {
  const normalized = { ...draft };
  ["text", "template", "systemPrompt", "payload"].forEach((key) => {
    if (typeof normalized[key] === "string") {
      normalized[key] = normalizeTemplateText(normalized[key] as string);
    }
  });
  return normalized;
};

const normalizeTemplateText = (value: string) => {
  let result = value;
  variableOptions.forEach((variable) => {
    const pattern = new RegExp(`\\{\\{\\s*${variable.token}\\s*\\}\\}`, "g");
    result = result.replace(pattern, `{{${variable.key}}}`);
  });
  return result;
};

const formatModelLabel = (model: string) => {
  const mapping: Record<string, string> = {
    "llama-3.1-405b-reasoning": "لاما ٤٠٥ استدلال",
    "llama-3.1-70b-versatile": "لاما ٧٠ متعدد",
    "llama-3.1-8b-instant": "لاما ٨ سريع",
    "mixtral-8x7b-32768": "ميكسترال ٨×٧بي",
    "gemma2-9b-it": "جيما ٢",
  };
  return mapping[model] || "غير محدد";
};

const formatActionLabel = (value: string) => {
  const mapping: Record<string, string> = {
    http: "نداء ويب",
    database: "قاعدة بيانات",
    transform: "تحويل بيانات",
    compute: "حساب داخلي",
  };
  return mapping[value] || "غير محدد";
};

const formatOutputLabel = (value: string) => {
  const mapping: Record<string, string> = {
    text: "نص",
    json: "جيسون",
    file: "ملف",
    webhook: "ويب هوك",
  };
  return mapping[value] || "نص";
};

const estimateTokens = (draft: Record<string, unknown>) => {
  const base = `${draft.text || ""} ${draft.systemPrompt || ""}`;
  return Math.max(1, Math.ceil(base.length / 4));
};

const formatCost = (tokens: number) => {
  const rate = 0;
  const cost = (tokens / 1000) * rate;
  return cost.toLocaleString("ar-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};


export default NodeEditor;
