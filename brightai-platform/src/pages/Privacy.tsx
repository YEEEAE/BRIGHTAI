import { Link } from "react-router-dom";

const Privacy = () => {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8">
      <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6">
        <h1 className="text-2xl font-bold text-slate-100">سياسة الخصوصية</h1>
        <p className="mt-3 text-sm leading-8 text-slate-300">
          تلتزم منصة Bright AI بحماية بيانات المستخدمين وعدم مشاركتها خارج نطاق الخدمة إلا
          حسب المتطلبات القانونية أو بموافقة صريحة من المستخدم.
        </p>
        <p className="mt-3 text-sm leading-8 text-slate-300">
          يتم استخدام البيانات التشغيلية لتحسين الجودة والأداء ومراقبة الأعطال، مع تطبيق
          ضوابط أمنية على الوصول والتخزين.
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

export default Privacy;
