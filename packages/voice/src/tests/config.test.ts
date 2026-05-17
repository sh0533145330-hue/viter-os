import { describe, it, expect } from 'vitest';
import { resolveVoiceConfig, renderIntro } from '../config.js';
describe('resolveVoiceConfig', () => {
  it('returns defaults', () => {
    const c = resolveVoiceConfig();
    expect(c.language).toBe('en-US');
    expect(c.bargeInEnabled).toBe(true);
  });
  it('overrides voiceId', () => {
    const c = resolveVoiceConfig({ voiceId: 'custom-123' });
    expect(c.voiceId).toBe('custom-123');
  });
});
describe('renderIntro', () => {
  it('substitutes agentName', () => {
    const c = resolveVoiceConfig({ introTemplate: "Hi, I'm {{agentName}}." });
    expect(renderIntro(c, { agentName: 'Tom' })).toBe("Hi, I'm Tom.");
  });
  it('leaves unknown vars as-is', () => {
    const c = resolveVoiceConfig({ introTemplate: "Hello {{unknown}}" });
    expect(renderIntro(c, {})).toBe("Hello {{unknown}}");
  });
});
