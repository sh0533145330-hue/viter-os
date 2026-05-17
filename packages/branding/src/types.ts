import { z } from 'zod';

export const brandScopeSchema = z.enum(['platform', 'agency', 'workspace']);
export type BrandScope = z.infer<typeof brandScopeSchema>;

export const themeColorsSchema = z.object({
  primary: z.string().min(1),
  secondary: z.string().min(1),
  accent: z.string().min(1),
  background: z.string().min(1),
  foreground: z.string().min(1),
  success: z.string().min(1),
  warning: z.string().min(1),
  error: z.string().min(1),
});
export type ThemeColors = z.infer<typeof themeColorsSchema>;

export const themeTypographySchema = z.object({
  fontFamily: z.string().min(1),
  headingFont: z.string().min(1),
  baseFontSize: z.string().min(1),
});
export type ThemeTypography = z.infer<typeof themeTypographySchema>;

export const themeSpacingSchema = z.object({
  unit: z.string().min(1),
});
export type ThemeSpacing = z.infer<typeof themeSpacingSchema>;

export const themeRadiiSchema = z.object({
  sm: z.string().min(1),
  md: z.string().min(1),
  lg: z.string().min(1),
});
export type ThemeRadii = z.infer<typeof themeRadiiSchema>;

export const themeMotionSchema = z.object({
  duration: z.string().min(1),
  easing: z.string().min(1),
});
export type ThemeMotion = z.infer<typeof themeMotionSchema>;

export const themeTokensSchema = z.object({
  colors: themeColorsSchema,
  typography: themeTypographySchema,
  spacing: themeSpacingSchema,
  radii: themeRadiiSchema,
  motion: themeMotionSchema,
});
export type ThemeTokens = z.infer<typeof themeTokensSchema>;

export const slackBotIdentitySchema = z.object({
  name: z.string().min(1),
  displayName: z.string().min(1),
  description: z.string().min(1),
});
export type SlackBotIdentity = z.infer<typeof slackBotIdentitySchema>;

export const legalLinksSchema = z.object({
  tos: z.string().url().optional(),
  privacy: z.string().url().optional(),
  dpa: z.string().url().optional(),
});
export type LegalLinks = z.infer<typeof legalLinksSchema>;

export const brandIdentitySchema = z.object({
  id: z.string().min(1),
  scope: brandScopeSchema,
  scopeId: z.string().min(1),
  displayName: z.string().min(1),
  tomName: z.string().min(1),
  timName: z.string().min(1),
  specialistRenames: z.record(z.string(), z.string()),
  primaryDomain: z.string().min(1).optional(),
  themeTokens: themeTokensSchema,
  logoUrl: z.string().url().optional(),
  faviconUrl: z.string().url().optional(),
  emailSender: z.string().min(1).optional(),
  emailSignature: z.string().optional(),
  voiceIntro: z.string().optional(),
  voiceVoiceId: z.string().min(1).optional(),
  slackBotIdentity: slackBotIdentitySchema.optional(),
  legalLinks: legalLinksSchema.optional(),
  enabled: z.boolean(),
});
export type BrandIdentity = z.infer<typeof brandIdentitySchema>;
