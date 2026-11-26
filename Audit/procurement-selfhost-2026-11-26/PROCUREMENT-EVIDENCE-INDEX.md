# أدلة المشتريات

| # | السؤال | الدليل | الحالة | الفجوة |
|---|---|---|---|---|
| 1 | أين تستضاف؟ | `render.yaml` | PARTIAL | Blueprint فقط؛ لا إثبات نشر حالي. |
| 2 | إصدار التشغيل؟ | `package.json` | VERIFIED_SOURCE | 22.23.5/10.9.7/Astro 7.4.13؛ سجل Render استخدم 22.22.2 سابقًا. |
| 3 | on-prem؟ | `AIR-GAP-BOUNDARY.md` | BLOCKED | لا مُثبّت ولا صورة ولا Helm. |
| 4 | air-gap؟ | `AIR-GAP-BOUNDARY.md`, `.env.example` | BLOCKED | readiness بعيد + Groq خارجي. |
| 5 | الأسرار؟ | `.env.example`, `docs/DATA-PRIVACY-AND-SECURITY.md` | PARTIAL | أسماء فقط؛ التدوير من المالك. |
| 6 | egress؟ | `render.yaml`, `docs/DATA-PRIVACY-AND-SECURITY.md` | PARTIAL | بوابة JWKS + Groq؛ لا فحص منع صادر. |
| 7 | النسخ؟ | `docs/NEON-BRANCH-PROTECTION-RUNBOOK.md` | NOT RUN | PLAN ONLY — NOT EXECUTED. |
| 8 | الاستعادة؟ | نفس المرجع | NOT RUN | لا تدريب ولا مراجع مستقل. |
| 9 | RPO/RTO؟ | `docs/NEON-BRANCH-PROTECTION-RUNBOOK.md` | BLOCKED | لا قيمة معتمدة؛ لقطة 21600s تاريخية. |
| 10 | SBOM؟ | `package-lock.json` | PARTIAL | قفل مثبّت؛ لا SPDX/CycloneDX ولا توقيع. |
| 11 | SSO/MFA؟ | `docs/DATA-PRIVACY-AND-SECURITY.md` | NOT_VERIFIED | ضوابط مصدرية؛ لا إثبات مزود أو تسليم. |
| 12 | الشهادات؟ | `TRUST-CENTER-CARDS.json` | NOT_VERIFIED | لا تقارير تدقيق. |
| 13 | DPA/النقل؟ | `DPA-RETENTION-DRAFT.md` | DRAFT | حقول TBD؛ مراجعة قانونية. |
| 14 | API؟ | `DEVELOPER-WORKBENCH-ENDPOINTS.md` | VERIFIED_SOURCE | مسارات حقيقية؛ لا `/api/governance/evaluate`. |
| 15 | traceability؟ | `deployment-package.manifest.json` | PARTIAL | تجزئات محلية؛ لا توقيع. |

قواعد الإجابة: اكتب "قيد المراجعة/لم يُتحقق" بدل "نعم"؛ لا شهادات أو نسب دون مصدر؛ كل رقم يبقى `TBD` حتى اعتماد المالك؛ لا بيانات مستأجرين أو أسرار في الردود.
