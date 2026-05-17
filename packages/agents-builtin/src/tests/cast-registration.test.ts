import { describe, expect, it } from 'vitest';
import { builtinAgents } from '../index.js';

describe('built-in agent cast', () => {
  it('exports the full cast', () => {
    const keys = builtinAgents.map((a) => a.key).sort();
    expect(keys).toEqual(
      [
        'anonymizer',
        'boundary-recorder',
        'cal',
        'conflict-resolver',
        'deny',
        'entity-linker',
        'hera',
        'index-keeper',
        'lex',
        'lineage-scribe',
        'pack-overlay-applier',
        'tim',
        'tom',
        'vocabulary-applier',
      ].sort(),
    );
  });

  it('every definition declares a valid prompt template with a body', () => {
    for (const agent of builtinAgents) {
      const ref = agent.promptRef;
      const body = typeof ref === 'string' ? ref : ref.body;
      expect(body.length).toBeGreaterThan(0);
    }
  });

  it('every definition has version >= 1 and a model', () => {
    for (const agent of builtinAgents) {
      expect(agent.version).toBeGreaterThanOrEqual(1);
      expect(agent.model.length).toBeGreaterThan(0);
    }
  });
});
