import js from '@eslint/js';
import next from '@next/eslint-plugin-next';
import perfectionist from 'eslint-plugin-perfectionist';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import tsEslint from 'typescript-eslint';

export default tsEslint.config(
  js.configs.recommended,
  perfectionist.configs['recommended-natural'],
  eslintPluginPrettierRecommended,
  ...tsEslint.configs.recommended,
  {
    files: ['./**/*.ts', './**/*.tsx'],
    plugins: {
      '@next/next': next,
    },
    rules: {
      'no-unused-vars': 'warn',
      ...next.configs.recommended.rules,
    },
  }
);
