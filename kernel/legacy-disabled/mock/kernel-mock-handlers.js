/**
 * BrightAI Kernel - Mock Handlers
 * Intercepts Kernel API calls when demo mode is active and returns local mock data.
 */

(function (global) {
  'use strict';

  const { toNumber } = global.KernelApiHelpers || {};
  const {
    shouldUseDemoData,
    ensureDBInitialized,
    recalculateSummaryStats,
    generateHash,
    generateRecordHash,
    maskSensitiveText,
    normalizeMockList,
    buildMockEvidenceFile,
    notifyUIUpdated,
  } = global.KernelDemoStore || {};

  if (typeof shouldUseDemoData !== 'function' || typeof toNumber !== 'function') {
    throw new Error('Kernel demo dependencies must load before kernel-mock-handlers.js');
  }

  async function simulateChat(message, compliancePack) {
    const db = window.kernelDemoState;
    
    // Determine Scenario
    let scenario = 'general';
    let traceId = `AI-2026-${String(10000 + Math.floor(Math.random() * 90000))}`;
    let riskScore = 8;
    let riskLevel = 'minimal';
    let status = 'completed';
    let pii = [];
    let matchedPolicies = [];
    let responseText = "أهلاً بك! لقد تم استلام طلبك ومراجعته بنجاح من خلال بوابة حوكمة نواة BrightAI. الاستعلام متوافق مع كافة حزم حماية البيانات المعتمدة.";
    let latencyMs = 450;

    if (/آيبان|تمويل|FIN88|Finance/i.test(message)) {
      scenario = 'finance';
      traceId = 'AI-2026-FIN88';
      riskScore = 82;
      riskLevel = 'high';
      status = 'pending_approval';
      pii = ['saudi_iban'];
      matchedPolicies = [{"name": "سياسة حوكمة البيانات المالية وحماية الآيبان"}];
      responseText = "بانتظار موافقة مدير الامتثال لوجود أرقام حسابات مصرفية (آيبان) وعقد تمويل شخصي معلّق.";
      latencyMs = 780;
    } else if (/خالد الحربي|تقييم سنوي|راتب|HR99|HR/i.test(message)) {
      scenario = 'hr';
      traceId = 'AI-2026-HR99';
      riskScore = 65;
      riskLevel = 'medium';
      status = 'completed';
      pii = ['salary', 'employee_name'];
      matchedPolicies = [{"name": "سياسة حماية بيانات الموظفين والتقييمات السرية"}];
      responseText = "تمت مراجعة ملف الموظف خالد الحربي بنجاح. لقد قامت بوابة الحوكمة تلقائياً بحجب البيانات الحساسة المتعلقة بالراتب والمكافآت [Salary: *******] لضمان الخصوصية والامتثال لنظام حماية البيانات الشخصية.";
      latencyMs = 620;
    } else if (/عقد المورد|شرط جزائي|لوائح الشركة|LEG77|Legal/i.test(message)) {
      scenario = 'legal';
      traceId = 'AI-2026-LEG77';
      riskScore = 15;
      riskLevel = 'minimal';
      status = 'completed';
      pii = [];
      matchedPolicies = [{"name": "سياسة مراجعة العقود القياسية للشركات"}];
      responseText = "تم تحليل عقد المورد بنجاح. البند الخاص بالشرط الجزائي البالغ 50,000 ريال يتوافق تماماً مع الأنظمة الداخلية لشركة المشتريات ولا توجد مخاطر إضافية.";
      latencyMs = 510;
    } else if (/CAPA|MRN-12345|سكري|MED55|Healthcare/i.test(message)) {
      scenario = 'healthcare';
      traceId = 'AI-2026-MED55';
      riskScore = 91;
      riskLevel = 'critical';
      status = 'blocked';
      pii = ['patient_id'];
      matchedPolicies = [{"name": "سياسة حماية البيانات الصحية للمرضى وحوكمة الهيئة العامة للغذاء والدواء SFDA"}];
      responseText = "عذراً، تم حظر طلبك نظراً لاحتوائه على معلومات شخصية صحية وحساسة (ملف طبي MRN-12345) بدون تصريح مسبق، وهو ما يخالف نظام الهيئة العامة للغذاء والدواء SFDA ولوائح حماية البيانات الصحية.";
      latencyMs = 890;
    } else if (/db_password|\[CREDENTIAL\]|COD44|Code/i.test(message)) {
      scenario = 'code';
      traceId = 'AI-2026-COD44';
      riskScore = 95;
      riskLevel = 'critical';
      status = 'blocked';
      pii = ['credentials'];
      matchedPolicies = [{"name": "ضوابط الأمن السيبراني الوطنية للأسرار البرمجية NCA ECC"}];
      responseText = "عذراً، تم حظر طلب الاستعلام فوراً لاحتوائه على كلمات سر ومفاتيح أمنية مكشوفة (db_password) في الكود البرمجي المرفق، وهو ما ينتهك ضوابط الأمن السيبراني الوطنية NCA ECC.";
      latencyMs = 950;
    }

    const interactionId = `ki_${String(10000 + Math.floor(Math.random() * 90000))}`;
    let result = {};

    const newRequest = {
      id: interactionId,
      requestId: interactionId,
      interactionId: interactionId,
      trace_id: traceId,
      traceId: traceId,
      status: status === 'pending_approval' ? 'pending' : status,
      query: message,
      maskedText: maskSensitiveText(message, pii),
      compliancePackage: compliancePack || (scenario === 'finance' || scenario === 'hr' ? 'PDPL' : scenario === 'healthcare' ? 'SFDA' : scenario === 'code' ? 'NCA_ECC' : 'general'),
      department: scenario === 'finance' ? 'المالية'
        : scenario === 'hr' ? 'الموارد البشرية'
          : scenario === 'healthcare' ? 'الرعاية الصحية'
            : scenario === 'legal' ? 'المشتريات'
              : 'غير محدد',
      userName: KernelUtils?.getUserName() || 'مستخدم تجريبي',
      userId: KernelUtils?.getUserId() || 'user_demo',
      createdAt: new Date().toISOString(),
      riskScore,
      riskLevel,
      piiDetected: pii,
      matchedPolicies
    };

    if (status === 'blocked') {
      const auditEntry = {
        ...newRequest,
        created_at: newRequest.createdAt,
        timestamp: newRequest.createdAt,
        approvalStatus: 'blocked',
        action: 'BLOCKED',
        actor: 'system',
        gemini_response: responseText,
        response: responseText,
        previousHash: db.audit.rows[0]?.recordHash || await generateHash(JSON.stringify(db.audit.rows[0] || {})),
        recordHash: await generateRecordHash(newRequest),
        hash: await generateRecordHash({ ...newRequest, action: 'BLOCKED' })
      };
      db.audit.rows.unshift(auditEntry);
      db.audit.entries = db.audit.rows;

      result = {
        status: 'blocked',
        requiresApproval: false,
        interactionId,
        requestId: interactionId,
        traceId,
        riskScore,
        riskLevel,
        piiDetected: pii,
        matchedPolicies,
        auditHash: auditEntry.hash,
        hash: auditEntry.hash,
        reason: responseText,
        kernel: {
          firewall: { piiDetected: pii.length > 0, piiTypes: pii, action: 'block' },
          risk: { score: riskScore, level: riskLevel },
          compliance: { pack: newRequest.compliancePackage, result: 'fail' },
          traceId
        }
      };
    } else if (status === 'pending_approval') {
      // Check if already in pending list to avoid duplicates
      const exists = db.approvals.pending.some(p => p.traceId === traceId);
      if (!exists) {
        db.approvals.pending.unshift(newRequest);
      }

      result = {
        status: 'pending_approval',
        requiresApproval: true,
        interactionId,
        requestId: interactionId,
        traceId,
        riskScore,
        riskLevel,
        piiDetected: pii,
        matchedPolicies,
        auditHash: await generateRecordHash(newRequest),
        hash: await generateRecordHash({ ...newRequest, action: 'APPROVAL_REQUESTED' }),
        reason: responseText,
        kernel: {
          firewall: { piiDetected: true, piiTypes: pii, action: 'allow' },
          risk: { score: riskScore, level: riskLevel },
          compliance: { pack: newRequest.compliancePackage, result: 'fail' },
          traceId
        }
      };
    } else {
      const auditEntry = {
        id: interactionId,
        interactionId: interactionId,
        requestId: interactionId,
        trace_id: traceId,
        traceId: traceId,
        created_at: new Date().toISOString(),
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        user_id: KernelUtils?.getUserId() || 'user_demo',
        userId: KernelUtils?.getUserId() || 'user_demo',
        user_name: KernelUtils?.getUserName() || 'مستخدم تجريبي',
        userName: KernelUtils?.getUserName() || 'مستخدم تجريبي',
        ip_address: "127.0.0.1",
        user_agent: navigator.userAgent,
        request_message: message,
        query: message,
        originalText: message,
        pii_detected: pii.length > 0 ? 1 : 0,
        pii_types: JSON.stringify(pii),
        piiTypes: pii,
        piiDetected: pii,
        firewall_action: "allow",
        masked_message: newRequest.maskedText,
        maskedText: newRequest.maskedText,
        risk_score: riskScore,
        riskScore: riskScore,
        risk_level: riskLevel,
        riskLevel: riskLevel,
        risk_reasons: JSON.stringify(matchedPolicies.map(p => p.name)),
        approval_status: "auto_approved",
        approvalStatus: "auto_approved",
        action: "CHAT_REQUEST",
        actor: KernelUtils?.getUserName() || 'مستخدم تجريبي',
        gemini_response: responseText,
        response: responseText,
        response_model: "brightai-kernel-demo",
        provider: 'local',
        response_time_ms: latencyMs,
        compliance_pack: newRequest.compliancePackage,
        compliancePack: newRequest.compliancePackage,
        compliance_flags: "[]",
        previousHash: db.audit.rows[0]?.recordHash || await generateHash(JSON.stringify(db.audit.rows[0] || {})),
        recordHash: await generateRecordHash(newRequest),
        hash: await generateRecordHash({ ...newRequest, action: 'CHAT_REQUEST' })
      };
      
      db.audit.rows.unshift(auditEntry);
      db.audit.entries = db.audit.rows;

      result = {
        status: 'completed',
        interactionId,
        requestId: interactionId,
        traceId,
        response: responseText,
        provider: 'local',
        model: 'brightai-kernel-demo',
        riskScore,
        riskLevel,
        piiDetected: pii,
        matchedPolicies,
        latencyMs,
        auditHash: auditEntry.hash,
        hash: auditEntry.hash,
        kernel: {
          firewall: { piiDetected: pii.length > 0, piiTypes: pii, action: 'allow' },
          risk: { score: riskScore, level: riskLevel },
          compliance: { pack: newRequest.compliancePackage, result: 'pass', flags: [] },
          tokens: { input: 24, output: 48 },
          latencyMs,
          chainHash: auditEntry.hash,
          traceId
        }
      };
    }

    // Add to evidence details
    const evExists = db.evidence.evidence.some(e => e.traceId === traceId);
    if (!evExists) {
      db.evidence.evidence.unshift({
        id: interactionId,
        interactionId,
        requestId: interactionId,
        traceId,
        trace_id: traceId,
        createdAt: new Date().toISOString(),
        preview: message.substring(0, 180),
        status: result.status,
        approvalStatus: result.status,
        riskLevel: result.riskLevel
      });
      db.evidence.rows = db.evidence.evidence;
    }

    db.evidence.details[traceId] = {
      id: interactionId,
      interactionId,
      requestId: interactionId,
      traceId,
      trace_id: traceId,
      createdAt: new Date().toISOString(),
      timestamp: new Date().toISOString(),
      request: newRequest.maskedText,
      maskedText: newRequest.maskedText,
      piiTypes: pii,
      piiDetected: pii,
      response: responseText,
      riskScore: riskScore,
      riskLevel: riskLevel,
      approvalStatus: status,
      requestHash: result.hash || await generateHash(message),
      responseHash: result.hash || await generateHash(responseText),
      previousHash: db.audit.rows[1]?.recordHash || await generateHash(JSON.stringify(db.audit.rows[1] || {})),
      recordHash: result.hash || await generateRecordHash(newRequest),
      evidenceHash: result.hash || await generateRecordHash({ ...newRequest, evidence: true }),
      response_model: result.model || 'Demo Mode',
      provider: result.provider || 'local',
      response_time_ms: latencyMs,
      compliancePack: newRequest.compliancePackage,
      userName: newRequest.userName,
      userId: newRequest.userId
    };
    db.evidence.details[interactionId] = db.evidence.details[traceId];

    recalculateSummaryStats();
    notifyUIUpdated();

    return result;
  }

  function jsonResponse(payload, status = 200) {
    return new Response(JSON.stringify(payload), {
      status,
      headers: {
        'Content-Type': 'application/json',
        'Content-Language': 'ar-SA'
      }
    });
  }

  function parseJsonBody(options) {
    try {
      return {
        ok: true,
        body: JSON.parse(options?.body || '{}')
      };
    } catch (_error) {
      return {
        ok: false,
        body: { error: 'Invalid JSON body', errorCode: 'INVALID_JSON' },
        status: 400
      };
    }
  }

  function findApprovalIndex(db, requestId) {
    const id = decodeURIComponent(String(requestId || ''));
    return db.approvals.pending.findIndex((request) => {
      return [request.id, request.requestId, request.interactionId, request.traceId, request.trace_id]
        .filter(Boolean)
        .map(String)
        .includes(id);
    });
  }

  function updateEvidenceForApproval(db, request, status, response) {
    const traceId = request.traceId || request.trace_id;
    const evIndex = db.evidence.evidence.findIndex((item) => {
      return item.id === request.id || item.traceId === traceId || item.trace_id === traceId;
    });

    if (evIndex !== -1) {
      db.evidence.evidence[evIndex].status = status;
      db.evidence.evidence[evIndex].approvalStatus = status;
    }

    if (traceId) {
      db.evidence.details[traceId] = {
        ...db.evidence.details[traceId],
        response,
        approvalStatus: status
      };
      if (request.id) db.evidence.details[request.id] = db.evidence.details[traceId];
    }
  }

  async function buildApprovalAudit(request, action, approver, reason = '') {
    const now = new Date().toISOString();
    const approved = action === 'approve' || action === 'execute';
    const response = approved
      ? 'لقد تم التصريح بهذا الاستعلام بعد المراجعة اليدوية للمشرف والموافقة الطارئة. كافة الحماية مطبقة.'
      : `تم رفض الطلب بواسطة المشرف. السبب: ${reason || 'تم الرفض لدواعي حماية البيانات'}`;

    const previousHash = window.kernelDemoState?.audit?.rows?.[0]?.recordHash || await generateHash(JSON.stringify(window.kernelDemoState?.audit?.rows?.[0] || {}));
    const recordHash = await generateRecordHash({
      ...request,
      action: approved ? 'EXECUTED' : 'REJECTED',
      previousHash
    });

    return {
      id: request.id,
      interactionId: request.interactionId || request.id,
      requestId: request.requestId || request.id,
      trace_id: request.trace_id || request.traceId,
      traceId: request.traceId || request.trace_id,
      created_at: now,
      timestamp: now,
      createdAt: now,
      user_id: request.userId,
      userId: request.userId,
      user_name: request.userName,
      userName: request.userName,
      ip_address: '127.0.0.1',
      user_agent: navigator.userAgent,
      request_message: request.query,
      query: request.query,
      originalText: request.query,
      pii_detected: request.piiDetected?.length > 0 ? 1 : 0,
      pii_types: JSON.stringify(request.piiDetected || []),
      piiTypes: request.piiDetected || [],
      piiDetected: request.piiDetected || [],
      firewall_action: 'allow',
      masked_message: request.maskedText,
      maskedText: request.maskedText,
      risk_score: request.riskScore,
      riskScore: request.riskScore,
      risk_level: request.riskLevel,
      riskLevel: request.riskLevel,
      approval_status: approved ? 'approved_completed' : 'rejected',
      approvalStatus: approved ? 'approved_completed' : 'rejected',
      action: approved ? 'EXECUTED' : 'REJECTED',
      actor: approver,
      approval_comment: approved ? undefined : reason,
      gemini_response: response,
      response,
      response_model: approved ? 'brightai-kernel-demo' : null,
      response_time_ms: approved ? 350 : 0,
      compliance_pack: request.compliancePackage,
      compliancePack: request.compliancePackage,
      previousHash,
      recordHash,
      hash: recordHash
    };
  }

  async function applyApprovalAction(db, requestId, action, body = {}) {
    const normalizedAction = String(action || '').toLowerCase();
    const approver = body.approver || 'مدير النظام';
    const index = findApprovalIndex(db, requestId);

    if (index === -1) {
      return {
        status: 404,
        payload: { error: 'Request not found', errorCode: 'NOT_FOUND' }
      };
    }

    const request = db.approvals.pending.splice(index, 1)[0];
    const approved = normalizedAction === 'approve' || normalizedAction === 'execute';
    const status = approved ? 'completed' : 'rejected';
    const reason = body.reason || 'تم الرفض لدواعي حماية البيانات';
    const auditEntry = await buildApprovalAudit(request, normalizedAction, approver, reason);

    request.status = status;
    request.approver = approver;
    if (!approved) request.rejectionReason = reason;
    db.approvals.recent.unshift(request);
    db.audit.rows.unshift(auditEntry);
    db.audit.entries = db.audit.rows;

    updateEvidenceForApproval(db, request, status, auditEntry.response);
    recalculateSummaryStats();
    notifyUIUpdated();

    return { status: 200, payload: auditEntry };
  }

  async function handleBulkAction(db, body = {}) {
    const requestIds = Array.isArray(body.requestIds) ? body.requestIds : Array.isArray(body.ids) ? body.ids : [];
    const action = body.action || 'approve';
    const results = await Promise.all(requestIds.map(async (requestId) => ({
      requestId,
      ...await applyApprovalAction(db, requestId, action, body)
    })));
    const failed = results.filter((result) => result.status >= 400);

    return {
      status: failed.length ? 207 : 200,
      payload: {
        success: failed.length === 0,
        action,
        results: results.map(({ requestId, status, payload }) => ({ requestId, status, payload }))
      }
    };
  }

  // Handle local mock request responses
  async function handleMockRequest(url, options) {
    const parsedUrl = new URL(url, window.location.origin);
    const path = parsedUrl.pathname;
    const searchParams = parsedUrl.searchParams;

    const db = window.kernelDemoState;
    let payload = null;
    let status = 200;

    const method = String(options?.method || 'GET').toUpperCase();

    if (path.endsWith('/nvidia/status')) {
      payload = {
        configured: false,
        model: 'nvidia/llama-3.1-nemotron-70b-instruct',
        mode: 'demo',
        provider: 'nvidia',
        demoMode: true
      };
    } else if (path.endsWith('/nvidia/chat')) {
      if (method !== 'POST') {
        payload = { error: 'Method not allowed', errorCode: 'METHOD_NOT_ALLOWED' };
        status = 405;
      } else {
        const parsedBody = parseJsonBody(options);
        if (!parsedBody.ok) return jsonResponse(parsedBody.body, parsedBody.status);
        payload = await simulateChat(parsedBody.body.message, parsedBody.body.compliancePack || 'general');
      }
    } else if (path.endsWith('/providers')) {
      payload = {
        activeProvider: {
          name: 'local',
          configured: true,
          model: 'brightai-kernel-demo',
          region: 'local',
          dataResidency: 'Browser demo only; no external transfer',
          supportsArabic: true,
          mode: 'demo',
          adapter: 'demo'
        },
        provider: {
          name: 'local',
          configured: true,
          model: 'brightai-kernel-demo',
          region: 'local',
          dataResidency: 'Browser demo only; no external transfer',
          supportsArabic: true,
          mode: 'demo',
          adapter: 'demo'
        },
        providers: {
          nvidia: { name: 'nvidia', configured: false, model: 'nvidia/llama-3.1-nemotron-70b-instruct', region: 'global', dataResidency: 'NVIDIA configured region', supportsArabic: true, mode: 'production' },
          gemini: { name: 'gemini', configured: false, model: 'gemini-2.5-flash', region: 'global', dataResidency: 'Google configured region', supportsArabic: true, mode: 'production' },
          openai: { name: 'openai', configured: false, model: 'gpt-4.1-mini', region: 'global', dataResidency: 'OpenAI configured region', supportsArabic: true, mode: 'production' },
          anthropic: { name: 'anthropic', configured: false, model: 'claude-3-5-sonnet-latest', region: 'global', dataResidency: 'Anthropic configured region', supportsArabic: true, mode: 'production' },
          allam: { name: 'allam', configured: false, model: 'allam-demo-sovereign-sa', region: 'Saudi Arabia', dataResidency: 'Saudi Arabia sovereign option (demo adapter)', supportsArabic: true, mode: 'demo', adapter: 'demo', note: 'ALLaM is displayed as a Saudi sovereign option; this demo does not claim a live connection.' },
          local: { name: 'local', configured: true, model: 'brightai-kernel-demo', region: 'local', dataResidency: 'Browser demo only; no external transfer', supportsArabic: true, mode: 'demo', adapter: 'demo' }
        },
        order: ['nvidia', 'gemini', 'openai', 'anthropic', 'allam', 'local'],
        demoMode: true
      };
    } else if (path.endsWith('/health')) {
      payload = {
        status: "ok",
        provider: { name: "local", model: "brightai-kernel-demo", configured: true, mode: 'demo', region: 'local', dataResidency: 'Browser demo only; no external transfer', supportsArabic: true },
        kernel: { database: true, routes: true }
      };
    } else if (path.endsWith('/stats')) {
      payload = db.stats;
    } else if (path.endsWith('/audit')) {
      // Filtering audit logs mock
      const searchQuery = searchParams.get('search') || '';
      const departmentQuery = searchParams.get('department') || '';
      const riskQuery = searchParams.get('riskLevel') || searchParams.get('risk_level') || '';
      let filteredRows = db.audit.rows;
      if (searchQuery) {
        filteredRows = filteredRows.filter(r => 
          (r.query || '').includes(searchQuery) || 
          (r.traceId || '').includes(searchQuery)
        );
      }
      if (departmentQuery) {
        filteredRows = filteredRows.filter(r => (r.department || r.departmentName || '').toLowerCase() === departmentQuery.toLowerCase());
      }
      if (riskQuery) {
        filteredRows = filteredRows.filter(r => {
          const level = (r.riskLevel || r.risk_level || '').toLowerCase();
          const wanted = riskQuery.toLowerCase();
          return wanted === 'low' ? level === 'low' || level === 'minimal' : level === wanted;
        });
      }
      payload = {
        rows: filteredRows,
        entries: filteredRows,
        total: filteredRows.length
      };
    } else if (path.endsWith('/chain') || path.endsWith('/chain/verify')) {
      payload = {
        valid: true,
        brokenAt: null,
        totalRecords: db.audit.rows.length,
        chainStatus: 'VALID',
        chainHash: db.audit.rows[0]?.recordHash || await generateHash(JSON.stringify(db.audit.rows[0] || {})),
        totalEntries: db.audit.rows.length,
        entries: db.audit.rows,
        summary: {
          actionTypes: { "BLOCKED": 1, "CHAT_REQUEST": 1, "APPROVAL_REQUESTED": 1 },
          actorCount: 2
        }
      };
    } else if (path.endsWith('/approvals/bulk')) {
      if (method !== 'POST') {
        payload = { error: 'Method not allowed', errorCode: 'METHOD_NOT_ALLOWED' };
        status = 405;
      } else {
        const parsedBody = parseJsonBody(options);
        if (!parsedBody.ok) return jsonResponse(parsedBody.body, parsedBody.status);
        const result = await handleBulkAction(db, parsedBody.body);
        payload = result.payload;
        status = result.status;
      }
    } else if (/\/approvals\/[^/]+\/(approve|reject|execute)$/.test(path)) {
      if (method !== 'POST') {
        payload = { error: 'Method not allowed', errorCode: 'METHOD_NOT_ALLOWED' };
        status = 405;
      } else {
        const match = path.match(/\/approvals\/([^/]+)\/(approve|reject|execute)$/);
        const parsedBody = parseJsonBody(options);
        if (!parsedBody.ok) return jsonResponse(parsedBody.body, parsedBody.status);
        const result = await applyApprovalAction(db, match?.[1], match?.[2], parsedBody.body);
        payload = result.payload;
        status = result.status;
      }
    } else if (path.endsWith('/approvals') || path.endsWith('/pending')) {
      if (method === 'POST') {
        const parsedBody = parseJsonBody(options);
        if (!parsedBody.ok) return jsonResponse(parsedBody.body, parsedBody.status);
        const body = parsedBody.body;
        const reqId = body.requestId || body.interactionId || body.id;
        const action = body.action;
        if (['approve', 'reject', 'execute'].includes(action)) {
          const result = await applyApprovalAction(db, reqId, action, body);
          payload = result.payload;
          status = result.status;
        } else {
          payload = { error: 'Unsupported approval action', errorCode: 'INVALID_ACTION' };
          status = 400;
        }
      } else {
        payload = db.approvals;
      }
    } else if (path.endsWith('/policies')) {
      if (method === 'POST') {
        const parsedBody = parseJsonBody(options);
        if (!parsedBody.ok) return jsonResponse(parsedBody.body, parsedBody.status);
        const body = parsedBody.body;
        const newPolicy = {
          id: `policy_${Date.now()}`,
          name: body.name || 'سياسة جديدة',
          description: body.description || '',
          pii_type: body.piiType || body.pii_type || 'saudi_id',
          compliance_pack: body.compliancePack || body.compliance_pack || 'general',
          action: body.action || 'mask',
          risk_score_modifier: toNumber(body.riskScoreModifier ?? body.risk_score_modifier, 0),
          is_active: 1
        };
        db.policies.unshift(newPolicy);
        recalculateSummaryStats();
        payload = newPolicy;
      } else {
        payload = db.policies;
      }
    } else if (path.includes('/policies/')) {
      const match = path.match(/\/policies\/([^/]+)/);
      const id = match?.[1] ? decodeURIComponent(match[1]) : '';
      const index = db.policies.findIndex((policy) => String(policy.id) === id);

      if (index === -1) {
        payload = { error: 'Policy not found', errorCode: 'NOT_FOUND' };
        status = 404;
      } else if (method === 'PATCH') {
        const parsedBody = parseJsonBody(options);
        if (!parsedBody.ok) return jsonResponse(parsedBody.body, parsedBody.status);
        const body = parsedBody.body;
        db.policies[index] = {
          ...db.policies[index],
          ...body,
          is_active: body.is_active ?? db.policies[index].is_active
        };
        recalculateSummaryStats();
        payload = db.policies[index];
      } else if (method === 'DELETE') {
        const removed = db.policies.splice(index, 1)[0];
        recalculateSummaryStats();
        payload = { success: true, deleted: removed.id };
      } else {
        payload = db.policies[index];
      }
    } else if (path.includes('/evidence/')) {
      const match = path.match(/\/evidence\/([^/]+)/);
      if (match && match[1]) {
        const id = decodeURIComponent(match[1]);
        const record = db.evidence.details[id] || db.evidence.details[id.replace(/\/export$/, '')];
        if (record) {
          payload = await buildMockEvidenceFile(record, db, id);
        } else {
          // fallback single lookup
          payload = await buildMockEvidenceFile({
            id,
            interactionId: id,
            traceId: id,
            timestamp: new Date().toISOString(),
            request: "طلب تصدير ملفات الأدلة ومراجعة حوكمة BrightAI Kernel",
            response: "هذا السجل آمن ومحفوظ بالكامل عبر سلسلة التدقيق الموثوقة وصناعية بشكل كامل.",
            riskScore: 10,
            riskLevel: "low",
            approvalStatus: "completed",
            requestHash: await generateHash(id),
            previousHash: await generateHash(`previous-${id}`),
            recordHash: await generateHash(`record-${id}`)
          }, db, id);
        }
      } else {
        payload = db.evidence;
      }
    } else if (path.endsWith('/evidence')) {
      const traceIdParam = searchParams.get('traceId') || searchParams.get('trace_id');
      if (traceIdParam) {
        const detail = db.evidence.details[traceIdParam];
        payload = {
          evidence: detail ? [detail] : [],
          rows: detail ? [detail] : [],
          total: detail ? 1 : 0
        };
      } else {
        payload = db.evidence;
      }
    } else if (path.endsWith('/compliance') || path.endsWith('/compliance/check')) {
      payload = db.compliance;
    } else if (path.endsWith('/chat')) {
      // POST chat simulation
      if (method !== 'POST') {
        payload = { error: 'Method not allowed', errorCode: 'METHOD_NOT_ALLOWED' };
        status = 405;
      } else if (options && options.body) {
        const parsedBody = parseJsonBody(options);
        if (!parsedBody.ok) return jsonResponse(parsedBody.body, parsedBody.status);
        const body = parsedBody.body;
        payload = await simulateChat(body.message, body.compliancePack);
      } else {
        payload = { error: 'Message body is required', errorCode: 'BAD_REQUEST' };
        status = 400;
      }
    } else {
      payload = { error: 'Not found mock', errorCode: 'MOCK_NOT_FOUND' };
      status = 404;
    }

    return jsonResponse(payload, status);
  }

  // Intercept globally using fetch wrapper
  const originalFetch = window.fetch;
  window.fetch = async function (url, options) {
    const urlStr = String(url);

    if (urlStr.includes('/api/kernel')) {
      if (shouldUseDemoData()) {
        await ensureDBInitialized();
        return await handleMockRequest(urlStr, options);
      }

      return originalFetch(url, options);
    }

    return originalFetch(url, options);
  };

  global.KernelMockHandlers = {
    simulateChat,
    handleMockRequest,
  };

})(typeof window !== 'undefined' ? window : this);
