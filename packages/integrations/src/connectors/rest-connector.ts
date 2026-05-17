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

export class GenericRestConnector {
  async test(source: SourceConfig): Promise<{ ok: boolean; message: string }> {
    if (source.tier !== 'rest' || !source.rest) return { ok: false, message: 'Not a REST source.' };
    try {
      const r = source.rest;
      const res = await fetch(`${r.baseUrl.replace(/\/$/, '')}${r.listPath}`, {
        headers: { [r.authHeader]: r.authValue, Accept: 'application/json' },
      });
      if (!res.ok) return { ok: false, message: `${res.status}: ${await res.text()}` };
      return { ok: true, message: 'Endpoint reachable.' };
    } catch (err) {
      return { ok: false, message: err instanceof Error ? err.message : String(err) };
    }
  }

  async sync(source: SourceConfig): Promise<{ entities: IngestedEntity[]; errors: string[] }> {
    if (source.tier !== 'rest' || !source.rest) return { entities: [], errors: ['Not a REST source.'] };
    const r = source.rest;
    try {
      const res = await fetch(`${r.baseUrl.replace(/\/$/, '')}${r.listPath}`, {
        headers: { [r.authHeader]: r.authValue, Accept: 'application/json' },
      });
      if (!res.ok) return { entities: [], errors: [`${res.status}: ${await res.text()}`] };
      const json = await res.json();
      const list = r.listJsonPath ? getNested(json, r.listJsonPath) : json;
      if (!Array.isArray(list)) return { entities: [], errors: [`Expected array at "${r.listJsonPath}".`] };

      const entities: IngestedEntity[] = list.map((raw) => {
        const item = raw as Record<string, unknown>;
        const id = String(getNested(item, r.idField) ?? '');
        const title = String(getNested(item, r.titleField) ?? id);
        const entity: IngestedEntity = {
          externalId: id,
          sourceKind: source.kind,
          type: r.type,
          title,
          metadata: { raw: item },
        };
        if (r.bodyField) {
          const body = getNested(item, r.bodyField);
          if (body != null) entity.body = String(body);
        }
        if (r.urlField) {
          const url = getNested(item, r.urlField);
          if (url != null) entity.url = String(url);
        }
        if (r.updatedAtField) {
          const updated = getNested(item, r.updatedAtField);
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
