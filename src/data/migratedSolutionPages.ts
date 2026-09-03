import aiFirewall from './migrated-pages/solution-ai-firewall.json';
import aiAuditTrail from './migrated-pages/solution-ai-audit-trail.json';
import aiEvidenceFile from './migrated-pages/solution-ai-evidence-file.json';
import humanApprovalLayer from './migrated-pages/solution-human-approval-layer.json';
import continuousAiGovernance from './migrated-pages/solution-continuous-ai-governance.json';
import aiRiskClassification from './migrated-pages/solution-ai-risk-classification.json';
import aiUseCaseDiscovery from './migrated-pages/solution-ai-use-case-discovery.json';
import policyToControlMapping from './migrated-pages/solution-policy-to-control-mapping.json';
import banking from './migrated-pages/sector-banking-ai-governance.json';
import government from './migrated-pages/sector-government-ai-governance.json';
import healthcare from './migrated-pages/sector-healthcare-ai-governance.json';
import manufacturing from './migrated-pages/sector-manufacturing-ai-governance.json';
import bankingRiyadh from './migrated-pages/local-banking-ai-governance-riyadh.json';
import governmentDammam from './migrated-pages/local-government-ai-governance-dammam.json';
import healthcareJeddah from './migrated-pages/local-healthcare-ai-governance-jeddah.json';

export interface MigratedPage {
  source: string;
  title: string;
  description: string;
  canonical: string;
  hreflang: { lang: string; href: string }[];
  jsonLd: Record<string, unknown>[];
  html: string;
}

// SEMRUSH-STRUCTURED-DATA-2026-09-04: legacy migrated Service nodes omitted
// their canonical URL. Normalize them once at the data boundary.
function withServiceUrls(value: unknown, canonical: string, seen = new WeakSet<object>()): unknown {
  if (!value || typeof value !== 'object') return value;
  if (seen.has(value as object)) return value;
  seen.add(value as object);
  if (Array.isArray(value)) return value.map((entry) => withServiceUrls(entry, canonical, seen));
  const source = value as Record<string, unknown>;
  const next: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(source)) next[key] = withServiceUrls(child, canonical, seen);
  const type = source['@type'];
  const isService = type === 'Service' || (Array.isArray(type) && type.includes('Service'));
  if (isService && typeof next.url !== 'string') next.url = canonical;
  return next;
}

function normalizeMigratedPages(pages: Record<string, MigratedPage>): Record<string, MigratedPage> {
  return Object.fromEntries(Object.entries(pages).map(([key, page]) => [key, {
    ...page,
    jsonLd: withServiceUrls(page.jsonLd, page.canonical) as Record<string, unknown>[],
  }])) as Record<string, MigratedPage>;
}

export const migratedSolutionPages: Record<string, MigratedPage> = normalizeMigratedPages({
  'ai-firewall': aiFirewall,
  'ai-audit-trail': aiAuditTrail,
  'ai-evidence-file': aiEvidenceFile,
  'human-approval-layer': humanApprovalLayer,
  'continuous-ai-governance': continuousAiGovernance,
  'ai-risk-classification': aiRiskClassification,
  'ai-use-case-discovery': aiUseCaseDiscovery,
  'policy-to-control-mapping': policyToControlMapping,
});

export const migratedSectorPages: Record<string, MigratedPage> = normalizeMigratedPages({
  'banking-ai-governance': banking,
  'government-ai-governance': government,
  'healthcare-ai-governance': healthcare,
  'manufacturing-ai-governance': manufacturing,
});

export const migratedLocalPages: Record<string, MigratedPage> = normalizeMigratedPages({
  'banking-ai-governance/riyadh': bankingRiyadh,
  'government-ai-governance/dammam': governmentDammam,
  'healthcare-ai-governance/jeddah': healthcareJeddah,
});
