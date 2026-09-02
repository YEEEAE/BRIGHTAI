# PROMPT E3 — PRODUCTION RUM & SYNTHETIC LOAD TESTING RUNBOOK

TASK ID:
QC-RUNBOOK-E03

TYPE:
Production Telemetry & Load Stress Protocol

PRIMARY ACTORS:
Performance Engineer, SRE.

DEPENDS ON:
GATE C, PROMPT-E1.

SOURCE FINDINGS:
- Domains 29 (Performance Engineering), 84 (Capacity Planning).

MISSION:
Execute synthetic concurrent load testing against staging environment (50 concurrent virtual users simulating heavy lab shifts), establish baseline production latency distributions (p50, p95, p99), verify zero connection drops, and validate Real User Monitoring (RUM) data capture across Saudi mobile network latencies (STC / Mobily 5G).

PROCEDURE:
1. Synthetic Load Execution:
   - Run 50 concurrent virtual users performing: Login -> Search -> View Task -> Submit Test Result -> View Dashboard for 15 minutes.
2. Metric Collection:
   - Record p95 and p99 response times.
   - Monitor CPU and memory usage of Node.js process and SQLite WAL file growth.
3. Network Throttling Test:
   - Simulate 3G / 4G high latency (200ms RTT) and verify application resilience.

ACCEPTANCE CRITERIA:
- AC-01: Sustained 50 concurrent users with 0 failed requests (HTTP 5xx = 0).
- AC-02: p95 response time remains < 250ms under peak load.
- AC-03: Node process memory remains stable with zero memory leaks.
- AC-04: Performance & Load report archived at `audit/qc/QC-Task-Manager/Remediation/Evidence/PROMPT-E3-LOAD-EVIDENCE.md`.
