function It(e2) {
  const t2 = String(e2 || "").toLowerCase().trim(), n2 = t2.lastIndexOf(".");
  return -1 === n2 ? "" : t2.slice(n2 + 1);
}
function xt() {
  window.pdfjsLib && window.pdfjsLib.GlobalWorkerOptions && (window.pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js");
}
async function $t(e2) {
  const t2 = [], n2 = It(e2 && e2.name), r2 = String(e2 && e2.name ? e2.name : "").toLowerCase();
  if (function(e3) {
    const t3 = It(e3 && e3.name);
    return I.includes(t3);
  }(e2) || t2.push("الصيغة غير مدعومة لهذا النظام الطبي."), (e2 && e2.size) > b && t2.push(`حجم الملف يتجاوز ${te(b)}.`), /\.(pdf|docx|doc|dcm|dicom|jpg|jpeg|png|mp3|wav|xls|xlsx)\.(exe|bat|cmd|js|vbs|scr|sh)$/i.test(r2) && t2.push("اسم ملف مشبوه (امتداد مزدوج غير آمن)."), x.includes(n2) || "json" === n2 || "xml" === n2 || "html" === n2 || "htm" === n2) {
    const n3 = await async function(e3, t3) {
      const n4 = e3.slice(0, t3 || 65536);
      return String(await n4.text()).toLowerCase();
    }(e2, 65536).catch(function() {
      return "";
    });
    /(powershell|cmd\.exe|<script|eval\(|document\.write|wget\s+http|curl\s+http|base64\s+-d)/i.test(n3) && t2.push("تم رصد نمط نصي مشبوه أثناء الفحص الأمني الأولي.");
  }
  return { ok: 0 === t2.length, issues: t2 };
}
function At(e2, t2) {
  e2 && "object" == typeof e2 && (Object.assign(e2, t2 || {}), se());
}
function kt(e2, t2) {
  Z(R.batchStatus, e2, t2);
}
async function Ct(e2) {
  const t2 = new Uint8Array(await e2.arrayBuffer());
  let n2 = "";
  for (let e3 = 0; e3 < t2.length; e3 += 32768) {
    const r2 = t2.subarray(e3, e3 + 32768);
    n2 += String.fromCharCode.apply(null, r2);
  }
  return btoa(n2);
}
function Mt(e2) {
  if (e2 && e2.aborted) {
    const e3 = new Error("تم إلغاء معالجة الملف.");
    throw e3.code = "ITEM_ABORTED", e3;
  }
}
async function Lt(t2, r2) {
  Mt(r2);
  const a2 = await async function(e2) {
    if (!e2 || !e2.type || !e2.type.startsWith("image/")) return e2;
    if (e2.size <= 4194304) return e2;
    const t3 = URL.createObjectURL(e2);
    try {
      const n2 = await new Promise(function(e3, n3) {
        const r4 = new Image();
        r4.onload = function() {
          e3(r4);
        }, r4.onerror = n3, r4.src = t3;
      }), r3 = 1800, a3 = Math.min(1, r3 / Math.max(n2.width, n2.height)), o3 = Math.max(1, Math.round(n2.width * a3)), i3 = Math.max(1, Math.round(n2.height * a3)), s3 = document.createElement("canvas");
      s3.width = o3, s3.height = i3, s3.getContext("2d").drawImage(n2, 0, 0, o3, i3);
      const c2 = await new Promise(function(e3) {
        s3.toBlob(e3, "image/jpeg", 0.78);
      });
      return c2 ? new File([c2], e2.name.replace(/\.\w+$/, ".jpg"), { type: "image/jpeg" }) : e2;
    } finally {
      URL.revokeObjectURL(t3);
    }
  }(t2), o2 = { fileBase64: await Ct(a2), mimeType: a2.type || "application/octet-stream", fileName: t2.name }, i2 = await ue(e, o2, Math.max(n, 6e4)), s2 = i2 && "string" == typeof i2.text ? i2.text : "";
  if (!s2) throw new Error("تعذر استخراج نص واضح من الملف.");
  return r2 && (r2.ocrUsed = true), s2;
}
async function Tt(e2, r2) {
  const a2 = It(e2 && e2.name);
  if (x.includes(a2)) return e2.text();
  if ("pdf" === a2) {
    const t2 = await async function(e3) {
      if (!window.pdfjsLib) throw new Error("مكتبة PDF غير جاهزة حالياً. أعد المحاولة بعد ثوانٍ.");
      xt();
      const t3 = await e3.arrayBuffer(), n2 = window.pdfjsLib.getDocument({ data: t3 }), r3 = await n2.promise, a3 = [], o2 = Math.min(r3.numPages, 40);
      for (let e4 = 1; e4 <= o2; e4 += 1) {
        const t4 = await r3.getPage(e4), n3 = (await t4.getTextContent()).items.map(function(e5) {
          return e5 && e5.str ? e5.str : "";
        }).join(" ");
        a3.push(n3);
      }
      return a3.join("\n");
    }(e2).catch(function() {
      return "";
    });
    return Y(t2).length >= 30 ? t2 : Lt(e2, r2);
  }
  if ("docx" === a2) {
    const t2 = await async function(e3) {
      if (!window.mammoth || "function" != typeof window.mammoth.extractRawText) throw new Error("مكتبة DOCX غير جاهزة حالياً. أعد المحاولة بعد ثوانٍ.");
      const t3 = await e3.arrayBuffer(), n2 = await window.mammoth.extractRawText({ arrayBuffer: t3 });
      return n2 && "string" == typeof n2.value ? n2.value : "";
    }(e2).catch(function() {
      return "";
    });
    return Y(t2).length >= 20 ? t2 : Lt(e2, r2);
  }
  if ("doc" === a2 || "dcm" === a2 || "dicom" === a2 || $.includes(a2)) return Lt(e2, r2);
  if (k.includes(a2)) return async function(e3) {
    if (!window.XLSX) throw new Error("مكتبة Excel غير جاهزة حالياً.");
    const t2 = window.XLSX.read(await e3.arrayBuffer(), { type: "array" }), n2 = [];
    return t2.SheetNames.slice(0, 10).forEach(function(e4) {
      const r3 = t2.Sheets[e4], a3 = window.XLSX.utils.sheet_to_json(r3, { header: 1, raw: false }).slice(0, 200).map(function(e5) {
        return J(e5).join(" | ");
      }).join("\n");
      n2.push(`ورقة: ${e4}
${a3}`);
    }), n2.join("\n\n");
  }(e2);
  if (A.includes(a2)) return async function(e3, r3) {
    Mt(r3);
    const a3 = { fileBase64: await Ct(e3), mimeType: e3.type || "audio/wav", fileName: e3.name }, o2 = await ue(t, a3, Math.max(n, 9e4)), i2 = o2 && "string" == typeof o2.text ? o2.text : "";
    if (!i2) throw new Error("تعذر تحويل الصوت إلى نص.");
    return r3 && (r3.transcriptionUsed = true), i2;
  }(e2, r2);
  throw new Error("صيغة الملف غير مدعومة حالياً.");
}
function jt(e2) {
  const t2 = Array.from(e2 || []);
  if (!t2.length) return void Z(R.fileStatus, "لم يتم اختيار أي ملف.", "error");
  if (t2.length + j.uploadQueue.length > 300) return void Z(R.fileStatus, "الحد الأعلى في التجربة هو 300 ملفاً لكل دفعة.", "error");
  let n2 = 0;
  t2.forEach(function(e3) {
    if (!e3 || !e3.name) return;
    j.uploadQueue.some(function(t3) {
      return t3.name === e3.name && t3.size === e3.size;
    }) || (j.uploadQueue.push(re(e3)), n2 += 1);
  }), se(), n2 ? Z(R.fileStatus, `تمت إضافة ${n2} ملف إلى طابور المعالجة.`, "success") : Z(R.fileStatus, "كل الملفات المحددة موجودة مسبقاً في الطابور.", "error");
}
function Rt() {
  R.reportFile && R.reportFile.click();
}
function Pt() {
  R.reportFolder && R.reportFolder.click();
}
function qt(e2) {
  jt(e2 && e2.target && e2.target.files ? e2.target.files : []), e2 && e2.target && (e2.target.value = "");
}
function Dt(e2) {
  R.dropZone && (e2 ? R.dropZone.classList.add("dragover") : R.dropZone.classList.remove("dragover"));
}
function Nt(e2) {
  e2 && e2.extractedText && (R.reportInput && (R.reportInput.value = V(e2.extractedText)), j.lastFileMeta = { name: e2.name, type: e2.type || e2.ext, size: e2.size }, Z(R.fileStatus, `تم إدراج النص المستخرج من ملف: ${e2.name}`, "success"));
}
function Ot(e2) {
  return e2 && ("ITEM_ABORTED" === e2.code || String(e2.message || "").includes("إلغاء")) ? "cancelled" : "error";
}
async function Ft(e2) {
  At(e2, { status: "processing", progress: 5, message: "بدء التحقق من الملف...", aborted: false });
  try {
    const t2 = await $t(e2.file);
    if (e2.validation = t2, !t2.ok) throw new Error(t2.issues.join(" | "));
    Mt(e2), At(e2, { progress: 20, message: "استخراج النص من الملف..." });
    const n2 = await Tt(e2.file, e2);
    Mt(e2);
    const r2 = V(n2);
    if (!r2 || r2.length < 20) throw new Error("النص المستخرج غير كافٍ للتحليل الطبي.");
    At(e2, { status: "done", progress: 100, message: `اكتملت المعالجة. طول النص: ${r2.length} حرف.`, extractedText: r2 });
  } catch (t2) {
    At(e2, { status: Ot(t2), progress: e2.aborted ? e2.progress : Math.max(e2.progress || 0, 20), message: N(t2, "تعذر معالجة الملف.") });
  } finally {
    e2.workerLocked = false;
  }
}
function Ht() {
  for (const e2 of j.uploadQueue) if (!e2.workerLocked && "queued" === e2.status) return e2.workerLocked = true, e2;
  return null;
}
async function Qt() {
  for (; !j.stopQueueRequested; ) {
    const e2 = Ht();
    if (!e2) break;
    await Ft(e2);
  }
}
async function Kt() {
  if (j.queueProcessing) return void kt("المعالجة الدُفعية قيد التشغيل بالفعل.", "error");
  if (!j.uploadQueue.length) return void kt("أضف ملفات أولاً قبل تشغيل المعالجة الدُفعية.", "error");
  if (!j.uploadQueue.some(function(e3) {
    return "queued" === e3.status;
  })) return void kt("لا توجد ملفات في حالة انتظار. استخدم الاستئناف للملفات المتوقفة.", "error");
  j.stopQueueRequested = false, j.queueProcessing = true, kt("بدأت المعالجة الدُفعية مع تشغيل متوازي للملفات.", "");
  const e2 = performance.now();
  try {
    const t2 = [];
    for (let e3 = 0; e3 < 3; e3 += 1) t2.push(Qt());
    await Promise.all(t2), kt("انتهت المعالجة الدُفعية الحالية.", "success"), at("batch_process", { success: true, durationMs: Math.round(performance.now() - e2) });
  } catch (t2) {
    kt(N(t2, "حدث خلل أثناء معالجة الدفعة."), "error"), at("batch_process", { success: false, durationMs: Math.round(performance.now() - e2), reason: String(t2 && t2.message ? t2.message : "error") });
  } finally {
    j.queueProcessing = false, se();
  }
}
function Wt() {
  j.stopQueueRequested = true, j.uploadQueue.forEach(function(e2) {
    "processing" === e2.status && (e2.aborted = true, e2.status = "cancelled", e2.message = "تم إلغاء المعالجة بواسطة المستخدم.");
  }), se(), kt("تم إرسال أمر إلغاء المعالجة الجارية.", "error");
}
function Gt() {
  let e2 = 0;
  j.uploadQueue.forEach(function(t2) {
    "cancelled" !== t2.status && "error" !== t2.status || (t2.status = "queued", t2.progress = 0, t2.message = "بانتظار الاستئناف", t2.aborted = false, e2 += 1);
  }), se(), kt(e2 ? `تم تحويل ${e2} ملف إلى وضع الانتظار للاستئناف.` : "لا توجد ملفات متوقفة لاستئنافها.", e2 ? "success" : "error");
}
function Ut(e2, t2) {
  const n2 = JSON.parse(JSON.stringify("function" == typeof normalizeMedicalArchiveResult ? normalizeMedicalArchiveResult(e2) : e2 || {}));
  return n2.recordId = n2.recordId || `rec-${Date.now()}-${j.records.length + 1}`, n2.savedAt = (/* @__PURE__ */ new Date()).toLocaleString("ar-SA"), n2.sourceHospital = ee().hospitalName || null, n2.sourceFile = t2 || (j.lastFileMeta ? j.lastFileMeta.name : null), j.records.push(n2), fe(), de(), n2.recordId;
}
async function zt() {
  const e2 = j.uploadQueue.filter(function(e3) {
    return "done" === e3.status && e3.extractedText && !e3.analyzed;
  });
  if (!e2.length) return void Z(R.batchStatus, "لا توجد ملفات مكتملة وجاهزة للتحليل.", "error");
  X(R.analyzeBatchBtn, true, "جاري التحليل عبر Gemini..."), Z(R.batchStatus, `تحليل ${e2.length} ملف جاهز عبر Gemini...`, "");
  const t2 = performance.now();
  let n2 = 0, r2 = 0, a2 = 0;
  async function o2() {
    for (; n2 < e2.length; ) {
      const t3 = n2;
      n2 += 1;
      const o3 = e2[t3];
      try {
        At(o3, { message: "جاري التحليل الطبي عبر Gemini...", progress: 70 });
        const e3 = await ce({ action: "extract", reportText: o3.extractedText, hospitalProfile: ee() });
        if (!e3 || !e3.result) throw new Error("نتيجة التحليل غير صالحة.");
        o3.analyzed = true, o3.savedRecordId = Ut(e3.result, o3.name), At(o3, { progress: 100, message: "اكتمل التحليل عبر Backend وتم حفظ السجل الطبي." }), r2 += 1;
      } catch (e3) {
        a2 += 1, At(o3, { status: "error", message: N(e3, "فشل تحليل الملف.") });
      }
    }
  }
  try {
    const e3 = [];
    for (let t3 = 0; t3 < 2; t3 += 1) e3.push(o2());
    await Promise.all(e3), Z(R.batchStatus, `اكتمل تحليل الدفعة. نجاح: ${r2} | فشل: ${a2}`, a2 ? "error" : "success"), at("batch_analyze", { success: 0 === a2, durationMs: Math.round(performance.now() - t2), successCount: r2, failCount: a2 });
  } finally {
    X(R.analyzeBatchBtn, false), se();
  }
}
function _t(e2) {
  const t2 = e2.target;
  if (!t2 || !t2.closest) return;
  const n2 = t2.closest("[data-action]");
  if (!n2) return;
  const r2 = n2.getAttribute("data-action"), a2 = n2.getAttribute("data-id"), o2 = j.uploadQueue.find(function(e3) {
    return e3.id === a2;
  });
  return o2 ? "cancel" === r2 ? (o2.aborted = true, o2.status = "cancelled", o2.message = "تم إلغاء الملف.", void se()) : "resume" === r2 ? (o2.aborted = false, o2.status = "queued", o2.progress = 0, o2.message = "بانتظار المعالجة", void se()) : void ("use" !== r2 ? "remove" === r2 && function(e3) {
    const t3 = j.uploadQueue.findIndex(function(t4) {
      return t4.id === e3;
    });
    if (-1 === t3) return;
    const n3 = j.uploadQueue[t3];
    "processing" !== n3.status ? (n3.previewUrl && URL.revokeObjectURL(n3.previewUrl), j.uploadQueue.splice(t3, 1), se()) : Z(R.batchStatus, "لا يمكن حذف ملف قيد المعالجة. ألغِ المعالجة أولاً.", "error");
  }(o2.id) : Nt(o2)) : void 0;
}
async function Jt() {
  const e2 = function() {
    const e3 = j.uploadQueue.find(function(e4) {
      return e4.extractedText && "done" === e4.status;
    });
    if (e3) return e3;
    const t2 = j.uploadQueue.find(function(e4) {
      return "queued" === e4.status || "error" === e4.status || "cancelled" === e4.status;
    });
    if (t2) return t2.status = "queued", t2.aborted = false, t2.progress = Math.min(5, Number(t2.progress || 0)), t2.message = "بانتظار المعالجة", t2;
    const n2 = R.reportFile && R.reportFile.files ? R.reportFile.files[0] : null;
    if (!n2) return null;
    const r2 = re(n2);
    return j.uploadQueue.unshift(r2), se(), r2;
  }();
  if (e2) if (e2.extractedText && "done" === e2.status) Nt(e2);
  else {
    X(R.extractFileBtn, true, "جاري قراءة الملف..."), Z(R.fileStatus, `جاري استخراج النص من الملف: ${e2.name}`, "");
    try {
      if (await Ft(e2), !e2.extractedText) throw new Error(e2.message || "تعذر استخراج نص كافٍ من الملف.");
      Nt(e2), Z(R.fileStatus, `تم استخراج النص من الملف (${e2.name}) بنجاح. الطول المستخدم: ${e2.extractedText.length} حرف.`, "success");
    } catch (e3) {
      Z(R.fileStatus, N(e3, "تعذر استخراج النص من الملف حالياً."), "error");
    } finally {
      X(R.extractFileBtn, false), se();
    }
  }
  else Z(R.fileStatus, "أضف ملفاً واحداً على الأقل ثم أعد المحاولة.", "error");
}
async function Zt(e2) {
  if (!e2 || !e2.file) throw new Error("الملف غير متاح للرفع.");
  const t2 = function(e3) {
    const t3 = j.storageProvider || "none", n2 = String(j.storageEndpoint || "").trim();
    if (!n2 || "none" === t3) throw new Error("إعدادات التخزين غير مكتملة. احفظ مزود التخزين والرابط أولاً.");
    if ("s3" === t3) return n2.includes("{filename}") ? n2.replace("{filename}", encodeURIComponent(e3)) : /X-Amz-|Signature|Expires|AWSAccessKeyId/i.test(n2) ? n2 : n2.endsWith("/") ? `${n2}${encodeURIComponent(e3)}` : `${n2}/${encodeURIComponent(e3)}`;
    if ("firebase" === t3) {
      const t4 = n2.includes("?") ? "&" : "?", r3 = /(^|[?&])name=/.test(n2) ? n2 : `${n2}${t4}name=${encodeURIComponent(e3)}`;
      return /uploadType=/.test(r3) ? r3 : `${r3}${r3.includes("?") ? "&" : "?"}uploadType=media`;
    }
    throw new Error("مزود التخزين غير مدعوم.");
  }(e2.file.name), r2 = {};
  e2.file.type && (r2["Content-Type"] = e2.file.type), j.storageToken && (r2.Authorization = `Bearer ${j.storageToken}`);
  const a2 = "s3" === j.storageProvider ? "PUT" : "POST", o2 = await D(t2, { method: a2, headers: r2, body: e2.file }, Math.max(n, 9e4));
  if (!o2.ok) {
    const e3 = await o2.text().catch(function() {
      return "";
    });
    throw new Error(e3 || "فشل رفع الملف إلى التخزين السحابي.");
  }
  return t2;
}
function Xt() {
  W(), "none" !== (j.storageProvider || "none") ? j.storageEndpoint ? Z(R.storageStatus, `تم حفظ إعداد التخزين (${"s3" === j.storageProvider ? "AWS S3" : "Firebase"}).`, "success") : Z(R.storageStatus, "أدخل رابط رفع صحيح ثم أعد الحفظ.", "error") : Z(R.storageStatus, "تم حفظ الوضع بدون تخزين سحابي.", "success");
}
async function Yt() {
  if (W(), "none" === (j.storageProvider || "none")) return void Z(R.storageStatus, "اختر مزود تخزين أولاً.", "error");
  const e2 = j.uploadQueue.filter(function(e3) {
    return "done" === e3.status && e3.file;
  });
  if (!e2.length) return void Z(R.storageStatus, "لا توجد ملفات مكتملة لرفعها.", "error");
  X(R.uploadStorageBtn, true, "جاري الرفع..."), Z(R.storageStatus, `بدء رفع ${e2.length} ملف إلى التخزين السحابي...`, "");
  const t2 = performance.now();
  let n2 = 0, r2 = 0;
  for (const t3 of e2) try {
    const e3 = await Zt(t3);
    t3.storageUrl = e3, n2 += 1, At(t3, { message: "تم الرفع إلى التخزين السحابي بنجاح." });
  } catch (e3) {
    r2 += 1, At(t3, { message: N(e3, "فشل رفع الملف.") });
  }
  Z(R.storageStatus, `اكتمل الرفع. نجاح: ${n2} | فشل: ${r2}`, r2 ? "error" : "success"), X(R.uploadStorageBtn, false), se(), at("storage_upload", { success: 0 === r2, durationMs: Math.round(performance.now() - t2), successCount: n2, failCount: r2, provider: j.storageProvider });
}
