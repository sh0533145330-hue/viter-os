import type { BrandIdentity } from './types.js';

const DEFAULT_INTRO_TEMPLATE = 'Hi, this is {{agent}} from {{brand}}. How can I help?';

export interface BuildVoiceIntroOptions {
  template?: string;
  agentName?: string;
  variables?: Record<string, string>;
}

export function buildVoiceIntro(
  brand: BrandIdentity,
  options: BuildVoiceIntroOptions = {},
): string {
  const template = options.template ?? brand.voiceIntro ?? DEFAULT_INTRO_TEMPLATE;
  const variables: Record<string, string> = {
    agent: options.agentName ?? brand.tomName,
    tom: brand.tomName,
    tim: brand.timName,
    brand: brand.displayName,
    ...(options.variables ?? {}),
  };
  return interpolate(template, variables);
}

export function resolveVoiceId(brand: BrandIdentity, fallback: string): string {
  if (brand.voiceVoiceId && brand.voiceVoiceId.trim().length > 0) {
    return brand.voiceVoiceId;
  }
  return fallback;
}

function interpolate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_match, key: string) => {
    const value = vars[key];
    return value === undefined ? `{{${key}}}` : value;
  });
}
