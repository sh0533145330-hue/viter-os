import type { BrandIdentity, ThemeTokens } from './types.js';

export type ThemeTokenPath =
  | `colors.${keyof ThemeTokens['colors']}`
  | `typography.${keyof ThemeTokens['typography']}`
  | `spacing.${keyof ThemeTokens['spacing']}`
  | `radii.${keyof ThemeTokens['radii']}`
  | `motion.${keyof ThemeTokens['motion']}`;

export function getThemeToken(tokens: ThemeTokens, path: string): string {
  const parts = path.split('.');
  if (parts.length !== 2) {
    throw new Error(`Invalid theme token path "${path}" (expected "<group>.<key>")`);
  }
  const [group, key] = parts as [string, string];
  const groupValue = (tokens as unknown as Record<string, Record<string, string>>)[group];
  if (!groupValue) {
    throw new Error(`Unknown theme token group "${group}"`);
  }
  const value = groupValue[key];
  if (value === undefined) {
    throw new Error(`Unknown theme token "${path}"`);
  }
  return value;
}

export function tryGetThemeToken(tokens: ThemeTokens, path: string): string | undefined {
  const parts = path.split('.');
  if (parts.length !== 2) return undefined;
  const [group, key] = parts as [string, string];
  const groupValue = (tokens as unknown as Record<string, Record<string, string>>)[group];
  if (!groupValue) return undefined;
  return groupValue[key];
}

export function themeTokensToCssVariables(
  tokens: ThemeTokens,
  prefix = '--vita',
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [group, values] of Object.entries(tokens)) {
    for (const [key, value] of Object.entries(values as Record<string, string>)) {
      out[`${prefix}-${kebabCase(group)}-${kebabCase(key)}`] = value;
    }
  }
  return out;
}

export function themeTokensToCssString(tokens: ThemeTokens, prefix = '--vita'): string {
  const vars = themeTokensToCssVariables(tokens, prefix);
  return Object.entries(vars)
    .map(([k, v]) => `${k}: ${v};`)
    .join('\n');
}

export function brandToCssBlock(
  brand: BrandIdentity,
  selector = ':root',
  prefix = '--vita',
): string {
  const body = themeTokensToCssString(brand.themeTokens, prefix);
  return `${selector} {\n${indent(body, '  ')}\n}`;
}

function kebabCase(input: string): string {
  return input.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

function indent(text: string, pad: string): string {
  return text
    .split('\n')
    .map((line) => (line.length === 0 ? line : `${pad}${line}`))
    .join('\n');
}

export function mergeThemeTokens(base: ThemeTokens, override: Partial<ThemeTokens>): ThemeTokens {
  return {
    colors: { ...base.colors, ...(override.colors ?? {}) },
    typography: { ...base.typography, ...(override.typography ?? {}) },
    spacing: { ...base.spacing, ...(override.spacing ?? {}) },
    radii: { ...base.radii, ...(override.radii ?? {}) },
    motion: { ...base.motion, ...(override.motion ?? {}) },
  };
}
