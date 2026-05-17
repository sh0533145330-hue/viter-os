import type { BreakGlassConfig, BreakGlassSession } from './types.js';
import { breakGlassConfigSchema } from './types.js';

/**
 * Generate a deterministic (non-crypto) session ID for break-glass.
 * In production, use uuid v4.
 */
let idCounter = 0;
function generateId(): string {
  idCounter++;
  return `bg_${Date.now()}_${idCounter}`;
}

/**
 * BreakGlassService manages emergency access sessions.
 * When activated, all outputs must be:
 * 1. Consent-gated
 * 2. Anonymized
 * 3. Fully audited
 */
export class BreakGlassService {
  private readonly config: BreakGlassConfig;
  private activeSessions: Map<string, BreakGlassSession> = new Map();

  constructor(config: Partial<BreakGlassConfig> = {}) {
    this.config = breakGlassConfigSchema.parse(config);
  }

  /**
   * Open a break-glass session. Returns session metadata.
   */
  openSession(params: {
    workspaceId: string;
    userId: string;
    reason: string;
  }): BreakGlassSession {
    const now = new Date();
    const timeoutMs = this.config.sessionTimeoutMinutes * 60 * 1000;

    const session: BreakGlassSession = {
      id: generateId(),
      workspaceId: params.workspaceId,
      userId: params.userId,
      reason: this.config.requireReason ? params.reason : '',
      config: { ...this.config },
      createdAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + timeoutMs).toISOString(),
      closedAt: null,
    };

    this.activeSessions.set(session.id, session);
    return session;
  }

  /**
   * Check if a session is still valid (not expired, not closed).
   */
  isSessionValid(sessionId: string): boolean {
    const session = this.activeSessions.get(sessionId);
    if (!session) return false;
    if (session.closedAt !== null) return false;

    const now = Date.now();
    const expires = new Date(session.expiresAt).getTime();
    if (now > expires) {
      this.activeSessions.delete(sessionId);
      return false;
    }

    return true;
  }

  /**
   * Close a break-glass session.
   */
  closeSession(sessionId: string): void {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      session.closedAt = new Date().toISOString();
      this.activeSessions.delete(sessionId);
    }
  }

  /**
   * Sanitize output through the break-glass pipeline:
   * returns a version safe for boundary crossing.
   */
  sanitizeOutput(content: string): {
    safe: string;
    redacted: boolean;
    auditRequired: boolean;
  } {
    const needsAnonymization = this.config.forceAnonymization;

    if (needsAnonymization) {
      // In a real implementation, this would call PiiRedactor.
      // Here we do a simple marker-based approach.
      return {
        safe: `[BREAK-GLASS SANITIZED] ${content.slice(0, 100)}...`,
        redacted: true,
        auditRequired: true,
      };
    }

    return {
      safe: content,
      redacted: false,
      auditRequired: true,
    };
  }

  /**
   * Get current config.
   */
  getConfig(): BreakGlassConfig {
    return { ...this.config };
  }

  /**
   * Get number of active sessions.
   */
  getActiveSessionCount(): number {
    return this.activeSessions.size;
  }

  /**
   * Clean up expired sessions.
   */
  cleanupExpired(): void {
    const now = Date.now();
    for (const [id, session] of this.activeSessions) {
      if (new Date(session.expiresAt).getTime() <= now) {
        this.activeSessions.delete(id);
      }
    }
  }
}
