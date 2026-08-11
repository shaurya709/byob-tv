/**
 * The boot kick's clock. Every number that says *when* lives here and nowhere else.
 *
 * ── One shared timeline, not eight animations ──
 *
 * A beat is a window on this timeline. Nothing waits for a completion callback and
 * nothing waits on a timeout: every animation in the sequence runs for `TOTAL`
 * seconds and uses `times` to say which part of that span it occupies.
 *
 * The alternative shapes both fail the same way. This component is unmounted
 * mid-sequence every time the rotation moves on, so a chain of callbacks would
 * need teardown at eight points to avoid firing into a dead component, and a
 * chain of timeouts would need the same plus it would drift. A shared timeline
 * has nothing to tear down — one unmount stops everything — and two beats cannot
 * disagree about when the first one ended, because neither of them decides.
 *
 * It also lives in `lib/` rather than in the component: the two involved rows
 * collapse and uncollapse on this clock too, and `BootKick` already imports the
 * row template from `VenturePill`, so the reverse import would be a cycle.
 */

/** Seconds, start to finish. The single authority on how long a kick lasts. */
export const TOTAL = 2.85

export const BEATS = {
  collapse: [0.0, 0.24],
  travel: [0.24, 0.86],
  windUp: [0.86, 1.06],
  strike: [1.06, 1.2],
  punt: [1.2, 2.25],
  settle: [1.2, 1.66],
  uncollapse: [2.25, 2.85],
} as const

export type Beat = readonly [start: number, end: number]

/** A moment in seconds as a fraction of the whole timeline. */
export function t(seconds: number): number {
  return seconds / TOTAL
}

/**
 * A beat's `times` array: its start, any stops within it, and its end.
 *
 * `within` values are fractions of the beat, not of the timeline, so a beat can
 * be moved or resized without touching the shape of what happens inside it.
 */
export function at(beat: Beat, ...within: number[]): number[] {
  const [from, to] = beat
  return [t(from), ...within.map((w) => t(from + (to - from) * w)), t(to)]
}
