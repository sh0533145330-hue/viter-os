import { NangoClient, NANGO_PROVIDER_REGISTRY, type NangoConfig } from '../nango.js';
import type { IngestedEntity, SourceConfig } from '../types.js';

function getNested(obj: unknown, path: string): unknown {
  if (!path) return obj;
  const parts = path.split('.');
  let cur: unknown = obj;
  for (const part of parts) {
    if (cur == null) return undefined;
    const arrayMatch = part.match(/^([^\[]+)\[(\d+)\]$/);
    if (arrayMatch) {
      const [, key, idxStr] = arrayMatch;
      const idx = Number(idxStr);
      cur = (cur as Record<string, unknown>)[key!];
      if (Array.isArray(cur)) cur = cur[idx];
      else return undefined;
    } else {
      cur = (cur as Record<string, unknown>)[part];
    }
  }
  return cur;
}

export class NangoConnector {
  constructor(private nangoCfg: NangoConfig) {}

  async test(source: SourceConfig): Promise<{ ok: boolean; message: string }> {
    if (source.tier !== 'nango' || !source.nango) return { ok: false, message: 'Not a nango source.' };
    const client = new NangoClient(this.nangoCfg);
    try {
      await client.getConnection(source.nango.connectionId, source.nango.provider);
      return { ok: true, message: 'Connection live.' };
    } catch (err) {
      return { ok: false, message: err instanceof Error ? err.message : String(err) };
    }
  }

  async sync(source: SourceConfig, opts: { limit?: number } = {}): Promise<{ entities: IngestedEntity[]; errors: string[] }> {
    if (source.tier !== 'nango' || !source.nango) {
      return { entities: [], errors: ['Not a nango source.'] };
    }
    const meta = NANGO_PROVIDER_REGISTRY[source.nango.provider];
    if (!meta) {
      return { entities: [], errors: [`Unknown provider for default sync: ${source.nango.provider}. Use a custom REST or SDK connector.`] };
    }
    const ep = meta.defaultEndpoint;
    const client = new NangoClient(this.nangoCfg);
    try {
      const limit = opts.limit ?? 50;
      let queryOrBody: { query?: Record<string, string | number | boolean>; data?: unknown } = {};
      if (ep.method === 'GET') {
        queryOrBody = { query: { limit, page_size: limit } };
      } else if (source.nango.provider === 'linear') {
        queryOrBody = {
          data: {
            query: `query Issues($first: Int!) { issues(first: $first) { nodes { id title description url updatedAt createdAt creator { name } } } }`,
            variables: { first: limit },
          },
        };
      }
      const result = await client.proxy<unknown>({
        providerConfigKey: source.nango.provider,
        connectionId: source.nango.connectionId,
        method: ep.method,
        endpoint: ep.path,
        ...queryOrBody,
      });

      const list = ep.jsonPath ? getNested(result, ep.jsonPath) : result;
      if (!Array.isArray(list)) {
        return { entities: [], errors: [`Expected array at ${ep.jsonPath || 'root'}, got ${typeof list}.`] };
      }

      const entities: IngestedEntity[] = list.map((raw) => {
        const item = raw as Record<string, unknown>;
        const id = String(getNested(item, ep.idField) ?? '');
        const title = String(getNested(item, ep.titleField) ?? id);
        const entity: IngestedEntity = {
          externalId: id,
          sourceKind: source.nango!.provider,
          type: ep.type,
          title,
          metadata: { raw: item },
        };
        if (ep.bodyField) {
          const body = getNested(item, ep.bodyField);
          if (body != null) entity.body = String(body);
        }
        if (ep.urlField) {
          const url = getNested(item, ep.urlField);
          if (url != null) entity.url = String(url);
        }
        if (ep.updatedAtField) {
          const updated = getNested(item, ep.updatedAtField);
          if (updated != null) entity.updatedAtExternal = String(updated);
        }
        return entity;
      }).filter(e => e.externalId);

      return { entities, errors: [] };
    } catch (err) {
      return { entities: [], errors: [err instanceof Error ? err.message : String(err)] };
    }
  }
}
