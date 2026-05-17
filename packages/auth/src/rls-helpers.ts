import type { Db } from '@vita/db/client';
import { sql } from 'drizzle-orm';
import type { VitaJwtClaims } from './claims.js';

export interface RlsSessionContext {
  userId?: string;
  workspaceId?: string;
  agencyId?: string;
  platformId?: string;
  role?: string;
  claims?: VitaJwtClaims;
}

function buildClaimJson(ctx: RlsSessionContext): string {
  const payload: Record<string, unknown> = {};
  if (ctx.userId) payload.sub = ctx.userId;
  if (ctx.workspaceId) payload.workspace_id = ctx.workspaceId;
  if (ctx.agencyId) payload.agency_id = ctx.agencyId;
  if (ctx.platformId) payload.platform_id = ctx.platformId;
  if (ctx.role) payload.role = ctx.role;
  if (ctx.claims) Object.assign(payload, ctx.claims);
  return JSON.stringify(payload);
}

export type TxLike = Parameters<Db['transaction']>[0] extends (tx: infer T) => unknown ? T : Db;

export async function withRlsContext<T>(
  db: Db,
  ctx: RlsSessionContext,
  fn: (tx: TxLike) => Promise<T>,
): Promise<T> {
  return db.transaction(async (tx) => {
    const claimJson = buildClaimJson(ctx);
    await tx.execute(sql`select set_config('request.jwt.claims', ${claimJson}, true)`);
    if (ctx.userId) {
      await tx.execute(sql`select set_config('request.jwt.claim.sub', ${ctx.userId}, true)`);
    }
    if (ctx.workspaceId) {
      await tx.execute(sql`select set_config('vita.workspace_id', ${ctx.workspaceId}, true)`);
    }
    if (ctx.agencyId) {
      await tx.execute(sql`select set_config('vita.agency_id', ${ctx.agencyId}, true)`);
    }
    if (ctx.platformId) {
      await tx.execute(sql`select set_config('vita.platform_id', ${ctx.platformId}, true)`);
    }
    return fn(tx as TxLike);
  });
}

export async function withAsUser<T>(
  db: Db,
  userId: string,
  fn: (tx: TxLike) => Promise<T>,
): Promise<T> {
  return withRlsContext(db, { userId }, fn);
}

export async function withAsWorkspace<T>(
  db: Db,
  workspaceId: string,
  fn: (tx: TxLike) => Promise<T>,
  extras: Omit<RlsSessionContext, 'workspaceId'> = {},
): Promise<T> {
  return withRlsContext(db, { ...extras, workspaceId }, fn);
}

export async function withAsClaims<T>(
  db: Db,
  claims: VitaJwtClaims,
  fn: (tx: TxLike) => Promise<T>,
): Promise<T> {
  const ctx: RlsSessionContext = {
    userId: claims.sub,
    claims,
    ...(claims.active_scope.kind === 'workspace' ? { workspaceId: claims.active_scope.id } : {}),
    ...(claims.active_scope.kind === 'agency' ? { agencyId: claims.active_scope.id } : {}),
    ...(claims.active_scope.kind === 'platform' ? { platformId: claims.active_scope.id } : {}),
  };
  return withRlsContext(db, ctx, fn);
}
