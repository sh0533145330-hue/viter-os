import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: '@vita/app-tom',
    environment: 'jsdom',
    include: ['**/*.{test,spec}.{ts,tsx}'],
  },
});