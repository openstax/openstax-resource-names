/* spell-checker: ignore tseslint */
import js from '@eslint/js';
import importPlugin from 'eslint-plugin-import-x';
import jest from 'eslint-plugin-jest';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['node_modules', 'dist', 'build', 'coverage'] },
  js.configs.recommended,
  {
    plugins: {
      'import-x': importPlugin,
    },
    languageOptions: {
      globals: globals.node,
    },
    rules: {
      quotes: ['warn', 'single'],
      'quote-props': ['warn', 'as-needed'],
      'import-x/order': [
        'warn',
        { 'newlines-between': 'never', alphabetize: { order: 'asc' } },
      ],
      'sort-imports': [
        'warn',
        { ignoreDeclarationSort: true, ignoreCase: true },
      ],
    },
  },
  {
    files: ['**/*.ts?(x)'],
    extends: [
      ...tseslint.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-inferrable-types': [
        'warn',
        { ignoreParameters: true },
      ],
      semi: ['warn'],
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          args: 'none',
          caughtErrors: 'none',
          ignoreRestSiblings: true,
          varsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-unsafe-function-type': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
    },
  },
  {
    files: ['**/*.test.ts', '**/*.spec.ts'],
    ...jest.configs['flat/recommended'],
    ...jest.configs['flat/style'],
  },
);
