import type { Root as PostcssRoot, Declaration as PostcssDeclaration } from 'postcss'
import postcssScss from 'postcss-scss'
import { readFileSync, existsSync } from 'fs'
import { resolve, dirname, join, isAbsolute } from 'path'

/**
 * Map of variable names to their resolved values
 */
export type VariableMap = Map<string, string>

/**
 * Resolves SCSS variables by parsing @use and @import directives
 */
export class VariableResolver {
  private variableCache = new Map<string, VariableMap>()
  private resolvingFiles = new Set<string>()

  /**
   * Resolve all variables from a SCSS file
   */
  resolveVariables(filePath: string, baseDir: string = process.cwd()): VariableMap {
    // If filePath is already absolute, use it; otherwise resolve relative to baseDir
    const absolutePath = isAbsolute(filePath) ? filePath : resolve(baseDir, filePath)
    
    if (!existsSync(absolutePath)) {
      return new Map()
    }

    // Check cache
    if (this.variableCache.has(absolutePath)) {
      return this.variableCache.get(absolutePath)!
    }

    // Prevent circular dependencies
    if (this.resolvingFiles.has(absolutePath)) {
      return new Map()
    }

    this.resolvingFiles.add(absolutePath)
    const variables = new Map<string, string>()

    try {
      const content = readFileSync(absolutePath, 'utf-8')
      const root = postcssScss.parse(content)
      const fileDir = dirname(absolutePath)

      // Collect variables from this file
      this.collectVariables(root, variables)

      // Resolve imports
      root.walkAtRules((atRule) => {
        if (atRule.name === 'use' || atRule.name === 'import') {
          const importPath = this.extractImportPath(atRule.params)
          if (importPath) {
            const resolvedPath = this.resolveImportPath(importPath, fileDir)
            if (resolvedPath) {
              const importedVars = this.resolveVariables(resolvedPath, fileDir)
              // Merge imported variables (local takes precedence)
              for (const [name, value] of importedVars) {
                if (!variables.has(name)) {
                  variables.set(name, value)
                }
              }
            }
          }
        }
      })

      // Resolve variable references recursively
      this.resolveVariableReferences(variables)

      this.variableCache.set(absolutePath, variables)
    } catch (error) {
      // Silently fail - file might be invalid or not accessible
      console.warn(`Failed to resolve variables from ${absolutePath}:`, error)
    } finally {
      this.resolvingFiles.delete(absolutePath)
    }

    return variables
  }

  /**
   * Collect variable declarations from a PostCSS root
   */
  private collectVariables(root: PostcssRoot, variables: VariableMap): void {
    root.walkDecls((decl: PostcssDeclaration) => {
      // Match SCSS variables: $variable-name: value;
      if (decl.prop.startsWith('$')) {
        const varName = decl.prop
        const value = decl.value.trim()
        variables.set(varName, value)
      }
    })
  }

  /**
   * Extract import path from @use or @import directive
   */
  private extractImportPath(params: string): string | null {
    // Remove quotes and whitespace
    const match = params.match(/['"]([^'"]+)['"]/)
    return match ? match[1] : null
  }

  /**
   * Resolve import path to absolute file path
   */
  private resolveImportPath(importPath: string, baseDir: string): string | null {
    // Handle partials (leading underscore)
    const normalizedPath = importPath.startsWith('_')
      ? importPath
      : `_${importPath}`

    // Try different extensions
    const extensions = ['.scss', '.sass', '.css']
    for (const ext of extensions) {
      const withExt = normalizedPath.endsWith(ext) ? normalizedPath : `${normalizedPath}${ext}`
      const fullPath = join(baseDir, withExt)
      if (existsSync(fullPath)) {
        return fullPath
      }
    }

    // Try without underscore
    if (!importPath.startsWith('_')) {
      for (const ext of extensions) {
        const withExt = importPath.endsWith(ext) ? importPath : `${importPath}${ext}`
        const fullPath = join(baseDir, withExt)
        if (existsSync(fullPath)) {
          return fullPath
        }
      }
    }

    // Try node_modules resolution (simplified)
    const nodeModulesPath = join(baseDir, 'node_modules', importPath)
    for (const ext of extensions) {
      const withExt = importPath.endsWith(ext) ? importPath : `${importPath}${ext}`
      const fullPath = join(nodeModulesPath, withExt)
      if (existsSync(fullPath)) {
        return fullPath
      }
    }

    return null
  }

  /**
   * Resolve variable references recursively
   * e.g., $primary: $base-color; $base-color: #fff; -> $primary: #fff
   */
  private resolveVariableReferences(variables: VariableMap): void {
    const maxIterations = 100 // Prevent infinite loops
    let changed = true
    let iterations = 0

    while (changed && iterations < maxIterations) {
      changed = false
      iterations++

      for (const [varName, varValue] of variables.entries()) {
        // Check if value contains variable references
        const varRefRegex = /\$([a-zA-Z0-9_-]+)/g
        let newValue = varValue
        let hasChanges = false

        newValue = varValue.replace(varRefRegex, (match, refName) => {
          const refVarName = `$${refName}`
          if (variables.has(refVarName) && refVarName !== varName) {
            const resolved = variables.get(refVarName)!
            hasChanges = true
            return resolved
          }
          return match
        })

        if (hasChanges) {
          variables.set(varName, newValue)
          changed = true
        }
      }
    }
  }

  /**
   * Replace variables in a value string
   */
  replaceVariables(value: string, variables: VariableMap): string {
    const varRefRegex = /\$([a-zA-Z0-9_-]+)/g
    return value.replace(varRefRegex, (match, varName) => {
      const fullVarName = `$${varName}`
      return variables.get(fullVarName) || match
    })
  }

  /**
   * Clear cache (useful for testing)
   */
  clearCache(): void {
    this.variableCache.clear()
    this.resolvingFiles.clear()
  }
}
