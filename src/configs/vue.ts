import type { Config } from 'stylelint'

/**
 * Vue SFC configuration
 */
export const vueConfig: Config = {
  extends: ['stylelint-config-recommended-vue'],
  overrides: [
    {
      files: ['*.vue', '**/*.vue'],
      customSyntax: 'postcss-html',
    },
  ],
}
