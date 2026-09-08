/**
 * Faking the clock, in development only.
 *
 * `?now=2026-09-13T20:59:00+05:30` on the URL skews the caller's clock, so every
 * band of every countdown on this wall can be watched on a real page rather than
 * waited for. Callers add the returned offset to `Date.now()`.
 *
 * ── The guard is the whole point ──
 *
 * The check is `process.env.NODE_ENV`, which Next inlines at build time, so a
 * production bundle carries no trace of this: a wall accidentally launched with
 * a leftover query param must not spend the cohort counting down from the wrong
 * day.
 *
 * ── Why it lives here rather than beside its first caller ──
 *
 * It was module-private in `components/FleaStrip.tsx`, and the market board
 * needs the same skew for the same reason. Copying it would mean two copies of a
 * *safety guard*, and the failure mode of a guard that loses its `NODE_ENV`
 * check in one copy is a production wall counting from a stranger's query
 * string — silent, and worse than any amount of duplicated ordinary code.
 * One copy, one guard, pinned by a source scan in the test beside this.
 */
export function devClockSkew(): number {
  if (process.env.NODE_ENV !== 'development') return 0
  const raw = new URLSearchParams(window.location.search).get('now')
  if (raw === null) return 0
  const parsed = Date.parse(raw)
  return Number.isNaN(parsed) ? 0 : parsed - Date.now()
}
