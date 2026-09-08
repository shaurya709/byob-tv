import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

/**
 * The guard, asserted rather than assumed.
 *
 * `devClockSkew` reads a query parameter and hands back a clock offset. In
 * development that is how every countdown band gets watched on a real page; in
 * production it would be a way for anyone with the URL to make the wall count
 * down from the wrong day — silently, on a screen nobody is standing at.
 *
 * `process.env.NODE_ENV` is inlined at build time, so the whole body folds away
 * in a production bundle. That is only true while the check is there, and its
 * absence is invisible in development, which is the only place anyone would
 * look. Hence a source scan: the same executable-documentation pattern
 * `lib/ranking.test.ts` uses to pin its own purity.
 */
describe('devClockSkew', () => {
  const source = readFileSync(new URL('./devClock.ts', import.meta.url), 'utf8')

  it('is guarded by NODE_ENV, and returns 0 outside development', () => {
    expect(source).toMatch(/process\.env\.NODE_ENV !== 'development'/)
    // The guard must come first: a check further down would still read the
    // query string, and a skew computed then discarded is one refactor away
    // from being a skew computed then used.
    const guard = source.indexOf('NODE_ENV')
    const search = source.indexOf('location.search')
    expect(guard).toBeGreaterThan(-1)
    expect(guard).toBeLessThan(search)
  })

  it('lives in exactly one place', () => {
    // Two copies of a safety guard is how one of them quietly loses its check.
    const strip = readFileSync(new URL('../components/FleaStrip.tsx', import.meta.url), 'utf8')
    expect(strip).not.toMatch(/function devClockSkew/)
    expect(strip).toMatch(/from '@\/lib\/devClock'/)
  })
})
