// Agency-tier policies for VitaOS.
// Agencies see their own workspaces, but not other agencies on the same platform.

permit (
  principal in Role::"agency.operator",
  action,
  resource
)
when {
  resource has agencyId &&
  principal.agencyIds.contains(resource.agencyId)
};

permit (
  principal in Role::"agency.viewer",
  action in [
    Action::"agency:read",
    Action::"workspace:read",
    Action::"ontology:read",
    Action::"inbox:read",
    Action::"objective:read",
    Action::"dashboard:read"
  ],
  resource
)
when {
  resource has agencyId &&
  principal.agencyIds.contains(resource.agencyId)
};

forbid (
  principal,
  action in [
    Action::"agency:delete",
    Action::"agency:transfer",
    Action::"workspace:delete"
  ],
  resource
)
unless {
  principal in Role::"agency.operator"
};
