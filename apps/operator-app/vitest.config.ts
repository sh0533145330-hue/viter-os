import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: '@vita/app-operator',
    environment: 'node',
    include: ['**/*.{test,spec}.{ts,tsx}'],
  },
});
