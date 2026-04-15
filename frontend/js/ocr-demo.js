(function () {
    const ocrBtn = document.getElementById('ocr-run');
    const ocrOutput = document.getElementById('ocr-output');
    const ocrJson = document.getElementById('ocr-json');
    const ocrFile = document.getElementById('ocr-file');
    const originalOcrBtnHtml = ocrBtn ? ocrBtn.innerHTML : '';

    const fieldLabels = {
        document_type: 'نوع المستند',
        invoice_number: 'رقم الفاتورة',
        total_amount: 'المبلغ الإجمالي',
        tax_amount: 'قيمة الضريبة',
        date: 'التاريخ',
        vendor_name: 'الجهة',
        currency: 'العملة'
    };

    function renderFields(fields) {
        if (!ocrOutput) return;
        ocrOutput.innerHTML = '';
        if (!fields || typeof fields !== 'object') {
            const row = document.createElement('div');
            row.className = 'field-row';
            const label = document.createElement('span');
            label.textContent = 'الحالة';
            const value = document.createElement('span');
            value.textContent = 'لم يتم العثور على حقول واضحة';
            row.appendChild(label);
            row.appendChild(value);
            ocrOutput.appendChild(row);
            return;
        }

        const entries = Object.keys(fieldLabels)
            .filter((key) => fields[key] !== undefined && fields[key] !== null && fields[key] !== '')
            .map((key) => [key, fields[key]]);

        if (entries.length === 0) {
            const row = document.createElement('div');
            row.className = 'field-row';
            const label = document.createElement('span');
            label.textContent = 'الحالة';
            const value = document.createElement('span');
            value.textContent = 'لم يتم العثور على حقول واضحة';
            row.appendChild(label);
            row.appendChild(value);
            ocrOutput.appendChild(row);
            return;
        }

        for (const [key, value] of entries) {
            const row = document.createElement('div');
            row.className = 'field-row';
            const label = document.createElement('span');
            label.textContent = fieldLabels[key] || key;
            const val = document.createElement('span');
            val.textContent = String(value);
            row.appendChild(label);
            row.appendChild(val);
            ocrOutput.appendChild(row);
        }
    }

    function renderJson(fields) {
        if (!ocrJson) return;
        try {
            ocrJson.textContent = JSON.stringify(fields || {}, null, 2);
        } catch (e) {
            ocrJson.textContent = 'تعذر توليد JSON.';
        }
    }

    function fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(new Error('READ_ERROR'));
            reader.readAsDataURL(file);
        });
    }

    function resolveApiBase() {
        if (window.BRIGHTAI_API_BASE) return window.BRIGHTAI_API_BASE;
        if (location && location.origin && location.origin !== 'null') {
            return location.origin;
        }
        return 'http://localhost:3000';
    }

    async function runOcr() {
        if (!ocrBtn || !ocrFile) return;
        const file = ocrFile.files && ocrFile.files[0];
        if (!file) {
            renderFields(null);
            if (ocrJson) ocrJson.textContent = 'يرجى اختيار ملف قبل البدء.';
            return;
        }

        if (file.size > 4 * 1024 * 1024) {
            renderFields(null);
            if (ocrJson) ocrJson.textContent = 'حجم الملف كبير. الحد الأقصى 4 ميجابايت.';
            return;
        }

        ocrBtn.disabled = true;
        ocrBtn.innerHTML = 'جارٍ التحليل...';
        if (ocrOutput) {
            ocrOutput.innerHTML = '<div style="color:#f59e0b;">جارٍ استخراج النص والحقول...</div>';
        }
        if (ocrJson) {
            ocrJson.textContent = 'جارٍ تجهيز JSON...';
        }

        try {
            const base64 = await fileToBase64(file);
            const apiBase = resolveApiBase();
            const response = await fetch(`${apiBase}/api/ai/ocr`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fileBase64: base64,
                    mimeType: file.type,
                    fileName: file.name
                })
            });

            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                renderFields(null);
                if (ocrJson) {
                    ocrJson.textContent = data.error || 'تعذر تحليل الملف حالياً.';
                }
                return;
            }

            renderFields(data.fields);
            renderJson(data.fields);
        } catch (error) {
            renderFields(null);
            if (ocrJson) {
                ocrJson.textContent = 'حدث خطأ أثناء التحليل. جرّب مرة أخرى.';
            }
        } finally {
            ocrBtn.disabled = false;
            ocrBtn.innerHTML = originalOcrBtnHtml;
        }
    }

    if (ocrBtn) {
        ocrBtn.addEventListener('click', runOcr);
    }
})();
