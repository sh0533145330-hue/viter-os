import { z } from 'zod';
export const voiceConfigSchema = z.object({
  voiceId: z.string(),
  language: z.string().default('en-US'),
  introTemplate: z.string().default("Hi, I'm {{agentName}}. How can I help?"),
  bargeInEnabled: z.boolean().default(true),
  silenceTimeoutMs: z.number().default(3000),
  emergencyStopWord: z.string().optional(),
});
export type VoiceConfig = z.infer<typeof voiceConfigSchema>;
export interface VoiceTurn { role: 'user' | 'assistant'; text: string; audioUrl?: string; startedAt: Date; endedAt: Date }
export interface VoiceSession { id: string; workspaceId: string; userId: string; turns: VoiceTurn[]; startedAt: Date; endedAt?: Date; phoneNumber?: string; callId?: string }
export type VoiceEventKind = 'turn_started' | 'turn_ended' | 'session_ended' | 'barge_in' | 'silence_timeout' | 'call_started' | 'call_ended';
export interface VoiceEvent { kind: VoiceEventKind; sessionId: string; data: unknown; at: Date }
export class VapiNotConfiguredError extends Error { constructor() { super('Vapi API key not configured'); this.name = 'VapiNotConfiguredError'; } }
