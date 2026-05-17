import type { BrandIdentity } from './types.js';

export type LegalLinkKey = 'tos' | 'privacy' | 'dpa';

export interface LegalLinkOverrides {
  tos?: string;
  privacy?: string;
  dpa?: string;
}

const PLATFORM_LEGAL_LINKS: Record<LegalLinkKey, string> = {
  tos: 'https://vitaos.app/legal/terms',
  privacy: 'https://vitaos.app/legal/privacy',
  dpa: 'https://vitaos.app/legal/dpa',
};

export class LegalLinkResolver {
  private readonly platform: Record<LegalLinkKey, string>;

  constructor(platformOverrides: LegalLinkOverrides = {}) {
    this.platform = {
      tos: platformOverrides.tos ?? PLATFORM_LEGAL_LINKS.tos,
      privacy: platformOverrides.privacy ?? PLATFORM_LEGAL_LINKS.privacy,
      dpa: platformOverrides.dpa ?? PLATFORM_LEGAL_LINKS.dpa,
    };
  }

  resolve(brand: BrandIdentity, key: LegalLinkKey): string {
    const fromBrand = brand.legalLinks?.[key];
    if (fromBrand && fromBrand.length > 0) return fromBrand;
    return this.platform[key];
  }

  resolveAll(brand: BrandIdentity): Record<LegalLinkKey, string> {
    return {
      tos: this.resolve(brand, 'tos'),
      privacy: this.resolve(brand, 'privacy'),
      dpa: this.resolve(brand, 'dpa'),
    };
  }

  poweredByLabel(brand: BrandIdentity): string {
    if (brand.scope === 'platform') return `© ${brand.displayName}`;
    return `${brand.displayName} · Powered by VitaOS`;
  }
}

export function platformLegalLinks(): Record<LegalLinkKey, string> {
  return { ...PLATFORM_LEGAL_LINKS };
}
