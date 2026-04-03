INSERT INTO daily_tasks (id, title, owner_name, due_date, status, priority, progress_note, progress_percent, updated_at)
SELECT 1,
       'Review injection reject trend and confirm machine-side containment',
       'Quality Manager',
       DATE('now', 'localtime'),
       'in_progress',
       'high',
       'Team started validating the top injection rejects against the latest line setup sheet.',
       40,
       CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM daily_tasks WHERE id = 1);

INSERT INTO daily_tasks (id, title, owner_name, due_date, status, priority, progress_note, progress_percent, updated_at)
SELECT 2,
       'Verify OBM material variance before the next production handover',
       'Process Engineer',
       DATE('now', 'localtime'),
       'new',
       'high',
       'Waiting for final confirmation from the raw material quality check.',
       5,
       CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM daily_tasks WHERE id = 2);

INSERT INTO daily_tasks (id, title, owner_name, due_date, status, priority, progress_note, progress_percent, updated_at)
SELECT 3,
       'Close assembly corrective action notes for the weekly quality review',
       'Assembly Supervisor',
       DATE('now', 'localtime', '+1 day'),
       'blocked',
       'medium',
       'The draft is ready, but the final rejection counts still need QA sign-off.',
       55,
       CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM daily_tasks WHERE id = 3);

INSERT INTO daily_tasks (id, title, owner_name, due_date, status, priority, progress_note, progress_percent, updated_at)
SELECT 4,
       'Update packaging line visual controls and operator briefing cards',
       'Operations Team',
       DATE('now', 'localtime', '+2 day'),
       'done',
       'low',
       'Visual controls were refreshed and the packaging team completed the retraining huddle.',
       100,
       CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM daily_tasks WHERE id = 4);

INSERT INTO daily_tasks (id, title, owner_name, due_date, status, priority, progress_note, progress_percent, updated_at)
SELECT 5,
       'Prepare a concise plant summary for tomorrow''s executive stand-up',
       'Management Office',
       DATE('now', 'localtime', '+1 day'),
       'new',
       'medium',
       'Need one clean narrative tying the latest reject movement to owners and next actions.',
       0,
       CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM daily_tasks WHERE id = 5);

INSERT INTO future_plans (id, title, horizon_label, objective, owner_name, status, impact_score)
SELECT 1,
       'Injection Area capability stabilization',
       '30 days',
       'Reduce repeated setup-related rejects in INJECTION AREA by enforcing first-hour verification and daily variance review.',
       'Quality Manager',
       'in_progress',
       92
WHERE NOT EXISTS (SELECT 1 FROM future_plans WHERE id = 1);

INSERT INTO future_plans (id, title, horizon_label, objective, owner_name, status, impact_score)
SELECT 2,
       'OBM Area resin control standardization',
       '45 days',
       'Standardize resin handling and pre-run checks in OBM AREA to prevent material-driven rejection spikes.',
       'Operations Team',
       'planned',
       88
WHERE NOT EXISTS (SELECT 1 FROM future_plans WHERE id = 2);

INSERT INTO future_plans (id, title, horizon_label, objective, owner_name, status, impact_score)
SELECT 3,
       'Assembly Area layered audit rollout',
       '60 days',
       'Deploy layered process audits in ASSEMBLY AREA and link daily findings to corrective action ownership.',
       'Plant Manager',
       'planned',
       84
WHERE NOT EXISTS (SELECT 1 FROM future_plans WHERE id = 3);

INSERT INTO future_plans (id, title, horizon_label, objective, owner_name, status, impact_score)
SELECT 4,
       'Packaging Area seal-defect prevention program',
       '14 days',
       'Complete packaging seal integrity controls and operator retraining to lock in the latest performance recovery.',
       'Packaging Lead',
       'completed',
       90
WHERE NOT EXISTS (SELECT 1 FROM future_plans WHERE id = 4);

INSERT INTO handover_notes (id, shift_label, speaker_name, summary, blockers, next_step, mood)
SELECT 1,
       'Morning Shift',
       'Nora Alqahtani',
       'Injection is stable so far, but the OBM run still needs close material observation during the first production window.',
       'Resin confirmation from stores has not been attached to the shift pack yet.',
       'Validate the OBM material release before the 09:30 checkpoint and update the supervisor board.',
       'watchful'
WHERE NOT EXISTS (SELECT 1 FROM handover_notes WHERE id = 1);

INSERT INTO handover_notes (id, shift_label, speaker_name, summary, blockers, next_step, mood)
SELECT 2,
       'Quality Midday Review',
       'Faisal Alharbi',
       'Assembly containment is active and the team has already narrowed the likely defect pattern to one workcell family.',
       'Final verification data from the last two assembly lots is still pending.',
       'Close the lot-level check and decide whether the issue stays local or needs cross-area escalation.',
       'steady'
WHERE NOT EXISTS (SELECT 1 FROM handover_notes WHERE id = 2);

INSERT INTO handover_notes (id, shift_label, speaker_name, summary, blockers, next_step, mood)
SELECT 3,
       'Executive Escalation Prep',
       'Maha Almutairi',
       'Packaging is no longer the highest loss area, but leadership still expects a dated recovery path and owner confirmation before the evening update.',
       'The current draft does not yet confirm whether the latest packaging improvement is fully sustained.',
       'Recheck the final shift output at 17:00 and send only the decision-ready summary upward.',
       'urgent'
WHERE NOT EXISTS (SELECT 1 FROM handover_notes WHERE id = 3);

INSERT INTO executive_reports (id, title, period_label, summary, risks, recommendations, recipients, generated_by)
SELECT 1,
       'Weekly plant quality snapshot',
       'Current production week',
       'Current quality pressure is concentrated around injection and assembly follow-up, with packaging showing partial recovery and OBM still needing a tighter material narrative.',
       'If the OBM material variance is not confirmed early, the next shift may inherit noise instead of a clear containment status.',
       'Keep one accountable owner per area, publish a midday checkpoint, and escalate only after the material confirmation is complete.',
       'ops.executive@company.sa, plant.manager@company.sa',
       'system'
WHERE NOT EXISTS (SELECT 1 FROM executive_reports WHERE id = 1);

INSERT INTO executive_reports (id, title, period_label, summary, risks, recommendations, recipients, generated_by)
SELECT 2,
       'Monthly rejection leadership brief',
       'Latest available month',
       'The plant needs a cleaner operating narrative that ties rejection movement to named ownership, especially where baseline drift can hide real change.',
       'Without aligned handovers and dated actions, leadership receives more updates but less decision quality.',
       'Anchor the next report on area ownership, abnormal product explanation, and the next verification date for each active risk.',
       'quality.director@company.sa, ceo.office@company.sa',
       'system'
WHERE NOT EXISTS (SELECT 1 FROM executive_reports WHERE id = 2);

INSERT OR IGNORE INTO user_sessions
  (actor, role, token)
VALUES
  ('Admin', 'admin', 'aimais-admin-default-token-change-me'),
  ('Manager', 'manager', 'aimais-manager-default-token'),
  ('Viewer', 'viewer', 'aimais-viewer-default-token');
