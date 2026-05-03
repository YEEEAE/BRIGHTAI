/* BrightAI OCR Demo — backend AI gateway | brightai.site */
(function () {
  'use strict';

  const GEMINI_MODEL = 'gemini-2.5-flash';
  const AI_COMPLETIONS_PATH = '/api/ai/chat/completions';
  const MAX_BYTES = 4 * 1024 * 1024;
  const ALLOWED_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp'];
  const REVIEW_CONFIDENCE_THRESHOLD = 0.72;

  const btnRun = document.getElementById('ocr-run');
  const outEl = document.getElementById('ocr-output');
  const jsonEl = document.getElementById('ocr-json');
  const fileEl = document.getElementById('ocr-file');
  const dropZone = document.querySelector('.drop-zone');

  if (!btnRun || !outEl || !jsonEl || !fileEl) return;

  const origLabel = btnRun.innerHTML;

  const PROGRESS_STEPS = [
    { key: 'read', label: 'قراءة الملف' },
    { key: 'send', label: 'إرسال إلى Gemini' },
    { key: 'extract', label: 'استخراج الحقول' },
    { key: 'review', label: 'مراجعة JSON' }
  ];

  const DOCUMENT_TYPE_LABELS = {
    invoice: 'فاتورة',
    id: 'هوية',
    contract: 'عقد',
    medical_report: 'تقرير طبي',
    receipt: 'إيصال'
  };

  const DOCUMENT_TYPE_TEMPLATES = {
    invoice: [
      'invoice_number',
      'date',
      'due_date',
      'vendor_name',
      'buyer_name',
      'vat_number',
      'cr_number',
      'subtotal',
      'tax_amount',
      'tax_rate',
      'total_amount',
      'currency',
      'items_count',
      'payment_method',
      'bank_account'
    ],
    id: [
      'id_number',
      'full_name',
      'date_of_birth',
      'nationality',
      'expiry_date',
      'issue_date',
      'address'
    ],
    contract: [
      'contract_number',
      'contract_title',
      'party_a',
      'party_b',
      'start_date',
      'end_date',
      'total_amount',
      'currency',
      'payment_terms',
      'obligations',
      'notes'
    ],
    medical_report: [
      'patient_name',
      'patient_id',
      'report_date',
      'facility_name',
      'doctor_name',
      'diagnosis',
      'medications',
      'recommendations',
      'notes'
    ],
    receipt: [
      'receipt_number',
      'date',
      'vendor_name',
      'buyer_name',
      'payment_method',
      'subtotal',
      'tax_amount',
      'total_amount',
      'currency',
      'notes'
    ]
  };

  const FIELD_LABELS = {
    document_type: 'نوع المستند',
    invoice_number: 'رقم الفاتورة',
    receipt_number: 'رقم الإيصال',
    contract_number: 'رقم العقد',
    contract_title: 'عنوان العقد',
    total_amount: 'المبلغ الإجمالي',
    tax_amount: 'قيمة الضريبة',
    tax_rate: 'نسبة الضريبة',
    date: 'التاريخ',
    due_date: 'تاريخ الاستحقاق',
    start_date: 'تاريخ البداية',
    end_date: 'تاريخ النهاية',
    issue_date: 'تاريخ الإصدار',
    expiry_date: 'تاريخ الانتهاء',
    date_of_birth: 'تاريخ الميلاد',
    vendor_name: 'اسم الجهة',
    buyer_name: 'اسم المشتري',
    party_a: 'الطرف الأول',
    party_b: 'الطرف الثاني',
    full_name: 'الاسم الكامل',
    patient_name: 'اسم المريض',
    patient_id: 'رقم ملف المريض',
    facility_name: 'اسم المنشأة',
    doctor_name: 'اسم الطبيب',
    diagnosis: 'التشخيص',
    medications: 'الأدوية',
    recommendations: 'التوصيات',
    payment_terms: 'شروط الدفع',
    obligations: 'الالتزامات',
    nationality: 'الجنسية',
    currency: 'العملة',
    vat_number: 'الرقم الضريبي',
    cr_number: 'السجل التجاري',
    id_number: 'رقم الهوية',
    address: 'العنوان',
    items_count: 'عدد البنود',
    subtotal: 'الإجمالي قبل الضريبة',
    payment_method: 'طريقة الدفع',
    bank_account: 'رقم الحساب',
    notes: 'ملاحظات',
    needs_review: 'يحتاج مراجعة'
  };

  const MONETARY_FIELDS = ['total_amount', 'tax_amount', 'subtotal'];

  function escapeHTML(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function setLoading(on) {
    btnRun.disabled = on;
    btnRun.innerHTML = on
      ? '<i class="fa-solid fa-circle-notch fa-spin"></i> جارٍ التحليل...'
      : origLabel;

    if (on) {
      renderProgress('read');
      jsonEl.textContent = 'جارٍ تجهيز JSON...';
    }
  }

  function renderProgress(activeKey, completedKeys) {
    const completed = new Set(completedKeys || []);
    outEl.innerHTML = `<div class="ocr-processing">
      <i class="fa-solid fa-magnifying-glass fa-beat-fade"></i>
      <span>جارٍ معالجة المستند...</span>
    </div>
    <ol class="ocr-progress" aria-label="مراحل تحليل OCR">
      ${PROGRESS_STEPS.map((step) => {
        const state = completed.has(step.key)
          ? 'is-done'
          : step.key === activeKey
            ? 'is-active'
            : '';
        const icon = completed.has(step.key) ? 'fa-check' : 'fa-circle';
        return `<li class="${state}">
          <i class="fa-solid ${icon}" aria-hidden="true"></i>
          <span>${step.label}</span>
        </li>`;
      }).join('')}
    </ol>`;
  }

  function setError(msg) {
    outEl.innerHTML = `<div class="ocr-error"><i class="fa-solid fa-triangle-exclamation"></i> ${escapeHTML(msg)}</div>`;
    jsonEl.textContent = '{}';
  }

  function getFieldValue(field) {
    if (field && typeof field === 'object' && !Array.isArray(field) && 'value' in field) {
      return field.value;
    }

    return field;
  }

  function getFieldConfidence(field) {
    if (!field || typeof field !== 'object' || Array.isArray(field)) return null;
    const confidence = Number(field.confidence);
    return Number.isFinite(confidence) ? Math.max(0, Math.min(1, confidence)) : null;
  }

  function formatValue(value) {
    if (Array.isArray(value)) {
      return value
        .map((item) => typeof item === 'object' ? JSON.stringify(item) : String(item))
        .join('، ');
    }

    if (value && typeof value === 'object') {
      return JSON.stringify(value);
    }

    if (typeof value === 'boolean') {
      return value ? 'نعم' : 'لا';
    }

    return String(value);
  }

  function normalizeDocumentType(value) {
    const normalized = String(value || '').trim().toLowerCase();
    const aliases = {
      فاتورة: 'invoice',
      invoice: 'invoice',
      id: 'id',
      identity: 'id',
      هوية: 'id',
      عقد: 'contract',
      contract: 'contract',
      medical: 'medical_report',
      medical_report: 'medical_report',
      'تقرير طبي': 'medical_report',
      receipt: 'receipt',
      إيصال: 'receipt',
      ايصال: 'receipt'
    };

    return aliases[normalized] || normalized || 'invoice';
  }

  function normalizeGeminiResult(result) {
    const rawFields = result && typeof result === 'object' && result.fields && typeof result.fields === 'object'
      ? result.fields
      : result || {};

    const documentTypeField = result?.document_type || rawFields.document_type || { value: 'invoice', confidence: null };
    const documentTypeValue = normalizeDocumentType(getFieldValue(documentTypeField));
    const documentTypeConfidence = getFieldConfidence(documentTypeField);
    const fields = {
      ...rawFields,
      document_type: {
        value: documentTypeValue,
        confidence: documentTypeConfidence
      }
    };

    delete fields.needs_review;

    const fieldEntries = Object.values(fields);
    const lowConfidence = fieldEntries.some((field) => {
      const confidence = getFieldConfidence(field);
      return confidence !== null && confidence < REVIEW_CONFIDENCE_THRESHOLD;
    });

    const explicitNeedsReview = typeof result?.needs_review === 'boolean' ? result.needs_review : null;
    const emptyCoreFields = Object.values(fields).filter((field) => {
      const value = getFieldValue(field);
      return value !== null && value !== undefined && value !== '';
    }).length <= 1;

    return {
      document_type: {
        value: documentTypeValue,
        label: DOCUMENT_TYPE_LABELS[documentTypeValue] || documentTypeValue,
        confidence: documentTypeConfidence
      },
      fields,
      needs_review: explicitNeedsReview !== null ? explicitNeedsReview : lowConfidence || emptyCoreFields
    };
  }

  function fieldRow(key, field) {
    const value = getFieldValue(field);
    if (value === null || value === undefined || value === '') return '';

    const confidence = getFieldConfidence(field);
    const confidenceHtml = confidence === null
      ? ''
      : `<span class="field-confidence">${Math.round(confidence * 100)}%</span>`;
    const isMonetary = MONETARY_FIELDS.includes(key);

    return `<div class="field-row">
      <span class="field-label">${escapeHTML(FIELD_LABELS[key] || key)}</span>
      <span class="field-value ${isMonetary ? 'monetary' : ''}">
        ${escapeHTML(formatValue(value))}
        ${confidenceHtml}
      </span>
    </div>`;
  }

  function renderFields(result) {
    const normalized = normalizeGeminiResult(result);
    const fields = normalized.fields;
    const documentType = normalized.document_type.value;
    const preferredKeys = [
      'document_type',
      ...(DOCUMENT_TYPE_TEMPLATES[documentType] || []),
      ...Object.keys(FIELD_LABELS)
    ];
    const seen = new Set();
    const rows = [];

    preferredKeys.forEach((key) => {
      if (seen.has(key)) return;
      seen.add(key);
      if (Object.prototype.hasOwnProperty.call(fields, key)) {
        const row = fieldRow(key, fields[key]);
        if (row) rows.push(row);
      }
    });

    Object.keys(fields).forEach((key) => {
      if (seen.has(key)) return;
      seen.add(key);
      const row = fieldRow(key, fields[key]);
      if (row) rows.push(row);
    });

    const reviewState = normalized.needs_review
      ? '<span class="review-chip needs-review"><i class="fa-solid fa-eye"></i> يحتاج مراجعة</span>'
      : '<span class="review-chip"><i class="fa-solid fa-shield-check"></i> لا يحتاج مراجعة مبدئية</span>';

    if (rows.length === 0) {
      outEl.innerHTML = '<div class="field-row"><span>الحالة</span><span>لم يُعثر على حقول واضحة</span></div>';
      return normalized;
    }

    outEl.innerHTML = `<div class="fields-header">
      <i class="fa-solid fa-check-circle" style="color:#10b981"></i>
      <span>تم الاستخراج بنجاح — ${rows.length} حقل</span>
      ${reviewState}
    </div>
    ${rows.join('')}
    <div class="ocr-result-cta">
      <span>جاهز تربط القراءة الآلية مع دورة عملك؟</span>
      <a href="/consultation/" class="btn-primary">اربط OCR على نظامك</a>
    </div>`;

    return normalized;
  }

  function renderJSON(result) {
    try {
      jsonEl.textContent = JSON.stringify(result || {}, null, 2);
    } catch (_) {
      jsonEl.textContent = '{}';
    }
  }

  function toBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        const comma = result.indexOf(',');
        resolve(comma !== -1 ? result.slice(comma + 1) : result);
      };
      reader.onerror = () => reject(new Error('READ_ERROR'));
      reader.readAsDataURL(file);
    });
  }

  const OCR_PROMPT = `أنت نظام OCR متخصص في المستندات العربية والإنجليزية للسوق السعودي.
حلّل الملف المرفق واستخرج الحقول المتاحة بدقة من غير تخمين.

اختر document_type من هذه القوالب فقط:
- invoice
- id
- contract
- medical_report
- receipt

أعد JSON فقط بهذا الشكل:
{
  "document_type": { "value": "invoice | id | contract | medical_report | receipt", "confidence": 0.0 },
  "needs_review": true,
  "fields": {
    "invoice_number": { "value": "رقم الفاتورة إن وجد", "confidence": 0.0 },
    "receipt_number": { "value": "رقم الإيصال إن وجد", "confidence": 0.0 },
    "contract_number": { "value": "رقم العقد إن وجد", "confidence": 0.0 },
    "id_number": { "value": "رقم الهوية إن وجد", "confidence": 0.0 },
    "full_name": { "value": "الاسم الكامل إن وجد", "confidence": 0.0 },
    "patient_name": { "value": "اسم المريض إن وجد", "confidence": 0.0 },
    "date": { "value": "التاريخ", "confidence": 0.0 },
    "due_date": { "value": "تاريخ الاستحقاق إن وجد", "confidence": 0.0 },
    "start_date": { "value": "تاريخ بداية العقد إن وجد", "confidence": 0.0 },
    "end_date": { "value": "تاريخ نهاية العقد إن وجد", "confidence": 0.0 },
    "vendor_name": { "value": "اسم الجهة أو البائع", "confidence": 0.0 },
    "buyer_name": { "value": "اسم المشتري إن وجد", "confidence": 0.0 },
    "party_a": { "value": "الطرف الأول إن وجد", "confidence": 0.0 },
    "party_b": { "value": "الطرف الثاني إن وجد", "confidence": 0.0 },
    "total_amount": { "value": "المبلغ الإجمالي شاملاً الضريبة", "confidence": 0.0 },
    "subtotal": { "value": "الإجمالي قبل الضريبة", "confidence": 0.0 },
    "tax_amount": { "value": "قيمة الضريبة", "confidence": 0.0 },
    "tax_rate": { "value": "نسبة الضريبة", "confidence": 0.0 },
    "currency": { "value": "العملة", "confidence": 0.0 },
    "vat_number": { "value": "الرقم الضريبي", "confidence": 0.0 },
    "cr_number": { "value": "رقم السجل التجاري", "confidence": 0.0 },
    "payment_method": { "value": "طريقة الدفع", "confidence": 0.0 },
    "bank_account": { "value": "رقم الحساب", "confidence": 0.0 },
    "diagnosis": { "value": "التشخيص إن وجد", "confidence": 0.0 },
    "recommendations": { "value": "التوصيات إن وجدت", "confidence": 0.0 },
    "notes": { "value": "أي ملاحظات مهمة", "confidence": 0.0 }
  }
}

اجعل confidence رقماً بين 0 و1 لكل حقل إن أمكن.
اجعل needs_review=true عندما تكون الصورة غير واضحة، أو توجد حقول حرجة منخفضة الثقة، أو لا يمكن تحديد نوع المستند.
إذا لم يكن الحقل موجوداً اجعل value=null ولا تخترع قيمة.`;

  function buildGeminiRequest(mimeType, data) {
    return {
      model: GEMINI_MODEL,
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: OCR_PROMPT },
          { type: 'input_file', mime_type: mimeType, data }
        ]
      }],
      temperature: 0.1,
      max_tokens: 2048,
      response_format: { type: 'json_object' }
    };
  }

  async function callGemini(body) {
    const request = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    };
    if (window.BrightAIGateway?.apiFetch) {
      return window.BrightAIGateway.apiFetch(AI_COMPLETIONS_PATH, request, 45000);
    }
    const url = window.BrightAIRuntimeConfig?.buildApiUrl
      ? window.BrightAIRuntimeConfig.buildApiUrl(AI_COMPLETIONS_PATH)
      : AI_COMPLETIONS_PATH;
    return fetch(url, request);
  }

  function parseGeminiJSON(raw) {
    const clean = String(raw || '{}')
      .replace(/```json\s*/gi, '')
      .replace(/```/g, '')
      .trim();

    try {
      return JSON.parse(clean);
    } catch (_) {
      const match = clean.match(/\{[\s\S]*\}/);
      return match ? JSON.parse(match[0]) : {};
    }
  }

  async function runOCR() {
    const file = fileEl.files && fileEl.files[0];
    if (!file) {
      setError('يرجى اختيار ملف أولاً.');
      return;
    }

    if (file.size > MAX_BYTES) {
      setError('حجم الملف يتجاوز 4 ميجابايت في التجربة العامة. يرجى اختيار ملف أصغر.');
      return;
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('نوع الملف غير مدعوم. المقبول: PDF وPNG وJPG وWEBP.');
      return;
    }

    setLoading(true);

    try {
      renderProgress('read');
      const b64 = await toBase64(file);

      renderProgress('send', ['read']);
      const res = await callGemini(buildGeminiRequest(file.type, b64));

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData?.error?.message || `خطأ ${res.status}`);
      }

      renderProgress('extract', ['read', 'send']);
      const data = await res.json();
      const raw = data?.choices?.[0]?.message?.content || data?.answer || '{}';
      const parsed = parseGeminiJSON(raw);

      renderProgress('review', ['read', 'send', 'extract']);
      const normalized = renderFields(parsed);
      renderJSON(normalized);

      outEl.classList.add('done-pulse');
      setTimeout(() => outEl.classList.remove('done-pulse'), 800);
    } catch (err) {
      console.error('[BrightAI OCR]', err);
      setError('تعذّر تحليل الملف. تحقق من الاتصال وحاول مرة أخرى.');
    } finally {
      setLoading(false);
    }
  }

  btnRun.addEventListener('click', runOCR);

  if (dropZone) {
    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('drag-over');
    });

    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));

    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('drag-over');
      const dt = e.dataTransfer;

      if (dt && dt.files.length) {
        fileEl.files = dt.files;
        updateFileLabel(dt.files[0].name);
        runOCR();
      }
    });
  }

  fileEl.addEventListener('change', () => {
    if (fileEl.files[0]) updateFileLabel(fileEl.files[0].name);
  });

  function updateFileLabel(name) {
    const label = document.getElementById('file-name-label');
    if (label) label.textContent = name;
  }

  const copyBtn = document.getElementById('copy-json');
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(jsonEl.textContent || '{}').then(() => {
        copyBtn.innerHTML = '<i class="fa-solid fa-check"></i> تم النسخ';
        setTimeout(() => {
          copyBtn.innerHTML = '<i class="fa-solid fa-copy"></i> نسخ JSON';
        }, 2000);
      });
    });
  }
})();
