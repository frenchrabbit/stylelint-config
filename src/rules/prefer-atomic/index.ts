import stylelint from 'stylelint'
import type { Rule } from 'stylelint'
import { dirname } from 'path'
import { AtomicClassCache } from './cache'
import { AtomicMatcher } from './matcher'
import type { PreferAtomicOptions } from './types'

const { createPlugin, utils } = stylelint
const { report, ruleMessages, validateOptions } = utils

const ruleName = 'frabbit/prefer-atomic'

const messages = ruleMessages(ruleName, {
  fullMatch: (className: string, mixinInfo: string) => {
    const base = `Use atomic class ".${className}" instead of declaring these properties separately.`
    return mixinInfo
      ? `${base} Note: .${className} has ${mixinInfo}, verify responsiveness matches your design.`
      : base
  },
  fullMatchNoMixin: (className: string) =>
    `Use atomic class ".${className}" instead of declaring these properties separately.`,
  partialMatch: (
    className: string,
    matchedProps: string,
    differingProps: string,
    atomicValues: string
  ) =>
    `Properties ${matchedProps} partially match atomic class ".${className}". ` +
    `Consider using .${className} and override only ${differingProps} if deviation is intentional. ` +
    `Atomic values: ${atomicValues}`,
})

const meta = {
  url: 'https://github.com/frabbit/stylelint-config',
  fixable: false,
}

/**
 * Rule that enforces use of atomic classes (starting with ._)
 * Detects when CSS properties match existing atomic classes and suggests using them instead
 */
const ruleFunction: Rule = (primary, secondary) => {
  return (root, result) => {
    // Validate options
    const validOptions = validateOptions(
      result,
      ruleName,
      {
        actual: primary,
        possible: [true, 'warn', 'warning', 'error'],
      },
      {
        actual: secondary,
        possible: (options: unknown): options is PreferAtomicOptions => {
          if (!options || typeof options !== 'object') {
            return false
          }
          const opts = options as Record<string, unknown>
          if (!Array.isArray(opts.atomicFiles)) {
            return false
          }
          return opts.atomicFiles.every((file: unknown) => typeof file === 'string')
        },
      }
    )

    if (!validOptions) {
      return
    }

    // Skip if rule is disabled
    if (primary === false) {
      return
    }

    // Get options
    const options = (secondary || {}) as PreferAtomicOptions
    const atomicFiles = options.atomicFiles || []

    if (atomicFiles.length === 0) {
      return
    }

    // Get cache and matcher
    const cache = AtomicClassCache.getInstance()
    const matcher = new AtomicMatcher()

    // Resolve base directory from result
    const baseDir = result.root?.source?.input?.from
      ? dirname(result.root.source.input.from)
      : process.cwd()

    // Load atomic classes
    const atomicClasses = cache.getAllAtomicClasses(atomicFiles, baseDir)

    if (atomicClasses.length === 0) {
      return
    }

    // Walk through all rules (selectors)
    root.walkRules((rule) => {
      // Skip atomic classes themselves
      const selectors = rule.selectors || []
      const isAtomicClass = selectors.some((sel) => sel.trim().startsWith('._'))
      if (isAtomicClass) {
        return
      }

      // Collect properties from this rule
      const properties = new Map<string, string>()
      rule.walkDecls((decl) => {
        properties.set(decl.prop, decl.value)
      })

      if (properties.size === 0) {
        return
      }

      // Find matches
      const matches = matcher.findMatches(properties, atomicClasses)

      for (const match of matches) {
        const { atomicClass, matchType, matchedProperties, differingProperties } = match

        if (matchType === 'full') {
          // Full match - suggest using atomic class
          if (matcher.hasResponsiveMixins(atomicClass)) {
            const mixinInfo = matcher.formatMixins(atomicClass)
            report({
              result,
              ruleName,
              message: messages.fullMatch(atomicClass.name, mixinInfo),
              node: rule,
            })
          } else {
            report({
              result,
              ruleName,
              message: messages.fullMatchNoMixin(atomicClass.name),
              node: rule,
            })
          }
        } else if (matchType === 'partial') {
          // Partial match - suggest using atomic class with override
          const matchedPropsStr = matchedProperties
            .map((prop) => `${prop}: ${properties.get(prop)}`)
            .join(', ')

          const differingPropsStr =
            differingProperties.length > 0
              ? differingProperties.join(', ')
              : 'the differing properties'

          const atomicValues: string[] = []
          for (const [prop, value] of atomicClass.properties.entries()) {
            atomicValues.push(`${prop}: ${value}`)
          }
          const atomicValuesStr = atomicValues.join(', ')

          report({
            result,
            ruleName,
            message: messages.partialMatch(
              atomicClass.name,
              matchedPropsStr,
              differingPropsStr,
              atomicValuesStr
            ),
            node: rule,
          })
        }
      }
    })
  }
}

ruleFunction.ruleName = ruleName
ruleFunction.messages = messages
ruleFunction.meta = meta

export default createPlugin(ruleName, ruleFunction)
