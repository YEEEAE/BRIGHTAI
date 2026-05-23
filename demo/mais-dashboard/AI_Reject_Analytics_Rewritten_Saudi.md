# AI Reject Analytics & Management Dashboard: Concept Brief

**Prepared By:** Yazeed — QC Compliance Officer  
**Prepared For:** Factory Director & Executive Board of Mais for Medical Products  
**Date:** May 23, 2026  
**Subject:** AI Reject Analytics & Management Dashboard Integration  

---

## 1. Introduction: The Strategic Vision (رؤية المشروع الاستراتيجية)
At Mais for Medical Products, our core operational mission is to maintain absolute manufacturing excellence, GMP compliance, and uncompromised cost controls. To support these objectives, we are proposing an upgrade to our Rejected Material Handling and physical destruction procedures inside **Focus ERP**, backed by a secure **AI Reject Analytics Dashboard**.

This document explains the core concept of the AI Reject Dashboard, outlining how it protects our corporate cash flow, secures our data privacy, guarantees 100% SFDA audit readiness, and supports our steering committees in making proactive, data-driven decisions.

---

## 2. Why the Dashboard is Needed (لماذا نحتاج لوحة التحليلات؟)
Currently, our rejected stock transactional data resides inside Focus ERP (M.Prod Rejected Stock module). However, because these transaction records are scattered across different views, it is highly challenging for executive management and quality leads to get a unified, real-time understanding of reject costs, backlog delays, and repeat quality failures.

The AI Reject Analytics Dashboard solves this by providing a unified, visual, and intelligent management console. It aggregates data, trends costs, and utilizes advanced artificial intelligence (Gemini API) to automatically group messy operational logs into logical root cause categories, saving hours of manual Excel spreadsheets and giving management immediate visibility.

---

## 3. Focus ERP remains the Official Source of Truth (نظام فوكس هو المصدر الرسمي والوحيد)
In strict compliance with pharmaceutical and medical device manufacturing regulations, **Focus ERP remains the sole, official system of record**. 
* The external AI Reject Dashboard is entirely **Read-Only**.
* The dashboard cannot create, edit, approve, or delete any inventory records inside Focus ERP.
* The dashboard possesses zero transactional capabilities.
* All official electronic approvals, stock locks, financial clearances, and physical destruction permits must be manually authorized and executed directly within Focus ERP by qualified human managers.

---

## 4. How the Gemini API Supports Advisory-Only Analysis (دور الذكاء الاصطناعي الاستشاري)
The integration of the Gemini API is restricted to high-value, advisory-only analytical functions. The AI engine is used to:
1. **Root Cause Clustering:** Group raw, unorganized textual reject descriptions (entered by operators in different departments) into standardized root causes (e.g., supplier packaging defects, machinery thermal fluctuations, or raw material impurities).
2. **Predictive CAPA Advice:** Evaluate repeating defect patterns and suggest targeted Corrective and Preventive Actions (CAPA) for QA review.
3. **Executive Summarization:** Generate instant, boardroom-ready Arabic summaries of weekly losses and active quality risks.
4. **Advisory Risk Scoring:** Calculate a dynamic risk score from 0 to 100 for each reject case based on cost, quantity, life years, and days pending in queue, helping management prioritize their reviews.

*Under GMP, the AI cannot initiate workflows or replace human judgment. All AI outputs are treated as consultative suggestions subject to human validation.*

---

## 5. Security & Cyber-Safety Model (نموذج الحماية والأمن السيبراني)
To protect Mais for Medical Products' intellectual property and comply with Saudi Arabian Personal Data Protection Laws (PDPL):
* **Data Minimization:** No personal data of employees or sensitive supplier costing details are sent to the Gemini API. Employee names are completely stripped or anonymized by the secure backend middleware.
* **Backend Enclave Routing:** The Gemini API is never called directly from the client-side browser or HTML code. All requests route through our secure corporate middleware server.
* **API Key Protection:** The Gemini API key is encrypted and stored exclusively in the secure backend environment configuration (`.env`), completely shielded from internet-facing assets.

---

## 6. Practical Operational Example (مثال تشغيلي واقعي)

### Case Study: Face Shield Sponge Tape Reject
* **Event:** Production detects a discoloration in a bulk batch of face shield sponge tapes and logs it in Focus ERP.
* **Data Parameters:** Quantity: 355,908 units | Cost: 355,908 SAR.
* **Focus ERP Control:** The system instantly locks the batch in "Quarantine Hold" location, blocking any consumption or transfer.
* **AI Analysis:** The AI Reject Dashboard reads this transaction. Because the cost is massive (> 100,000 SAR) and the quantity is high, the model calculates a **High Risk Score of 56.5 out of 100**, pushing the transaction to the top of the management review queue.
* **Advisory Insight:** The AI flags a "High-Value Alert" to Finance, advising that since the sponge tape is an imported raw material, Finance should hold the physical destruction permit until a credit claim is officially lodged with the supplier. This single advisory action secures 355,908 SAR in recoverable losses!

---

## 7. Concluding Recommendation (التوصية التنفيذية النهائية)
The AI Reject Analytics & Management Dashboard represents a modern, low-risk, and highly profitable upgrade. It leverages our existing Focus ERP investment to eliminate quality blind spots, protect corporate cash flow, and ensure 100% SFDA/ISO audit readiness.

**Approval is requested to proceed with the Focus ERP workflow configuration, pilot testing, and secure AI dashboard prototype development.**
