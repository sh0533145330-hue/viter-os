import { describe, it, expect } from 'vitest';
import { VoiceSessionManager } from '../session.js';
describe('VoiceSessionManager', () => {
  it('creates a session', () => {
    const mgr = new VoiceSessionManager();
    const s = mgr.create('ws-1', 'u-1');
    expect(s.id).toBeTruthy();
    expect(s.workspaceId).toBe('ws-1');
    expect(s.turns).toHaveLength(0);
  });
  it('adds turns', () => {
    const mgr = new VoiceSessionManager();
    const s = mgr.create('ws-1', 'u-1');
    mgr.addTurn(s.id, { role: 'user', text: 'hi', startedAt: new Date(), endedAt: new Date() });
    expect(mgr.get(s.id)?.turns).toHaveLength(1);
  });
  it('ends a session', () => {
    const mgr = new VoiceSessionManager();
    const s = mgr.create('ws-1', 'u-1');
    const ended = mgr.end(s.id);
    expect(ended?.endedAt).toBeDefined();
  });
  it('returns undefined for unknown session', () => {
    const mgr = new VoiceSessionManager();
    expect(mgr.get('unknown')).toBeUndefined();
  });
});
