import { isQuietTimeNow } from './quiet-hours.js';
import type {
  Logger,
  NotificationsDb,
  UserChannelPref,
  UserPreferences,
} from './types.js';

export interface PreferenceManagerDeps {
  db: NotificationsDb;
  logger: Logger;
  defaultPrefs?: () => Omit<UserPreferences, 'userId' | 'workspaceId'>;
}

const DEFAULT_CHANNELS: Record<string, UserChannelPref> = {
  in_app: { enabled: true },
  email: { enabled: true },
  push: { enabled: true },
  slack_dm: { enabled: false },
  teams_dm: { enabled: false },
  sms: { enabled: false },
  voice: { enabled: false },
};

export class PreferenceManager {
  private readonly db: NotificationsDb;
  private readonly logger: Logger;
  private readonly defaultFactory: () => Omit<UserPreferences, 'userId' | 'workspaceId'>;

  constructor(deps: PreferenceManagerDeps) {
    this.db = deps.db;
    this.logger = deps.logger;
    this.defaultFactory =
      deps.defaultPrefs ??
      (() => ({
        channels: structuredClone(DEFAULT_CHANNELS),
        bundlingEnabled: false,
      }));
  }

  async get(userId: string, workspaceId: string): Promise<UserPreferences> {
    const row = await this.db.getPreferences(userId, workspaceId);
    if (row) return row;
    const defaults = this.defaultFactory();
    return { userId, workspaceId, ...defaults };
  }

  async update(
    userId: string,
    workspaceId: string,
    prefs: Partial<UserPreferences>,
  ): Promise<UserPreferences> {
    const existing = await this.get(userId, workspaceId);
    const merged: UserPreferences = {
      userId,
      workspaceId,
      channels: { ...existing.channels, ...(prefs.channels ?? {}) },
      bundlingEnabled: prefs.bundlingEnabled ?? existing.bundlingEnabled,
    };
    await this.db.upsertPreferences(merged);
    this.logger.info('preferences.updated', { userId, workspaceId });
    return merged;
  }

  isChannelEnabled(prefs: UserPreferences, channel: string): boolean {
    const cfg = prefs.channels[channel];
    if (!cfg) return false;
    return cfg.enabled;
  }

  isQuietNow(prefs: UserPreferences, channel: string, now: Date): boolean {
    const cfg = prefs.channels[channel];
    if (!cfg?.quietHours) return false;
    return isQuietTimeNow(cfg.quietHours, now);
  }
}
