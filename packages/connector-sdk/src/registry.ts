/**
 * In-memory connector registry.
 *
 * Hosts a process-wide map of connector key → {@link ConnectorDefinition}.
 * Used by the Connector Setup Agent to enumerate eligible connectors
 * and by sync/webhook workers to resolve incoming events to the
 * authoring connector.
 */

import type { ConnectorDefinition } from './connector.js';
import type { ConnectorTier } from './types.js';

export interface RegistryFilter {
  readonly tier?: ConnectorTier | undefined;
  readonly provider?: string | undefined;
}

export class ConnectorRegistry {
  private readonly defs = new Map<string, ConnectorDefinition>();

  register(def: ConnectorDefinition): void {
    if (this.defs.has(def.key)) {
      throw new Error(`Connector '${def.key}' is already registered`);
    }
    this.defs.set(def.key, def);
  }

  registerAll(defs: Iterable<ConnectorDefinition>): void {
    for (const d of defs) this.register(d);
  }

  get(key: string): ConnectorDefinition | undefined {
    return this.defs.get(key);
  }

  has(key: string): boolean {
    return this.defs.has(key);
  }

  list(filter?: RegistryFilter): ConnectorDefinition[] {
    const out: ConnectorDefinition[] = [];
    for (const def of this.defs.values()) {
      if (filter?.tier && def.tier !== filter.tier) continue;
      if (filter?.provider && def.provider !== filter.provider) continue;
      out.push(def);
    }
    return out;
  }

  size(): number {
    return this.defs.size;
  }

  unregister(key: string): boolean {
    return this.defs.delete(key);
  }
}

export function createConnectorRegistry(): ConnectorRegistry {
  return new ConnectorRegistry();
}
