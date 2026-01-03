import type { Config } from 'stylelint'

/**
 * SCSS configuration
 */
export const scssConfig: Config = {
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
