import { defineConfig } from 'vitest/config';
export default defineConfig({ test: { name: '@vita/integrations', environment: 'node', include: ['src/**/*.{test,spec}.ts'] } });
