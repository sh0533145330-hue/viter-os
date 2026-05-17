import { definePack } from '@vita/pack-sdk';

export const generalFoundationPack = definePack({
  key: 'general-foundation',
  name: 'General Foundation',
  description:
    'Foundational ObjectTypes shared across verticals: Person, Organization, Meeting, Document, Task.',
  vertical: 'general',
  vendor: 'VitaOS',
  license: 'MIT',
  version: '0.1.0',
  dependencies: {},
  items: [
    {
      kind: 'object_type',
      key: 'person',
      name: 'Person',
      definition: {
        properties: {
          first_name: { type: 'string', required: true },
          last_name: { type: 'string', required: true },
          email: { type: 'string', required: false },
          phone: { type: 'string', required: false },
        },
      },
    },
    {
      kind: 'object_type',
      key: 'organization',
      name: 'Organization',
      definition: {
        properties: {
          name: { type: 'string', required: true },
          domain: { type: 'string', required: false },
          industry: { type: 'string', required: false },
        },
      },
    },
    {
      kind: 'object_type',
      key: 'meeting',
      name: 'Meeting',
      definition: {
        properties: {
          title: { type: 'string', required: true },
          start_time: { type: 'timestamp', required: true },
          end_time: { type: 'timestamp', required: false },
          attendees: { type: 'reference[]', target: 'person' },
        },
      },
    },
    {
      kind: 'object_type',
      key: 'document',
      name: 'Document',
      definition: {
        properties: {
          title: { type: 'string', required: true },
          mime_type: { type: 'string', required: false },
          url: { type: 'string', required: false },
          author: { type: 'reference', target: 'person' },
        },
      },
    },
    {
      kind: 'object_type',
      key: 'task',
      name: 'Task',
      definition: {
        properties: {
          title: { type: 'string', required: true },
          status: {
            type: 'enum',
            values: ['open', 'in_progress', 'done', 'cancelled'],
            default: 'open',
          },
          assignee: { type: 'reference', target: 'person' },
          due_date: { type: 'date', required: false },
        },
      },
    },
  ],
});
