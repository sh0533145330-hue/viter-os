// Platform-tier policies for VitaOS.
// Principals are User entities; resources are Platform/Agency/Workspace nodes.

permit (
  principal in Role::"platform.admin",
  action,
  resource
)
when {
  resource has platformId &&
  principal.platformIds.contains(resource.platformId)
};

permit (
  principal in Role::"platform.operator",
  action in [
    Action::"agency:read",
    Action::"agency:create",
    Action::"agency:update",
    Action::"workspace:read",
    Action::"workspace:create",
    Action::"workspace:update"
  ],
  resource
)
when {
  resource has platformId &&
  principal.platformIds.contains(resource.platformId)
};

forbid (
  principal,
  action in [Action::"platform:delete", Action::"platform:transfer"],
  resource
)
unless {
  principal in Role::"platform.admin"
};
