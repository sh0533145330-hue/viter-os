import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: '@vita/eval',
    environment: 'node',
    include: ['src/**/*.{test,spec}.ts'],
  },
});
