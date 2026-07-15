/**
 * @brightai/db — Dev seed
 *
 * Populates the database with realistic dev data for local development:
 *   - 1 organization (Acme Holding — Riyadh)
 *   - 1 owner user (clerkUserId: 'user_seed_owner')
 *   - 1 admin user
 *   - 1 compliance officer
 *   - 1 reviewer
 *   - 1 member
 *   - Compliance frameworks: PDPL, NCA_ECC, ISO_42001
 *   - 3 policies
 *   - 5 sample AI requests (approved/pending/rejected)
 *   - 1 integration (Slack)
 *   - 1 api key (status ACTIVE)
 *   - Onboarding progress at step 3
 *   - 1 verified primary domain (acme.brightai.site)
 *   - 5 audit log entries
 *
 * Idempotent: re-running the seed wipes the seeded org + recreates it.
 * Other orgs are untouched.
 *
 * Usage:
 *   pnpm --filter @brightai/db db:seed
 */

import { PrismaClient } from '@prisma/client';
import { nanoid } from 'nanoid';
import { createHash } from 'node:crypto';

// Uses DATABASE_URL_SERVICE (BYPASSRLS) because the seed needs to
// create orgs + memberships across what would be tenant boundaries.
const prisma = new PrismaClient({
  datasources: {
    db: {
      url:
        process.env.DATABASE_URL_SERVICE ??
        process.env.DATABASE_URL ??
        '',
    },
  },
});

const SEED_ORG_SLUG = 'acme';

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

async function main() {
  console.log('🌱 Seeding BrightAI dev data…\n');

  // ── 0. Wipe previous seed (idempotent)
  console.log('[1/8] Wiping previous seed…');
  await prisma.auditLog.deleteMany({
    where: { organization: { slug: SEED_ORG_SLUG } },
  });
  await prisma.dataDeletionRequest.deleteMany({
    where: { organization: { slug: SEED_ORG_SLUG } },
  });
  await prisma.dataExportRequest.deleteMany({
    where: { organization: { slug: SEED_ORG_SLUG } },
  });
  await prisma.onboardingProgress.deleteMany({
    where: { organization: { slug: SEED_ORG_SLUG } },
  });
  await prisma.apiKey.deleteMany({
    where: { organization: { slug: SEED_ORG_SLUG } },
  });
  await prisma.integration.deleteMany({
    where: { organization: { slug: SEED_ORG_SLUG } },
  });
  await prisma.aIRequest.deleteMany({
    where: { organization: { slug: SEED_ORG_SLUG } },
  });
  await prisma.policy.deleteMany({
    where: { organization: { slug: SEED_ORG_SLUG } },
  });
  await prisma.organizationCompliance.deleteMany({
    where: { organization: { slug: SEED_ORG_SLUG } },
  });
  await prisma.domain.deleteMany({
    where: { organization: { slug: SEED_ORG_SLUG } },
  });
  await prisma.invitation.deleteMany({
    where: { organization: { slug: SEED_ORG_SLUG } },
  });
  await prisma.passkey.deleteMany({
    where: { user: { memberships: { some: { organization: { slug: SEED_ORG_SLUG } } } } },
  });
  await prisma.twoFactorBackupCode.deleteMany({
    where: { user: { memberships: { some: { organization: { slug: SEED_ORG_SLUG } } } } },
  });
  await prisma.session.deleteMany({
    where: { user: { memberships: { some: { organization: { slug: SEED_ORG_SLUG } } } } },
  });
  await prisma.membership.deleteMany({
    where: { organization: { slug: SEED_ORG_SLUG } },
  });
  await prisma.user.deleteMany({
    where: { memberships: { some: { organization: { slug: SEED_ORG_SLUG } } } },
  });
  await prisma.organization.deleteMany({ where: { slug: SEED_ORG_SLUG } });
  console.log('  ✓ done');

  // ── 1. Organization
  console.log('\n[2/8] Creating Acme Holding (Riyadh)…');
  const org = await prisma.organization.create({
    data: {
      slug: SEED_ORG_SLUG,
      name: 'Acme Holding',
      nameAr: 'القابضة',
      crNumber: '1010111222',
      industry: 'BANKING',
      size: 'SIZE_201_500',
      deployment: 'CLOUD',
      timezone: 'Asia/Riyadh',
    },
  });
  console.log(`  ✓ org id=${org.id}`);

  // ── 2. Domain (acme.brightai.site, primary + verified)
  await prisma.domain.create({
    data: {
      organizationId: org.id,
      domain: 'acme.brightai.site',
      isPrimary: true,
      isVerified: true,
      verifiedAt: new Date(),
      verificationToken: hashToken('seed-verification-token'),
      sslStatus: 'SSL_ACTIVE',
      sslIssuedAt: new Date(),
      sslExpiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      cnameTarget: 'proxy.brightai.site',
    },
  });
  console.log('  ✓ acme.brightai.site (verified + SSL active)');

  // ── 3. Users + Memberships
  console.log('\n[3/8] Creating 5 users with RBAC…');
  const users = await Promise.all(
    [
      { id: 'user_seed_owner', name: 'Sara Al-Otaibi', role: 'OWNER' as const, email: '[email protected]' },
      { id: 'user_seed_admin', name: 'Khalid Al-Ghamdi', role: 'ADMIN' as const, email: '[email protected]' },
      { id: 'user_seed_compliance', name: 'Noura Al-Sharif', role: 'COMPLIANCE_OFFICER' as const, email: '[email protected]' },
      { id: 'user_seed_reviewer', name: 'Faisal Al-Harbi', role: 'REVIEWER' as const, email: '[email protected]' },
      { id: 'user_seed_member', name: 'Layla Al-Mutairi', role: 'MEMBER' as const, email: '[email protected]' },
    ].map(async (u) => {
      const user = await prisma.user.create({
        data: {
          clerkUserId: u.id,
          email: u.email,
          fullName: u.name,
          fullNameAr: u.name,
          primaryLocale: 'ar',
          emailVerified: true,
          twoFactorEnabled: u.role === 'OWNER' || u.role === 'ADMIN',
        },
      });
      await prisma.membership.create({
        data: {
          organizationId: org.id,
          userId: user.id,
          role: u.role,
          status: 'ACTIVE',
          joinedAt: new Date(),
          acceptedAt: new Date(),
        },
      });
      return { ...u, dbId: user.id };
    }),
  );
  for (const u of users) console.log(`  ✓ ${u.role.padEnd(20)} ${u.email}`);

  // ── 4. 2FA backup codes for owner + admin
  console.log('\n[4/8] Seeding 2FA backup codes for owner + admin…');
  for (const u of users.filter((u) => u.role === 'OWNER' || u.role === 'ADMIN')) {
    for (let i = 0; i < 10; i++) {
      await prisma.twoFactorBackupCode.create({
        data: {
          userId: u.dbId,
          codeHash: hashToken(`backup-${u.id}-${i}-${nanoid(8)}`),
        },
      });
    }
  }
  console.log('  ✓ 20 codes total (10 owner + 10 admin)');

  // ── 5. Compliance frameworks
  console.log('\n[5/8] Linking compliance frameworks…');
  await prisma.organizationCompliance.createMany({
    data: [
      { organizationId: org.id, framework: 'PDPL', certifiedAt: new Date() },
      { organizationId: org.id, framework: 'NCA_ECC' },
      { organizationId: org.id, framework: 'ISO_42001' },
    ],
  });
  console.log('  ✓ PDPL (certified) + NCA ECC + ISO 42001');

  // ── 6. Policies
  console.log('\n[6/8] Creating 3 policies…');
  const ownerUser = users.find((u) => u.role === 'OWNER')!;
  const policies = await Promise.all(
    [
      { name: 'Allow medical AI assistance', category: 'CUSTOM' as const, status: 'ACTIVE' as const },
      { name: 'Block transfers of customer PII', category: 'DATA_PRIVACY' as const, status: 'ACTIVE' as const },
      { name: 'Require review for financial advice', category: 'ACCESS_CONTROL' as const, status: 'DRAFT' as const },
    ].map((p) =>
      prisma.policy.create({
        data: {
          organizationId: org.id,
          name: p.name,
          nameAr: p.name,
          description: `Auto-seeded policy: ${p.name}`,
          descriptionAr: `سياسة مُولّدة تلقائياً: ${p.name}`,
          category: p.category,
          status: p.status,
          priority: 100,
          createdById: ownerUser.dbId,
          approvedById: p.status === 'ACTIVE' ? ownerUser.dbId : null,
          approvedAt: p.status === 'ACTIVE' ? new Date() : null,
        },
      }),
    ),
  );
  for (const p of policies) console.log(`  ✓ ${p.name} (${p.status})`);

  // ── 7. AI requests + integration + api key + onboarding
  console.log('\n[7/8] Creating sample requests, integration, API key, onboarding…');
  const memberUser = users.find((u) => u.role === 'MEMBER')!;
  const reviewerUser = users.find((u) => u.role === 'REVIEWER')!;

  await prisma.aIRequest.createMany({
    data: [
      { organizationId: org.id, requestedById: memberUser.dbId, prompt: 'لخص تقرير المخاطر', riskLevel: 'LOW', status: 'APPROVED' },
      { organizationId: org.id, requestedById: memberUser.dbId, prompt: 'اقترح استراتيجية استثمارية', riskLevel: 'HIGH', status: 'PENDING' },
      { organizationId: org.id, requestedById: memberUser.dbId, prompt: 'احسب ضريبة القيمة المضافة', riskLevel: 'MEDIUM', status: 'PENDING' },
      { organizationId: org.id, requestedById: memberUser.dbId, prompt: 'مريض يشتكي من صداع', riskLevel: 'MEDIUM', status: 'APPROVED', reviewedById: reviewerUser.dbId, reviewedAt: new Date() },
      { organizationId: org.id, requestedById: memberUser.dbId, prompt: 'شارك بيانات العميل', riskLevel: 'CRITICAL', status: 'REJECTED', reviewedById: reviewerUser.dbId, reviewedAt: new Date(), reviewNotes: 'محظور بموجب PDPL' },
    ],
  });

  await prisma.integration.create({
    data: {
      organizationId: org.id,
      connector: 'SLACK',
      status: 'ACTIVE',
      config: { webhook: 'https://hooks.slack.com/services/T0/B0/XXXXX' },
      lastSyncAt: new Date(),
    },
  });

  const apiKeyPlain = `brk_seed_${nanoid(32)}`;
  await prisma.apiKey.create({
    data: {
      organizationId: org.id,
      name: 'Seed dev key',
      hashedKey: hashToken(apiKeyPlain),
      prefix: apiKeyPlain.slice(0, 12),
      status: 'ACTIVE',
      scopes: ['request:create', 'request:read:own'],
      createdById: ownerUser.dbId,
      lastUsedAt: new Date(),
    },
  });

  await prisma.onboardingProgress.create({
    data: {
      organizationId: org.id,
      currentStep: 'FIRST_INTEGRATION',
      completedSteps: ['ORG_INFO', 'COMPLIANCE_PROFILE', 'TEAM_INVITES'],
      stepData: {
        ORG_INFO: { source: 'seed' },
        COMPLIANCE_PROFILE: { source: 'seed', frameworks: ['PDPL', 'NCA_ECC', 'ISO_42001'] },
        TEAM_INVITES: { source: 'seed', invited: 4, accepted: 4 },
      },
    },
  });
  console.log('  ✓ 5 AI requests + Slack integration + 1 API key + onboarding (step 3/5)');
  console.log(`  📌 Dev API key (save this, won't show again): ${apiKeyPlain}`);

  // ── 8. Audit log
  console.log('\n[8/8] Writing 5 audit log entries…');
  const auditEvents: Array<{ action: 'ORG_CREATED' | 'USER_INVITED' | 'USER_INVITE_ACCEPTED' | 'USER_ROLE_CHANGED' | 'POLICY_APPROVED'; actorId: string | null }> = [
    { action: 'ORG_CREATED', actorId: ownerUser.dbId },
    { action: 'USER_INVITED', actorId: ownerUser.dbId },
    { action: 'USER_INVITE_ACCEPTED', actorId: ownerUser.dbId },
    { action: 'USER_ROLE_CHANGED', actorId: ownerUser.dbId },
    { action: 'POLICY_APPROVED', actorId: ownerUser.dbId },
  ];
  for (const e of auditEvents) {
    await prisma.auditLog.create({
      data: {
        organizationId: org.id,
        actorType: 'USER',
        actorId: e.actorId,
        action: e.action,
        hash: hashToken('127.0.0.1'),
        userAgent: 'seed-script/1.0',
      },
    });
  }
  console.log('  ✓ 5 entries (org_created, invited, accepted, role_changed, policy_approved)');

  console.log('\n✅ Seed complete.\n');
  console.log('Local access:');
  console.log('  http://' + SEED_ORG_SLUG + '.localhost:3000/   (Next.js dashboard, after pnpm dev)');
  console.log('  http://localhost:8025/                    (MailHog, dev email catcher)');
  console.log('  http://localhost:5555/                    (Prisma Studio, after pnpm db:studio)');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
