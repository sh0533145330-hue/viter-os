import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: '@vita/agents-builtin',
    environment: 'node',
    include: ['src/**/*.{test,spec}.ts'],
  },
});
