/**
 * kernel-connectors-data.js — UMD mirror of src/data/kernel-connectors.ts (M26).
 *
 * Byte-for-byte identical algorithm. No Math.random, no Date.now, no
 * toLocaleString. Works in: browser main thread (window.KernelConnectorsData),
 * Web Worker (importScripts), Node (module.exports).
 *
 * CSP-safe: no dynamic imports, no eval, no Function constructor.
 */
(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.KernelConnectorsData = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // ── Constants ──────────────────────────────────────────────────────────────

  var CONNECTORS_SEED = 0x434f4e4e;
  var CONNECTORS_COUNT = 8;
  var CONNECTORS_CONNECTED = 6;
  var CONNECTORS_PENDING = 1;
  var CONNECTORS_ERROR = 1;
  var CONNECTORS_SYNC_HISTORY = 8;
  var CONNECTORS_GUIDE_STEPS = 4;

  // ── PRNG ───────────────────────────────────────────────────────────────────

  function mulberry32(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // ── Connectors ─────────────────────────────────────────────────────────────

  function buildConnectors() {
    return [
      { id: 'sap', name: 'SAP S/4HANA', category: 'ERP', description: 'وحدة المالية والمشتريات في SAP. قراءة فقط — بدون وصول كتابة.', icon: '🏢', status: 'connected', statusLabel: 'متصل', lastSync: 'قبل 3 دقائق', recordsToday: 1420, totalRecords: 184293, avgLatencyMs: 145, uptime: '99.8%', authMethod: 'OAuth 2.0', endpoint: 'sap-prod.saudi-company.com:8443', syncFreq: 'كل 5 دقائق', readOnly: true, healthPercent: 99 },
      { id: 'oracle-ebs', name: 'Oracle E-Business Suite', category: 'ERP', description: 'الموارد البشرية وكشوف الرواتب في Oracle EBS. قراءة فقط.', icon: '🏛️', status: 'connected', statusLabel: 'متصل', lastSync: 'قبل 8 دقائق', recordsToday: 218, totalRecords: 42891, avgLatencyMs: 198, uptime: '99.5%', authMethod: 'OAuth 2.0', endpoint: 'oracle-ebs.saudi-company.com', syncFreq: 'كل 15 دقيقة', readOnly: true, healthPercent: 99 },
      { id: 'dynamics365', name: 'Microsoft Dynamics 365', category: 'CRM', description: 'إدارة العملاء والفرص في Dynamics 365. قراءة فقط.', icon: '💼', status: 'connected', statusLabel: 'متصل', lastSync: 'قبل 12 دقيقة', recordsToday: 86, totalRecords: 12450, avgLatencyMs: 165, uptime: '99.9%', authMethod: 'Azure AD (SAML)', endpoint: 'saudi-company.crm.dynamics.com', syncFreq: 'كل 10 دقائق', readOnly: true, healthPercent: 100 },
      { id: 'epic-his', name: 'Epic HIS', category: 'Healthcare', description: 'سجلات المرضى الإلكترونية في Epic. حساسة — تخضع لـ SFDA + HIPAA.', icon: '⚕️', status: 'connected', statusLabel: 'متصل', lastSync: 'قبل 5 دقائق', recordsToday: 312, totalRecords: 58234, avgLatencyMs: 220, uptime: '99.7%', authMethod: 'SAML 2.0', endpoint: 'epic-prod.health.saudi-company.com', syncFreq: 'كل 5 دقائق', readOnly: true, healthPercent: 99 },
      { id: 'moodle', name: 'Moodle LMS', category: 'Education', description: 'سجلات الطلاب في Moodle. يتطلب إعداد OAuth.', icon: '🎓', status: 'pending', statusLabel: 'معلق', lastSync: 'لم تتم المزامنة', recordsToday: 0, totalRecords: 0, avgLatencyMs: 0, uptime: '—', authMethod: 'OAuth (مطلوب)', endpoint: 'lms.saudi-company.com', syncFreq: '—', readOnly: true, healthPercent: 0 },
      { id: 'sharepoint', name: 'Microsoft SharePoint', category: 'Documents', description: 'مستندات المؤسسة في SharePoint. فهرسة الوثائق الحساسة.', icon: '📁', status: 'connected', statusLabel: 'متصل', lastSync: 'قبل 15 دقيقة', recordsToday: 184, totalRecords: 24189, avgLatencyMs: 132, uptime: '99.6%', authMethod: 'Azure AD (SAML)', endpoint: 'saudi-company.sharepoint.com', syncFreq: 'كل 30 دقيقة', readOnly: true, healthPercent: 99 },
      { id: 'salesforce', name: 'Salesforce', category: 'CRM', description: 'بيانات العملاء المحتملين في Salesforce.', icon: '☁️', status: 'error', statusLabel: 'خطأ', lastSync: 'فشل قبل ساعتين', recordsToday: 0, totalRecords: 18420, avgLatencyMs: 0, uptime: '94.2%', authMethod: 'OAuth 2.0', endpoint: 'saudi-company.my.salesforce.com', syncFreq: 'كل 10 دقائق', readOnly: true, errorMsg: 'انتهت صلاحية Access Token — يحتاج تجديد', healthPercent: 94 },
      { id: 'okta', name: 'Okta SSO', category: 'Identity', description: 'تسجيل الدخول الموحد وأدوار المستخدمين.', icon: '🔐', status: 'connected', statusLabel: 'متصل', lastSync: 'قبل 30 ثانية', recordsToday: 92, totalRecords: 8420, avgLatencyMs: 88, uptime: '99.95%', authMethod: 'API Token', endpoint: 'saudi-company.okta.com', syncFreq: 'real-time', readOnly: true, healthPercent: 100 }
    ];
  }

  // ── Sync history ───────────────────────────────────────────────────────────

  function buildSyncHistory() {
    var connectors = buildConnectors();
    return connectors.map(function (c, i) {
      var status = c.status === 'error' ? 'failed' : c.status === 'pending' ? 'partial' : 'success';
      return {
        id: 'sync-' + String(i + 1).padStart(3, '0'),
        connectorId: c.id,
        time: c.lastSync,
        status: status,
        records: c.recordsToday,
        duration: c.avgLatencyMs > 0 ? c.avgLatencyMs + Math.floor((i % 3) * 15) : 0
      };
    });
  }

  // ── Custom guide ───────────────────────────────────────────────────────────

  function buildCustomGuide() {
    return [
      { step: 1, title: 'حدد نوع البيانات', description: 'حدد نوع البيانات اللي تبي تربطها (ERP، CRM، HIS...) ومستوى حساسيتها.' },
      { step: 2, title: 'اختر طريقة المصادقة', description: 'OAuth 2.0 للأنظمة السحابية، SAML 2.0 للأنظمة المؤسسية، API Token للأنظمة البسيطة.' },
      { step: 3, title: 'اضبط الصلاحيات', description: 'كل الموصلات قراءة فقط افتراضياً. وصول الكتابة يتطلب موافقة DPO.' },
      { step: 4, title: 'اختبر بموكل آمن', description: 'اختبر الموصل بـ safe mock قبل الاتصال الفعلي. ما نرسل بيانات حقيقية في الاختبار.' }
    ];
  }

  // ── KPIs ───────────────────────────────────────────────────────────────────

  function buildKpis() {
    var connectors = buildConnectors();
    var active = connectors.filter(function (c) { return c.status === 'connected'; }).length;
    var requestsToday = connectors.reduce(function (sum, c) { return sum + c.recordsToday; }, 0);
    var latencies = connectors.filter(function (c) { return c.avgLatencyMs > 0; }).map(function (c) { return c.avgLatencyMs; });
    var avgLatency = latencies.length > 0 ? Math.round(latencies.reduce(function (a, b) { return a + b; }, 0) / latencies.length) : 0;

    return { total: connectors.length, active: active, requestsToday: requestsToday, avgLatency: avgLatency };
  }

  // ── Full dataset ───────────────────────────────────────────────────────────

  function buildConnectorsData() {
    return {
      connectors: buildConnectors(),
      syncHistory: buildSyncHistory(),
      customGuide: buildCustomGuide(),
      kpis: buildKpis()
    };
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  return {
    CONNECTORS_SEED: CONNECTORS_SEED,
    CONNECTORS_COUNT: CONNECTORS_COUNT,
    CONNECTORS_CONNECTED: CONNECTORS_CONNECTED,
    CONNECTORS_PENDING: CONNECTORS_PENDING,
    CONNECTORS_ERROR: CONNECTORS_ERROR,
    CONNECTORS_SYNC_HISTORY: CONNECTORS_SYNC_HISTORY,
    CONNECTORS_GUIDE_STEPS: CONNECTORS_GUIDE_STEPS,
    mulberry32: mulberry32,
    buildConnectors: buildConnectors,
    buildSyncHistory: buildSyncHistory,
    buildCustomGuide: buildCustomGuide,
    buildKpis: buildKpis,
    buildConnectorsData: buildConnectorsData
  };
}));