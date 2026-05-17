/**
 * Tests for ExtractionFramework and individual extractors.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExtractionFramework, type Extractor } from '../extractor.js';
import { EmailExtractor } from '../extractors/email.js';
import { DocumentExtractor } from '../extractors/document.js';
import { TranscriptExtractor } from '../extractors/transcript.js';
import { ChatMessageExtractor } from '../extractors/chat.js';
import { FinancialRecordExtractor } from '../extractors/financial.js';
import { GenericExtractor } from '../extractors/generic.js';
import type { L0Artifact, ExtractorContext, L1Extraction } from '../types.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const mockLogger = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
};

const mockContext: ExtractorContext = {
  workspaceId: '00000000-0000-0000-0000-000000000001',
  logger: mockLogger,
};

function makeL0(sourceKind: string, body: string, mimeType = 'text/plain', metadata: Record<string, unknown> = {}): L0Artifact {
  return {
    id: '00000000-0000-0000-0000-000000000002',
    sourceKind,
    mimeType,
    body,
    metadata,
  };
}

// ---------------------------------------------------------------------------
// ExtractionFramework
// ---------------------------------------------------------------------------

describe('ExtractionFramework', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('registers and dispatches to the correct extractor', async () => {
    const framework = new ExtractionFramework(mockLogger);
    const emailExtractor = new EmailExtractor();
    framework.register(emailExtractor);

    const l0 = makeL0('email', 'From: alice@example.com\nSubject: Test\n\nHello world');
    const result = await framework.extract(l0, mockContext);

    expect(result.kind).toBe('email');
    expect(result.body).toContain('Test');
    expect(result.entityReferences.length).toBeGreaterThan(0);
  });

  it('falls back to generic extractor when no specific extractor is registered', async () => {
    const framework = new ExtractionFramework(mockLogger);
    const genericExtractor = new GenericExtractor();
    framework.register(genericExtractor);

    const l0 = makeL0('unknown_kind', 'Some content here');
    const result = await framework.extract(l0, mockContext);

    expect(result.kind).toBe('generic');
  });

  it('throws when no matching extractor and no generic fallback', async () => {
    const framework = new ExtractionFramework(mockLogger);
    const emailExtractor = new EmailExtractor();
    framework.register(emailExtractor);

    const l0 = makeL0('unknown_kind', 'Some content');
    await expect(framework.extract(l0, mockContext)).rejects.toThrow(
      'No extractor registered for sourceKind="unknown_kind"',
    );
  });

  it('lists all registered kinds', () => {
    const framework = new ExtractionFramework(mockLogger);
    framework.register(new EmailExtractor());
    framework.register(new DocumentExtractor());
    framework.register(new GenericExtractor());

    const kinds = framework.listKinds();
    expect(kinds).toContain('email');
    expect(kinds).toContain('document');
    expect(kinds).toContain('generic');
    expect(kinds.length).toBe(3);
  });

  it('allows overriding a registered extractor', async () => {
    const framework = new ExtractionFramework(mockLogger);
    const customExtractor: Extractor = {
      kind: 'email',
      extract: async () => ({
        kind: 'email',
        schemaVersion: 1,
        frontmatter: { custom: true },
        body: 'Custom extraction',
        entityReferences: [],
        tags: ['custom'],
        sensitivity: 'internal' as const,
        piiTags: [],
      }),
    };

    framework.register(new EmailExtractor());
    framework.register(customExtractor);

    const l0 = makeL0('email', 'From: test@test.com\n\nBody');
    const result = await framework.extract(l0, mockContext);
    expect(result.frontmatter).toEqual({ custom: true });
  });

  it('dispatches all built-in extractors correctly', async () => {
    const framework = new ExtractionFramework(mockLogger);
    framework.register(new EmailExtractor());
    framework.register(new DocumentExtractor());
    framework.register(new TranscriptExtractor());
    framework.register(new ChatMessageExtractor());
    framework.register(new FinancialRecordExtractor());
    framework.register(new GenericExtractor());

    expect(framework.listKinds().length).toBe(6);

    const emailL0 = makeL0('email', 'From: test@test.com\nSubject: Hi\n\nHello');
    const result = await framework.extract(emailL0, mockContext);
    expect(result.kind).toBe('email');
  });
});

// ---------------------------------------------------------------------------
// EmailExtractor
// ---------------------------------------------------------------------------

describe('EmailExtractor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('parses email headers and body', async () => {
    const extractor = new EmailExtractor();
    const l0 = makeL0(
      'email',
      'From: Alice <alice@acme.com>\nTo: Bob <bob@acme.com>\nCc: Carol <carol@acme.com>\nSubject: Meeting Tomorrow\nDate: 2024-01-15\n\nLet\'s meet at 3pm.',
    );

    const result = await extractor.extract(l0, mockContext);

    expect(result.kind).toBe('email');
    expect(result.frontmatter['subject']).toBe('Meeting Tomorrow');
    expect(result.frontmatter['from']).toBe('Alice <alice@acme.com>');
    expect(result.body).toContain('Let\'s meet at 3pm.');
  });

  it('detects inline entity references', async () => {
    const extractor = new EmailExtractor();
    const l0 = makeL0(
      'email',
      'From: alice@example.com\nSubject: Project\n\nDiscussion with [entity:person:John Smith] about [entity:org:Acme Corp].',
    );

    const result = await extractor.extract(l0, mockContext);

    expect(result.entityReferences.some((r) => r.kind === 'person' && r.name === 'John Smith')).toBe(true);
    expect(result.entityReferences.some((r) => r.kind === 'org' && r.name === 'Acme Corp')).toBe(true);
  });

  it('detects action items', async () => {
    const extractor = new EmailExtractor();
    const l0 = makeL0(
      'email',
      'From: alice@example.com\nSubject: Tasks\n\nTODO: Review the proposal by Friday\n[action:commitment:Submit report by Monday]',
    );

    const result = await extractor.extract(l0, mockContext);

    expect(result.tags).toContain('has-action-items');
    expect(result.frontmatter['action_items']).toBeDefined();
    const actions = result.frontmatter['action_items'] as string[];
    expect(actions.length).toBeGreaterThan(0);
  });

  it('detects PII tags', async () => {
    const extractor = new EmailExtractor();
    const l0 = makeL0(
      'email',
      'From: alice@example.com\nSubject: Info\n\nMy SSN is 123-45-6789',
    );

    const result = await extractor.extract(l0, mockContext);
    expect(result.piiTags).toContain('ssn');
    expect(result.sensitivity).toBe('restricted');
  });

  it('infers correct sensitivity', async () => {
    const extractor = new EmailExtractor();

    // Internal (default)
    const l0Internal = makeL0('email', 'From: a@b.com\nSubject: Hi\n\nHello');
    const resultInternal = await extractor.extract(l0Internal, mockContext);
    expect(resultInternal.sensitivity).toBe('internal');

    // Confidential (email address PII)
    const l0Confidential = makeL0('email', 'From: a@b.com\nSubject: Hi\n\nContact at user@example.com');
    const resultConfidential = await extractor.extract(l0Confidential, mockContext);
    expect(resultConfidential.sensitivity).toBe('confidential');
  });

  it('generates YAML frontmatter in body', async () => {
    const extractor = new EmailExtractor();
    const l0 = makeL0('email', 'From: alice@example.com\nSubject: Test\n\nBody text');

    const result = await extractor.extract(l0, mockContext);

    expect(result.body).toMatch(/^---\n/);
    expect(result.body).toContain('kind: email');
    expect(result.body).toContain('---\n\n# Test');
  });
});

// ---------------------------------------------------------------------------
// DocumentExtractor
// ---------------------------------------------------------------------------

describe('DocumentExtractor', () => {
  it('extracts document with sections', async () => {
    const extractor = new DocumentExtractor();
    const l0 = makeL0('document', '# Introduction\n\nSome text\n\n## Methods\n\nDetails here', 'text/markdown');

    const result = await extractor.extract(l0, mockContext);

    expect(result.kind).toBe('document');
    expect(result.frontmatter['sections']).toEqual(['Introduction', 'Methods']);
    expect(result.tags).toContain('has-sections');
  });

  it('detects entity references in documents', async () => {
    const extractor = new DocumentExtractor();
    const l0 = makeL0('document', 'Report about [entity:org:Acme] and [entity:person:Jane Doe]');

    const result = await extractor.extract(l0, mockContext);
    expect(result.entityReferences.some((r) => r.kind === 'org' && r.name === 'Acme')).toBe(true);
  });

  it('tags by MIME type', async () => {
    const extractor = new DocumentExtractor();
    const l0Pdf = makeL0('document', 'PDF content', 'application/pdf');
    const result = await extractor.extract(l0Pdf, mockContext);
    expect(result.tags).toContain('pdf');
  });
});

// ---------------------------------------------------------------------------
// TranscriptExtractor
// ---------------------------------------------------------------------------

describe('TranscriptExtractor', () => {
  it('detects speakers in transcript', async () => {
    const extractor = new TranscriptExtractor();
    const l0 = makeL0(
      'transcript',
      '[Alice]: Hello everyone\n[Bob]: Let\'s discuss the project\n[Alice]: Agreed',
    );

    const result = await extractor.extract(l0, mockContext);

    expect(result.kind).toBe('transcript');
    expect(result.frontmatter['speakers']).toBeDefined();
    const speakers = result.frontmatter['speakers'] as string[];
    expect(speakers).toContain('Alice');
    expect(speakers).toContain('Bob');
  });

  it('detects action items in transcript', async () => {
    const extractor = new TranscriptExtractor();
    const l0 = makeL0(
      'transcript',
      '[Alice]: action item: Send the report\n[Bob]: follow up: Schedule meeting',
    );

    const result = await extractor.extract(l0, mockContext);
    expect(result.tags).toContain('has-action-items');
  });
});

// ---------------------------------------------------------------------------
// ChatMessageExtractor
// ---------------------------------------------------------------------------

describe('ChatMessageExtractor', () => {
  it('parses chat messages', async () => {
    const extractor = new ChatMessageExtractor();
    const l0 = makeL0(
      'chat',
      '2024-01-15T10:30:00Z <alice> Hello\n2024-01-15T10:31:00Z <bob> Hi there',
    );

    const result = await extractor.extract(l0, mockContext);

    expect(result.kind).toBe('chat');
    expect(result.frontmatter['participants']).toBeDefined();
    const participants = result.frontmatter['participants'] as string[];
    expect(participants).toContain('alice');
    expect(participants).toContain('bob');
  });

  it('detects @mentions as person refs', async () => {
    const extractor = new ChatMessageExtractor();
    const l0 = makeL0('chat', '@alice can you review this? @bob fyi');

    const result = await extractor.extract(l0, mockContext);
    expect(result.entityReferences.some((r) => r.kind === 'person' && r.name === 'alice')).toBe(true);
    expect(result.entityReferences.some((r) => r.kind === 'person' && r.name === 'bob')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// FinancialRecordExtractor
// ---------------------------------------------------------------------------

describe('FinancialRecordExtractor', () => {
  it('extracts financial data', async () => {
    const extractor = new FinancialRecordExtractor();
    const l0 = makeL0(
      'financial',
      'Invoice #INV-2024-001\nDate: 2024-01-15\nVendor: Acme Corp\nAmount: $1,234.56',
    );

    const result = await extractor.extract(l0, mockContext);

    expect(result.kind).toBe('financial');
    expect(result.frontmatter['invoice_number']).toBe('INV-2024-001');
    expect(result.frontmatter['amount']).toBe('1234.56');
    expect(result.frontmatter['currency']).toBe('USD');
    expect(result.frontmatter['vendor']).toBe('Acme Corp');
  });

  it('defaults to confidential sensitivity', async () => {
    const extractor = new FinancialRecordExtractor();
    const l0 = makeL0('financial', 'Amount: $100');

    const result = await extractor.extract(l0, mockContext);
    expect(result.sensitivity).toBe('confidential');
  });
});

// ---------------------------------------------------------------------------
// GenericExtractor
// ---------------------------------------------------------------------------

describe('GenericExtractor', () => {
  it('handles unknown source kinds', async () => {
    const extractor = new GenericExtractor();
    const l0 = makeL0('custom', 'Some content [entity:person:Jane]', 'text/plain');

    const result = await extractor.extract(l0, mockContext);

    expect(result.kind).toBe('generic');
    expect(result.entityReferences.some((r) => r.kind === 'person' && r.name === 'Jane')).toBe(true);
  });

  it('detects PII in generic content', async () => {
    const extractor = new GenericExtractor();
    const l0 = makeL0('custom', 'Contact: user@example.com');

    const result = await extractor.extract(l0, mockContext);
    expect(result.piiTags).toContain('email_address');
  });
});
