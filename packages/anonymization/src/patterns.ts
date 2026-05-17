import type { PiiType, StrictnessLevel } from './types.js';

export interface PiiPattern {
  type: PiiType;
  /** RegExp or string pattern */
  pattern: RegExp;
  /** Tag used when replacing */
  tag: string;
  /** Minimum strictness level required */
  minLevel: StrictnessLevel;
}

/**
 * Locale-specific patterns keyed by locale code (e.g. "de", "fr", "uk").
 * When no locale is specified or the locale isn't found, defaults are used.
 */
const localePatterns: Record<string, PiiPattern[]> = {
  de: [
    {
      type: 'phone',
      pattern: /(?:\+49[\s-]?|0)[1-9]\d{1,4}[\s-]?\d{3,8}[\s-]?\d{0,4}/g,
      tag: '[PII:phone]',
      minLevel: 'standard',
    },
  ],
  fr: [
    {
      type: 'phone',
      pattern: /(?:\+33[\s-]?|0)[1-9](?:[\s.-]?\d{2}){4}/g,
      tag: '[PII:phone]',
      minLevel: 'standard',
    },
  ],
  uk: [
    {
      type: 'phone',
      pattern: /(?:\+44[\s-]?|0)7\d{3}[\s-]?\d{3}[\s-]?\d{3}/g,
      tag: '[PII:phone]',
      minLevel: 'standard',
    },
  ],
  jp: [
    {
      type: 'phone',
      pattern: /(?:\+81[\s-]?|0)[1-9]\d{1,4}[\s-]?\d{1,4}[\s-]?\d{4}/g,
      tag: '[PII:phone]',
      minLevel: 'standard',
    },
  ],
};

// ── Default / universal patterns ──────────────────────────────

const defaultPatterns: PiiPattern[] = [
  // Email
  {
    type: 'email',
    pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,
    tag: '[PII:email]',
    minLevel: 'standard',
  },
  // US Phone (various formats)
  {
    type: 'phone',
    pattern: /(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/g,
    tag: '[PII:phone]',
    minLevel: 'standard',
  },
  // Generic phone (international-ish)
  {
    type: 'phone',
    pattern: /(?:\+\d{1,3}[\s.-]?)?\(?\d{2,4}\)?[\s.-]?\d{2,4}[\s.-]?\d{3,5}\b/g,
    tag: '[PII:phone]',
    minLevel: 'strict',
  },
  // SSN (US)
  {
    type: 'ssn',
    pattern: /\b\d{3}[ -]?\d{2}[ -]?\d{4}\b/g,
    tag: '[PII:ssn]',
    minLevel: 'standard',
  },
  // Credit card (simplified: 13-19 digit numbers with dash/space separators)
  {
    type: 'credit_card',
    pattern: /\b(?:\d[ -]*?){13,19}\b/g,
    tag: '[PII:credit_card]',
    minLevel: 'standard',
  },
  // IPv4
  {
    type: 'ip_address',
    pattern: /\b(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\b/g,
    tag: '[PII:ip]',
    minLevel: 'standard',
  },
  // Date of birth patterns (MM/DD/YYYY or DD/MM/YYYY)
  {
    type: 'date_of_birth',
    pattern: /\b(?:0[1-9]|1[0-2])[\/.-](?:0[1-9]|[12]\d|3[01])[\/.-](?:19|20)\d{2}\b/g,
    tag: '[PII:dob]',
    minLevel: 'strict',
  },
  // Full name (capitalized word pairs — high false-positive rate, strict+ only)
  {
    type: 'name',
    pattern: /\b[A-Z][a-z]{2,}(?:\s[A-Z][a-z]{2,})+\b/g,
    tag: '[PII:name]',
    minLevel: 'strict',
  },
  // Medical record number (typical format)
  {
    type: 'medical_record',
    pattern: /\bMRN[:\s-]*\s*\d{5,10}\b/gi,
    tag: '[PII:mrn]',
    minLevel: 'healthcare',
  },
  // Health plan beneficiary number
  {
    type: 'health_plan',
    pattern: /\b(?:HP|HIC|HICN)[:\s-]*\s*\d{5,12}[A-Z]?\b/gi,
    tag: '[PII:health_plan]',
    minLevel: 'healthcare',
  },
  // Account number (generic)
  {
    type: 'account_number',
    pattern: /\b(?:acct|account)[:\s#-]?\d{6,16}\b/gi,
    tag: '[PII:account]',
    minLevel: 'strict',
  },
  // License plate (US style)
  {
    type: 'license_plate',
    pattern: /\b[A-Z0-9]{1,3}[ -]?[A-Z0-9]{2,5}\b/g,
    tag: '[PII:plate]',
    minLevel: 'strict',
  },
  // Device ID (MAC address)
  {
    type: 'device_id',
    pattern: /\b(?:[0-9A-Fa-f]{2}[:-]){5}[0-9A-Fa-f]{2}\b/g,
    tag: '[PII:device]',
    minLevel: 'strict',
  },
  // URL with potential PII in query params
  {
    type: 'url',
    pattern: /\bhttps?:\/\/[^\s<>"{}|\\^`[\]]+/gi,
    tag: '[PII:url]',
    minLevel: 'standard',
  },
  // Fax number
  {
    type: 'fax',
    pattern: /\b(?:fax|facsimile)[:\s]?(?:#|No\.?|num(?:ber)?)?[\s:]?(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/gi,
    tag: '[PII:fax]',
    minLevel: 'strict',
  },
];

/**
 * Get all relevant patterns for a given strictness level and locale set.
 * Applies locale-specific patterns first, then defaults.
 */
export function getPatterns(
  level: StrictnessLevel,
  locales: string[] = [],
): PiiPattern[] {
  const levelRank: Record<StrictnessLevel, number> = {
    standard: 0,
    strict: 1,
    healthcare: 2,
  };

  const threshold = levelRank[level];

  const combined: PiiPattern[] = [];

  // Add locale-specific patterns
  for (const locale of locales) {
    const localePats = localePatterns[locale];
    if (localePats) {
      for (const p of localePats) {
        if (levelRank[p.minLevel] <= threshold) {
          combined.push(p);
        }
      }
    }
  }

  // Add default patterns
  for (const p of defaultPatterns) {
    if (levelRank[p.minLevel] <= threshold) {
      combined.push(p);
    }
  }

  return combined;
}

/**
 * Get the default replacement tag for a PII type.
 */
export function getDefaultTag(type: PiiType): string {
  const mapping: Record<PiiType, string> = {
    name: '[PII:name]',
    email: '[PII:email]',
    phone: '[PII:phone]',
    ssn: '[PII:ssn]',
    credit_card: '[PII:credit_card]',
    address: '[PII:address]',
    ip_address: '[PII:ip]',
    date_of_birth: '[PII:dob]',
    medical_record: '[PII:mrn]',
    health_plan: '[PII:health_plan]',
    account_number: '[PII:account]',
    license_plate: '[PII:plate]',
    device_id: '[PII:device]',
    url: '[PII:url]',
    biometric: '[PII:biometric]',
    fax: '[PII:fax]',
    photograph: '[PII:photo]',
  };
  return mapping[type] ?? '[PII:unknown]';
}
