import type { Config } from 'stylelint'

/**
 * Options for Stylelint configuration
 */
export interface StylelintConfigOptions {
  /**
   * Enable Vue SFC support
   * @default true
   */
  vue?: boolean

  /**
   * Enable SCSS support
   * @default true
   */
  scss?: boolean

  /**
   * Enable CSS property ordering
   * @default true
   */
  order?: boolean

  /**
   * Paths to files containing CSS custom properties
   * Used for `no-unknown-custom-properties` rule with `importFrom` option
   * @default []
   */
  customPropertiesFiles?: string[]

  /**
   * Additional rules to override or extend
   */
  rules?: Config['rules']

  /**
   * Files to ignore
   */
  ignoreFiles?: Config['ignoreFiles']

  /**
   * Additional overrides
   */
  overrides?: Config['overrides']
}
