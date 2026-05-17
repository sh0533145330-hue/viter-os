import { useBrand } from './useBrand.js';

export function useToMName(): string {
  return useBrand().tomName;
}

export function useTimName(): string {
  return useBrand().timName;
}

export function useAgentName(agent: 'tom' | 'tim' | string): string {
  const brand = useBrand();
  if (agent === 'tom') return brand.tomName;
  if (agent === 'tim') return brand.timName;
  return brand.specialistRenames[agent] ?? agent;
}
