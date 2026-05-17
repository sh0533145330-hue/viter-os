import { z } from 'zod';

export const testWorkspaceSchema = z.object({
  id: z.string(),
  platformId: z.string(),
  agencyId: z.string().nullable(),
  name: z.string(),
  slug: z.string(),
  verticalPackId: z.string().nullable(),
  settings: z.record(z.unknown()).default({}),
  createdAt: z.string(),
});
export type TestWorkspace = z.infer<typeof testWorkspaceSchema>;

export const testUserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  displayName: z.string().nullable(),
  locale: z.string().default('en-US'),
  timezone: z.string().default('UTC'),
  createdAt: z.string(),
});
export type TestUser = z.infer<typeof testUserSchema>;

/**
 * Minimal pg-like row writer interface used by fixtures. Implementations may
 * back this with drizzle, raw pg, or an in-memory map for unit tests.
 */
export interface FixtureWriter {
  insert<T extends Record<string, unknown>>(table: string, row: T): Promise<T> | T;
}

export interface CreateTestWorkspaceOptions {
  readonly platformId?: string;
  readonly agencyId?: string | null;
  readonly name?: string;
  readonly slug?: string;
  readonly verticalPackId?: string | null;
  readonly settings?: Record<string, unknown>;
  readonly seed?: number;
}

let workspaceCounter = 0;

export function _resetWorkspaceCounter(): void {
  workspaceCounter = 0;
}

function newId(prefix: string): string {
  workspaceCounter += 1;
  return `${prefix}_${workspaceCounter.toString().padStart(6, '0')}`;
}

/**
 * Build a deterministic, schema-valid TestWorkspace. When `writer` is provided
 * the row is also persisted via writer.insert('workspaces', ...).
 */
export async function createTestWorkspace(
  options: CreateTestWorkspaceOptions = {},
  writer?: FixtureWriter,
): Promise<TestWorkspace> {
  const idSeed = options.seed !== undefined ? options.seed : ++workspaceCounter;
  const id = `ws_${idSeed.toString().padStart(6, '0')}`;
  const ws: TestWorkspace = testWorkspaceSchema.parse({
    id,
    platformId: options.platformId ?? 'platform_default',
    agencyId: options.agencyId === undefined ? null : options.agencyId,
    name: options.name ?? `Test Workspace ${idSeed}`,
    slug: options.slug ?? `test-ws-${idSeed}`,
    verticalPackId: options.verticalPackId === undefined ? null : options.verticalPackId,
    settings: options.settings ?? {},
    createdAt: new Date(0).toISOString(),
  });
  if (writer) await writer.insert('workspaces', ws);
  return ws;
}

export interface CreateTestUserOptions {
  readonly email?: string;
  readonly displayName?: string | null;
  readonly locale?: string;
  readonly timezone?: string;
  readonly seed?: number;
}

export async function createTestUser(
  options: CreateTestUserOptions = {},
  writer?: FixtureWriter,
): Promise<TestUser> {
  const idSeed = options.seed ?? newId('seed');
  const id = `user_${typeof idSeed === 'number' ? idSeed.toString().padStart(6, '0') : idSeed}`;
  const email = options.email ?? `${id}@example.com`;
  const user: TestUser = testUserSchema.parse({
    id,
    email,
    displayName: options.displayName ?? null,
    locale: options.locale ?? 'en-US',
    timezone: options.timezone ?? 'UTC',
    createdAt: new Date(0).toISOString(),
  });
  if (writer) await writer.insert('users', user);
  return user;
}
