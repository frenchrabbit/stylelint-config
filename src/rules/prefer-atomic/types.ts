/**
 * Atomic class extracted from SCSS file
 */
export interface AtomicClass {
  /** Class name, e.g. "_txt-m" */
  name: string
  /** Base properties: property name -> resolved value */
  properties: Map<string, string>
  /** Mixins: mixin signature -> properties map */
  mixins: Map<string, Map<string, string>>
}

/**
 * Rule configuration options
 */
export interface PreferAtomicOptions {
  /** Paths to SCSS/CSS files containing atomic classes (starting with ._) */
  atomicFiles: string[]
}

/**
 * Match result from comparing styles with atomic classes
 */
export interface MatchResult {
  /** Matched atomic class */
  atomicClass: AtomicClass
  /** Type of match */
  matchType: 'full' | 'partial'
  /** Properties that matched */
  matchedProperties: string[]
  /** Properties that differ (for partial matches) */
  differingProperties: string[]
}
