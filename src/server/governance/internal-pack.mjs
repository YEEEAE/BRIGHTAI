import { assetKinds } from './contract.mjs';

const requirement = (id, control, product, axis, statement, procedure, evidence, owner, critical = true, appliesTo = assetKinds) => ({
  id, control, product, axis, requirement: statement,
  check: { id: `check.${id}`, procedure },
  expectedEvidence: { kind: control, description: evidence },
  owner, critical, severity: critical ? 'P0' : 'STANDARD', appliesTo,
});

export function internalPack() {
  return {
    synthetic: true,
    id: 'aigas.synthetic-baseline',
    version: 1,
    effectiveOn: '2026-11-25',
    source: { type: 'INTERNAL', reference: 'aigas.synthetic-governance-contract' },
    appliesTo: [...assetKinds],
    requirements: [
      requirement('inventory', 'versioned-asset', 'kernel', 'inventory',
        'Register each asset with a responsible owner, documented purpose and review date.',
        'Compare the current registry revision and review due date to the assessment.',
        'Registry record with asset id, version, synthetic source and review owner.', 'asset-steward'),
      requirement('agent-boundary', 'tool-action-boundary', 'firewall', 'enforcement',
        'Enforce immutable agent tool/action limits with default deny and an independent approval path.',
        'Exercise allowed, denied, approval-required and unknown pairs against the server baseline.',
        'Version-bound decisions showing ALLOW, BLOCK/DENY, ESCALATE and default deny.', 'security-steward', true, ['AGENT']),
      requirement('risk', 'risk-assessment', 'risk-engine', 'risk',
        'Review the synthetic risk scenario at the current asset and pack revision.',
        'Use the versioned Risk Engine method and document the rationale for likelihood and impact.',
        'Risk method version, inputs, result and reviewer rationale.', 'risk-steward'),
      requirement('human-review', 'independent-review', 'human-gate', 'oversight',
        'Bind independent human review to the exact action, request and policy revision.',
        'Verify the pending review, deny self-review and reject mismatched bindings.',
        'Pending review metadata and result of separation-of-duties and binding checks.', 'review-steward', true, ['AGENT']),
      requirement('evidence', 'evidence-export', 'ledger', 'traceability',
        'Export the complete requirement-to-evidence chain at the current revision.',
        'Check control, check, scope, status, evidence reference and bound revision in the export.',
        'Machine-readable export and its SHA-256 digest.', 'evidence-steward'),
      requirement('secure-chat', 'chat-governance', 'secure-chat', 'enforcement',
        'Review the synthetic chat action against its authorized model and policy boundaries.',
        'Record the model approval and policy decision bound to this assessment revision.',
        'Synthetic model approval and policy decision references.', 'security-steward'),
    ],
  };
}
