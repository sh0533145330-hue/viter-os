import type {
  Action,
  AuthorizationContext,
  PolicyDecision,
  Principal,
  Resource,
  ScopeKind,
} from './types.js';

export interface PolicyEngine {
  authorize(
    principal: Principal,
    action: Action,
    resource: Resource,
    context?: AuthorizationContext,
  ): PolicyDecision;
}

export interface AuthorizeArgs {
  principal: Principal;
  action: Action;
  resource: Resource;
  context?: AuthorizationContext;
}

const READ_ROLES_BY_KIND: Record<ScopeKind, string[]> = {
  platform: ['admin', 'operator', 'viewer'],
  agency: ['admin', 'operator', 'viewer'],
  workspace: ['admin', 'editor', 'member', 'viewer'],
};

const WRITE_ROLES_BY_KIND: Record<ScopeKind, string[]> = {
  platform: ['admin', 'operator'],
  agency: ['admin', 'operator'],
  workspace: ['admin', 'editor', 'member'],
};

function isReadAction(actionId: string): boolean {
  return /read|list|get|view|describe/i.test(actionId);
}

function isWriteAction(actionId: string): boolean {
  return /create|update|write|delete|publish|deploy|approve|reject|edit/i.test(actionId);
}

function resolveResourceScope(resource: Resource): {
  workspaceId?: string;
  agencyId?: string;
  platformId?: string;
} {
  const out: { workspaceId?: string; agencyId?: string; platformId?: string } = {};
  if (resource.workspaceId !== undefined) out.workspaceId = resource.workspaceId;
  if (resource.agencyId !== undefined) out.agencyId = resource.agencyId;
  if (resource.platformId !== undefined) out.platformId = resource.platformId;
  if (resource.type === 'Workspace') out.workspaceId = resource.id;
  if (resource.type === 'Agency') out.agencyId = resource.id;
  if (resource.type === 'Platform') out.platformId = resource.id;
  return out;
}

export class PlaceholderPolicyEngine implements PolicyEngine {
  authorize(
    principal: Principal,
    action: Action,
    resource: Resource,
    _context?: AuthorizationContext,
  ): PolicyDecision {
    const scope = resolveResourceScope(resource);
    const candidate = principal.memberships.find((m) => {
      if (m.kind === 'workspace' && scope.workspaceId === m.id) return true;
      if (m.kind === 'agency' && (scope.agencyId === m.id || scope.workspaceId !== undefined)) {
        return scope.agencyId === m.id;
      }
      if (m.kind === 'platform' && scope.platformId === m.id) return true;
      return false;
    });

    if (!candidate) {
      return {
        effect: 'deny',
        reason: 'principal has no membership reaching the resource scope',
        policies: ['placeholder:scope-reachability'],
      };
    }

    const allowedReadRoles = READ_ROLES_BY_KIND[candidate.kind];
    const allowedWriteRoles = WRITE_ROLES_BY_KIND[candidate.kind];

    if (isReadAction(action.id)) {
      if (allowedReadRoles.includes(candidate.role)) {
        return {
          effect: 'allow',
          reason: `read allowed for ${candidate.kind}:${candidate.role}`,
          policies: ['placeholder:read'],
        };
      }
    }
    if (isWriteAction(action.id)) {
      if (allowedWriteRoles.includes(candidate.role)) {
        return {
          effect: 'allow',
          reason: `write allowed for ${candidate.kind}:${candidate.role}`,
          policies: ['placeholder:write'],
        };
      }
      return {
        effect: 'deny',
        reason: `role ${candidate.role} on ${candidate.kind} cannot ${action.id}`,
        policies: ['placeholder:write'],
      };
    }

    return {
      effect: 'allow',
      reason: 'placeholder allow for member with reachable scope',
      policies: ['placeholder:fallthrough'],
    };
  }
}

const defaultEngine = new PlaceholderPolicyEngine();

export function authorize(
  principal: Principal,
  action: Action,
  resource: Resource,
  context?: AuthorizationContext,
): PolicyDecision {
  return defaultEngine.authorize(principal, action, resource, context);
}

export function createPolicyEngine(): PolicyEngine {
  return new PlaceholderPolicyEngine();
}
