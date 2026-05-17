import { describe, expect, it } from 'vitest';
import { defaultBrandIdentity } from '../identity.js';
import { buildVoiceIntro, resolveVoiceId } from '../voice-identity.js';

describe('buildVoiceIntro', () => {
  it('uses the default template when none configured', () => {
    const intro = buildVoiceIntro({
      ...defaultBrandIdentity(),
      displayName: 'Acme',
      tomName: 'Sage',
    });
    expect(intro).toBe('Hi, this is Sage from Acme. How can I help?');
  });

  it('uses the brand-supplied template', () => {
    const intro = buildVoiceIntro({
      ...defaultBrandIdentity(),
      displayName: 'Acme',
      tomName: 'Sage',
      voiceIntro: 'You are speaking with {{agent}} at {{brand}}.',
    });
    expect(intro).toBe('You are speaking with Sage at Acme.');
  });

  it('respects an override agentName', () => {
    const intro = buildVoiceIntro(
      { ...defaultBrandIdentity(), displayName: 'Acme' },
      { agentName: 'Atlas' },
    );
    expect(intro).toBe('Hi, this is Atlas from Acme. How can I help?');
  });

  it('leaves unknown variables in place', () => {
    const intro = buildVoiceIntro(
      { ...defaultBrandIdentity(), displayName: 'Acme', tomName: 'Sage' },
      { template: 'Hi, {{agent}} here. {{unknown}}' },
    );
    expect(intro).toBe('Hi, Sage here. {{unknown}}');
  });
});

describe('resolveVoiceId', () => {
  it('returns the brand voice id when set', () => {
    expect(
      resolveVoiceId({ ...defaultBrandIdentity(), voiceVoiceId: 'voice-acme' }, 'fallback'),
    ).toBe('voice-acme');
  });

  it('falls back when missing', () => {
    expect(resolveVoiceId(defaultBrandIdentity(), 'fallback')).toBe('fallback');
  });
});
