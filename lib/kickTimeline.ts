/**
 * The boot kick's clock. Every number that says *when* lives here and nowhere else.
 *
 * ── One shared timeline, not N animations ──
 *
 * A beat is a window on this timeline. Nothing waits for a completion callback
 * and nothing waits on a timeout: every animation in the sequence runs for the
 * timeline's `total` seconds and uses `times` to say which part of that span it
 * occupies.
 *
 * The alternative shapes both fail the same way. Rows are unmounted mid-sequence
 * every time the rotation moves on, so a chain of callbacks would need teardown
 * at every beat to avoid firing into a dead component, and a chain of timeouts
 * would need the same plus it would drift. A shared timeline has nothing to tear
 * down — one unmount stops everything — and two beats cannot disagree about when
 * the first one ended, because neither of them decides.
 *
 * ── The timeline is a function of the event ──
 *
 * Beat B's climb scales with how many ranks were taken, so there is no single
 * TOTAL any more: a Δ=1 kick and a Δ=8 kick are different lengths, and the
 * queue's guard fires on the animation's own completion. A fixed total longer
 * than the animation would fire that guard late and hold the board frozen for
 * the difference; one exactly as long as the longest case would cut every
 * shorter case off. So the whole timeline is derived, per kick, from Δ.
 *
 * ── Beats are added as they are built ──
 *
 * Only the beats that exist are in `beats`. `STRIKE_RESERVE_S` is a gap, not a
 * beat: Beats C (boot strike, 250ms) and D (defender's fall, 300ms) will occupy
 * it when they are built, and reserving their span now is what lets E land in
 * its final position instead of moving twice. Nothing animates against the
 * reserve — it has no window to time against.
 */

export type Beat = readonly [start: number, end: number]

export type KickTimeline = {
  /** Seconds, start to finish. What the queue's guard effectively waits for. */
  total: number
  beats: {
    /** A — both involved rows swallow their own details. */
    collapse: Beat
    /** B — the attacker climbs to one row below the defender; the rows between slide down one. */
    climb: Beat
    /** E — both rows give their details back, in their new positions. */
    uncollapse: Beat
  }
  /**
   * A beat's `times` array: its start, any stops within it, and its end.
   *
   * `within` values are fractions of the beat, not of the timeline, so a beat
   * can be moved or resized without touching the shape of what happens inside.
   */
  at(beat: Beat, ...within: number[]): number[]
}

const COLLAPSE_S = 0.6
/** The climb's floor; every extra rank climbed past the first adds a step. */
const CLIMB_MIN_S = 0.4
const CLIMB_PER_RANK_S = 0.06
/** Unbuilt Beats C + D. See the module docblock before animating anything here. */
const STRIKE_RESERVE_S = 0.55
const UNCOLLAPSE_S = 0.7

/** The whole kick's clock, derived from how many ranks the attacker took. */
export function timelineFor(delta: number): KickTimeline {
  const climbEnd = COLLAPSE_S + CLIMB_MIN_S + CLIMB_PER_RANK_S * Math.max(0, delta - 1)
  const uncollapseStart = climbEnd + STRIKE_RESERVE_S
  const total = uncollapseStart + UNCOLLAPSE_S

  return {
    total,
    beats: {
      collapse: [0, COLLAPSE_S],
      climb: [COLLAPSE_S, climbEnd],
      uncollapse: [uncollapseStart, total],
    },
    at(beat, ...within) {
      const [from, to] = beat
      return [from / total, ...within.map((w) => (from + (to - from) * w) / total), to / total]
    },
  }
}
