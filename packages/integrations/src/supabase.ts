import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export interface SupabaseAdminConfig {
  url: string;
  serviceRoleKey: string;
}

export function createAdminClient(cfg: SupabaseAdminConfig): SupabaseClient {
  return createClient(cfg.url, cfg.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { 'x-vita-app': 'operator' } },
  });
}

export async function testAdminConnection(cfg: SupabaseAdminConfig): Promise<{ ok: boolean; message: string }> {
  try {
    const client = createAdminClient(cfg);
    const { error } = await client.from('_vita_health').select('*').limit(1);
    if (error && !/relation .* does not exist/i.test(error.message)) {
      return { ok: false, message: error.message };
    }
    return { ok: true, message: 'Connected. Ready to deploy schema.' };
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : String(err) };
  }
}

export const SCHEMA_SQL = `
create extension if not exists "uuid-ossp";
create extension if not exists "vector";
create extension if not exists "pg_trgm";

create table if not exists workspaces (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  industry text,
  created_at timestamptz default now()
);

create table if not exists workspace_secrets (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  key text not null,
  value text not null,
  created_at timestamptz default now(),
  unique (workspace_id, key)
);

create table if not exists sources (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  kind text not null,
  label text,
  status text default 'pending',
  last_sync_at timestamptz,
  last_sync_count int default 0,
  last_error text,
  config jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);
create index if not exists sources_workspace_idx on sources(workspace_id);

create table if not exists entities (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  source_id uuid references sources(id) on delete cascade,
  source_kind text not null,
  external_id text not null,
  type text not null,
  title text,
  body text,
  url text,
  author text,
  created_at_external timestamptz,
  updated_at_external timestamptz,
  metadata jsonb default '{}'::jsonb,
  ts_doc tsvector,
  embedding vector(1536),
  ingested_at timestamptz default now(),
  unique (workspace_id, source_kind, external_id)
);
create index if not exists entities_workspace_idx on entities(workspace_id);
create index if not exists entities_source_idx on entities(source_id);
create index if not exists entities_type_idx on entities(type);
create index if not exists entities_updated_idx on entities(updated_at_external desc nulls last);
create index if not exists entities_ts_idx on entities using gin(ts_doc);
create index if not exists entities_trgm_title_idx on entities using gin(title gin_trgm_ops);

create or replace function entities_tsvector_trigger() returns trigger as $$
begin
  new.ts_doc :=
    setweight(to_tsvector('simple', coalesce(new.title, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(new.body, '')), 'B');
  return new;
end
$$ language plpgsql;

drop trigger if exists entities_ts_update on entities;
create trigger entities_ts_update before insert or update of title, body
  on entities for each row execute procedure entities_tsvector_trigger();

create table if not exists messages (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  role text not null,
  content text not null,
  citations jsonb default '[]'::jsonb,
  model text,
  created_at timestamptz default now()
);
create index if not exists messages_workspace_idx on messages(workspace_id, created_at desc);

create table if not exists sync_runs (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  source_id uuid not null references sources(id) on delete cascade,
  status text not null,
  entities_count int default 0,
  error text,
  started_at timestamptz default now(),
  finished_at timestamptz
);
create index if not exists sync_runs_source_idx on sync_runs(source_id, started_at desc);

create table if not exists approvals (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  kind text not null,
  payload jsonb not null,
  risk text default 'L2',
  status text default 'pending',
  proposer text default 'tom',
  decided_at timestamptz,
  decision text,
  created_at timestamptz default now()
);
create index if not exists approvals_workspace_idx on approvals(workspace_id, status);

create or replace function vita_hybrid_search(
  ws uuid,
  q text,
  q_embedding vector(1536),
  source_filter text default null,
  type_filter text default null,
  k int default 20
) returns table (
  id uuid,
  title text,
  body text,
  source_kind text,
  type text,
  url text,
  updated_at_external timestamptz,
  text_rank float,
  vector_rank float,
  hybrid_score float
) as $$
  with text_hits as (
    select e.id,
      ts_rank_cd(e.ts_doc, websearch_to_tsquery('simple', q)) as r
    from entities e
    where e.workspace_id = ws
      and (source_filter is null or e.source_kind = source_filter)
      and (type_filter is null or e.type = type_filter)
      and e.ts_doc @@ websearch_to_tsquery('simple', q)
    order by r desc
    limit k * 4
  ),
  vector_hits as (
    select e.id,
      1 - (e.embedding <=> q_embedding) as r
    from entities e
    where e.workspace_id = ws
      and e.embedding is not null
      and (source_filter is null or e.source_kind = source_filter)
      and (type_filter is null or e.type = type_filter)
    order by e.embedding <=> q_embedding
    limit k * 4
  ),
  combined as (
    select coalesce(t.id, v.id) as id,
      coalesce(t.r, 0) as text_rank,
      coalesce(v.r, 0) as vector_rank,
      coalesce(t.r, 0) * 0.5 + coalesce(v.r, 0) * 0.5 as hybrid_score
    from text_hits t
    full outer join vector_hits v on t.id = v.id
  )
  select e.id, e.title, e.body, e.source_kind, e.type, e.url, e.updated_at_external,
    c.text_rank, c.vector_rank, c.hybrid_score
  from combined c
  join entities e on e.id = c.id
  order by c.hybrid_score desc
  limit k;
$$ language sql stable;

create table if not exists _vita_health (id int primary key default 1, deployed_at timestamptz default now());
insert into _vita_health (id) values (1) on conflict do nothing;
`;

export async function deploySchema(cfg: SupabaseAdminConfig): Promise<{ ok: boolean; message: string }> {
  try {
    const resp = await fetch(`${cfg.url.replace(/\/$/, '')}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        apikey: cfg.serviceRoleKey,
        Authorization: `Bearer ${cfg.serviceRoleKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sql: SCHEMA_SQL }),
    });
    if (!resp.ok) {
      return { ok: false, message: `Schema deploy failed (${resp.status}). Run the schema SQL manually in the Supabase SQL editor — copy from /welcome/supabase/sql.` };
    }
    return { ok: true, message: 'Schema deployed.' };
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : String(err) };
  }
}

export interface SchemaCheckResult {
  ok: boolean;
  missing: string[];
  message: string;
}

const REQUIRED_TABLES = ['workspaces', 'workspace_secrets', 'sources', 'entities', 'messages', 'sync_runs', 'approvals'];

export async function checkSchema(cfg: SupabaseAdminConfig): Promise<SchemaCheckResult> {
  const client = createAdminClient(cfg);
  const missing: string[] = [];
  for (const table of REQUIRED_TABLES) {
    const { error } = await client.from(table).select('*').limit(1);
    if (error && /relation .* does not exist/i.test(error.message)) missing.push(table);
  }
  if (missing.length === 0) return { ok: true, missing: [], message: 'Schema in place.' };
  return { ok: false, missing, message: `Missing tables: ${missing.join(', ')}` };
}
