-- =============================================================================
-- 0001_enable_rls.sql
--
-- Enable Row Level Security (RLS) on every multi-tenant table. Policies are
-- defined in subsequent files. Tables without RLS are left explicitly noted at
-- the bottom of this file.
-- =============================================================================

-- Tenancy
alter table public.platforms     enable row level security;
alter table public.agencies      enable row level security;
alter table public.workspaces    enable row level security;
alter table public.users         enable row level security;
alter table public.memberships   enable row level security;

-- L0 / L1
alter table public.l0_artifacts  enable row level security;
alter table public.l0_chunks     enable row level security;
alter table public.l1_artifacts  enable row level security;

-- L2 ontology + instances
alter table public.object_types     enable row level security;
alter table public.link_types       enable row level security;
alter table public.action_types     enable row level security;
alter table public.property_types   enable row level security;
alter table public.entities         enable row level security;
alter table public.entity_links     enable row level security;
alter table public.entity_actions   enable row level security;

-- L2 library / packs
alter table public.library_items     enable row level security;
alter table public.packs             enable row level security;
alter table public.pack_versions     enable row level security;
alter table public.pack_deployments  enable row level security;
alter table public.label_overrides   enable row level security;

-- L2 mind
alter table public.tom_minds        enable row level security;
alter table public.tim_minds        enable row level security;
alter table public.mind_items       enable row level security;
alter table public.mind_proposals   enable row level security;
alter table public.mind_events      enable row level security;

-- L2 objectives
alter table public.objectives          enable row level security;
alter table public.key_results         enable row level security;
alter table public.objective_updates   enable row level security;

-- L3
alter table public.workflow_definitions  enable row level security;
alter table public.workflow_runs         enable row level security;
alter table public.workflow_steps        enable row level security;
alter table public.workflow_events       enable row level security;
alter table public.skill_definitions     enable row level security;
alter table public.skill_calls           enable row level security;

-- L4
alter table public.views        enable row level security;
alter table public.dashboards   enable row level security;
alter table public.boards       enable row level security;
alter table public.view_caches  enable row level security;

-- Lineage
alter table public.lineage_edges    enable row level security;
alter table public.derivation_runs  enable row level security;

-- Inbox + approvals
alter table public.inbox_items       enable row level security;
alter table public.approvals         enable row level security;
alter table public.approval_actions  enable row level security;

-- Boundary acts
alter table public.tom_boundary_acts enable row level security;

-- Agents
alter table public.agent_definitions   enable row level security;
alter table public.agent_runs          enable row level security;
alter table public.training_pairs      enable row level security;
alter table public.agent_tuning_runs   enable row level security;

-- Connectors
alter table public.connector_instances enable row level security;
alter table public.sync_jobs           enable row level security;
alter table public.sync_runs           enable row level security;
alter table public.sync_errors         enable row level security;

-- Audit + meters
alter table public.audit_log     enable row level security;
alter table public.cost_meters   enable row level security;
alter table public.source_health enable row level security;

-- Security
alter table public.anonymization_audit enable row level security;
alter table public.encryption_keys     enable row level security;
alter table public.api_keys            enable row level security;
alter table public.service_accounts    enable row level security;

-- Billing + branding
alter table public.billing_configs   enable row level security;
alter table public.brand_identities  enable row level security;
