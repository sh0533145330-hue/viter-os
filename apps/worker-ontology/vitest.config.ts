import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: '@vita/app-worker-ontology',
    environment: 'node',
    include: ['src/**/*.{test,spec}.ts'],
  },
});