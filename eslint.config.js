// eslint.config.js
const { FlatCompat } = require('@eslint/eslintrc');
const js = require('@eslint/js');

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
});

module.exports = [
  ...compat.extends('expo'),
  {
    ignores: ['/dist/*', 'node_modules/**'],
  },
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        __DEV__: 'readonly',
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        global: 'readonly',
      },
    },
    rules: {
      // Allow unused vars that start with underscore
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      // Prefer === but allow == for null checks
      'eqeqeq': ['error', 'always', { null: 'ignore' }],
      // Relax some React hooks rules for this project
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
];
