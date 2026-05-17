import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: '@vita/ui',
    environment: 'node',
    include: ['src/**/*.{test,spec}.ts'],
  },
});
