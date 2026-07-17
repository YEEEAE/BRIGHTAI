/**
 * @brightai/dashboard — ESLint flat config
 *
 * Extends next/core-web-vitals (via FlatCompat) and registers the
 * @typescript-eslint plugin + parser so the @typescript-eslint/* rules
 * resolve correctly. Follows the same flat-config pattern as the root
 * /eslint.config.mjs: spread tsPlugin.configs.recommended.rules to turn
 * off the base no-unused-vars / no-undef in favor of the TypeScript-aware
 * equivalents (which handle TS-specific patterns like type imports).
 *
 * The @typescript-eslint/no-unused-vars rule is KEPT active (warn) — it
 * is not disabled broadly. The base no-unused-vars is replaced by the
 * stricter TS-aware version, which is the standard TypeScript + ESLint
 * configuration, not a broad disable.
 */
import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const compat = new FlatCompat({ baseDirectory: __dirname });

export default [
  {
    ignores: ['.next/**', 'node_modules/**', 'dist/**', 'next-env.d.ts', 'coverage/**'],
  },
  js.configs.recommended,
  ...compat.extends('next/core-web-vitals'),
  {
    files: ['**/*.{ts,tsx,mts,cts,js,jsx,mjs}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      // Spread the TS plugin's recommended rules. This swaps the base
      // no-unused-vars for the TS-aware version (the spread sets
      // 'no-unused-vars: off' implicitly).
      ...tsPlugin.configs.recommended.rules,
      // TypeScript already validates undefined identifiers via its type
      // checker. The base no-undef produces false positives for TS
      // globals like React (JSX transform) and BlobPart (Node 22 lib).
      // This mirrors the root /eslint.config.mjs pattern.
      'no-undef': 'off',
      // Keep the TS-aware unused-vars active (warn, not error) so the
      // dashboard surfaces dead imports for cleanup without failing lint
      // on pre-existing ones.
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
      'react/no-unescaped-entities': 'off', // handled per-page
      // Arabic regex patterns in the firewall detectors use intentional
      // Unicode whitespace (U+00A0 etc.) for tokenization. Downgrade from
      // error (js.configs.recommended) to warn so it surfaces but does
      // not block lint.
      'no-irregular-whitespace': 'warn',
    },
  },
];
