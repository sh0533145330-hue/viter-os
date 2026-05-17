import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: '@vita/observability',
    environment: 'node',
    include: ['src/**/*.{test,spec}.ts'],
  },
});
