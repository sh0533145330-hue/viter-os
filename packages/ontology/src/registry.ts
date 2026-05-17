/**
 * OntologyRegistry — CRUD for ObjectType/LinkType/ActionType + overlay resolution.
 *
 * Manages the ontology definitions stored in object_types, link_types,
 * and action_types tables. Supports scoped definitions with overlay
 * resolution: public → agency overlay → workspace overlay → effective.
 */

import type { Db, Logger, ScopeRef, ObjectTypeDefinition, PropertyDef } from './types.js';

// ---------------------------------------------------------------------------
// Overlay resolution
// ---------------------------------------------------------------------------

/**
 * Resolve the effective definition for an object type.
 * Layers: public (base) → agency overlay → workspace overlay → effective.
 *
 * Each overlay can add or override properties. The workspace overlay
 * wins over agency, which wins over public.
 */
function resolveOverlays(
  base: ObjectTypeDefinition,
  overlays: ObjectTypeDefinition[],
): ObjectTypeDefinition {
  let effective = { ...base, properties: { ...base.properties } };

  for (const overlay of overlays) {
    // Merge properties: overlay wins
    effective = {
      ...effective,
      ...overlay,
      properties: {
        ...effective.properties,
        ...overlay.properties,
      },
    };
  }

  return effective;
}

// ---------------------------------------------------------------------------
// OntologyRegistry
// ---------------------------------------------------------------------------

export interface OntologyRegistryDeps {
  db: Db;
  logger: Logger;
}

export class OntologyRegistry {
  private readonly db: Db;
  private readonly logger: Logger;

  constructor(deps: OntologyRegistryDeps) {
    this.db = deps.db;
    this.logger = deps.logger;
  }

  // -----------------------------------------------------------------------
  // ObjectType CRUD
  // -----------------------------------------------------------------------

  /**
   * Create a new ObjectType definition in the given scope.
   * Returns the ID of the created record.
   */
  async createObjectType(scope: ScopeRef, def: ObjectTypeDefinition): Promise<string> {
    try {
      const rows = await this.db
        .insert('object_types' as unknown as Record<string, unknown>)
        .values({
          scope: scope.scope,
          scope_id: scope.scopeId,
          key: def.key,
          name: def.name,
          description: def.description,
          schema_version: 1,
          definition: def,
          label_singular: def.name.toLowerCase(),
          label_plural: `${def.name.toLowerCase()}s`,
        })
        .returning() as Array<Record<string, unknown>>;

      const id = rows[0]?.['id'] as string | undefined;
      if (!id) throw new Error('createObjectType: no ID returned');

      this.logger.info(`OntologyRegistry: created ObjectType key=${def.key} scope=${scope.scope}/${scope.scopeId} id=${id}`);
      return id;
    } catch (err) {
      this.logger.error(`OntologyRegistry: failed to create ObjectType key=${def.key}`, { error: String(err) });
      throw err;
    }
  }

  /**
   * Get an ObjectType definition by scope and key.
   */
  async getObjectType(scope: ScopeRef, key: string): Promise<ObjectTypeDefinition | undefined> {
    try {
      const rows = await this.db
        .select()
        .from('object_types' as unknown as Record<string, unknown>)
        .where({
          scope: scope.scope,
          scope_id: scope.scopeId,
          key,
          deleted_at: null,
        } as unknown as unknown) as Array<Record<string, unknown>>;

      if (rows.length === 0) return undefined;
      const row = rows[0]!;
      const definition = row['definition'] as ObjectTypeDefinition | undefined;
      if (definition) return definition;

      // Reconstruct from columns if definition column is not a full definition
      return {
        key: row['key'] as string,
        name: row['name'] as string,
        description: (row['description'] as string) ?? '',
        properties: (row['definition'] as ObjectTypeDefinition | undefined)?.properties ?? {},
      };
    } catch (err) {
      this.logger.warn(`OntologyRegistry: getObjectType failed for key=${key}`, { error: String(err) });
      return undefined;
    }
  }

  /**
   * List all ObjectType definitions in a scope.
   */
  async listObjectTypes(scope: ScopeRef): Promise<ObjectTypeDefinition[]> {
    try {
      const rows = await this.db
        .select()
        .from('object_types' as unknown as Record<string, unknown>)
        .where({
          scope: scope.scope,
          scope_id: scope.scopeId,
          deleted_at: null,
        } as unknown as unknown) as Array<Record<string, unknown>>;

      return rows.map((row) => {
        const definition = row['definition'] as ObjectTypeDefinition | undefined;
        return {
          key: row['key'] as string,
          name: row['name'] as string,
          description: (row['description'] as string) ?? '',
          properties: definition?.properties ?? {},
          vocabulary: definition?.vocabulary,
        };
      });
    } catch (err) {
      this.logger.warn(`OntologyRegistry: listObjectTypes failed for scope=${scope.scope}`, { error: String(err) });
      return [];
    }
  }

  /**
   * Resolve the effective ObjectType for a workspace.
   *
   * Resolution order: public (base) → agency overlay → workspace overlay → effective.
   * Each more-specific scope can add or override properties.
   */
  async resolveEffective(workspaceId: string, key: string): Promise<ObjectTypeDefinition> {
    // 1. Get public (base) definition
    const publicDef = await this.getObjectType(
      { scope: 'public', scopeId: null },
      key,
    );

    if (!publicDef) {
      throw new Error(`No public ObjectType definition found for key="${key}"`);
    }

    // 2. Try to find agency overlay
    // We need to find the workspace's agency ID first
    let agencyId: string | null = null;
    try {
      const wsRows = await this.db
        .select()
        .from('workspaces' as unknown as Record<string, unknown>)
        .where({ id: workspaceId } as unknown as unknown) as Array<Record<string, unknown>>;
      if (wsRows.length > 0) {
        agencyId = (wsRows[0]!['agency_id'] as string) ?? null;
      }
    } catch {
      // Continue without agency overlay
    }

    const overlays: ObjectTypeDefinition[] = [];

    // 3. Agency overlay
    if (agencyId) {
      const agencyDef = await this.getObjectType(
        { scope: 'agency', scopeId: agencyId },
        key,
      );
      if (agencyDef) overlays.push(agencyDef);
    }

    // 4. Workspace overlay
    const workspaceDef = await this.getObjectType(
      { scope: 'workspace', scopeId: workspaceId },
      key,
    );
    if (workspaceDef) overlays.push(workspaceDef);

    // 5. Resolve
    const effective = resolveOverlays(publicDef, overlays);
    this.logger.info(`OntologyRegistry: resolved effective ObjectType key=${key} for workspace=${workspaceId} (${overlays.length} overlay(s))`);
    return effective;
  }

  // -----------------------------------------------------------------------
  // LinkType CRUD
  // -----------------------------------------------------------------------

  /**
   * Create a LinkType definition.
   */
  async createLinkType(
    scope: ScopeRef,
    def: { key: string; name: string; description: string; fromTypeKey: string; toTypeKey: string; kind: '1:1' | '1:N' | 'N:M'; definition?: Record<string, unknown> },
  ): Promise<string> {
    // Resolve from/to type IDs
    const fromType = await this.getObjectType(scope, def.fromTypeKey);
    const toType = await this.getObjectType(scope, def.toTypeKey);

    try {
      const rows = await this.db
        .insert('link_types' as unknown as Record<string, unknown>)
        .values({
          scope: scope.scope,
          scope_id: scope.scopeId,
          key: def.key,
          name: def.name,
          description: def.description,
          from_type: fromType ? undefined : null, // Would need object_type ID
          to_type: toType ? undefined : null,
          kind: def.kind,
          definition: def.definition ?? {},
        })
        .returning() as Array<Record<string, unknown>>;

      const id = rows[0]?.['id'] as string | undefined;
      if (!id) throw new Error('createLinkType: no ID returned');

      this.logger.info(`OntologyRegistry: created LinkType key=${def.key}`);
      return id;
    } catch (err) {
      this.logger.error(`OntologyRegistry: failed to create LinkType key=${def.key}`, { error: String(err) });
      throw err;
    }
  }

  // -----------------------------------------------------------------------
  // ActionType CRUD
  // -----------------------------------------------------------------------

  /**
   * Create an ActionType definition.
   */
  async createActionType(
    scope: ScopeRef,
    def: { key: string; name: string; description: string; targetTypeKey?: string; definition?: Record<string, unknown>; requiresApproval?: boolean },
  ): Promise<string> {
    try {
      const rows = await this.db
        .insert('action_types' as unknown as Record<string, unknown>)
        .values({
          scope: scope.scope,
          scope_id: scope.scopeId,
          key: def.key,
          name: def.name,
          description: def.description,
          target_type: null, // Would need to resolve object_type ID
          definition: def.definition ?? {},
          requires_approval: def.requiresApproval ?? false,
        })
        .returning() as Array<Record<string, unknown>>;

      const id = rows[0]?.['id'] as string | undefined;
      if (!id) throw new Error('createActionType: no ID returned');

      this.logger.info(`OntologyRegistry: created ActionType key=${def.key}`);
      return id;
    } catch (err) {
      this.logger.error(`OntologyRegistry: failed to create ActionType key=${def.key}`, { error: String(err) });
      throw err;
    }
  }
}
