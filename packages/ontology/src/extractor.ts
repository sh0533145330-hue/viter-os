/**
 * ExtractionFramework — registry of per-kind extractors and dispatcher.
 *
 * Each extractor handles one source kind (email, document, …) and
 * transforms an L0 artifact into an L1 extraction. The framework
 * dispatches to the registered extractor by `sourceKind` and falls
 * back to `GenericExtractor` when no specific extractor is found.
 */

import type {
  L0Artifact,
  L1Extraction,
  ExtractorContext,
  Logger,
} from './types.js';

// ---------------------------------------------------------------------------
// Extractor interface
// ---------------------------------------------------------------------------

export interface Extractor {
  /** The source kind this extractor handles, e.g. "email", "document". */
  readonly kind: string;
  /** Transform an L0 artifact into an L1 extraction. */
  extract(l0: L0Artifact, ctx: ExtractorContext): Promise<L1Extraction>;
}

// ---------------------------------------------------------------------------
// ExtractionFramework
// ---------------------------------------------------------------------------

export class ExtractionFramework {
  private readonly extractors = new Map<string, Extractor>();
  private readonly logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /** Register an extractor. Overwrites any previous extractor for the same kind. */
  register(extractor: Extractor): void {
    this.extractors.set(extractor.kind, extractor);
    this.logger.info(`ExtractionFramework: registered extractor for kind="${extractor.kind}"`);
  }

  /**
   * Extract an L0 artifact into an L1 extraction.
   * Dispatches to the registered extractor for `l0.sourceKind`.
   * Falls back to GenericExtractor if no specific extractor is found.
   */
  async extract(l0: L0Artifact, ctx: ExtractorContext): Promise<L1Extraction> {
    const extractor = this.extractors.get(l0.sourceKind);
    if (extractor) {
      this.logger.info(`ExtractionFramework: dispatching kind="${l0.sourceKind}" to ${extractor.constructor.name}`);
      return extractor.extract(l0, ctx);
    }
    // Fallback: use generic extractor
    const generic = this.extractors.get('generic');
    if (generic) {
      this.logger.info(`ExtractionFramework: no extractor for kind="${l0.sourceKind}", using generic`);
      return generic.extract(l0, ctx);
    }
    throw new Error(
      `No extractor registered for sourceKind="${l0.sourceKind}" and no generic fallback available`,
    );
  }

  /** List all registered extractor kinds. */
  listKinds(): string[] {
    return [...this.extractors.keys()];
  }
}
