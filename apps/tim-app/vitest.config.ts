import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: '@vita/app-tim',
    environment: 'jsdom',
    include: ['**/*.{test,spec}.{ts,tsx}'],
  },
});