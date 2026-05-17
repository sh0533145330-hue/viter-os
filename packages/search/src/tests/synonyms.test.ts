/**
 * Tests for synonyms and per-pack index settings.
 */

import { describe, expect, it } from 'vitest';
import { buildIndexSettings, expandQueryWithSynonyms } from '../synonyms.js';

describe('buildIndexSettings', () => {
  it('merges synonyms across packs and normalises keys to lowercase', () => {
    const settings = buildIndexSettings([
      { packKey: 'ceo', synonyms: { CEO: ['Chief Executive'] } },
      { packKey: 'pm', synonyms: { ceo: ['Boss'], pm: ['Product Manager'] } },
    ]);
    expect(settings.synonyms?.ceo?.sort()).toEqual(['boss', 'chief executive']);
    expect(settings.synonyms?.pm).toEqual(['product manager']);
  });

  it('deduplicates stop words', () => {
    const settings = buildIndexSettings([
      { packKey: 'a', synonyms: {}, stopWords: ['the', 'a'] },
      { packKey: 'b', synonyms: {}, stopWords: ['THE', 'and'] },
    ]);
    expect(new Set(settings.stopWords)).toEqual(new Set(['the', 'a', 'and']));
  });

  it('falls back to default ranking rules when none are supplied', () => {
    const settings = buildIndexSettings([{ packKey: 'p', synonyms: {} }]);
    expect(settings.rankingRules).toContain('words');
    expect(settings.rankingRules).toContain('typo');
  });

  it('uses custom ranking rules when at least one pack supplies them', () => {
    const settings = buildIndexSettings([
      { packKey: 'a', synonyms: {}, rankingRules: ['attribute', 'words'] },
      { packKey: 'b', synonyms: {}, rankingRules: ['attribute', 'sort'] },
    ]);
    expect(settings.rankingRules).toEqual(['attribute', 'words', 'sort']);
  });

  it('picks up the first typoTolerance config supplied', () => {
    const settings = buildIndexSettings([
      { packKey: 'a', synonyms: {}, typoTolerance: { enabled: true } },
      { packKey: 'b', synonyms: {}, typoTolerance: { enabled: false } },
    ]);
    expect(settings.typoTolerance).toEqual({ enabled: true });
  });
});

describe('expandQueryWithSynonyms', () => {
  it('adds synonym variants of the query', () => {
    const out = expandQueryWithSynonyms('the ceo is here', [
      { packKey: 'p', synonyms: { ceo: ['founder', 'boss'] } },
    ]);
    expect(out).toContain('the ceo is here');
    expect(out.some((q) => q.includes('founder'))).toBe(true);
    expect(out.some((q) => q.includes('boss'))).toBe(true);
  });

  it('returns just the original query when no synonyms match', () => {
    const out = expandQueryWithSynonyms('hello world', [
      { packKey: 'p', synonyms: { abc: ['xyz'] } },
    ]);
    expect(out).toEqual(['hello world']);
  });
});
