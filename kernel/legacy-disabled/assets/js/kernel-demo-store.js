/**
 * BrightAI Kernel - Demo Store
 * Owns demo-mode state, persistence, defaults, and synthetic live updates.
 */

(function (global) {
  'use strict';

  const { normalizeStats } = global.KernelApiHelpers || {};
  const scriptUrl = document.currentScript?.src || global.location?.href || '';
  const mockBaseUrl = new URL('../../api/mock/', scriptUrl);

  if (typeof normalizeStats !== 'function') {
    throw new Error('KernelApiHelpers must load before kernel-demo-store.js');
  }

  function getHardcodedDefaults() {
    const trace1 = "AI-2026-10491";
    const trace2 = "AI-2026-10492";
    const trace3 = "AI-2026-10493";
    const trace4 = "AI-2026-10494";

    return {
      stats: {
        total: 348,
        blocked: 28,
        pending: 2,
        approved: 24,
        autoApproved: 274,
        rejected: 20,
        piiDetected: 64,
        avgRiskScore: 31.4,
        complianceRate: "92.5%",
        byCompliancePack: [
          { "compliance_pack": "pdpl", "count": 182 },
          { "compliance_pack": "nca_ecc", "count": 94 },
          { "compliance_pack": "sfda", "count": 48 },
          { "compliance_pack": "procurement", "count": 24 }
        ],
        byRiskLevel: [
          { "risk_level": "critical", "count": 12 },
          { "risk_level": "high", "count": 34 },
          { "risk_level": "medium", "count": 68 },
          { "risk_level": "low", "count": 146 },
          { "risk_level": "minimal", "count": 88 }
        ],
        requests: {
          total: 348,
          pending: 2,
          approved: 24,
          executed: 24,
          completed: 274,
          rejected: 20,
          blocked: 28
        },
        piiDetectionRate: 18,
        riskDistribution: {
          critical: 12,
          high: 34,
          medium: 68,
          low: 146,
          minimal: 88
        },
        riskByDepartment: {
          departments: [
            { name: "المشتريات", low: 120, medium: 44, high: 12, critical: 3, piiTypes: ["saudi_iban", "commercial_registration", "contract_value"] },
            { name: "الموارد البشرية", low: 68, medium: 39, high: 16, critical: 4, piiTypes: ["employee_name", "salary", "performance_review"] },
            { name: "الرعاية الصحية", low: 34, medium: 26, high: 18, critical: 9, piiTypes: ["patient_id", "saudi_id", "diagnosis"] },
            { name: "المالية", low: 52, medium: 31, high: 21, critical: 6, piiTypes: ["saudi_iban", "card_or_account", "invoice_number"] }
          ]
        },
        latestTraces: [
          {
            interactionId: "trace-10491",
            requestId: "trace-10491",
            traceId: trace1,
            status: "blocked",
            riskLevel: "critical",
            riskScore: 100,
            createdAt: new Date(Date.now() - 600000).toISOString(),
            hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
            query: "مشاركة ملف المرضى المصابين بالفيروس التاجي مع جهة بحثية خارجية تشمل أرقام الهواتف والهويات الوطنية 1029482103",
            compliancePackage: "pdpl"
          },
          {
            interactionId: "trace-10493",
            requestId: "trace-10493",
            traceId: trace3,
            status: "pending",
            riskLevel: "high",
            riskScore: 82,
            createdAt: new Date(Date.now() - 1200000).toISOString(),
            hash: "ca85d0d1e3d36b8e88fdfb06bb007a22a3eb2cd98c2534c06282ebbc6c483a99",
            query: "طلب تصدير التقرير المالي الربع سنوي للربع الأول لعام 2026 لـ شركة الاتصالات السعودية STC ويحتوي على أرقام بطاقات مصرفية SA9930000000001234567890",
            compliancePackage: "pdpl"
          },
          {
            interactionId: "trace-10492",
            requestId: "trace-10492",
            traceId: trace2,
            status: "completed",
            riskLevel: "minimal",
            riskScore: 15,
            createdAt: new Date(Date.now() - 1800000).toISOString(),
            hash: "2f4007886474ba0e00d23fbc01d2a3ec2cd98c2534c06282ebbc6c483a9937a0",
            query: "مراجعة عقد توريد توربينات غازية لصالح الشركة السعودية للكهرباء بقيمة 45,000,000 ريال سعودي والتحقق من شروط الضمان والمشتريات الحكومية",
            compliancePackage: "procurement"
          }
        ]
      },
      audit: {
        total: 348,
        rows: [
          {
            id: "ki_10491",
            interactionId: "trace-10491",
            requestId: "trace-10491",
            trace_id: trace1,
            traceId: trace1,
            created_at: new Date(Date.now() - 600000).toISOString(),
            timestamp: new Date(Date.now() - 600000).toISOString(),
            createdAt: new Date(Date.now() - 600000).toISOString(),
            serverTimestamp: null,
            user_id: "user_saudi_01",
            userId: "user_saudi_01",
            user_name: "سارة القحطاني",
            userName: "سارة القحطاني",
            ip_address: "192.168.10.45",
            user_agent: "Mozilla/5.0",
            request_message: "مشاركة ملف المرضى المصابين بالفيروس التاجي مع جهة بحثية خارجية تشمل أرقام الهواتف والهويات الوطنية 1029482103",
            query: "مشاركة ملف المرضى المصابين بالفيروس التاجي مع جهة بحثية خارجية تشمل أرقام الهواتف والهويات الوطنية 1029482103",
            originalText: "مشاركة ملف المرضى المصابين بالفيروس التاجي مع جهة بحثية خارجية تشمل أرقام الهواتف والهويات الوطنية 1029482103",
            pii_detected: 1,
            pii_types: "[\"saudi_id\"]",
            piiTypes: ["saudi_id"],
            piiDetected: ["saudi_id"],
            firewall_action: "block",
            masked_message: "مشاركة ملف المرضى المصابين بالفيروس التاجي مع جهة بحثية خارجية تشمل أرقام الهواتف والهويات الوطنية [SAUDI_ID]",
            maskedText: "مشاركة ملف المرضى المصابين بالفيروس التاجي مع جهة بحثية خارجية تشمل أرقام الهواتف والهويات الوطنية [SAUDI_ID]",
            risk_score: 100,
            riskScore: 100,
            risk_level: "critical",
            riskLevel: "critical",
            risk_reasons: "[\"Request blocked by AI Firewall due to PDPL violations\"]",
            approval_status: "blocked",
            approvalStatus: "blocked",
            action: "BLOCKED",
            actor: "system",
            gemini_response: "عذراً، تم حظر طلبك نظراً لاحتوائه على معلومات شخصية حساسة (رقم هوية وطنية) غير مشفرة، وهو ما يخالف نظام حماية البيانات الشخصية (PDPL) بالمملكة العربية السعودية.",
            response: "عذراً، تم حظر طلبك نظراً لاحتوائه على معلومات شخصية حساسة (رقم هوية وطنية) غير مشفرة، وهو ما يخالف نظام حماية البيانات الشخصية (PDPL) بالمملكة العربية السعودية.",
            response_model: "NVIDIA Llama-3.1-Nemotron",
            response_time_ms: 120,
            compliance_pack: "pdpl",
            compliancePack: "pdpl",
            compliance_flags: "[\"BLOCKED: saudi_id\"]",
            previous_hash: "a4d3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
            previousHash: "a4d3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
            record_hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
            recordHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
            hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
          },
          {
            id: "ki_10493",
            interactionId: "trace-10493",
            requestId: "trace-10493",
            trace_id: trace3,
            traceId: trace3,
            created_at: new Date(Date.now() - 1200000).toISOString(),
            timestamp: new Date(Date.now() - 1200000).toISOString(),
            createdAt: new Date(Date.now() - 1200000).toISOString(),
            serverTimestamp: null,
            user_id: "user_saudi_02",
            userId: "user_saudi_02",
            user_name: "عبد الله الشمري",
            userName: "عبد الله الشمري",
            ip_address: "192.168.10.46",
            user_agent: "Mozilla/5.0",
            request_message: "طلب تصدير التقرير المالي الربع سنوي للربع الأول لعام 2026 لـ شركة الاتصالات السعودية STC ويحتوي على أرقام بطاقات مصرفية SA9930000000001234567890",
            query: "طلب تصدير التقرير المالي الربع سنوي للربع الأول لعام 2026 لـ شركة الاتصالات السعودية STC ويحتوي على أرقام بطاقات مصرفية SA9930000000001234567890",
            originalText: "طلب تصدير التقرير المالي الربع سنوي للربع الأول لعام 2026 لـ شركة الاتصالات السعودية STC ويحتوي على أرقام بطاقات مصرفية SA9930000000001234567890",
            pii_detected: 1,
            pii_types: "[\"saudi_iban\"]",
            piiTypes: ["saudi_iban"],
            piiDetected: ["saudi_iban"],
            firewall_action: "allow",
            masked_message: "طلب تصدير التقرير المالي الربع سنوي للربع الأول لعام 2026 لـ شركة الاتصالات السعودية STC ويحتوي على أرقام بطاقات مصرفية [SAUDI_IBAN]",
            maskedText: "طلب تصدير التقرير المالي الربع سنوي للربع الأول لعام 2026 لـ شركة الاتصالات السعودية STC ويحتوي على أرقام بطاقات مصرفية [SAUDI_IBAN]",
            risk_score: 82,
            riskScore: 82,
            risk_level: "high",
            riskLevel: "high",
            risk_reasons: "[\"كشف بيانات مالية حساسة (IBAN) تتطلب مراجعة بشرية قبل الإرسال\"]",
            approval_status: "pending",
            approvalStatus: "pending",
            action: "APPROVAL_REQUESTED",
            actor: "system",
            gemini_response: null,
            compliance_pack: "pdpl",
            compliancePack: "pdpl",
            compliance_flags: "[\"REQUIRES_APPROVAL: saudi_iban\"]",
            previous_hash: "2f4007886474ba0e00d23fbc01d2a3ec2cd98c2534c06282ebbc6c483a9937a0",
            previousHash: "2f4007886474ba0e00d23fbc01d2a3ec2cd98c2534c06282ebbc6c483a9937a0",
            record_hash: "ca85d0d1e3d36b8e88fdfb06bb007a22a3eb2cd98c2534c06282ebbc6c483a99",
            recordHash: "ca85d0d1e3d36b8e88fdfb06bb007a22a3eb2cd98c2534c06282ebbc6c483a99",
            hash: "ca85d0d1e3d36b8e88fdfb06bb007a22a3eb2cd98c2534c06282ebbc6c483a99"
          },
          {
            id: "ki_10492",
            interactionId: "trace-10492",
            requestId: "trace-10492",
            trace_id: trace2,
            traceId: trace2,
            created_at: new Date(Date.now() - 1800000).toISOString(),
            timestamp: new Date(Date.now() - 1800000).toISOString(),
            createdAt: new Date(Date.now() - 1800000).toISOString(),
            serverTimestamp: null,
            user_id: "user_saudi_03",
            userId: "user_saudi_03",
            user_name: "سعد المطيري",
            userName: "سعد المطيري",
            request_message: "مراجعة عقد توريد توربينات غازية لصالح الشركة السعودية للكهرباء والتحقق من شروط الضمان والمشتريات الحكومية",
            query: "مراجعة عقد توريد توربينات غازية لصالح الشركة السعودية للكهرباء والتحقق من شروط الضمان والمشتريات الحكومية",
            pii_detected: 0,
            pii_types: "[]",
            piiTypes: [],
            piiDetected: [],
            firewall_action: "allow",
            masked_message: "مراجعة عقد توريد توربينات غازية لصالح الشركة السعودية للكهرباء والتحقق من شروط الضمان والمشتريات الحكومية",
            maskedText: "مراجعة عقد توريد توربينات غازية لصالح الشركة السعودية للكهرباء والتحقق من شروط الضمان والمشتريات الحكومية",
            risk_score: 15,
            riskScore: 15,
            risk_level: "minimal",
            riskLevel: "minimal",
            risk_reasons: "[\"عقد توريد تجاري اعتيادي متطابق مع دليل الامتثال للمشتريات الحكومية\"]",
            approval_status: "auto_approved",
            approvalStatus: "auto_approved",
            action: "CHAT_REQUEST",
            actor: "system",
            gemini_response: "تمت مراجعة مسودة العقد. البنود متوافقة مع ضوابط المشتريات ولا تتضمن بيانات شخصية.",
            response: "تمت مراجعة مسودة العقد. البنود متوافقة مع ضوابط المشتريات ولا تتضمن بيانات شخصية.",
            compliance_pack: "procurement",
            compliancePack: "procurement",
            department: "المشتريات",
            departmentName: "المشتريات",
            previous_hash: "ca85d0d1e3d36b8e88fdfb06bb007a22a3eb2cd98c2534c06282ebbc6c483a99",
            previousHash: "ca85d0d1e3d36b8e88fdfb06bb007a22a3eb2cd98c2534c06282ebbc6c483a99",
            record_hash: "2f4007886474ba0e00d23fbc01d2a3ec2cd98c2534c06282ebbc6c483a9937a0",
            recordHash: "2f4007886474ba0e00d23fbc01d2a3ec2cd98c2534c06282ebbc6c483a9937a0",
            hash: "2f4007886474ba0e00d23fbc01d2a3ec2cd98c2534c06282ebbc6c483a9937a0"
          }
        ]
      },
      approvals: {
        pending: [
          {
            id: "trace-10493",
            requestId: "trace-10493",
            interactionId: "trace-10493",
            trace_id: trace3,
            traceId: trace3,
            status: "pending",
            query: "طلب تصدير التقرير المالي الربع سنوي للربع الأول لعام 2026 لـ شركة الاتصالات السعودية STC ويحتوي على أرقام بطاقات مصرفية SA9930000000001234567890",
            maskedText: "طلب تصدير التقرير المالي الربع سنوي للربع الأول لعام 2026 لـ شركة الاتصالات السعودية STC ويحتوي على أرقام بطاقات مصرفية [SAUDI_IBAN]",
            compliancePackage: "pdpl",
            userName: "عبد الله الشمري",
            userId: "user_saudi_02",
            createdAt: new Date(Date.now() - 1200000).toISOString(),
            riskScore: 82,
            riskLevel: "high",
            piiDetected: ["saudi_iban"],
            matchedPolicies: [{"name": "فحص البيانات المالية العابرة للحدود"}]
          },
          {
            id: "trace-10495",
            requestId: "trace-10495",
            interactionId: "trace-10495",
            trace_id: trace4,
            traceId: trace4,
            status: "pending",
            query: "تصدير الملفات الطبية الكاملة لمرضى العيادات الخارجية بمستشفى الملك فيصل وبها الهوية 1098234102 والإجراءات العلاجية الخاصة بهم",
            maskedText: "تصدير الملفات الطبية الكاملة لمرضى العيادات الخارجية بمستشفى الملك فيصل وبها الهوية [SAUDI_ID] والإجراءات العلاجية الخاصة بهم",
            compliancePackage: "healthcare",
            userName: "نورة العتيبي",
            userId: "user_saudi_05",
            createdAt: new Date(Date.now() - 60000).toISOString(),
            riskScore: 91,
            riskLevel: "critical",
            piiDetected: ["saudi_id"],
            matchedPolicies: [{"name": "حظر تصدير الهويات الوطنية بدون تعمية كاملة"}]
          }
        ],
        recent: [
          {
            id: "trace-10492",
            requestId: "trace-10492",
            interactionId: "trace-10492",
            trace_id: trace2,
            traceId: trace2,
            status: "completed",
            query: "مراجعة عقد توريد توربينات غازية لصالح الشركة السعودية للكهرباء بقيمة 45,000,000 ريال سعودي والتحقق من شروط الضمان والمشتريات الحكومية",
            compliancePackage: "procurement",
            userName: "سعد المطيري",
            userId: "user_saudi_03",
            createdAt: new Date(Date.now() - 1800000).toISOString(),
            riskScore: 15,
            riskLevel: "minimal",
            piiDetected: [],
            matchedPolicies: [],
            approver: "النظام الآلي"
          }
        ],
        summary: {
          totalPending: 2,
          criticalCount: 1,
          highCount: 1,
          completedToday: 14
        }
      },
      evidence: {
        total: 4,
        evidence: [
          {
            id: "trace-10491",
            interactionId: "trace-10491",
            requestId: "trace-10491",
            traceId: trace1,
            trace_id: trace1,
            createdAt: new Date(Date.now() - 600000).toISOString(),
            preview: "طلب استعلام يحتوي على بيانات شخصية حساسة تم اكتشافها وحجبها تلقائياً (الهوية الوطنية)",
            status: "blocked",
            approvalStatus: "blocked",
            riskLevel: "critical"
          },
          {
            id: "trace-10493",
            interactionId: "trace-10493",
            requestId: "trace-10493",
            traceId: trace3,
            trace_id: trace3,
            createdAt: new Date(Date.now() - 1200000).toISOString(),
            preview: "طلب تصدير التقرير المالي لشركة الاتصالات السعودية STC ويحتوي على أرقام بطاقات مصرفية",
            status: "pending",
            approvalStatus: "pending",
            riskLevel: "high"
          },
          {
            id: "trace-10492",
            interactionId: "trace-10492",
            requestId: "trace-10492",
            traceId: trace2,
            trace_id: trace2,
            createdAt: new Date(Date.now() - 1800000).toISOString(),
            preview: "مراجعة عقد توريد توربينات غازية للشركة السعودية للكهرباء متوافق مع لوائح المشتريات",
            status: "completed",
            approvalStatus: "completed",
            riskLevel: "minimal"
          }
        ],
        rows: [
          {
            id: "trace-10491",
            interactionId: "trace-10491",
            requestId: "trace-10491",
            traceId: trace1,
            trace_id: trace1,
            createdAt: new Date(Date.now() - 600000).toISOString(),
            preview: "طلب استعلام يحتوي على بيانات شخصية حساسة تم اكتشافها وحجبها تلقائياً (الهوية الوطنية)",
            status: "blocked",
            approvalStatus: "blocked",
            riskLevel: "critical"
          },
          {
            id: "trace-10493",
            interactionId: "trace-10493",
            requestId: "trace-10493",
            traceId: trace3,
            trace_id: trace3,
            createdAt: new Date(Date.now() - 1200000).toISOString(),
            preview: "طلب تصدير التقرير المالي لشركة الاتصالات السعودية STC ويحتوي على أرقام بطاقات مصرفية",
            status: "pending",
            approvalStatus: "pending",
            riskLevel: "high"
          },
          {
            id: "trace-10492",
            interactionId: "trace-10492",
            requestId: "trace-10492",
            traceId: trace2,
            trace_id: trace2,
            createdAt: new Date(Date.now() - 1800000).toISOString(),
            preview: "مراجعة عقد توريد توربينات غازية للشركة السعودية للكهرباء متوافق مع لوائح المشتريات",
            status: "completed",
            approvalStatus: "completed",
            riskLevel: "minimal"
          }
        ],
        details: {
          "trace-10491": {
            id: "trace-10491",
            interactionId: "trace-10491",
            requestId: "trace-10491",
            traceId: trace1,
            trace_id: trace1,
            createdAt: new Date(Date.now() - 600000).toISOString(),
            timestamp: new Date(Date.now() - 600000).toISOString(),
            request: "مشاركة ملف المرضى المصابين بالفيروس التاجي مع جهة بحثية خارجية تشمل أرقام الهواتف والهويات الوطنية 1029482103",
            response: "عذراً، تم حظر طلبك نظراً لاحتوائه على معلومات شخصية حساسة (رقم هوية وطنية) غير مشفرة، وهو ما يخالف نظام حماية البيانات الشخصية (PDPL) بالمملكة العربية السعودية.",
            riskScore: 100,
            riskLevel: "critical",
            approvalStatus: "blocked",
            requestHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
            previousHash: "a4d3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
            recordHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
          },
          [trace1]: {
            id: "trace-10491",
            interactionId: "trace-10491",
            requestId: "trace-10491",
            traceId: trace1,
            trace_id: trace1,
            createdAt: new Date(Date.now() - 600000).toISOString(),
            timestamp: new Date(Date.now() - 600000).toISOString(),
            request: "مشاركة ملف المرضى المصابين بالفيروس التاجي مع جهة بحثية خارجية تشمل أرقام الهواتف والهويات الوطنية 1029482103",
            response: "عذراً، تم حظر طلبك نظراً لاحتوائه على معلومات شخصية حساسة (رقم هوية وطنية) غير مشفرة، وهو ما يخالف نظام حماية البيانات الشخصية (PDPL) بالمملكة العربية السعودية.",
            riskScore: 100,
            riskLevel: "critical",
            approvalStatus: "blocked",
            requestHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
            previousHash: "a4d3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
            recordHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
          },
          "trace-10493": {
            id: "trace-10493",
            interactionId: "trace-10493",
            requestId: "trace-10493",
            traceId: trace3,
            trace_id: trace3,
            createdAt: new Date(Date.now() - 1200000).toISOString(),
            timestamp: new Date(Date.now() - 1200000).toISOString(),
            request: "طلب تصدير التقرير المالي الربع سنوي للربع الأول لعام 2026 لـ شركة الاتصالات السعودية STC ويحتوي على أرقام بطاقات مصرفية SA9930000000001234567890",
            response: "بانتظار موافقة مدير الامتثال لوجود أرقام حسابات مصرفية غير مقنعة.",
            riskScore: 82,
            riskLevel: "high",
            approvalStatus: "pending",
            requestHash: "ca85d0d1e3d36b8e88fdfb06bb007a22a3eb2cd98c2534c06282ebbc6c483a99",
            previousHash: "2f4007886474ba0e00d23fbc01d2a3ec2cd98c2534c06282ebbc6c483a9937a0",
            recordHash: "ca85d0d1e3d36b8e88fdfb06bb007a22a3eb2cd98c2534c06282ebbc6c483a99"
          },
          [trace3]: {
            id: "trace-10493",
            interactionId: "trace-10493",
            requestId: "trace-10493",
            traceId: trace3,
            trace_id: trace3,
            createdAt: new Date(Date.now() - 1200000).toISOString(),
            timestamp: new Date(Date.now() - 1200000).toISOString(),
            request: "طلب تصدير التقرير المالي الربع سنوي للربع الأول لعام 2026 لـ شركة الاتصالات السعودية STC ويحتوي على أرقام بطاقات مصرفية SA9930000000001234567890",
            response: "بانتظار موافقة مدير الامتثال لوجود أرقام حسابات مصرفية غير مقنعة.",
            riskScore: 82,
            riskLevel: "high",
            approvalStatus: "pending",
            requestHash: "ca85d0d1e3d36b8e88fdfb06bb007a22a3eb2cd98c2534c06282ebbc6c483a99",
            previousHash: "2f4007886474ba0e00d23fbc01d2a3ec2cd98c2534c06282ebbc6c483a9937a0",
            recordHash: "ca85d0d1e3d36b8e88fdfb06bb007a22a3eb2cd98c2534c06282ebbc6c483a99"
          },
          "trace-10492": {
            id: "trace-10492",
            interactionId: "trace-10492",
            requestId: "trace-10492",
            traceId: trace2,
            trace_id: trace2,
            createdAt: new Date(Date.now() - 1800000).toISOString(),
            timestamp: new Date(Date.now() - 1800000).toISOString(),
            request: "مراجعة عقد توريد توربينات غازية لصالح الشركة السعودية للكهرباء بقيمة 45,000,000 ريال سعودي والتحقق من شروط الضمان والمشتريات الحكومية",
            response: "تمت مراجعة مسودة العقد بالكامل. كافة البنود تتوافق مع نظام المشتريات الحكومية السعودي. شروط الضمان محددة بـ 3 سنوات وتغطي الأعطال الميكانيكية للتربينات، مما يعتبر ممتازاً ووفق معايير الصناعة.",
            riskScore: 15,
            riskLevel: "minimal",
            approvalStatus: "completed",
            requestHash: "2f4007886474ba0e00d23fbc01d2a3ec2cd98c2534c06282ebbc6c483a9937a0",
            previousHash: "ca85d0d1e3d36b8e88fdfb06bb007a22a3eb2cd98c2534c06282ebbc6c483a99",
            recordHash: "2f4007886474ba0e00d23fbc01d2a3ec2cd98c2534c06282ebbc6c483a9937a0"
          },
          [trace2]: {
            id: "trace-10492",
            interactionId: "trace-10492",
            requestId: "trace-10492",
            traceId: trace2,
            trace_id: trace2,
            createdAt: new Date(Date.now() - 1800000).toISOString(),
            timestamp: new Date(Date.now() - 1800000).toISOString(),
            request: "مراجعة عقد توريد توربينات غازية لصالح الشركة السعودية للكهرباء بقيمة 45,000,000 ريال سعودي والتحقق من شروط الضمان والمشتريات الحكومية",
            response: "تمت مراجعة مسودة العقد بالكامل. كافة البنود تتوافق مع نظام المشتريات الحكومية السعودي. شروط الضمان محددة بـ 3 سنوات وتغطي الأعطال الميكانيكية للتربينات، مما يعتبر ممتازاً ووفق معايير الصناعة.",
            riskScore: 15,
            riskLevel: "minimal",
            approvalStatus: "completed",
            requestHash: "2f4007886474ba0e00d23fbc01d2a3ec2cd98c2534c06282ebbc6c483a9937a0",
            previousHash: "ca85d0d1e3d36b8e88fdfb06bb007a22a3eb2cd98c2534c06282ebbc6c483a99",
            recordHash: "2f4007886474ba0e00d23fbc01d2a3ec2cd98c2534c06282ebbc6c483a9937a0"
          }
        }
      },
      compliance: {
        state: {
          pdpl: { 
            score: 98, 
            status: "compliant", 
            lastAudit: new Date(Date.now() - 3600000).toISOString(),
            requirementScores: { "consent": 100, "access": 100, "breach": 95, "retention": 95, "transfer": 100 } 
          },
          gdpr: { 
            score: 95, 
            status: "compliant", 
            lastAudit: new Date(Date.now() - 7200000).toISOString(),
            requirementScores: { "forget": 100, "portability": 100, "documentation": 85, "dpo": 100, "impact": 90 } 
          },
          hipaa: { 
            score: 78, 
            status: "partial", 
            lastAudit: new Date(Date.now() - 14400000).toISOString(),
            requirementScores: { "encryption": 100, "access_logs": 80, "baa": 50, "training": 80 } 
          },
          pci: { 
            score: 100, 
            status: "compliant", 
            lastAudit: new Date(Date.now() - 1800000).toISOString(),
            requirementScores: { "card_protection": 100, "transit_encryption": 100, "pen_test": 100, "monitoring": 100 } 
          },
          iso27001: { 
            score: 92, 
            status: "compliant", 
            lastAudit: new Date(Date.now() - 86400000).toISOString(),
            requirementScores: { "policy": 100, "risk_mgmt": 100, "internal_audit": 75, "incident": 95 } 
          }
        }
      },
      connectors: [
        { id: 'conn-openai', name: 'OpenAI Service', provider: 'GPT-4 & GPT-3.5', status: 'connected', avgLatencyMs: 145, uptime: '99.8%' },
        { id: 'conn-anthropic', name: 'Anthropic Claude', provider: 'Claude 3 & 3.5', status: 'connected', avgLatencyMs: 198, uptime: '99.5%' },
        { id: 'conn-azure', name: 'Azure OpenAI Service', provider: 'Microsoft Azure', status: 'connected', avgLatencyMs: 165, uptime: '99.9%' },
        { id: 'conn-google', name: 'Google AI Studio', provider: 'Gemini 2.5 Pro & Flash', status: 'disconnected', avgLatencyMs: 0, uptime: '99.2%' },
        { id: 'conn-nvidia', name: 'NVIDIA NIM', provider: 'NVIDIA MiniMax & NIM', status: 'connected', avgLatencyMs: 110, uptime: '99.9%' }
      ],
      scenarios: [
        { id: 'scenario-1', name: 'كشف تسريب الهوية الوطنية (PDPL)', description: 'محاكاة إدخال رقم هوية وطنية سعودية في استعلام غير مشفر والتحقق من كشفه وحجبه تلقائياً للامتثال لنظام حماية البيانات الشخصية.', riskLevel: 'critical', compliancePack: 'pdpl' },
        { id: 'scenario-2', name: 'مراجعة عقود المشتريات الحكومية', description: 'تحليل مسودة عقد توريد للتحقق من شروط الضمان والمطابقة لقواعد المشتريات والمنافسات الحكومية السعودية.', riskLevel: 'minimal', compliancePack: 'procurement' },
        { id: 'scenario-3', name: 'تصدير السجلات الطبية الحساسة (SFDA)', description: 'محاولة طلب استخراج تفاصيل تشخيص ورم سرطاني مقترن ببيانات المريض، والتحقق من حظره وطلبه للاعتماد البشري.', riskLevel: 'critical', compliancePack: 'sfda' },
        { id: 'scenario-4', name: 'التكامل الآمن مع الهيئة الوطنية للأمن السيبراني (NCA)', description: 'فحص الاستعلامات لمنع هجمات Prompt Injection وتفادي تسريب أكواد الاستيقاظ أو مفاتيح API الخاصة بالمؤسسة.', riskLevel: 'high', compliancePack: 'nca_ecc' }
      ],
      policies: [
        {
          id: "pr_saudi_id_pdpl",
          name: "تعمية الهوية الوطنية السعودية - نظام PDPL",
          description: "إخفاء وحجب أرقام الهويات الوطنية والإقامات في الطلبات للامتثال لنظام حماية البيانات الشخصية السعودي.",
          pii_type: "saudi_id",
          compliance_pack: "pdpl",
          action: "mask",
          risk_score_modifier: 15,
          is_active: 1
        },
        {
          id: "pr_iban_pdpl",
          name: "حظر أرقام الآيبان SA-IBAN - نظام PDPL",
          description: "منع خروج أرقام الحسابات البنكية السعودية خارج البيئة المؤسسية امتثالاً لنظام PDPL وضوابط SAMA.",
          pii_type: "iban",
          compliance_pack: "pdpl",
          action: "block",
          risk_score_modifier: 25,
          is_active: 1
        }
      ]
    };
  }

  function isFileProtocol() {
    if (typeof global.KernelRuntimeConfig?.isFileProtocol === 'function') {
      return global.KernelRuntimeConfig.isFileProtocol();
    }
    return window.location.protocol === 'file:';
  }

  function isDemoModeSelected() {
    if (typeof global.KernelRuntimeConfig?.isDemoModeSelected === 'function') {
      return global.KernelRuntimeConfig.isDemoModeSelected();
    }
    return localStorage.getItem('brightai_kernel_demo_mode') === 'true';
  }

  function shouldUseDemoData() {
    if (typeof global.KernelRuntimeConfig?.shouldUseDemoData === 'function') {
      return global.KernelRuntimeConfig.shouldUseDemoData();
    }
    return isDemoModeSelected() || isFileProtocol();
  }

  // Initialize Demo Mode LocalStorage flag to false if not set
  const demoStorageKey = global.KernelRuntimeConfig?.get?.().demoStorageKey || 'brightai_kernel_demo_mode';
  if (localStorage.getItem(demoStorageKey) === null) {
    localStorage.setItem(demoStorageKey, 'false');
  }

  let dbInitPromise = null;

  // Initialize unified Local Mock Database inside localStorage
  function ensureDBInitialized() {
    if (dbInitPromise) return dbInitPromise;

    dbInitPromise = (async () => {
      let cached = localStorage.getItem('brightai_kernel_mock_db');
      if (cached) {
        try {
          window.kernelDemoState = JSON.parse(cached);
          // Sync summary statistics back just in case
          recalculateSummaryStats();
          return;
        } catch (e) {
          console.error("[BrightAI Kernel] Failed to parse cached mock DB. Re-initializing...", e);
        }
      }

      try {
        // Parallel fetch for default configuration files
        const mockUrl = (file) => new URL(file, mockBaseUrl).href;
        const [stats, audit, approvals, evidence, compliance, policies, connectors, scenarios] = await Promise.all([
          fetch(mockUrl('stats.json')).then(r => r.json()),
          fetch(mockUrl('audit.json')).then(r => r.json()),
          fetch(mockUrl('approvals.json')).then(r => r.json()),
          fetch(mockUrl('evidence.json')).then(r => r.json()),
          fetch(mockUrl('compliance.json')).then(r => r.json()),
          fetch(mockUrl('policies.json')).then(r => r.json()),
          fetch(mockUrl('connectors.json')).then(r => r.json()),
          fetch(mockUrl('scenarios.json')).then(r => r.json())
        ]);
        window.kernelDemoState = { stats, audit, approvals, evidence, compliance, policies, connectors, scenarios };
      } catch (err) {
        console.warn("[BrightAI Kernel] Failed to fetch local JSON mock files. Using hardcoded fallback.", err);
        window.kernelDemoState = getHardcodedDefaults();
      }

      recalculateSummaryStats();
    })();

    return dbInitPromise;
  }

  // Recalculate summary metrics for compliance and risk
  function recalculateSummaryStats() {
    if (!window.kernelDemoState) return;
    const db = window.kernelDemoState;

    hydrateMockDepartments(db.audit?.rows);
    hydrateMockDepartments(db.audit?.entries);
    hydrateMockDepartments(db.approvals?.pending);
    hydrateMockDepartments(db.approvals?.recent);
    
    const auditRows = db.audit.rows || [];
    const pendingRows = db.approvals.pending || [];
    const recentRows = db.approvals.recent || [];
    const requestIds = new Set();
    [...auditRows, ...pendingRows, ...recentRows].forEach((row) => {
      const id = row.traceId || row.trace_id || row.interactionId || row.requestId || row.id;
      if (id) requestIds.add(String(id));
    });

    // Count each request once even when a pending approval also has an audit record.
    const total = requestIds.size || auditRows.length + pendingRows.length;
    const blocked = (db.audit.rows || []).filter(r => r.approvalStatus === 'blocked' || r.firewall_action === 'block').length;
    const pending = (db.approvals.pending || []).length;
    const approved = (db.approvals.recent || []).filter(r => r.status === 'completed' || r.status === 'approved').length;
    const rejected = (db.audit.rows || []).filter(r => r.approvalStatus === 'rejected' || r.status === 'rejected').length;
    const completed = (db.audit.rows || []).filter(r => r.approvalStatus === 'completed' || r.approvalStatus === 'auto_approved' || r.status === 'completed' || r.status === 'auto_approved').length;
    
    db.stats.requests = {
      total,
      pending,
      approved,
      executed: approved,
      completed,
      rejected,
      blocked
    };
    db.stats.total = total;
    db.stats.pending = pending;
    db.stats.blocked = blocked;
    db.stats.approved = approved;
    db.stats.rejected = rejected;
    db.stats.autoApproved = completed;

    db.approvals.summary = {
      totalPending: pending,
      criticalCount: (db.approvals.pending || []).filter(r => r.riskLevel === 'critical').length,
      highCount: (db.approvals.pending || []).filter(r => r.riskLevel === 'high').length,
      completedToday: approved
    };

    const defaults = getHardcodedDefaults();
    db.stats.riskByDepartment = db.stats.riskByDepartment || defaults.stats.riskByDepartment;
    db.policies = Array.isArray(db.policies) ? db.policies : defaults.policies;
    db.connectors = Array.isArray(db.connectors) ? db.connectors : defaults.connectors;
    db.scenarios = Array.isArray(db.scenarios) ? db.scenarios : defaults.scenarios;

    localStorage.setItem('brightai_kernel_mock_db', JSON.stringify(db));
  }

  /**
   * SHA-256 hash via Web Crypto API.
   * Strategy: SHA-256 → PBKDF2 fallback → explicit insecure warning.
   * NEVER silently degrades to a weak algorithm.
   */
  async function generateHash(content = '') {
    const input = content || `${Date.now()}-${Math.random().toString(36).slice(2)}-${global.performance?.now?.() || 0}`;
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const subtle = global.crypto?.subtle;

    /* ── 1. Preferred: SHA-256 via crypto.subtle ─────────── */
    if (subtle?.digest) {
      try {
        const hashBuffer = await subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map((byte) => byte.toString(16).padStart(2, '0')).join('');
      } catch (_shaError) {
        /* Fall through to PBKDF2 */
      }
    }

    /* ── 2. Fallback: PBKDF2 with high iteration count ──── */
    if (subtle?.deriveBits) {
      try {
        const salt = encoder.encode('brightai-kernel-audit-chain-v1');
        const baseKey = await subtle.importKey('raw', data, { name: 'PBKDF2' }, false, ['deriveBits']);
        const derivedBits = await subtle.deriveBits(
          { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
          baseKey,
          256
        );
        const hashArray = Array.from(new Uint8Array(derivedBits));
        return hashArray.map((byte) => byte.toString(16).padStart(2, '0')).join('');
      } catch (_pbkdf2Error) {
        /* Fall through to insecure warning */
      }
    }

    /* ── 3. Insecure context: no crypto available ───────── */
    console.error(
      '%c[BrightAI Kernel] ⚠️ SECURITY WARNING%c\n' +
      'crypto.subtle is unavailable (likely HTTP without secure context).\n' +
      'Audit chain hashes are NOT cryptographically secure.\n' +
      'Data integrity cannot be guaranteed. Serve over HTTPS to fix this.',
      'color:#EF4444;font-weight:bold;font-size:14px',
      'color:inherit'
    );

    /* Return a clearly marked insecure hash so the UI can distinguish it */
    const insecureHash = await insecureFallbackHash(input);
    return 'INSECURE_' + insecureHash;
  }

  /**
   * Insecure fallback — only used when NO Web Crypto API is available.
   * Uses a multi-pass DJB2 hash for basic integrity, but this is NOT
   * cryptographically secure. The INSECURE_ prefix makes this explicit.
   */
  async function insecureFallbackHash(input) {
    /* Run multiple passes to make collision harder (still NOT crypto-grade) */
    let h = 0x811c9dc5; // FNV offset basis
    for (let pass = 0; pass < 64; pass += 1) {
      for (let i = 0; i < input.length; i += 1) {
        h ^= input.charCodeAt(i);
        h = Math.imul(h, 0x01000193); // FNV prime
      }
      h ^= pass;
    }
    /* Combine into 64 hex chars using two 32-bit parts */
    const part1 = (h >>> 0).toString(16).padStart(8, '0');
    const part2 = (Math.imul(h, 0x5bd1e995) >>> 0).toString(16).padStart(8, '0');
    const part3 = (Math.imul(h ^ 0x27d4eb2d, 0x165667b1) >>> 0).toString(16).padStart(8, '0');
    const part4 = (Math.imul(h ^ 0x9e3779b9, 0xcc9e2d51) >>> 0).toString(16).padStart(8, '0');
    /* Repeat pattern to fill 64 chars */
    const body = part1 + part2 + part3 + part4 + part1 + part3 + part2 + part4;
    return body.slice(0, 57); /* 57 chars + 'INSECURE_' prefix = 65 chars total, truncated to 64 */
  }

  /**
   * Verify the integrity of the audit hash chain.
   * Checks that each record's hash correctly links to the previous record.
   * @param {Array} records - Audit records sorted chronologically (oldest first)
   * @returns {{ valid: boolean, brokenAt: number|null, details: Array, insecureCount: number }}
   */
  async function verifyAuditChain(records = []) {
    if (!records || records.length === 0) {
      return { valid: false, brokenAt: null, details: [], insecureCount: 0, reason: 'لا توجد سجلات للتحقق' };
    }

    /* Sort chronologically (oldest first) for chain verification */
    const sorted = records.slice().sort((a, b) => {
      const serialA = Number(a.serialId || a.serial_id || 0);
      const serialB = Number(b.serialId || b.serial_id || 0);
      if (serialA || serialB) return serialA - serialB;
      return Number(new Date(a.timestamp || a.createdAt || a.created_at || 0))
           - Number(new Date(b.timestamp || b.createdAt || b.created_at || 0));
    });

    const details = [];
    let brokenAt = null;
    let insecureCount = 0;

    for (let index = 0; index < sorted.length; index += 1) {
      const record = sorted[index];
      const recordHash = record.recordHash || record.record_hash || record.hash || '';
      const previousHash = record.previousHash || record.previous_hash || '';

      /* Check for insecure hashes */
      const isInsecure = recordHash.startsWith('INSECURE_');
      if (isInsecure) insecureCount += 1;

      /* Verify: recompute the expected hash from record data */
      const expectedRecordHash = await generateRecordHash(record);
      const hashMatches = recordHash === expectedRecordHash || recordHash.replace('INSECURE_', '') === expectedRecordHash.replace('INSECURE_', '');

      /* Verify: previousHash links correctly to the prior record */
      let linkValid = true;
      if (index > 0) {
        const previousRecordHash = sorted[index - 1].recordHash || sorted[index - 1].record_hash || sorted[index - 1].hash || '';
        linkValid = !previousHash || previousHash === previousRecordHash;
      }

      const recordValid = hashMatches && linkValid;

      details.push({
        index: index + 1,
        id: record.id || record.traceId || record.trace_id || index + 1,
        action: record.action || record.firewall_action || '—',
        timestamp: record.timestamp || record.createdAt || record.created_at,
        recordHash,
        previousHash,
        expectedRecordHash,
        hashMatches,
        linkValid,
        isInsecure,
        valid: recordValid,
        fingerprint: recordHash ? recordHash.slice(0, 12) + '...' + recordHash.slice(-8) : '—'
      });

      if (!recordValid && brokenAt === null) {
        brokenAt = index + 1;
      }
    }

    return {
      valid: brokenAt === null,
      brokenAt,
      details,
      insecureCount,
      totalRecords: sorted.length,
      reason: brokenAt === null
        ? 'سلسلة التدقيق سليمة — جميع التجزئات متصلة بشكل صحيح'
        : `انقطاع في السلسلة عند السجل #${brokenAt}`
    };
  }

  async function generateRecordHash(record = {}) {
    const content = JSON.stringify({
      id: record.id || record.traceId || record.trace_id || record.interactionId || record.requestId,
      action: record.action || record.firewall_action,
      risk: record.riskLevel || record.risk_level,
      timestamp: record.createdAt || record.created_at || record.timestamp,
      previousHash: record.previousHash || record.previous_hash || '',
    });
    const hash = await generateHash(content);
    /* Add serverTimestamp placeholder for production — filled by server in real deployments */
    if (!record.serverTimestamp) {
      record.serverTimestamp = null; /* Explicit null: signals "awaiting server confirmation" */
    }
    return hash;
  }

  function maskSensitiveText(value, piiTypes = []) {
    let text = String(value || '')
      .replace(/\b1\d{9}\b/g, '[SAUDI_ID]')
      .replace(/\b05\d{8}\b/g, '[PHONE]')
      .replace(/\bSA\d{22}\b/gi, '[SAUDI_IBAN]')
      .replace(/\b(?:\d[ -]*?){13,19}\b/g, '[CARD_OR_ACCOUNT]')
      .replace(/\bMRN[-_ ]?\d+\b/gi, '[PATIENT_ID]')
      .replace(/\bdb_password\b\s*[:=]\s*\S+/gi, 'db_password=[CREDENTIAL]')
      .replace(/\[CREDENTIAL\]/gi, '[CREDENTIAL]');
    if (piiTypes.some((type) => /name|employee_name|person/i.test(type))) {
      text = text.replace(/[\u0600-\u06FF]{2,}\s+[\u0600-\u06FF]{2,}/g, '[PERSON_NAME]');
    }
    return text;
  }

  function normalizeMockList(value) {
    if (!value) return [];
    if (Array.isArray(value)) return value.map(String).filter(Boolean);
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
      } catch (_error) {}
      return value.split(',').map((item) => item.trim()).filter(Boolean);
    }
    return [];
  }

  function inferMockDepartment(record = {}) {
    if (record.department || record.departmentName) return record.department || record.departmentName;
    const text = `${record.query || record.request_message || record.originalText || ''} ${record.compliancePackage || record.compliance_pack || ''}`.toLowerCase();
    if (/hr|راتب|موارد|employee|salary|تقييم/.test(text)) return 'الموارد البشرية';
    if (/sfda|health|طبي|مريض|mrn|مستشفى|وصفة|تشخيص/.test(text)) return 'الرعاية الصحية';
    if (/finance|مالي|آيبان|iban|بطاق|حساب|تقرير مالي/.test(text)) return 'المالية';
    if (/procurement|مشتريات|توريد|عقد|مورد|مناقصة/.test(text)) return 'المشتريات';
    return 'غير محدد';
  }

  function hydrateMockDepartments(collection = []) {
    if (!Array.isArray(collection)) return;
    collection.forEach((record) => {
      record.department = inferMockDepartment(record);
      record.departmentName = record.department;
    });
  }

  function getMockRegulatoryReferences(pack = 'general') {
    const refs = [];
    const key = String(pack || 'general').toLowerCase();
    if (key === 'pdpl' || key === 'general') {
      refs.push({ framework: 'PDPL', article: 'Article 29', description: 'Cross-border data transfer' });
      refs.push({ framework: 'PDPL', article: 'Article 13', description: 'Data processing consent' });
    }
    if (key === 'nca_ecc' || key === 'general') {
      refs.push({ framework: 'NCA ECC 2-2024', article: 'Section 4', description: 'Access control' });
      refs.push({ framework: 'NCA ECC 2-2024', article: 'Section 5', description: 'Data classification' });
    }
    if (key === 'sfda' || key === 'healthcare') {
      refs.push({ framework: 'ISO 13485', article: '§8.3', description: 'Design and development outputs' });
      refs.push({ framework: 'SFDA QMS-GL', article: '2024', description: 'QMS Guidelines for medical devices' });
    }
    return refs;
  }

  function findMockAuditRecord(db, id) {
    return (db.audit.rows || []).find((row) =>
      row.id === id ||
      row.interactionId === id ||
      row.requestId === id ||
      row.traceId === id ||
      row.trace_id === id
    ) || null;
  }

  async function buildMockEvidenceFile(record = {}, db, id) {
    const auditRecord = findMockAuditRecord(db, id) || {};
    const source = { ...auditRecord, ...record };
    const traceId = source.traceId || source.trace_id || id;
    const interactionId = source.interactionId || source.id || source.requestId || id;
    const piiTypes = normalizeMockList(source.piiTypes || source.piiDetected || source.pii_types);
    const maskedRequest = maskSensitiveText(source.maskedText || source.masked_message || source.request || source.query || source.request_message || '', piiTypes);
    const recordHash = source.recordHash || source.record_hash || source.hash || await generateRecordHash(source);
    const evidenceHash = source.evidenceHash || source.evidence_hash || recordHash;
    const riskReasons = normalizeMockList(source.riskReasons || source.risk_reasons || source.matchedPolicies?.map?.((policy) => policy.name));
    const compliancePack = source.compliancePack || source.compliance_pack || 'general';

    return {
      evidenceId: source.evidenceId || `ev_${interactionId}`,
      generatedAt: source.generatedAt || new Date().toISOString(),
      interactionId,
      requestId: interactionId,
      traceId,
      trace_id: traceId,
      timestamp: source.timestamp || source.createdAt || source.created_at,
      summary: {
        traceId,
        interactionId,
        request: maskedRequest,
        response: source.response || source.gemini_response || '',
        riskScore: source.riskScore ?? source.risk_score,
        riskLevel: source.riskLevel || source.risk_level,
        approvalStatus: source.approvalStatus || source.approval_status || source.status,
        approvedBy: source.approvedBy || source.approver || source.actor,
        approvedAt: source.approvedAt || source.approved_at || null,
        model: source.model || source.response_model || 'Demo Mode',
        provider: source.provider || 'demo',
        responseTimeMs: source.latencyMs || source.response_time_ms || 0,
        tokensInput: source.tokensInput || source.response_tokens_input || 0,
        tokensOutput: source.tokensOutput || source.response_tokens_output || 0
      },
      firewall: {
        piiDetected: piiTypes.length > 0,
        piiTypes,
        piiItems: [],
        sensitiveCategories: [],
        action: source.firewall_action || source.action || 'allow'
      },
      risk: {
        score: source.riskScore ?? source.risk_score,
        level: source.riskLevel || source.risk_level,
        reasons: riskReasons
      },
      compliance: {
        pack: compliancePack,
        flags: normalizeMockList(source.compliance_flags)
      },
      audit: {
        traceId,
        requestHash: source.requestHash || source.request_hash || recordHash,
        responseHash: source.responseHash || source.response_hash || recordHash,
        previousHash: source.previousHash || source.previous_hash || '0',
        recordHash,
        integrityVerified: true,
        eventsCount: 0
      },
      events: [],
      user: {
        id: source.userId || source.user_id,
        name: source.userName || source.user_name,
        department: source.department || source.departmentName
      },
      regulatoryReferences: getMockRegulatoryReferences(compliancePack),
      evidenceHash
    };
  }

  // Local Chat Simulation firewall scanning and scoring

  function notifyUIUpdated() {
    // Save state back to localStorage
    if (window.kernelDemoState) {
      localStorage.setItem('brightai_kernel_mock_db', JSON.stringify(window.kernelDemoState));
    }

    const event = new CustomEvent('kernel-demo-update', {
      detail: window.kernelDemoState
    });
    window.dispatchEvent(event);

    // Coordinate with approvals.html inline methods
    if (typeof window.loadApprovals === 'function') {
      window.loadApprovals();
    }
    // Coordinate with stats and dashboard
    if (global.KernelStats && typeof global.KernelStats.loadStats === 'function') {
      global.KernelStats.loadStats();
    }
    // Direct DOM updater for stats cards
    updateStatsDOMDirectly();
  }

  // Instant DOM updater to guarantee zero lag or visual skeletons
  function updateStatsDOMDirectly() {
    if (!window.kernelDemoState) return;
    const stats = global.normalizeStats(window.kernelDemoState.stats);
    const summary = window.kernelDemoState.approvals.summary;

    const totalEl = document.getElementById('stat-total');
    const pendingEl = document.getElementById('stat-pending');
    const riskEl = document.getElementById('stat-risk');
    const piiEl = document.getElementById('stat-pii');

    const fmt = (num) => new Intl.NumberFormat('ar-SA').format(num);

    if (totalEl) totalEl.textContent = fmt(stats.totalRequests);
    const isApprovalsPage = Boolean(document.getElementById('stat-critical') || document.getElementById('stat-high') || document.getElementById('stat-completed'));
    if (pendingEl && !isApprovalsPage) pendingEl.textContent = fmt(stats.pendingApproval);
    if (riskEl) riskEl.textContent = `${Math.round(stats.avgRisk)}%`;
    if (piiEl) piiEl.textContent = `${Math.round(stats.piiDetectionRate)}%`;

    // Approvals page stats
    const aprPending = isApprovalsPage ? document.getElementById('stat-pending') : null;
    const aprCritical = document.getElementById('stat-critical');
    const aprHigh = document.getElementById('stat-high');
    const aprCompleted = document.getElementById('stat-completed');

    if (aprPending && summary) aprPending.textContent = fmt(summary.totalPending);
    if (aprCritical && summary) aprCritical.textContent = fmt(summary.criticalCount);
    if (aprHigh && summary) aprHigh.textContent = fmt(summary.highCount);
    if (aprCompleted && summary) aprCompleted.textContent = fmt(summary.completedToday);

    const refreshEl = document.getElementById('last-update');
    if (refreshEl) refreshEl.textContent = new Date().toLocaleTimeString('ar-SA');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Live Feed Simulation (8 Seconds Interval)
  // ═══════════════════════════════════════════════════════════════════════════

  const poolOfSimulatedRequests = [
    {
      query: "طلب تعديل سجل المشتريات والضمان للشركة السعودية للكهرباء للربع الثاني بقيمة 12,000,000 ريال",
      masked: "طلب تعديل سجل المشتريات والضمان للشركة السعودية للكهرباء للربع الثاني بقيمة 12,000,000 ريال",
      riskScore: 12,
      riskLevel: "minimal",
      status: "completed",
      response: "تم استلام الطلب وتمريره بنجاح. البنود مطابقة للمواصفات السعودية ولا تحتوي على أي بيانات حساسة.",
      compliancePack: "procurement"
    },
    {
      query: "استبيان الموظفين الجديد ويحتوي على أرقام الهوية الوطنية 1098485721 والعناوين السكنية الخاصة بهم بمصرف الراجحي",
      masked: "استبيان الموظفين الجديد ويحتوي على أرقام الهوية الوطنية [SAUDI_ID] والعناوين السكنية الخاصة بهم بمصرف الراجحي",
      riskScore: 100,
      riskLevel: "critical",
      status: "blocked",
      response: "تم حظر العملية آلياً. يمنع إرسال الهويات الوطنية الخاصة بالموظفين بدون تشفير لحماية الخصوصية بموجب PDPL.",
      compliancePack: "pdpl",
      pii: ["saudi_id"]
    },
    {
      query: "استعلام فوري لوزارة الصحة عن قائمة المرضى وحسابات الآيبان SA9910000000123456789012 لدفع مستحقات الضمان الاجتماعي",
      masked: "استعلام فوري لوزارة الصحة عن قائمة المرضى وحسابات الآيبان [SAUDI_IBAN] لدفع مستحقات الضمان الاجتماعي",
      riskScore: 85,
      riskLevel: "high",
      status: "pending",
      response: null,
      compliancePack: "healthcare",
      pii: ["saudi_iban"]
    },
    {
      query: "صياغة عقد التفاهم وشروط العمل المشترك مع أرامكو السعودية لتطوير حقول الغاز الطبيعي بدون تسريب أسرار صناعية",
      masked: "صياغة عقد التفاهم وشروط العمل المشترك مع أرامكو السعودية لتطوير حقول الغاز الطبيعي بدون تسريب أسرار صناعية",
      riskScore: 18,
      riskLevel: "low",
      status: "completed",
      response: "تمت صياغة بنود العقد. كافة المعايير تتطابق مع دليل الأمان الفني والسلامة المهنية المعتمد.",
      compliancePack: "nca_ecc"
    }
  ];

  let liveFeedTimer = null;

  function startLiveFeedSimulator() {
    if (liveFeedTimer) clearInterval(liveFeedTimer);

    liveFeedTimer = setInterval(async () => {
      // Don't inject if demo data is inactive
      if (!shouldUseDemoData()) return;

      // Don't inject if user is currently interacting (e.g. prompt or alert open, or buttons active)
      if (document.querySelector('.btn-loading') || document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }

      await ensureDBInitialized();
      const db = window.kernelDemoState;

      const randomTemplate = poolOfSimulatedRequests[Math.floor(Math.random() * poolOfSimulatedRequests.length)];
      const traceId = `AI-2026-${String(10000 + Math.floor(Math.random() * 90000))}`;
      const interactionId = `ki_${String(10000 + Math.floor(Math.random() * 90000))}`;

      const newRecord = {
        id: interactionId,
        interactionId: interactionId,
        requestId: interactionId,
        trace_id: traceId,
        traceId: traceId,
        createdAt: new Date().toISOString(),
        timestamp: new Date().toISOString(),
        query: randomTemplate.query,
        maskedText: randomTemplate.masked,
        compliancePackage: randomTemplate.compliancePack,
        userName: ["أحمد الحربي", "نوف السديري", "خالد القحطاني", "مريم الدوسري"][Math.floor(Math.random() * 4)],
        userId: `user_saudi_sim_${Math.floor(Math.random() * 100)}`,
        riskScore: randomTemplate.riskScore,
        riskLevel: randomTemplate.riskLevel,
        piiDetected: randomTemplate.pii || [],
        matchedPolicies: randomTemplate.pii ? [{"name": "حماية وحجب البيانات الحساسة للمؤسسة"}] : []
      };

      if (randomTemplate.status === 'blocked') {
        // add directly to audit log
        const auditEntry = {
          ...newRecord,
          created_at: newRecord.createdAt,
          serverTimestamp: null,
          approvalStatus: 'blocked',
          action: 'BLOCKED',
          actor: 'system',
          gemini_response: randomTemplate.response,
          response: randomTemplate.response,
          previousHash: db.audit.rows[0]?.recordHash || await generateHash(JSON.stringify(db.audit.rows[0] || {})),
          recordHash: await generateRecordHash(newRecord),
          hash: await generateRecordHash({ ...newRecord, type: 'blocked' })
        };
        db.audit.rows.unshift(auditEntry);
      } else if (randomTemplate.status === 'pending') {
        // add to pending approvals
        db.approvals.pending.unshift(newRecord);
      } else {
        // auto-approved completed
        const completedAudit = {
          ...newRecord,
          created_at: newRecord.createdAt,
          serverTimestamp: null,
          approvalStatus: 'auto_approved',
          action: 'CHAT_REQUEST',
          actor: newRecord.userName,
          gemini_response: randomTemplate.response,
          response: randomTemplate.response,
          previousHash: db.audit.rows[0]?.recordHash || await generateHash(JSON.stringify(db.audit.rows[0] || {})),
          recordHash: await generateRecordHash(newRecord),
          hash: await generateRecordHash({ ...newRecord, type: 'completed' })
        };
        db.audit.rows.unshift(completedAudit);
      }

      // Add to evidence details
      db.evidence.evidence.unshift({
        id: interactionId,
        interactionId,
        requestId: interactionId,
        traceId,
        trace_id: traceId,
        createdAt: new Date().toISOString(),
        preview: randomTemplate.query.substring(0, 180),
        status: randomTemplate.status,
        approvalStatus: randomTemplate.status,
        riskLevel: randomTemplate.riskLevel
      });
      db.evidence.rows = db.evidence.evidence;

      db.evidence.details[traceId] = {
        id: interactionId,
        interactionId,
        requestId: interactionId,
        traceId,
        trace_id: traceId,
        createdAt: new Date().toISOString(),
        timestamp: new Date().toISOString(),
        request: randomTemplate.query,
        response: randomTemplate.response || "بانتظار موافقة مشرف الحوكمة قبل الإرسال.",
        riskScore: randomTemplate.riskScore,
        riskLevel: randomTemplate.riskLevel,
        approvalStatus: randomTemplate.status,
        requestHash: await generateHash(randomTemplate.query),
        previousHash: db.audit.rows[1]?.recordHash || await generateHash(JSON.stringify(db.audit.rows[1] || {})),
        recordHash: await generateRecordHash(newRecord)
      };
      db.evidence.details[interactionId] = db.evidence.details[traceId];

      recalculateSummaryStats();
      notifyUIUpdated();

      // Show temporary smart notification bubble in corner if on approvals page
      if (pathNameContains('approvals') && randomTemplate.status === 'pending') {
        showToastNotification("طلب حوكمة جديد", `استقبل النظام طلب عالي المخاطر لـ ${newRecord.userName}.`);
      }
    }, 8000);
  }

  function pathNameContains(str) {
    return window.location.pathname.toLowerCase().includes(str);
  }

  function showToastNotification(title, message) {
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) return;
    const toast = document.createElement('div');
    toast.className = 'toast info';
    toast.style.animation = 'fadeSlideUp 300ms ease-out';
    toast.innerHTML = KernelUtils.sanitizeHtml(`
      <svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>
      </svg>
      <div class="toast-content">
        <div class="toast-title">${KernelUtils?.escapeHtml(title) || title}</div>
        <div class="toast-message">${KernelUtils?.escapeHtml(message) || message}</div>
      </div>
      <button class="toast-close" data-kernel-click="KernelUtils.removeClosest" data-kernel-arg-0="__element__" data-kernel-arg-1=".toast" aria-label="إغلاق التنبيه">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
    `);
    toastContainer.appendChild(toast);
    setTimeout(() => { if (toast.parentElement) toast.remove(); }, 5000);
  }

  global.KernelDemoStore = {
    isFileProtocol,
    isDemoModeSelected,
    shouldUseDemoData,
    ensureDBInitialized,
    recalculateSummaryStats,
    generateHash,
    generateRecordHash,
    verifyAuditChain,
    maskSensitiveText,
    normalizeMockList,
    inferMockDepartment,
    hydrateMockDepartments,
    getMockRegulatoryReferences,
    findMockAuditRecord,
    buildMockEvidenceFile,
    notifyUIUpdated,
    updateStatsDOMDirectly,
    startLiveFeedSimulator,
    pathNameContains,
    showToastNotification,
  };

  global.kernelDemoDataSelected = isDemoModeSelected;
  global.kernelShouldUseDemoData = shouldUseDemoData;

})(typeof window !== 'undefined' ? window : this);
