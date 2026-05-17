import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: '@vita/timeseries',
    environment: 'node',
    include: ['src/**/*.{test,spec}.ts'],
  },
});
