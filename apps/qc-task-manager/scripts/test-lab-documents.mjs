// Database-backed unit checks for the QC Laboratory SOP/WI document library
// (src/lib/lab/documents.ts — /lab/documents, page reference §39).
//
// Runs in its own process so QC_DATABASE_PATH is set before src/lib/db.ts
// evaluates its singleton path. Seed is ON (QC_SEED_LAB_EQUIPMENT=1) so the
// canonical 24-device registry loads — documents/products themselves are NEVER
// seeded (they start empty, no fabricated records). Focus: the five stored
// statuses (DRAFT / IN_REVIEW / APPROVED / SUPERSEDED / ARCHIVED), the current
// version resolution via current_version_id, the filters (q / type / status /
// owner / equipment / product / review=due), whitelisted sorting, server-side
// pagination, the dropdown helpers, and the supervisor+ create permission.
//
// Since PROMPT 41 the editor is also covered: the sanitized content renderer,
// create (v1 DRAFT), duplicate-code conflict, in-place update of DRAFT/IN_REVIEW
// versions, the approved→new-draft versioning contract (change summary required,
// approved v1 immutable, VERSION audit), SUPERSEDED/ARCHIVED immutability, and
// the record-level edit permission.

import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const appDir = resolve(fileURLToPath(new URL('..', import.meta.url)));
const tempDir = mkdtempSync(join(tmpdir(), 'brightai-qc-lab-documents-'));
const dbPath = join(tempDir, 'lab-documents.db');

let passed = 0;
let failed = 0;
const failures = [];
function ok(cond, label) {
  if (cond) {
    passed += 1;
    console.log(`  ✅ ${label}`);
  } else {
    failed += 1;
    failures.push(label);
    console.log(`  ❌ ${label}`);
  }
}
function eq(actual, expected, label) {
  ok(actual === expected, `${label} (expected ${expected}, got ${actual})`);
}

function isoDay(offsetDays) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

let db;
let managerId;
let supervisorId;
let employeeId;

/** Insert a document + an optional numbered version; returns the document id. */
function insertDoc({ code, title, type = 'SOP', status = 'DRAFT', ownerId, reviewerId = null, approverId = null, productId = null, effectiveDate = null, reviewDue = null, version = null, versionStatus = 'DRAFT', updatedAt = null }) {
  const result = db
    .prepare(
      `INSERT INTO lab_documents (code, title, type, owner_id, reviewer_id, approver_id, product_id, status, effective_date, review_due_date, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(code, title, type, ownerId, reviewerId, approverId, productId, status, effectiveDate, reviewDue, managerId);
  const docId = Number(result.lastInsertRowid);
  if (version !== null) {
    const v = db
      .prepare(
        `INSERT INTO lab_document_versions (document_id, version, content_md, change_summary, author_id, status)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .run(docId, version, '# content', 'Initial version.', ownerId, versionStatus);
    const versionId = Number(v.lastInsertRowid);
    db.prepare('UPDATE lab_documents SET current_version_id = ? WHERE id = ?').run(versionId, docId);
  }
  if (updatedAt !== null) {
    db.prepare('UPDATE lab_documents SET updated_at = ? WHERE id = ?').run(updatedAt, docId);
  }
  return docId;
}

/** Insert a typed link between a document and equipment/product/template. */
function insertLink(docId, entityType, entityId, actorId) {
  db.prepare(
    'INSERT INTO lab_document_links (document_id, entity_type, entity_id, created_by) VALUES (?, ?, ?, ?)',
  ).run(docId, entityType, entityId, actorId);
}

try {
  process.env.QC_DATABASE_PATH = dbPath;
  process.env.QC_DB_PATH = '';
  // Seed ON for this suite — the canonical 24-device registry must load.
  process.env.QC_SEED_LAB_EQUIPMENT = '1';

  execFileSync(process.execPath, ['scripts/init-db.mjs'], {
    cwd: appDir,
    env: { ...process.env, QC_DATABASE_PATH: dbPath, QC_DB_PATH: '', QC_SEED_LAB_EQUIPMENT: '1' },
    stdio: 'ignore',
  });

  const backupDir = join(tempDir, 'backups');
  mkdirSync(backupDir, { recursive: true });
  writeFileSync(
    join(backupDir, 'status.json'),
    JSON.stringify({ state: 'success', lastSuccessAt: new Date().toISOString() }),
  );

  const { getDb } = await import('../src/lib/db.ts');
  const docs = await import('../src/lib/lab/documents.ts');
  const perms = await import('../src/lib/permissions.ts');

  db = getDb();
  managerId = Number(db.prepare("SELECT id FROM users WHERE username = 'manager'").get().id);
  supervisorId = Number(db.prepare("SELECT id FROM users WHERE username = 'supervisor'").get().id);
  employeeId = Number(db.prepare("SELECT id FROM users WHERE username = 'employee'").get().id);

  // ── Policy constants ──
  console.log('■ Policy');
  {
    eq(docs.LAB_DOCUMENT_TYPES.length, 2, 'policy: two document types');
    ok(docs.LAB_DOCUMENT_TYPES.includes('SOP'), 'policy: SOP');
    ok(docs.LAB_DOCUMENT_TYPES.includes('WI'), 'policy: WI');
    eq(docs.LAB_DOCUMENT_STATUSES.length, 5, 'policy: five stored statuses');
    ok(docs.LAB_DOCUMENT_STATUSES.includes('DRAFT'), 'policy: DRAFT');
    ok(docs.LAB_DOCUMENT_STATUSES.includes('IN_REVIEW'), 'policy: IN_REVIEW');
    ok(docs.LAB_DOCUMENT_STATUSES.includes('APPROVED'), 'policy: APPROVED');
    ok(docs.LAB_DOCUMENT_STATUSES.includes('SUPERSEDED'), 'policy: SUPERSEDED');
    ok(docs.LAB_DOCUMENT_STATUSES.includes('ARCHIVED'), 'policy: ARCHIVED');
    eq(docs.LAB_DOCUMENT_STATUS_LABELS.DRAFT, 'Draft', 'policy: DRAFT label');
    eq(docs.LAB_DOCUMENT_STATUS_LABELS.IN_REVIEW, 'In Review', 'policy: IN_REVIEW label');
    eq(docs.LAB_DOCUMENT_STATUS_LABELS.APPROVED, 'Approved', 'policy: APPROVED label');
    eq(docs.LAB_DOCUMENT_STATUS_LABELS.SUPERSEDED, 'Superseded', 'policy: SUPERSEDED label');
    eq(docs.LAB_DOCUMENT_STATUS_LABELS.ARCHIVED, 'Archived', 'policy: ARCHIVED label');
  }

  // ── Register starts empty (no fabricated documents) ──
  console.log('■ Empty register');
  {
    eq(docs.searchLabDocuments(docs.NO_LAB_DOCUMENT_FILTERS).total, 0, 'register: starts empty');
    eq(docs.listLabDocumentOwners().length, 0, 'dropdown: no owners yet');
  }

  // ── Fixtures ──
  console.log('■ Fixtures');
  let productId;
  let equipmentId;
  let sopApprovedId;
  let wiDraftId;
  {
    const p = db
      .prepare('INSERT INTO lab_products (name, code, is_active, created_by) VALUES (?, ?, 1, ?)')
      .run('Fixture Connector', 'FIX-CONN', managerId);
    productId = Number(p.lastInsertRowid);

    equipmentId = Number(db.prepare("SELECT id FROM lab_equipment WHERE code = 'NOC-05'").get().id);

    // Approved SOP v3, effective long ago, review due yesterday → review=due.
    sopApprovedId = insertDoc({
      code: 'SOP-QC-001',
      title: 'Subatmospheric Air Testing Procedure',
      type: 'SOP',
      status: 'APPROVED',
      ownerId: managerId,
      reviewerId: supervisorId,
      approverId: managerId,
      productId,
      effectiveDate: isoDay(-30),
      reviewDue: isoDay(-1),
      version: 3,
      versionStatus: 'APPROVED',
      updatedAt: '2026-01-05 10:00:00',
    });
    // Same document's product/equipment link via the typed links table.
    insertLink(sopApprovedId, 'PRODUCT', productId, managerId);
    insertLink(sopApprovedId, 'EQUIPMENT', equipmentId, managerId);

    // WI draft with a version, no dates yet.
    wiDraftId = insertDoc({
      code: 'WI-QC-002',
      title: 'Vacuum Leak Tester Setup',
      type: 'WI',
      status: 'DRAFT',
      ownerId: supervisorId,
      version: 1,
      versionStatus: 'DRAFT',
      updatedAt: '2026-01-04 10:00:00',
    });

    // IN_REVIEW SOP owned by employee, effective date null.
    insertDoc({
      code: 'SOP-QC-003',
      title: 'Sample Handling Checklist',
      type: 'SOP',
      status: 'IN_REVIEW',
      ownerId: employeeId,
      reviewerId: supervisorId,
      effectiveDate: null,
      reviewDue: null,
      version: 1,
      versionStatus: 'IN_REVIEW',
      updatedAt: '2026-01-03 10:00:00',
    });

    // ARCHIVED document with review date in the past — must NOT match review=due.
    insertDoc({
      code: 'WI-QC-OLD',
      title: 'Retired Packaging Inspection',
      type: 'WI',
      status: 'ARCHIVED',
      ownerId: managerId,
      effectiveDate: isoDay(-200),
      reviewDue: isoDay(-50),
      version: 2,
      versionStatus: 'ARCHIVED',
      updatedAt: '2026-01-02 10:00:00',
    });

    // SUPERSEDED document with a review date — must NOT match review=due either.
    insertDoc({
      code: 'SOP-QC-000',
      title: 'Legacy Air Test',
      type: 'SOP',
      status: 'SUPERSEDED',
      ownerId: supervisorId,
      reviewDue: isoDay(-5),
      version: 1,
      versionStatus: 'SUPERSEDED',
      updatedAt: '2026-01-01 10:00:00',
    });

    eq(docs.searchLabDocuments(docs.NO_LAB_DOCUMENT_FILTERS).total, 5, 'fixtures: five documents');
  }

  // ── List: version, owner, type resolution ──
  console.log('■ List');
  {
    const rows = docs.searchLabDocuments(docs.NO_LAB_DOCUMENT_FILTERS).rows;
    eq(rows.length, 5, 'list: all five rows');
    eq(rows[0].code, 'SOP-QC-001', 'list: default sort updated_at desc, newest first');
    ok(rows.some((r) => r.code === 'SOP-QC-001' && r.version === 3), 'list: current version resolved via current_version_id');
    ok(rows.some((r) => r.code === 'SOP-QC-001' && r.product_name === 'Fixture Connector'), 'list: product name joined');
    ok(rows.some((r) => r.code === 'SOP-QC-001' && r.owner_name === 'Department Manager'), 'list: owner name joined');
    ok(rows.some((r) => r.code === 'SOP-QC-001' && r.status === 'APPROVED'), 'list: stored status');

    // Sort by code asc
    const byCode = docs.searchLabDocuments({ ...docs.NO_LAB_DOCUMENT_FILTERS, sort: 'code', dir: 'asc' }).rows;
    eq(byCode[0].code, 'SOP-QC-000', 'sort: code asc (legacy first)');
    eq(byCode[byCode.length - 1].code, 'WI-QC-OLD', 'sort: code asc (WI-QC-OLD last)');

    // Sort by version desc
    const byVersion = docs.searchLabDocuments({ ...docs.NO_LAB_DOCUMENT_FILTERS, sort: 'version', dir: 'desc' }).rows;
    eq(byVersion[0].version, 3, 'sort: version desc → v3 first');
    ok(byVersion[0].code === 'SOP-QC-001', 'sort: version desc row correct');

    // Pagination: per_page 2 → 3 pages
    const paged = docs.searchLabDocuments({ ...docs.NO_LAB_DOCUMENT_FILTERS, per_page: 2 });
    eq(paged.total, 5, 'pagination: total 5');
    eq(paged.total_pages, 3, 'pagination: 3 pages');
    eq(paged.rows.length, 2, 'pagination: first page has 2');
    const page2 = docs.searchLabDocuments({ ...docs.NO_LAB_DOCUMENT_FILTERS, per_page: 2, page: 2 });
    eq(page2.page, 2, 'pagination: page 2 kept');
    const page99 = docs.searchLabDocuments({ ...docs.NO_LAB_DOCUMENT_FILTERS, per_page: 2, page: 99 });
    eq(page99.page, 3, 'pagination: page 99 clamps to last');
  }

  // ── Filters ──
  console.log('■ Filters');
  {
    const typeSop = docs.searchLabDocuments({ ...docs.NO_LAB_DOCUMENT_FILTERS, type: 'SOP' });
    eq(typeSop.total, 3, 'filter: type SOP → 3');
    const typeWi = docs.searchLabDocuments({ ...docs.NO_LAB_DOCUMENT_FILTERS, type: 'WI' });
    eq(typeWi.total, 2, 'filter: type WI → 2');

    const statusApproved = docs.searchLabDocuments({ ...docs.NO_LAB_DOCUMENT_FILTERS, status: 'APPROVED' });
    eq(statusApproved.total, 1, 'filter: status APPROVED → 1');
    const statusDraft = docs.searchLabDocuments({ ...docs.NO_LAB_DOCUMENT_FILTERS, status: 'DRAFT' });
    eq(statusDraft.total, 1, 'filter: status DRAFT → 1');

    const ownerManager = docs.searchLabDocuments({ ...docs.NO_LAB_DOCUMENT_FILTERS, owner: managerId });
    eq(ownerManager.total, 2, 'filter: owner manager → 2 (SOP-QC-001 + WI-QC-OLD)');
    const ownerEmployee = docs.searchLabDocuments({ ...docs.NO_LAB_DOCUMENT_FILTERS, owner: employeeId });
    eq(ownerEmployee.total, 1, 'filter: owner employee → 1');

    // review=due → active + review date reached (overview.ts KPI semantics).
    const reviewDue = docs.searchLabDocuments({ ...docs.NO_LAB_DOCUMENT_FILTERS, review: 'due' });
    eq(reviewDue.total, 1, 'filter: review=due → only active reached date');
    eq(reviewDue.rows[0].code, 'SOP-QC-001', 'filter: review=due row correct (ARCHIVED/SUPERSEDED excluded)');
  }

  // ── Search (q) ──
  console.log('■ Search');
  {
    const byTitle = docs.searchLabDocuments({ ...docs.NO_LAB_DOCUMENT_FILTERS, q: 'Subatmospheric' });
    eq(byTitle.total, 1, 'search: title match');
    const byCode = docs.searchLabDocuments({ ...docs.NO_LAB_DOCUMENT_FILTERS, q: 'SOP-QC-003' });
    eq(byCode.total, 1, 'search: code match');
    const byProduct = docs.searchLabDocuments({ ...docs.NO_LAB_DOCUMENT_FILTERS, q: 'Fixture Connector' });
    eq(byProduct.total, 1, 'search: product name match');
    const byEquipmentCode = docs.searchLabDocuments({ ...docs.NO_LAB_DOCUMENT_FILTERS, q: 'NOC-05' });
    eq(byEquipmentCode.total, 1, 'search: equipment code match');
    const none = docs.searchLabDocuments({ ...docs.NO_LAB_DOCUMENT_FILTERS, q: 'zzz-no-such' });
    eq(none.total, 0, 'search: no match');

    // LIKE escaping: % must match literally.
    const percent = docs.searchLabDocuments({ ...docs.NO_LAB_DOCUMENT_FILTERS, q: '%' });
    eq(percent.total, 0, 'search: % wildcard escaped (literal match)');
  }

  // ── Equipment / product filters via links ──
  console.log('■ Links');
  {
    const byEquipment = docs.searchLabDocuments({ ...docs.NO_LAB_DOCUMENT_FILTERS, equipment: equipmentId });
    eq(byEquipment.total, 1, 'link filter: equipment NOC-05 → 1');
    eq(byEquipment.rows[0].code, 'SOP-QC-001', 'link filter: equipment row correct');
    const byProduct = docs.searchLabDocuments({ ...docs.NO_LAB_DOCUMENT_FILTERS, product: productId });
    eq(byProduct.total, 1, 'link filter: product → 1 (product_id or PRODUCT link)');

    const eqOptions = docs.listLabDocumentEquipmentOptions();
    ok(eqOptions.some((e) => e.id === equipmentId && e.code === 'NOC-05'), 'dropdown: equipment option present');
    const prodOptions = docs.listLabDocumentProductOptions();
    ok(prodOptions.some((p) => p.id === productId && p.code === 'FIX-CONN'), 'dropdown: product option present');
  }

  // ── Combined filters + has/filtersToQuery ──
  console.log('■ Combined');
  {
    const combined = docs.searchLabDocuments({
      ...docs.NO_LAB_DOCUMENT_FILTERS,
      type: 'SOP',
      status: 'APPROVED',
      owner: managerId,
      review: 'due',
    });
    eq(combined.total, 1, 'combined: type+status+owner+review → 1');

    ok(docs.hasLabDocumentFilters({ ...docs.NO_LAB_DOCUMENT_FILTERS, q: 'x' }), 'has: q active');
    ok(docs.hasLabDocumentFilters({ ...docs.NO_LAB_DOCUMENT_FILTERS, review: 'due' }), 'has: review active');
    ok(!docs.hasLabDocumentFilters(docs.NO_LAB_DOCUMENT_FILTERS), 'has: defaults inactive');

    const qs = docs.labDocumentFiltersToQuery({ ...docs.NO_LAB_DOCUMENT_FILTERS, type: 'SOP', review: 'due', sort: 'code', dir: 'asc' });
    ok(qs.includes('type=SOP'), 'query: type encoded');
    ok(qs.includes('review=due'), 'query: review encoded');
    ok(qs.includes('sort=code'), 'query: sort encoded');
    ok(qs.includes('dir=asc'), 'query: dir encoded');
    eq(docs.labDocumentFiltersToQuery(docs.NO_LAB_DOCUMENT_FILTERS), '', 'query: defaults → empty');
  }

  // ── Parse (invalid values drop silently) ──
  console.log('■ Parse');
  {
    const url = new URL('http://x/lab/documents?type=BAD&status=APPROVED&owner=7&equipment=abc&review=no&sort=hack&dir=sideways&page=3&per=17');
    const f = docs.parseLabDocumentSearchFilters(url);
    eq(f.type, null, 'parse: invalid type dropped');
    eq(f.status, 'APPROVED', 'parse: valid status kept');
    eq(f.owner, 7, 'parse: numeric owner kept');
    eq(f.equipment, null, 'parse: non-numeric equipment dropped');
    eq(f.review, null, 'parse: review != due dropped');
    eq(f.sort, 'updated_at', 'parse: invalid sort → default');
    eq(f.dir, 'desc', 'parse: invalid dir → default');
    eq(f.page, 3, 'parse: page kept');
    eq(f.per_page, 25, 'parse: invalid per_page → default');

    const url2 = new URL('http://x/lab/documents?type=WI&review=due&per=50&q=%20%20');
    const f2 = docs.parseLabDocumentSearchFilters(url2);
    eq(f2.type, 'WI', 'parse: WI type kept');
    eq(f2.review, 'due', 'parse: review=due kept');
    eq(f2.per_page, 50, 'parse: per=50 kept');
    eq(f2.q, null, 'parse: blank q dropped');
  }

  // ── RBAC ──
  console.log('■ RBAC');
  {
    ok(perms.canViewLabDocuments('employee'), 'RBAC: every role views documents');
    ok(perms.canViewLabDocuments('supervisor'), 'RBAC: supervisor views documents');
    ok(perms.canViewLabDocuments('manager'), 'RBAC: manager views documents');
    eq(perms.canCreateLabDocument('employee'), false, 'RBAC: employee cannot create');
    ok(perms.canCreateLabDocument('supervisor'), 'RBAC: supervisor creates');
    ok(perms.canCreateLabDocument('manager'), 'RBAC: manager creates');
    ok(perms.canCreateLabDocument('admin'), 'RBAC: admin creates');
    eq(perms.canEditLabDocument('employee'), false, 'RBAC: employee cannot edit');
    ok(perms.canEditLabDocument('supervisor'), 'RBAC: supervisor edits');
    eq(perms.canApproveLabDocument('supervisor'), false, 'RBAC: supervisor cannot approve');
    ok(perms.canApproveLabDocument('manager'), 'RBAC: manager approves');
  }

  // ── Editor (PROMPT 41): renderer ──
  console.log('■ Renderer');
  const { renderDocumentContent, isSafeLinkUrl } = await import('../src/lib/lab/documentContent.ts');
  {
    const md = `# Step 1 — Setup\n\n1. Switch on the unit.\n2. Press START.\n\n- Bullet A\n- Bullet B\n\n| Column A | Column B |\n| --- | --- |\n| x | y |\n\n> [!WARNING]\n> Keep hands clear.\n\n> [!NOTE]\n> Tester must be certified.\n\n- [x] Done item\n- [ ] Pending item\n\nSee [manual](https://example.com/manual).\n\n<script>alert(1)</script>`;
    const html = renderDocumentContent(md);
    ok(html.includes('<h2>'), 'renderer: heading h2');
    ok(html.includes('<ol>'), 'renderer: numbered steps');
    ok(html.includes('<ul>'), 'renderer: bullet list');
    ok(html.includes('<table>'), 'renderer: table');
    ok(html.includes('doc-callout-warning'), 'renderer: warning callout');
    ok(html.includes('doc-callout-note'), 'renderer: note callout');
    ok(html.includes('doc-checklist'), 'renderer: checklist');
    ok(html.includes('<a href="https://example.com/manual"'), 'renderer: safe link');
    ok(!html.includes('<script>'), 'renderer: script tags escaped, never emitted');
    ok(!html.includes('onerror'), 'renderer: no event handlers');
    ok(html.includes('&lt;script&gt;alert(1)&lt;/script&gt;'), 'renderer: raw HTML shown as escaped text');

    const bare = renderDocumentContent('<img src=x onerror=alert(1)>');
    ok(!bare.includes('<img'), 'renderer: img never emitted');
    ok(bare.includes('&lt;img'), 'renderer: img escaped as text');

    ok(isSafeLinkUrl('https://example.com'), 'link: https allowed');
    ok(isSafeLinkUrl('/relative/path'), 'link: relative allowed');
    ok(isSafeLinkUrl('#anchor'), 'link: anchor allowed');
    ok(isSafeLinkUrl('mailto:lab@example.com'), 'link: mailto allowed');
    ok(!isSafeLinkUrl('javascript:alert(1)'), 'link: javascript: rejected');
    ok(!isSafeLinkUrl('data:text/html,<b>'), 'link: data: rejected');
  }

  // ── Editor: create ──
  console.log('■ Editor create');
  let createdId;
  {
    const formData = {
      type: 'SOP',
      code: 'SOP-QC-100',
      title: 'Editor Created Procedure',
      description: 'Created via the editor.',
      product_id: productId,
      owner_id: supervisorId,
      effective_date: isoDay(0),
      review_due_date: isoDay(180),
      change_summary: 'Initial version.',
      content: '# Title\n\nStep content here.',
      equipment_ids: [equipmentId],
    };
    createdId = docs.createLabDocument(formData, supervisorId);
    ok(Number.isInteger(createdId) && createdId > 0, 'create: returns document id');

    const editor = docs.getLabDocumentEditor(createdId);
    ok(editor, 'create: editor view loads');
    eq(editor.document.status, 'DRAFT', 'create: status DRAFT');
    eq(editor.version.version, 1, 'create: version 1');
    ok(editor.version.content_md.includes('Step content here'), 'create: content stored verbatim');
    ok(editor.version.content_html_sanitized.includes('<h2>'), 'create: sanitized html cache rendered');
    ok(editor.equipment_ids.includes(equipmentId), 'create: equipment link written');

    const audit = db.prepare("SELECT * FROM qc_audit_log WHERE entity_type = 'LAB_DOCUMENT' AND entity_id = ? AND action = 'CREATE'").get(createdId);
    ok(audit, 'create: CREATE audit row written');
    eq(Number(audit.actor_id), supervisorId, 'create: audit actor');

    const listRow = docs.searchLabDocuments(docs.NO_LAB_DOCUMENT_FILTERS).rows.find((r) => r.id === createdId);
    eq(listRow.version, 1, 'create: register shows v1');
    eq(listRow.created_by, supervisorId, 'create: register exposes created_by');
  }

  // ── Editor: duplicate code ──
  console.log('■ Editor duplicate code');
  {
    let threw = false;
    try {
      docs.createLabDocument(
        { type: 'SOP', code: 'SOP-QC-100', title: 'Duplicate', description: null, product_id: null, owner_id: null, effective_date: null, review_due_date: null, change_summary: null, content: 'x', equipment_ids: [] },
        supervisorId,
      );
    } catch (err) {
      threw = err instanceof docs.LabDocumentCodeConflictError;
    }
    ok(threw, 'duplicate: code conflict throws LabDocumentCodeConflictError');
  }

  // ── Editor: in-place update of DRAFT (same version, UPDATE audit) ──
  console.log('■ Editor update (in-place)');
  {
    const before = docs.getLabDocumentEditor(createdId);
    docs.updateLabDocument(
      createdId,
      {
        type: 'SOP',
        code: 'SOP-QC-100',
        title: 'Editor Created Procedure (revised)',
        description: 'Updated in place.',
        product_id: productId,
        owner_id: managerId,
        effective_date: isoDay(1),
        review_due_date: isoDay(181),
        change_summary: null,
        content: '# Title\n\nRevised content.',
        equipment_ids: [],
      },
      supervisorId,
    );
    const after = docs.getLabDocumentEditor(createdId);
    eq(after.version.version, 1, 'update: DRAFT stays version 1');
    ok(after.version.content_md.includes('Revised content'), 'update: content replaced in place');
    eq(after.document.title, 'Editor Created Procedure (revised)', 'update: identity updated');
    eq(after.equipment_ids.length, 0, 'update: equipment links replaced (empty)');
    ok(before.version.content_html_sanitized !== after.version.content_html_sanitized, 'update: html cache refreshed');

    const audit = db.prepare("SELECT * FROM qc_audit_log WHERE entity_type = 'LAB_DOCUMENT' AND entity_id = ? AND action = 'UPDATE'").get(createdId);
    ok(audit, 'update: UPDATE audit row written');
  }

  // ── Editor: approved → new DRAFT version (immutability contract) ──
  console.log('■ Editor versioning (approved → new draft)');
  {
    // Manually approve the created document's current version.
    db.prepare("UPDATE lab_documents SET status = 'APPROVED' WHERE id = ?").run(createdId);
    db.prepare("UPDATE lab_document_versions SET status = 'APPROVED' WHERE document_id = ?").run(createdId);

    // Revising without a change summary must be rejected.
    let threw = false;
    try {
      docs.updateLabDocument(createdId, {
        type: 'SOP',
        code: 'SOP-QC-100',
        title: 'Approved Doc Revise',
        description: null,
        product_id: null,
        owner_id: null,
        effective_date: null,
        review_due_date: null,
        change_summary: '',
        content: 'New approved content.',
        equipment_ids: [],
      }, supervisorId);
    } catch (err) {
      threw = /change summary is required/i.test(err.message);
    }
    ok(threw, 'versioning: change summary required when revising approved');

    const approvedVersionId = docs.getLabDocumentEditor(createdId).version.id;
    docs.updateLabDocument(createdId, {
      type: 'SOP',
      code: 'SOP-QC-100',
      title: 'Approved Doc Revise',
      description: null,
      product_id: null,
      owner_id: null,
      effective_date: null,
      review_due_date: null,
      change_summary: 'Revised per audit finding.',
      content: 'New approved content.',
      equipment_ids: [],
    }, supervisorId);

    const editor = docs.getLabDocumentEditor(createdId);
    eq(editor.document.status, 'DRAFT', 'versioning: document returns to DRAFT');
    eq(editor.version.version, 2, 'versioning: new version 2');
    ok(editor.version.content_md.includes('New approved content'), 'versioning: draft holds revised content');

    // The approved v1 must be untouched.
    const v1 = db.prepare('SELECT * FROM lab_document_versions WHERE id = ?').get(approvedVersionId);
    eq(Number(v1.version), 1, 'versioning: approved v1 version number immutable');
    eq(v1.status, 'APPROVED', 'versioning: approved v1 status immutable');
    ok(!String(v1.content_md).includes('New approved content'), 'versioning: approved v1 content immutable');

    const versionAudit = db
      .prepare("SELECT * FROM qc_audit_log WHERE entity_type = 'LAB_DOCUMENT' AND entity_id = ? AND action = 'VERSION'")
      .get(createdId);
    ok(versionAudit, 'versioning: VERSION audit row written');
  }

  // ── Editor: SUPERSEDED / ARCHIVED are not editable ──
  console.log('■ Editor immutability (superseded/archived)');
  {
    db.prepare("UPDATE lab_documents SET status = 'SUPERSEDED' WHERE id = ?").run(createdId);
    let threw = false;
    try {
      docs.updateLabDocument(createdId, {
        type: 'SOP',
        code: 'SOP-QC-100',
        title: 'x',
        description: null,
        product_id: null,
        owner_id: null,
        effective_date: null,
        review_due_date: null,
        change_summary: 'x',
        content: 'x',
        equipment_ids: [],
      }, supervisorId);
    } catch (err) {
      threw = /cannot be edited/i.test(err.message);
    }
    ok(threw, 'immutability: SUPERSEDED cannot be edited');
    db.prepare("UPDATE lab_documents SET status = 'ARCHIVED' WHERE id = ?").run(createdId);
    threw = false;
    try {
      docs.updateLabDocument(createdId, {
        type: 'SOP',
        code: 'SOP-QC-100',
        title: 'x',
        description: null,
        product_id: null,
        owner_id: null,
        effective_date: null,
        review_due_date: null,
        change_summary: 'x',
        content: 'x',
        equipment_ids: [],
      }, supervisorId);
    } catch (err) {
      threw = /cannot be edited/i.test(err.message);
    }
    ok(threw, 'immutability: ARCHIVED cannot be edited');
  }

  // ── Editor: record-level permission ──
  console.log('■ Editor RBAC (record-level)');
  {
    // Re-create a fresh doc owned by the supervisor (created by supervisor too).
    const ownedId = docs.createLabDocument(
      { type: 'WI', code: 'WI-QC-300', title: 'Supervisor Owned', description: null, product_id: null, owner_id: supervisorId, effective_date: null, review_due_date: null, change_summary: 'Initial.', content: 'Body.', equipment_ids: [] },
      supervisorId,
    );
    const otherDoc = docs.getLabDocumentEditor(ownedId).document;
    ok(perms.canEditLabDocumentRecord({ id: supervisorId, role: 'supervisor' }, otherDoc), 'RBAC: supervisor edits own doc (DRAFT)');
    eq(perms.canEditLabDocumentRecord({ id: managerId, role: 'manager' }, otherDoc), true, 'RBAC: manager edits any doc');

    // Employee can never edit.
    eq(perms.canEditLabDocumentRecord({ id: employeeId, role: 'employee' }, otherDoc), false, 'RBAC: employee never edits docs');
  }
} catch (err) {
  console.error(err);
  process.exitCode = 1;
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) {
  console.log('Failures:');
  for (const f of failures) console.log(`  - ${f}`);
}
process.exitCode = failed > 0 ? 1 : 0;