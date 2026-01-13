import type { Config } from 'stylelint'
import plugin from '../rules'

/**
 * SCSS configuration
 */
export function createScssConfig(options: { legacySass?: boolean } = {}): Config {
  const { legacySass = false } = options

  const config: Config = {
    extends: ['stylelint-config-standard-scss'],
    plugins: plugin,
    overrides: [
      {
        files: ['*.scss', '**/*.scss'],
        customSyntax: 'postcss-scss',
      },
    ],
    rules: {
      // Allow SCSS-specific at-rules
      'at-rule-no-unknown': null,
      'scss/at-rule-no-unknown': true,
      // Ignore rem() function - we have our own rule for it
      'scss/function-no-unknown': [
        true,
        { ignoreFunctions: ['rem'] },
      ],
      // Use SCSS-specific rule that natively understands SCSS syntax
      'declaration-property-value-no-unknown': null,
      'scss/declaration-property-value-no-unknown': true,
    },
  }

  // Add rules for modern Sass syntax when legacySass is false
  if (!legacySass) {
    config.rules = {
      ...config.rules,
      'frabbit/prefer-modern-import': true,
      'frabbit/deprecate-rem-mixin': 'warn',
    }
  }

  return config
}
