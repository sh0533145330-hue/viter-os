import { type BrandIdentity, type ThemeTokens, brandIdentitySchema } from './types.js';

export const PLATFORM_BRAND_ID = '00000000-0000-0000-0000-000000000000';

export function defaultThemeTokens(): ThemeTokens {
  return {
    colors: {
      primary: '#4F46E5',
      secondary: '#0EA5E9',
      accent: '#F59E0B',
      background: '#FFFFFF',
      foreground: '#0F172A',
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
    },
    typography: {
      fontFamily: 'Inter, system-ui, sans-serif',
      headingFont: 'Inter, system-ui, sans-serif',
      baseFontSize: '16px',
    },
    spacing: {
      unit: '4px',
    },
    radii: {
      sm: '4px',
      md: '8px',
      lg: '16px',
    },
    motion: {
      duration: '200ms',
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
  };
}

export function defaultBrandIdentity(): BrandIdentity {
  return {
    id: PLATFORM_BRAND_ID,
    scope: 'platform',
    scopeId: PLATFORM_BRAND_ID,
    displayName: 'VitaOS',
    tomName: 'Tom',
    timName: 'Tim',
    specialistRenames: {},
    themeTokens: defaultThemeTokens(),
    enabled: true,
  };
}

export function parseBrandIdentity(input: unknown): BrandIdentity {
  return brandIdentitySchema.parse(input);
}

export function safeParseBrandIdentity(
  input: unknown,
): { ok: true; brand: BrandIdentity } | { ok: false; error: string } {
  const result = brandIdentitySchema.safeParse(input);
  if (result.success) return { ok: true, brand: result.data };
  return { ok: false, error: result.error.message };
}

export interface BrandIdentityRow {
  id: string;
  scope: 'platform' | 'agency' | 'workspace';
  scopeId: string | null;
  displayName: string;
  tomName: string;
  timName: string;
  specialistRenames: unknown;
  primaryDomain: string | null;
  themeTokens: unknown;
  logoUrl: string | null;
  faviconUrl: string | null;
  emailSender: string | null;
  emailSignature: string | null;
  voiceIntro: string | null;
  voiceVoiceId: string | null;
  slackBotIdentity: unknown;
  legalLinks: unknown;
  enabled: boolean;
}

export function brandIdentityFromRow(row: BrandIdentityRow): BrandIdentity {
  const themeTokens = isThemeTokens(row.themeTokens) ? row.themeTokens : defaultThemeTokens();

  const specialistRenames = toStringRecord(row.specialistRenames);
  const slackBotIdentity = toSlackBotIdentity(row.slackBotIdentity);
  const legalLinks = toLegalLinks(row.legalLinks);

  const brand: BrandIdentity = {
    id: row.id,
    scope: row.scope,
    scopeId: row.scopeId ?? PLATFORM_BRAND_ID,
    displayName: row.displayName,
    tomName: row.tomName,
    timName: row.timName,
    specialistRenames,
    themeTokens,
    enabled: row.enabled,
  };

  if (row.primaryDomain) brand.primaryDomain = row.primaryDomain;
  if (row.logoUrl) brand.logoUrl = row.logoUrl;
  if (row.faviconUrl) brand.faviconUrl = row.faviconUrl;
  if (row.emailSender) brand.emailSender = row.emailSender;
  if (row.emailSignature) brand.emailSignature = row.emailSignature;
  if (row.voiceIntro) brand.voiceIntro = row.voiceIntro;
  if (row.voiceVoiceId) brand.voiceVoiceId = row.voiceVoiceId;
  if (slackBotIdentity) brand.slackBotIdentity = slackBotIdentity;
  if (legalLinks) brand.legalLinks = legalLinks;

  return brand;
}

function isThemeTokens(value: unknown): value is ThemeTokens {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.colors === 'object' &&
    typeof record.typography === 'object' &&
    typeof record.spacing === 'object' &&
    typeof record.radii === 'object' &&
    typeof record.motion === 'object'
  );
}

function toStringRecord(value: unknown): Record<string, string> {
  if (!value || typeof value !== 'object') return {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (typeof v === 'string') out[k] = v;
  }
  return out;
}

function toSlackBotIdentity(value: unknown): BrandIdentity['slackBotIdentity'] | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const r = value as Record<string, unknown>;
  if (
    typeof r.name !== 'string' ||
    typeof r.displayName !== 'string' ||
    typeof r.description !== 'string'
  ) {
    return undefined;
  }
  return { name: r.name, displayName: r.displayName, description: r.description };
}

function toLegalLinks(value: unknown): BrandIdentity['legalLinks'] | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const r = value as Record<string, unknown>;
  const links: NonNullable<BrandIdentity['legalLinks']> = {};
  if (typeof r.tos === 'string') links.tos = r.tos;
  if (typeof r.privacy === 'string') links.privacy = r.privacy;
  if (typeof r.dpa === 'string') links.dpa = r.dpa;
  if (Object.keys(links).length === 0) return undefined;
  return links;
}
