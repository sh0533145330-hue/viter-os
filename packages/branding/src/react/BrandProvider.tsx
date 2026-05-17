import { type ReactNode, createContext, createElement } from 'react';
import type { BrandIdentity } from '../types.js';

export const BrandContext = createContext<BrandIdentity | null>(null);

export interface BrandProviderProps {
  brand: BrandIdentity;
  children?: ReactNode;
}

export function BrandProvider(props: BrandProviderProps) {
  return createElement(BrandContext.Provider, { value: props.brand }, props.children);
}
