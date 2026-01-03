import type { Config } from 'stylelint'
import { baseConfig } from './configs/base'
import { createScssConfig } from './configs/scss'
import { vueConfig } from './configs/vue'
import { orderConfig } from './configs/order'
import type { StylelintConfigOptions } from './types'

/**
 * Deep merge utility for stylelint configs
 */
function mergeConfigs(...configs: Config[]): Config {
  const result: Config = {}

  for (const config of configs) {
    if (!config) continue

    // Merge extends
    if (config.extends) {
      result.extends = [
        ...(result.extends || []),
        ...(Array.isArray(config.extends) ? config.extends : [config.extends]),
      ]
    }

    // Merge plugins
    if (config.plugins) {
      const currentPlugins = result.plugins
        ? (Array.isArray(result.plugins) ? result.plugins : [result.plugins])
        : []
      const newPlugins = Array.isArray(config.plugins) ? config.plugins : [config.plugins]
      result.plugins = [...currentPlugins, ...newPlugins]
    }

    // Merge rules
    if (config.rules) {
      result.rules = {
        ...result.rules,
        ...config.rules,
      }
    }

    // Merge overrides
    if (config.overrides) {
      result.overrides = [
        ...(result.overrides || []),
        ...config.overrides,
      ]
    }

    // Merge ignoreFiles
    if (config.ignoreFiles) {
      result.ignoreFiles = [
        ...(result.ignoreFiles || []),
        ...(Array.isArray(config.ignoreFiles) ? config.ignoreFiles : [config.ignoreFiles]),
      ]
    }

    // Merge other properties
    if (config.customSyntax) {
      result.customSyntax = config.customSyntax
    }
  }

  return result
}

/**
 * Define Stylelint configuration with TypeScript support
 *
 * @example
 * ```ts
 * import { defineConfig } from '@frabbit/stylelint-config'
 *
 * export default defineConfig({
 *   vue: true,
 *   scss: true,
 *   order: true,
 *   customPropertiesFiles: ['./src/styles/variables.css'],
 * })
 * ```
 */
export function defineConfig(options: StylelintConfigOptions = {}): Config {
  const {
    vue = true,
    scss = true,
    order = true,
    customPropertiesFiles = [],
    rules = {},
    ignoreFiles,
    overrides = [],
    legacySass = false,
  } = options

  const configs: Config[] = [baseConfig]

  // Add SCSS config
  if (scss) {
    configs.push(createScssConfig({ legacySass }))
  }

  // Add Vue config
  if (vue) {
    configs.push(vueConfig)
  }

  // Add order config
  if (order) {
    configs.push(orderConfig)
  }

  // Merge all configs
  let config = mergeConfigs(...configs)

  // Add custom properties rule if files are provided
  if (customPropertiesFiles.length > 0) {
    // Add plugin if not already present
    const pluginName = 'stylelint-value-no-unknown-custom-properties'
    const currentPlugins = Array.isArray(config.plugins) ? config.plugins : config.plugins ? [config.plugins] : []
    
    if (!currentPlugins.includes(pluginName)) {
      config.plugins = [...currentPlugins, pluginName]
    }

    config.rules = {
      ...config.rules,
      'csstools/value-no-unknown-custom-properties': [
        true,
        {
          importFrom: customPropertiesFiles,
        },
      ],
    }
  }

  // Merge user rules
  if (Object.keys(rules).length > 0) {
    config.rules = {
      ...config.rules,
      ...rules,
    }
  }

  // Merge user ignoreFiles
  if (ignoreFiles) {
    config.ignoreFiles = [
      ...(config.ignoreFiles || []),
      ...(Array.isArray(ignoreFiles) ? ignoreFiles : [ignoreFiles]),
    ]
  }

  // Merge user overrides
  if (overrides.length > 0) {
    config.overrides = [
      ...(config.overrides || []),
      ...overrides,
    ]
  }

  return config
}

export type { StylelintConfigOptions } from './types'
