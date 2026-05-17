import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: '@vita/billing',
    environment: 'node',
    include: ['src/**/*.{test,spec}.ts'],
  },
});
