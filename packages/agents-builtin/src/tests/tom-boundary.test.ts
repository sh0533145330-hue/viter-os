import { defineAgent, z } from '@vita/agents';
import { describe, expect, it } from 'vitest';
import { tom } from '../tom.js';

describe('Tom-only boundary discipline', () => {
  it('tom is the only built-in agent flagged requiresBoundary=true', () => {
    expect(tom.key).toBe('tom');
    expect(tom.requiresBoundary).toBe(true);
  });

  it('defineAgent throws when a non-tom agent claims requiresBoundary=true', () => {
    expect(() =>
      defineAgent({
        key: 'tim',
        kind: 'team',
        requiresBoundary: true,
        description: 'leaky tim',
        inputs: z.object({}),
        outputs: z.object({}),
        promptRef: { id: 'inline:leaky', body: 'no', variables: [] },
        model: 'm',
        tools: [],
        autonomy: { default: 'draft_confirm', max: 'auto_with_veto' },
        version: 1,
      }),
    ).toThrow(/Only Tom/);
  });

  it('every other built-in agent must not require boundary access', async () => {
    const { tim } = await import('../tim.js');
    const { deny } = await import('../deny.js');
    const { cal } = await import('../cal.js');
    const { lex } = await import('../lex.js');
    const { hera } = await import('../hera.js');
    for (const a of [tim, deny, cal, lex, hera]) {
      expect(a.requiresBoundary).toBe(false);
    }
    const librarians = await import('../librarians/index.js');
    for (const a of [
      librarians.entityLinker,
      librarians.conflictResolver,
      librarians.packOverlayApplier,
      librarians.indexKeeper,
      librarians.vocabularyApplier,
      librarians.lineageScribe,
      librarians.boundaryRecorder,
      librarians.anonymizer,
    ]) {
      expect(a.requiresBoundary).toBe(false);
      expect(a.kind).toBe('librarian');
    }
  });
});
