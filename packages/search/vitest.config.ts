import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: '@vita/search',
    environment: 'node',
    include: ['src/**/*.{test,spec}.ts'],
  },
});
