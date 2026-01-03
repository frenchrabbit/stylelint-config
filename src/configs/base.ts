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
}
