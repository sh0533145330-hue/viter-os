import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: '@vita/anonymization',
    environment: 'node',
    include: ['src/**/*.{test,spec}.ts'],
  },
});
