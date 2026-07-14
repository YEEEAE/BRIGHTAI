/**
 * BrightAI Kernel - Compliance Module
 * حزم الامتثال ومنطق التحقق
 */

const KernelCompliance = (function() {
  'use strict';

  // تعريف حزم الامتثال
  const COMPLIANCE_PACKAGES = {
    pdpl: {
      id: 'pdpl',
      name: 'PDPL',
      fullName: 'نظام حماية البيانات الشخصية',
      fullNameEn: 'Personal Data Protection Law',
      region: 'المملكة العربية السعودية',
      regionEn: 'Saudi Arabia',
      color: '#10b981',
      icon: '🇸🇦',
      riskThreshold: 30,
      autoBlockTypes: ['saudi_id', 'saudi_iban'],
      requirements: [
        { id: 'consent', name: 'الموافقة على معالجة البيانات', nameEn: 'Data Processing Consent', weight: 25 },
        { id: 'access', name: 'حق الوصول والتصحيح', nameEn: 'Right to Access & Rectify', weight: 20 },
        { id: 'breach', name: 'الإخطار بالانتهاكات', nameEn: 'Breach Notification', weight: 20 },
        { id: 'retention', name: 'سياسة الاحتفاظ بالبيانات', nameEn: 'Data Retention Policy', weight: 15 },
        { id: 'transfer', name: 'نقل البيانات العابر للحدود', nameEn: 'Cross-border Transfer', weight: 20 },
      ],
      piiTypes: ['saudi_id', 'phone_sa', 'iqama', 'saudi_iban', 'email', 'vat_number', 'commercial_reg', 'employee_id'],
    },
    gdpr: {
      id: 'gdpr',
      name: 'GDPR',
      fullName: 'اللائحة العامة لحماية البيانات',
      fullNameEn: 'General Data Protection Regulation',
      region: 'الاتحاد الأوروبي',
      regionEn: 'European Union',
      color: '#3b82f6',
      icon: '🇪🇺',
      riskThreshold: 35,
      autoBlockTypes: [],
      requirements: [
        { id: 'forget', name: 'حق النسيان', nameEn: 'Right to be Forgotten', weight: 20 },
        { id: 'portability', name: 'نقل البيانات', nameEn: 'Data Portability', weight: 20 },
        { id: 'documentation', name: 'توثيق المعالجة', nameEn: 'Processing Documentation', weight: 25 },
        { id: 'dpo', name: 'مسؤول حماية البيانات', nameEn: 'Data Protection Officer', weight: 15 },
        { id: 'impact', name: 'تقييم الأثر', nameEn: 'Impact Assessment', weight: 20 },
      ],
      piiTypes: ['email', 'phone', 'name', 'ip_address', 'location'],
    },
    hipaa: {
      id: 'hipaa',
      name: 'HIPAA',
      fullName: 'قانون حماية البيانات الصحية',
      fullNameEn: 'Health Insurance Portability and Accountability Act',
      region: 'الولايات المتحدة',
      regionEn: 'United States',
      color: '#8b5cf6',
      icon: '🏥',
      riskThreshold: 25,
      autoBlockTypes: ['medical_id', 'ssn'],
      requirements: [
        { id: 'encryption', name: 'تشفير البيانات الصحية', nameEn: 'PHI Encryption', weight: 30 },
        { id: 'access_logs', name: 'سجلات الوصول', nameEn: 'Access Audit Logs', weight: 25 },
        { id: 'baa', name: 'اتفاقيات الشركاء', nameEn: 'Business Associate Agreements', weight: 25 },
        { id: 'training', name: 'تدريب الموظفين', nameEn: 'Staff Training', weight: 20 },
      ],
      piiTypes: ['medical_id', 'ssn', 'health_info', 'insurance_id'],
    },
    pci: {
      id: 'pci',
      name: 'PCI DSS',
      fullName: 'معيار أمان بيانات البطاقات',
      fullNameEn: 'Payment Card Industry Data Security Standard',
      region: 'عالمي',
      regionEn: 'Global',
      color: '#f97316',
      icon: '💳',
      riskThreshold: 20,
      autoBlockTypes: ['credit_card', 'cvv'],
      requirements: [
        { id: 'card_protection', name: 'حماية بيانات البطاقات', nameEn: 'Cardholder Data Protection', weight: 35 },
        { id: 'transit_encryption', name: 'التشفير أثناء النقل', nameEn: 'Encryption in Transit', weight: 25 },
        { id: 'pen_test', name: 'اختبارات الاختراق', nameEn: 'Penetration Testing', weight: 20 },
        { id: 'monitoring', name: 'المراقبة المستمرة', nameEn: 'Continuous Monitoring', weight: 20 },
      ],
      piiTypes: ['credit_card', 'cvv', 'bank_account', 'card_expiry'],
    },
    iso27001: {
      id: 'iso27001',
      name: 'ISO 27001',
      fullName: 'معيار أمن المعلومات',
      fullNameEn: 'Information Security Management System',
      region: 'عالمي',
      regionEn: 'Global',
      color: '#6b7280',
      icon: '🔒',
      riskThreshold: 35,
      autoBlockTypes: [],
      requirements: [
        { id: 'policy', name: 'سياسة أمن المعلومات', nameEn: 'Information Security Policy', weight: 25 },
        { id: 'risk_mgmt', name: 'إدارة المخاطر', nameEn: 'Risk Management', weight: 25 },
        { id: 'internal_audit', name: 'التدقيق الداخلي', nameEn: 'Internal Audit', weight: 25 },
        { id: 'incident', name: 'إدارة الحوادث', nameEn: 'Incident Management', weight: 25 },
      ],
      piiTypes: ['api_key', 'password', 'secret', 'access_token'],
    },
  };

  // حالة الامتثال (محاكاة - في الإنتاج تأتي من الـ API)
  let complianceState = {
    pdpl: { 
      score: 98, 
      status: 'compliant', 
      lastAudit: new Date().toISOString(),
      requirementScores: { consent: 100, access: 100, breach: 95, retention: 95, transfer: 100 } 
    },
    gdpr: { 
      score: 95, 
      status: 'compliant', 
      lastAudit: new Date().toISOString(),
      requirementScores: { forget: 100, portability: 100, documentation: 85, dpo: 100, impact: 90 } 
    },
    hipaa: { 
      score: 78, 
      status: 'partial', 
      lastAudit: new Date().toISOString(),
      requirementScores: { encryption: 100, access_logs: 80, baa: 50, training: 80 } 
    },
    pci: { 
      score: 100, 
      status: 'compliant', 
      lastAudit: new Date().toISOString(),
      requirementScores: { card_protection: 100, transit_encryption: 100, pen_test: 100, monitoring: 100 } 
    },
    iso27001: { 
      score: 92, 
      status: 'compliant', 
      lastAudit: new Date().toISOString(),
      requirementScores: { policy: 100, risk_mgmt: 100, internal_audit: 75, incident: 95 } 
    },
  };

  /**
   * الحصول على حزمة امتثال
   */
  function getPackage(packageId) {
    return COMPLIANCE_PACKAGES[packageId] || null;
  }

  /**
   * الحصول على جميع الحزم
   */
  function getAllPackages() {
    return Object.values(COMPLIANCE_PACKAGES);
  }

  /**
   * الحصول على حالة الامتثال لحزمة
   */
  function getComplianceState(packageId) {
    return complianceState[packageId] || null;
  }

  /**
   * الحصول على حالة جميع الحزم
   */
  function getAllComplianceStates() {
    return complianceState;
  }

  /**
   * التحقق مما إذا كان نوع PII يجب حجبه تلقائياً
   */
  function shouldAutoBlock(packageId, piiType) {
    const pkg = COMPLIANCE_PACKAGES[packageId];
    if (!pkg) return false;
    return pkg.autoBlockTypes.includes(piiType);
  }

  /**
   * الحصول على حد المخاطر لحزمة
   */
  function getRiskThreshold(packageId) {
    const pkg = COMPLIANCE_PACKAGES[packageId];
    return pkg ? pkg.riskThreshold : 40;
  }

  /**
   * حساب مجموع الامتثال الكلي
   */
  function calculateOverallScore() {
    const scores = Object.values(complianceState).map(s => s.score);
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  }

  /**
   * حساب المتطلبات المحققة
   */
  function calculateMetRequirements() {
    let total = 0;
    let met = 0;
    
    for (const [pkgId, state] of Object.entries(complianceState)) {
      const pkg = COMPLIANCE_PACKAGES[pkgId];
      if (!pkg) continue;
      
      total += pkg.requirements.length;
      met += Object.values(state.requirementScores).filter(score => score >= 80).length;
    }
    
    return { total, met };
  }

  /**
   * حساب المتطلبات التي تحتاج مراجعة
   */
  function calculateNeedsReview() {
    let count = 0;
    
    for (const state of Object.values(complianceState)) {
      count += Object.values(state.requirementScores).filter(score => score < 80 && score >= 50).length;
    }
    
    return count;
  }

  /**
   * تحديث حالة الامتثال (من الـ API)
   */
  async function refreshComplianceState() {
    try {
      const response = await fetch('/api/kernel/compliance');
      if (response.ok) {
        const data = await response.json();
        if (data.state) {
          complianceState = data.state;
        }
      }
    } catch (error) {
      console.warn('Failed to refresh compliance state:', error);
    }
    return complianceState;
  }

  /**
   * الحصول على تسمية حالة الامتثال
   */
  function getStatusLabel(status) {
    const labels = {
      compliant: 'ممتثل',
      partial: 'جزئي',
      'non-compliant': 'غير ممتثل',
    };
    return labels[status] || status;
  }

  /**
   * الحصول على لون حالة الامتثال
   */
  function getStatusColor(status) {
    const colors = {
      compliant: '#10b981',
      partial: '#f59e0b',
      'non-compliant': '#ef4444',
    };
    return colors[status] || '#6b7280';
  }

  /**
   * الحصول على لون نسبة الامتثال
   */
  function getScoreColor(score) {
    if (score >= 90) return '#10b981';
    if (score >= 70) return '#f59e0b';
    return '#ef4444';
  }

  /**
   * تنسيق التاريخ بالعربية
   */
  function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  /**
   * إنشاء HTML لبطاقة إطار الامتثال
   */
  function renderFrameworkCard(packageId) {
    const pkg = COMPLIANCE_PACKAGES[packageId];
    const state = complianceState[packageId];
    if (!pkg || !state) return '';

    const statusLabel = getStatusLabel(state.status);
    const statusClass = state.status === 'compliant' ? 'compliant' : state.status === 'partial' ? 'partial' : 'non-compliant';
    const progressColor = state.score >= 90 ? 'green' : state.score >= 70 ? 'yellow' : 'red';

    const requirementsHtml = pkg.requirements.map(req => {
      const reqScore = state.requirementScores[req.id] || 0;
      const reqStatus = reqScore >= 80 ? 'met' : reqScore >= 50 ? 'partial' : 'unmet';
      const icon = reqStatus === 'met' 
        ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>'
        : reqStatus === 'partial'
        ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>'
        : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
      
      return `<div class="requirement-item ${reqStatus}">${icon}${req.name}</div>`;
    }).join('');

    return `
      <div class="framework-card" data-package="${packageId}">
        <div class="framework-header">
          <div class="framework-info">
            <div class="framework-logo" style="background: ${pkg.color}; color: white;">${pkg.name.substring(0, 4)}</div>
            <span class="framework-name">${pkg.fullName}</span>
          </div>
          <span class="framework-badge ${statusClass}">${statusLabel}</span>
        </div>
        <div class="framework-body">
          <div class="framework-progress">
            <div class="progress-header">
              <span class="progress-label">نسبة الامتثال</span>
              <span class="progress-value">${state.score}%</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill ${progressColor}" style="width: ${state.score}%"></div>
            </div>
          </div>
          <div class="framework-requirements">${requirementsHtml}</div>
        </div>
        <div class="framework-footer">
          <span class="framework-date">آخر تقييم: ${formatDate(state.lastAudit)}</span>
          <button class="framework-btn" type="button" data-action="show-details" data-package-id="${packageId}">عرض التفاصيل</button>
        </div>
      </div>
    `;
  }

  /**
   * عرض تفاصيل إطار الامتثال
   */
  function showDetails(packageId) {
    const pkg = COMPLIANCE_PACKAGES[packageId];
    const state = complianceState[packageId];
    if (!pkg || !state) return;

    // يمكن استبدال هذا بـ modal
    const details = `
تفاصيل ${pkg.fullName}

المنطقة: ${pkg.region}
نسبة الامتثال: ${state.score}%
الحالة: ${getStatusLabel(state.status)}

المتطلبات:
${pkg.requirements.map(req => {
  const score = state.requirementScores[req.id] || 0;
  return `- ${req.name}: ${score}%`;
}).join('\n')}

للحصول على تقرير مفصل، استخدم صفحة التقارير.
    `.trim();

    alert(details);
  }

  /**
   * إنشاء تنويه الإخلاء
   */
  function renderDisclaimer() {
    return `
      <div class="compliance-disclaimer">
        <div class="disclaimer-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>
        <div class="disclaimer-content">
          <strong>تنويه مهم:</strong>
          هذه الأداة توفر تقييماً آلياً لمستوى الامتثال بناءً على الإعدادات الحالية للنظام. 
          <strong>النتائج المعروضة ليست شهادة امتثال رسمية</strong> ولا تحل محل التدقيق المعتمد من جهات الاعتماد المرخصة.
          للحصول على شهادة امتثال رسمية، يرجى التواصل مع جهة تدقيق معتمدة.
        </div>
      </div>
    `;
  }

  // Public API
  return {
    PACKAGES: COMPLIANCE_PACKAGES,
    getPackage,
    getAllPackages,
    getComplianceState,
    getAllComplianceStates,
    shouldAutoBlock,
    getRiskThreshold,
    calculateOverallScore,
    calculateMetRequirements,
    calculateNeedsReview,
    refreshComplianceState,
    getStatusLabel,
    getStatusColor,
    getScoreColor,
    formatDate,
    renderFrameworkCard,
    showDetails,
    renderDisclaimer,
  };
})();

// Export to browser global scope
if (typeof window !== 'undefined') {
  window.KernelCompliance = KernelCompliance;
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = KernelCompliance;
}
