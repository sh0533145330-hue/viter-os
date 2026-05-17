import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: '@vita/security',
    environment: 'node',
    include: ['src/**/*.{test,spec}.ts'],
  },
});
