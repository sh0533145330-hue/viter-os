export type {
  BrandIdentity,
  BrandScope,
  LegalLinks,
  SlackBotIdentity,
  ThemeColors,
  ThemeMotion,
  ThemeRadii,
  ThemeSpacing,
  ThemeTokens,
  ThemeTypography,
} from './types.js';

export {
  brandIdentitySchema,
  brandScopeSchema,
  legalLinksSchema,
  slackBotIdentitySchema,
  themeColorsSchema,
  themeMotionSchema,
  themeRadiiSchema,
  themeSpacingSchema,
  themeTokensSchema,
  themeTypographySchema,
} from './types.js';

export {
  PLATFORM_BRAND_ID,
  brandIdentityFromRow,
  defaultBrandIdentity,
  defaultThemeTokens,
  parseBrandIdentity,
  safeParseBrandIdentity,
} from './identity.js';
export type { BrandIdentityRow } from './identity.js';

export {
  brandToCssBlock,
  getThemeToken,
  mergeThemeTokens,
  themeTokensToCssString,
  themeTokensToCssVariables,
  tryGetThemeToken,
} from './theme.js';
export type { ThemeTokenPath } from './theme.js';

export { BrandResolver } from './resolver.js';
export type {
  BrandResolverDb,
  BrandResolverLogger,
  BrandResolverOptions,
  WorkspaceLookup,
} from './resolver.js';

export { AgentRenamer } from './renamer.js';

export {
  checkDnsVerification,
  generateDnsRecords,
  generateVerificationToken,
  provisionCert,
  validateDomain,
} from './domains.js';
export type {
  CertProvisionResult,
  CustomDomain,
  DnsLookup,
  DnsRecord,
  DomainValidation,
} from './domains.js';

export {
  buildEmailFromHeader,
  buildEmailSignature,
  extractEmailDomain,
  generateDkimRecords,
  generateDmarcRecord,
  generateSpfRecord,
} from './email-identity.js';
export type { DkimSelector, EmailDnsRecord } from './email-identity.js';

export { buildVoiceIntro, resolveVoiceId } from './voice-identity.js';
export type { BuildVoiceIntroOptions } from './voice-identity.js';

export { generateSlackManifest, resolveSlackBotIdentity } from './slack-identity.js';
export type { SlackManifestOptions } from './slack-identity.js';

export { LegalLinkResolver, platformLegalLinks } from './legal.js';
export type { LegalLinkKey, LegalLinkOverrides } from './legal.js';

export const VERSION = '0.1.0';
