module.exports = {
  root: true,
  env: { node: true, es6: true },
  parserOptions: {
    ecmaVersion: 2018
  },
  overrides: [
    {
      files: ['**/*.ts?(x)'],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        project: 'tsconfig.json',
        tsconfigRootDir: __dirname,
        ecmaVersion: 2018,
        sourceType: 'module',
        warnOnUnsupportedTypeScriptVersion: true
      },
      plugins: ['@typescript-eslint'],
      extends: [
        'eslint:recommended',
        'plugin:import/typescript'
      ],
      rules: {
        '@typescript-eslint/ban-ts-comment': 'off',
        '@typescript-eslint/no-inferrable-types': [
          'warn',
          { ignoreParameters: true }
        ],
        semi: 'off',
        '@typescript-eslint/semi': ['warn'],
        '@typescript-eslint/member-delimiter-style': ['warn'],
        'no-unused-vars': 'off',
        '@typescript-eslint/no-unused-vars': [
          'warn',
          {
            args: 'none',
            ignoreRestSiblings: true
          }
        ],
        '@typescript-eslint/no-explicit-any': 'off'
      }
    }
  ],
  ignorePatterns: ['node_modules', 'dist', 'coverage'],
  plugins: ['import', 'jest'],
  extends: [
    'eslint:recommended',
    'plugin:jest/recommended',
    'plugin:jest/style'
  ],
  rules: {
    quotes: ['warn', 'single'],
    'quote-props': ['warn', 'as-needed'],
    'import/order': [
      'warn',
      { 'newlines-between': 'never', alphabetize: { order: 'asc' } }
    ],
    'sort-imports': [
      'warn',
      { ignoreDeclarationSort: true, ignoreCase: true }
    ]
  }
}
