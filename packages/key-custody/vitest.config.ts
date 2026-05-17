import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: '@vita/key-custody',
    environment: 'node',
    include: ['src/**/*.{test,spec}.ts'],
  },
});
