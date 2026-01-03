import type { Config } from 'stylelint'

/**
 * Base configuration with common settings
 */
export const baseConfig: Config = {
  ignoreFiles: [
    '**/*.min.css',
    '**/dist/**',
    '**/node_modules/**',
    '**/.git/**',
    '**/.next/**',
    '**/.nuxt/**',
    '**/.output/**',
    '**/.vite/**',
  ],
  rules: {
    'selector-class-pattern': [
      '^[-_]?[a-z][a-z0-9-]*$',
      {
        message: 'Class selector must be kebab-case, optionally prefixed with "-" (modifier) or "_" (atomic)',
      },
    ],
  },
}
