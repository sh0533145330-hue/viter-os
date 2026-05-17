import { voiceConfigSchema, type VoiceConfig } from './types.js';
const DEFAULT_CONFIG: VoiceConfig = voiceConfigSchema.parse({
  voiceId: 'jennifer',
  language: 'en-US',
  introTemplate: "Hi, I'm {{agentName}}. How can I help?",
  bargeInEnabled: true,
  silenceTimeoutMs: 3000,
});
export function resolveVoiceConfig(override?: Partial<VoiceConfig>): VoiceConfig {
  return voiceConfigSchema.parse({ ...DEFAULT_CONFIG, ...override });
}
export function renderIntro(config: VoiceConfig, vars: Record<string, string>): string {
  return config.introTemplate.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`);
}
