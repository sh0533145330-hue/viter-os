#!/usr/bin/env tsx
import { createDb } from '../src/client.js';
import { agencies, platforms, users, workspaces, memberships } from '../src/schema/index.js';

async function main(): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL is not set. Aborting seed.');
    process.exit(1);
  }
  const { db, close } = createDb(url);
  try {
    const [platform] = await db
      .insert(platforms)
      .values({ name: 'VitaOS', slug: 'vita' })
      .onConflictDoNothing({ target: platforms.slug })
      .returning();

    if (!platform) {
      console.log('platform already exists; nothing to seed');
      return;
    }

    const [agency] = await db
      .insert(agencies)
      .values({ platformId: platform.id, name: 'Default Agency', slug: 'default' })
      .returning();

    if (!agency) {
      console.log('agency not created; aborting');
      return;
    }

    const [workspace] = await db
      .insert(workspaces)
      .values({
        platformId: platform.id,
        agencyId: agency.id,
        name: 'Dev Workspace',
        slug: 'dev',
      })
      .returning();

    if (!workspace) return;

    const seedUserId = '00000000-0000-0000-0000-000000000001';
    await db
      .insert(users)
      .values({ id: seedUserId, email: 'dev@vita.local', displayName: 'Dev User' })
      .onConflictDoNothing();

    await db
      .insert(memberships)
      .values({
        userId: seedUserId,
        scope: 'workspace',
        scopeId: workspace.id,
        role: 'owner',
        status: 'active',
        acceptedAt: new Date(),
      })
      .onConflictDoNothing();

    console.log('seed complete:', { platform: platform.slug, agency: agency.slug, workspace: workspace.slug });
  } finally {
    await close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
