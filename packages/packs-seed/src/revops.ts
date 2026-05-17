import { definePack } from '@vita/pack-sdk';

export const revopsPack = definePack({
  key: 'revops',
  name: 'Revenue Operations Pack',
  description:
    'Knowledge pack for B2B RevOps: accounts, contacts, leads, opportunities, pipelines.',
  vertical: 'revops',
  vendor: 'VitaOS',
  license: 'MIT',
  version: '0.1.0',
  dependencies: { 'general-foundation': '^0.1.0' },
  items: [
    {
      kind: 'object_type',
      key: 'account',
      name: 'Account',
      definition: {
        properties: {
          name: { type: 'string', required: true },
          domain: { type: 'string', required: false },
          industry: { type: 'string', required: false },
          employees: { type: 'integer', required: false },
          arr: { type: 'decimal', required: false },
        },
      },
    },
    {
      kind: 'object_type',
      key: 'contact',
      name: 'Contact',
      definition: {
        properties: {
          first_name: { type: 'string', required: true },
          last_name: { type: 'string', required: true },
          email: { type: 'string', required: false },
          phone: { type: 'string', required: false },
          account: { type: 'reference', target: 'account' },
          title: { type: 'string', required: false },
        },
      },
    },
    {
      kind: 'object_type',
      key: 'lead',
      name: 'Lead',
      definition: {
        properties: {
          first_name: { type: 'string', required: true },
          last_name: { type: 'string', required: true },
          email: { type: 'string', required: false },
          source: { type: 'string', required: false },
          status: {
            type: 'enum',
            values: ['new', 'working', 'qualified', 'unqualified', 'converted'],
            default: 'new',
          },
          score: { type: 'integer', required: false },
        },
      },
    },
    {
      kind: 'object_type',
      key: 'opportunity',
      name: 'Opportunity',
      definition: {
        properties: {
          name: { type: 'string', required: true },
          account: { type: 'reference', target: 'account', required: true },
          amount: { type: 'decimal', required: false },
          stage: {
            type: 'enum',
            values: [
              'prospect',
              'qualified',
              'proposal',
              'negotiation',
              'closed_won',
              'closed_lost',
            ],
            default: 'prospect',
          },
          close_date: { type: 'date', required: false },
          probability: { type: 'decimal', required: false },
        },
      },
    },
    {
      kind: 'object_type',
      key: 'pipeline',
      name: 'Pipeline',
      definition: {
        properties: {
          name: { type: 'string', required: true },
          stages: { type: 'string[]', required: true },
          default_stage: { type: 'string', required: false },
        },
      },
    },
  ],
});
