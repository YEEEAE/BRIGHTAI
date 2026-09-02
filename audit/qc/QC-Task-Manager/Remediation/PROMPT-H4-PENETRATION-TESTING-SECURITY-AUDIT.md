# PROMPT H4 — INDEPENDENT PENETRATION TESTING & SECURITY AUDIT

TASK ID:
QC-RUNBOOK-H04

TYPE:
Third-Party Security Assurance Protocol

PRIMARY ACTORS:
Independent CREST / OSCP Certified Penetration Testing Firm.

DEPENDS ON:
GATE C.

SOURCE FINDINGS:
- P2-4: Absence of formal external penetration test report.
- Domains 3, 6, 21, 79, 81.

MISSION:
Conduct an independent gray-box penetration test against the deployed QC Task Manager application covering OWASP Top 10, ASVS Level 2, authentication bypass, authorization tampering (IDOR), SQL injection, session hijacking, and CSRF vulnerabilities.

PROCEDURE:
1. Threat Modeling & Scope Definition.
2. Automated Vulnerability Scanning (Burp Suite Pro / OWASP ZAP).
3. Manual Exploit Testing:
   - Horizontal & vertical privilege escalation.
   - Manipulating task IDs to view other departments' restricted findings.
   - Parameter tampering on electronic signature endpoints.
   - Denial-of-service stress testing on search and report endpoints.
4. Remediation Verification & Re-testing.

ACCEPTANCE CRITERIA:
- AC-01: Independent penetration test completed and formal report delivered.
- AC-02: Zero Critical (P0) or High (P1) vulnerabilities remaining.
- AC-03: Any discovered Medium/Low issues remediated and re-tested.
- AC-04: Security attestation letter archived at `audit/qc/QC-Task-Manager/Remediation/Evidence/PROMPT-H4-PENTEST-EVIDENCE.md`.
