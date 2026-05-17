#!/usr/bin/env tsx
import { readFile, readdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';

const here = dirname(fileURLToPath(import.meta.url));
const pkgRoot = resolve(here, '..');
const migrationsDir = resolve(pkgRoot, 'migrations');
const policiesDir = resolve(pkgRoot, 'src/policies');

async function main(): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL is not set. Aborting migrate.');
    process.exit(1);
  }
  const sql = postgres(url, { max: 1, prepare: false });
  try {
    await sql.unsafe(`
      create table if not exists public.__drizzle_migrations__ (
        id serial primary key,
        hash text not null unique,
        applied_at timestamptz not null default now()
      );
    `);

    const applied = await sql<{ hash: string }[]>`select hash from public.__drizzle_migrations__`;
    const appliedSet = new Set(applied.map((r) => r.hash));

    const files = (await readdir(migrationsDir))
      .filter((f) => f.endsWith('.sql'))
      .sort();

    for (const file of files) {
      if (appliedSet.has(file)) {
        console.log(`skip ${file} (already applied)`);
        continue;
      }
      const path = resolve(migrationsDir, file);
      const content = await readFile(path, 'utf8');
      console.log(`apply ${file}`);
      await sql.unsafe(content);
      await sql`insert into public.__drizzle_migrations__ (hash) values (${file})`;
    }

    const policyFiles = (await readdir(policiesDir).catch(() => []))
      .filter((f) => f.endsWith('.sql'))
      .sort();
    for (const file of policyFiles) {
      const path = resolve(policiesDir, file);
      const content = await readFile(path, 'utf8');
      console.log(`apply policy ${file}`);
      await sql.unsafe(content);
    }
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
