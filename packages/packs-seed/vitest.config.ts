import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: '@vita/packs-seed',
    environment: 'node',
    include: ['src/**/*.{test,spec}.ts'],
  },
});
