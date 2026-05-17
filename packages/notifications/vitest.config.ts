import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: '@vita/notifications',
    environment: 'node',
    include: ['src/**/*.{test,spec}.ts'],
  },
});
