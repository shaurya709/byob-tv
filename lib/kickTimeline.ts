/**
 * The boot kick's clock. Every number that says *when* lives here and nowhere else.
 *
 * ── One shared timeline, not N animations ──
 *
 * A beat is a window on this timeline. Nothing waits for a completion callback
 * and nothing waits on a timeout: every animation in the sequence runs for
 * `TOTAL` seconds and uses `times` to say which part of that span it occupies.
 *
 * The alternative shapes both fail the same way. Rows are unmounted mid-sequence
 * every time the rotation moves on, so a chain of callbacks would need teardown
 * at every beat to avoid firing into a dead component, and a chain of timeouts
 * would need the same plus it would drift. A shared timeline has nothing to tear
 * down — one unmount stops everything — and two beats cannot disagree about when
 * the first one ended, because neither of them decides.
 *
 * ── Beats are added as they are built ──
 *
 * Only the beats that exist are here. There are no placeholder windows for work
 * not yet done: a beat with no animation attached is a number that looks load
 * bearing and is not.
 */

/** Seconds, start to finish. The single authority on how long a kick lasts. */
export const TOTAL = 2.85

export const BEATS = {
  /** A — both involved rows swallow their own details. */
  collapse: [0.0, 0.48],
  /** E — both rows give them back, in their new positions. */
  uncollapse: [2.23, 2.85],
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
