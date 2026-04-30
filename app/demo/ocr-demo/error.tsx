"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="demo-page">
      <div className="demo-container" style={{ paddingBlock: 80 }}>
        <section className="glass-panel" style={{ padding: 32 }}>
          <h1>تعذر تحميل تجربة الوثائق</h1>
          <p>حدث خلل مؤقت في واجهة الديمو. أعد المحاولة بدون رفع بيانات حساسة.</p>
          <button className="focus-ring" type="button" onClick={reset}>
            إعادة المحاولة
          </button>
        </section>
      </div>
    </main>
  );
}
