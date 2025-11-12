import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['warn', { 
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_|^error$'
      }],
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-case-declarations': 'warn',
    },
  },
  {
    ignores: ['dist/', 'node_modules/', '*.config.ts', '*.config.js', '**/*.test.ts'],
  }
);
