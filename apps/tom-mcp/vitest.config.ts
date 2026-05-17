import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: '@vita/app-tom-mcp',
    environment: 'node',
    include: ['src/**/*.{test,spec}.ts'],
  },
});