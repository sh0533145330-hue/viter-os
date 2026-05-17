/**
 * Wire model + validation for the VitaOS workflow graph.
 *
 * Wires connect a producer block's output port to a consumer block's input
 * port. Validation walks each wire and checks that the producer's output
 * Zod schema is structurally compatible with the consumer's input schema,
 * which keeps editor connection errors loud and early.
 */

import type { ZodObject, ZodRawShape, ZodTypeAny } from 'zod';
import { ZodArray, ZodObject as ZodObjectClass, ZodOptional } from 'zod';
import type { BlockDefinition } from './block.js';
import { WireTypeError } from './errors.js';

/** Logical port reference. The default port for a block is `default`. */
export interface PortRef {
  readonly blockId: string;
  readonly port: string;
}

/** A directed connection between two ports. */
export interface Wire {
  readonly from: PortRef;
  readonly to: PortRef;
}

/** Outcome categories for {@link compareSchemas}. */
export type SchemaCompatibility = 'exact' | 'structural' | 'incompatible';

/**
 * Inspect a Zod schema and return a compact descriptor used for structural
 * comparison. We intentionally avoid `instanceof` chains where possible by
 * using the public `_def.typeName` discriminator.
 */
function descriptor(schema: ZodTypeAny): string {
  const def = (schema as { _def?: { typeName?: string } })._def;
  return def?.typeName ?? 'ZodUnknown';
}

/**
 * Structural compatibility between two Zod schemas.
 *
 * - `exact`: same instance (cheap pointer compare).
 * - `structural`: same outer Zod kind, and (when both are objects) every
 *   required key on the consumer side exists with a compatible kind on the
 *   producer side. Producer may carry additional keys.
 * - `incompatible`: otherwise.
 */
export function compareSchemas(producer: ZodTypeAny, consumer: ZodTypeAny): SchemaCompatibility {
  if (producer === consumer) return 'exact';

  const pType = descriptor(producer);
  const cType = descriptor(consumer);

  if (cType === 'ZodAny' || cType === 'ZodUnknown') return 'structural';
  if (pType !== cType) return 'incompatible';

  if (producer instanceof ZodArray && consumer instanceof ZodArray) {
    return compareSchemas(producer.element, consumer.element) === 'incompatible'
      ? 'incompatible'
      : 'structural';
  }

  if (producer instanceof ZodObjectClass && consumer instanceof ZodObjectClass) {
    const pShape = (producer as ZodObject<ZodRawShape>).shape;
    const cShape = (consumer as ZodObject<ZodRawShape>).shape;
    for (const key of Object.keys(cShape)) {
      const cField = cShape[key];
      if (!cField) continue;
      const optional = cField instanceof ZodOptional;
      const pField = pShape[key];
      if (!pField) {
        if (optional) continue;
        return 'incompatible';
      }
      if (compareSchemas(pField, cField) === 'incompatible') return 'incompatible';
    }
    return 'structural';
  }

  return 'structural';
}

/**
 * Validate every wire in a workflow definition against the declared blocks.
 * Throws {@link WireTypeError} on the first failure. Returns the wires
 * unmodified on success so callers can chain.
 */
export function validateWires(
  blocks: ReadonlyArray<{ id: string; block: BlockDefinition }>,
  wires: readonly Wire[],
): readonly Wire[] {
  const byId = new Map<string, BlockDefinition>();
  for (const { id, block } of blocks) byId.set(id, block);

  for (const wire of wires) {
    const producer = byId.get(wire.from.blockId);
    const consumer = byId.get(wire.to.blockId);
    if (!producer) {
      throw new WireTypeError(`Wire references unknown producer '${wire.from.blockId}'`);
    }
    if (!consumer) {
      throw new WireTypeError(`Wire references unknown consumer '${wire.to.blockId}'`);
    }

    const producerSchema = portSchema(producer.outputs, wire.from.port);
    const consumerSchema = portSchema(consumer.inputs, wire.to.port);

    const compat = compareSchemas(producerSchema, consumerSchema);
    if (compat === 'incompatible') {
      throw new WireTypeError(
        `Wire ${wire.from.blockId}.${wire.from.port} → ${wire.to.blockId}.${wire.to.port} has incompatible schemas`,
        { producer: descriptor(producerSchema), consumer: descriptor(consumerSchema) },
      );
    }
  }

  return wires;
}

/**
 * Look up a named port on a Zod object schema. When the schema itself is
 * not an object, treat the entire schema as the implicit `default` port.
 */
function portSchema(schema: ZodTypeAny, port: string): ZodTypeAny {
  if (port === 'default' || port === '') return schema;
  if (schema instanceof ZodObjectClass) {
    const shape = (schema as ZodObject<ZodRawShape>).shape;
    const field = shape[port];
    if (!field) {
      throw new WireTypeError(`Port '${port}' not declared on schema`);
    }
    return field;
  }
  return schema;
}
