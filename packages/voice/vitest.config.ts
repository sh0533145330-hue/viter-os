import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: '@vita/voice',
    environment: 'node',
    include: ['src/**/*.{test,spec}.ts'],
  },
});
