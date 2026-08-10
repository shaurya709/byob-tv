import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

/**
 * `environment: 'node'` by default, deliberately.
 *
 * The trigger system is a pure function of two plain objects — no clock, no
 * storage, no network — and that is enforced by a source-scan test rather than
 * only by convention. Running it in node means a browser API creeping into it
 * fails loudly instead of quietly working.
 *
 * The two component smoke tests opt into jsdom per-file with a
 * `// @vitest-environment jsdom` docblock.
 */
export default defineConfig({
  plugins: [react()],
  resolve: { tsconfigPaths: true },
  test: {
    environment: 'node',
    include: ['**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules/**', '.next/**'],
  },
})
