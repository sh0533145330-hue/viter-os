// Workspace-tier policies for VitaOS.
// Members can read; admins/editors can mutate.

permit (
  principal in Role::"workspace.admin",
  action,
  resource
)
when {
  resource has workspaceId &&
  principal.workspaceIds.contains(resource.workspaceId)
};

permit (
  principal in Role::"workspace.editor",
  action in [
    Action::"workspace:read",
    Action::"ontology:read",
    Action::"ontology:write",
    Action::"inbox:read",
    Action::"inbox:write",
    Action::"objective:read",
    Action::"objective:write",
    Action::"dashboard:read"
  ],
  resource
)
when {
  resource has workspaceId &&
  principal.workspaceIds.contains(resource.workspaceId)
};

permit (
  principal in Role::"workspace.member",
  action in [
    Action::"workspace:read",
    Action::"ontology:read",
    Action::"inbox:read",
    Action::"inbox:write",
    Action::"objective:read",
    Action::"dashboard:read"
  ],
  resource
)
when {
  resource has workspaceId &&
  principal.workspaceIds.contains(resource.workspaceId)
};

permit (
  principal in Role::"workspace.viewer",
  action in [
    Action::"workspace:read",
    Action::"ontology:read",
    Action::"inbox:read",
    Action::"objective:read",
    Action::"dashboard:read"
  ],
  resource
)
when {
  resource has workspaceId &&
  principal.workspaceIds.contains(resource.workspaceId)
};

forbid (
  principal,
  action in [Action::"workspace:delete", Action::"workspace:transfer"],
  resource
)
unless {
  principal in Role::"workspace.admin"
};
