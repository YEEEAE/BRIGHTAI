import type { ValidationResult, Workflow } from "./types";

export const detectCycle = (workflow: Workflow): boolean => {
  const nodes = workflow.nodes;
  const edges = workflow.edges || [];
  const incoming = new Map<string, number>();
  const adjacency = new Map<string, string[]>();

  for (const node of nodes) {
    incoming.set(node.id, 0);
    adjacency.set(node.id, []);
  }
  for (const edge of edges) {
    incoming.set(edge.target, (incoming.get(edge.target) || 0) + 1);
    adjacency.get(edge.source)?.push(edge.target);
  }

  const queue = nodes.filter((node) => (incoming.get(node.id) || 0) === 0).map((node) => node.id);
  let visited = 0;

  while (queue.length > 0) {
    const id = queue.shift();
    if (!id) {
      break;
    }
    visited += 1;
    for (const next of adjacency.get(id) || []) {
      incoming.set(next, (incoming.get(next) || 0) - 1);
      if ((incoming.get(next) || 0) === 0) {
        queue.push(next);
      }
    }
  }

  return visited !== nodes.length;
};

export const validateWorkflowStructure = (workflow: Workflow): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!workflow || !Array.isArray(workflow.nodes)) {
    errors.push("المخطط غير معرف أو لا يحتوي على عقد.");
    return { isValid: false, errors, warnings };
  }

  const nodeIds = new Set<string>();
  for (const node of workflow.nodes) {
    if (!node.id) {
      errors.push("تم العثور على عقدة بدون معرف.");
      continue;
    }
    if (nodeIds.has(node.id)) {
      errors.push(`معرف مكرر للعقدة: ${node.id}`);
    }
    nodeIds.add(node.id);
    if (!node.type) {
      errors.push(`نوع مفقود للعقدة: ${node.id}`);
    }
  }

  if (!workflow.nodes.some((node) => node.type === "input")) {
    errors.push("يجب وجود عقدة إدخال واحدة على الأقل.");
  }
  if (!workflow.nodes.some((node) => node.type === "output")) {
    warnings.push("لا توجد عقدة مخرجات واضحة.");
  }

  for (const edge of workflow.edges || []) {
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
      errors.push("يوجد ارتباط يشير إلى عقدة غير موجودة.");
    }
  }

  if (detectCycle(workflow)) {
    errors.push("المخطط يحتوي على حلقة غير مسموحة.");
  }

  return { isValid: errors.length === 0, errors, warnings };
};
