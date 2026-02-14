import Button from "../ui/Button";
import Input from "../ui/Input";
import Select, { type SelectOption } from "../ui/Select";
import Modal from "../ui/Modal";
import type { PublishForm } from "../../types/marketplace.types";

type MarketplacePublishModalProps = {
  open: boolean;
  form: PublishForm;
  categoryOptions: SelectOption[];
  onClose: () => void;
  onSubmit: () => void;
  onChangeForm: (patch: Partial<PublishForm>) => void;
};

const MarketplacePublishModal = ({
  open,
  form,
  categoryOptions,
  onClose,
  onSubmit,
  onChangeForm,
}: MarketplacePublishModalProps) => {
  return (
    <Modal open={open} onClose={onClose} title="نشر وكيل في السوق" size="lg">
      <div className="grid gap-4">
        <Input
          label="اسم الوكيل"
          value={form.name}
          onChange={(event) => onChangeForm({ name: event.target.value })}
          placeholder="مثال: مساعد التحصيل الذكي"
        />
        <div className="grid gap-2">
          <label className="text-sm font-semibold text-slate-200">وصف الوكيل</label>
          <textarea
            value={form.description}
            onChange={(event) => onChangeForm({ description: event.target.value })}
            className="auth-field min-h-[140px] rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-sm text-slate-100"
            placeholder="صف القيمة التجارية والنتائج المتوقعة"
          />
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-semibold text-slate-200">التصنيف</label>
          <Select
            options={categoryOptions.filter((item) => item.value !== "الكل")}
            value={form.category}
            onChange={(value) => onChangeForm({ category: String(value) })}
          />
        </div>
        <Input
          label="وسوم"
          value={form.tags}
          onChange={(event) => onChangeForm({ tags: event.target.value })}
          placeholder="مثال: مبيعات، أتمتة، دعم"
          helperText="استخدم الفاصلة العربية للفصل بين الوسوم"
        />

        <div className="grid gap-2">
          <label className="text-sm font-semibold text-slate-200">التسعير</label>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => onChangeForm({ priceType: "free" })}
              className={`rounded-xl border px-4 py-2 text-sm ${
                form.priceType === "free"
                  ? "border-emerald-400 bg-emerald-400/10 text-emerald-200"
                  : "border-slate-800 text-slate-300"
              }`}
            >
              مجاني
            </button>
            <button
              type="button"
              onClick={() => onChangeForm({ priceType: "paid" })}
              className={`rounded-xl border px-4 py-2 text-sm ${
                form.priceType === "paid"
                  ? "border-emerald-400 bg-emerald-400/10 text-emerald-200"
                  : "border-slate-800 text-slate-300"
              }`}
            >
              مدفوع
            </button>
            {form.priceType === "paid" ? (
              <Input
                value={form.priceAmount}
                onChange={(event) => onChangeForm({ priceAmount: Number(event.target.value || 0) })}
                type="number"
                placeholder="السعر بالريال"
              />
            ) : null}
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 text-sm text-slate-300">
          <p>سيتم مراجعة الوكيل قبل النشر للتأكد من جودة التجربة.</p>
          <div className="mt-3 flex items-center gap-2">
            <input
              id="publishAgree"
              type="checkbox"
              checked={form.agree}
              onChange={(event) => onChangeForm({ agree: event.target.checked })}
            />
            <label htmlFor="publishAgree">أتعهد بصحة المحتوى واحترام سياسات المنصة.</label>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={onSubmit}>إرسال للمراجعة</Button>
          <Button variant="outline" onClick={onClose}>
            إلغاء
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default MarketplacePublishModal;
