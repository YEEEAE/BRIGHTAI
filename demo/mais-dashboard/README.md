# AI Reject Analytics & Management Dashboard (Prototype)

This is the official enterprise-grade interactive prototype for the **AI Reject Analytics & Management Dashboard**, designed to support Yazeed (QC Compliance) in presenting the upgraded Reject & Destruction workflow upgrade to top management at **Mais for Medical Products**.

This prototype demonstrates how Mais can transition from a hybrid, paper-reliant process inside Focus ERP to a fully digitized, departmentally owned workflow, backed by a secure read-only AI analytics layer.

---

## 1. Core Business Rules

1. **Focus ERP is the Official Source of Truth:** All transactions, stock hold blocks, financial approvals, and final closures are registered in Focus ERP. This dashboard is strictly **Read-Only**.
2. **Advisory-Only AI:** Gemini API analysis, risk scoring, trend clustering, and CAPA suggestions are completely consultative. Formal quality, financial, and executive authorizations must be performed manually in Focus ERP by qualified human managers.
3. **No Frontend API Exposure:** The Gemini API key is hosted strictly inside the secure backend environment variables (`.env`) and is never loaded on browser-side files (`HTML`/`CSS`/`JS`), securing corporate data.

---

## 2. Workspace Modes of Operation

This prototype supports two seamless modes of operation:

### Mode 1 — Static Presentation Mode (Offline / Direct Browser)
* **How to run:** Simply open `index.html` directly in any web browser.
* **No Server Required:** This mode runs completely locally without Node.js, without the backend, and without external network calls.
* **Mock Database:** It reads mock transactional records directly from `assets/data.js`.
* **Purpose:** For quick board presentations, offline meetings, and UI/UX visual evaluations by executive sponsors.

### Mode 2 — Local AI Analysis Mode (Full Stack / Excel Data Source)
* **How to run:** Requires Node.js installed on your machine.
* **Data Source:** It dynamically reads and transforms data from the local company Excel file: `/Users/yzydalshmry/Desktop/BRIGHTAI/reports/ALL_ITEMS_MAIS_with_life_years.xlsx`.
* **AI Analysis:** It establishes connection to the Gemini API, minimized and processes data via a secure Node.js Express backend server, returning real-time root cause trending and CAPA advice.

---

## 3. How to Launch and Run the Prototype

### Phase A: Setup and Dependencies
1. Open your terminal and navigate to the project directory:
   ```bash
   cd /Users/yzydalshmry/Desktop/BRIGHTAI/demo/mais-dashboard
   ```
2. Install the required Node.js packages:
   ```bash
   npm install
   ```

### Phase B: Environment Configuration
1. Copy the environment template file:
   ```bash
   cp .env.example .env
   ```
2. Open the newly created `.env` file in your code editor and enter your private Gemini API key:
   ```env
   PORT=3000
   GEMINI_API_KEY=your_actual_gemini_api_key_here
   GEMINI_MODEL=gemini-2.5-flash
   EXCEL_FILE_PATH=/Users/yzydalshmry/Desktop/BRIGHTAI/reports/ALL_ITEMS_MAIS_with_life_years.xlsx
   ```
   *Note: If `GEMINI_API_KEY` is left blank, the system automatically falls back to a high-fidelity local AI simulation to ensure uninterrupted testing.*

### Phase C: Starting the Server
1. Start the Node.js backend server:
   ```bash
   npm start
   ```
2. Open your web browser and navigate to:
   ```
   http://localhost:3000
   ```

---

## 4. Pages Structure & What Each Page Does

1. **index.html (Main Dashboard):**
   Provides the master operational view. Displays real-time cards (Total Cases, Costs, Quarantine Status, High Risk Cases), active Focus-like reject tables, interactive chat assistants, and the **"Run AI Analysis"** button to trigger the Gemini engine.
2. **executive.html (Executive Management View):**
   A tailored, high-impact view designed for the Factory Director. Avoids technical details and highlights key weekly risk cost, highest-cost departments, high-value alerts, and strategic action cards requiring signature decisions.
3. **finance.html (Finance View):**
   Focuses on cost mitigation and loss recovery prior to material destruction. Classifies rejects by cost, displays the "High-Value Flag" clearances, and provides recovery choices (Rework, Return to Supplier, Downgrade/Sell, or Dispose).
4. **quality.html (Quality & CAPA View):**
   Supports QC Compliance and QA Managers in maintaining SFDA/GMP audit readiness. Focuses on root cause grouping, CAPA link tracking, document completeness logs, and physical segregation verification.
5. **technical.html (Integration Architecture View):**
   A technical spec page designed for IT leads and the Focus ERP vendor. Explains the security model, backend middleware architecture, API endpoint endpoints, and provides a clear UAT checklist to proceed to live ERP customization.

---

## 5. Security & Technical Architecture

```
[ Focus ERP ] 
      │ (Read-Only SQL View / API)
      ▼
[ Secure Node.js Backend Server ] <──── HTTPS (TLS 1.3) ───> [ Gemini API ]
      │ (Data Minimized & Anonymized)
      ▼
[ Interactive Management Dashboard ] (Read-only Frontend)
```

* **Data Minimization:** The backend server filters the data payload, stripping employee names and supplier details, sending only anonymized operational fields (e.g., quantities, cost, standard defect reasons) to the Gemini API.
* **API Key Protection:** The Gemini key resides exclusively on the backend server enclave. The frontend dashboard cannot query or read the key, preventing internet-facing cybersecurity risks.

---

## 6. How to Present this Prototype to Management

When presenting to top management and the Factory Director, follow this roadmap:
1. **Emphasize Low-Risk Nature:** Clarify that this is an upgrade utilizing our *existing* Focus ERP system. We are not replacing or migrating our database; we are simply configuring workflow rules and using a read-only dashboard.
2. **Demonstrate Financial Value:** Show the Finance View. Emphasize that adding the Financial Gate to Focus ERP prevents the accidental destruction of high-value raw materials, allowing Mais to secure claims or return items to suppliers.
3. **Showcase AI Power:** Use the "Run AI Analysis" button. Explain how the AI acts as an advisory-only intelligence layer that automatically spots recurring supplier defects or mould issues, saving hours of manual Excel sheets.
4. **Demonstrate Compliance:** Show the Quality View. Prove how the transition to Digital Destruction Permits with mandatory visual attachments makes Mais 100% ready for sudden SFDA and GMP audits.

---

## 7. Prototype Limitations
* **Simulated Write-Back:** Button clicks on approvals or status changes are visual mockups; real adjustments require manual entry directly inside Focus ERP.
* **Excel Synchronization:** Excel loading occurs at server startup or during active analysis requests. In the future production setup, this will be replaced by direct SQL View queries for instantaneous real-time sync.
