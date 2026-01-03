import type { Config } from 'stylelint'
import plugin from '../rules'

/**
 * SCSS configuration
 */
export function createScssConfig(options: { legacySass?: boolean } = {}): Config {
  const { legacySass = false } = options

  const config: Config = {
    extends: ['stylelint-config-standard-scss'],
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
    },
  }

  // Add plugin and rule for modern Sass syntax when legacySass is false
  if (!legacySass) {
    config.plugins = plugin
    config.rules = {
      ...config.rules,
      'frabbit/prefer-modern-import': true,
      'frabbit/deprecate-rem-mixin': 'warn',
    }
  }

  return config
}
