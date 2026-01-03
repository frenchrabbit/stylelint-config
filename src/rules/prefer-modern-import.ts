import stylelint from 'stylelint'
import type { Rule } from 'stylelint'

const { createPlugin, utils } = stylelint
const { report, ruleMessages, validateOptions } = utils

const ruleName = 'frabbit/prefer-modern-import'

const messages = ruleMessages(ruleName, {
  expected: (replacement: string) =>
    `Expected @use or @forward instead of @import. Use "${replacement}"`,
})

const meta = {
  url: 'https://github.com/frabbit/stylelint-config',
  fixable: true,
}

/**
 * Rule that replaces @import with @use or @forward based on file content
 * - @use 'path' as * - if file contains CSS rules (uses imports)
 * - @forward 'path' - if file only contains imports (re-exports)
 */
const ruleFunction: Rule = (primary) => {
  return (root, result) => {
    if (!validateOptions(result, ruleName, { actual: primary, possible: [true] })) {
      return
    }

    // Определяем тип файла: есть ли rule nodes (селекторы с CSS)
    let hasRules = false
    root.walkRules(() => {
      hasRules = true
    })

    root.walkAtRules('import', (atRule) => {
      const params = atRule.params.trim()

      report({
        result,
        ruleName,
        message: messages.expected(hasRules ? '@use ... as *' : '@forward'),
        node: atRule,
        fix: () => {
          if (hasRules) {
            // @import 'path' -> @use 'path' as *
            atRule.name = 'use'
            atRule.params = `${params} as *`
          } else {
            // @import 'path' -> @forward 'path'
            atRule.name = 'forward'
            atRule.params = params
          }
        },
      })
    })
  }
}

ruleFunction.ruleName = ruleName
ruleFunction.messages = messages
ruleFunction.meta = meta

export default createPlugin(ruleName, ruleFunction)
