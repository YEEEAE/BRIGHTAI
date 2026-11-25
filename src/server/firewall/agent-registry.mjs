// Exact synthetic tuples. Only authenticated HTTP callers can request simulation.
export const registryVersion = 1;
export const toolCallFields = Object.freeze(['tool', 'action', 'resource', 'capability', 'version']);
export const registry = Object.freeze([
  Object.freeze({tool:'demo-documents', action:'read', resource:'demo:report', capability:'documents.read', version:1, decision:'ALLOW', id:'agent-read', name:'قراءة تقرير اصطناعي'}),
  Object.freeze({tool:'demo-documents', action:'publish', resource:'demo:report', capability:'documents.publish', version:1, decision:'ESCALATE', id:'agent-publish', name:'نشر اصطناعي يتطلب مراجعة بشرية'}),
  Object.freeze({tool:'demo-documents', action:'delete', resource:'demo:report', capability:'documents.delete', version:1, decision:'DENY', id:'agent-delete', name:'حذف اصطناعي محجوب'}),
]);

const defaultDeny = Object.freeze({ action:'DENY', reason:'RULE_DENY', matcher_id:'agent-default-deny', matcher_version:registryVersion,
  rule_id:null, rule_version:null, rule_name:'الطلب خارج سجل الأدوات المصرّح بها', output:null });

export function evaluateToolCall(call) {
  const entry = call && typeof call === 'object' && !Array.isArray(call)
    && Object.keys(call).length === toolCallFields.length && toolCallFields.every(key => Object.hasOwn(call, key))
    && registry.find(item => toolCallFields.every(key => call[key] === item[key]));
  if (!entry) return defaultDeny;
  return {
    action:entry.decision, reason:`RULE_${entry.decision}`, matcher_id:entry.id, matcher_version:registryVersion,
    rule_id:null, rule_version:null, rule_name:entry.name, output:null,
  };
}
