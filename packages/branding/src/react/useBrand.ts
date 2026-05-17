import { useContext } from 'react';
import type { BrandIdentity } from '../types.js';
import { BrandContext } from './BrandProvider.js';

export function useBrand(): BrandIdentity {
  const brand = useContext(BrandContext);
  if (!brand) {
    throw new Error('useBrand must be used within a <BrandProvider>');
  }
  return brand;
}

export function useOptionalBrand(): BrandIdentity | null {
  return useContext(BrandContext);
}
