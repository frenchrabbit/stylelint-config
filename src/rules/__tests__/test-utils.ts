import type {Config} from 'stylelint'
import stylelint from 'stylelint'

/**
 * Test utility for stylelint rules
 */
export interface TestCase {
  code: string
  description: string
  expectedWarnings?: number
  expectedFixedCode?: string
  config?: Config
}

/**
 * Run stylelint on code and return results
 */
export async function lintCode(
  code: string,
  ruleName: string,
  ruleConfig: stylelint.ConfigRuleSettings<boolean, Record<string, unknown>> = true,
  customSyntax?: string
): Promise<stylelint.LinterResult> {
  const config: Config = {
    rules: {
      [ruleName]: ruleConfig,
    },
    customSyntax,
  }

  return await stylelint.lint({
    code,
    config,
  })
}

/**
 * Test that rule reports expected warnings
 */
export async function testRule(
  ruleName: string,
  testCase: TestCase,
  plugins?: stylelint.Plugin[]
): Promise<stylelint.LinterResult> {
  const config: Config = {
    plugins,
    rules: {
      [ruleName]: testCase.config?.rules?.[ruleName] ?? true,
    },
    customSyntax: testCase.config?.customSyntax,
  }

  const result = await stylelint.lint({
    code: testCase.code,
    config,
  })

  const warnings = result.results[0]?.warnings || []

  if (testCase.expectedWarnings !== undefined) {
    if (warnings.length !== testCase.expectedWarnings) {
      throw new Error(
        `Expected ${testCase.expectedWarnings} warning(s), but got ${warnings.length}.\n` +
          `Warnings: ${JSON.stringify(warnings, null, 2)}\n` +
          `Code: ${testCase.code}`
      )
    }
  }

  return result
}
