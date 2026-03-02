import type {
  ChangeEvent,
  Dispatch,
  KeyboardEvent,
  RefObject,
  SetStateAction,
} from "react";
import { Plus, Upload, X } from "lucide-react";
import { خياراتالايقونات, فئاتالوكلاء } from "../../constants/agent-builder.constants";
import type { حقلمسودةنصي, حالةالنموذج } from "../../types/agent-builder.types";

type BuilderStepBasicInfoProps = {
  form: حالةالنموذج;
  descriptionChars: number;
  nameInputRef: RefObject<HTMLInputElement | null>;
  descriptionInputRef: RefObject<HTMLTextAreaElement | null>;
  customCategoryInputRef: RefObject<HTMLInputElement | null>;
  scheduleTextDraftCommit: (field: حقلمسودةنصي, value: string, delayMs?: number) => void;
  flushTextDraft: (field: حقلمسودةنصي) => void;
  onChangeForm: (patch: Partial<حالةالنموذج>) => void;
  iconUploadRef: RefObject<HTMLInputElement | null>;
  onIconUpload: (event: ChangeEvent<HTMLInputElement>) => void;
  selectedIcon: (typeof خياراتالايقونات)[number];
  tagInput: string;
  onTagInputChange: Dispatch<SetStateAction<string>>;
  onAddTag: () => void;
  onRemoveTag: (tag: string) => void;
};

const BuilderStepBasicInfo = ({
  form,
  descriptionChars,
  nameInputRef,
  descriptionInputRef,
  customCategoryInputRef,
  scheduleTextDraftCommit,
  flushTextDraft,
  onChangeForm,
  iconUploadRef,
  onIconUpload,
  selectedIcon,
  tagInput,
  onTagInputChange,
  onAddTag,
  onRemoveTag,
}: BuilderStepBasicInfoProps) => {
  const handleTagInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      onAddTag();
    }
  };

  return (
    <div className="grid gap-5">
      <h2 className="text-xl font-bold text-slate-100">المعلومات الأساسية</h2>

      <div className="grid gap-2">
        <label className="text-sm text-slate-300">اسم الوكيل</label>
        <input
          ref={nameInputRef}
          defaultValue={form.الاسم}
          onChange={(event) => scheduleTextDraftCommit("الاسم", event.currentTarget.value)}
          onBlur={() => flushTextDraft("الاسم")}
          placeholder="مثال: مساعد خدمة العملاء"
          className="min-h-[46px] rounded-xl border border-slate-700 bg-slate-900/70 px-4 text-slate-100"
        />
        <p className="text-xs text-slate-400">٣ إلى ٥٠ حرف ({form.الاسم.length}/50)</p>
      </div>

      <div className="grid gap-2">
        <label className="text-sm text-slate-300">الوصف</label>
        <textarea
          ref={descriptionInputRef}
          defaultValue={form.الوصف}
          onChange={(event) => scheduleTextDraftCommit("الوصف", event.currentTarget.value)}
          onBlur={() => flushTextDraft("الوصف")}
          placeholder="اشرح ماذا يفعل الوكيل وما القيمة التي يقدّمها"
          className="min-h-[120px] rounded-xl border border-slate-700 bg-slate-900/70 px-4 py-3 text-slate-100"
        />
        <p className="text-xs text-slate-400">١٠ إلى ٥٠٠ حرف ({descriptionChars}/500)</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <label className="text-sm text-slate-300">الفئة</label>
          <select
            value={form.الفئة}
            onChange={(event) => onChangeForm({ الفئة: event.target.value })}
            className="min-h-[46px] rounded-xl border border-slate-700 bg-slate-900/70 px-3 text-slate-100"
          >
            {فئاتالوكلاء.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-2">
          <label className="text-sm text-slate-300">اللون الرئيسي</label>
          <div className="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-2">
            <input
              type="color"
              value={form.اللون}
              onChange={(event) => onChangeForm({ اللون: event.target.value })}
              className="h-9 w-11 cursor-pointer rounded-md border border-slate-700 bg-transparent"
            />
            <code className="text-xs text-slate-300">{form.اللون}</code>
          </div>
        </div>

        {form.الفئة === "أخرى (مخصصة)" ? (
          <div className="grid gap-2">
            <label className="text-sm text-slate-300">اسم الفئة المخصصة</label>
            <input
              ref={customCategoryInputRef}
              defaultValue={form.فئةمخصصة}
              onChange={(event) => scheduleTextDraftCommit("فئةمخصصة", event.currentTarget.value)}
              onBlur={() => flushTextDraft("فئةمخصصة")}
              placeholder="مثال: الامتثال القانوني"
              className="min-h-[46px] rounded-xl border border-slate-700 bg-slate-900/70 px-4 text-slate-100"
            />
          </div>
        ) : null}
      </div>

      <div className="grid gap-2">
        <label className="text-sm text-slate-300">أيقونة الوكيل</label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
          {خياراتالايقونات.map((item) => {
            const Icon = item.icon;
            const active = form.الايقونة === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onChangeForm({ الايقونة: item.id, صورةايقونة: "" })}
                className={`rounded-xl border px-2 py-3 text-center transition ${
                  active
                    ? "border-emerald-400/60 bg-emerald-500/10 text-emerald-200"
                    : "border-slate-700 bg-slate-900/60 text-slate-300"
                }`}
              >
                <Icon className="mx-auto h-4 w-4" />
                <span className="mt-1 block text-[11px]">{item.label}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => iconUploadRef.current?.click()}
            className="inline-flex min-h-[40px] items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/70 px-3 text-xs text-slate-200"
          >
            <Upload className="h-3.5 w-3.5" />
            رفع صورة مخصصة
          </button>
          <input
            ref={iconUploadRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onIconUpload}
          />

          <div className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-2">
            {form.صورةايقونة ? (
              <img src={form.صورةايقونة} alt="أيقونة مخصصة" className="h-7 w-7 rounded-lg object-cover" />
            ) : (
              <selectedIcon.icon className="h-4 w-4 text-emerald-300" />
            )}
            <span className="text-xs text-slate-300">المعاينة الحالية</span>
          </div>
        </div>
      </div>

      <div className="grid gap-2">
        <label className="text-sm text-slate-300">الوسوم</label>
        <div className="flex flex-wrap gap-2">
          {form.الوسوم.map((tag) => (
            <span key={tag} className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-200">
              {tag}
              <button
                type="button"
                onClick={() => onRemoveTag(tag)}
                className="rounded-full p-0.5 hover:bg-slate-900/40"
                aria-label="حذف الوسم"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            value={tagInput}
            onChange={(event) => onTagInputChange(event.target.value)}
            onKeyDown={handleTagInputKeyDown}
            placeholder="أضف وسمًا ثم اضغط إدخال"
            className="min-h-[44px] flex-1 rounded-xl border border-slate-700 bg-slate-900/70 px-3 text-sm text-slate-100"
          />
          <button
            type="button"
            onClick={onAddTag}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/70 px-3 text-sm text-slate-200"
          >
            <Plus className="h-4 w-4" />
            إضافة
          </button>
        </div>
      </div>
    </div>
  );
};

export default BuilderStepBasicInfo;
