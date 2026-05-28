# AI Reject Analytics & Management Dashboard

## Concept Document — Saudi Corporate Context

### Version 1.0 — Prototype for Mais for Medical Products

---

## 1. The Idea in Simple Terms

A medical products factory receives and produces many materials. Some of these materials or products do not pass the required quality checks. These are called "rejected items." The factory must track these items carefully, understand why they failed, decide what to do with them, and make sure the same problems do not happen again.

Currently, all this information is inside Focus ERP, the factory's main business system. Focus ERP is excellent at recording transactions and managing workflows. But getting a quick, clear overview of all rejected items across different departments is not straightforward. You need to run reports, check different screens, and connect the information manually.

This dashboard changes that. It takes data from Focus ERP (or in this prototype, from an Excel file), applies AI analysis to identify patterns and risks, and presents everything in a clean, professional dashboard that management can understand at a glance.

---

## 2. Why This Dashboard Is Needed

A medical products factory in Saudi Arabia must comply with strict regulations:

- **SFDA** (Saudi Food and Drug Authority) requirements
- **ISO 13485** (Quality Management System for Medical Devices)
- **GMP** (Good Manufacturing Practices)
- **Saudi Vision 2030** quality standards for local manufacturing

When materials or products are rejected, the factory must:
- Document every rejection properly
- Investigate and record the root cause
- Decide whether to rework, return to supplier, downgrade, or destroy
- Obtain the correct approvals from the right people
- Track corrective and preventive actions (CAPA)
- Be ready for regulatory and customer audits

Without a clear dashboard, these tasks become scattered across emails, paper forms, and separate spreadsheet files. Management cannot see the full picture. Decisions get delayed. Small issues become bigger problems. This dashboard brings everything into one clear view — organised, professional, and actionable.

---

## 3. Focus ERP Remains the Source of Truth

This is the most important principle of the entire project:

**Focus ERP is the official system of record. Nothing changes that.**

The dashboard does not replace Focus ERP. It does not write data back to Focus ERP. It does not approve or reject anything. It is a read-only window that helps management see the data more clearly and make better decisions.

Think of it this way:
- Focus ERP is the official bank ledger — every transaction is recorded there, and it is the single source of truth.
- The dashboard is like a financial analyst's report — it reads the ledger, analyses trends, and provides insights.
- The analyst does not change the ledger. The analyst only helps you understand it better.

In the future, when Focus ERP is integrated properly:
- A read-only API or a read-only SQL view will be created.
- The dashboard backend will read from that view.
- The dashboard will never write to Focus ERP.

This principle is non-negotiable. It protects the integrity of Focus ERP and ensures that all formal approvals remain inside the official system.

---

## 4. How AI (Gemini) Supports Analysis

The dashboard uses Google Gemini AI to provide intelligent analysis. But the AI has a specific and limited role:

**What AI does:**
- Reads reject data and produces an executive summary in plain language
- Groups similar root causes together automatically
- Calculates an advisory risk score for each case (0 to 100)
- Suggests corrective and preventive actions (CAPA)
- Identifies high-value financial cases that need finance review
- Flags delayed approvals and destruction backlogs
- Recommends management actions

**What AI does NOT do:**
- Approve or reject any case
- Authorise destruction
- Deduct stock from inventory
- Modify any Focus ERP record
- Make any final or binding decisions

**Every AI output is clearly marked as "advisory" and "requires QCM/QAM review."**

The AI is a helper, not a decision-maker. The QCM (Quality Control Manager) and QAM (Quality Assurance Manager) remain fully responsible for all quality decisions.

---

## 5. How the Dashboard Helps Each Role

### For the Factory Director

You open the Executive View and within 30 seconds you know exactly:
- How many reject cases are active right now
- What the total financial impact is
- Which department has the most problems
- Which cases have been waiting too long for a decision
- What actions the AI recommends

You do not need to ask five different people for updates. The dashboard gives you the information you need in one place.

### For the QCM / QAM

You open the Quality & CAPA View and see:
- Which root causes are repeating and need systemic fixes
- What CAPA suggestions the AI has generated for review
- Which cases are missing required documentation
- Whether the factory is ready for an ISO or SFDA audit
- The current status of each open CAPA

You can use this to prioritise your team's work and stay ahead of audit requirements.

### For the Finance Department

You open the Finance View and see:
- Total reject cost broken down by department
- High-value cases that need financial review before destruction
- Potential recovery options for each case
- An estimated projection of next month's reject costs

You can evaluate each case — rework, return to supplier, downgrade, or destroy — and make the financially responsible decision.

### For IT and the Focus ERP Vendor

You open the Technical View and see:
- The complete architecture diagram for both prototype and production
- How data flows from Focus ERP to the dashboard
- The security model and why a backend is required
- All API endpoints documented with examples
- UAT and go-live checklists ready to use

This gives you everything you need to plan and implement the real integration.

---

## 6. Security and Data Protection

The prototype is designed with security as a foundation:

1. **API Key Protection:** The Gemini API key is stored in `.env` on the server. It is never in HTML, CSS, or browser JavaScript. Even if someone inspects the page source code, they will not find the API key.

2. **No Direct Database Access:** The frontend never connects to Focus ERP or the Excel file. All data passes through the backend server.

3. **Read-Only by Design:** The dashboard cannot modify any data. This is intentional and prevents any accidental changes.

4. **Data Minimisation:** When data is sent to Gemini AI, only the relevant fields are included. No personal information, no financial codes, no unnecessary details.

5. **Future Role-Based Access:** In production, different users will see different views based on their role. Finance sees financial data. QC sees quality data. Management sees the executive summary.

---

## 7. Practical Example

Here is how the dashboard would work in a real scenario:

**The Situation:** The warehouse discovers that 200 kilogrammes of Resin A (a raw material used in production) has expired. The material was not used before its expiry date because the inventory rotation system did not flag it in time.

**With Focus ERP alone:**
- The warehouse supervisor creates a reject request in Focus ERP.
- The request sits in the system waiting for someone to approve it.
- Meanwhile, the material takes up valuable warehouse space.
- No one outside the warehouse knows about it unless they run a specific report.

**With the dashboard:**
- The reject record appears automatically on the dashboard.
- The AI identifies "inventory rotation failure" as a repeated root cause (this is the third similar case this quarter).
- The risk score is calculated as 88 out of 100 (Critical) because of the high cost (SAR 45,000) and the long delay (18 days waiting for approval).
- The dashboard shows a CAPA suggestion: "Review inventory rotation procedures and implement automated expiry alerts in Focus ERP."
- Finance sees the high-value alert and evaluates recovery options.
- Management sees the delayed approval and takes action.
- The QCM assigns a CAPA to the warehouse manager.

Everyone involved sees the problem. Everyone knows what needs to be done. Nothing falls through the cracks.

---

## 8. Final Recommendation

This prototype demonstrates a practical, professional, and secure approach to bringing AI-powered visibility to the Reject and Destruction process in Focus ERP.

**Why this approach is correct:**
- Focus ERP remains the official source of truth at all times.
- AI is used only for analysis and recommendations, never for decisions.
- The architecture is secure by design, with the API key protected on the server.
- The dashboard is genuinely useful for every department.
- It is ready to present to management today.

**Recommended next steps for production:**
1. Confirm the Focus ERP integration method (API, SQL view, or scheduled export).
2. Deploy the backend to a secure server with HTTPS.
3. Configure the Gemini API key in the server environment.
4. Implement role-based access control for each view.
5. Complete user acceptance testing with real Focus ERP data.
6. Train all users and update relevant SOPs.
7. Go live with the dashboard as a read-only advisory tool.
8. Schedule regular reviews to measure CAPA effectiveness and reduce reject rates over time.

The future of quality management in medical products manufacturing is intelligent, connected, and transparent. This dashboard is the first step in that direction.

---

*Prepared for Mais for Medical Products*
*Saudi Arabia — Quality Compliance & Digital Transformation*
*Prototype Version 1.0 — May 2026*
