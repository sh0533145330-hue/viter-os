import { definePack } from '@vita/pack-sdk';

export const propertyMgmtPack = definePack({
  key: 'property-mgmt',
  name: 'Property Management Pack',
  description:
    'Knowledge pack for property management: properties, units, tenants, leases, work orders, vendors.',
  vertical: 'property',
  vendor: 'VitaOS',
  license: 'MIT',
  version: '0.1.0',
  dependencies: { 'general-foundation': '^0.1.0' },
  items: [
    {
      kind: 'object_type',
      key: 'property',
      name: 'Property',
      definition: {
        properties: {
          name: { type: 'string', required: true },
          address: { type: 'string', required: true },
          city: { type: 'string', required: false },
          state: { type: 'string', required: false },
          zip: { type: 'string', required: false },
          type: {
            type: 'enum',
            values: ['single_family', 'multi_family', 'commercial', 'industrial', 'mixed_use'],
          },
        },
      },
    },
    {
      kind: 'object_type',
      key: 'unit',
      name: 'Unit',
      definition: {
        properties: {
          property: { type: 'reference', target: 'property', required: true },
          number: { type: 'string', required: true },
          bedrooms: { type: 'integer', required: false },
          bathrooms: { type: 'decimal', required: false },
          square_feet: { type: 'integer', required: false },
          market_rent: { type: 'decimal', required: false },
        },
      },
    },
    {
      kind: 'object_type',
      key: 'tenant',
      name: 'Tenant',
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
      key: 'lease',
      name: 'Lease',
      definition: {
        properties: {
          unit: { type: 'reference', target: 'unit', required: true },
          tenant: { type: 'reference', target: 'tenant', required: true },
          start_date: { type: 'date', required: true },
          end_date: { type: 'date', required: true },
          rent: { type: 'decimal', required: true },
          deposit: { type: 'decimal', required: false },
          status: {
            type: 'enum',
            values: ['draft', 'active', 'ending', 'ended', 'terminated'],
            default: 'draft',
          },
        },
      },
    },
    {
      kind: 'object_type',
      key: 'work_order',
      name: 'Work Order',
      definition: {
        properties: {
          unit: { type: 'reference', target: 'unit' },
          summary: { type: 'string', required: true },
          priority: {
            type: 'enum',
            values: ['low', 'normal', 'high', 'emergency'],
            default: 'normal',
          },
          status: {
            type: 'enum',
            values: ['open', 'assigned', 'in_progress', 'resolved', 'closed'],
            default: 'open',
          },
          vendor: { type: 'reference', target: 'vendor' },
        },
      },
    },
    {
      kind: 'object_type',
      key: 'vendor',
      name: 'Vendor',
      definition: {
        properties: {
          name: { type: 'string', required: true },
          category: { type: 'string', required: false },
          phone: { type: 'string', required: false },
          email: { type: 'string', required: false },
        },
      },
    },
  ],
});
