// https://docs.expo.dev/guides/using-eslint/
module.exports = {
  extends: 'expo',
  ignorePatterns: ['/dist/*'],
  env: {
    es6: true,
    node: true,
    browser: true,
  },
  globals: {
    __DEV__: 'readonly',
  },
  rules: {
    // Allow unused vars that start with underscore
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    // Prefer === but allow == for null checks
    'eqeqeq': ['error', 'always', { null: 'ignore' }],
    // Relax some React hooks rules for this project
    'react-hooks/exhaustive-deps': 'warn',
  },
};tps://docs.expo.dev/guides/using-eslint/
module.exports = {
  extends: 'expo',
  ignorePatterns: ['/dist/*'],
};
