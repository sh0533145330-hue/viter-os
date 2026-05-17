-- =============================================================================
-- 0003_substrate_rls.sql
--
-- Default per-workspace policies for substrate tables. These policies expect
-- a `workspace_id` column on the row and use `current_workspace_ids()` from
-- `0002_tenancy_rls.sql`.
--
-- The pattern: SELECT/INSERT/UPDATE/DELETE allowed for authenticated users when
-- the row's workspace_id is in the caller's accessible set. service_role gets
-- unrestricted access (used for workers and migrations).
-- =============================================================================

-- A small helper that emits a uniform set of policies for a given table.
-- It cannot be invoked dynamically from SQL, so we expand the pattern manually
-- for every table below.

-- ---------------------------------------------------------------------------
-- L0 / L1
-- ---------------------------------------------------------------------------

drop policy if exists l0_artifacts_workspace_select on public.l0_artifacts;
create policy l0_artifacts_workspace_select on public.l0_artifacts
  for select to authenticated using (workspace_id = any(public.current_workspace_ids()));
drop policy if exists l0_artifacts_workspace_modify on public.l0_artifacts;
create policy l0_artifacts_workspace_modify on public.l0_artifacts
  for all to authenticated
  using (workspace_id = any(public.current_workspace_ids()))
  with check (workspace_id = any(public.current_workspace_ids()));
drop policy if exists l0_artifacts_service_all on public.l0_artifacts;
create policy l0_artifacts_service_all on public.l0_artifacts
  for all to service_role using (true) with check (true);

drop policy if exists l0_chunks_workspace_select on public.l0_chunks;
create policy l0_chunks_workspace_select on public.l0_chunks
  for select to authenticated using (workspace_id = any(public.current_workspace_ids()));
drop policy if exists l0_chunks_service_all on public.l0_chunks;
create policy l0_chunks_service_all on public.l0_chunks
  for all to service_role using (true) with check (true);

drop policy if exists l1_artifacts_workspace_select on public.l1_artifacts;
create policy l1_artifacts_workspace_select on public.l1_artifacts
  for select to authenticated using (workspace_id = any(public.current_workspace_ids()));
drop policy if exists l1_artifacts_workspace_modify on public.l1_artifacts;
create policy l1_artifacts_workspace_modify on public.l1_artifacts
  for all to authenticated
  using (workspace_id = any(public.current_workspace_ids()))
  with check (workspace_id = any(public.current_workspace_ids()));
drop policy if exists l1_artifacts_service_all on public.l1_artifacts;
create policy l1_artifacts_service_all on public.l1_artifacts
  for all to service_role using (true) with check (true);

-- ---------------------------------------------------------------------------
-- L2 ontology + instances
-- (object_types/link_types/action_types/property_types are scope-keyed, not
-- workspace-keyed; public scope is readable to all authenticated)
-- ---------------------------------------------------------------------------

drop policy if exists object_types_scope_select on public.object_types;
create policy object_types_scope_select on public.object_types
  for select to authenticated using (
    scope = 'public'
    or (scope = 'workspace' and scope_id = any(public.current_workspace_ids()))
    or (scope = 'agency'    and scope_id = any(public.current_agency_ids()))
    or (scope = 'platform'  and scope_id = any(public.current_platform_ids()))
  );
drop policy if exists object_types_service_all on public.object_types;
create policy object_types_service_all on public.object_types for all to service_role using (true) with check (true);

drop policy if exists link_types_scope_select on public.link_types;
create policy link_types_scope_select on public.link_types
  for select to authenticated using (
    scope = 'public'
    or (scope = 'workspace' and scope_id = any(public.current_workspace_ids()))
    or (scope = 'agency'    and scope_id = any(public.current_agency_ids()))
    or (scope = 'platform'  and scope_id = any(public.current_platform_ids()))
  );
drop policy if exists link_types_service_all on public.link_types;
create policy link_types_service_all on public.link_types for all to service_role using (true) with check (true);

drop policy if exists action_types_scope_select on public.action_types;
create policy action_types_scope_select on public.action_types
  for select to authenticated using (
    scope = 'public'
    or (scope = 'workspace' and scope_id = any(public.current_workspace_ids()))
    or (scope = 'agency'    and scope_id = any(public.current_agency_ids()))
    or (scope = 'platform'  and scope_id = any(public.current_platform_ids()))
  );
drop policy if exists action_types_service_all on public.action_types;
create policy action_types_service_all on public.action_types for all to service_role using (true) with check (true);

drop policy if exists property_types_select on public.property_types;
create policy property_types_select on public.property_types for select to authenticated using (true);
drop policy if exists property_types_service_all on public.property_types;
create policy property_types_service_all on public.property_types for all to service_role using (true) with check (true);

drop policy if exists entities_workspace_all on public.entities;
create policy entities_workspace_all on public.entities
  for all to authenticated
  using (workspace_id = any(public.current_workspace_ids()))
  with check (workspace_id = any(public.current_workspace_ids()));
drop policy if exists entities_service_all on public.entities;
create policy entities_service_all on public.entities for all to service_role using (true) with check (true);

drop policy if exists entity_links_workspace_all on public.entity_links;
create policy entity_links_workspace_all on public.entity_links
  for all to authenticated
  using (workspace_id = any(public.current_workspace_ids()))
  with check (workspace_id = any(public.current_workspace_ids()));
drop policy if exists entity_links_service_all on public.entity_links;
create policy entity_links_service_all on public.entity_links for all to service_role using (true) with check (true);

drop policy if exists entity_actions_workspace_all on public.entity_actions;
create policy entity_actions_workspace_all on public.entity_actions
  for all to authenticated
  using (workspace_id = any(public.current_workspace_ids()))
  with check (workspace_id = any(public.current_workspace_ids()));
drop policy if exists entity_actions_service_all on public.entity_actions;
create policy entity_actions_service_all on public.entity_actions for all to service_role using (true) with check (true);

-- ---------------------------------------------------------------------------
-- L2 library
-- ---------------------------------------------------------------------------

drop policy if exists library_items_scope_select on public.library_items;
create policy library_items_scope_select on public.library_items
  for select to authenticated using (
    scope = 'public'
    or (scope = 'workspace' and scope_id = any(public.current_workspace_ids()))
    or (scope = 'agency'    and scope_id = any(public.current_agency_ids()))
    or (scope = 'platform'  and scope_id = any(public.current_platform_ids()))
  );
drop policy if exists library_items_service_all on public.library_items;
create policy library_items_service_all on public.library_items for all to service_role using (true) with check (true);

drop policy if exists packs_select on public.packs;
create policy packs_select on public.packs for select to authenticated using (true);
drop policy if exists packs_service_all on public.packs;
create policy packs_service_all on public.packs for all to service_role using (true) with check (true);

drop policy if exists pack_versions_select on public.pack_versions;
create policy pack_versions_select on public.pack_versions for select to authenticated using (true);
drop policy if exists pack_versions_service_all on public.pack_versions;
create policy pack_versions_service_all on public.pack_versions for all to service_role using (true) with check (true);

drop policy if exists pack_deployments_workspace_all on public.pack_deployments;
create policy pack_deployments_workspace_all on public.pack_deployments
  for all to authenticated
  using (workspace_id = any(public.current_workspace_ids()))
  with check (workspace_id = any(public.current_workspace_ids()));
drop policy if exists pack_deployments_service_all on public.pack_deployments;
create policy pack_deployments_service_all on public.pack_deployments for all to service_role using (true) with check (true);

drop policy if exists label_overrides_select on public.label_overrides;
create policy label_overrides_select on public.label_overrides for select to authenticated using (
  scope = 'public'
  or (scope = 'workspace' and scope_id = any(public.current_workspace_ids()))
  or (scope = 'agency'    and scope_id = any(public.current_agency_ids()))
  or (scope = 'platform'  and scope_id = any(public.current_platform_ids()))
);
drop policy if exists label_overrides_service_all on public.label_overrides;
create policy label_overrides_service_all on public.label_overrides for all to service_role using (true) with check (true);

-- ---------------------------------------------------------------------------
-- L2 mind
-- ---------------------------------------------------------------------------

drop policy if exists tom_minds_owner on public.tom_minds;
create policy tom_minds_owner on public.tom_minds
  for all to authenticated
  using (user_id = vita_priv.current_user_id() and workspace_id = any(public.current_workspace_ids()))
  with check (user_id = vita_priv.current_user_id() and workspace_id = any(public.current_workspace_ids()));
drop policy if exists tom_minds_service_all on public.tom_minds;
create policy tom_minds_service_all on public.tom_minds for all to service_role using (true) with check (true);

drop policy if exists tim_minds_workspace_all on public.tim_minds;
create policy tim_minds_workspace_all on public.tim_minds
  for all to authenticated
  using (workspace_id = any(public.current_workspace_ids()))
  with check (workspace_id = any(public.current_workspace_ids()));
drop policy if exists tim_minds_service_all on public.tim_minds;
create policy tim_minds_service_all on public.tim_minds for all to service_role using (true) with check (true);

drop policy if exists mind_items_workspace_all on public.mind_items;
create policy mind_items_workspace_all on public.mind_items
  for all to authenticated
  using (workspace_id = any(public.current_workspace_ids()))
  with check (workspace_id = any(public.current_workspace_ids()));
drop policy if exists mind_items_service_all on public.mind_items;
create policy mind_items_service_all on public.mind_items for all to service_role using (true) with check (true);

drop policy if exists mind_proposals_workspace_all on public.mind_proposals;
create policy mind_proposals_workspace_all on public.mind_proposals
  for all to authenticated
  using (workspace_id = any(public.current_workspace_ids()))
  with check (workspace_id = any(public.current_workspace_ids()));
drop policy if exists mind_proposals_service_all on public.mind_proposals;
create policy mind_proposals_service_all on public.mind_proposals for all to service_role using (true) with check (true);

drop policy if exists mind_events_workspace_select on public.mind_events;
create policy mind_events_workspace_select on public.mind_events
  for select to authenticated using (workspace_id = any(public.current_workspace_ids()));
drop policy if exists mind_events_service_all on public.mind_events;
create policy mind_events_service_all on public.mind_events for all to service_role using (true) with check (true);

-- ---------------------------------------------------------------------------
-- L2 objectives
-- ---------------------------------------------------------------------------

drop policy if exists objectives_workspace_all on public.objectives;
create policy objectives_workspace_all on public.objectives
  for all to authenticated
  using (workspace_id = any(public.current_workspace_ids()))
  with check (workspace_id = any(public.current_workspace_ids()));
drop policy if exists objectives_service_all on public.objectives;
create policy objectives_service_all on public.objectives for all to service_role using (true) with check (true);

drop policy if exists key_results_workspace_all on public.key_results;
create policy key_results_workspace_all on public.key_results
  for all to authenticated
  using (exists (
    select 1 from public.objectives o
    where o.id = key_results.objective_id
      and o.workspace_id = any(public.current_workspace_ids())
  ))
  with check (exists (
    select 1 from public.objectives o
    where o.id = key_results.objective_id
      and o.workspace_id = any(public.current_workspace_ids())
  ));
drop policy if exists key_results_service_all on public.key_results;
create policy key_results_service_all on public.key_results for all to service_role using (true) with check (true);

drop policy if exists objective_updates_workspace_all on public.objective_updates;
create policy objective_updates_workspace_all on public.objective_updates
  for all to authenticated
  using (exists (
    select 1 from public.objectives o
    where o.id = objective_updates.objective_id
      and o.workspace_id = any(public.current_workspace_ids())
  ))
  with check (exists (
    select 1 from public.objectives o
    where o.id = objective_updates.objective_id
      and o.workspace_id = any(public.current_workspace_ids())
  ));
drop policy if exists objective_updates_service_all on public.objective_updates;
create policy objective_updates_service_all on public.objective_updates for all to service_role using (true) with check (true);

-- ---------------------------------------------------------------------------
-- L3
-- ---------------------------------------------------------------------------

drop policy if exists workflow_definitions_scope_select on public.workflow_definitions;
create policy workflow_definitions_scope_select on public.workflow_definitions
  for select to authenticated using (
    scope = 'public'
    or (scope = 'workspace' and scope_id = any(public.current_workspace_ids()))
    or (scope = 'agency'    and scope_id = any(public.current_agency_ids()))
    or (scope = 'platform'  and scope_id = any(public.current_platform_ids()))
  );
drop policy if exists workflow_definitions_service_all on public.workflow_definitions;
create policy workflow_definitions_service_all on public.workflow_definitions for all to service_role using (true) with check (true);

drop policy if exists workflow_runs_workspace_all on public.workflow_runs;
create policy workflow_runs_workspace_all on public.workflow_runs
  for all to authenticated
  using (workspace_id = any(public.current_workspace_ids()))
  with check (workspace_id = any(public.current_workspace_ids()));
drop policy if exists workflow_runs_service_all on public.workflow_runs;
create policy workflow_runs_service_all on public.workflow_runs for all to service_role using (true) with check (true);

drop policy if exists workflow_steps_workspace_all on public.workflow_steps;
create policy workflow_steps_workspace_all on public.workflow_steps
  for all to authenticated
  using (exists (
    select 1 from public.workflow_runs r
    where r.id = workflow_steps.run_id
      and r.workspace_id = any(public.current_workspace_ids())
  ))
  with check (exists (
    select 1 from public.workflow_runs r
    where r.id = workflow_steps.run_id
      and r.workspace_id = any(public.current_workspace_ids())
  ));
drop policy if exists workflow_steps_service_all on public.workflow_steps;
create policy workflow_steps_service_all on public.workflow_steps for all to service_role using (true) with check (true);

drop policy if exists workflow_events_workspace_select on public.workflow_events;
create policy workflow_events_workspace_select on public.workflow_events
  for select to authenticated using (exists (
    select 1 from public.workflow_runs r
    where r.id = workflow_events.run_id
      and r.workspace_id = any(public.current_workspace_ids())
  ));
drop policy if exists workflow_events_service_all on public.workflow_events;
create policy workflow_events_service_all on public.workflow_events for all to service_role using (true) with check (true);

drop policy if exists skill_definitions_scope_select on public.skill_definitions;
create policy skill_definitions_scope_select on public.skill_definitions
  for select to authenticated using (
    scope = 'public'
    or (scope = 'workspace' and scope_id = any(public.current_workspace_ids()))
    or (scope = 'agency'    and scope_id = any(public.current_agency_ids()))
    or (scope = 'platform'  and scope_id = any(public.current_platform_ids()))
  );
drop policy if exists skill_definitions_service_all on public.skill_definitions;
create policy skill_definitions_service_all on public.skill_definitions for all to service_role using (true) with check (true);

drop policy if exists skill_calls_workspace_select on public.skill_calls;
create policy skill_calls_workspace_select on public.skill_calls
  for select to authenticated using (workspace_id = any(public.current_workspace_ids()));
drop policy if exists skill_calls_service_all on public.skill_calls;
create policy skill_calls_service_all on public.skill_calls for all to service_role using (true) with check (true);

-- ---------------------------------------------------------------------------
-- L4
-- ---------------------------------------------------------------------------

drop policy if exists views_workspace_all on public.views;
create policy views_workspace_all on public.views
  for all to authenticated
  using (workspace_id = any(public.current_workspace_ids()))
  with check (workspace_id = any(public.current_workspace_ids()));
drop policy if exists views_service_all on public.views;
create policy views_service_all on public.views for all to service_role using (true) with check (true);

drop policy if exists dashboards_workspace_all on public.dashboards;
create policy dashboards_workspace_all on public.dashboards
  for all to authenticated
  using (workspace_id = any(public.current_workspace_ids()))
  with check (workspace_id = any(public.current_workspace_ids()));
drop policy if exists dashboards_service_all on public.dashboards;
create policy dashboards_service_all on public.dashboards for all to service_role using (true) with check (true);

drop policy if exists boards_workspace_all on public.boards;
create policy boards_workspace_all on public.boards
  for all to authenticated
  using (workspace_id = any(public.current_workspace_ids()))
  with check (workspace_id = any(public.current_workspace_ids()));
drop policy if exists boards_service_all on public.boards;
create policy boards_service_all on public.boards for all to service_role using (true) with check (true);

drop policy if exists view_caches_workspace_select on public.view_caches;
create policy view_caches_workspace_select on public.view_caches
  for select to authenticated using (workspace_id = any(public.current_workspace_ids()));
drop policy if exists view_caches_service_all on public.view_caches;
create policy view_caches_service_all on public.view_caches for all to service_role using (true) with check (true);

-- ---------------------------------------------------------------------------
-- Lineage
-- ---------------------------------------------------------------------------

drop policy if exists lineage_edges_workspace_select on public.lineage_edges;
create policy lineage_edges_workspace_select on public.lineage_edges
  for select to authenticated using (workspace_id = any(public.current_workspace_ids()));
drop policy if exists lineage_edges_service_all on public.lineage_edges;
create policy lineage_edges_service_all on public.lineage_edges for all to service_role using (true) with check (true);

drop policy if exists derivation_runs_workspace_select on public.derivation_runs;
create policy derivation_runs_workspace_select on public.derivation_runs
  for select to authenticated using (workspace_id = any(public.current_workspace_ids()));
drop policy if exists derivation_runs_service_all on public.derivation_runs;
create policy derivation_runs_service_all on public.derivation_runs for all to service_role using (true) with check (true);

-- ---------------------------------------------------------------------------
-- Inbox + approvals + boundary
-- ---------------------------------------------------------------------------

drop policy if exists inbox_items_owner on public.inbox_items;
create policy inbox_items_owner on public.inbox_items
  for all to authenticated
  using (user_id = vita_priv.current_user_id() and workspace_id = any(public.current_workspace_ids()))
  with check (user_id = vita_priv.current_user_id() and workspace_id = any(public.current_workspace_ids()));
drop policy if exists inbox_items_service_all on public.inbox_items;
create policy inbox_items_service_all on public.inbox_items for all to service_role using (true) with check (true);

drop policy if exists approvals_workspace_all on public.approvals;
create policy approvals_workspace_all on public.approvals
  for all to authenticated
  using (workspace_id = any(public.current_workspace_ids()))
  with check (workspace_id = any(public.current_workspace_ids()));
drop policy if exists approvals_service_all on public.approvals;
create policy approvals_service_all on public.approvals for all to service_role using (true) with check (true);

drop policy if exists approval_actions_workspace_select on public.approval_actions;
create policy approval_actions_workspace_select on public.approval_actions
  for select to authenticated using (exists (
    select 1 from public.approvals a
    where a.id = approval_actions.approval_id
      and a.workspace_id = any(public.current_workspace_ids())
  ));
drop policy if exists approval_actions_service_all on public.approval_actions;
create policy approval_actions_service_all on public.approval_actions for all to service_role using (true) with check (true);

drop policy if exists tom_boundary_acts_owner on public.tom_boundary_acts;
create policy tom_boundary_acts_owner on public.tom_boundary_acts
  for all to authenticated
  using (workspace_id = any(public.current_workspace_ids()))
  with check (workspace_id = any(public.current_workspace_ids()));
drop policy if exists tom_boundary_acts_service_all on public.tom_boundary_acts;
create policy tom_boundary_acts_service_all on public.tom_boundary_acts for all to service_role using (true) with check (true);

-- ---------------------------------------------------------------------------
-- Agents
-- ---------------------------------------------------------------------------

drop policy if exists agent_definitions_scope_select on public.agent_definitions;
create policy agent_definitions_scope_select on public.agent_definitions
  for select to authenticated using (
    scope = 'public'
    or (scope = 'workspace' and scope_id = any(public.current_workspace_ids()))
    or (scope = 'agency'    and scope_id = any(public.current_agency_ids()))
    or (scope = 'platform'  and scope_id = any(public.current_platform_ids()))
  );
drop policy if exists agent_definitions_service_all on public.agent_definitions;
create policy agent_definitions_service_all on public.agent_definitions for all to service_role using (true) with check (true);

drop policy if exists agent_runs_workspace_select on public.agent_runs;
create policy agent_runs_workspace_select on public.agent_runs
  for select to authenticated using (workspace_id = any(public.current_workspace_ids()));
drop policy if exists agent_runs_service_all on public.agent_runs;
create policy agent_runs_service_all on public.agent_runs for all to service_role using (true) with check (true);

drop policy if exists training_pairs_workspace_select on public.training_pairs;
create policy training_pairs_workspace_select on public.training_pairs
  for select to authenticated using (workspace_id = any(public.current_workspace_ids()));
drop policy if exists training_pairs_service_all on public.training_pairs;
create policy training_pairs_service_all on public.training_pairs for all to service_role using (true) with check (true);

drop policy if exists agent_tuning_runs_workspace_select on public.agent_tuning_runs;
create policy agent_tuning_runs_workspace_select on public.agent_tuning_runs
  for select to authenticated using (workspace_id = any(public.current_workspace_ids()));
drop policy if exists agent_tuning_runs_service_all on public.agent_tuning_runs;
create policy agent_tuning_runs_service_all on public.agent_tuning_runs for all to service_role using (true) with check (true);

-- ---------------------------------------------------------------------------
-- Connectors
-- ---------------------------------------------------------------------------

drop policy if exists connector_instances_workspace_all on public.connector_instances;
create policy connector_instances_workspace_all on public.connector_instances
  for all to authenticated
  using (workspace_id = any(public.current_workspace_ids()))
  with check (workspace_id = any(public.current_workspace_ids()));
drop policy if exists connector_instances_service_all on public.connector_instances;
create policy connector_instances_service_all on public.connector_instances for all to service_role using (true) with check (true);

drop policy if exists sync_jobs_workspace_select on public.sync_jobs;
create policy sync_jobs_workspace_select on public.sync_jobs
  for select to authenticated using (exists (
    select 1 from public.connector_instances ci
    where ci.id = sync_jobs.connector_instance_id
      and ci.workspace_id = any(public.current_workspace_ids())
  ));
drop policy if exists sync_jobs_service_all on public.sync_jobs;
create policy sync_jobs_service_all on public.sync_jobs for all to service_role using (true) with check (true);

drop policy if exists sync_runs_workspace_select on public.sync_runs;
create policy sync_runs_workspace_select on public.sync_runs
  for select to authenticated using (exists (
    select 1 from public.sync_jobs sj
    join public.connector_instances ci on ci.id = sj.connector_instance_id
    where sj.id = sync_runs.sync_job_id
      and ci.workspace_id = any(public.current_workspace_ids())
  ));
drop policy if exists sync_runs_service_all on public.sync_runs;
create policy sync_runs_service_all on public.sync_runs for all to service_role using (true) with check (true);

drop policy if exists sync_errors_workspace_select on public.sync_errors;
create policy sync_errors_workspace_select on public.sync_errors
  for select to authenticated using (exists (
    select 1 from public.sync_runs sr
    join public.sync_jobs sj on sj.id = sr.sync_job_id
    join public.connector_instances ci on ci.id = sj.connector_instance_id
    where sr.id = sync_errors.sync_run_id
      and ci.workspace_id = any(public.current_workspace_ids())
  ));
drop policy if exists sync_errors_service_all on public.sync_errors;
create policy sync_errors_service_all on public.sync_errors for all to service_role using (true) with check (true);

-- ---------------------------------------------------------------------------
-- Audit + meters
-- ---------------------------------------------------------------------------

drop policy if exists audit_log_workspace_select on public.audit_log;
create policy audit_log_workspace_select on public.audit_log
  for select to authenticated using (workspace_id = any(public.current_workspace_ids()));
drop policy if exists audit_log_service_all on public.audit_log;
create policy audit_log_service_all on public.audit_log for all to service_role using (true) with check (true);

drop policy if exists cost_meters_workspace_select on public.cost_meters;
create policy cost_meters_workspace_select on public.cost_meters
  for select to authenticated using (workspace_id = any(public.current_workspace_ids()));
drop policy if exists cost_meters_service_all on public.cost_meters;
create policy cost_meters_service_all on public.cost_meters for all to service_role using (true) with check (true);

drop policy if exists source_health_workspace_select on public.source_health;
create policy source_health_workspace_select on public.source_health
  for select to authenticated using (exists (
    select 1 from public.connector_instances ci
    where ci.id = source_health.connector_instance_id
      and ci.workspace_id = any(public.current_workspace_ids())
  ));
drop policy if exists source_health_service_all on public.source_health;
create policy source_health_service_all on public.source_health for all to service_role using (true) with check (true);

-- ---------------------------------------------------------------------------
-- Security / branding / billing
-- ---------------------------------------------------------------------------

drop policy if exists anonymization_audit_workspace_select on public.anonymization_audit;
create policy anonymization_audit_workspace_select on public.anonymization_audit
  for select to authenticated using (workspace_id = any(public.current_workspace_ids()));
drop policy if exists anonymization_audit_service_all on public.anonymization_audit;
create policy anonymization_audit_service_all on public.anonymization_audit for all to service_role using (true) with check (true);

drop policy if exists encryption_keys_service_all on public.encryption_keys;
create policy encryption_keys_service_all on public.encryption_keys for all to service_role using (true) with check (true);
-- (no authenticated policy: key material is service-only)

drop policy if exists api_keys_scope_select on public.api_keys;
create policy api_keys_scope_select on public.api_keys
  for select to authenticated using (
    (scope = 'workspace' and scope_id = any(public.current_workspace_ids()))
    or (scope = 'agency' and scope_id = any(public.current_agency_ids()))
    or (scope = 'platform' and scope_id = any(public.current_platform_ids()))
  );
drop policy if exists api_keys_service_all on public.api_keys;
create policy api_keys_service_all on public.api_keys for all to service_role using (true) with check (true);

drop policy if exists service_accounts_scope_select on public.service_accounts;
create policy service_accounts_scope_select on public.service_accounts
  for select to authenticated using (
    (scope = 'workspace' and scope_id = any(public.current_workspace_ids()))
    or (scope = 'agency' and scope_id = any(public.current_agency_ids()))
    or (scope = 'platform' and scope_id = any(public.current_platform_ids()))
  );
drop policy if exists service_accounts_service_all on public.service_accounts;
create policy service_accounts_service_all on public.service_accounts for all to service_role using (true) with check (true);

drop policy if exists billing_configs_scope_select on public.billing_configs;
create policy billing_configs_scope_select on public.billing_configs
  for select to authenticated using (
    (scope = 'workspace' and scope_id = any(public.current_workspace_ids()))
    or (scope = 'agency' and scope_id = any(public.current_agency_ids()))
    or (scope = 'platform' and scope_id = any(public.current_platform_ids()))
  );
drop policy if exists billing_configs_service_all on public.billing_configs;
create policy billing_configs_service_all on public.billing_configs for all to service_role using (true) with check (true);

drop policy if exists brand_identities_scope_select on public.brand_identities;
create policy brand_identities_scope_select on public.brand_identities
  for select to authenticated using (
    scope = 'public'
    or (scope = 'workspace' and scope_id = any(public.current_workspace_ids()))
    or (scope = 'agency' and scope_id = any(public.current_agency_ids()))
    or (scope = 'platform' and scope_id = any(public.current_platform_ids()))
  );
drop policy if exists brand_identities_service_all on public.brand_identities;
create policy brand_identities_service_all on public.brand_identities for all to service_role using (true) with check (true);
