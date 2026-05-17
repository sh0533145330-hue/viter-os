import type { Membership } from '@vita/db';
import type { Db } from '@vita/db/client';
import { agencies, memberships, workspaces } from '@vita/db/schema';
import { and, eq } from 'drizzle-orm';
import type { MembershipClaim, ScopeKind, ScopeRef } from './claims.js';

export interface FetchMembershipsOptions {
  includeSuspended?: boolean;
}

export async function fetchMembershipsForUser(
  db: Db,
  userId: string,
  options: FetchMembershipsOptions = {},
): Promise<Membership[]> {
  const includeSuspended = options.includeSuspended ?? false;
  const rows = await db
    .select()
    .from(memberships)
    .where(
      includeSuspended
        ? eq(memberships.userId, userId)
        : and(eq(memberships.userId, userId), eq(memberships.status, 'active')),
    );
  return rows;
}

export function membershipToClaim(m: Membership): MembershipClaim {
  return {
    kind: m.scope as ScopeKind,
    id: m.scopeId,
    role: m.role,
    scopes: normaliseScopesField(m.scopes),
  };
}

function normaliseScopesField(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((s): s is string => typeof s === 'string');
  return [];
}

export interface ResolvedScopes {
  workspace_ids: string[];
  agency_ids: string[];
  platform_ids: string[];
}

export interface ResolveScopesArgs {
  memberships: MembershipClaim[];
  workspacesByAgency?: Record<string, string[]>;
  workspacesByPlatform?: Record<string, string[]>;
  agenciesByPlatform?: Record<string, string[]>;
}

export function resolveScopes(args: ResolveScopesArgs): ResolvedScopes {
  const workspace_ids = new Set<string>();
  const agency_ids = new Set<string>();
  const platform_ids = new Set<string>();

  for (const m of args.memberships) {
    if (m.kind === 'workspace') workspace_ids.add(m.id);
    if (m.kind === 'agency') {
      agency_ids.add(m.id);
      const ws = args.workspacesByAgency?.[m.id] ?? [];
      for (const w of ws) workspace_ids.add(w);
    }
    if (m.kind === 'platform') {
      platform_ids.add(m.id);
      const ag = args.agenciesByPlatform?.[m.id] ?? [];
      for (const a of ag) agency_ids.add(a);
      const ws = args.workspacesByPlatform?.[m.id] ?? [];
      for (const w of ws) workspace_ids.add(w);
    }
  }

  return {
    workspace_ids: [...workspace_ids],
    agency_ids: [...agency_ids],
    platform_ids: [...platform_ids],
  };
}

export function canActivateScope(scopes: ResolvedScopes, target: ScopeRef): boolean {
  if (target.kind === 'workspace') return scopes.workspace_ids.includes(target.id);
  if (target.kind === 'agency') return scopes.agency_ids.includes(target.id);
  return scopes.platform_ids.includes(target.id);
}

export interface MembershipTopology {
  workspacesByAgency: Record<string, string[]>;
  workspacesByPlatform: Record<string, string[]>;
  agenciesByPlatform: Record<string, string[]>;
}

export async function loadMembershipTopology(db: Db): Promise<MembershipTopology> {
  const [ws, ag] = await Promise.all([
    db
      .select({
        id: workspaces.id,
        agencyId: workspaces.agencyId,
        platformId: workspaces.platformId,
      })
      .from(workspaces),
    db.select({ id: agencies.id, platformId: agencies.platformId }).from(agencies),
  ]);

  const workspacesByAgency: Record<string, string[]> = {};
  const workspacesByPlatform: Record<string, string[]> = {};
  for (const row of ws) {
    if (row.agencyId) {
      const bucket = workspacesByAgency[row.agencyId] ?? [];
      bucket.push(row.id);
      workspacesByAgency[row.agencyId] = bucket;
    }
    const pbucket = workspacesByPlatform[row.platformId] ?? [];
    pbucket.push(row.id);
    workspacesByPlatform[row.platformId] = pbucket;
  }

  const agenciesByPlatform: Record<string, string[]> = {};
  for (const row of ag) {
    const bucket = agenciesByPlatform[row.platformId] ?? [];
    bucket.push(row.id);
    agenciesByPlatform[row.platformId] = bucket;
  }

  return { workspacesByAgency, workspacesByPlatform, agenciesByPlatform };
}
