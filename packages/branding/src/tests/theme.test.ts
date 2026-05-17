import { describe, expect, it } from 'vitest';
import { defaultBrandIdentity, defaultThemeTokens } from '../identity.js';
import {
  brandToCssBlock,
  getThemeToken,
  mergeThemeTokens,
  themeTokensToCssString,
  themeTokensToCssVariables,
  tryGetThemeToken,
} from '../theme.js';

describe('getThemeToken', () => {
  it('returns the value for a valid path', () => {
    const tokens = defaultThemeTokens();
    expect(getThemeToken(tokens, 'colors.primary')).toBe(tokens.colors.primary);
    expect(getThemeToken(tokens, 'radii.lg')).toBe(tokens.radii.lg);
  });

  it('throws on unknown group', () => {
    expect(() => getThemeToken(defaultThemeTokens(), 'bogus.primary')).toThrow();
  });

  it('throws on unknown key', () => {
    expect(() => getThemeToken(defaultThemeTokens(), 'colors.bogus')).toThrow();
  });

  it('throws on malformed path', () => {
    expect(() => getThemeToken(defaultThemeTokens(), 'colors')).toThrow();
  });
});

describe('tryGetThemeToken', () => {
  it('returns undefined for unknown path', () => {
    expect(tryGetThemeToken(defaultThemeTokens(), 'colors.does-not-exist')).toBeUndefined();
  });

  it('returns the value for a valid path', () => {
    const tokens = defaultThemeTokens();
    expect(tryGetThemeToken(tokens, 'motion.duration')).toBe(tokens.motion.duration);
  });
});

describe('themeTokensToCssVariables', () => {
  it('flattens tokens into CSS variable names', () => {
    const vars = themeTokensToCssVariables(defaultThemeTokens());
    expect(vars['--vita-colors-primary']).toBeDefined();
    expect(vars['--vita-typography-font-family']).toBeDefined();
    expect(vars['--vita-radii-lg']).toBeDefined();
  });

  it('respects a custom prefix', () => {
    const vars = themeTokensToCssVariables(defaultThemeTokens(), '--acme');
    expect(Object.keys(vars).every((k) => k.startsWith('--acme-'))).toBe(true);
  });
});

describe('themeTokensToCssString', () => {
  it('produces a newline-separated declaration list', () => {
    const css = themeTokensToCssString(defaultThemeTokens());
    expect(css).toContain('--vita-colors-primary');
    expect(css).toContain(';');
    expect(css.split('\n').length).toBeGreaterThan(5);
  });
});

describe('brandToCssBlock', () => {
  it('wraps tokens in a selector block', () => {
    const block = brandToCssBlock(defaultBrandIdentity(), ':root');
    expect(block.startsWith(':root {')).toBe(true);
    expect(block.trim().endsWith('}')).toBe(true);
    expect(block).toContain('--vita-colors-primary');
  });
});

describe('mergeThemeTokens', () => {
  it('overlays partial overrides onto base tokens', () => {
    const base = defaultThemeTokens();
    const merged = mergeThemeTokens(base, {
      colors: { ...base.colors, primary: '#FF00FF' },
    });
    expect(merged.colors.primary).toBe('#FF00FF');
    expect(merged.colors.background).toBe(base.colors.background);
    expect(merged.typography.fontFamily).toBe(base.typography.fontFamily);
  });
});
