export interface NangoConfig {
  secretKey: string;
  publicKey?: string;
  host?: string;
}

export interface NangoConnection {
  connectionId: string;
  providerConfigKey: string;
  provider: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export interface NangoProxyOptions {
  providerConfigKey: string;
  connectionId: string;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  endpoint: string;
  query?: Record<string, string | number | boolean>;
  data?: unknown;
  headers?: Record<string, string>;
  retries?: number;
}

export const NANGO_SUPPORTED_PROVIDERS = [
  'google-mail', 'google-calendar', 'google-drive', 'google-docs', 'google-sheets',
  'slack', 'discord', 'microsoft-teams',
  'github', 'gitlab', 'bitbucket',
  'linear', 'jira', 'asana', 'trello', 'monday', 'clickup', 'notion',
  'hubspot', 'salesforce', 'pipedrive', 'zoho-crm', 'close',
  'stripe', 'quickbooks', 'xero',
  'intercom', 'zendesk', 'freshdesk', 'helpscout',
  'segment', 'mixpanel', 'amplitude',
  'shopify', 'woocommerce', 'square',
  'mailchimp', 'sendgrid', 'klaviyo',
  'airtable', 'coda', 'confluence',
  'dropbox', 'box', 'onedrive',
  'zoom', 'calendly', 'cal-com',
  'workday', 'bamboohr', 'gusto',
] as const;

export class NangoClient {
  constructor(private cfg: NangoConfig) {}

  private get host(): string {
    return this.cfg.host ?? 'https://api.nango.dev';
  }

  private headers(extra: Record<string, string> = {}): Record<string, string> {
    return {
      Authorization: `Bearer ${this.cfg.secretKey}`,
      'Content-Type': 'application/json',
      ...extra,
    };
  }

  async test(): Promise<{ ok: boolean; message: string; connectionCount?: number }> {
    try {
      const res = await fetch(`${this.host}/connection`, { headers: this.headers() });
      if (!res.ok) {
        return { ok: false, message: `Nango: ${res.status} ${await res.text()}` };
      }
      const json = (await res.json()) as { connections?: NangoConnection[] };
      return { ok: true, message: 'Nango secret key valid.', connectionCount: json.connections?.length ?? 0 };
    } catch (err) {
      return { ok: false, message: err instanceof Error ? err.message : String(err) };
    }
  }

  async listConnections(): Promise<NangoConnection[]> {
    const res = await fetch(`${this.host}/connection`, { headers: this.headers() });
    if (!res.ok) throw new Error(`Nango list connections failed: ${res.status}`);
    const json = (await res.json()) as { connections?: NangoConnection[] };
    return json.connections ?? [];
  }

  async getConnection(connectionId: string, providerConfigKey: string): Promise<NangoConnection> {
    const res = await fetch(
      `${this.host}/connection/${encodeURIComponent(connectionId)}?provider_config_key=${encodeURIComponent(providerConfigKey)}`,
      { headers: this.headers() },
    );
    if (!res.ok) throw new Error(`Nango get connection failed: ${res.status}`);
    return (await res.json()) as NangoConnection;
  }

  async deleteConnection(connectionId: string, providerConfigKey: string): Promise<void> {
    const res = await fetch(
      `${this.host}/connection/${encodeURIComponent(connectionId)}?provider_config_key=${encodeURIComponent(providerConfigKey)}`,
      { method: 'DELETE', headers: this.headers() },
    );
    if (!res.ok) throw new Error(`Nango delete connection failed: ${res.status}`);
  }

  async proxy<T = unknown>(opts: NangoProxyOptions): Promise<T> {
    const method = opts.method ?? 'GET';
    const qs = opts.query
      ? '?' + new URLSearchParams(Object.entries(opts.query).map(([k, v]) => [k, String(v)] as [string, string])).toString()
      : '';
    const headers = this.headers({
      'Provider-Config-Key': opts.providerConfigKey,
      'Connection-Id': opts.connectionId,
      ...(opts.headers ?? {}),
    });
    const fetchOpts: RequestInit = { method, headers };
    if (opts.data) fetchOpts.body = JSON.stringify(opts.data);
    const res = await fetch(`${this.host}/proxy${opts.endpoint.startsWith('/') ? '' : '/'}${opts.endpoint}${qs}`, fetchOpts);
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Nango proxy ${method} ${opts.endpoint} failed: ${res.status} ${errText}`);
    }
    const text = await res.text();
    if (!text) return undefined as T;
    try {
      return JSON.parse(text) as T;
    } catch {
      return text as unknown as T;
    }
  }
}

export interface NangoProviderMeta {
  key: string;
  displayName: string;
  category: 'comms' | 'crm' | 'productivity' | 'dev' | 'finance' | 'support' | 'analytics' | 'commerce' | 'marketing' | 'storage' | 'meetings' | 'hr' | 'other';
  defaultEndpoint: { method: 'GET' | 'POST'; path: string; jsonPath: string; idField: string; titleField: string; bodyField?: string; urlField?: string; updatedAtField?: string; type: string };
}

export const NANGO_PROVIDER_REGISTRY: Record<string, NangoProviderMeta> = {
  'google-mail': {
    key: 'google-mail', displayName: 'Gmail', category: 'comms',
    defaultEndpoint: { method: 'GET', path: '/gmail/v1/users/me/messages', jsonPath: 'messages', idField: 'id', titleField: 'id', type: 'email' },
  },
  slack: {
    key: 'slack', displayName: 'Slack', category: 'comms',
    defaultEndpoint: { method: 'GET', path: '/conversations.list', jsonPath: 'channels', idField: 'id', titleField: 'name', type: 'channel' },
  },
  notion: {
    key: 'notion', displayName: 'Notion', category: 'productivity',
    defaultEndpoint: { method: 'GET', path: '/v1/search', jsonPath: 'results', idField: 'id', titleField: 'properties.title.title[0].plain_text', urlField: 'url', updatedAtField: 'last_edited_time', type: 'page' },
  },
  github: {
    key: 'github', displayName: 'GitHub', category: 'dev',
    defaultEndpoint: { method: 'GET', path: '/issues', jsonPath: '', idField: 'id', titleField: 'title', bodyField: 'body', urlField: 'html_url', updatedAtField: 'updated_at', type: 'issue' },
  },
  linear: {
    key: 'linear', displayName: 'Linear', category: 'dev',
    defaultEndpoint: { method: 'POST', path: '/graphql', jsonPath: 'data.issues.nodes', idField: 'id', titleField: 'title', bodyField: 'description', urlField: 'url', updatedAtField: 'updatedAt', type: 'issue' },
  },
  hubspot: {
    key: 'hubspot', displayName: 'HubSpot', category: 'crm',
    defaultEndpoint: { method: 'GET', path: '/crm/v3/objects/contacts', jsonPath: 'results', idField: 'id', titleField: 'properties.firstname', updatedAtField: 'updatedAt', type: 'contact' },
  },
  salesforce: {
    key: 'salesforce', displayName: 'Salesforce', category: 'crm',
    defaultEndpoint: { method: 'GET', path: '/services/data/v59.0/sobjects/Account', jsonPath: 'recentItems', idField: 'Id', titleField: 'Name', type: 'account' },
  },
  'google-calendar': {
    key: 'google-calendar', displayName: 'Google Calendar', category: 'meetings',
    defaultEndpoint: { method: 'GET', path: '/calendar/v3/calendars/primary/events', jsonPath: 'items', idField: 'id', titleField: 'summary', bodyField: 'description', urlField: 'htmlLink', updatedAtField: 'updated', type: 'event' },
  },
  intercom: {
    key: 'intercom', displayName: 'Intercom', category: 'support',
    defaultEndpoint: { method: 'GET', path: '/contacts', jsonPath: 'data', idField: 'id', titleField: 'name', updatedAtField: 'updated_at', type: 'contact' },
  },
  zendesk: {
    key: 'zendesk', displayName: 'Zendesk', category: 'support',
    defaultEndpoint: { method: 'GET', path: '/api/v2/tickets.json', jsonPath: 'tickets', idField: 'id', titleField: 'subject', bodyField: 'description', urlField: 'url', updatedAtField: 'updated_at', type: 'ticket' },
  },
  stripe: {
    key: 'stripe', displayName: 'Stripe', category: 'finance',
    defaultEndpoint: { method: 'GET', path: '/v1/customers', jsonPath: 'data', idField: 'id', titleField: 'email', type: 'customer' },
  },
  airtable: {
    key: 'airtable', displayName: 'Airtable', category: 'productivity',
    defaultEndpoint: { method: 'GET', path: '/v0/meta/bases', jsonPath: 'bases', idField: 'id', titleField: 'name', type: 'base' },
  },
};
