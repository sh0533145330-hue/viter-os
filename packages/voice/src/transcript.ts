import type { VoiceSession } from './types.js';
export interface L0IngestRequest { workspaceId: string; sourceKind: string; mimeType: string; body: string; metadata: Record<string, unknown> }
export class TranscriptWriter {
  toMarkdown(session: VoiceSession): string {
    const lines: string[] = [`# Voice Transcript\n`, `**Session:** ${session.id}`, `**Started:** ${session.startedAt.toISOString()}`, ``];
    for (const turn of session.turns) {
      lines.push(`**${turn.role === 'user' ? 'User' : 'Tom'}** (${turn.startedAt.toISOString()}):`);
      lines.push(turn.text);
      lines.push('');
    }
    return lines.join('\n');
  }
  toL0IngestRequest(session: VoiceSession): L0IngestRequest {
    return {
      workspaceId: session.workspaceId,
      sourceKind: 'voice_transcript',
      mimeType: 'text/markdown',
      body: this.toMarkdown(session),
      metadata: { sessionId: session.id, userId: session.userId, phoneNumber: session.phoneNumber, callId: session.callId, turnCount: session.turns.length, startedAt: session.startedAt.toISOString(), endedAt: session.endedAt?.toISOString() },
    };
  }
}
