import stylelint from 'stylelint'
import type { Rule } from 'stylelint'

const { createPlugin, utils } = stylelint
const { report, ruleMessages, validateOptions } = utils

const ruleName = 'frabbit/deprecate-rem-mixin'

const messages = ruleMessages(ruleName, {
  expected: (replacement: string) =>
    `Deprecated SCSS rem() function detected. Use direct pixel values: "${replacement}"`,
})

const meta = {
  url: 'https://github.com/frabbit/stylelint-config',
  fixable: true,
}

/**
 * Rule that replaces deprecated SCSS rem() function with direct pixel values
 * 
 * Transforms:
 * - rem(15px) → 15px
 * - rem(20px 10px) → 20px 10px
 * - padding: rem(16px 32px) → padding: 16px 32px
 * 
 * Ignores CSS rem() function (two comma-separated arguments):
 * - rem(27, 5) - CSS remainder function, not touched
 * - rem(14%, 3%) - CSS remainder function, not touched
 */
const ruleFunction: Rule = (primary) => {
  return (root, result) => {
    if (!validateOptions(result, ruleName, { actual: primary, possible: [true] })) {
      return
    }

    // Regex to match SCSS rem() function (no comma inside = not CSS rem())
    // Matches: rem(15px), rem(20px 10px), rem(100px)
    // Ignores: rem(27, 5) - CSS rem() has comma
    const scssRemRegex = /rem\(([^,)]+)\)/g

    root.walkDecls((decl) => {
      const value = decl.value
      
      // Replace all SCSS rem() calls with their content
      const fixedValue = value.replace(scssRemRegex, (match, content) => {
        return content.trim()
      })

      // Check if any replacements were made
      if (fixedValue !== value) {
        report({
          result,
          ruleName,
          message: messages.expected(fixedValue),
          node: decl,
          fix: () => {
            decl.value = fixedValue
          },
        })
      }
    })
  }
}

ruleFunction.ruleName = ruleName
ruleFunction.messages = messages
ruleFunction.meta = meta

export default createPlugin(ruleName, ruleFunction)
