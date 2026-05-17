import { randomUUID } from 'node:crypto';
import type { VoiceSession, VoiceTurn, VoiceConfig } from './types.js';
export class VoiceSessionManager {
  private sessions = new Map<string, VoiceSession>();
  create(workspaceId: string, userId: string, phoneNumber?: string): VoiceSession {
    const session: VoiceSession = { id: randomUUID(), workspaceId, userId, turns: [], startedAt: new Date(), ...(phoneNumber !== undefined ? { phoneNumber } : {}) };
    this.sessions.set(session.id, session);
    return session;
  }
  addTurn(sessionId: string, turn: VoiceTurn): void {
    const s = this.sessions.get(sessionId);
    if (s) s.turns.push(turn);
  }
  end(sessionId: string): VoiceSession | undefined {
    const s = this.sessions.get(sessionId);
    if (s) s.endedAt = new Date();
    return s;
  }
  get(sessionId: string): VoiceSession | undefined { return this.sessions.get(sessionId); }
}
