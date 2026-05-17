import { relations } from 'drizzle-orm';
import {
  agencies,
  agentDefinitions,
  agentRuns,
  agentTuningRuns,
  approvalActions,
  approvals,
  auditLog,
  boards,
  brandIdentities,
  connectorInstances,
  costMeters,
  dashboards,
  derivationRuns,
  entities,
  entityActions,
  entityLinks,
  inboxItems,
  keyResults,
  l0Artifacts,
  l0Chunks,
  l1Artifacts,
  labelOverrides,
  libraryItems,
  lineageEdges,
  linkTypes,
  memberships,
  mindEvents,
  mindItems,
  mindProposals,
  objectiveUpdates,
  objectives,
  objectTypes,
  packDeployments,
  packVersions,
  packs,
  platforms,
  propertyTypes,
  serviceAccounts,
  skillCalls,
  skillDefinitions,
  sourceHealth,
  syncErrors,
  syncJobs,
  syncRuns,
  timMinds,
  tomBoundaryActs,
  tomMinds,
  trainingPairs,
  users,
  viewCaches,
  views,
  workflowDefinitions,
  workflowEvents,
  workflowRuns,
  workflowSteps,
  workspaces,
  actionTypes,
} from './schema/index.js';

export const platformsRelations = relations(platforms, ({ many }) => ({
  agencies: many(agencies),
  workspaces: many(workspaces),
}));

export const agenciesRelations = relations(agencies, ({ one, many }) => ({
  platform: one(platforms, { fields: [agencies.platformId], references: [platforms.id] }),
  workspaces: many(workspaces),
}));

export const workspacesRelations = relations(workspaces, ({ one, many }) => ({
  platform: one(platforms, { fields: [workspaces.platformId], references: [platforms.id] }),
  agency: one(agencies, { fields: [workspaces.agencyId], references: [agencies.id] }),
  l0Artifacts: many(l0Artifacts),
  l1Artifacts: many(l1Artifacts),
  entities: many(entities),
  inboxItems: many(inboxItems),
}));

export const usersRelations = relations(users, ({ many }) => ({
  memberships: many(memberships),
  inboxItems: many(inboxItems),
}));

export const membershipsRelations = relations(memberships, ({ one }) => ({
  user: one(users, { fields: [memberships.userId], references: [users.id] }),
}));

export const l0ArtifactsRelations = relations(l0Artifacts, ({ one, many }) => ({
  workspace: one(workspaces, { fields: [l0Artifacts.workspaceId], references: [workspaces.id] }),
  chunks: many(l0Chunks),
  l1Artifacts: many(l1Artifacts),
}));

export const l0ChunksRelations = relations(l0Chunks, ({ one }) => ({
  l0: one(l0Artifacts, { fields: [l0Chunks.l0Id], references: [l0Artifacts.id] }),
  workspace: one(workspaces, { fields: [l0Chunks.workspaceId], references: [workspaces.id] }),
}));

export const l1ArtifactsRelations = relations(l1Artifacts, ({ one }) => ({
  l0: one(l0Artifacts, { fields: [l1Artifacts.l0Id], references: [l0Artifacts.id] }),
  workspace: one(workspaces, { fields: [l1Artifacts.workspaceId], references: [workspaces.id] }),
}));

export const objectTypesRelations = relations(objectTypes, ({ many }) => ({
  properties: many(propertyTypes),
  entities: many(entities),
  outgoingLinks: many(linkTypes),
}));

export const linkTypesRelations = relations(linkTypes, ({ one }) => ({
  from: one(objectTypes, { fields: [linkTypes.fromType], references: [objectTypes.id] }),
  to: one(objectTypes, { fields: [linkTypes.toType], references: [objectTypes.id] }),
}));

export const actionTypesRelations = relations(actionTypes, ({ one, many }) => ({
  target: one(objectTypes, { fields: [actionTypes.targetType], references: [objectTypes.id] }),
  actions: many(entityActions),
}));

export const propertyTypesRelations = relations(propertyTypes, ({ one }) => ({
  owner: one(objectTypes, { fields: [propertyTypes.ownerType], references: [objectTypes.id] }),
}));

export const entitiesRelations = relations(entities, ({ one, many }) => ({
  workspace: one(workspaces, { fields: [entities.workspaceId], references: [workspaces.id] }),
  objectType: one(objectTypes, { fields: [entities.objectTypeId], references: [objectTypes.id] }),
  outgoingLinks: many(entityLinks),
}));

export const entityLinksRelations = relations(entityLinks, ({ one }) => ({
  linkType: one(linkTypes, { fields: [entityLinks.linkTypeId], references: [linkTypes.id] }),
  from: one(entities, { fields: [entityLinks.fromEntity], references: [entities.id] }),
  to: one(entities, { fields: [entityLinks.toEntity], references: [entities.id] }),
}));

export const entityActionsRelations = relations(entityActions, ({ one }) => ({
  actionType: one(actionTypes, { fields: [entityActions.actionTypeId], references: [actionTypes.id] }),
  subject: one(entities, { fields: [entityActions.subjectEntity], references: [entities.id] }),
  target: one(entities, { fields: [entityActions.targetEntity], references: [entities.id] }),
}));

export const packsRelations = relations(packs, ({ many }) => ({
  versions: many(packVersions),
}));

export const packVersionsRelations = relations(packVersions, ({ one, many }) => ({
  pack: one(packs, { fields: [packVersions.packId], references: [packs.id] }),
  deployments: many(packDeployments),
  labelOverrides: many(labelOverrides),
}));

export const packDeploymentsRelations = relations(packDeployments, ({ one }) => ({
  workspace: one(workspaces, { fields: [packDeployments.workspaceId], references: [workspaces.id] }),
  version: one(packVersions, { fields: [packDeployments.packVersionId], references: [packVersions.id] }),
}));

export const labelOverridesRelations = relations(labelOverrides, ({ one }) => ({
  version: one(packVersions, { fields: [labelOverrides.packVersionId], references: [packVersions.id] }),
}));

export const tomMindsRelations = relations(tomMinds, ({ one, many }) => ({
  user: one(users, { fields: [tomMinds.userId], references: [users.id] }),
  workspace: one(workspaces, { fields: [tomMinds.workspaceId], references: [workspaces.id] }),
  items: many(mindItems),
}));

export const timMindsRelations = relations(timMinds, ({ one }) => ({
  workspace: one(workspaces, { fields: [timMinds.workspaceId], references: [workspaces.id] }),
}));

export const mindItemsRelations = relations(mindItems, ({ one }) => ({
  workspace: one(workspaces, { fields: [mindItems.workspaceId], references: [workspaces.id] }),
}));

export const mindProposalsRelations = relations(mindProposals, ({ one }) => ({
  workspace: one(workspaces, { fields: [mindProposals.workspaceId], references: [workspaces.id] }),
  decider: one(users, { fields: [mindProposals.decidedBy], references: [users.id] }),
}));

export const mindEventsRelations = relations(mindEvents, ({ one }) => ({
  workspace: one(workspaces, { fields: [mindEvents.workspaceId], references: [workspaces.id] }),
  actor: one(users, { fields: [mindEvents.actorUserId], references: [users.id] }),
}));

export const objectivesRelations = relations(objectives, ({ one, many }) => ({
  workspace: one(workspaces, { fields: [objectives.workspaceId], references: [workspaces.id] }),
  owner: one(users, { fields: [objectives.ownerUserId], references: [users.id] }),
  keyResults: many(keyResults),
  updates: many(objectiveUpdates),
}));

export const keyResultsRelations = relations(keyResults, ({ one }) => ({
  objective: one(objectives, { fields: [keyResults.objectiveId], references: [objectives.id] }),
}));

export const objectiveUpdatesRelations = relations(objectiveUpdates, ({ one }) => ({
  objective: one(objectives, { fields: [objectiveUpdates.objectiveId], references: [objectives.id] }),
  poster: one(users, { fields: [objectiveUpdates.postedBy], references: [users.id] }),
}));

export const workflowDefinitionsRelations = relations(workflowDefinitions, ({ many }) => ({
  runs: many(workflowRuns),
}));

export const workflowRunsRelations = relations(workflowRuns, ({ one, many }) => ({
  workspace: one(workspaces, { fields: [workflowRuns.workspaceId], references: [workspaces.id] }),
  definition: one(workflowDefinitions, {
    fields: [workflowRuns.workflowDefinitionId],
    references: [workflowDefinitions.id],
  }),
  steps: many(workflowSteps),
  events: many(workflowEvents),
}));

export const workflowStepsRelations = relations(workflowSteps, ({ one }) => ({
  run: one(workflowRuns, { fields: [workflowSteps.runId], references: [workflowRuns.id] }),
}));

export const workflowEventsRelations = relations(workflowEvents, ({ one }) => ({
  run: one(workflowRuns, { fields: [workflowEvents.runId], references: [workflowRuns.id] }),
}));

export const skillCallsRelations = relations(skillCalls, ({ one }) => ({
  workspace: one(workspaces, { fields: [skillCalls.workspaceId], references: [workspaces.id] }),
}));

export const viewsRelations = relations(views, ({ one, many }) => ({
  workspace: one(workspaces, { fields: [views.workspaceId], references: [workspaces.id] }),
  caches: many(viewCaches),
}));

export const viewCachesRelations = relations(viewCaches, ({ one }) => ({
  view: one(views, { fields: [viewCaches.viewId], references: [views.id] }),
  workspace: one(workspaces, { fields: [viewCaches.workspaceId], references: [workspaces.id] }),
}));

export const dashboardsRelations = relations(dashboards, ({ one }) => ({
  workspace: one(workspaces, { fields: [dashboards.workspaceId], references: [workspaces.id] }),
}));

export const boardsRelations = relations(boards, ({ one }) => ({
  workspace: one(workspaces, { fields: [boards.workspaceId], references: [workspaces.id] }),
}));

export const lineageEdgesRelations = relations(lineageEdges, ({ one }) => ({
  workspace: one(workspaces, { fields: [lineageEdges.workspaceId], references: [workspaces.id] }),
  run: one(derivationRuns, { fields: [lineageEdges.derivationRunId], references: [derivationRuns.id] }),
}));

export const derivationRunsRelations = relations(derivationRuns, ({ one, many }) => ({
  workspace: one(workspaces, { fields: [derivationRuns.workspaceId], references: [workspaces.id] }),
  edges: many(lineageEdges),
}));

export const inboxItemsRelations = relations(inboxItems, ({ one }) => ({
  user: one(users, { fields: [inboxItems.userId], references: [users.id] }),
  workspace: one(workspaces, { fields: [inboxItems.workspaceId], references: [workspaces.id] }),
}));

export const approvalsRelations = relations(approvals, ({ one, many }) => ({
  workspace: one(workspaces, { fields: [approvals.workspaceId], references: [workspaces.id] }),
  actionType: one(actionTypes, { fields: [approvals.actionTypeId], references: [actionTypes.id] }),
  decider: one(users, { fields: [approvals.decidedBy], references: [users.id] }),
  actions: many(approvalActions),
}));

export const approvalActionsRelations = relations(approvalActions, ({ one }) => ({
  approval: one(approvals, { fields: [approvalActions.approvalId], references: [approvals.id] }),
}));

export const tomBoundaryActsRelations = relations(tomBoundaryActs, ({ one }) => ({
  workspace: one(workspaces, { fields: [tomBoundaryActs.workspaceId], references: [workspaces.id] }),
  user: one(users, { fields: [tomBoundaryActs.userId], references: [users.id] }),
  approval: one(approvals, { fields: [tomBoundaryActs.approvalId], references: [approvals.id] }),
}));

export const agentRunsRelations = relations(agentRuns, ({ one }) => ({
  workspace: one(workspaces, { fields: [agentRuns.workspaceId], references: [workspaces.id] }),
}));

export const agentTuningRunsRelations = relations(agentTuningRuns, ({ one }) => ({
  workspace: one(workspaces, { fields: [agentTuningRuns.workspaceId], references: [workspaces.id] }),
}));

export const trainingPairsRelations = relations(trainingPairs, ({ one }) => ({
  workspace: one(workspaces, { fields: [trainingPairs.workspaceId], references: [workspaces.id] }),
}));

export const connectorInstancesRelations = relations(connectorInstances, ({ one, many }) => ({
  workspace: one(workspaces, { fields: [connectorInstances.workspaceId], references: [workspaces.id] }),
  owner: one(users, { fields: [connectorInstances.ownerUserId], references: [users.id] }),
  jobs: many(syncJobs),
  health: many(sourceHealth),
}));

export const syncJobsRelations = relations(syncJobs, ({ one, many }) => ({
  instance: one(connectorInstances, {
    fields: [syncJobs.connectorInstanceId],
    references: [connectorInstances.id],
  }),
  runs: many(syncRuns),
}));

export const syncRunsRelations = relations(syncRuns, ({ one, many }) => ({
  job: one(syncJobs, { fields: [syncRuns.syncJobId], references: [syncJobs.id] }),
  errors: many(syncErrors),
}));

export const syncErrorsRelations = relations(syncErrors, ({ one }) => ({
  run: one(syncRuns, { fields: [syncErrors.syncRunId], references: [syncRuns.id] }),
}));

export const costMetersRelations = relations(costMeters, ({ one }) => ({
  workspace: one(workspaces, { fields: [costMeters.workspaceId], references: [workspaces.id] }),
}));

export const sourceHealthRelations = relations(sourceHealth, ({ one }) => ({
  instance: one(connectorInstances, {
    fields: [sourceHealth.connectorInstanceId],
    references: [connectorInstances.id],
  }),
}));

export const auditLogRelations = relations(auditLog, () => ({}));

export const agentDefinitionsRelations = relations(agentDefinitions, () => ({}));

export const skillDefinitionsRelations = relations(skillDefinitions, () => ({}));

export const libraryItemsRelations = relations(libraryItems, () => ({}));

export const brandIdentitiesRelations = relations(brandIdentities, () => ({}));

export const serviceAccountsRelations = relations(serviceAccounts, ({ one }) => ({
  creator: one(users, { fields: [serviceAccounts.createdBy], references: [users.id] }),
}));
