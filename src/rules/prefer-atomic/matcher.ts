import type { AtomicClass, MatchResult } from './types'

/**
 * Normalize CSS value for comparison (remove whitespace, normalize units)
 */
function normalizeValue(value: string): string {
  return value
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
}

/**
 * Check if two CSS values are equivalent
 */
function valuesMatch(value1: string, value2: string): boolean {
  const normalized1 = normalizeValue(value1)
  const normalized2 = normalizeValue(value2)

  // Exact match
  if (normalized1 === normalized2) {
    return true
  }

  // Try to normalize numeric values (e.g., "1.44" === "1.44px" in some contexts)
  // But be careful - we'll do exact matching for now
  return false
}

/**
 * Match properties from a selector against atomic classes
 */
export class AtomicMatcher {
  /**
   * Find matches between provided properties and atomic classes
   */
  findMatches(
    properties: Map<string, string>,
    atomicClasses: AtomicClass[]
  ): MatchResult[] {
    const matches: MatchResult[] = []

    for (const atomicClass of atomicClasses) {
      const match = this.matchProperties(properties, atomicClass)
      if (match) {
        matches.push(match)
      }
    }

    return matches
  }

  /**
   * Match properties against a single atomic class
   */
  private matchProperties(
    properties: Map<string, string>,
    atomicClass: AtomicClass
  ): MatchResult | null {
    const matchedProperties: string[] = []
    const differingProperties: string[] = []

    // Check base properties
    for (const [prop, atomicValue] of atomicClass.properties.entries()) {
      const providedValue = properties.get(prop)

      if (providedValue !== undefined) {
        if (valuesMatch(providedValue, atomicValue)) {
          matchedProperties.push(prop)
        } else {
          differingProperties.push(prop)
        }
      }
    }

    // Determine match type
    const totalAtomicProps = atomicClass.properties.size
    const matchedCount = matchedProperties.length

    // Full match: all atomic properties are present and match
    if (matchedCount === totalAtomicProps && differingProperties.length === 0) {
      return {
        atomicClass,
        matchType: 'full',
        matchedProperties,
        differingProperties: [],
      }
    }

    // Partial match: at least 2 properties match (or N-1 if N > 2)
    const minMatchCount = totalAtomicProps > 2 ? totalAtomicProps - 1 : 2
    if (matchedCount >= minMatchCount && matchedCount < totalAtomicProps) {
      return {
        atomicClass,
        matchType: 'partial',
        matchedProperties,
        differingProperties,
      }
    }

    return null
  }

  /**
   * Check if atomic class has responsive mixins
   */
  hasResponsiveMixins(atomicClass: AtomicClass): boolean {
    return atomicClass.mixins.size > 0
  }

  /**
   * Format mixins for error message
   */
  formatMixins(atomicClass: AtomicClass): string {
    const mixinStrings: string[] = []

    for (const [mixinName, mixinProps] of atomicClass.mixins.entries()) {
      const propStrings: string[] = []
      for (const [prop, value] of mixinProps.entries()) {
        propStrings.push(`${prop}: ${value}`)
      }
      mixinStrings.push(`@include ${mixinName} { ${propStrings.join('; ')} }`)
    }

    return mixinStrings.join(', ')
  }
}
