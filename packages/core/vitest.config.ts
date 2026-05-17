import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: '@vita/core',
    environment: 'node',
    include: ['src/**/*.{test,spec}.ts'],
  },
});
