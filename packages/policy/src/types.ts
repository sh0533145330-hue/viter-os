import { z } from 'zod';

export const scopeKindEnum = z.enum(['platform', 'agency', 'workspace']);
export type ScopeKind = z.infer<typeof scopeKindEnum>;

export const principalSchema = z.object({
  type: z.literal('User'),
  id: z.string().min(1),
  email: z.string().email().optional(),
  memberships: z.array(
    z.object({
      kind: scopeKindEnum,
      id: z.string().uuid(),
      role: z.string().min(1),
      scopes: z.array(z.string()).default([]),
    }),
  ),
  activeScope: z.object({
    kind: scopeKindEnum,
    id: z.string().uuid(),
  }),
});

export type Principal = z.infer<typeof principalSchema>;

export const actionSchema = z.object({
  type: z.literal('Action'),
  id: z.string().min(1),
});
export type Action = z.infer<typeof actionSchema>;

export const resourceSchema = z.object({
  type: z.enum(['Platform', 'Agency', 'Workspace', 'Object', 'Source', 'Property']),
  id: z.string().min(1),
  platformId: z.string().uuid().optional(),
  agencyId: z.string().uuid().optional(),
  workspaceId: z.string().uuid().optional(),
  attributes: z.record(z.string(), z.unknown()).optional(),
});
export type Resource = z.infer<typeof resourceSchema>;

export const contextSchema = z
  .object({
    ip: z.string().optional(),
    mfa: z.boolean().optional(),
    requestId: z.string().optional(),
  })
  .catchall(z.unknown());
export type AuthorizationContext = z.infer<typeof contextSchema>;

export interface PolicyDecision {
  effect: 'allow' | 'deny';
  reason?: string;
  policies?: string[];
}
