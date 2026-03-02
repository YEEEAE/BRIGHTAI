import { Link } from "react-router-dom";

const Terms = () => {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8">
      <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6">
        <h1 className="text-2xl font-bold text-slate-100">الشروط والأحكام</h1>
        <p className="mt-3 text-sm leading-8 text-slate-300">
          باستخدام منصة Bright AI فإنك توافق على استخدام المنصة وفق السياسات التشغيلية
          والأمنية المعتمدة. يجب عدم إساءة الاستخدام أو محاولة الوصول غير المصرح به إلى
          البيانات أو الخدمات.
        </p>
        <p className="mt-3 text-sm leading-8 text-slate-300">
          تحتفظ المنصة بحق تحديث هذه الشروط عند الحاجة. استمرار الاستخدام بعد التحديث يعني
          الموافقة على النسخة الجديدة.
        </p>
        <div className="mt-6">
          <Link to="/signup" className="text-sm font-semibold text-emerald-300">
            العودة إلى التسجيل
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Terms;
