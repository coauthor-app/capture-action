import js from '@eslint/js';
import eslintConfigPrettier from "eslint-config-prettier";
import globals from "globals";

export default [
  js.configs.recommended,
  eslintConfigPrettier,
  {
    ignores: ['node_modules/*', 'dist/*'],
  },
  {
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.node,
        ...globals.es2020
      }
    }
  },
  {
    rules: {
      'no-unused-vars': 'warn',
      'no-undef': 'warn'
    }
  },
];
