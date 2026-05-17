import { createDb } from '@vita/db/client';
import { agencies, memberships, platforms, users, workspaces } from '@vita/db/schema';
import { sql } from 'drizzle-orm';
import { afterAll, describe, expect, it } from 'vitest';
import { withAsUser, withAsWorkspace } from '../rls-helpers.js';

const SKIP = !process.env.DATABASE_URL;

const WORKSPACE_TABLES = [
  'l0_artifacts',
  'l0_chunks',
  'l1_artifacts',
  'entities',
  'entity_links',
  'entity_actions',
  'pack_deployments',
  'tom_minds',
  'tim_minds',
  'mind_items',
  'mind_proposals',
  'mind_events',
  'objectives',
  'workflow_runs',
  'skill_calls',
  'views',
  'dashboards',
  'boards',
  'view_caches',
  'lineage_edges',
  'derivation_runs',
  'inbox_items',
  'approvals',
  'tom_boundary_acts',
  'agent_runs',
  'training_pairs',
  'agent_tuning_runs',
  'connector_instances',
  'cost_meters',
  'anonymization_audit',
] as const;

describe.skipIf(SKIP)('cross-tenant RLS fuzz harness', () => {
  const handle = createDb(process.env.DATABASE_URL ?? '', { max: 2 });
  const { db, sql: rawSql } = handle;

  afterAll(async () => {
    await handle.close();
  });

  it('isolates reads between two workspaces', async () => {
    const platformRow = await db
      .insert(platforms)
      .values({ name: 'fuzz platform', slug: `fuzz-${Date.now()}` })
      .returning();
    const platformId = platformRow[0]?.id;
    if (!platformId) throw new Error('no platform id');

    const [agencyRow] = await db
      .insert(agencies)
      .values({ platformId, name: 'fuzz agency', slug: `fuzz-agency-${Date.now()}` })
      .returning();
    const agencyId = agencyRow?.id;
    if (!agencyId) throw new Error('no agency id');

    const wsA = await db
      .insert(workspaces)
      .values({ platformId, agencyId, name: 'W1', slug: `w1-${Date.now()}` })
      .returning();
    const wsB = await db
      .insert(workspaces)
      .values({ platformId, agencyId, name: 'W2', slug: `w2-${Date.now()}` })
      .returning();
    const wsAId = wsA[0]?.id;
    const wsBId = wsB[0]?.id;
    if (!wsAId || !wsBId) throw new Error('no workspace ids');

    const userARes = await rawSql`select gen_random_uuid() as id`;
    const userBRes = await rawSql`select gen_random_uuid() as id`;
    const userAId = userARes[0]?.id as string;
    const userBId = userBRes[0]?.id as string;

    await db.insert(users).values([
      { id: userAId, email: `u-a-${userAId}@fuzz.test` },
      { id: userBId, email: `u-b-${userBId}@fuzz.test` },
    ]);
    await db.insert(memberships).values([
      { userId: userAId, scope: 'workspace', scopeId: wsAId, role: 'admin', status: 'active' },
      { userId: userBId, scope: 'workspace', scopeId: wsBId, role: 'admin', status: 'active' },
    ]);

    for (const table of WORKSPACE_TABLES) {
      const result = await withAsUser(db, userAId, async (tx) => {
        return tx.execute(
          sql.raw(`select count(*)::int as n from ${table} where workspace_id = '${wsBId}'`),
        );
      });
      const rows = result as unknown as Array<{ n: number }>;
      const count = rows[0]?.n ?? 0;
      expect(count, `${table} leaked from W2 to W1 user`).toBe(0);
    }

    await withAsWorkspace(db, wsAId, async (tx) => {
      const result = await tx.execute(
        sql.raw(`select count(*)::int as n from workspaces where id = '${wsBId}'`),
      );
      const rows = result as unknown as Array<{ n: number }>;
      expect(rows[0]?.n ?? 0).toBe(0);
    });
  });
});

describe('cross-tenant fuzz harness (table catalog)', () => {
  it('enumerates every workspace-scoped table that must isolate', () => {
    expect(WORKSPACE_TABLES.length).toBeGreaterThan(20);
    expect(new Set(WORKSPACE_TABLES).size).toBe(WORKSPACE_TABLES.length);
  });
});
