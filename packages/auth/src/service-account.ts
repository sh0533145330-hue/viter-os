import type { ApiKey, ServiceAccount } from '@vita/db';
import type { Db } from '@vita/db/client';
import { apiKeys, serviceAccounts } from '@vita/db/schema';
import { and, eq, isNull } from 'drizzle-orm';
import {
  type GeneratedApiKey,
  extractApiKeyPrefix,
  generateApiKey,
  verifyApiKey,
} from './api-keys.js';
import type { ScopeKind, ScopeRef } from './claims.js';

export interface CreateServiceAccountInput {
  scope: ScopeKind;
  scopeId: string | null;
  label: string;
  scopes?: string[];
  createdBy?: string | null;
  metadata?: Record<string, unknown>;
}

export async function createServiceAccount(
  db: Db,
  input: CreateServiceAccountInput,
): Promise<ServiceAccount> {
  const [row] = await db
    .insert(serviceAccounts)
    .values({
      scope: input.scope,
      scopeId: input.scopeId,
      label: input.label,
      scopes: input.scopes ?? [],
      createdBy: input.createdBy ?? null,
      metadata: input.metadata ?? {},
    })
    .returning();
  if (!row) throw new Error('service account insert returned no row');
  return row;
}

export interface ListServiceAccountsFilter {
  scope?: ScopeKind;
  scopeId?: string | null;
  includeDeleted?: boolean;
}

export async function listServiceAccounts(
  db: Db,
  filter: ListServiceAccountsFilter = {},
): Promise<ServiceAccount[]> {
  const conditions = [] as ReturnType<typeof eq>[];
  if (filter.scope !== undefined) conditions.push(eq(serviceAccounts.scope, filter.scope));
  if (filter.scopeId !== undefined && filter.scopeId !== null) {
    conditions.push(eq(serviceAccounts.scopeId, filter.scopeId));
  }
  if (!filter.includeDeleted) conditions.push(isNull(serviceAccounts.deletedAt) as never);
  const where =
    conditions.length === 0
      ? undefined
      : conditions.length === 1
        ? conditions[0]
        : and(...conditions);
  const query = db.select().from(serviceAccounts);
  return where ? await query.where(where) : await query;
}

export async function revokeServiceAccount(db: Db, id: string): Promise<void> {
  await db
    .update(serviceAccounts)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(eq(serviceAccounts.id, id));
  await db
    .update(apiKeys)
    .set({ status: 'revoked', revokedAt: new Date(), updatedAt: new Date() })
    .where(eq(apiKeys.createdBy, id));
}

export interface IssueApiKeyForScopeInput {
  scope: ScopeRef;
  label: string;
  scopes?: string[];
  createdBy?: string | null;
  expiresAt?: Date | null;
  environment?: 'live' | 'test';
}

export interface IssuedApiKeyRecord {
  apiKey: ApiKey;
  raw: string;
}

export async function issueApiKey(
  db: Db,
  input: IssueApiKeyForScopeInput,
): Promise<IssuedApiKeyRecord> {
  const generated: GeneratedApiKey = generateApiKey({
    ...(input.environment !== undefined ? { environment: input.environment } : {}),
  });
  const [row] = await db
    .insert(apiKeys)
    .values({
      scope: input.scope.kind,
      scopeId: input.scope.id,
      hashed: generated.hashed,
      prefix: `${generated.prefix}${generated.publicId}`,
      label: input.label,
      scopes: input.scopes ?? [],
      createdBy: input.createdBy ?? null,
      ...(input.expiresAt !== undefined ? { expiresAt: input.expiresAt } : {}),
    })
    .returning();
  if (!row) throw new Error('api key insert returned no row');
  return { apiKey: row, raw: generated.raw };
}

export async function lookupApiKey(db: Db, raw: string): Promise<ApiKey | null> {
  const head = extractApiKeyPrefix(raw);
  if (!head) return null;
  const prefixed = `${head.prefix}${head.publicId}`;
  const rows = await db
    .select()
    .from(apiKeys)
    .where(and(eq(apiKeys.prefix, prefixed), eq(apiKeys.status, 'active')));
  for (const row of rows) {
    if (verifyApiKey(raw, row.hashed)) return row;
  }
  return null;
}

export async function touchApiKeyUsage(db: Db, id: string): Promise<void> {
  await db.update(apiKeys).set({ lastUsedAt: new Date() }).where(eq(apiKeys.id, id));
}

export async function revokeApiKey(db: Db, id: string): Promise<void> {
  await db
    .update(apiKeys)
    .set({ status: 'revoked', revokedAt: new Date(), updatedAt: new Date() })
    .where(eq(apiKeys.id, id));
}
