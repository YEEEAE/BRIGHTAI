window.DEMO_DATA = {
  rejects: [
    { doc_no: "RJT-2026-001", date: "2026-04-10", department: "Warehouse", focus_view: "Sponge Tape", item_code: "T-011-4500", item_name: "Sponge Tape – Color Change", lot_no: "2404A", quantity: 500, cost: 12500, reason: "Color variation outside specification limit", approval_status: "Pending", days_pending: 12, destruction_status: "Pending", root_cause: "Raw material pigment inconsistency", risk_score: 72, risk_level: "High", capa_required: true, finance_review_required: true },
    { doc_no: "RJT-2026-002", date: "2026-04-08", department: "Warehouse", focus_view: "Raw Material A", item_code: "RM-101-001", item_name: "Resin A – Raw Material", lot_no: "RM-2309", quantity: 200, cost: 45000, reason: "Material expired before use", approval_status: "Pending", days_pending: 18, destruction_status: "Pending", root_cause: "Inventory rotation failure", risk_score: 88, risk_level: "Critical", capa_required: true, finance_review_required: true },
    { doc_no: "RJT-2026-003", date: "2026-04-05", department: "Production", focus_view: "Injection Molding", item_code: "P-201-003", item_name: "Syringe Barrel 5ml", lot_no: "2503B", quantity: 1200, cost: 8400, reason: "Injection defect – flash on barrel edge", approval_status: "Review", days_pending: 8, destruction_status: "Pending", root_cause: "Mold temperature deviation", risk_score: 55, risk_level: "Medium", capa_required: false, finance_review_required: false },
    { doc_no: "RJT-2026-004", date: "2026-04-03", department: "QC", focus_view: "QC Sample", item_code: "QC-REF-022", item_name: "Sterility Test Sample Batch", lot_no: "2503S", quantity: 50, cost: 3200, reason: "QC sample failed bioburden test", approval_status: "Pending", days_pending: 15, destruction_status: "Pending", root_cause: "Contamination during sampling", risk_score: 82, risk_level: "High", capa_required: true, finance_review_required: true },
    { doc_no: "RJT-2026-005", date: "2026-04-01", department: "Warehouse", focus_view: "Finished Goods", item_code: "FG-301-010", item_name: "Surgical Gloves Box 100", lot_no: "2601G", quantity: 300, cost: 18000, reason: "Packaging damaged during storage", approval_status: "Approved", days_pending: 0, destruction_status: "Pending", root_cause: "Improper stacking in warehouse", risk_score: 60, risk_level: "Medium", capa_required: false, finance_review_required: true },
    { doc_no: "RJT-2026-006", date: "2026-03-28", department: "Warehouse", focus_view: "Resin B", item_code: "RM-102-002", item_name: "Resin B – Base Polymer", lot_no: "RM-2401", quantity: 800, cost: 96000, reason: "Resin degradation due to prolonged storage", approval_status: "Pending", days_pending: 22, destruction_status: "Pending", root_cause: "Storage condition exceeded temperature limit", risk_score: 92, risk_level: "Critical", capa_required: true, finance_review_required: true },
    { doc_no: "RJT-2026-007", date: "2026-03-25", department: "Production", focus_view: "Assembly Line", item_code: "P-202-004", item_name: "IV Set Tubing 1.8m", lot_no: "2602T", quantity: 1500, cost: 11250, reason: "Leakage test failure at connection joint", approval_status: "Approved", days_pending: 0, destruction_status: "Scheduled", root_cause: "Supplier joint ring defect", risk_score: 48, risk_level: "Medium", capa_required: false, finance_review_required: false },
    { doc_no: "RJT-2026-008", date: "2026-03-22", department: "QC", focus_view: "Raw Material B", item_code: "RM-201-003", item_name: "Plasticizer DOP", lot_no: "DOP-2312", quantity: 100, cost: 7800, reason: "Material failed viscosity specification", approval_status: "Pending", days_pending: 25, destruction_status: "Pending", root_cause: "Supplier batch deviation", risk_score: 78, risk_level: "High", capa_required: true, finance_review_required: true },
    { doc_no: "RJT-2026-009", date: "2026-03-20", department: "Warehouse", focus_view: "Label Stock", item_code: "PK-001-005", item_name: "Printed Label Roll", lot_no: "LBL-2601", quantity: 2000, cost: 2400, reason: "Label misprint – incorrect lot number", approval_status: "Pending", days_pending: 10, destruction_status: "Pending", root_cause: "Printing setup error", risk_score: 35, risk_level: "Low", capa_required: false, finance_review_required: false },
    { doc_no: "RJT-2026-010", date: "2026-03-18", department: "Production", focus_view: "Blow Molding", item_code: "P-203-006", item_name: "Bottle 250ml HDPE", lot_no: "2601H", quantity: 600, cost: 3600, reason: "Wall thickness below minimum spec", approval_status: "Review", days_pending: 6, destruction_status: "Destroyed", root_cause: "Blow molding pressure fluctuation", risk_score: 42, risk_level: "Medium", capa_required: false, finance_review_required: false },
    { doc_no: "RJT-2026-011", date: "2026-03-15", department: "Warehouse", focus_view: "Adhesive Tape", item_code: "T-012-4600", item_name: "Double-sided Tape 12mm", lot_no: "2412C", quantity: 350, cost: 5250, reason: "Adhesive strength below spec", approval_status: "Pending", days_pending: 28, destruction_status: "Pending", root_cause: "Raw material formulation error", risk_score: 85, risk_level: "Critical", capa_required: true, finance_review_required: true },
    { doc_no: "RJT-2026-012", date: "2026-03-12", department: "QC", focus_view: "Environmental", item_code: "QC-ENV-001", item_name: "Clean Room Air Sample", lot_no: "CR-2603", quantity: 10, cost: 1800, reason: "Air particle count exceeded Class B limit", approval_status: "Pending", days_pending: 20, destruction_status: "Pending", root_cause: "HVAC filter replacement overdue", risk_score: 90, risk_level: "Critical", capa_required: true, finance_review_required: true },
    { doc_no: "RJT-2026-013", date: "2026-03-10", department: "Production", focus_view: "Semi-Finished", item_code: "SF-401-002", item_name: "Semi-Finished Tubing Roll", lot_no: "2601SF", quantity: 400, cost: 22000, reason: "Extrusion thickness outside tolerance", approval_status: "Pending", days_pending: 14, destruction_status: "Pending", root_cause: "Extruder calibration drift", risk_score: 76, risk_level: "High", capa_required: true, finance_review_required: true },
    { doc_no: "RJT-2026-014", date: "2026-03-08", department: "Warehouse", focus_view: "Raw Material C", item_code: "RM-301-004", item_name: "PVC Compound Granules", lot_no: "PVC-2406", quantity: 500, cost: 32500, reason: "Material contamination detected during incoming inspection", approval_status: "Pending", days_pending: 16, destruction_status: "Pending", root_cause: "Supplier contamination issue", risk_score: 80, risk_level: "High", capa_required: true, finance_review_required: true },
    { doc_no: "RJT-2026-015", date: "2026-03-05", department: "QC", focus_view: "Stability Test", item_code: "QC-STB-003", item_name: "Accelerated Stability Sample", lot_no: "STB-2601", quantity: 30, cost: 4500, reason: "Shelf life projection below minimum requirement", approval_status: "Review", days_pending: 5, destruction_status: "Pending", root_cause: "Formulation stability concern", risk_score: 65, risk_level: "Medium", capa_required: false, finance_review_required: false }
  ],

  analysis: {
    executive_summary: "The dashboard currently shows 15 active reject cases with a total estimated cost of SAR 274,600. There are 3 critical-risk and 5 high-risk cases requiring immediate management attention. The warehouse department accounts for the highest number of reject cases, primarily driven by expired raw materials, improper storage conditions, and supplier quality deviations. Delayed approvals (averaging over 17 days) and a growing destruction backlog are key operational risks. AI analysis identifies inventory rotation failures, supplier quality deviations, and production process deviations as the most recurring root causes requiring CAPA. Focus ERP remains the source of truth — all AI outputs are advisory only.",
    overall_risk_level: "High",
    total_cases: 15,
    total_estimated_cost: 274600,
    high_risk_cases: 8,
    repeated_root_causes: [
      { cause: "Raw material quality deviation", count: 3 },
      { cause: "Inventory rotation failure", count: 2 },
      { cause: "Supplier quality deviation", count: 2 },
      { cause: "Production process deviation", count: 2 },
      { cause: "Storage condition non-compliance", count: 2 }
    ],
    finance_alerts: [
      { item: "Resin B – Base Polymer", cost: 96000, risk: "Critical", recommendation: "Evaluate rework or return to supplier before destruction approval" },
      { item: "Resin A – Raw Material", cost: 45000, risk: "Critical", recommendation: "Review inventory rotation SOP and consider insurance claim" },
      { item: "PVC Compound Granules", cost: 32500, risk: "High", recommendation: "Negotiate supplier credit for contamination issue" },
      { item: "Semi-Finished Tubing Roll", cost: 22000, risk: "High", recommendation: "Evaluate rework feasibility before destruction" },
      { item: "Surgical Gloves Box 100", cost: 18000, risk: "Medium", recommendation: "Consider downgrade or sell as second grade" }
    ],
    capa_suggestions: [
      { title: "Inventory Rotation Procedure Review", description: "Raw materials exceeding shelf life indicate a gap in FIFO/FEFO compliance. Conduct a process review and implement automated expiry alerts in Focus ERP.", priority: "Critical", department: "Warehouse" },
      { title: "Supplier Quality Agreement Enforcement", description: "Recurring raw material deviations require updated supplier quality agreements with clear specification limits and penalty clauses. Focus on PVC compound and resin suppliers.", priority: "High", department: "QC / Procurement" },
      { title: "Warehouse Temperature Monitoring Upgrade", description: "Storage-related degradation suggests the need for real-time temperature monitoring with automated alerts when thresholds are exceeded.", priority: "High", department: "Warehouse / Engineering" },
      { title: "Production Extruder Calibration Program", description: "Semi-finished tubing thickness deviation indicates extruder calibration drift. Establish a weekly calibration verification schedule.", priority: "Medium", department: "Production / Engineering" },
      { title: "Production Mold Maintenance Program", description: "Injection and blow molding defects point to inadequate preventive maintenance. Establish a calibrated maintenance schedule for all active molds.", priority: "Medium", department: "Production / Engineering" },
      { title: "HVAC Filter Replacement Schedule", description: "Clean room contamination risk indicates filter replacement intervals need to be revised and logged with verification.", priority: "Critical", department: "QC / Engineering" }
    ],
    destruction_backlog_alerts: [
      { item: "Resin B – Base Polymer", days_pending: 22, quantity: 800, cost: 96000 },
      { item: "Raw Material A", days_pending: 18, quantity: 200, cost: 45000 },
      { item: "PVC Compound Granules", days_pending: 16, quantity: 500, cost: 32500 },
      { item: "QC Sample Batch", days_pending: 15, quantity: 50, cost: 3200 },
      { item: "Adhesive Tape", days_pending: 28, quantity: 350, cost: 5250 }
    ],
    approval_delay_alerts: [
      { item: "Adhesive Tape", days_pending: 28, department: "Warehouse" },
      { item: "Plasticizer DOP", days_pending: 25, department: "QC" },
      { item: "Resin B – Base Polymer", days_pending: 22, department: "Warehouse" },
      { item: "Clean Room Air Sample", days_pending: 20, department: "QC" },
      { item: "PVC Compound Granules", days_pending: 16, department: "Warehouse" }
    ],
    management_actions: [
      { action: "Approve or reject pending destruction for Resin B (SAR 96,000 at risk)", priority: "Critical" },
      { action: "Review delayed approvals exceeding 20 days (5 cases identified)", priority: "Critical" },
      { action: "Assign CAPA owner for inventory rotation failure — highest recurring root cause", priority: "High" },
      { action: "Evaluate financial recovery options for high-value rejects exceeding SAR 20,000", priority: "High" },
      { action: "Schedule QCM review of supplier quality agreement enforcement with Procurement", priority: "Medium" }
    ]
  },

  rootCauses: [
    { cause: "Raw material quality deviation", count: 3, percentage: 20 },
    { cause: "Inventory rotation failure", count: 2, percentage: 13.3 },
    { cause: "Supplier quality deviation", count: 2, percentage: 13.3 },
    { cause: "Production process deviation", count: 2, percentage: 13.3 },
    { cause: "Storage condition non-compliance", count: 2, percentage: 13.3 },
    { cause: "Supplier contamination issue", count: 1, percentage: 6.7 },
    { cause: "Printing/Setup error", count: 1, percentage: 6.7 },
    { cause: "Extruder calibration drift", count: 1, percentage: 6.7 },
    { cause: "Formulation stability concern", count: 1, percentage: 6.7 }
  ],

  costByDepartment: [
    { department: "Warehouse", cost: 216650, percentage: 78.9 },
    { department: "Production", cost: 47250, percentage: 17.2 },
    { department: "QC", cost: 17300, percentage: 6.3 }
  ],

  financeAlerts: [
    { item: "Resin B – Base Polymer", cost: 96000, risk: "Critical", days: 22, recommendation: "Evaluate rework or return to supplier before destruction approval", potential_recovery: "Return to supplier" },
    { item: "Resin A – Raw Material", cost: 45000, risk: "Critical", days: 18, recommendation: "Review inventory rotation SOP and consider insurance claim", potential_recovery: "Insurance claim" },
    { item: "PVC Compound Granules", cost: 32500, risk: "High", days: 16, recommendation: "Negotiate supplier credit for contamination issue", potential_recovery: "Supplier credit" },
    { item: "Semi-Finished Tubing Roll", cost: 22000, risk: "High", days: 14, recommendation: "Evaluate rework feasibility before destruction", potential_recovery: "Rework" },
    { item: "Surgical Gloves Box 100", cost: 18000, risk: "Medium", days: 5, recommendation: "Consider downgrade or sell as second grade", potential_recovery: "Downgrade sale" },
    { item: "Sponge Tape – Color Change", cost: 12500, risk: "High", days: 12, recommendation: "Negotiate supplier credit for pigment defect", potential_recovery: "Supplier credit" },
    { item: "IV Set Tubing 1.8m", cost: 11250, risk: "Medium", days: 0, recommendation: "Claim supplier for joint ring defect", potential_recovery: "Supplier claim" }
  ],

  capaStatus: [
    { capa_id: "CAPA-2026-001", title: "Inventory Rotation Procedure Review", status: "Open", owner: "Warehouse Manager", target_date: "2026-05-30", priority: "Critical" },
    { capa_id: "CAPA-2026-002", title: "Supplier Quality Agreement Enforcement", status: "In Progress", owner: "QC Manager", target_date: "2026-06-15", priority: "High" },
    { capa_id: "CAPA-2026-003", title: "Warehouse Temperature Monitoring Upgrade", status: "Open", owner: "Engineering", target_date: "2026-06-30", priority: "High" },
    { capa_id: "CAPA-2026-004", title: "Production Extruder Calibration Program", status: "Draft", owner: "Production Manager", target_date: "2026-05-22", priority: "Medium" },
    { capa_id: "CAPA-2026-005", title: "Production Mold Maintenance Program", status: "Draft", owner: "Production Manager", target_date: "2026-05-15", priority: "Medium" },
    { capa_id: "CAPA-2026-006", title: "HVAC Filter Replacement Schedule", status: "Open", owner: "QC / Engineering", target_date: "2026-05-20", priority: "Critical" }
  ],

  qualityRiskCases: [
    { item: "Clean Room Air Sample", risk: "Critical", issue: "Air particle count exceeded Class B limit", gmp_impact: "Yes", docs_complete: false },
    { item: "QC Sample Batch", risk: "High", issue: "Bioburden test failure", gmp_impact: "Yes", docs_complete: false },
    { item: "Plasticizer DOP", risk: "High", issue: "Viscosity specification failure", gmp_impact: "Yes", docs_complete: true },
    { item: "Accelerated Stability Sample", risk: "Medium", issue: "Shelf life projection below minimum", gmp_impact: "Yes", docs_complete: false },
    { item: "PVC Compound Granules", risk: "High", issue: "Contamination during incoming inspection", gmp_impact: "Yes", docs_complete: false }
  ],

  monthlyCostByMonth: [
    { month: "Nov 2025", cost: 98000 },
    { month: "Dec 2025", cost: 112000 },
    { month: "Jan 2026", cost: 135000 },
    { month: "Feb 2026", cost: 121000 },
    { month: "Mar 2026", cost: 168000 },
    { month: "Apr 2026", cost: 196000 },
    { month: "May 2026", cost: 221000 }
  ],

  costByProduct: [
    { product: "Resin B – Base Polymer", cost: 96000, percentage: 35.0 },
    { product: "Resin A – Raw Material", cost: 45000, percentage: 16.4 },
    { product: "PVC Compound Granules", cost: 32500, percentage: 11.8 },
    { product: "Semi-Finished Tubing Roll", cost: 22000, percentage: 8.0 },
    { product: "Surgical Gloves Box 100", cost: 18000, percentage: 6.6 },
    { product: "Sponge Tape – Color Change", cost: 12500, percentage: 4.6 },
    { product: "IV Set Tubing 1.8m", cost: 11250, percentage: 4.1 },
    { product: "Syringe Barrel 5ml (Injection Defect)", cost: 8400, percentage: 3.1 },
    { product: "Plasticizer DOP", cost: 7800, percentage: 2.8 },
    { product: "Double-sided Tape 12mm", cost: 5250, percentage: 1.9 }
  ],

  top5Risks: [
    { rank: 1, risk: "Resin B inventory aging (SAR 96,000) pending destruction for 22 days", score: 92, department: "Warehouse", action: "Expedite QCM approval and evaluate rework feasibility" },
    { rank: 2, risk: "HVAC filter overdue — clean room particle count exceeded Class B limit", score: 90, department: "QC / Engineering", action: "Replace HEPA filters and re-certify clean room within 7 days" },
    { rank: 3, risk: "Raw material expiry — Resin A (SAR 45,000) expired before use", score: 88, department: "Warehouse", action: "Review FIFO/FEFO compliance and implement automated shelf-life alert" },
    { rank: 4, risk: "Adhesive tape — repeated raw material formulation defect (SAR 5,250, 28 days pending)", score: 85, department: "Warehouse", action: "Issue supplier deviation report and require formulation certification" },
    { rank: 5, risk: "PVC compound — contamination detected during incoming inspection (SAR 32,500)", score: 80, department: "Warehouse", action: "Request supplier batch investigation and tighten acceptance sampling" }
  ],

  anomalyAlerts: [
    { title: "Rejection of Sponge Tape increased by 240% during the last 30 days", details: "Most cases are linked to old stock and color change. Immediate investigation is recommended.", priority: "Critical", impact: "High financial exposure (SAR 96,000 at risk)" },
    { title: "Clean room particle count exceeded Class B limit — GMP risk", details: "HVAC filter replacement overdue. Risk of regulatory non-compliance and potential batch recall if root cause is not contained.", priority: "Critical", impact: "GMP audit risk — possible regulatory action" },
    { title: "Approval delay exceeds 25 days for 3 critical cases", details: "Plasticizer DOP (25 days), Adhesive Tape (28 days), Resin B (22 days) still pending approval. Accumulating destruction backlog increases value loss.", priority: "High", impact: "Total SAR 49,250 at additional risk" },
    { title: "Warehouse accounts for 78.9% of total reject cost", details: "Concentration risk: 3 departments account for all rejects. Warehouse is the dominant contributor with storage-related root causes.", priority: "High", impact: "Requires cross-departmental CAPA coordination" },
    { title: "Monthly reject cost trend increasing for 4 consecutive months", details: "From SAR 98,000 in Nov 2025 to SAR 221,000 in May 2026 (125% increase). If trend continues, projected monthly cost may exceed SAR 300,000 by Q3 2026.", priority: "Medium", impact: "Budget overrun risk — projected annual loss exceeds SAR 2M" }
  ]
};
