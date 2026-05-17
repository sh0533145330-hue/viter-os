import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: '@vita/connector-sdk',
    environment: 'node',
    include: ['src/**/*.{test,spec}.ts'],
  },
});
