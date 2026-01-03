import { describe, it, expect } from 'vitest'
import stylelint from 'stylelint'
import preferModernImport from '../prefer-modern-import'

describe('frabbit/prefer-modern-import', () => {
  const ruleName = 'frabbit/prefer-modern-import'

  async function lint(code: string, syntax?: string): Promise<stylelint.LinterResult> {
    return stylelint.lint({
      code,
      config: {
        plugins: [preferModernImport],
        rules: {
          [ruleName]: true,
        },
        customSyntax: syntax,
      },
    })
  }

  describe('should detect and report @import', () => {
    it('should report @import in file with rules', async () => {
      const result = await lint(
        `@import 'variables';
a { color: red; }`,
        'postcss-scss'
      )
      expect(result.results[0].warnings).toHaveLength(1)
      expect(result.results[0].warnings[0].rule).toBe(ruleName)
      expect(result.results[0].warnings[0].text).toContain('@use')
    })

    it('should report @import in file without rules', async () => {
      const result = await lint(
        `@import 'variables';
@import 'mixins';`,
        'postcss-scss'
      )
      expect(result.results[0].warnings).toHaveLength(2)
      expect(result.results[0].warnings[0].text).toContain('@forward')
    })
  })

  describe('autofix', () => {
    it('should fix @import to @use when file has rules', async () => {
      const fixed = await stylelint.lint({
        code: `@import 'variables';
a { color: red; }`,
        config: {
          plugins: [preferModernImport],
          rules: {
            [ruleName]: true,
          },
          customSyntax: 'postcss-scss',
          fix: true,
        },
      })

      expect(fixed.output?.trim()).toContain("@use 'variables' as *")
      expect(fixed.output?.trim()).toContain('a { color: red; }')
    })

    it('should fix @import to @forward when file has no rules', async () => {
      const fixed = await stylelint.lint({
        code: `@import 'variables';
@import 'mixins';`,
        config: {
          plugins: [preferModernImport],
          rules: {
            [ruleName]: true,
          },
          customSyntax: 'postcss-scss',
          fix: true,
        },
      })

      expect(fixed.output?.trim()).toContain("@forward 'variables'")
      expect(fixed.output?.trim()).toContain("@forward 'mixins'")
    })
  })
})
