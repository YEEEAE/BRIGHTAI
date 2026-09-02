// test-lab-change-request-intent.mjs — Intent-Driven Change Request Validation & UI Test (PROMPT-04, P2-3, AC-01).
//
// Asserts:
//   1. Step 1 (Objective & Scope) schema constraints and defaults.
//   2. Step 2 (Risk & Quality Impact) GMP assessment and rollback requirements.
//   3. Step 3 (Action Plan & Reviewers) date formatting and metadata.
//   4. Multi-step UI accessibility contract: aria-current="step", progressive disclosure, and contextual tooltips.

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const appDir = resolve(fileURLToPath(new URL('..', import.meta.url)));

let passed = 0;
let failed = 0;
const failures = [];

function pass(name) {
  passed++;
  console.log(`  ✅ ${name}`);
}

function fail(name, err) {
  failed++;
  failures.push(`${name}: ${err.message}`);
  console.error(`  ❌ ${name}:`, err.message);
}

try {
  console.log('■ Testing Intent-Driven Change Request Schema (Zod)');
  const { labChangeRequestIntentSchema } = await import('../src/lib/validation.ts');

  const baseValid = {
    title: 'Precision Sensor Calibration Interval Adjustment',
    change_reason: 'Aligning with updated OEM manufacturer guidance following 6-month stability study.',
    urgency: 'ROUTINE',
    affected_areas: 'Main QC Microbiology Lab',
    entity_type: 'EQUIPMENT',
    operation: 'UPDATE',
    entity_id: 15,
    gmp_impact: 'MINOR',
    validation_required: 'NO',
    rollback_plan: 'Revert calibration schedule to previous 3-month cycle in equipment registry.',
    assignee: 'Senior Metrology Specialist',
    target_completion_date: '2026-11-01',
    attachments_note: 'OEM Bulletin 2026-B, Metrology Report MR-44',
  };

  // 1. Positive case
  const res1 = labChangeRequestIntentSchema.safeParse(baseValid);
  assert.equal(res1.success, true, 'valid 3-step intent data parses successfully');
  pass('happy path: complete 3-step intent payload parses cleanly');

  // 2. Step 1 validations
  console.log('\n■ Step 1: Objective & Scope Validations');
  {
    // Title too short
    const badTitle = labChangeRequestIntentSchema.safeParse({ ...baseValid, title: 'ab' });
    assert.equal(badTitle.success, false);
    assert.match(badTitle.error.issues[0].message, /at least 3 characters/i);
    pass('step 1: title requires at least 3 characters');

    // Reason too short
    const badReason = labChangeRequestIntentSchema.safeParse({ ...baseValid, change_reason: 'fix' });
    assert.equal(badReason.success, false);
    assert.match(badReason.error.issues[0].message, /at least 5 characters/i);
    pass('step 1: reason requires at least 5 characters');

    // Invalid urgency
    const badUrgency = labChangeRequestIntentSchema.safeParse({ ...baseValid, urgency: 'SUPER_CRITICAL' });
    assert.equal(badUrgency.success, false);
    assert.match(badUrgency.error.issues[0].message, /urgency/i);
    pass('step 1: invalid urgency level is rejected');

    // Missing affected area
    const badArea = labChangeRequestIntentSchema.safeParse({ ...baseValid, affected_areas: ' ' });
    assert.equal(badArea.success, false);
    assert.match(badArea.error.issues[0].message, /affected laboratory/i);
    pass('step 1: affected areas is required');

    // Invalid entity type
    const badEntity = labChangeRequestIntentSchema.safeParse({ ...baseValid, entity_type: 'UNKNOWN_ENTITY' });
    assert.equal(badEntity.success, false);
    assert.match(badEntity.error.issues[0].message, /target entity/i);
    pass('step 1: invalid entity_type rejected');
  }

  // 3. Step 2 validations
  console.log('\n■ Step 2: Risk & Quality Impact Validations');
  {
    // Invalid GMP impact
    const badGmp = labChangeRequestIntentSchema.safeParse({ ...baseValid, gmp_impact: 'HIGH_RISK_CUSTOM' });
    assert.equal(badGmp.success, false);
    assert.match(badGmp.error.issues[0].message, /GMP impact/i);
    pass('step 2: invalid gmp_impact rejected');

    // Missing rollback plan
    const badRollback = labChangeRequestIntentSchema.safeParse({ ...baseValid, rollback_plan: 'none' });
    assert.equal(badRollback.success, false);
    assert.match(badRollback.error.issues[0].message, /rollback plan/i);
    pass('step 2: rollback plan (<5 chars) rejected');
  }

  // 4. Step 3 validations
  console.log('\n■ Step 3: Action Plan & Reviewers Validations');
  {
    // Invalid date format
    const badDate = labChangeRequestIntentSchema.safeParse({ ...baseValid, target_completion_date: '11/01/2026' });
    assert.equal(badDate.success, false);
    assert.match(badDate.error.issues[0].message, /YYYY-MM-DD/i);
    pass('step 3: invalid date format (non-ISO) rejected');

    // Valid ISO date format
    const goodDate = labChangeRequestIntentSchema.safeParse({ ...baseValid, target_completion_date: '2026-12-31' });
    assert.equal(goodDate.success, true);
    pass('step 3: YYYY-MM-DD date format accepted');

    // Empty date allowed (optional)
    const emptyDate = labChangeRequestIntentSchema.safeParse({ ...baseValid, target_completion_date: '' });
    assert.equal(emptyDate.success, true);
    pass('step 3: optional target completion date handled cleanly');
  }

  // 5. Template & Accessibility Audit (new.astro)
  console.log('\n■ UI & Accessibility Audit (new.astro)');
  {
    const templateContent = readFileSync(join(appDir, 'src/pages/lab/change-requests/new.astro'), 'utf8');

    // aria-current="step"
    assert.ok(templateContent.includes('aria-current="step"'), 'must declare aria-current="step" for accessibility');
    pass('accessibility: navigation progress announces current step via aria-current="step"');

    // 3 distinct fieldsets with accessible headings
    assert.ok(templateContent.includes('id="form-step-1"'), 'step 1 fieldset exists');
    assert.ok(templateContent.includes('id="form-step-2"'), 'step 2 fieldset exists');
    assert.ok(templateContent.includes('id="form-step-3"'), 'step 3 fieldset exists');
    pass('structure: 3 distinct intent fieldsets (Objective, Risk, Action Plan) present');

    // Contextual tooltips / help text
    assert.ok(templateContent.includes('ContextualHelp'), 'ContextualHelp component used');
    assert.ok(templateContent.includes('step-btn-next'), 'Next step buttons present');
    assert.ok(templateContent.includes('step-btn-prev'), 'Previous step buttons present');
    pass('ux: step navigation buttons and contextual guidance integrated');
  }

  console.log(`\nResults: ${passed} passed, ${failed} failed`);
  if (failed > 0) {
    console.error('Failed checks:\n' + failures.join('\n'));
    process.exitCode = 1;
  }
} catch (err) {
  console.error('Fatal test error:', err);
  process.exitCode = 1;
}
