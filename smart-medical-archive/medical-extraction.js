function de() {
  R.recordsCount && (R.recordsCount.textContent = String(j.records.length)), R.extractedCount && (R.extractedCount.textContent = j.lastExtract ? "1" : "0"), R.riskCount && (R.riskCount.textContent = String(function(e2) {
    let t2 = 0;
    return e2.forEach(function(e3) {
      J(e3 && e3.alerts).some(function(e4) {
        if (!e4 || "object" != typeof e4) return false;
        const t3 = (e4.type || e4.level || "").toString().toLowerCase();
        return t3.includes("risk") || t3.includes("critical") || t3.includes("high");
      }) && (t2 += 1);
    }), t2;
  }(j.records)));
}
function ge(e2) {
  return J(e2).map(function(e3) {
    return "string" == typeof e3 ? e3 : e3 && "object" == typeof e3 ? "string" == typeof e3.name && e3.name.trim() ? e3.name : "string" == typeof e3.message && e3.message.trim() ? e3.message : "" : "";
  }).filter(Boolean);
}
function me(e2) {
  return J(e2).map(function(e3) {
    if ("string" == typeof e3) return { name: e3, dose: null, frequency: null };
    if (!e3 || "object" != typeof e3) return null;
    const t2 = e3.name || e3.medication || e3.drug;
    return t2 ? { name: t2, dose: e3.dose || e3.dosage || null, frequency: e3.frequency || e3.freq || null } : null;
  }).filter(Boolean);
}
function pe(e2) {
  return J(e2).map(function(e3) {
    if (!e3 || "object" != typeof e3) return null;
    const t2 = e3.name || e3.test || e3.lab;
    return t2 ? { name: t2, value: e3.value || null, unit: e3.unit || null, status: e3.status || null } : null;
  }).filter(Boolean);
}
function he(e2) {
  if (!R.extractResult) return;
  if (!e2 || "object" != typeof e2) return void (R.extractResult.innerHTML = "<p>لا توجد نتيجة حتى الآن.</p>");
  const t2 = e2.patient && "object" == typeof e2.patient ? e2.patient : {}, n2 = e2.summary && "object" == typeof e2.summary ? e2.summary : {}, r2 = ge(e2.diagnoses), a2 = ge(e2.alerts), o2 = me(e2.medications), i2 = pe(e2.labs), s2 = r2.length ? r2.map(function(e3) {
    return `<li>${_(e3)}</li>`;
  }).join("") : "<li>لا يوجد تشخيص واضح في النص</li>", c2 = a2.length ? a2.map(function(e3) {
    return `<li>${_(e3)}</li>`;
  }).join("") : "<li>لا توجد تنبيهات خطورة مباشرة</li>", u2 = o2.length ? o2.map(function(e3) {
    const t3 = e3.dose ? ` - الجرعة: ${_(e3.dose)}` : "", n3 = e3.frequency ? ` - التكرار: ${_(e3.frequency)}` : "";
    return `<li>${_(e3.name)}${t3}${n3}</li>`;
  }).join("") : "<li>لا توجد أدوية مستخرجة</li>", l2 = i2.length ? i2.map(function(e3) {
    const t3 = e3.value ? ` ${_(String(e3.value))}` : "", n3 = e3.unit ? ` ${_(String(e3.unit))}` : "", r3 = e3.status ? ` (${_(String(e3.status))})` : "";
    return `<li>${_(e3.name)}:${t3}${n3} ${r3}</li>`;
  }).join("") : "<li>لا توجد نتائج مختبر مستخرجة</li>";
  R.extractResult.innerHTML = `
  <div class="result-grid">
    <div class="result-item">
      <strong>بيانات المريض</strong>
      <div>${_(t2.name || "غير محدد")}</div>
      <div>العمر: ${_(null != t2.age ? String(t2.age) : "غير محدد")}</div>
      <div>الجنس: ${_(t2.gender || "غير محدد")}</div>
      <div>المدينة: ${_(t2.city || "غير محدد")}</div>
    </div>
    <div class="result-item">
      <strong>ملخص الحالة</strong>
      <div>${_(n2.problem || "لا يوجد ملخص")}</div>
      <div>${_(n2.plan || "")}</div>
      <div>${_(n2.nextStep || "")}</div>
    </div>
  </div>
  <div class="result-item" style="margin-top:10px;">
    <strong>التشخيصات المستخرجة</strong>
    <ul class="mini-list">${s2}</ul>
  </div>
  <div class="result-item" style="margin-top:10px;">
    <strong>الأدوية المستخرجة</strong>
    <ul class="mini-list">${u2}</ul>
  </div>
  <div class="result-item" style="margin-top:10px;">
    <strong>نتائج المختبر</strong>
    <ul class="mini-list">${l2}</ul>
  </div>
  <div class="result-item" style="margin-top:10px;">
    <strong>تنبيهات سريرية</strong>
    <ul class="mini-list">${c2}</ul>
  </div>
`;
}
function fe() {
  if (!R.recordsList) return;
  if (!j.records.length) return void (R.recordsList.innerHTML = '<p class="meta">لم يتم حفظ أي سجل بعد.</p>');
  const e2 = j.records.slice().reverse().slice(0, 8).map(function(e3) {
    const t2 = e3.patient && "object" == typeof e3.patient ? e3.patient : {}, n2 = ge(e3.diagnoses), r2 = e3.sourceFile ? ` - الملف: ${e3.sourceFile}` : "";
    return `
      <div class="record-item">
        <div class="top">
          <span class="id">${_(e3.recordId || "rec")}</span>
          <span class="meta">${_(e3.savedAt || "")}</span>
        </div>
        <div class="meta">${_(t2.name || "مريض غير معرف")} - ${_(null != t2.age ? `${t2.age} سنة` : "العمر غير متوفر")}</div>
        <div class="meta">${_((n2[0] || "بدون تشخيص واضح").toString())}</div>
        <div class="meta">${_(r2)}</div>
      </div>
    `;
  }).join("");
  R.recordsList.innerHTML = e2;
}
async function ve() {
  const e2 = R.reportInput ? V(R.reportInput.value) : "";
  if (!e2 || e2.length < 30) return void Z(R.extractStatus, "أدخل تقريراً طبياً كاملاً (30 حرفاً على الأقل).", "error");
  const t2 = performance.now();
  X(R.analyzeBtn, true, "جاري التحليل عبر Gemini..."), Z(R.extractStatus, "جاري استخراج البيانات الصحية من التقرير...", "");
  try {
    const n2 = await ce({ action: "extract", reportText: e2, hospitalProfile: ee() });
    if (!n2 || !n2.result) throw new Error("لم تصل نتيجة صالحة من الخدمة");
    j.lastExtract = n2.result, R.saveRecordBtn && (R.saveRecordBtn.disabled = false), he(n2.result), de(), Z(R.extractStatus, `تم التحليل بنجاح عبر نموذج ${n2.model || "Gemini"}. احفظ السجل لإتاحته في البحث والتحليلات.`, "success"), at("analysis", { success: true, durationMs: Math.round(performance.now() - t2), model: n2.model || "Gemini", size: e2.length });
  } catch (e3) {
    Z(R.extractStatus, N(e3, "تعذر تحليل التقرير حالياً"), "error"), at("analysis", { success: false, durationMs: Math.round(performance.now() - t2), reason: String(e3 && e3.message ? e3.message : "error") });
  } finally {
    X(R.analyzeBtn, false);
  }
}
function ye() {
  j.lastExtract ? (Ut(j.lastExtract, j.lastFileMeta ? j.lastFileMeta.name : null), j.lastExtract = null, R.saveRecordBtn && (R.saveRecordBtn.disabled = true), Z(R.extractStatus, "تم حفظ السجل داخل الأرشيف التجريبي ويمكن البحث فيه الآن.", "success"), at("save_record", { success: true })) : Z(R.extractStatus, "نفّذ التحليل أولاً قبل حفظ السجل.", "error");
}
