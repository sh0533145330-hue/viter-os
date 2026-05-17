import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: '@vita/policy',
    environment: 'node',
    include: ['src/**/*.{test,spec}.ts'],
  },
});
