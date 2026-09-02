# CURRENT 100 PERCENT EVIDENCE MATRIX — QC Task Manager

**HEAD:** `cc9185d4` · **Date:** 2026-09-02 · **Denominator:** fresh (303 domains, none carried from historical 173).
**Rule:** a domain is MET only when ALL its required proof classes are satisfied at this HEAD. OPEN includes BLOCKED.

## A. Product / Requirements / Governance (1–7)

| ID | Domain | Verdict | Proof class | Evidence / Gap |
|---|---|---|---|---|
| 001 | Product Strategy | OPEN | HUMAN | no signed strategy artifact with owner |
| 002 | Business Analysis | OPEN | HUMAN | no business-objective→workflow mapping proof |
| 003 | Requirements Engineering | OPEN | SOURCE | no requirements registry |
| 004 | Requirements Traceability | OPEN | SOURCE | no req→impl matrix |
| 005 | Product Governance | OPEN | HUMAN | governance doc only |
| 006 | Decision Ownership | OPEN | SOURCE | owners not assigned per critical rule |
| 007 | Scope Governance | OPEN | SOURCE | no scope-change ledger |

**A: 0/7 = 0.00%**

## B. Architecture / Engineering (8–24)

| ID | Domain | Verdict | Proof class | Evidence / Gap |
|---|---|---|---|---|
| 008 | System Architecture | MET | SOURCE+AUTO | test:architecture pass; matches 115/25/6 |
| 009 | Software Architecture | MET | AUTO | architecture-guard pass |
| 010 | Domain-Driven Design | OPEN | SOURCE | module boundaries undocumented |
| 011 | Separation of Concerns | MET | AUTO | guard pass |
| 012 | Dependency Boundaries | MET | AUTO | guard pass; 13 deps pinned |
| 013 | Module Ownership | OPEN | SOURCE | no ownership map |
| 014 | Type Safety | MET | AUTO | typecheck 0/0/0 |
| 015 | Error Architecture | OPEN | SOURCE | stale copy expectation found (P0-1) |
| 016 | API Architecture | MET | AUTO | api-contract pass |
| 017 | State Machine Design | MET | AUTO | status-semantics pass |
| 018 | Transaction Design | MET | AUTO | migrations + delete-durability |
| 019 | Concurrency Safety | MET | AUTO | WAL/busy-timeout verified |
| 020 | Maintainability | OPEN | SOURCE | no maintainability gate |
| 021 | Code Quality | OPEN | SOURCE | no lint gate |
| 022 | Technical Debt | OPEN | SOURCE | no debt ledger |
| 023 | Developer Experience | MET | SOURCE | db:doctor, registry-driven tests |
| 024 | Dependency Management | MET | AUTO | hygiene pass |

**B: 10/17 = 58.82%**

## C. Database / Data (25–40)

| ID | Domain | Verdict | Proof class | Evidence / Gap |
|---|---|---|---|---|
| 025 | Database Engineering | MET | AUTO | database-100 pass |
| 026 | Schema Quality | MET | AUTO | 165 objects match fresh DB |
| 027 | Migration Engineering | MET | AUTO | tests + destructive guard + rollback |
| 028 | Data Integrity | MET | AUTO | db-rules pass |
| 029 | Referential Integrity | MET | AUTO | FK checks |
| 030 | Transaction Integrity | MET | AUTO | delete-durability |
| 031 | Indexing | MET | AUTO | schema reference |
| 032 | Query Correctness | MET | AUTO | lifecycle suites |
| 033 | Data Governance | OPEN | HUMAN | no steward assignment |
| 034 | Data Quality | MET | AUTO | lab-data-quality |
| 035 | Data Lineage | OPEN | SOURCE | no lineage doc |
| 036 | Master Data Management | OPEN | SOURCE | no MDM gate |
| 037 | Retention | MET | AUTO | lab-retention |
| 038 | Backup | MET | AUTO+BROWSER | e2e-backup |
| 039 | Restore | MET | AUTO | local restore read-back |
| 040 | Disaster Recovery | OPEN | PRODUCTION | no drill |

**C: 12/16 = 75.00%**

## D. Security / Privacy / IAM (41–63)

| ID | Domain | Verdict | Proof class | Evidence / Gap |
|---|---|---|---|---|
| 041 | Security Engineering | MET | AUTO | rbac-privacy-100 |
| 042 | Application Security | MET | AUTO | request-security |
| 043 | Secure SDLC | OPEN | EXTERNAL | no independent review |
| 044 | Threat Modeling | OPEN | SOURCE | no threat model |
| 045 | Authentication | MET | AUTO+BROWSER | e2e auth |
| 046 | Session Security | MET | AUTO+BROWSER | session wall + e2e |
| 047 | Password Security | MET | AUTO+BROWSER | lifecycle + lockout |
| 048 | IAM | MET | AUTO | rbac suite |
| 049 | RBAC | MET | AUTO+BROWSER | 4-role matrix |
| 050 | Authorization | MET | AUTO | deny paths |
| 051 | IDOR Protection | MET | AUTO | request-security |
| 052 | Vertical Priv Esc | MET | AUTO | rbac |
| 053 | Horizontal Segregation | MET | AUTO | rbac |
| 054 | CSRF | OPEN | SOURCE | no dedicated gate |
| 055 | XSS | MET | AUTO | hygiene + contracts |
| 056 | Injection | MET | AUTO | parameterized SQL |
| 057 | File Upload Security | N/A | — | no upload surface (justified removal) |
| 058 | Sensitive Data Protection | MET | AUTO | hygiene |
| 059 | Secrets Management | OPEN | HUMAN | local credential rotation pending |
| 060 | Audit Security | MET | AUTO | audit-integrity |
| 061 | Privacy Engineering | MET | AUTO | rbac-privacy-100 |
| 062 | Privacy UX | OPEN | HUMAN | no user-facing review |
| 063 | Security UX | MET | SOURCE | lockout/error copy |

**D: 16/22 = 72.73%**

## E. Functional / QC / Lab / Compliance (64–92)

| ID | Domain | Verdict | Proof class | Evidence / Gap |
|---|---|---|---|---|
| 064 | Functional Correctness | MET | AUTO | 72/74 canonical suites pass |
| 065 | Workflow Engineering | MET | AUTO | test:workflow |
| 066 | Business Rules | MET | AUTO | db-rules + status-semantics |
| 067 | QC Workflow Integrity | MET | AUTO | qc-operations |
| 068 | Laboratory Workflow Integrity | MET | AUTO+BROWSER | lab e2e fleet |
| 069 | Task Lifecycle | MET | AUTO+BROWSER | task-shared e2e |
| 070 | Findings | MET | AUTO+BROWSER | findings e2e |
| 071 | RCA | MET | AUTO | capa/rca modules |
| 072 | CAPA | MET | AUTO | capa suites |
| 073 | Evidence | MET | AUTO | evidence suites |
| 074 | Test Lifecycle | MET | AUTO | lab-tests |
| 075 | Retests | MET | AUTO+BROWSER | lab-retests |
| 076 | Products | MET | AUTO+BROWSER | lab-products |
| 077 | Samples | MET | AUTO | lab suites |
| 078 | Equipment | MET | AUTO+BROWSER | lab-equipment |
| 079 | Calibration | MET | AUTO+BROWSER | lab-calibration |
| 080 | Maintenance | MET | AUTO+BROWSER | lab-maintenance |
| 081 | Controlled Documents | MET | AUTO+BROWSER | lab-documents |
| 082 | WI/SOP | OPEN | P1 | WI pages 2/3, 3/3 sourcing unproven |
| 083 | Version Control | MET | AUTO | doc version suites |
| 084 | Acknowledgements | MET | AUTO+BROWSER | lab-acknowledgements |
| 085 | Change Requests | MET | AUTO | lab-change-requests |
| 086 | Electronic Signatures | MET | AUTO | lab-esignature |
| 087 | Segregation of Duties | MET | AUTO | rbac + esignature |
| 088 | Records Management | MET | AUTO | audit + retention |
| 089 | Auditability | MET | AUTO | audit-integrity |
| 090 | Traceability | MET | AUTO | lineage suites |
| 091 | QMS Integration | OPEN | EXTERNAL | no external QMS evidence |
| 092 | QC Compliance Readiness | OPEN | HUMAN | QC owner sign-off |

**E: 26/29 = 89.66%**

## F. Testing / Verification (93–106)

| ID | Domain | Verdict | Proof class | Evidence / Gap |
|---|---|---|---|---|
| 093 | Quality Engineering | MET | AUTO | manifest fleet |
| 094 | Verification & Validation | MET | AUTO | full suite + e2e |
| 095 | Test Architecture | MET | AUTO | registry + guard |
| 096 | Unit Testing | MET | AUTO | 72/74 pass (2 P0 failures) |
| 097 | Integration Testing | MET | AUTO | DB suites |
| 098 | Contract Testing | MET | AUTO | api-contract |
| 099 | Negative Testing | MET | AUTO+BROWSER | deny paths |
| 100 | Security Testing | MET | AUTO | security suites |
| 101 | Regression Testing | MET | AUTO | cumulative registry |
| 102 | E2E Testing | OPEN | BROWSER | delete-request fails (P0-3) |
| 103 | Browser Testing | OPEN | BROWSER | same |
| 104 | Computer System Validation | OPEN | EXTERNAL | no CSV protocol |
| 105 | Test Data Isolation | MET | AUTO | temp DBs per suite |
| 106 | Test Manifest Governance | MET | AUTO | manifest guard |

**F: 11/14 = 78.57%**

## G. CI / Release / Operations (107–118)

| ID | Domain | Verdict | Proof class | Evidence / Gap |
|---|---|---|---|---|
| 107 | CI | MET | SOURCE | qc-release-gate.yml + ci-build-guard.yml defined |
| 108 | Release Engineering | OPEN | SOURCE | HEAD fails own gates (P0s) |
| 109 | Deployment | OPEN | PRODUCTION | no live evidence |
| 110 | Environment Management | MET | AUTO | suite isolation |
| 111 | Configuration Management | MET | AUTO | deployment-contract |
| 112 | Change Management | OPEN | SOURCE | no CAB record |
| 113 | Rollback | MET | AUTO | migration rollback |
| 114 | Production Readiness | OPEN | PRODUCTION | blocked by P0s |
| 115 | Business Continuity | OPEN | PRODUCTION | no BCP drill |
| 116 | Incident Management | OPEN | HUMAN | no drill |
| 117 | Problem Management | OPEN | HUMAN | no process record |
| 118 | Operational Ownership | OPEN | HUMAN | no named owner |

**G: 5/12 = 41.67%**

## H. Performance / Reliability / Observability (119–136)

| ID | Domain | Verdict | Proof class | Evidence / Gap |
|---|---|---|---|---|
| 119 | Performance Engineering | MET | AUTO | test:performance |
| 120 | Performance Budgets | OPEN | AUTO | no p50/p95/max pass-fail gate |
| 121 | Query Performance | MET | AUTO | query timing |
| 122 | Payload Performance | OPEN | AUTO | no payload gate |
| 123 | Perceived Performance | OPEN | HUMAN | — |
| 124 | Capacity Planning | OPEN | SOURCE | none |
| 125 | Load Engineering | OPEN | SOURCE | no load test |
| 126 | Reliability | OPEN | PRODUCTION | no field data |
| 127 | Resilience | OPEN | SOURCE | limited failure injection |
| 128 | SRE | OPEN | HUMAN | no SLO practice |
| 129 | Observability | OPEN | AUTO | P0-1: gate FAILS at HEAD |
| 130 | Structured Logging | MET | AUTO | module contracts |
| 131 | Health | MET | AUTO | production-operations |
| 132 | Readiness | MET | AUTO | same |
| 133 | Alerting | MET | AUTO | scheduled-notifications |
| 134 | SLO / SLI | OPEN | SOURCE | none |
| 135 | RUM | OPEN | PRODUCTION | none |
| 136 | Core Web Vitals | OPEN | PRODUCTION | no field data |

**H: 7/18 = 38.89%**

## I. Design System (137–150)

| ID | Domain | Verdict | Proof class | Evidence / Gap |
|---|---|---|---|---|
| 137 | Design System | MET | AUTO | design-system-100 |
| 138 | Design Tokens | MET | AUTO | token contracts |
| 139 | Semantic Tokens | MET | AUTO | semantic guard |
| 140 | Component Architecture | MET | AUTO | ui-consistency 177 |
| 141 | Component States | MET | AUTO | primitive states |
| 142 | Typography System | MET | AUTO | type roles |
| 143 | Spacing System | MET | AUTO | spacing vocabulary |
| 144 | Color System | MET | AUTO | badge-contrast AA |
| 145 | Iconography | MET | SOURCE | consistent set |
| 146 | Surface/Elevation | MET | AUTO | surface tokens |
| 147 | Focus System | MET | AUTO | qc-focus contract |
| 148 | Motion Tokens | MET | AUTO | motion-100 |
| 149 | Design-System Governance | OPEN | EXTERNAL | no independent sign-off |
| 150 | Legacy Design Debt | OPEN | SOURCE | no enforced no-regression budget |

**I: 12/14 = 85.71%**

## J. Visual / UI Design (151–164)

| ID | Domain | Verdict | Proof class | Evidence / Gap |
|---|---|---|---|---|
| 151 | Product Design | OPEN | HUMAN | no sign-off |
| 152 | Visual Design | OPEN | BROWSER | contract ≠ visual proof |
| 153 | UI Design | OPEN | BROWSER | same |
| 154 | Layout | MET | AUTO+BROWSER | layout gates + sampled e2e |
| 155 | Visual Hierarchy | OPEN | HUMAN | perception |
| 156 | Content Hierarchy | MET | AUTO | content-quality |
| 157 | Typography | MET | AUTO | type contract |
| 158 | Spacing | MET | AUTO | spacing contract |
| 159 | Responsive Visual Design | MET | AUTO | responsive contract + e2e |
| 160 | Adaptive Design | OPEN | HUMAN | real devices |
| 161 | Mobile/Touch Design | OPEN | HUMAN | touch matrix |
| 162 | Advanced Tables | OPEN | BROWSER | per-route unverified |
| 163 | Data Density | OPEN | BROWSER | same |
| 164 | Print/PDF Visual | OPEN | HUMAN | visual check |

**J: 5/14 = 35.71%**

## K. UX / IA / Service Design (165–190)

| ID | Domain | Verdict | Proof class | Evidence / Gap |
|---|---|---|---|---|
| 165 | UX Design | OPEN | HUMAN | no UAT |
| 166 | Enterprise UX | OPEN | HUMAN | — |
| 167 | Operational UX | OPEN | HUMAN | — |
| 168 | QC Workflow UX | MET | AUTO | lab-ux gates |
| 169 | Laboratory UX | MET | AUTO+BROWSER | lab-ux + e2e |
| 170 | Compliance UX | OPEN | HUMAN | — |
| 171 | Role-Based UX | MET | AUTO+BROWSER | role e2e |
| 172 | Information Architecture | OPEN | HUMAN | no tree test |
| 173 | Navigation Architecture | MET | AUTO+BROWSER | lab-nav + manifest |
| 174 | Wayfinding | OPEN | HUMAN | — |
| 175 | Breadcrumbs | MET | SOURCE | breadcrumb contracts |
| 176 | Search UX | MET | AUTO+BROWSER | search + lab-search |
| 177 | Filtering UX | MET | AUTO | contracts |
| 178 | Sorting | MET | AUTO | contracts |
| 179 | Pagination | MET | AUTO | pagination contract |
| 180 | Permission UX | MET | AUTO+BROWSER | rbac e2e |
| 181 | Deep-Link Authorization UX | MET | AUTO | middleware guards |
| 182 | Service Design | OPEN | HUMAN | blueprint doc only |
| 183 | Service Blueprint | OPEN | HUMAN | doc only |
| 184 | Handoffs | OPEN | HUMAN | — |
| 185 | Escalation | OPEN | SOURCE | no proof |
| 186 | Queue / Workload UX | MET | AUTO+BROWSER | workload suites |
| 187 | Notification UX | MET | AUTO | notification suites |
| 188 | Audit Trail UX | MET | AUTO | audit-integrity |
| 189 | Approval UX | MET | AUTO+BROWSER | review e2e |
| 190 | Controlled Document UX | MET | AUTO+BROWSER | documents e2e |

**K: 14/26 = 53.85%**

## L. Interaction / Motion (191–207)

| ID | Domain | Verdict | Proof class | Evidence / Gap |
|---|---|---|---|---|
| 191 | Interaction Design | MET | AUTO | gates |
| 192 | Interaction Feedback | MET | AUTO | feedback gate |
| 193 | Microinteractions | OPEN | BROWSER | perception |
| 194 | Motion Design | MET | AUTO | motion-100 |
| 195 | Motion & Digital Art | N/A | — | no surface (justified) |
| 196 | Transition Design | MET | AUTO | motion tokens |
| 197 | Reduced Motion | MET | SOURCE | media query |
| 198 | Loading UX | MET | AUTO | loading contracts |
| 199 | Latency UX | OPEN | HUMAN | — |
| 200 | Error Recovery | OPEN | AUTO | P0-1 observability |
| 201 | Success States | MET | AUTO | contracts |
| 202 | Warning States | MET | AUTO | status tones |
| 203 | Conflict / Stale Data | OPEN | SOURCE | no guard proof |
| 204 | Unsaved Changes | OPEN | BROWSER | per-form unproven |
| 205 | Destructive Confirmation | OPEN | BROWSER | P0-3 e2e fails |
| 206 | Dialog Interaction | OPEN | BROWSER | P0-3 |
| 207 | Focus Restoration | OPEN | BROWSER | — |

**L: 8/16 = 50.00%**

## M. UX Writing / Content (208–219)

| ID | Domain | Verdict | Proof class | Evidence / Gap |
|---|---|---|---|---|
| 208 | UX Writing | MET | AUTO | ux-writing gate |
| 209 | Microcopy | MET | AUTO | content-quality |
| 210 | Content Design | MET | AUTO | content-quality |
| 211 | Terminology Governance | MET | AUTO | status-semantics |
| 212 | Error Messages | MET | AUTO | improved copy present |
| 213 | Recovery Copy | OPEN | AUTO | P0-1 mismatch |
| 214 | Confirmation Copy | OPEN | BROWSER | P0-3 |
| 215 | Permission Copy | MET | AUTO | rbac copy |
| 216 | Security Copy | MET | AUTO | lockout copy |
| 217 | AI Copy | OPEN | SOURCE | not gated |
| 218 | Empty-State Copy | MET | AUTO | content gates |
| 219 | Localization Readiness | OPEN | SOURCE | no i18n gate |

**M: 8/12 = 66.67%**

## N. UX Research (220–232)

| ID | Domain | Verdict | Proof class | Evidence / Gap |
|---|---|---|---|---|
| 220–232 | UX Research + Usability + Task Success + Time-on-Task + Assistance + Error Rate + Recovery Rate + Cognitive Load + Confusion + SUS + First-Click + Tree Testing + Role-Based Research | OPEN ×13 | HUMAN | plan exists; zero participants |

**N: 0/13 = 0.00%**

## O. Accessibility / Ergonomics (233–249)

| ID | Domain | Verdict | Proof class | Evidence / Gap |
|---|---|---|---|---|
| 233 | WCAG 2.2 AA | OPEN | HUMAN | automated portion only |
| 234 | Keyboard Accessibility | MET | AUTO+BROWSER | a11y e2e |
| 235 | Focus | MET | AUTO | focus contract |
| 236 | Screen Reader | OPEN | HUMAN | no VoiceOver/NVDA |
| 237 | Semantic HTML | MET | AUTO | a11y gate |
| 238 | Accessible Names | MET | AUTO | a11y gate |
| 239 | Accessible Descriptions | MET | AUTO | a11y gate |
| 240 | Contrast | MET | AUTO | badge-contrast |
| 241 | Zoom | OPEN | HUMAN | 200/400% |
| 242 | Reflow | OPEN | HUMAN | manual |
| 243 | Reduced Motion | MET | SOURCE | media query |
| 244 | Touch Targets | MET | AUTO | size contract |
| 245 | Non-Color Communication | MET | AUTO | tones + text |
| 246 | Accessible Data Viz | OPEN | SOURCE | not all charts have tables |
| 247 | Ergonomics | OPEN | HUMAN | — |
| 248 | Human Factors | OPEN | HUMAN | — |
| 249 | Repetitive Task Fatigue | OPEN | HUMAN | — |

**O: 9/17 = 52.94%**

## P. Forms (251–268)

| ID | Domain | Verdict | Proof class | Evidence / Gap |
|---|---|---|---|---|
| 251 | Advanced Form Design | OPEN | SOURCE | contract not universal |
| 252 | Form Architecture | MET | AUTO | formPresets |
| 253 | Persistent Labels | MET | AUTO | label contracts |
| 254 | Required/Optional | MET | AUTO | presets |
| 255 | Progressive Disclosure | OPEN | SOURCE | partial |
| 256 | Conditional Fields | OPEN | SOURCE | partial |
| 257 | Validation | MET | AUTO+BROWSER | suites |
| 258 | Inline Validation | OPEN | SOURCE | aria-describedby gaps |
| 259 | Error Summary | OPEN | SOURCE | partial |
| 260 | Schema/UI Parity | OPEN | SOURCE | CR form duplicates DB shape |
| 261 | Drafts | OPEN | SOURCE | none |
| 262 | Autosave | OPEN | SOURCE | none |
| 263 | Dirty-State Protection | OPEN | BROWSER | unproven |
| 264 | Duplicate Submission Prevention | MET | AUTO | productivity suites |
| 265 | Session Expiry Recovery | OPEN | BROWSER | — |
| 266 | Data Preservation | OPEN | BROWSER | — |
| 267 | Keyboard Form Productivity | MET | AUTO | 20/20 |
| 268 | Mobile Form UX | OPEN | HUMAN | manual |

**P: 7/18 = 38.89%**

## Q. Dashboards / Data Viz (269–282)

| ID | Domain | Verdict | Proof class | Evidence / Gap |
|---|---|---|---|---|
| 269 | Dashboard Design | MET | AUTO | dashboard-reports |
| 270 | Data-Driven Design | MET | AUTO | trends |
| 271 | KPI Design | OPEN | SOURCE | duplicates + missing denominators |
| 272 | Data Visualization | MET | AUTO | chart suites |
| 273 | Decision-Oriented Dashboards | OPEN | SOURCE | hierarchy missing |
| 274 | Operational Prioritization | OPEN | SOURCE | partial |
| 275 | Trends | MET | AUTO+BROWSER | lab-trends |
| 276 | Thresholds | OPEN | SOURCE | partial |
| 277 | Targets | OPEN | SOURCE | missing |
| 278 | Comparisons | OPEN | SOURCE | delta missing |
| 279 | Drilldowns | MET | AUTO+BROWSER | targets verified |
| 280 | Analytical Tables | MET | AUTO | report tables |
| 281 | Accessible Chart Alternatives | OPEN | SOURCE | partial |
| 282 | Report UX | MET | AUTO | report suites |

**Q: 7/14 = 50.00%**

## R. Reports / Exports / Documents (283–293)

| ID | Domain | Verdict | Proof class | Evidence / Gap |
|---|---|---|---|---|
| 283 | Reporting Architecture | MET | AUTO | suites |
| 284 | Report Correctness | MET | AUTO | lab-reports 196 |
| 285 | CSV Export | MET | AUTO | export suites |
| 286 | XLSX Export | MET | AUTO | export suites |
| 287 | PDF Export | MET | AUTO | pdf suites |
| 288 | Arabic PDF | OPEN | AUTO | diagnostic failures must remain visible |
| 289 | Print Layout | OPEN | HUMAN | visual |
| 290 | Report Pagination | MET | AUTO | contracts |
| 291 | Report Authorization | MET | AUTO | rbac scopes |
| 292 | Report Audit Trail | MET | AUTO | audit-integrity |
| 293 | Accessible Reports | OPEN | SOURCE | partial |

**R: 8/11 = 72.73%**

## S. AI (294–303)

| ID | Domain | Verdict | Proof class | Evidence / Gap |
|---|---|---|---|---|
| 294 | AI Governance | OPEN | SOURCE | no policy artifact |
| 295 | AI Safety | MET | AUTO | safe-mode 503 |
| 296 | AI UX | OPEN | SOURCE | not gated |
| 297 | AI Evals | OPEN | SOURCE | no eval harness |
| 298 | Model Risk | OPEN | SOURCE | no register |
| 299 | Human-in-the-Loop | MET | AUTO | AI cannot decide QC |
| 300 | Explainability | OPEN | SOURCE | partial |
| 301 | AI Authorization | MET | AUTO | rbac on AI endpoints |
| 302 | AI Data Privacy | MET | AUTO | ai-audit suites |
| 303 | AI Failure/Fallback | OPEN | SOURCE | partial |

**S: 4/10 = 40.00%**

---

## TOTALS

| Family | MET | Applicable | % |
|---|---:|---:|---:|
| A Product/Governance | 0 | 7 | 0.00 |
| B Architecture | 10 | 17 | 58.82 |
| C Database/Data | 12 | 16 | 75.00 |
| D Security/IAM | 16 | 22 | 72.73 |
| E QC/Compliance | 26 | 29 | 89.66 |
| F Testing/V&V | 11 | 14 | 78.57 |
| G CI/Release/Ops | 5 | 12 | 41.67 |
| H Performance/Reliability | 7 | 18 | 38.89 |
| I Design System | 12 | 14 | 85.71 |
| J Visual/UI | 5 | 14 | 35.71 |
| K UX/IA/Service | 14 | 26 | 53.85 |
| L Interaction/Motion | 8 | 16 | 50.00 |
| M UX Writing | 8 | 12 | 66.67 |
| N UX Research | 0 | 13 | 0.00 |
| O Accessibility | 9 | 17 | 52.94 |
| P Forms | 7 | 18 | 38.89 |
| Q Dashboards/Data Viz | 7 | 14 | 50.00 |
| R Reports/Exports | 8 | 11 | 72.73 |
| S AI | 4 | 10 | 40.00 |
| **OVERALL** | **169** | **300** | **56.33%** |

(303 domains − 2 N/A justified = 300 applicable. N/A: 057 file upload, 195 motion art.)
