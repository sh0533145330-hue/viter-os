import type { BrandIdentity, SlackBotIdentity } from './types.js';

export interface SlackManifestOptions {
  redirectUrls?: string[];
  eventSubscriptionUrl?: string;
  slashCommands?: Array<{ command: string; description: string; url?: string }>;
}

export function resolveSlackBotIdentity(brand: BrandIdentity): SlackBotIdentity {
  if (brand.slackBotIdentity) return brand.slackBotIdentity;
  return {
    name: slugify(brand.displayName),
    displayName: brand.displayName,
    description: `${brand.displayName} assistant powered by VitaOS.`,
  };
}

export function generateSlackManifest(
  brand: BrandIdentity,
  options: SlackManifestOptions = {},
): Record<string, unknown> {
  const identity = resolveSlackBotIdentity(brand);
  const oauth: Record<string, unknown> = {
    scopes: {
      bot: [
        'app_mentions:read',
        'channels:history',
        'chat:write',
        'commands',
        'im:history',
        'im:read',
        'im:write',
        'users:read',
      ],
    },
  };
  if (options.redirectUrls && options.redirectUrls.length > 0) {
    oauth.redirect_urls = options.redirectUrls;
  }
  const settings: Record<string, unknown> = {
    org_deploy_enabled: false,
    socket_mode_enabled: false,
    token_rotation_enabled: true,
  };
  if (options.eventSubscriptionUrl) {
    settings.event_subscriptions = {
      request_url: options.eventSubscriptionUrl,
      bot_events: ['app_mention', 'message.im'],
    };
  }
  const features: Record<string, unknown> = {
    bot_user: {
      display_name: identity.displayName,
      always_online: true,
    },
    app_home: {
      home_tab_enabled: true,
      messages_tab_enabled: true,
      messages_tab_read_only_enabled: false,
    },
  };
  if (options.slashCommands && options.slashCommands.length > 0) {
    features.slash_commands = options.slashCommands.map((cmd) => ({
      command: cmd.command,
      description: cmd.description,
      ...(cmd.url ? { url: cmd.url } : {}),
      should_escape: false,
    }));
  }
  return {
    _metadata: { major_version: 1, minor_version: 1 },
    display_information: {
      name: identity.displayName,
      description: identity.description,
      background_color: brand.themeTokens.colors.primary,
    },
    features,
    oauth_config: oauth,
    settings,
  };
}

function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 32) || 'vita-assistant'
  );
}
