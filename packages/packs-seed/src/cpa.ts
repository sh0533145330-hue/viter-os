import { definePack } from '@vita/pack-sdk';

export const cpaPack = definePack({
  key: 'cpa',
  name: 'CPA Vertical Pack',
  description:
    'Knowledge pack for Certified Public Accountants: clients, engagements, returns, transactions, accounts, invoices.',
  vertical: 'cpa',
  vendor: 'VitaOS',
  license: 'MIT',
  version: '0.1.0',
  dependencies: { 'general-foundation': '^0.1.0' },
  items: [
    {
      kind: 'object_type',
      key: 'client',
      name: 'Client',
      definition: {
        properties: {
          name: { type: 'string', required: true },
          tax_id: { type: 'string', required: false },
          entity_type: {
            type: 'enum',
            values: ['individual', 'llc', 's_corp', 'c_corp', 'partnership', 'trust'],
            default: 'individual',
          },
          fiscal_year_end: { type: 'date', required: false },
        },
      },
    },
    {
      kind: 'object_type',
      key: 'engagement',
      name: 'Engagement',
      definition: {
        properties: {
          name: { type: 'string', required: true },
          client: { type: 'reference', target: 'client', required: true },
          status: {
            type: 'enum',
            values: ['proposed', 'active', 'on_hold', 'completed', 'cancelled'],
            default: 'proposed',
          },
          start_date: { type: 'date', required: false },
        },
      },
    },
    {
      kind: 'object_type',
      key: 'tax_return',
      name: 'Tax Return',
      definition: {
        properties: {
          client: { type: 'reference', target: 'client', required: true },
          tax_year: { type: 'integer', required: true },
          form: { type: 'string', required: true },
          status: {
            type: 'enum',
            values: ['draft', 'in_review', 'filed', 'amended'],
            default: 'draft',
          },
          filed_date: { type: 'date', required: false },
        },
      },
    },
    {
      kind: 'object_type',
      key: 'transaction',
      name: 'Transaction',
      definition: {
        properties: {
          date: { type: 'date', required: true },
          amount: { type: 'decimal', required: true },
          currency: { type: 'string', default: 'USD' },
          description: { type: 'string', required: false },
          account: { type: 'reference', target: 'account' },
        },
      },
    },
    {
      kind: 'object_type',
      key: 'account',
      name: 'Account',
      definition: {
        properties: {
          name: { type: 'string', required: true },
          number: { type: 'string', required: false },
          type: {
            type: 'enum',
            values: ['asset', 'liability', 'equity', 'revenue', 'expense'],
            required: true,
          },
        },
      },
    },
    {
      kind: 'object_type',
      key: 'invoice',
      name: 'Invoice',
      definition: {
        properties: {
          client: { type: 'reference', target: 'client', required: true },
          number: { type: 'string', required: true },
          issued_date: { type: 'date', required: true },
          due_date: { type: 'date', required: false },
          amount: { type: 'decimal', required: true },
          status: {
            type: 'enum',
            values: ['draft', 'sent', 'paid', 'overdue', 'void'],
            default: 'draft',
          },
        },
      },
    },
    {
      kind: 'object_type',
      key: 'receipt',
      name: 'Receipt',
      definition: {
        properties: {
          invoice: { type: 'reference', target: 'invoice' },
          amount: { type: 'decimal', required: true },
          received_date: { type: 'date', required: true },
          method: {
            type: 'enum',
            values: ['ach', 'wire', 'check', 'card', 'cash'],
          },
        },
      },
    },
  ],
});
