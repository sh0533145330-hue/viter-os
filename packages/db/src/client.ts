import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres, { type Options as PostgresOptions, type Sql } from 'postgres';
import * as schema from './schema/index.js';
import * as relations from './relations.js';

export type DbSchema = typeof schema & typeof relations;

export type Db = PostgresJsDatabase<DbSchema>;

export interface CreateDbOptions {
  max?: number;
  idleTimeoutMs?: number;
  connectTimeoutMs?: number;
  prepare?: boolean;
  ssl?: PostgresOptions<Record<string, never>>['ssl'];
  applicationName?: string;
}

export interface DbHandle {
  db: Db;
  sql: Sql;
  close: () => Promise<void>;
}

export function createDb(connectionString: string, options: CreateDbOptions = {}): DbHandle {
  const {
    max = 10,
    idleTimeoutMs = 30_000,
    connectTimeoutMs = 10_000,
    prepare = false,
    ssl,
    applicationName = 'vita-os',
  } = options;

  const postgresOptions: PostgresOptions<Record<string, never>> = {
    max,
    idle_timeout: Math.ceil(idleTimeoutMs / 1000),
    connect_timeout: Math.ceil(connectTimeoutMs / 1000),
    prepare,
    connection: {
      application_name: applicationName,
    },
  };
  if (ssl !== undefined) postgresOptions.ssl = ssl;
  const sql = postgres(connectionString, postgresOptions);

  const db = drizzle(sql, { schema: { ...schema, ...relations } }) as unknown as Db;

  return {
    db,
    sql,
    close: async () => {
      await sql.end({ timeout: 5 });
    },
  };
}
