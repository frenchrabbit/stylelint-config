import type { Rule as PostcssRule, AtRule as PostcssAtRule, Declaration as PostcssDeclaration } from 'postcss'
import postcssScss from 'postcss-scss'
import { readFileSync } from 'fs'
import { dirname } from 'path'
import type { AtomicClass } from './types'
import { VariableResolver } from './variable-resolver'

/**
 * Parse SCSS file and extract atomic classes (starting with ._)
 */
export class ScssParser {
  private variableResolver: VariableResolver

  constructor(variableResolver: VariableResolver) {
    this.variableResolver = variableResolver
  }

  /**
   * Parse SCSS file and extract atomic classes
   */
  parseAtomicClasses(filePath: string): AtomicClass[] {
    const content = readFileSync(filePath, 'utf-8')
    const root = postcssScss.parse(content)
    // Use dirname of filePath as base for variable resolution
    const fileDir = dirname(filePath)
    const variables = this.variableResolver.resolveVariables(filePath, fileDir)

    const atomicClasses: AtomicClass[] = []

    root.walkRules((rule) => {
      // Check if selector is an atomic class (starts with ._)
      const selectors = rule.selectors || []
      const atomicSelector = selectors.find((sel) => sel.trim().startsWith('._'))

      if (atomicSelector) {
        const className = this.extractClassName(atomicSelector)
        if (className) {
          const atomicClass = this.extractAtomicClass(rule, className, variables)
          if (atomicClass) {
            atomicClasses.push(atomicClass)
          }
        }
      }
    })

    return atomicClasses
  }

  /**
   * Extract class name from selector
   */
  private extractClassName(selector: string): string | null {
    // Match ._class-name or ._class-name::before etc.
    const match = selector.match(/^\.(_[a-zA-Z0-9_-]+)/)
    return match ? match[1] : null
  }

  /**
   * Extract atomic class properties from a rule node
   */
  private extractAtomicClass(
    rule: PostcssRule,
    className: string,
    variables: Map<string, string>
  ): AtomicClass | null {
    const properties = new Map<string, string>()
    const mixins = new Map<string, Map<string, string>>()

    // Extract base properties
    rule.walkDecls((decl: PostcssDeclaration) => {
      const prop = decl.prop
      const value = this.variableResolver.replaceVariables(decl.value, variables)
      properties.set(prop, value)
    })

    // Extract properties from @include blocks
    // In postcss-scss, @include is parsed as an at-rule
    rule.walkAtRules((atRule: PostcssAtRule) => {
      // Check for @include or @mixin
      if (atRule.name === 'include' || atRule.name === 'mixin') {
        const mixinName = this.extractMixinName(atRule)
        if (mixinName) {
          const mixinProperties = new Map<string, string>()

          // Walk declarations inside the mixin block
          atRule.walkDecls((decl: PostcssDeclaration) => {
            const prop = decl.prop
            const value = this.variableResolver.replaceVariables(decl.value, variables)
            mixinProperties.set(prop, value)
          })

          // Also check nested rules (for nested @include or media queries)
          atRule.walkRules((nestedRule: PostcssRule) => {
            nestedRule.walkDecls((decl: PostcssDeclaration) => {
              const prop = decl.prop
              const value = this.variableResolver.replaceVariables(decl.value, variables)
              mixinProperties.set(prop, value)
            })
          })

          if (mixinProperties.size > 0) {
            mixins.set(mixinName, mixinProperties)
          }
        }
      }
    })

    // Only return if there are properties
    if (properties.size > 0 || mixins.size > 0) {
      return {
        name: className,
        properties,
        mixins,
      }
    }

    return null
  }

  /**
   * Extract mixin name with parameters from @include directive
   */
  private extractMixinName(atRule: PostcssAtRule): string {
    // Get full mixin signature: mixin-name(params)
    const params = atRule.params || ''
    const mixinName = atRule.name === 'include' ? params : `${atRule.name}(${params})`
    return mixinName.trim()
  }
}
