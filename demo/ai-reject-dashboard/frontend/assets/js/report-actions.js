/**
 * Report Actions — Unified PDF/Print/Download module
 * All pages use this instead of separate export logic.
 */
const ReportActions = (() => {
  const API_GENERATE = '/api/reports/generate';
  const API_DOWNLOAD = '/api/reports/download/';

  function showLoading(lang) {
    const toast = document.createElement('div');
    toast.id = 'report-loading-toast';
    toast.style.cssText = 'position:fixed;bottom:24px;left:24px;z-index:10000;background:#0F4C81;color:#fff;padding:16px 20px;border-radius:8px;box-shadow:0 10px 25px rgba(0,0,0,0.15);font-family:IBM Plex Sans Arabic,sans-serif;direction:rtl;max-width:380px;';
    toast.innerHTML = `<div style="display:flex;align-items:center;gap:10px;"><div class="spinner" style="width:20px;height:20px;border:3px solid rgba(255,255,255,0.3);border-top-color:#fff;border-radius:50%;animation:raspin 0.8s linear infinite;"></div><span>${lang === 'ar' ? 'جاري توليد التقرير...' : 'Generating report...'}</span></div><style>@keyframes raspin{to{transform:rotate(360deg)}}</style>`;
    document.body.appendChild(toast);
    return toast;
  }

  function removeLoading() {
    const el = document.getElementById('report-loading-toast');
    if (el) el.remove();
  }

  function showError(lang, msg) {
    removeLoading();
    if (window.BrightNotifications) {
      window.BrightNotifications.toast({
        type: 'error',
        title: lang === 'ar' ? 'خطأ في التقرير' : 'Report Error',
        message: msg || (lang === 'ar' ? 'فشل توليد التقرير.' : 'Report generation failed.')
      });
    }
  }

  function showSuccess(lang, fileName) {
    removeLoading();
    if (window.BrightNotifications) {
      window.BrightNotifications.toast({
        type: 'success',
        title: lang === 'ar' ? 'تم التقرير' : 'Report Ready',
        message: lang === 'ar' ? `تم توليد وتنزيل التقرير بنجاح: ${fileName || ''}` : `Report generated successfully: ${fileName || ''}`
      });
    }
  }

  async function generatePagePdfReport(pageName, template, filters) {
    const lang = document.documentElement.lang || 'ar';
    showLoading(lang);

    const sectionMap = {
      executive: ['cover', 'summary', 'kpis', 'pareto', 'signatures'],
      finance: ['cover', 'kpis', 'financials', 'pareto', 'signatures'],
      quality: ['cover', 'summary', 'kpis', 'capa', 'audit', 'signatures'],
      production: ['cover', 'kpis', 'pareto', 'audit', 'signatures'],
      workflow: ['cover', 'summary', 'kpis', 'audit', 'signatures'],
      technical: ['cover', 'summary', 'kpis', 'signatures'],
      reports: ['cover', 'summary', 'kpis', 'pareto', 'signatures'],
      profile: ['cover', 'summary', 'signatures'],
      users: ['cover', 'summary', 'audit', 'signatures']
    };

    const templateId = template || pageName || 'executive';
    const sections = sectionMap[templateId] || sectionMap.executive;

    const payload = {
      template: templateId,
      format: 'pdf',
      sections: sections,
      filters: filters || { dateRange: 'last_month', fromDate: '', toDate: '', department: 'all' },
      security: { watermark: 'CONFIDENTIAL', expiryDate: '' },
      user: 'Quality Manager'
    };

    try {
      const res = await fetch(API_GENERATE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include'
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || `Server ${res.status}`);
      }

      const data = await res.json();
      const report = data.data || data;
      const reportId = report.id;

      if (reportId) {
        window.location.href = API_DOWNLOAD + reportId;
        showSuccess(lang, report.fileName || reportId);
      } else {
        throw new Error(lang === 'ar' ? 'لم يتم إرجاع معرف التقرير.' : 'No report ID returned.');
      }
    } catch (err) {
      showError(lang, err.message);
    }
  }

  function printCurrentPage() {
    window.print();
  }

  async function downloadReport(reportId) {
    const lang = document.documentElement.lang || 'ar';
    if (!reportId) {
      showError(lang, lang === 'ar' ? 'معرف التقرير غير محدد.' : 'Report ID not specified.');
      return;
    }
    window.location.href = API_DOWNLOAD + reportId;
  }

  return {
    generatePagePdfReport,
    printCurrentPage,
    downloadReport,
    showLoading,
    showError,
    showSuccess
  };
})();

window.ReportActions = ReportActions;
