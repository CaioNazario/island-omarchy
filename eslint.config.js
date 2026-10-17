// @ts-check
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';

// O motor JS do QML (V4) não tem estas APIs (specs/14-spikes.md, S5). O `tsc`
// já recusa `setTimeout`/`TextDecoder` (lib só ES2022); `Intl` e os
// `toLocale*` passam no tipo e quebram em runtime.
const QML_MISSING_GLOBALS = ['Intl', 'TextDecoder', 'TextEncoder', 'fetch'].map((name) => ({
  name,
  message: 'not available in the QML JavaScript engine (specs/14-spikes.md, S5)',
}));

export default tseslint.config(
  {
    ignores: ['dist/**', 'node_modules/**', 'design/**'],
  },
  ...tseslint.configs.recommended,
  {
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['src/core/**/*.ts'],
    ignores: ['src/core/**/*.test.ts'],
    rules: {
      'no-restricted-globals': ['error', ...QML_MISSING_GLOBALS],
      'no-restricted-syntax': [
        'error',
        {
          selector: 'CallExpression[callee.property.name=/^toLocale/]',
          message: 'toLocale* depends on Intl, which the QML JavaScript engine lacks',
        },
      ],
    },
  },
  eslintConfigPrettier,
);
