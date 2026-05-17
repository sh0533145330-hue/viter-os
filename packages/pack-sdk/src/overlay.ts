/**
 * `@vita/pack-sdk` — overlay merging for effective entity definitions.
 *
 * When packs are deployed, each pack can contribute overlays that modify
 * ObjectType / LinkType / ActionType definitions. The overlays are merged
 * in priority order (public → agency → workspace), so later overlays
 * override earlier ones.
 *
 * Merging rules:
 * - Top-level scalar fields: later wins
 * - `properties` object: deep-merge, later keys override earlier
 * - `vocabulary` object: deep-shallow, later values override
 * - Arrays: replace wholesale
 */

// ---------------------------------------------------------------------------
// Deep merge
// ---------------------------------------------------------------------------

/**
 * Deep-merge two plain objects. `override` values take precedence over `base`.
 * Arrays and non-plain-object values are replaced, not merged.
 */
function deepMerge(
  base: Record<string, unknown>,
  override: Record<string, unknown>,
): Record<string, unknown> {
  const result: Record<string, unknown> = { ...base };

  for (const key of Object.keys(override)) {
    const baseVal = result[key];
    const overrideVal = override[key];

    if (isPlainObject(baseVal) && isPlainObject(overrideVal)) {
      result[key] = deepMerge(
        baseVal as Record<string, unknown>,
        overrideVal as Record<string, unknown>,
      );
    } else {
      result[key] = overrideVal;
    }
  }

  return result;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    Object.getPrototypeOf(value) === Object.prototype
  );
}

// ---------------------------------------------------------------------------
// Apply overlay
// ---------------------------------------------------------------------------

/**
 * Given a base definition (e.g., an ObjectType) and an array of overlays
 * ordered by increasing priority, produce the effective merged definition.
 *
 * Each overlay is a plain JSON-like object. Later overlays override earlier
 * ones via deep merge.
 *
 * @param base - The base definition (e.g., the original ObjectType's definition).
 * @param overlays - Ordered array of overlays, lowest priority first.
 * @returns The effective merged definition.
 */
export function applyOverlay(
  base: Record<string, unknown>,
  overlays: Array<Record<string, unknown>>,
): Record<string, unknown> {
  if (overlays.length === 0) return { ...base };

  let merged = deepMerge({}, base);

  for (const overlay of overlays) {
    merged = deepMerge(merged, overlay);
  }

  return merged;
}

// ---------------------------------------------------------------------------
// Apply pack overlay (multiple packs contributing to one entity)
// ---------------------------------------------------------------------------

/**
 * Apply multiple pack overlays to a single base entity. Each entry includes
 * the pack's overlay data and a numeric priority (lower = applied first).
 */
export function applyPackOverlays(
  base: Record<string, unknown>,
  packOverlays: Array<{
    overlay: Record<string, unknown>;
    priority: number;
  }>,
): Record<string, unknown> {
  // Sort by priority descending: lower priority number = higher importance
  // = applied last = overrides earlier (higher-numbered) overlays.
  const sorted = [...packOverlays].sort((a, b) => b.priority - a.priority);
  return applyOverlay(
    base,
    sorted.map((po) => po.overlay),
  );
}
