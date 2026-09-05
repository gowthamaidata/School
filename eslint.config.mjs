// ESLint flat config.
// `next lint` was removed in Next.js 16, so linting runs through the ESLint
// CLI directly — see the "lint" script in package.json.

import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'
import nextTypescript from 'eslint-config-next/typescript'

const config = [
  {
    ignores: ['.next/**', 'node_modules/**', 'out/**', 'next-env.d.ts'],
  },

  ...nextCoreWebVitals,
  ...nextTypescript,

  {
    rules: {
      // The design system draws avatars from generated data URIs; next/image
      // buys nothing there.
      '@next/next/no-img-element': 'off',
      'react/no-unescaped-entities': 'off',

      // Fonts load via <link> on purpose, so a build never depends on being
      // able to reach Google Fonts at compile time. See src/app/layout.tsx.
      '@next/next/no-page-custom-font': 'off',

      // React Compiler rule. It fires on two patterns used deliberately here:
      //
      //   1. Reading localStorage in an effect and setting state from it.
      //      That cannot happen during render — there is no localStorage on
      //      the server, and doing it lazily causes a hydration mismatch.
      //   2. Setting a loading flag at the top of a data-fetching effect.
      //
      // Both are correct as written, so this is a warning rather than an
      // error: still visible, but it does not fail CI. Revisit if this app
      // ever adopts the React Compiler or a data-fetching library.
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
]

export default config
