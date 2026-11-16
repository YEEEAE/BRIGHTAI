# Synthetic Risk Studio — 2026-11-16

Status: DONE locally; not deployed. Existing unrelated working-tree changes preserved.

- RiskWorkspace demo mode reuses the existing product entry component; authenticated workspace and operational calculation policy stay separate.
- Two fictional assets, context, likelihood/impact, keyboard matrix, treatment and applicable control; synchronous calculation and explanations.
- Initial / Residual / Accepted have explicit text. Any input change invalidates simulated acceptance; review/avoid disable acceptance. No institution risk acceptance or API writes.
- Teaching method synthetic-risk-demo-v1: same 3×3 draft score bands as existing workspace, with explicitly fictional control effects. Not ISO/NIST/regulatory thresholds or measured effectiveness.
- Local JSON export marked Synthetic includes inputs, owner, reviewer, review trigger, assumptions, method, reasons and operationalAcceptance=false.

## Evidence
- node --test tests/risk-demo.test.mjs: 5 PASS, including full valid input combination bounds, invalid input, context floor, control scope and avoid/review.
- npm run build: PASS, 57 public pages. Prerender request.headers warnings remain.
- Browser: /products/risk-engine/ and /demo/risk-engine/ at measured innerWidth=390, scrollWidth=390; product demo descendants overflow=0.
- Browser: privacy initial9 → human review residual6; acceptance text6; changing asset → initial2 and acceptance invalidated. Matrix Enter → score6. Inapplicable redaction leaves content score unchanged with reason. Review disables acceptance. Public context floor observed. Export click confirms local Synthetic generation; downloaded file contents were not independently inspected.
- Browser first pass found matrix residual marker/output selector collision; fixed and retested before final build.
- Browser nominal viewport differs from actual CSS pixels due host scaling; adjusted override and verified actual DOM width390. Also observed no overflow at actual278.
- No real auth/database/provider/deployment verification; not a production readiness claim.
