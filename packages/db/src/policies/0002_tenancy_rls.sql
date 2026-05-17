-- =============================================================================
-- 0002_tenancy_rls.sql
--
-- Helper functions and tenancy-level policies. All policies resolve the calling
-- user via Supabase `auth.uid()` (which equals `users.id`) and look up
-- memberships to derive permitted scopes.
--
-- The helper `current_workspace_ids()` returns the set of workspace UUIDs the
-- caller can access. Agency and platform admins inherit access to nested
-- workspaces transitively.
-- =============================================================================

create schema if not exists vita_priv;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function vita_priv.current_user_id() returns uuid
language sql stable security definer set search_path = public
as $$
  select coalesce(auth.uid(), nullif(current_setting('request.jwt.claim.sub', true), '')::uuid);
$$;

create or replace function public.current_workspace_ids() returns uuid[]
language sql stable security definer set search_path = public
as $$
  with uid as (select vita_priv.current_user_id() as id)
  select coalesce(array_agg(distinct w.id), '{}'::uuid[])
  from public.workspaces w
  left join public.memberships m_w
    on m_w.user_id = (select id from uid)
   and m_w.scope = 'workspace'
   and m_w.scope_id = w.id
   and m_w.status = 'active'
  left join public.memberships m_a
    on m_a.user_id = (select id from uid)
   and m_a.scope = 'agency'
   and m_a.scope_id = w.agency_id
   and m_a.status = 'active'
  left join public.memberships m_p
    on m_p.user_id = (select id from uid)
   and m_p.scope = 'platform'
   and m_p.scope_id = w.platform_id
   and m_p.status = 'active'
  where (select id from uid) is not null
    and (m_w.id is not null or m_a.id is not null or m_p.id is not null);
$$;

create or replace function public.current_agency_ids() returns uuid[]
language sql stable security definer set search_path = public
as $$
  with uid as (select vita_priv.current_user_id() as id)
  select coalesce(array_agg(distinct a.id), '{}'::uuid[])
  from public.agencies a
  left join public.memberships m_a
    on m_a.user_id = (select id from uid)
   and m_a.scope = 'agency'
   and m_a.scope_id = a.id
   and m_a.status = 'active'
  left join public.memberships m_p
    on m_p.user_id = (select id from uid)
   and m_p.scope = 'platform'
   and m_p.scope_id = a.platform_id
   and m_p.status = 'active'
  where (select id from uid) is not null
    and (m_a.id is not null or m_p.id is not null);
$$;

create or replace function public.current_platform_ids() returns uuid[]
language sql stable security definer set search_path = public
as $$
  with uid as (select vita_priv.current_user_id() as id)
  select coalesce(array_agg(distinct m.scope_id), '{}'::uuid[])
  from public.memberships m
  where m.user_id = (select id from uid)
    and m.scope = 'platform'
    and m.status = 'active';
$$;

create or replace function public.has_workspace_role(_ws uuid, _roles text[]) returns boolean
language sql stable security definer set search_path = public
as $$
  with uid as (select vita_priv.current_user_id() as id)
  select exists (
    select 1
    from public.workspaces w
    join public.memberships m
      on (
            (m.scope = 'workspace' and m.scope_id = w.id)
         or (m.scope = 'agency'    and m.scope_id = w.agency_id)
         or (m.scope = 'platform'  and m.scope_id = w.platform_id)
      )
    where w.id = _ws
      and m.user_id = (select id from uid)
      and m.status = 'active'
      and (cardinality(_roles) = 0 or m.role = any(_roles))
  );
$$;

grant execute on function public.current_workspace_ids() to authenticated, service_role;
grant execute on function public.current_agency_ids()    to authenticated, service_role;
grant execute on function public.current_platform_ids()  to authenticated, service_role;
grant execute on function public.has_workspace_role(uuid, text[]) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- platforms
-- ---------------------------------------------------------------------------

drop policy if exists platforms_select on public.platforms;
create policy platforms_select on public.platforms
  for select to authenticated
  using (id = any(public.current_platform_ids()));

drop policy if exists platforms_service_all on public.platforms;
create policy platforms_service_all on public.platforms
  for all to service_role using (true) with check (true);

-- ---------------------------------------------------------------------------
-- agencies
-- ---------------------------------------------------------------------------

drop policy if exists agencies_select on public.agencies;
create policy agencies_select on public.agencies
  for select to authenticated
  using (
    id = any(public.current_agency_ids())
    or platform_id = any(public.current_platform_ids())
  );

drop policy if exists agencies_service_all on public.agencies;
create policy agencies_service_all on public.agencies
  for all to service_role using (true) with check (true);

-- ---------------------------------------------------------------------------
-- workspaces
-- ---------------------------------------------------------------------------

drop policy if exists workspaces_select on public.workspaces;
create policy workspaces_select on public.workspaces
  for select to authenticated
  using (
    id = any(public.current_workspace_ids())
    or agency_id = any(public.current_agency_ids())
    or platform_id = any(public.current_platform_ids())
  );

drop policy if exists workspaces_service_all on public.workspaces;
create policy workspaces_service_all on public.workspaces
  for all to service_role using (true) with check (true);

-- ---------------------------------------------------------------------------
-- users
-- ---------------------------------------------------------------------------

drop policy if exists users_self_select on public.users;
create policy users_self_select on public.users
  for select to authenticated
  using (id = vita_priv.current_user_id());

drop policy if exists users_self_update on public.users;
create policy users_self_update on public.users
  for update to authenticated
  using (id = vita_priv.current_user_id())
  with check (id = vita_priv.current_user_id());

drop policy if exists users_service_all on public.users;
create policy users_service_all on public.users
  for all to service_role using (true) with check (true);

-- ---------------------------------------------------------------------------
-- memberships
-- ---------------------------------------------------------------------------

drop policy if exists memberships_self_select on public.memberships;
create policy memberships_self_select on public.memberships
  for select to authenticated
  using (
    user_id = vita_priv.current_user_id()
    or (scope = 'workspace' and scope_id = any(public.current_workspace_ids()))
    or (scope = 'agency'    and scope_id = any(public.current_agency_ids()))
    or (scope = 'platform'  and scope_id = any(public.current_platform_ids()))
  );

drop policy if exists memberships_service_all on public.memberships;
create policy memberships_service_all on public.memberships
  for all to service_role using (true) with check (true);
