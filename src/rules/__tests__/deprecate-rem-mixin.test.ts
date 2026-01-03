import { describe, it, expect } from 'vitest'
import stylelint from 'stylelint'
import deprecateRemMixin from '../deprecate-rem-mixin'
import type { Config } from 'stylelint'

describe('frabbit/deprecate-rem-mixin', () => {
  const ruleName = 'frabbit/deprecate-rem-mixin'

  async function lint(code: string, syntax?: string): Promise<stylelint.LinterResult> {
    const config: Config = {
      plugins: [deprecateRemMixin],
      rules: {
        [ruleName]: true,
      },
      customSyntax: syntax,
    }

    return stylelint.lint({
      code,
      config,
    })
  }

  describe('should detect and report SCSS rem() function', () => {
    it('should report rem(15px)', async () => {
      const result = await lint('a { width: rem(15px); }', 'postcss-scss')
      expect(result.results[0].warnings).toHaveLength(1)
      expect(result.results[0].warnings[0].rule).toBe(ruleName)
      expect(result.results[0].warnings[0].text).toContain('Deprecated SCSS rem() function')
    })

    it('should report rem(20px 10px)', async () => {
      const result = await lint('a { padding: rem(20px 10px); }', 'postcss-scss')
      expect(result.results[0].warnings).toHaveLength(1)
    })

    it('should report rem(16px 32px)', async () => {
      const result = await lint('a { padding: rem(16px 32px); }', 'postcss-scss')
      expect(result.results[0].warnings).toHaveLength(1)
    })

    it('should report multiple rem() calls in one declaration', async () => {
      const result = await lint('a { margin: 0 rem(20px) 0 rem(10px); }', 'postcss-scss')
      expect(result.results[0].warnings).toHaveLength(1)
    })

    it('should report rem() with different units', async () => {
      const result = await lint('a { font-size: rem(14px); }', 'postcss-scss')
      expect(result.results[0].warnings).toHaveLength(1)
    })
  })

  describe('should ignore CSS rem() function', () => {
    it('should not report rem(27, 5) - CSS remainder function', async () => {
      const result = await lint('a { width: rem(27, 5); }', 'postcss-scss')
      expect(result.results[0].warnings).toHaveLength(0)
    })

    it('should not report rem(14%, 3%) - CSS remainder function', async () => {
      const result = await lint('a { margin: rem(14%, 3%); }', 'postcss-scss')
      expect(result.results[0].warnings).toHaveLength(0)
    })

    it('should not report rem(18px, 5px) - CSS remainder function', async () => {
      const result = await lint('a { padding: rem(18px, 5px); }', 'postcss-scss')
      expect(result.results[0].warnings).toHaveLength(0)
    })
  })

  describe('autofix', () => {
    it('should fix rem(15px) to 15px', async () => {
      const fixed = await stylelint.lint({
        code: 'a { width: rem(15px); }',
        config: {
          plugins: [deprecateRemMixin],
          rules: {
            [ruleName]: true,
          },
          customSyntax: 'postcss-scss',
          fix: true,
        },
      })
      
      expect(fixed.output?.trim()).toBe('a { width: 15px; }')
    })

    it('should fix rem(20px 10px) to 20px 10px', async () => {
      const fixed = await stylelint.lint({
        code: 'a { padding: rem(20px 10px); }',
        config: {
          plugins: [deprecateRemMixin],
          rules: {
            [ruleName]: true,
          },
          customSyntax: 'postcss-scss',
          fix: true,
        },
      })
      
      expect(fixed.output?.trim()).toBe('a { padding: 20px 10px; }')
    })

    it('should fix rem(16px 32px) to 16px 32px', async () => {
      const fixed = await stylelint.lint({
        code: 'a { padding: rem(16px 32px); }',
        config: {
          plugins: [deprecateRemMixin],
          rules: {
            [ruleName]: true,
          },
          customSyntax: 'postcss-scss',
          fix: true,
        },
      })
      
      expect(fixed.output?.trim()).toBe('a { padding: 16px 32px; }')
    })

    it('should fix multiple rem() calls in one declaration', async () => {
      const fixed = await stylelint.lint({
        code: 'a { margin: 0 rem(20px) 0 rem(10px); }',
        config: {
          plugins: [deprecateRemMixin],
          rules: {
            [ruleName]: true,
          },
          customSyntax: 'postcss-scss',
          fix: true,
        },
      })
      
      expect(fixed.output?.trim()).toBe('a { margin: 0 20px 0 10px; }')
    })

    it('should fix rem() with whitespace', async () => {
      const fixed = await stylelint.lint({
        code: 'a { width: rem( 100px ); }',
        config: {
          plugins: [deprecateRemMixin],
          rules: {
            [ruleName]: true,
          },
          customSyntax: 'postcss-scss',
          fix: true,
        },
      })
      
      expect(fixed.output?.trim()).toBe('a { width: 100px; }')
    })
  })

  describe('edge cases', () => {
    it('should handle rem() in calc()', async () => {
      const result = await lint('a { width: calc(100% - rem(20px)); }', 'postcss-scss')
      expect(result.results[0].warnings).toHaveLength(1)
      
      const fixed = await stylelint.lint({
        code: 'a { width: calc(100% - rem(20px)); }',
        config: {
          plugins: [deprecateRemMixin],
          rules: {
            [ruleName]: true,
          },
          customSyntax: 'postcss-scss',
          fix: true,
        },
      })
      
      expect(fixed.output?.trim()).toBe('a { width: calc(100% - 20px); }')
    })

    it('should handle multiple declarations', async () => {
      const result = await lint(
        `a {
          width: rem(100px);
          height: rem(50px);
        }`,
        'postcss-scss'
      )
      expect(result.results[0].warnings).toHaveLength(2)
    })

    it('should not report when rule is disabled', async () => {
      const result = await stylelint.lint({
        code: 'a { width: rem(15px); }',
        config: {
          plugins: [deprecateRemMixin],
          rules: {
            [ruleName]: false,
          },
          customSyntax: 'postcss-scss',
        },
      })
      
      expect(result.results[0].warnings).toHaveLength(0)
    })
  })
})
