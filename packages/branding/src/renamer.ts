import type { BrandIdentity } from './types.js';

const DEFAULT_TOM = 'Tom';
const DEFAULT_TIM = 'Tim';

export class AgentRenamer {
  private readonly brand: BrandIdentity;
  private readonly canonical: Map<string, string>;

  constructor(brand: BrandIdentity) {
    this.brand = brand;
    this.canonical = new Map<string, string>();
    this.canonical.set(DEFAULT_TOM.toLowerCase(), brand.tomName);
    this.canonical.set(DEFAULT_TIM.toLowerCase(), brand.timName);
    this.canonical.set(brand.tomName.toLowerCase(), brand.tomName);
    this.canonical.set(brand.timName.toLowerCase(), brand.timName);
    for (const [original, replacement] of Object.entries(brand.specialistRenames)) {
      this.canonical.set(original.toLowerCase(), replacement);
    }
  }

  rename(originalName: string): string {
    if (!originalName) return originalName;
    const key = originalName.toLowerCase();
    const mapped = this.canonical.get(key);
    if (mapped !== undefined) return mapped;
    return originalName;
  }

  applyToText(text: string): string {
    if (!text) return text;
    const replacements: Array<[RegExp, string]> = [];
    const seen = new Set<string>();

    const addReplacement = (from: string, to: string) => {
      const key = from.toLowerCase();
      if (seen.has(key) || from === to) return;
      seen.add(key);
      const escaped = escapeRegex(from);
      replacements.push([new RegExp(`\\b${escaped}\\b`, 'gi'), to]);
    };

    addReplacement(DEFAULT_TOM, this.brand.tomName);
    addReplacement(DEFAULT_TIM, this.brand.timName);
    for (const [original, replacement] of Object.entries(this.brand.specialistRenames)) {
      const titled = capitalizeFirst(original);
      addReplacement(titled, replacement);
    }

    let out = text;
    for (const [re, to] of replacements) {
      out = out.replace(re, to);
    }
    return out;
  }

  promptHints(): string {
    const lines: string[] = [];
    if (this.brand.tomName !== DEFAULT_TOM) {
      lines.push(`- Tom is named "${this.brand.tomName}" in this workspace.`);
    }
    if (this.brand.timName !== DEFAULT_TIM) {
      lines.push(`- Tim is named "${this.brand.timName}" in this workspace.`);
    }
    for (const [original, replacement] of Object.entries(this.brand.specialistRenames)) {
      lines.push(`- The "${original}" specialist is named "${replacement}" in this workspace.`);
    }
    if (lines.length === 0) {
      return 'No agent renames are configured for this workspace.';
    }
    return ['Agent rename context:', ...lines].join('\n');
  }
}

function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function capitalizeFirst(input: string): string {
  if (input.length === 0) return input;
  return input.charAt(0).toUpperCase() + input.slice(1);
}
