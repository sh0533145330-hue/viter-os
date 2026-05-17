import { createHash, randomBytes } from 'node:crypto';

export interface CustomDomain {
  domain: string;
  verificationToken: string;
  status: 'pending' | 'verified' | 'failed';
}

export interface DomainValidation {
  valid: boolean;
  reason?: string;
}

export interface DnsRecord {
  type: 'CNAME' | 'TXT';
  name: string;
  value: string;
}

export interface CertProvisionResult {
  status: 'pending' | 'provisioned' | 'failed';
  provider: string;
  domain: string;
  certificateId?: string;
  notBefore?: string;
  notAfter?: string;
}

const BANNED_TLDS = new Set([
  'localhost',
  'local',
  'internal',
  'test',
  'example',
  'invalid',
  'arpa',
]);

const HOSTNAME_LABEL = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i;
const PRIVATE_IPV4_RANGES: Array<[number, number, number, number]> = [
  [10, 0, 0, 8],
  [127, 0, 0, 8],
  [169, 254, 0, 16],
  [172, 16, 0, 12],
  [192, 168, 0, 16],
];

export function validateDomain(domain: string): DomainValidation {
  if (typeof domain !== 'string' || domain.length === 0) {
    return { valid: false, reason: 'domain is empty' };
  }
  if (domain.length > 253) {
    return { valid: false, reason: 'domain exceeds 253 characters' };
  }
  const trimmed = domain.trim();
  if (trimmed !== domain) {
    return { valid: false, reason: 'domain must not contain leading or trailing whitespace' };
  }
  if (trimmed.toLowerCase() !== trimmed) {
    return { valid: false, reason: 'domain must be lowercase' };
  }
  const lower = trimmed;
  if (lower.includes('://') || lower.includes('/')) {
    return { valid: false, reason: 'domain must not contain a scheme or path' };
  }
  if (lower === 'localhost' || lower.endsWith('.localhost')) {
    return { valid: false, reason: 'localhost is not allowed' };
  }
  if (isIpv4Address(lower)) {
    if (isPrivateIpv4(lower)) {
      return { valid: false, reason: 'private IP address is not allowed' };
    }
    return { valid: false, reason: 'IP addresses are not allowed as domains' };
  }
  const labels = lower.split('.');
  if (labels.length < 2) {
    return { valid: false, reason: 'domain must have at least two labels' };
  }
  for (const label of labels) {
    if (label.length === 0 || label.length > 63) {
      return { valid: false, reason: `invalid label length: "${label}"` };
    }
    if (!HOSTNAME_LABEL.test(label)) {
      return { valid: false, reason: `invalid label characters: "${label}"` };
    }
  }
  const tld = labels[labels.length - 1] as string;
  if (BANNED_TLDS.has(tld)) {
    return { valid: false, reason: `TLD "${tld}" is not allowed` };
  }
  if (/^\d+$/.test(tld)) {
    return { valid: false, reason: 'numeric TLD is not allowed' };
  }
  return { valid: true };
}

export function generateVerificationToken(domain: string): string {
  const random = randomBytes(16).toString('hex');
  const hash = createHash('sha256').update(`${domain}:${random}`).digest('hex').slice(0, 16);
  return `vita-verify-${hash}-${random}`;
}

export function generateDnsRecords(domain: string, target: string): DnsRecord[] {
  const validation = validateDomain(domain);
  if (!validation.valid) {
    throw new Error(`Invalid domain: ${validation.reason ?? 'unknown reason'}`);
  }
  if (!target || target.length === 0) {
    throw new Error('target is required');
  }
  return [
    { type: 'CNAME', name: domain, value: target },
    { type: 'TXT', name: `_vita-verify.${domain}`, value: `vita-domain=${domain}` },
  ];
}

export interface DnsLookup {
  resolveTxt(name: string): Promise<string[][]>;
}

export async function checkDnsVerification(
  domain: string,
  expectedToken: string,
  lookup?: DnsLookup,
): Promise<boolean> {
  if (!lookup) return false;
  try {
    const records = await lookup.resolveTxt(`_vita-verify.${domain}`);
    for (const chunkSet of records) {
      const joined = chunkSet.join('');
      if (joined === expectedToken) return true;
    }
  } catch {
    return false;
  }
  return false;
}

export async function provisionCert(domain: string): Promise<CertProvisionResult> {
  const validation = validateDomain(domain);
  if (!validation.valid) {
    return {
      status: 'failed',
      provider: 'stub',
      domain,
    };
  }
  return {
    status: 'pending',
    provider: 'stub',
    domain,
  };
}

function isIpv4Address(value: string): boolean {
  const parts = value.split('.');
  if (parts.length !== 4) return false;
  return parts.every((part) => /^\d{1,3}$/.test(part) && Number(part) <= 255);
}

function isPrivateIpv4(value: string): boolean {
  const parts = value.split('.').map((p) => Number(p));
  if (parts.length !== 4) return false;
  const [a, b, c, d] = parts as [number, number, number, number];
  for (const [ra, rb, _rc, prefix] of PRIVATE_IPV4_RANGES) {
    if (prefix === 8 && a === ra) return true;
    if (prefix === 12 && a === ra && b >= 16 && b <= 31) return true;
    if (prefix === 16 && a === ra && b === rb) return true;
  }
  if (a === 0 || a >= 224) return true;
  if (a === undefined || b === undefined || c === undefined || d === undefined) return true;
  return false;
}
