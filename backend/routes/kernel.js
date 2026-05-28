'use strict';

const kernel = require('../kernel');

async function kernelChatHandler(req, res) {
  const { message, compliancePack, metadata } = req.body || {};
  if (!message) {
    return res.status(400).json({ error: 'message is required', errorCode: 'MISSING_MESSAGE' });
  }

  const userId = req.headers['x-kernel-user-id'] || null;
  const userName = req.headers['x-kernel-user-name'] || null;

  const result = await kernel.processChat({
    message,
    userId,
    userName,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    compliancePack: compliancePack || 'general',
    metadata: metadata || {}
  });

  const statusCode = result.status === 'blocked' ? 403
    : result.status === 'pending_approval' ? 202
    : 200;

  res.status(statusCode).json(result);
}

async function kernelAuditListHandler(req, res) {
  const url = req.url || req.originalUrl || '';
  let params = {};
  try {
    const search = url.includes('?') ? url.split('?')[1] : '';
    params = Object.fromEntries(new URLSearchParams(search));
  } catch (_) {}

  const filters = {
    userId: params.userId,
    riskLevel: params.riskLevel,
    compliancePack: params.compliancePack,
    approvalStatus: params.approvalStatus,
    dateFrom: params.dateFrom ? parseInt(params.dateFrom) : undefined,
    dateTo: params.dateTo ? parseInt(params.dateTo) : undefined,
    search: params.search
  };

  const result = await kernel.queryAuditTrail(filters, parseInt(params.limit) || 50, parseInt(params.offset) || 0);
  res.status(200).json(result);
}

async function kernelAuditDetailHandler(req, res, url) {
  const id = url.split('/api/kernel/audit/')[1]?.split('?')[0];
  if (!id) return res.status(400).json({ error: 'Missing audit ID' });

  const entry = await kernel.getAuditEntry(id);
  if (!entry) return res.status(404).json({ error: 'Audit entry not found' });

  res.status(200).json(entry);
}

async function kernelApproveHandler(req, res, url) {
  const id = url.split('/api/kernel/approve/')[1]?.split('?')[0];
  if (!id) return res.status(400).json({ error: 'Missing interaction ID' });

  const { approvedBy, comment } = req.body || {};
  const approver = approvedBy || req.headers['x-kernel-user-id'] || 'unknown';

  try {
    const result = await kernel.approve(id, approver, comment);
    res.status(200).json(result);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
}

async function kernelRejectHandler(req, res, url) {
  const id = url.split('/api/kernel/reject/')[1]?.split('?')[0];
  if (!id) return res.status(400).json({ error: 'Missing interaction ID' });

  const { rejectedBy, comment } = req.body || {};
  const rejector = rejectedBy || req.headers['x-kernel-user-id'] || 'unknown';

  try {
    const result = await kernel.reject(id, rejector, comment || 'Rejected');
    res.status(200).json(result);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
}

async function kernelPendingHandler(req, res) {
  const url = req.url || '';
  let limit = 50, offset = 0;
  try {
    const search = url.includes('?') ? url.split('?')[1] : '';
    const params = Object.fromEntries(new URLSearchParams(search));
    limit = parseInt(params.limit) || 50;
    offset = parseInt(params.offset) || 0;
  } catch (_) {}

  const result = await kernel.getPendingApprovals(null, limit, offset);
  res.status(200).json({ pending: result, total: result.length });
}

async function kernelStatsHandler(req, res) {
  const stats = await kernel.getStats();
  res.status(200).json(stats);
}

async function kernelEvidenceHandler(req, res, url) {
  const id = url.split('/api/kernel/evidence/')[1]?.split('?')[0];
  if (!id) return res.status(400).json({ error: 'Missing interaction ID' });

  try {
    const evidence = await kernel.generateEvidenceFile(id);
    res.status(200).json(evidence);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
}

async function kernelComplianceCheckHandler(req, res) {
  const status = await kernel.getComplianceStatus();
  res.status(200).json(status);
}

async function kernelRouteHandler(req, res, method, url) {
  try {
    if (method === 'POST' && url === '/api/kernel/chat') return await kernelChatHandler(req, res);
    if (method === 'GET' && url.startsWith('/api/kernel/audit/')) return await kernelAuditDetailHandler(req, res, url);
    if (method === 'GET' && url === '/api/kernel/audit') return await kernelAuditListHandler(req, res);
    if (method === 'POST' && url.startsWith('/api/kernel/approve/')) return await kernelApproveHandler(req, res, url);
    if (method === 'POST' && url.startsWith('/api/kernel/reject/')) return await kernelRejectHandler(req, res, url);
    if (method === 'GET' && url === '/api/kernel/pending') return await kernelPendingHandler(req, res);
    if (method === 'GET' && url === '/api/kernel/stats') return await kernelStatsHandler(req, res);
    if (method === 'POST' && url.startsWith('/api/kernel/evidence/')) return await kernelEvidenceHandler(req, res, url);
    if (method === 'GET' && url === '/api/kernel/compliance/check') return await kernelComplianceCheckHandler(req, res);

    res.status(404).json({ error: 'Kernel endpoint not found', errorCode: 'KERNEL_NOT_FOUND' });
  } catch (err) {
    console.error('[BrightTrust Kernel] Route error:', err);
    res.status(500).json({ error: 'Kernel processing error', errorCode: 'KERNEL_ERROR', details: err.message });
  }
}

module.exports = { kernelRouteHandler };
