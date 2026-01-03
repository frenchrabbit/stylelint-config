# @frabbit/stylelint-config

Modern Stylelint configuration for Vue and SCSS projects with TypeScript support.

## Features

- 🎯 **Vue SFC Support** - Full support for Vue Single File Components
- 🎨 **SCSS Support** - Extended rules for SCSS syntax
- 📦 **Property Ordering** - Logical CSS property ordering with `stylelint-order`
- 🔧 **TypeScript** - Fully typed configuration API
- ⚙️ **Flexible** - Easy to customize and extend

## Installation

```bash
pnpm add -D @frabbit/stylelint-config stylelint
```

## Usage

Create a `stylelint.config.js` (or `.mjs`, `.ts`) file in your project root:

```js
import { defineConfig } from '@frabbit/stylelint-config'

export default defineConfig({
  vue: true,
  scss: true,
  order: true,
  customPropertiesFiles: ['./src/styles/variables.css'],
})
```

### Options

#### `vue` (default: `true`)

Enable Vue SFC support. Adds `stylelint-config-recommended-vue` and `postcss-html` syntax.

```js
defineConfig({
  vue: true, // or false to disable
})
```

#### `scss` (default: `true`)

Enable SCSS support. Adds `stylelint-config-standard-scss` and `postcss-scss` syntax.

```js
defineConfig({
  scss: true, // or false to disable
})
```

#### `order` (default: `true`)

Enable CSS property ordering with `stylelint-order` plugin.

```js
defineConfig({
  order: true, // or false to disable
})
```

#### `customPropertiesFiles`

Array of paths to files containing CSS custom properties. Used for `csstools/value-no-unknown-custom-properties` rule with `importFrom` option. Automatically adds `stylelint-value-no-unknown-custom-properties` plugin when provided.

```js
defineConfig({
  customPropertiesFiles: [
    './src/styles/variables.css',
    './src/styles/theme.css',
  ],
})
```

#### `rules`

Additional rules to override or extend default rules.

```js
defineConfig({
  rules: {
    'color-hex-length': 'long',
    'selector-class-pattern': '^[a-z][a-z0-9]*(-[a-z0-9]+)*$',
  },
})
```

#### `ignoreFiles`

Files to ignore during linting.

```js
defineConfig({
  ignoreFiles: [
    '**/*.min.css',
    'dist/**',
  ],
})
```

#### `overrides`

Additional overrides for specific file patterns.

```js
defineConfig({
  overrides: [
    {
      files: ['**/*.vue'],
      rules: {
        'selector-pseudo-element-no-unknown': [
          true,
          {
            ignorePseudoElements: ['v-deep', 'v-global', 'v-slotted'],
          },
        ],
      },
    },
  ],
})
```

## Examples

### Basic Vue + SCSS Project

```js
import { defineConfig } from '@frabbit/stylelint-config'

export default defineConfig({
  customPropertiesFiles: ['./src/assets/styles/variables.css'],
})
```

### Disable Property Ordering

```js
import { defineConfig } from '@frabbit/stylelint-config'

export default defineConfig({
  order: false,
})
```

### Custom Rules

```js
import { defineConfig } from '@frabbit/stylelint-config'

export default defineConfig({
  rules: {
    'max-nesting-depth': 3,
    'selector-max-compound-selectors': 4,
  },
})
```

## TypeScript Support

The package includes TypeScript definitions:

```ts
import { defineConfig, type StylelintConfigOptions } from '@frabbit/stylelint-config'

const options: StylelintConfigOptions = {
  vue: true,
  scss: true,
}

export default defineConfig(options)
```

## License

MIT
