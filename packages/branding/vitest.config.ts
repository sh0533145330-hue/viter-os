import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: '@vita/branding',
    environment: 'node',
    include: ['src/**/*.{test,spec}.ts', 'src/**/*.{test,spec}.tsx'],
  },
});
