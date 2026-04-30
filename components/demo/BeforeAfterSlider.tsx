export function BeforeAfterSlider() {
  return (
    <section className="before-after demo-container" aria-labelledby="before-after-title">
      <div>
        <p className="demo-eyebrow">مقارنة تشغيلية</p>
        <h2 id="before-after-title">من إدخال يدوي إلى مراجعة ذكية</h2>
      </div>
      <div className="before-after__grid">
        <article className="glass-panel">
          <h3>قبل</h3>
          <p>فريق المالية يقرأ الوثائق، ينسخ الحقول، يراجع الضريبة، ثم يعيد إدخال البيانات في النظام.</p>
        </article>
        <article className="glass-panel">
          <h3>بعد</h3>
          <p>النظام يستخرج الحقول، يضع مستوى الثقة، يكشف النواقص، ويجهز payload قابل للمراجعة والربط.</p>
        </article>
      </div>
    </section>
  );
}
