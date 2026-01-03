import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { writeFileSync, unlinkSync, mkdirSync, existsSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import stylelint from 'stylelint'
import preferAtomic from '../prefer-atomic'
import type { Config } from 'stylelint'
import { AtomicClassCache } from '../prefer-atomic/cache'

describe('frabbit/prefer-atomic', () => {
  const ruleName = 'frabbit/prefer-atomic'
  const testDir = join(tmpdir(), 'stylelint-prefer-atomic-test')
  let atomicFile: string

  beforeEach(() => {
    // Create test directory
    if (!existsSync(testDir)) {
      mkdirSync(testDir, { recursive: true })
    }

    // Create atomic classes file (example with typography classes)
    atomicFile = join(testDir, 'typography.scss')
    writeFileSync(
      atomicFile,
      `
$fw-regular: 400;

._txt-m {
  font-size: 15px;
  line-height: 1.44;
  font-weight: $fw-regular;
  letter-spacing: normal;
  text-transform: none;
  font-variant-numeric: lining-nums tabular-nums;

  @include from-br(md) {
    font-size: 16px;
  }
}

._txt-sm {
  font-size: 14px;
  line-height: 1.5;
  font-weight: $fw-regular;
}
`,
      'utf-8'
    )

    // Clear cache before each test
    AtomicClassCache.getInstance().clearCache()
  })

  afterEach(() => {
    // Cleanup
    if (existsSync(atomicFile)) {
      unlinkSync(atomicFile)
    }
  })

  async function lint(
    code: string,
    options: { atomicFiles: string[] },
    syntax?: string
  ): Promise<stylelint.LinterResult> {
    const config: Config = {
      plugins: [preferAtomic],
      rules: {
        [ruleName]: [true, options],
      },
      customSyntax: syntax,
    }

    return stylelint.lint({
      code,
      config,
    })
  }

  describe('full match detection', () => {
    it('should report full match with atomic class', async () => {
      const result = await lint(
        '.foobar { font-size: 15px; line-height: 1.44; font-weight: 400; }',
        { atomicFiles: [atomicFile] },
        'postcss-scss'
      )

      expect(result.results[0].warnings).toHaveLength(1)
      expect(result.results[0].warnings[0].rule).toBe(ruleName)
      expect(result.results[0].warnings[0].text).toContain('Use atomic class "._txt-m"')
    })

    it('should report full match with responsive mixin info', async () => {
      const result = await lint(
        '.foobar { font-size: 15px; line-height: 1.44; font-weight: 400; }',
        { atomicFiles: [atomicFile] },
        'postcss-scss'
      )

      expect(result.results[0].warnings).toHaveLength(1)
      expect(result.results[0].warnings[0].text).toContain('@include from-br(md)')
    })

    it('should not report atomic classes themselves', async () => {
      const result = await lint(
        '._txt-m { font-size: 15px; line-height: 1.44; }',
        { atomicFiles: [atomicFile] },
        'postcss-scss'
      )

      expect(result.results[0].warnings).toHaveLength(0)
    })
  })

  describe('partial match detection', () => {
    it('should report partial match (2 of 3 properties)', async () => {
      const result = await lint(
        '.foobar { font-size: 15px; line-height: 1.45; }',
        { atomicFiles: [atomicFile] },
        'postcss-scss'
      )

      expect(result.results[0].warnings).toHaveLength(1)
      expect(result.results[0].warnings[0].text).toContain('partially match')
      expect(result.results[0].warnings[0].text).toContain('._txt-m')
      expect(result.results[0].warnings[0].text).toContain('override only')
    })

    it('should report partial match with different line-height', async () => {
      const result = await lint(
        '.foobar { font-size: 15px; line-height: 1.5; font-weight: 400; }',
        { atomicFiles: [atomicFile] },
        'postcss-scss'
      )

      expect(result.results[0].warnings).toHaveLength(1)
      expect(result.results[0].warnings[0].text).toContain('line-height')
    })
  })

  describe('variable resolution', () => {
    it('should resolve SCSS variables', async () => {
      const result = await lint(
        '.foobar { font-size: 15px; line-height: 1.44; font-weight: 400; }',
        { atomicFiles: [atomicFile] },
        'postcss-scss'
      )

      // Should match because $fw-regular resolves to 400
      expect(result.results[0].warnings).toHaveLength(1)
    })
  })

  describe('edge cases', () => {
    it('should not report when rule is disabled', async () => {
      const result = await stylelint.lint({
        code: '.foobar { font-size: 15px; line-height: 1.44; }',
        config: {
          plugins: [preferAtomic],
          rules: {
            [ruleName]: false,
          },
          customSyntax: 'postcss-scss',
        },
      })

      expect(result.results[0].warnings).toHaveLength(0)
    })

    it('should not report when atomicFiles is empty', async () => {
      const result = await lint(
        '.foobar { font-size: 15px; line-height: 1.44; }',
        { atomicFiles: [] },
        'postcss-scss'
      )

      expect(result.results[0].warnings).toHaveLength(0)
    })

    it('should handle multiple atomic classes', async () => {
      const result = await lint(
        `.foobar { font-size: 14px; line-height: 1.5; font-weight: 400; }
.barbaz { font-size: 15px; line-height: 1.44; font-weight: 400; }`,
        { atomicFiles: [atomicFile] },
        'postcss-scss'
      )

      // Should match both atomic classes
      expect(result.results[0].warnings.length).toBeGreaterThanOrEqual(2)
    })

    it('should handle non-matching properties', async () => {
      const result = await lint(
        '.foobar { font-size: 20px; line-height: 2; }',
        { atomicFiles: [atomicFile] },
        'postcss-scss'
      )

      // Should not match
      expect(result.results[0].warnings).toHaveLength(0)
    })
  })
})
