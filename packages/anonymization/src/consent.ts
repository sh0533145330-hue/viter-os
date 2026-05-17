import type { ConsentToken } from './types.js';
import { consentTokenSchema } from './types.js';

/**
 * ConsentManager checks per-contribution consent tokens.
 * Contributions without explicit consent should be excluded
 * from processing, sharing, or training.
 */
export class ConsentManager {
  private readonly tokens: Map<string, ConsentToken>;

  constructor(tokens: ConsentToken[] = []) {
    this.tokens = new Map();
    for (const token of tokens) {
      const validated = consentTokenSchema.parse(token);
      this.tokens.set(validated.contributionId, validated);
    }
  }

  /**
   * Check if a contribution has consent for a given purpose.
   */
  hasConsent(contributionId: string, purpose: string): boolean {
    const token = this.tokens.get(contributionId);
    if (!token) return false;
    if (!token.consented) return false;

    // Check expiration
    if (token.expiresAt !== undefined && Date.now() > token.expiresAt) {
      return false;
    }

    // If no purposes specified, consent is for all purposes
    if (token.purposes.length === 0) return true;

    return token.purposes.includes(purpose);
  }

  /**
   * Check if a contribution has any valid consent at all.
   */
  hasAnyConsent(contributionId: string): boolean {
    const token = this.tokens.get(contributionId);
    if (!token) return false;
    if (!token.consented) return false;
    if (token.expiresAt !== undefined && Date.now() > token.expiresAt) {
      return false;
    }
    return true;
  }

  /**
   * Filter an array of contribution IDs, returning only those with consent
   * for the given purpose.
   */
  filterByConsent(contributionIds: string[], purpose: string): string[] {
    return contributionIds.filter((id) => this.hasConsent(id, purpose));
  }

  /**
   * Add or update a consent token.
   */
  setConsent(token: ConsentToken): void {
    const validated = consentTokenSchema.parse(token);
    this.tokens.set(validated.contributionId, validated);
  }

  /**
   * Revoke consent for a contribution.
   */
  revokeConsent(contributionId: string): void {
    const existing = this.tokens.get(contributionId);
    if (existing) {
      this.tokens.set(contributionId, { ...existing, consented: false });
    }
  }

  /**
   * Get all active consent tokens.
   */
  getTokens(): ConsentToken[] {
    return [...this.tokens.values()];
  }

  /**
   * Get the number of active consented contributions.
   */
  getConsentedCount(): number {
    let count = 0;
    for (const token of this.tokens.values()) {
      if (token.consented) {
        if (token.expiresAt === undefined || Date.now() <= token.expiresAt) {
          count++;
        }
      }
    }
    return count;
  }
}
