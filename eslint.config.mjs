import eslint from '@eslint/js';
import prettier from 'eslint-config-prettier';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['node_modules/**', 'dist/**', 'build/**', 'coverage/**', 'specs/**'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,
  {
    rules: {
      // CLI and validation scripts intentionally report results on stdout/stderr.
      'no-console': 'off',
      'no-warning-comments': ['warn', { terms: ['todo', 'fixme'], location: 'anywhere' }],
    },
    languageOptions: { globals: globals.node },
  },
);
