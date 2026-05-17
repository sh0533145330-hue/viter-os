import { describe, expect, it, vi } from 'vitest';
import { defaultBrandIdentity } from '../identity.js';
import { BrandResolver, type BrandResolverDb, type WorkspaceLookup } from '../resolver.js';
import type { BrandIdentity } from '../types.js';

const WS_ID = '00000000-0000-4000-8000-00000000aa01';
const AGENCY_ID = '00000000-0000-4000-8000-00000000bb01';
const PLATFORM_ID = '00000000-0000-4000-8000-00000000cc01';

function makeBrand(overrides: Partial<BrandIdentity>): BrandIdentity {
  return { ...defaultBrandIdentity(), ...overrides };
}

function makeDb(
  lookup: WorkspaceLookup | null,
  brands: Partial<Record<'workspace' | 'agency' | 'platform', BrandIdentity | null>>,
): BrandResolverDb & { calls: { lookup: number; brand: number } } {
  const calls = { lookup: 0, brand: 0 };
  return {
    calls,
    async fetchWorkspaceLookup() {
      calls.lookup += 1;
      return lookup;
    },
    async fetchBrandByScope(scope) {
      calls.brand += 1;
      return brands[scope] ?? null;
    },
  };
}

describe('BrandResolver.resolve', () => {
  it('returns workspace brand when present and enabled', async () => {
    const wsBrand = makeBrand({
      id: 'ws-brand',
      scope: 'workspace',
      scopeId: WS_ID,
      displayName: 'Acme Workspace',
    });
    const db = makeDb(
      { workspaceId: WS_ID, agencyId: AGENCY_ID, platformId: PLATFORM_ID },
      { workspace: wsBrand },
    );
    const resolver = new BrandResolver({ db });
    const brand = await resolver.resolve(WS_ID);
    expect(brand.displayName).toBe('Acme Workspace');
  });

  it('falls back to agency brand when workspace brand missing', async () => {
    const agencyBrand = makeBrand({
      id: 'agency-brand',
      scope: 'agency',
      scopeId: AGENCY_ID,
      displayName: 'Acme Agency',
    });
    const db = makeDb(
      { workspaceId: WS_ID, agencyId: AGENCY_ID, platformId: PLATFORM_ID },
      { workspace: null, agency: agencyBrand },
    );
    const resolver = new BrandResolver({ db });
    const brand = await resolver.resolve(WS_ID);
    expect(brand.displayName).toBe('Acme Agency');
  });

  it('skips disabled workspace brand and falls back', async () => {
    const wsBrand = makeBrand({
      id: 'ws-brand',
      scope: 'workspace',
      scopeId: WS_ID,
      displayName: 'Disabled',
      enabled: false,
    });
    const agencyBrand = makeBrand({
      id: 'agency-brand',
      scope: 'agency',
      scopeId: AGENCY_ID,
      displayName: 'Active Agency',
    });
    const db = makeDb(
      { workspaceId: WS_ID, agencyId: AGENCY_ID, platformId: PLATFORM_ID },
      { workspace: wsBrand, agency: agencyBrand },
    );
    const resolver = new BrandResolver({ db });
    const brand = await resolver.resolve(WS_ID);
    expect(brand.displayName).toBe('Active Agency');
  });

  it('falls back to platform brand when workspace and agency missing', async () => {
    const platformBrand = makeBrand({
      id: 'p-brand',
      scope: 'platform',
      scopeId: PLATFORM_ID,
      displayName: 'Platform Brand',
    });
    const db = makeDb(
      { workspaceId: WS_ID, agencyId: AGENCY_ID, platformId: PLATFORM_ID },
      { platform: platformBrand },
    );
    const resolver = new BrandResolver({ db });
    const brand = await resolver.resolve(WS_ID);
    expect(brand.displayName).toBe('Platform Brand');
  });

  it('returns built-in default when nothing configured', async () => {
    const db = makeDb({ workspaceId: WS_ID, agencyId: null, platformId: PLATFORM_ID }, {});
    const resolver = new BrandResolver({ db });
    const brand = await resolver.resolve(WS_ID);
    expect(brand).toEqual(defaultBrandIdentity());
  });

  it('returns default when workspace lookup returns null', async () => {
    const db = makeDb(null, {});
    const warn = vi.fn();
    const resolver = new BrandResolver({
      db,
      logger: { debug: vi.fn(), info: vi.fn(), warn, error: vi.fn() },
    });
    const brand = await resolver.resolve(WS_ID);
    expect(brand).toEqual(defaultBrandIdentity());
    expect(warn).toHaveBeenCalled();
  });

  it('does not query agency brand when agency missing', async () => {
    const platformBrand = makeBrand({
      id: 'p-brand',
      scope: 'platform',
      scopeId: PLATFORM_ID,
      displayName: 'Platform',
    });
    const db = makeDb(
      { workspaceId: WS_ID, agencyId: null, platformId: PLATFORM_ID },
      { platform: platformBrand },
    );
    const resolver = new BrandResolver({ db });
    await resolver.resolve(WS_ID);
    expect(db.calls.brand).toBe(2);
  });
});

describe('BrandResolver caching', () => {
  it('caches resolved brand within TTL', async () => {
    const wsBrand = makeBrand({ scope: 'workspace', scopeId: WS_ID, displayName: 'Cached' });
    const db = makeDb(
      { workspaceId: WS_ID, agencyId: null, platformId: PLATFORM_ID },
      { workspace: wsBrand },
    );
    const resolver = new BrandResolver({ db, defaultTtlMs: 60_000 });
    const a = await resolver.resolveCached(WS_ID);
    const b = await resolver.resolveCached(WS_ID);
    expect(a).toBe(b);
    expect(db.calls.lookup).toBe(1);
  });

  it('refetches after invalidate()', async () => {
    const wsBrand = makeBrand({ scope: 'workspace', scopeId: WS_ID, displayName: 'V1' });
    const db = makeDb(
      { workspaceId: WS_ID, agencyId: null, platformId: PLATFORM_ID },
      { workspace: wsBrand },
    );
    const resolver = new BrandResolver({ db, defaultTtlMs: 60_000 });
    await resolver.resolveCached(WS_ID);
    expect(resolver.has(WS_ID)).toBe(true);
    resolver.invalidate(WS_ID);
    expect(resolver.has(WS_ID)).toBe(false);
    await resolver.resolveCached(WS_ID);
    expect(db.calls.lookup).toBe(2);
  });

  it('respects custom ttl', async () => {
    const wsBrand = makeBrand({ scope: 'workspace', scopeId: WS_ID });
    const db = makeDb(
      { workspaceId: WS_ID, agencyId: null, platformId: PLATFORM_ID },
      { workspace: wsBrand },
    );
    const resolver = new BrandResolver({ db });
    await resolver.resolveCached(WS_ID, 1);
    await new Promise((r) => setTimeout(r, 5));
    await resolver.resolveCached(WS_ID, 1);
    expect(db.calls.lookup).toBe(2);
  });
});
