import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: '@vita/test-harness',
    environment: 'node',
    include: ['src/**/*.{test,spec}.ts'],
  },
});
