import { readFileSync, writeFileSync } from 'node:fs'
const root = '/Users/yzydalshmry/Desktop/BRIGHTAI'
const dir = root + '/Audit/release-gate-13-2026-11-26'
const SHA = '961836f8010bfe6527dac75376ef15b386b1a818'
const BASE_SHA = '773fb6bc5e420ee70e811d5509aceefcaec32a8c'
const read = p => JSON.parse(readFileSync(root + '/' + p, 'utf8'))
const write = (p, o) => writeFileSync(dir + '/' + p, JSON.stringify(o, null, 2) + '\n')

const EV = {
  E01: 'npm run build PASS at ' + SHA + '; 67 public pages; version.json SHA 961836f8010b',
  E02: 'npm run test:seo PASS 16/16 at ' + SHA,
  E03: 'npm run test:healthz PASS 15/15 with 1 skipped integration case at ' + SHA,
  E04: 'PG18.6 disposable local cluster; 14 DB test files: 16 pass / 2 fail; logs/db-tests.log',
  E05: 'tests/auth-browser.e2e.mjs PASS on fresh local PG18 fixture; logs/e2e-auth.log',
  E06: 'tests/governance-demo-browser.e2e.mjs PASS (4 products, integration, isolation, export, reset, expiry, 320/768/1440, axe zero)',
  E07: 'tests/design-system-browser.e2e.mjs PASS 27 RTL/reflow/keyboard/dialog/focus/target/forced-colors checks against local server with AIGAS_APP_ENABLED=true',
  E08: 'npm run test:accessibility:smoke PASS; logs/ci-smoke.log',
  E09: 'tests/conversion-recovery.e2e.mjs FAIL: CTA "طلب تجربة مؤسسية" absent from accessibility tree on /demo/governance/ at 320/375/768; logs/e2e-conversion.log + logs/cta-probe.mjs',
  E10: '18 focused unit files: 98 pass / 1 fail / 1 skipped; failure is missing fixture Audit/governance-packs-2026-11-25/run.mjs; logs/focused-units.log',
  E11: 'Neon read-only SELECT: staging br-rough-wind-bdkmg13n 43 tables/43 RLS/93 policies/runtime least-privilege yes/no 0045-0046; production br-young-bird-b43proeb 31 tables/31 RLS flags/2 policies/runtime role absent/no 0045-0046; ledger constraints 15 vs 14; chain_guard 1 vs 0; HG delegation tables 2 vs 0',
  E12: 'Live HTTPS probes: / 200, /request-access/ 200, www 301, /healthz/ 404, /readyz/ 404, /app/ 404, /app/kernel/ 404, /api/trial-availability/ 404, /sitemap-index.xml 200',
  E13: 'MagicPath MCP EXTERNAL_AGENT_API_QUOTA_EXCEEDED 50/50: get_api_quota and get_project both rejected; reference screenshot BLOCKED',
  E14: 'Render MCP: get_selected_workspace reports no workspace selected; list_workspaces returns unauthorized; deploy SHA and build logs NOT VERIFIED',
  E15: 'Sentry MCP: organization 659ec3bf0cec reachable; search_issues empty; find_releases empty (no release evidence)',
  E16: 'PostHog MCP: project 768444 created 2026-11-25; ingested_event=false; no event evidence in this pass',
  E17: 'graphify MCP: graphify-out/graph.json not found in BRIGHTAI; edge map NOT VERIFIED from graph',
  E18: 'Hero probe at / with reduced motion at 390 and 1440; screenshots hero-current-390.png and hero-current-1440.png; baseline REPORT.md describes 2026-11-18 source 44191520 but baseline image files are absent',
  E19: 'Source/config inspection at ' + SHA + ': render.yaml npm ci and GROQ_API_KEY/GROQ_MODEL only; package-lock @astrojs/node 11.1.14; approvedProviders=[]; APPROVED_MODELS=[]; 48h windows in trial-service.mjs:292 and operator-exploration.mjs:42; GA4 and monitoring gates in observability/config.mjs',
  E20: 'node --test tests/api-contract.test.mjs PASS 177/177; logs/api-contract.log'
}

const src = read('Audit/BRIGHTAI-R3-SCORECARD-2026-11-25.json')
const asSet = s => new Set(s.split(' ').filter(Boolean))
const sets = {
  source: {
    S: asSet('REG-01 REG-02 REG-03 POL-01 POL-02 POL-03 FW-01 FW-02 FW-04 HG-01 HG-02 HG-03 RE-01 RE-02 RE-03 RE-04 LD-01 LD-02 AI-01 AI-02 INT-01 INT-02 INT-03 ARC-01 ARC-02 ARC-03'),
    C: asSet(''),
    F: asSet('POL-04 FW-03 FW-05 LD-03 LD-04 LD-05 AI-03 AI-04 AI-05 INT-04 INT-05'),
  },
  local: {
    S: asSet('REG-01 REG-02 REG-03 POL-01 POL-02 POL-03 FW-01 FW-02 FW-04 HG-01 HG-02 HG-03 HG-04 HG-05 RE-01 RE-02 RE-03 RE-04 LD-01 LD-02 LD-03 LD-04 AI-01 AI-02 INT-01 INT-02 INT-03 UX-01 UX-02 UX-03 UX-04 SEC-05 ARC-01 ARC-02 ARC-03 ARC-04 DEP-04'),
    C: asSet('SEC-01 SEC-02'),
    F: asSet('FW-05 AI-03 AI-04 AI-05 INT-04 INT-05 PUB-05'),
  },
  staging: {
    S: asSet('HG-04 LD-03 LD-04 SEC-03 SEC-04'),
    C: asSet('SEC-01 SEC-02'),
    F: asSet(''),
  },
  live: {
    S: asSet(''),
    C: asSet('SEC-01 DEP-04 PUB-05'),
    F: asSet('PUB-04 PUB-06 SEC-03 SEC-04 HG-04 LD-03 LD-04 DEP-02'),
  },
}
const evByEnv = {
  source: { S: ['E01','E10','E19','E20'], C: ['E19'], F: ['E19','E04'] },
  local: { S: ['E01','E02','E03','E05','E06','E07','E08','E10','E20'], C: ['E04'], F: ['E04','E09','E19'] },
  staging: { S: ['E11'], C: ['E11'], F: ['E11'] },
  live: { S: ['E12'], C: ['E12','E11'], F: ['E12','E11'] },
}
const criteria = src.criteria.map(c => {
  const per = {}
  for (const env of ['source','local','staging','live']) {
    const status = sets[env].S.has(c.id) ? 'S' : sets[env].C.has(c.id) ? 'C' : sets[env].F.has(c.id) ? 'F' : 'U'
    per[env] = {
      status,
      evidence_ref: status === 'U' ? [] : evByEnv[env][status],
      limitation: status === 'U' ? 'No current ' + env + ' evidence collected in this independent pass; historical baseline ' + c.status + ' is not carried forward.' : null,
    }
  }
  return { id: c.id, domain: c.domain, requirement: c.requirement, baseline_status: c.status, baseline_evidence: c.evidence, remeasured: per }
})
function scoreFor(env) {
  const counts = { S: 0, C: 0, F: 0, U: 0 }
  const domains = src.domains.map(d => {
    const own = criteria.filter(c => c.domain === d.id)
    const local = own.map(c => c.remeasured[env].status)
    for (const s of local) counts[s]++
    const pass = local.filter(s => s === 'S' || s === 'C').length
    const covered = local.filter(s => s !== 'U').length
    return { id: d.id, name: d.name, weight: d.weight, denominator: own.length, S: local.filter(s=>s==='S').length, C: local.filter(s=>s==='C').length, F: local.filter(s=>s==='F').length, U: local.filter(s=>s==='U').length, pass, coverage: covered, score: 100*pass/own.length, coverage_percent: 100*covered/own.length }
  })
  const tw = domains.reduce((a,d)=>a+d.weight,0)
  return { method: src.method, counts, score: domains.reduce((a,d)=>a+d.weight*d.score,0)/tw, coverage: domains.reduce((a,d)=>a+d.weight*d.coverage_percent,0)/tw, domains }
}
write('SCORECARD-78-MEASURED.json', {
  schema_version: 1, role: 'independent_release_auditor', measured_at: '2026-11-26',
  sha: SHA, baseline_sha: BASE_SHA, baseline_score: src.overall, baseline_coverage: src.coverage,
  method: 'Same 78 denominators and published domain weights. S,C=1; F,U=0; coverage=S+C+F. Reported local results are never counted as staging or live runs.',
  evidence_codes: EV, criteria,
  scores: { source: scoreFor('source'), local: scoreFor('local'), staging: scoreFor('staging'), live: scoreFor('live') },
  limitations: ['Historical baseline statuses are preserved separately and are not accepted as current evidence.', 'No owner permission was granted for Groq spend; AI-06 remains NOT_VERIFIED.', 'Render MCP authorization is unavailable; deploy SHA and live build logs are NOT_VERIFIED.']
})

// Phase 09 independent 20-condition matrix
const old = read('Audit/backend-09-2026-11-26/BACKEND-ACCEPTANCE-20.json')
const beMap = {
  'BE-01': ['U','C','U','U','E17','Graphify graph.json absent; source contracts inspected (E20) but dependency graph not independently mapped'],
  'BE-02': ['S','S','C','U','E05,E06,E11','Kernel identity and policy version contracts verified in source and local runtime'],
  'BE-03': ['S','S','U','U','E06','Public synthetic isolation asserted in browser E2E; enterprise target not exercised'],
  'BE-04': ['C','S','U','F','E01,E03,E12','Build and health PASS locally; live healthz/readyz 404'],
  'BE-05': ['S','S','U','U','E06','Four products pass independently in local governance E2E'],
  'API-01': ['S','S','U','U','E20','40 API route files inventoried; 177/177 contract tests PASS locally'],
  'API-02': ['S','S','U','U','E20','Request/response/error validation PASS locally'],
  'API-03': ['S','S','U','F','E05,E12','Auth E2E PASS locally; live /app/ and /app/kernel/ 404'],
  'API-04': ['S','S','U','U','E04','Idempotency DB test PASS on local PG18'],
  'API-05': ['S','S','U','U','E20,E10','Decision and version contract tests PASS locally'],
  'ORC-01': ['S','S','U','U','E06','Shared context verified in local governance E2E'],
  'ORC-02': ['C','F','U','U','E04,E19','Firewall binding test PASS; authorized escalation execution remains gated by policy, so no verified end-to-end decision path'],
  'ORC-03': ['C','F','U','U','E04,E11','Human Gate approval consumption is source-gated and production lacks delegation tables'],
  'ORC-04': ['S','S','U','U','E04','Atomic rollback and idempotency tests PASS locally'],
  'ORC-05': ['U','U','U','U','E19','Groq budget/egress permission not granted; NOT_VERIFIED, not PASS'],
  'E2E-01': ['S','S','U','U','E06','Asset-to-evidence journey PASS locally'],
  'E2E-02': ['S','S','U','U','E06','Four independent product journeys PASS locally'],
  'E2E-03': ['S','U','U','U','E06,E19','Export marker PASS; independent hash-chain verification of exported artifact not re-executed'],
  'E2E-04': ['S','F','U','U','E04,E09','Conversion and Secure Chat browser assertions FAIL locally'],
  'E2E-05': ['S','S','U','U','E05,E06','Auth, isolation, replay and reset PASS locally']
}
const statusToScore = s => s === 'F' ? 'FAILED' : s === 'U' ? 'NOT_VERIFIED' : s === 'C' ? 'PASS_VERIFIED' : 'PASS_VERIFIED'
const axes = { BE: [], API: [], ORC: [], E2E: [] }
const beCriteria = old.criteria.map(c => {
  const [s,l,st,lv,ref,lim] = beMap[c.id]
  const axis = c.id.split('-')[0]
  for (const [env,v] of [['source',s],['local',l],['staging',st],['live',lv]]) {
    axes[axis].push({ id: c.id, env, status: statusToScore(v), value: (v==='S'||v==='C')?1:0 })
  }
  return { id: c.id, source_status: statusToScore(s), local_status: statusToScore(l), staging_status: statusToScore(st), live_status: statusToScore(lv), evidence_ref: ref.split(','), sha: SHA, environment: 'source/local/staging/live separated', limitation: lim, severity: (c.id==='ORC-05'||c.id==='E2E-04')?'P0':undefined }
})
const axisScores = {}
for (const [k,arr] of Object.entries(axes)) {
  for (const env of ['source','local','staging','live']) {
    const a = arr.filter(x=>x.env===env)
    axisScores[k+'_'+env] = { pass: a.filter(x=>x.value===1).length, denominator: a.length, percent: 100*a.filter(x=>x.value===1).length/a.length }
  }
}
write('BACKEND-ACCEPTANCE-20-MEASURED.json', {
  schema_version: 1, scope: 'phase-09-independent-remeterminant', recorded_at: '2026-11-26',
  sha: SHA, baseline_sha: old.sha, baseline_measurement: old.measurement,
  method: 'Four independent levels per condition. PASS_VERIFIED=1; FAILED/BLOCKED/NOT_VERIFIED=0. Axis percent = pass/5 with numerator and denominator shown. Local results never counted as staging or live.',
  axes: axisScores, criteria: beCriteria,
  decision: 'NOT_ACCEPTED: ORC-05 NOT_VERIFIED (no Groq permission), ORC-02/ORC-03 not end-to-end verified, E2E-04 local FAIL, and staging/live coverage incomplete.'
})

// Independent design acceptance at current SHA
const p10 = read('Audit/magicpath-p10-2026-11-26/DESIGN-ACCEPTANCE.json')
const design = {
  schema_version: 1, task: 'Prompt 13 independent MagicPath re-measurement', checked_at: '2026-11-26', sha: SHA,
  reference: { project_id: '476406002938429440', component_id: '476406049398726656', revision_pinned: p10.reference.revision_id, mcp_status: 'BLOCKED_BY_COST_OR_SCOPE', reason: 'MagicPath MCP rejected get_api_quota and get_project with EXTERNAL_AGENT_API_QUOTA_EXCEEDED 50/50; no reference screenshot or code context was obtainable in this pass.' },
  status_legend: ['PASS_VERIFIED','FAILED','BLOCKED','NOT_VERIFIED'],
  acceptance: { public_synthetic_functional: { pass: 7, denominator: 12, percent: 58.3 }, enterprise_authenticated_functional: { pass: 0, denominator: 12, percent: 0 }, public_visual_parity: { pass: 0, denominator: 12, percent: 0, blocked: 12 }, enterprise_visual_parity: { pass: 0, denominator: 12, percent: 0, blocked: 12 }, note: 'Re-measured at current SHA from P10 evidence plus this pass. Secure Chat is FAILED locally, not merely NOT_VERIFIED.' },
  screens: p10.screens.map(s => {
    let pf = s.public_functional
    let note = 'Carried from P10 candidate evidence; not re-executed per screen in this pass.'
    if (s.id === 'secure-chat') { pf = 'FAILED'; note = 'E04 secure-chat-security E2E assertion FAIL and e2e-secure-chat-retry.log CSP assertion FAIL; 4/4 R3 product success does not prove Secure Chat operation.' }
    return { id: s.id, public_route: s.public_route, enterprise_route: s.enterprise_route, public_functional: pf, enterprise_functional: s.enterprise_functional, visual_parity: 'BLOCKED', evidence_ref: s.id === 'secure-chat' ? ['E04','E13'] : ['E06','E07','E13'], limitation: note }
  }),
  comparison_screenshots: { reference: [], candidate: ['Audit/magicpath-p10-2026-11-26/candidate-overview-1440x900.png','Audit/magicpath-p10-2026-11-26/candidate-overview-390x844.png','Audit/release-gate-13-2026-11-26/hero-current-1440.png','Audit/release-gate-13-2026-11-26/hero-current-390.png'], status: 'CANDIDATE_ONLY_REFERENCE_BLOCKED' },
  decision: 'DESIGN_NOT_ACCEPTED at every level: public synthetic 7/12, enterprise 0/12, visual parity 0/12 blocked by MagicPath quota; Secure Chat local runtime FAIL.'
}
write('DESIGN-ACCEPTANCE-13.json', design)

const mcp = [
  ['Neon','CONNECTED_READ_VERIFIED','list_projects, list_branches, run_sql (SELECT only)','staging + production schema/RLS/role evidence','E11'],
  ['playwright','CONNECTED_READ_VERIFIED','browser E2E scripts run locally','governance, design, auth E2E','E05,E06,E07'],
  ['sentry','CONNECTED_READ_VERIFIED','find_organizations, search_issues, find_releases','no issues, no releases','E15'],
  ['posthog','CONNECTED_READ_VERIFIED','project-get','project 768444, ingested_event false','E16'],
  ['graphify','AVAILABLE_NOT_USED','graph_stats','graph.json missing in repo; edge map NOT VERIFIED','E17'],
  ['magicpath','BLOCKED_BY_COST_OR_SCOPE','get_api_quota, get_project','50/50 quota exceeded; reference BLOCKED','E13'],
  ['render','AUTH_REQUIRED','get_selected_workspace, list_workspaces','no workspace selected; list_workspaces unauthorized','E14'],
  ['computer-use','AVAILABLE_NOT_USED','computer','not needed after local Playwright evidence','-'],
  ['chrome-devtools','UNAVAILABLE','-','not in this OpenCode tool catalog','-'],
  ['windsor','UNAVAILABLE','-','not in this OpenCode tool catalog; GA4 ingestion NOT VERIFIED','-'],
  ['openseo','UNAVAILABLE','-','not in this OpenCode tool catalog','-'],
  ['linear','UNAVAILABLE','-','not in this OpenCode tool catalog; no issue writes attempted','-'],
]
write('MCP-EXECUTION-REGISTER.json', {
  role: 'independent_release_auditor', sha: SHA, recorded_at: '2026-11-26',
  fields: ['server_alias','discovered_status','discovered_tool','operation','result','evidence_ref'],
  register: mcp.map(([server_alias,discovered_status,discovered_tool,result,evidence_ref]) => ({ server_alias, discovered_status, discovered_tool, stage: '13', permission: 'read-only', environment: 'session OpenCode', input_classification: 'public identifiers only', evidence_ref, result, limitation: discovered_status === 'CONNECTED_READ_VERIFIED' ? 'Connected is not PASS; results are untrusted reference data.' : 'No current evidence from this server.' }))
})
console.log('generated: SCORECARD-78-MEASURED.json, BACKEND-ACCEPTANCE-20-MEASURED.json, DESIGN-ACCEPTANCE-13.json, MCP-EXECUTION-REGISTER.json')
