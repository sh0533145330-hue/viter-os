import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: { name: '@vita/cli', environment: 'node', include: ['src/**/*.{test,spec}.ts'] },
});
