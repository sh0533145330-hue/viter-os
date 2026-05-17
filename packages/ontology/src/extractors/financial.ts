/**
 * FinancialRecordExtractor — L0→L1 extraction for financial artifacts.
 *
 * Handles invoices, receipts, transaction logs, financial reports.
 * Pattern-based extraction for v1.
 */

import type { Extractor } from '../extractor.js';
import type { L0Artifact, L1Extraction, ExtractorContext, EntityRef, Sensitivity } from '../types.js';

// ---------------------------------------------------------------------------
// Financial data parsing
// ---------------------------------------------------------------------------

interface FinancialData {
  amount: string | undefined;
  currency: string | undefined;
  date: string | undefined;
  vendor: string | undefined;
  invoiceNumber: string | undefined;
  category: string | undefined;
}

function parseFinancialData(raw: string): FinancialData {
  let amount: string | undefined;
  let currency: string | undefined;
  let date: string | undefined;
  let vendor: string | undefined;
  let invoiceNumber: string | undefined;
  let category: string | undefined;

  // Amount detection: $1,234.56 or €1.000,00 or ¥100,000
  const amountMatch = /(?:[$€£¥])\s*([\d,]+(?:\.\d{2})?)/.exec(raw)
    ?? /([\d,]+(?:\.\d{2})?)\s*(?:USD|EUR|GBP|JPY|CAD|AUD)/i.exec(raw);
  if (amountMatch) {
    amount = amountMatch[1]!.replace(/,/g, '');
    // Detect currency
    const currencyMatch = /[$€£¥]/.exec(raw) ?? /(?:USD|EUR|GBP|JPY|CAD|AUD)/i.exec(raw);
    if (currencyMatch) {
      const sym = currencyMatch[0]!;
      const currencyMap: Record<string, string> = {
        $: 'USD', '€': 'EUR', '£': 'GBP', '¥': 'JPY',
        USD: 'USD', EUR: 'EUR', GBP: 'GBP', JPY: 'JPY', CAD: 'CAD', AUD: 'AUD',
      };
      currency = currencyMap[sym] ?? sym;
    }
  }

  // Date detection
  const dateMatch = /(\d{4}[-/]\d{2}[-/]\d{2})/.exec(raw)
    ?? /(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/.exec(raw);
  if (dateMatch) date = dateMatch[1];

  // Invoice number
  const invMatch = /(?:invoice|inv|receipt|ref)\s*#?\s*[:\s]?\s*([A-Z0-9-]+)/i.exec(raw);
  if (invMatch) invoiceNumber = invMatch[1];

  // Vendor
  const vendorMatch = /(?:vendor|supplier|from|payee|seller)\s*[:\s]\s*(.+)/i.exec(raw);
  if (vendorMatch) vendor = vendorMatch[1]!.trim().split(/\n/)[0]!.trim();

  // Category
  const catMatch = /(?:category|type|class)\s*[:\s]\s*(.+)/i.exec(raw);
  if (catMatch) category = catMatch[1]!.trim().split(/\n/)[0]!.trim();

  return { amount, currency, date, vendor, invoiceNumber, category };
}

// ---------------------------------------------------------------------------
// Entity reference detection
// ---------------------------------------------------------------------------

function detectEntityRefs(raw: string, data: FinancialData): EntityRef[] {
  const refs: EntityRef[] = [];
  // Inline [entity:...] refs
  const regex = /\[entity:(\w+):([^\]]+)\]/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(raw)) !== null) {
    refs.push({ kind: match[1]!, name: match[2]!.trim() });
  }
  // Vendor as org ref
  if (data.vendor) {
    refs.push({ kind: 'org', name: data.vendor });
  }
  return refs;
}

// ---------------------------------------------------------------------------
// PII detection
// ---------------------------------------------------------------------------

function detectPII(text: string): string[] {
  const tags: string[] = [];
  if (/[\w.-]+@[\w.-]+\.\w{2,}/.test(text)) tags.push('email_address');
  if (/\b\d{3}-\d{2}-\d{4}\b/.test(text)) tags.push('ssn');
  if (/\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/.test(text)) tags.push('credit_card');
  if (/\b\d{9,12}\b/.test(text)) tags.push('bank_account');
  return tags;
}

function inferSensitivity(_text: string, piiTags: string[]): Sensitivity {
  if (piiTags.includes('ssn') || piiTags.includes('credit_card') || piiTags.includes('bank_account')) return 'restricted';
  if (piiTags.length > 0) return 'confidential';
  return 'confidential'; // Financial data is confidential by default
}

// ---------------------------------------------------------------------------
// FinancialRecordExtractor
// ---------------------------------------------------------------------------

export class FinancialRecordExtractor implements Extractor {
  readonly kind = 'financial';

  async extract(l0: L0Artifact, _ctx: ExtractorContext): Promise<L1Extraction> {
    const raw = l0.body;
    const financialData = parseFinancialData(raw);

    const entityReferences = detectEntityRefs(raw, financialData);

    const piiTags = detectPII(raw);
    const sensitivity = inferSensitivity(raw, piiTags);

    const tags: string[] = ['financial'];
    if (financialData.amount) tags.push('has-amount');
    if (financialData.invoiceNumber) tags.push('invoice');
    if (financialData.vendor) tags.push('has-vendor');
    if (l0.mimeType.includes('csv') || l0.mimeType.includes('excel')) tags.push('tabular');

    const frontmatter: Record<string, unknown> = {
      kind: 'financial',
      source_id: l0.id,
      extractor: 'FinancialRecordExtractor',
      amount: financialData.amount,
      currency: financialData.currency,
      date: financialData.date,
      vendor: financialData.vendor,
      invoice_number: financialData.invoiceNumber,
      category: financialData.category,
      entity_references: entityReferences.map((r) => ({ kind: r.kind, name: r.name })),
      tags,
      sensitivity,
      pii_tags: piiTags,
    };

    const yamlLines = Object.entries(frontmatter).map(([k, v]) => {
      if (v === undefined) return `${k}: null`;
      if (Array.isArray(v)) {
        if (v.length === 0) return `${k}: []`;
        const items = v.map((item) => `  - ${typeof item === 'object' && item !== null ? JSON.stringify(item) : String(item)}`);
        return `${k}:\n${items.join('\n')}`;
      }
      if (typeof v === 'string' && /[:#{}|>]/.test(v)) return `${k}: "${v.replace(/"/g, '\\"')}"`;
      return `${k}: ${String(v)}`;
    });
    const yamlFm = yamlLines.join('\n');

    const title = financialData.invoiceNumber
      ? `Invoice ${financialData.invoiceNumber}`
      : 'Financial Record';
    const markdownBody = `---\n${yamlFm}\n---\n\n# ${title}\n\n${raw.trim()}`;

    return {
      kind: 'financial',
      schemaVersion: 1,
      frontmatter,
      body: markdownBody,
      entityReferences,
      tags,
      sensitivity,
      piiTags,
    };
  }
}
