import { definePack } from '@vita/pack-sdk';

export const assetMgmtPack = definePack({
  key: 'asset-mgmt',
  name: 'Asset Management Pack',
  description:
    'Knowledge pack for asset management: portfolios, assets, positions, trades, mandates.',
  vertical: 'asset',
  vendor: 'VitaOS',
  license: 'MIT',
  version: '0.1.0',
  dependencies: { 'general-foundation': '^0.1.0' },
  items: [
    {
      kind: 'object_type',
      key: 'portfolio',
      name: 'Portfolio',
      definition: {
        properties: {
          name: { type: 'string', required: true },
          base_currency: { type: 'string', default: 'USD' },
          inception_date: { type: 'date', required: false },
          benchmark: { type: 'string', required: false },
        },
      },
    },
    {
      kind: 'object_type',
      key: 'asset',
      name: 'Asset',
      definition: {
        properties: {
          ticker: { type: 'string', required: true },
          name: { type: 'string', required: true },
          asset_class: {
            type: 'enum',
            values: ['equity', 'fixed_income', 'cash', 'alternative', 'commodity'],
          },
          isin: { type: 'string', required: false },
        },
      },
    },
    {
      kind: 'object_type',
      key: 'position',
      name: 'Position',
      definition: {
        properties: {
          portfolio: { type: 'reference', target: 'portfolio', required: true },
          asset: { type: 'reference', target: 'asset', required: true },
          quantity: { type: 'decimal', required: true },
          cost_basis: { type: 'decimal', required: false },
          as_of_date: { type: 'date', required: true },
        },
      },
    },
    {
      kind: 'object_type',
      key: 'trade',
      name: 'Trade',
      definition: {
        properties: {
          portfolio: { type: 'reference', target: 'portfolio', required: true },
          asset: { type: 'reference', target: 'asset', required: true },
          side: { type: 'enum', values: ['buy', 'sell'], required: true },
          quantity: { type: 'decimal', required: true },
          price: { type: 'decimal', required: true },
          trade_date: { type: 'date', required: true },
          settlement_date: { type: 'date', required: false },
          status: {
            type: 'enum',
            values: ['pending', 'executed', 'settled', 'cancelled'],
            default: 'pending',
          },
        },
      },
    },
    {
      kind: 'object_type',
      key: 'mandate',
      name: 'Mandate',
      definition: {
        properties: {
          portfolio: { type: 'reference', target: 'portfolio', required: true },
          name: { type: 'string', required: true },
          objective: { type: 'string', required: false },
          risk_profile: {
            type: 'enum',
            values: ['conservative', 'moderate', 'aggressive'],
          },
          constraints: { type: 'jsonb', required: false },
        },
      },
    },
  ],
});
