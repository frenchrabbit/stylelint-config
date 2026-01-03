import type { Plugin } from 'stylelint'
import preferModernImport from './prefer-modern-import'
import deprecateRemMixin from './deprecate-rem-mixin'
import preferAtomic from './prefer-atomic'

const plugins: Plugin[] = [preferModernImport, deprecateRemMixin, preferAtomic]

export default plugins
