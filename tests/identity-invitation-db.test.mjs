import { randomUUID } from 'node:crypto';
import test from 'node:test';
import assert from 'node:assert/strict';
import pg from 'pg';
import { installSchema, localDatabaseUrl } from './helpers/database.mjs';

// Invitation binding/expiry/replay logic is exercised on a disposable localhost
// database through the owner connection. This is local logic evidence only: the
// production path must run under the NOBYPASSRLS runtime role and the reviewed
// P19 provisioning channel, which is not part of this fixture.
const url = localDatabaseUrl('KERNEL_INVITATION_TEST_DATABASE_URL');

test('AU04 invitation: identity binding, provider acceptance, replay, expiry, cancellation and revoked inviter', { skip: !url }, async () => {
  const pool = new pg.Pool({ connectionString: url, max: 4 });
  try {
    await installSchema(pool);
    process.env.DATABASE_URL = url;
    delete process.env.AIGAS_REQUIRE_RLS;
    delete process.env.NEON_AUTH_BASE_URL; delete process.env.NEON_AUTH_URL;
    delete process.env.NEON_AUTH_JWKS_URL; delete process.env.NEON_JWKS_URL;
    const { incomingInvitations, manageInvitation } = await import('../src/server/kernel/administration.mjs');

    const owner1 = randomUUID(), admin1 = randomUUID(), outsider = randomUUID();
    const invited = randomUUID(), invited2 = randomUUID(), invited3 = randomUUID(), invited4 = randomUUID();
    for (const [id, name] of [[owner1, 'Owner One'], [admin1, 'Admin One'], [outsider, 'Outsider'], [invited, 'Invited One'], [invited2, 'Invited Two'], [invited3, 'Invited Three'], [invited4, 'Invited Four']]) {
      await pool.query('INSERT INTO neon_auth."user"(id,name,email,banned,"emailVerified") VALUES($1,$2,$3,false,true)', [id, name, `${name.toLowerCase().replaceAll(' ', '.')}@example.test`]);
    }
    const a = randomUUID(), b = randomUUID();
    await pool.query("INSERT INTO aigas_tenants(id,name) VALUES($1,'Synthetic A'),($2,'Synthetic B')", [a, b]);
    await pool.query("INSERT INTO aigas_memberships(tenant_id,user_id,role) VALUES($1,$2,'OWNER'),($1,$3,'ADMIN'),($4,$5,'OWNER')", [a, owner1, admin1, b, outsider]);

    const orgA = randomUUID();
    await pool.query('INSERT INTO neon_auth.organization(id,name) VALUES($1,$2)', [orgA, 'Synthetic Org A']);
    await pool.query("INSERT INTO neon_auth.member(id,\"organizationId\",\"userId\",role) VALUES($1,$2,$3,'owner'),($4,$2,$5,'admin')", [randomUUID(), orgA, owner1, randomUUID(), admin1]);
    await pool.query('INSERT INTO aigas_auth_organizations(tenant_id,organization_id,linked_by) VALUES($1,$2,$3)', [a, orgA, owner1]);

    const invite = async (emailUser, inviter, status = 'pending', expiresAt = "now()+interval '1 day'") => {
      const id = randomUUID();
      const email = (await pool.query('SELECT email FROM neon_auth."user" WHERE id=$1', [emailUser])).rows[0].email;
      await pool.query(`INSERT INTO neon_auth.invitation(id,email,status,"expiresAt","organizationId","inviterId",role) VALUES($1,$2,$3,${expiresAt},$4,$5,'member')`, [id, email, status, orgA, inviter]);
      return id;
    };
    const pending = await invite(invited, owner1);
    const second = await invite(invited2, admin1);
    const expired = await invite(invited3, owner1);
    const cancelTarget = await invite(invited4, owner1);
    for (const [inviter, invitationId] of [[owner1, pending], [admin1, second], [owner1, expired], [owner1, cancelTarget]]) {
      assert.equal((await manageInvitation({ userId: inviter }, a, { operation: 'register', invitationId })).persisted, true);
    }

    // Only the signed-in verified email sees its own registered invitation.
    assert.equal((await incomingInvitations({ userId: invited })).invitations.length, 1);
    assert.equal((await incomingInvitations({ userId: invited2 })).invitations.length, 1);
    await assert.rejects(manageInvitation({ userId: invited2 }, null, { operation: 'accept', invitationId: pending }), { status: 403, code: 'INVALID_INVITATION' });

    // Provider acceptance is required before Kernel grants MEMBER.
    await assert.rejects(manageInvitation({ userId: invited }, null, { operation: 'accept', invitationId: pending }), { status: 409, code: 'INVITATION_NOT_ACCEPTED' });
    await pool.query("UPDATE neon_auth.invitation SET status='accepted' WHERE id=$1", [pending]);
    await pool.query("INSERT INTO neon_auth.member(id,\"organizationId\",\"userId\",role) VALUES($1,$2,$3,'member')", [randomUUID(), orgA, invited]);
    assert.deepEqual(await manageInvitation({ userId: invited }, null, { operation: 'accept', invitationId: pending }), { persisted: true, tenantId: a, role: 'MEMBER' });
    // Replay is idempotent and never upgrades the role.
    assert.deepEqual(await manageInvitation({ userId: invited }, null, { operation: 'accept', invitationId: pending }), { persisted: true, tenantId: a, role: 'MEMBER', idempotent: true });

    // A consumed invitation stays consumed after membership revocation.
    await pool.query('DELETE FROM aigas_memberships WHERE tenant_id=$1 AND user_id=$2', [a, invited]);
    await assert.rejects(manageInvitation({ userId: invited }, null, { operation: 'accept', invitationId: pending }), { status: 403, code: 'INVITATION_ALREADY_CONSUMED' });

    // Expired and canceled invitations never grant membership.
    await pool.query("UPDATE neon_auth.invitation SET \"expiresAt\"=now()-interval '1 hour' WHERE id=$1", [expired]);
    await assert.rejects(manageInvitation({ userId: invited3 }, null, { operation: 'accept', invitationId: expired }), { status: 410, code: 'INVITATION_EXPIRED' });
    

    // Losing OWNER/ADMIN ends the pending invitation's authority even if the provider accepted it.
    await pool.query("UPDATE aigas_memberships SET role='MEMBER' WHERE tenant_id=$1 AND user_id=$2", [a, admin1]);
    await pool.query("UPDATE neon_auth.invitation SET status='accepted' WHERE id=$1", [second]);
    await pool.query("INSERT INTO neon_auth.member(id,\"organizationId\",\"userId\",role) VALUES($1,$2,$3,'member')", [randomUUID(), orgA, invited2]);
    await assert.rejects(manageInvitation({ userId: invited2 }, null, { operation: 'accept', invitationId: second }), { status: 403, code: 'INVITER_AUTHORITY_REVOKED' });

    // Cross-tenant cancellation is not found, and a provider-pending invitation cannot be
    // recorded as canceled before the provider confirms it.
    await assert.rejects(manageInvitation({ userId: outsider }, b, { operation: 'cancel', invitationId: cancelTarget }), { status: 404, code: 'INVITATION_NOT_FOUND' });
    await assert.rejects(manageInvitation({ userId: owner1 }, a, { operation: 'cancel', invitationId: cancelTarget }), { status: 409, code: 'CANCELLATION_NOT_CONFIRMED' });
    await pool.query("UPDATE neon_auth.invitation SET status='canceled' WHERE id=$1", [cancelTarget]);
    assert.deepEqual(await manageInvitation({ userId: owner1 }, a, { operation: 'cancel', invitationId: cancelTarget }), { persisted: true, status: 'canceled' });
    await assert.rejects(manageInvitation({ userId: invited4 }, null, { operation: 'accept', invitationId: cancelTarget }), { status: 403, code: 'INVITATION_REVOKED' });

    assert.equal((await pool.query('SELECT count(*)::int AS count FROM aigas_memberships WHERE tenant_id=$1 AND user_id=$2', [a, invited3])).rows[0].count, 0);
    assert.equal((await pool.query('SELECT count(*)::int AS count FROM aigas_memberships WHERE tenant_id=$1 AND user_id=$2', [a, invited4])).rows[0].count, 0);
  } finally {
    await pool.end();
  }
});
