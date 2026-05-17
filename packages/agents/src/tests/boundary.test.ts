import { PolicyDeniedError } from '@vita/core';
import { describe, expect, it } from 'vitest';
import { InMemoryBoundaryActStore, TomOnlyBoundaryGuard } from '../boundary.js';

describe('TomOnlyBoundaryGuard', () => {
  it('allows Tom to cross the boundary', () => {
    const guard = new TomOnlyBoundaryGuard();
    expect(() =>
      guard.assertCanSpeakOutside('tom', 'email.send', 'mailto:client@example.com'),
    ).not.toThrow();
  });

  it('denies every non-Tom agent', () => {
    const guard = new TomOnlyBoundaryGuard();
    for (const key of ['tim', 'deny', 'cal', 'lex', 'hera', 'entity-linker']) {
      expect(() => guard.assertCanSpeakOutside(key, 'email.send', 'mailto:x@y.com')).toThrow(
        PolicyDeniedError,
      );
    }
  });

  it('records acts for Tom and rejects for others', async () => {
    const store = new InMemoryBoundaryActStore();
    const guard = new TomOnlyBoundaryGuard(store);
    await guard.recordAct({
      workspaceId: 'ws',
      agentKey: 'tom',
      actKind: 'email.send',
      target: 'mailto:x@y.com',
      autonomy: 'draft_confirm',
      at: new Date(),
    });
    expect(store.list()).toHaveLength(1);

    await expect(
      guard.recordAct({
        workspaceId: 'ws',
        agentKey: 'tim',
        actKind: 'email.send',
        target: 'mailto:x@y.com',
        autonomy: 'draft_confirm',
        at: new Date(),
      }),
    ).rejects.toBeInstanceOf(PolicyDeniedError);
  });
});
