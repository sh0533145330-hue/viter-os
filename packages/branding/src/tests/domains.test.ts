import { describe, expect, it } from 'vitest';
import {
  checkDnsVerification,
  generateDnsRecords,
  generateVerificationToken,
  provisionCert,
  validateDomain,
} from '../domains.js';

describe('validateDomain', () => {
  it('accepts a normal apex domain', () => {
    expect(validateDomain('acme-cpa.com')).toEqual({ valid: true });
  });

  it('accepts a subdomain', () => {
    expect(validateDomain('assistant.acme-cpa.com')).toEqual({ valid: true });
  });

  it('rejects empty string', () => {
    expect(validateDomain('').valid).toBe(false);
  });

  it('rejects localhost', () => {
    expect(validateDomain('localhost').valid).toBe(false);
    expect(validateDomain('foo.localhost').valid).toBe(false);
  });

  it('rejects URL-like input', () => {
    expect(validateDomain('https://acme.com').valid).toBe(false);
    expect(validateDomain('acme.com/path').valid).toBe(false);
  });

  it('rejects private IP addresses', () => {
    expect(validateDomain('10.0.0.1').valid).toBe(false);
    expect(validateDomain('192.168.1.1').valid).toBe(false);
    expect(validateDomain('172.16.0.1').valid).toBe(false);
    expect(validateDomain('127.0.0.1').valid).toBe(false);
  });

  it('rejects public IP addresses (only domain names allowed)', () => {
    expect(validateDomain('8.8.8.8').valid).toBe(false);
  });

  it('rejects single-label domains', () => {
    expect(validateDomain('com').valid).toBe(false);
  });

  it('rejects banned TLDs', () => {
    expect(validateDomain('foo.test').valid).toBe(false);
    expect(validateDomain('foo.example').valid).toBe(false);
    expect(validateDomain('foo.internal').valid).toBe(false);
  });

  it('rejects uppercase domain', () => {
    expect(validateDomain('ACME.COM').valid).toBe(false);
  });

  it('rejects invalid characters', () => {
    expect(validateDomain('foo_bar.com').valid).toBe(false);
    expect(validateDomain('foo!.com').valid).toBe(false);
  });

  it('rejects empty label', () => {
    expect(validateDomain('foo..com').valid).toBe(false);
  });

  it('rejects label longer than 63 characters', () => {
    const long = 'a'.repeat(64);
    expect(validateDomain(`${long}.com`).valid).toBe(false);
  });
});

describe('generateVerificationToken', () => {
  it('produces a unique token containing the prefix', () => {
    const a = generateVerificationToken('acme.com');
    const b = generateVerificationToken('acme.com');
    expect(a.startsWith('vita-verify-')).toBe(true);
    expect(b.startsWith('vita-verify-')).toBe(true);
    expect(a).not.toBe(b);
    expect(a.length).toBeGreaterThan(20);
  });
});

describe('generateDnsRecords', () => {
  it('returns a CNAME and TXT for a valid domain', () => {
    const records = generateDnsRecords('assistant.acme.com', 'cname.vitaos.app');
    expect(records).toHaveLength(2);
    expect(records[0]?.type).toBe('CNAME');
    expect(records[0]?.value).toBe('cname.vitaos.app');
    expect(records[1]?.type).toBe('TXT');
    expect(records[1]?.name).toBe('_vita-verify.assistant.acme.com');
  });

  it('throws for invalid domain', () => {
    expect(() => generateDnsRecords('localhost', 'cname.vitaos.app')).toThrow();
  });

  it('throws when target is empty', () => {
    expect(() => generateDnsRecords('acme.com', '')).toThrow();
  });
});

describe('checkDnsVerification', () => {
  it('returns false when no lookup provided (stub)', async () => {
    expect(await checkDnsVerification('acme.com', 'vita-verify-xyz')).toBe(false);
  });

  it('returns true when the expected token is present', async () => {
    const lookup = {
      async resolveTxt() {
        return [['vita-verify-xyz']];
      },
    };
    expect(await checkDnsVerification('acme.com', 'vita-verify-xyz', lookup)).toBe(true);
  });

  it('returns false when the expected token is absent', async () => {
    const lookup = {
      async resolveTxt() {
        return [['something-else']];
      },
    };
    expect(await checkDnsVerification('acme.com', 'vita-verify-xyz', lookup)).toBe(false);
  });

  it('returns false when lookup throws', async () => {
    const lookup = {
      async resolveTxt(): Promise<string[][]> {
        throw new Error('NXDOMAIN');
      },
    };
    expect(await checkDnsVerification('acme.com', 'vita-verify-xyz', lookup)).toBe(false);
  });
});

describe('provisionCert (stub)', () => {
  it('returns pending for a valid domain', async () => {
    const result = await provisionCert('acme.com');
    expect(result.status).toBe('pending');
    expect(result.provider).toBe('stub');
  });

  it('returns failed for invalid domain', async () => {
    const result = await provisionCert('localhost');
    expect(result.status).toBe('failed');
  });
});
