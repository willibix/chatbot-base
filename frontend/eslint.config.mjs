// ESLint flat config with Airbnb extended rules for TypeScript + React
import eslint from '@eslint/js';
import airbnbExtended from 'eslint-config-airbnb-extended';
import prettier from 'eslint-config-prettier';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  ...airbnbExtended,
  prettier,
  {
    languageOptions: {
      ecmaVersion: 2022,
      globals: {
        ...globals.browser,
        ...globals.es2022,
      },
      parserOptions: {
        project: ['./tsconfig.json', './tsconfig.node.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    settings: {
      react: {
        version: 'detect',
      },
      'import/resolver': {
        typescript: {
          project: './tsconfig.json',
        },
      },
    },
    rules: {
      // TypeScript specific adjustments
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/no-misused-promises': [
        'error',
        { checksVoidReturn: { attributes: false } },
      ],

      // React specific
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react/require-default-props': 'off',
      'react/jsx-props-no-spreading': 'off',

      // Import rules
      'import/prefer-default-export': 'off',
      'import/no-default-export': 'off',

      // General adjustments
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-void': ['error', { allowAsStatement: true }],
    },
  },
  {
    files: ['vite.config.ts', 'eslint.config.mjs'],
    languageOptions: {
      parserOptions: {
        project: './tsconfig.node.json',
      },
    },
  },
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'src-tauri/**',
      '*.config.js',
      '*.config.cjs',
    ],
  },
);
