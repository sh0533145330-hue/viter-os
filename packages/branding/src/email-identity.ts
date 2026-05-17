import type { BrandIdentity } from './types.js';

export interface EmailDnsRecord {
  type: 'TXT';
  name: string;
  value: string;
}

const EMAIL_ADDRESS_RE = /^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/;

export function buildEmailFromHeader(brand: BrandIdentity, fallback: string): string {
  const sender =
    brand.emailSender && EMAIL_ADDRESS_RE.test(brand.emailSender) ? brand.emailSender : fallback;
  if (!EMAIL_ADDRESS_RE.test(sender)) {
    throw new Error(`fallback email "${sender}" is not a valid address`);
  }
  const displayName = sanitizeDisplayName(brand.displayName);
  if (!displayName) return sender;
  return `${displayName} <${sender}>`;
}

export function buildEmailSignature(brand: BrandIdentity, fallback?: string): string {
  if (brand.emailSignature && brand.emailSignature.trim().length > 0) {
    return brand.emailSignature;
  }
  if (fallback && fallback.trim().length > 0) return fallback;
  return `— ${brand.displayName}`;
}

export interface DkimSelector {
  selector: string;
  publicKey: string;
}

export function generateDkimRecords(
  brand: BrandIdentity,
  selectorOrSelectors: DkimSelector | DkimSelector[],
): EmailDnsRecord[] {
  const domain = ensureSenderDomain(brand);
  const selectors = Array.isArray(selectorOrSelectors)
    ? selectorOrSelectors
    : [selectorOrSelectors];
  return selectors.map((s) => ({
    type: 'TXT',
    name: `${s.selector}._domainkey.${domain}`,
    value: `v=DKIM1; k=rsa; p=${s.publicKey}`,
  }));
}

export function generateSpfRecord(brand: BrandIdentity, allowedSenders: string[]): EmailDnsRecord {
  const domain = ensureSenderDomain(brand);
  const mechanisms =
    allowedSenders.length === 0
      ? ['include:vitaos.app']
      : allowedSenders.map((s) => {
          if (
            s.startsWith('include:') ||
            s.startsWith('ip4:') ||
            s.startsWith('ip6:') ||
            s.startsWith('a:') ||
            s.startsWith('mx')
          ) {
            return s;
          }
          return `include:${s}`;
        });
  return {
    type: 'TXT',
    name: domain,
    value: `v=spf1 ${mechanisms.join(' ')} -all`,
  };
}

export function generateDmarcRecord(
  brand: BrandIdentity,
  options: { policy?: 'none' | 'quarantine' | 'reject'; reportEmail?: string } = {},
): EmailDnsRecord {
  const domain = ensureSenderDomain(brand);
  const policy = options.policy ?? 'quarantine';
  const parts = ['v=DMARC1', `p=${policy}`];
  if (options.reportEmail) parts.push(`rua=mailto:${options.reportEmail}`);
  return {
    type: 'TXT',
    name: `_dmarc.${domain}`,
    value: parts.join('; '),
  };
}

export function extractEmailDomain(address: string): string | undefined {
  const at = address.lastIndexOf('@');
  if (at < 0 || at === address.length - 1) return undefined;
  return address.slice(at + 1).toLowerCase();
}

function ensureSenderDomain(brand: BrandIdentity): string {
  const address = brand.emailSender;
  if (address) {
    const domain = extractEmailDomain(address);
    if (domain) return domain;
  }
  if (brand.primaryDomain) return brand.primaryDomain.toLowerCase();
  throw new Error('brand has no emailSender or primaryDomain configured');
}

function sanitizeDisplayName(name: string): string {
  return name.replace(/["<>\\]/g, '').trim();
}
