import { customType } from 'drizzle-orm/pg-core';

export const citext = customType<{ data: string; notNull: false; default: false }>({
  dataType() {
    return 'citext';
  },
});

export const ltreeType = customType<{ data: string; notNull: false; default: false }>({
  dataType() {
    return 'ltree';
  },
});

export const bytea = customType<{ data: Buffer; notNull: false; default: false }>({
  dataType() {
    return 'bytea';
  },
  fromDriver(value: unknown) {
    if (value instanceof Buffer) return value;
    if (typeof value === 'string') return Buffer.from(value, 'hex');
    return Buffer.from(value as ArrayBuffer);
  },
});

export const tsrange = customType<{ data: string; notNull: false; default: false }>({
  dataType() {
    return 'tstzrange';
  },
});
