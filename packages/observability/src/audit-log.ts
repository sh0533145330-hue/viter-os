import type { Logger } from './logger.js';
import { createLogRedactor } from './pii-redaction.js';
import type { AuditEvent, AuditQueryFilter } from './types.js';

export type { AuditEvent, AuditQueryFilter } from './types.js';

export interface AuditLogDb {
  insertAuditEvent(event: AuditEvent): Promise<{ id: string }>;
  queryAuditEvents(filter: AuditQueryFilter): Promise<AuditEvent[]>;
}

export interface AuditLoggerOptions {
  db: AuditLogDb;
  logger?: Logger;
  redactor?: (obj: unknown) => unknown;
}

export class AuditLogger {
  private readonly db: AuditLogDb;
  private readonly logger?: Logger;
  private readonly redactor: (obj: unknown) => unknown;

  constructor(opts: AuditLoggerOptions) {
    this.db = opts.db;
    if (opts.logger) this.logger = opts.logger;
    this.redactor = opts.redactor ?? createLogRedactor();
  }

  async record(event: AuditEvent): Promise<{ id: string }> {
    const sanitized: AuditEvent = {
      ...event,
      ...(event.before !== undefined
        ? { before: this.redactor(event.before) as Record<string, unknown> }
        : {}),
      ...(event.after !== undefined
        ? { after: this.redactor(event.after) as Record<string, unknown> }
        : {}),
    };

    try {
      const result = await this.db.insertAuditEvent(sanitized);
      this.logger?.debug(
        {
          audit_id: result.id,
          workspace_id: event.workspaceId,
          actor_kind: event.actorKind,
          action: event.action,
          resource: event.resource,
        },
        'audit_event_recorded',
      );
      return result;
    } catch (err) {
      this.logger?.error(
        {
          err,
          workspace_id: event.workspaceId,
          action: event.action,
          resource: event.resource,
        },
        'audit_event_record_failed',
      );
      throw err;
    }
  }

  async query(filter: AuditQueryFilter): Promise<AuditEvent[]> {
    return this.db.queryAuditEvents(filter);
  }

  static memoryDb(): AuditLogDb & { events: AuditEvent[] } {
    const events: AuditEvent[] = [];
    return {
      events,
      async insertAuditEvent(event: AuditEvent): Promise<{ id: string }> {
        const id = `audit-${events.length + 1}`;
        events.push(event);
        return { id };
      },
      async queryAuditEvents(filter: AuditQueryFilter): Promise<AuditEvent[]> {
        const limit = filter.limit ?? 100;
        return events
          .filter((e) => e.workspaceId === filter.workspaceId)
          .filter((e) => (filter.resource ? e.resource === filter.resource : true))
          .filter((e) => (filter.action ? e.action === filter.action : true))
          .filter((e) => (filter.actorId ? e.actorId === filter.actorId : true))
          .filter((e) => (filter.from ? e.at >= filter.from : true))
          .filter((e) => (filter.to ? e.at <= filter.to : true))
          .slice(0, limit);
      },
    };
  }
}
