import { getThemeToken, tryGetThemeToken } from '../theme.js';
import { useBrand } from './useBrand.js';

export function useThemeToken(path: string): string {
  const brand = useBrand();
  return getThemeToken(brand.themeTokens, path);
}

export function useOptionalThemeToken(path: string): string | undefined {
  const brand = useBrand();
  return tryGetThemeToken(brand.themeTokens, path);
}
