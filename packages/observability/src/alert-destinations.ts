import type { AlertPayload } from './types.js';

export type { AlertPayload } from './types.js';

export interface AlertDestination {
  key: string;
  send(alert: AlertPayload): Promise<void>;
}

type FetchFn = typeof fetch;

interface BaseConfig {
  fetch?: FetchFn;
  logger?: { warn: (obj: Record<string, unknown>, msg?: string) => void };
}

export interface PagerDutyConfig extends BaseConfig {
  integrationKey?: string;
  apiUrl?: string;
}

const PAGERDUTY_DEFAULT_URL = 'https://events.pagerduty.com/v2/enqueue';

function severityToPagerDuty(severity: string): 'critical' | 'error' | 'warning' | 'info' {
  switch (severity) {
    case 'critical':
      return 'critical';
    case 'error':
      return 'error';
    case 'warning':
      return 'warning';
    default:
      return 'info';
  }
}

export class PagerDutyDestination implements AlertDestination {
  readonly key = 'pagerduty';
  private readonly integrationKey: string | undefined;
  private readonly apiUrl: string;
  private readonly fetchImpl: FetchFn;
  private readonly logger: BaseConfig['logger'];

  constructor(config: PagerDutyConfig = {}) {
    this.integrationKey = config.integrationKey;
    this.apiUrl = config.apiUrl ?? PAGERDUTY_DEFAULT_URL;
    this.fetchImpl = config.fetch ?? fetch;
    this.logger = config.logger;
  }

  async send(alert: AlertPayload): Promise<void> {
    if (!this.integrationKey) {
      this.logger?.warn(
        { destination: 'pagerduty', alert: alert.title },
        'PagerDuty integration key missing; skipping alert',
      );
      return;
    }

    const body = {
      routing_key: this.integrationKey,
      event_action: 'trigger',
      payload: {
        summary: alert.title,
        severity: severityToPagerDuty(alert.severity),
        source: alert.source ?? 'vita-os',
        custom_details: {
          body: alert.body,
          runbook_url: alert.runbookUrl,
          ...(alert.metadata ?? {}),
        },
      },
      links: alert.runbookUrl
        ? [{ href: alert.runbookUrl, text: 'Runbook' }]
        : undefined,
    };

    const res = await this.fetchImpl(this.apiUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      throw new Error(`PagerDuty send failed: ${res.status} ${res.statusText}`);
    }
  }
}

export interface SlackWebhookConfig extends BaseConfig {
  webhookUrl?: string;
  channel?: string;
}

function severityEmoji(severity: string): string {
  switch (severity) {
    case 'critical':
      return ':rotating_light:';
    case 'error':
      return ':x:';
    case 'warning':
      return ':warning:';
    default:
      return ':information_source:';
  }
}

export class SlackWebhookDestination implements AlertDestination {
  readonly key = 'slack';
  private readonly webhookUrl: string | undefined;
  private readonly channel: string | undefined;
  private readonly fetchImpl: FetchFn;
  private readonly logger: BaseConfig['logger'];

  constructor(config: SlackWebhookConfig = {}) {
    this.webhookUrl = config.webhookUrl;
    this.channel = config.channel;
    this.fetchImpl = config.fetch ?? fetch;
    this.logger = config.logger;
  }

  async send(alert: AlertPayload): Promise<void> {
    if (!this.webhookUrl) {
      this.logger?.warn(
        { destination: 'slack', alert: alert.title },
        'Slack webhook URL missing; skipping alert',
      );
      return;
    }

    const emoji = severityEmoji(alert.severity);
    const text = `${emoji} *[${alert.severity.toUpperCase()}]* ${alert.title}\n${alert.body}${
      alert.runbookUrl ? `\n<${alert.runbookUrl}|Runbook>` : ''
    }`;

    const body: Record<string, unknown> = { text };
    if (this.channel) body.channel = this.channel;

    const res = await this.fetchImpl(this.webhookUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      throw new Error(`Slack send failed: ${res.status} ${res.statusText}`);
    }
  }
}

export interface EmailDestinationConfig extends BaseConfig {
  to: string[];
  from?: string;
  resendApiKey?: string;
  apiUrl?: string;
}

const RESEND_DEFAULT_URL = 'https://api.resend.com/emails';

export class EmailDestination implements AlertDestination {
  readonly key = 'email';
  private readonly to: string[];
  private readonly from: string;
  private readonly resendApiKey: string | undefined;
  private readonly apiUrl: string;
  private readonly fetchImpl: FetchFn;
  private readonly logger: BaseConfig['logger'];

  constructor(config: EmailDestinationConfig) {
    this.to = config.to;
    this.from = config.from ?? 'alerts@vitaos.app';
    this.resendApiKey = config.resendApiKey;
    this.apiUrl = config.apiUrl ?? RESEND_DEFAULT_URL;
    this.fetchImpl = config.fetch ?? fetch;
    this.logger = config.logger;
  }

  async send(alert: AlertPayload): Promise<void> {
    if (!this.resendApiKey) {
      this.logger?.warn(
        { destination: 'email', alert: alert.title },
        'Resend API key missing; skipping alert',
      );
      return;
    }
    if (this.to.length === 0) {
      this.logger?.warn(
        { destination: 'email', alert: alert.title },
        'No recipients configured; skipping alert',
      );
      return;
    }

    const subject = `[${alert.severity.toUpperCase()}] ${alert.title}`;
    const html = [
      `<h2>${alert.title}</h2>`,
      `<p><strong>Severity:</strong> ${alert.severity}</p>`,
      `<p>${alert.body.replace(/\n/g, '<br>')}</p>`,
      alert.runbookUrl ? `<p><a href="${alert.runbookUrl}">Runbook</a></p>` : '',
    ].join('');

    const body = {
      from: this.from,
      to: this.to,
      subject,
      html,
    };

    const res = await this.fetchImpl(this.apiUrl, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${this.resendApiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      throw new Error(`Email send failed: ${res.status} ${res.statusText}`);
    }
  }
}

export class AlertDispatcher {
  private readonly destinations = new Map<string, AlertDestination>();

  constructor(destinations: AlertDestination[] = []) {
    for (const d of destinations) this.register(d);
  }

  register(destination: AlertDestination): void {
    this.destinations.set(destination.key, destination);
  }

  list(): AlertDestination[] {
    return [...this.destinations.values()];
  }

  async dispatch(
    alert: AlertPayload,
    destinationKeys: string[],
  ): Promise<Array<{ key: string; ok: boolean; error?: string }>> {
    const results: Array<{ key: string; ok: boolean; error?: string }> = [];
    for (const key of destinationKeys) {
      const dest = this.destinations.get(key);
      if (!dest) {
        results.push({ key, ok: false, error: 'destination_not_registered' });
        continue;
      }
      try {
        await dest.send(alert);
        results.push({ key, ok: true });
      } catch (err) {
        results.push({ key, ok: false, error: (err as Error).message });
      }
    }
    return results;
  }
}
