import js from '@eslint/js';
import next from '@next/eslint-plugin-next';
import perfectionistNatural from 'eslint-plugin-perfectionist/configs/recommended-natural';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import tsEslint from 'typescript-eslint';

export default tsEslint.config(
  js.configs.recommended,
  perfectionistNatural,
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
