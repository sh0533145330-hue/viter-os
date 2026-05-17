/**
 * `@vita/agents-builtin` — built-in agent definitions.
 *
 * Tom, Tim, the v1 specialists (Deny, Cal, Lex, Hera), and the
 * back-end librarians. The cast is exported individually and as a
 * single `builtinAgents` array so the host can register them in bulk.
 */

import type { AgentDefinition } from '@vita/agents';

export { tom, type TomInput, type TomOutput } from './tom.js';
export { tim, type TimInput, type TimOutput } from './tim.js';
export { deny, type DenyInput, type DenyOutput } from './deny.js';
export { cal, type CalInput, type CalOutput } from './cal.js';
export { lex, type LexInput, type LexOutput } from './lex.js';
export { hera, type HeraInput, type HeraOutput } from './hera.js';
export {
  entityLinker,
  conflictResolver,
  packOverlayApplier,
  indexKeeper,
  vocabularyApplier,
  lineageScribe,
  boundaryRecorder,
  anonymizer,
  type AnonymizationApi,
} from './librarians/index.js';

import { cal } from './cal.js';
import { deny } from './deny.js';
import { hera } from './hera.js';
import { lex } from './lex.js';
import {
  anonymizer,
  boundaryRecorder,
  conflictResolver,
  entityLinker,
  indexKeeper,
  lineageScribe,
  packOverlayApplier,
  vocabularyApplier,
} from './librarians/index.js';
import { tim } from './tim.js';
import { tom } from './tom.js';

/** Every built-in agent definition, ordered cast → librarians. */
export const builtinAgents: readonly AgentDefinition[] = [
  tom,
  tim,
  deny,
  cal,
  lex,
  hera,
  entityLinker,
  conflictResolver,
  packOverlayApplier,
  indexKeeper,
  vocabularyApplier,
  lineageScribe,
  boundaryRecorder,
  anonymizer,
];

export const VERSION = '1.0.0-rc.0';
