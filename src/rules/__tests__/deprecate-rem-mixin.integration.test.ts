import { describe, it, expect } from 'vitest'
import stylelint from 'stylelint'
import { defineConfig } from '../../index'

describe('frabbit/deprecate-rem-mixin integration', () => {
  it('should work with defineConfig when scss is enabled and legacySass is false', async () => {
    const config = defineConfig({
      scss: true,
      legacySass: false,
    })

    const result = await stylelint.lint({
      code: 'a { width: rem(15px); }',
      config: {
        ...config,
        customSyntax: 'postcss-scss',
      },
    })

    expect(result.results[0].warnings).toHaveLength(1)
    expect(result.results[0].warnings[0].rule).toBe('frabbit/deprecate-rem-mixin')
  })

  it('should not work when legacySass is true', async () => {
    const config = defineConfig({
      scss: true,
      legacySass: true,
    })

    const result = await stylelint.lint({
      code: 'a { width: rem(15px); }',
      config: {
        ...config,
        customSyntax: 'postcss-scss',
      },
    })

    // Rule should not be enabled when legacySass is true
    expect(result.results[0].warnings.length).toBeGreaterThanOrEqual(0)
    const deprecateRemWarnings = result.results[0].warnings.filter(
      (w) => w.rule === 'frabbit/deprecate-rem-mixin'
    )
    expect(deprecateRemWarnings).toHaveLength(0)
  })

  it('should autofix through defineConfig', async () => {
    const config = defineConfig({
      scss: true,
      legacySass: false,
    })

    const result = await stylelint.lint({
      code: 'a { padding: rem(16px 32px); }',
      config: {
        ...config,
        customSyntax: 'postcss-scss',
      },
      fix: true,
    })

    expect(result.output?.trim()).toBe('a { padding: 16px 32px; }')
  })

  it('should ignore CSS rem() function through defineConfig', async () => {
    const config = defineConfig({
      scss: true,
      legacySass: false,
    })

    const result = await stylelint.lint({
      code: 'a { width: rem(27, 5); }',
      config: {
        ...config,
        customSyntax: 'postcss-scss',
      },
    })

    const deprecateRemWarnings = result.results[0].warnings.filter(
      (w) => w.rule === 'frabbit/deprecate-rem-mixin'
    )
    expect(deprecateRemWarnings).toHaveLength(0)
  })
})
