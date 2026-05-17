/**
 * Minimal ESLint compat layer. Biome is the primary linter; ESLint backstops
 * rules Biome does not yet support (notably React, Next.js, import order).
 */
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint', 'import'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended', 'prettier'],
  ignorePatterns: [
    'node_modules',
    'dist',
    '.next',
    '.turbo',
    'coverage',
    'playwright-report',
    'storybook-static',
    '**/*.d.ts',
  ],
  rules: {
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    '@typescript-eslint/consistent-type-imports': 'error',
    '@typescript-eslint/no-unused-vars': [
      'error',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
    ],
    'import/order': [
      'error',
      {
        groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
        'newlines-between': 'always',
        alphabetize: { order: 'asc', caseInsensitive: true },
        pathGroups: [{ pattern: '@vita/**', group: 'internal', position: 'before' }],
      },
    ],
  },
  overrides: [
    {
      files: ['scripts/**/*.{ts,js,cjs,mjs}'],
      rules: { 'no-console': 'off' },
    },
  ],
};
