import { describe, it, expect } from 'vitest';
import { TranscriptWriter } from '../transcript.js';
import type { VoiceSession } from '../types.js';
const mockSession: VoiceSession = {
  id: 'sess-1', workspaceId: 'ws-1', userId: 'u-1',
  turns: [
    { role: 'user', text: 'Hello Tom', startedAt: new Date('2026-01-01T10:00:00Z'), endedAt: new Date('2026-01-01T10:00:02Z') },
    { role: 'assistant', text: 'Hi! How can I help?', startedAt: new Date('2026-01-01T10:00:03Z'), endedAt: new Date('2026-01-01T10:00:05Z') },
  ],
  startedAt: new Date('2026-01-01T10:00:00Z'),
};
describe('TranscriptWriter', () => {
  const writer = new TranscriptWriter();
  it('generates markdown with speaker labels', () => {
    const md = writer.toMarkdown(mockSession);
    expect(md).toContain('User');
    expect(md).toContain('Tom');
    expect(md).toContain('Hello Tom');
  });
  it('produces L0IngestRequest', () => {
    const req = writer.toL0IngestRequest(mockSession);
    expect(req.workspaceId).toBe('ws-1');
    expect(req.sourceKind).toBe('voice_transcript');
    expect(req.mimeType).toBe('text/markdown');
    expect(req.body).toContain('Hello Tom');
    expect((req.metadata as any).sessionId).toBe('sess-1');
  });
  it('includes turn count in metadata', () => {
    const req = writer.toL0IngestRequest(mockSession);
    expect((req.metadata as any).turnCount).toBe(2);
  });
});
