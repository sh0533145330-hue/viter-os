import { describe, expect, it } from 'vitest';
import { defaultBrandIdentity } from '../identity.js';
import { AgentRenamer } from '../renamer.js';
import type { BrandIdentity } from '../types.js';

function brandWith(overrides: Partial<BrandIdentity>): BrandIdentity {
  return { ...defaultBrandIdentity(), ...overrides };
}

describe('AgentRenamer.rename', () => {
  it('renames Tom to brand.tomName', () => {
    const renamer = new AgentRenamer(brandWith({ tomName: 'Sage' }));
    expect(renamer.rename('Tom')).toBe('Sage');
    expect(renamer.rename('tom')).toBe('Sage');
    expect(renamer.rename('TOM')).toBe('Sage');
  });

  it('renames Tim to brand.timName', () => {
    const renamer = new AgentRenamer(brandWith({ timName: 'Atlas' }));
    expect(renamer.rename('Tim')).toBe('Atlas');
  });

  it('applies specialist renames', () => {
    const renamer = new AgentRenamer(
      brandWith({ specialistRenames: { deny: 'Pixel', cal: 'Numbers' } }),
    );
    expect(renamer.rename('Deny')).toBe('Pixel');
    expect(renamer.rename('cal')).toBe('Numbers');
  });

  it('returns the original when not renamed', () => {
    const renamer = new AgentRenamer(brandWith({ tomName: 'Sage' }));
    expect(renamer.rename('SomeRandomAgent')).toBe('SomeRandomAgent');
  });

  it('handles empty strings safely', () => {
    const renamer = new AgentRenamer(defaultBrandIdentity());
    expect(renamer.rename('')).toBe('');
  });
});

describe('AgentRenamer.applyToText', () => {
  it('replaces Tom in free text using word boundaries', () => {
    const renamer = new AgentRenamer(brandWith({ tomName: 'Sage' }));
    const out = renamer.applyToText('Tom will help. Talk to tom about it.');
    expect(out).toBe('Sage will help. Talk to Sage about it.');
  });

  it('does not replace inside words like "tomato"', () => {
    const renamer = new AgentRenamer(brandWith({ tomName: 'Sage' }));
    expect(renamer.applyToText('I love tomatoes.')).toBe('I love tomatoes.');
  });

  it('replaces Tim while leaving Tom alone when only Tim changed', () => {
    const renamer = new AgentRenamer(brandWith({ timName: 'Atlas' }));
    expect(renamer.applyToText('Tom and Tim work together.')).toBe('Tom and Atlas work together.');
  });

  it('handles specialist renames in text', () => {
    const renamer = new AgentRenamer(brandWith({ specialistRenames: { deny: 'Pixel' } }));
    expect(renamer.applyToText('Deny will design this. Ask deny.')).toBe(
      'Pixel will design this. Ask Pixel.',
    );
  });

  it('returns empty text unchanged', () => {
    const renamer = new AgentRenamer(brandWith({ tomName: 'Sage' }));
    expect(renamer.applyToText('')).toBe('');
  });

  it('no-ops when no renames configured', () => {
    const renamer = new AgentRenamer(defaultBrandIdentity());
    expect(renamer.applyToText('Tom and Tim.')).toBe('Tom and Tim.');
  });
});

describe('AgentRenamer.promptHints', () => {
  it('returns a hint string listing renames', () => {
    const renamer = new AgentRenamer(
      brandWith({
        tomName: 'Sage',
        timName: 'Atlas',
        specialistRenames: { deny: 'Pixel' },
      }),
    );
    const hints = renamer.promptHints();
    expect(hints).toContain('Sage');
    expect(hints).toContain('Atlas');
    expect(hints).toContain('Pixel');
    expect(hints).toContain('deny');
  });

  it('returns "no renames" message when defaults', () => {
    const renamer = new AgentRenamer(defaultBrandIdentity());
    expect(renamer.promptHints()).toMatch(/no agent renames/i);
  });
});
