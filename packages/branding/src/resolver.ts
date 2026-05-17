import { defaultBrandIdentity } from './identity.js';
import type { BrandIdentity } from './types.js';

export interface BrandResolverLogger {
  debug(obj: Record<string, unknown> | string, msg?: string): void;
  info(obj: Record<string, unknown> | string, msg?: string): void;
  warn(obj: Record<string, unknown> | string, msg?: string): void;
  error(obj: Record<string, unknown> | string, msg?: string): void;
}

export interface WorkspaceLookup {
  workspaceId: string;
  agencyId: string | null;
  platformId: string;
}

export interface BrandResolverDb {
  fetchWorkspaceLookup(workspaceId: string): Promise<WorkspaceLookup | null>;
  fetchBrandByScope(
    scope: 'workspace' | 'agency' | 'platform',
    scopeId: string,
  ): Promise<BrandIdentity | null>;
}

export interface BrandResolverOptions {
  db: BrandResolverDb;
  cache?: Map<string, CacheEntry>;
  logger?: BrandResolverLogger;
  defaultTtlMs?: number;
}

interface CacheEntry {
  brand: BrandIdentity;
  expiresAt: number;
}

const DEFAULT_TTL_MS = 5 * 60 * 1000;

export class BrandResolver {
  private readonly db: BrandResolverDb;
  private readonly cache: Map<string, CacheEntry>;
  private readonly logger: BrandResolverLogger | undefined;
  private readonly defaultTtlMs: number;

  constructor(opts: BrandResolverOptions) {
    this.db = opts.db;
    this.cache = opts.cache ?? new Map();
    this.logger = opts.logger;
    this.defaultTtlMs = opts.defaultTtlMs ?? DEFAULT_TTL_MS;
  }

  async resolve(workspaceId: string): Promise<BrandIdentity> {
    const lookup = await this.db.fetchWorkspaceLookup(workspaceId);
    if (!lookup) {
      this.logger?.warn({ workspaceId }, 'brand_resolver: workspace not found, using default');
      return defaultBrandIdentity();
    }

    const workspaceBrand = await this.db.fetchBrandByScope('workspace', lookup.workspaceId);
    if (workspaceBrand?.enabled) {
      return workspaceBrand;
    }

    if (lookup.agencyId) {
      const agencyBrand = await this.db.fetchBrandByScope('agency', lookup.agencyId);
      if (agencyBrand?.enabled) {
        return agencyBrand;
      }
    }

    const platformBrand = await this.db.fetchBrandByScope('platform', lookup.platformId);
    if (platformBrand?.enabled) {
      return platformBrand;
    }

    return defaultBrandIdentity();
  }

  async resolveCached(workspaceId: string, ttlMs?: number): Promise<BrandIdentity> {
    const now = Date.now();
    const entry = this.cache.get(workspaceId);
    if (entry && entry.expiresAt > now) {
      return entry.brand;
    }
    const brand = await this.resolve(workspaceId);
    const effectiveTtl = ttlMs ?? this.defaultTtlMs;
    this.cache.set(workspaceId, { brand, expiresAt: now + effectiveTtl });
    return brand;
  }

  invalidate(workspaceId: string): void {
    this.cache.delete(workspaceId);
  }

  invalidateAll(): void {
    this.cache.clear();
  }

  has(workspaceId: string): boolean {
    const entry = this.cache.get(workspaceId);
    if (!entry) return false;
    return entry.expiresAt > Date.now();
  }
}
