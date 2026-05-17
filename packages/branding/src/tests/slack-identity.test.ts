import { describe, expect, it } from 'vitest';
import { defaultBrandIdentity } from '../identity.js';
import { generateSlackManifest, resolveSlackBotIdentity } from '../slack-identity.js';

describe('resolveSlackBotIdentity', () => {
  it('returns brand.slackBotIdentity when set', () => {
    const identity = resolveSlackBotIdentity({
      ...defaultBrandIdentity(),
      slackBotIdentity: { name: 'acme', displayName: 'Acme', description: 'Helps' },
    });
    expect(identity.name).toBe('acme');
  });

  it('derives identity from the brand name when not set', () => {
    const identity = resolveSlackBotIdentity({
      ...defaultBrandIdentity(),
      displayName: 'Acme CPA',
    });
    expect(identity.name).toBe('acme-cpa');
    expect(identity.displayName).toBe('Acme CPA');
    expect(identity.description).toContain('Acme CPA');
  });
});

describe('generateSlackManifest', () => {
  it('produces a manifest with display info and oauth scopes', () => {
    const manifest = generateSlackManifest({ ...defaultBrandIdentity(), displayName: 'Acme' });
    expect(manifest._metadata).toBeDefined();
    const display = manifest.display_information as Record<string, unknown>;
    expect(display.name).toBe('Acme');
    const oauth = manifest.oauth_config as Record<string, unknown>;
    const scopes = (oauth.scopes as Record<string, unknown>).bot as string[];
    expect(scopes).toContain('chat:write');
  });

  it('includes redirect URLs and event subscriptions when provided', () => {
    const manifest = generateSlackManifest(defaultBrandIdentity(), {
      redirectUrls: ['https://vitaos.app/slack/oauth'],
      eventSubscriptionUrl: 'https://vitaos.app/slack/events',
      slashCommands: [{ command: '/ask', description: 'Ask the assistant' }],
    });
    const oauth = manifest.oauth_config as Record<string, unknown>;
    expect(oauth.redirect_urls).toEqual(['https://vitaos.app/slack/oauth']);
    const settings = manifest.settings as Record<string, unknown>;
    expect(settings.event_subscriptions).toBeDefined();
    const features = manifest.features as Record<string, unknown>;
    expect(Array.isArray(features.slash_commands)).toBe(true);
  });
});
