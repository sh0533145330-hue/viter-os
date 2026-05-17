import type { Config } from 'drizzle-kit';

const databaseUrl = process.env.DATABASE_URL ?? 'postgres://localhost:5432/postgres';

export default {
  dialect: 'postgresql',
  schema: './src/schema/index.ts',
  out: './migrations',
  dbCredentials: {
    url: databaseUrl,
  },
  strict: true,
  verbose: true,
  migrations: {
    prefix: 'timestamp',
    table: '__drizzle_migrations__',
    schema: 'public',
  },
  extensionsFilters: ['postgis'],
  schemaFilter: ['public'],
  tablesFilter: ['*'],
} satisfies Config;
