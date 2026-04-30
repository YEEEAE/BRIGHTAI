"use client";

import { useMemo, useState } from "react";

export function ROICalculator() {
  const [documents, setDocuments] = useState(2400);
  const [minutes, setMinutes] = useState(7);
  const [hourlyCost, setHourlyCost] = useState(65);

  const roi = useMemo(() => {
    const manualHours = (documents * minutes) / 60;
    const automatedHours = manualHours * 0.18;
    const savedHours = Math.max(0, manualHours - automatedHours);
    const savedSar = Math.round(savedHours * hourlyCost);
    return { savedHours: Math.round(savedHours), savedSar };
  }, [documents, hourlyCost, minutes]);

  return (
    <section className="roi demo-container" aria-labelledby="roi-title">
      <div>
        <p className="demo-eyebrow">قبل وبعد</p>
        <h2 id="roi-title">احسب أثر أتمتة الوثائق خلال شهر</h2>
        <p>المعادلة تقديرية وتستخدم لتأهيل القرار قبل ورشة الربط الفعلية.</p>
      </div>
      <div className="roi__grid glass-panel">
        <label>
          عدد الوثائق شهرياً
          <input type="range" min="100" max="12000" step="100" value={documents} onChange={(event) => setDocuments(Number(event.target.value))} />
          <strong>{documents.toLocaleString("ar-SA")}</strong>
        </label>
        <label>
          دقائق المعالجة اليدوية
          <input type="range" min="2" max="25" step="1" value={minutes} onChange={(event) => setMinutes(Number(event.target.value))} />
          <strong>{minutes.toLocaleString("ar-SA")}</strong>
        </label>
        <label>
          تكلفة الساعة بالريال
          <input type="range" min="25" max="180" step="5" value={hourlyCost} onChange={(event) => setHourlyCost(Number(event.target.value))} />
          <strong>{hourlyCost.toLocaleString("ar-SA")}</strong>
        </label>
        <output>
          <span>توفير شهري متوقع</span>
          <strong>{roi.savedSar.toLocaleString("ar-SA")} ريال</strong>
          <small>{roi.savedHours.toLocaleString("ar-SA")} ساعة مستردة للفريق</small>
        </output>
      </div>
    </section>
  );
}
