import { statSync, existsSync } from 'fs'
import { resolve, dirname, isAbsolute } from 'path'
import type { AtomicClass } from './types'
import { ScssParser } from './scss-parser'
import { VariableResolver } from './variable-resolver'

interface CacheEntry {
  atomicClasses: AtomicClass[]
  mtime: number
}

/**
 * Cache for atomic classes with mtime-based invalidation
 */
export class AtomicClassCache {
  private static instance: AtomicClassCache | null = null
  private cache = new Map<string, CacheEntry>()
  private variableResolver: VariableResolver
  private scssParser: ScssParser

  private constructor() {
    this.variableResolver = new VariableResolver()
    this.scssParser = new ScssParser(this.variableResolver)
  }

  /**
   * Get singleton instance
   */
  static getInstance(): AtomicClassCache {
    if (!AtomicClassCache.instance) {
      AtomicClassCache.instance = new AtomicClassCache()
    }
    return AtomicClassCache.instance
  }

  /**
   * Get atomic classes from a file (with caching)
   */
  getAtomicClasses(filePath: string, baseDir: string = process.cwd()): AtomicClass[] {
    // If filePath is already absolute, use it; otherwise resolve relative to baseDir
    const absolutePath = isAbsolute(filePath) ? filePath : resolve(baseDir, filePath)

    if (!existsSync(absolutePath)) {
      return []
    }

    // Get current mtime
    const stats = statSync(absolutePath)
    const currentMtime = stats.mtimeMs

    // Check cache
    const cached = this.cache.get(absolutePath)
    if (cached && cached.mtime === currentMtime) {
      return cached.atomicClasses
    }

    // Parse and cache (use dirname of absolutePath as base for parsing)
    const atomicClasses = this.scssParser.parseAtomicClasses(absolutePath, dirname(absolutePath))
    this.cache.set(absolutePath, {
      atomicClasses,
      mtime: currentMtime,
    })

    return atomicClasses
  }

  /**
   * Get all atomic classes from multiple files
   */
  getAllAtomicClasses(filePaths: string[], baseDir: string = process.cwd()): AtomicClass[] {
    const allClasses: AtomicClass[] = []

    for (const filePath of filePaths) {
      const classes = this.getAtomicClasses(filePath, baseDir)
      allClasses.push(...classes)
    }

    return allClasses
  }

  /**
   * Clear cache (useful for testing)
   */
  clearCache(): void {
    this.cache.clear()
    this.variableResolver.clearCache()
  }

  /**
   * Invalidate cache for a specific file
   */
  invalidate(filePath: string, baseDir: string = process.cwd()): void {
    const absolutePath = resolve(baseDir, filePath)
    this.cache.delete(absolutePath)
  }
}
