/**
 * The boot kick's clock, and the kick's few geometry constants. Every number
 * that says *when* — and every pixel the choreography invents that the DOM
 * cannot supply — lives here and nowhere else.
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
 * ── The climb is the faceoff ──
 *
 * B's climb is a *diagonal*: the attacker rides directly from its own slot to
 * the squared-off position at the defender's left, x and y on one window, one
 * curve. There is no vertical-only stop stacked underneath the defender — that
 * intermediate existed once and read as a frame of hesitation between two
 * moves that are really one.
 *
 * ── The strike and the fall are four phases on one clock ──
 *
 * C: the boot cocks (`windup`) and swings (`strike`). D: the defender is
 * punched sideways out of its slot (`knock`) and falls into the attacker's
 * vacated position while the attacker takes its slot (`swap`). The contact
 * frame *is* the boundary between `strike` and `knock` — cause and effect
 * share an instant because they share a clock, not because anything waited
 * for anything.
 */

export type Beat = readonly [start: number, end: number]

export type KickTimeline = {
  /** Seconds, start to finish. What the queue's guard effectively waits for. */
  total: number
  beats: {
    /** A — both involved rows swallow their own details. */
    collapse: Beat
    /** B — the attacker rides diagonally to the defender's left; the rows between slide down one. */
    climb: Beat
    /** C — the boot appears at the attacker's logo and cocks away from the defender. */
    windup: Beat
    /** C — the swing. Ends at the contact frame. */
    strike: Beat
    /** D — the defender is shoved sideways off its slot, with a landing dip. */
    knock: Beat
    /** D — the defender falls into the vacated row; the attacker takes the defender's slot. */
    swap: Beat
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

/**
 * Every duration below, multiplied once, in one place. The first cut of the
 * sequence measured right and *read* rushed on a wall watched from metres
 * away; slowing every beat by the same factor keeps the choreography's
 * proportions while giving the eye time. Tuning the whole kick's tempo is
 * this one number — never hand-adjust an individual beat to retime the set.
 */
export const SPEED_FACTOR = 1.15

const COLLAPSE_S = 0.6
/** The climb's floor; every extra rank climbed past the first adds a step. */
const CLIMB_MIN_S = 0.4
const CLIMB_PER_RANK_S = 0.06
/** C's two phases, then D's two. Their sum is the whole strike-and-fall span. */
const WINDUP_S = 0.1
const STRIKE_S = 0.1
/**
 * The one eye-tuned duration, stated in *rendered* seconds and divided back
 * out of the factor: at 138ms the knock read as a snap, not a bounce-off, so
 * it was retimed to 180ms watched at full tempo. Dividing keeps it at 180ms
 * whatever the factor becomes — it was tuned against the eye, not the clock.
 */
const KNOCK_S = 0.18 / SPEED_FACTOR
const SWAP_S = 0.28
const UNCOLLAPSE_S = 0.7

// ── Choreography geometry ───────────────────────────────────────────────────
// Pixels the DOM cannot supply: they describe positions that exist only during
// the kick. Everything the DOM *can* supply (row height, pill width) is
// measured at mount in VenturePill and never duplicated here.

/** Edge-to-edge daylight between the two logos at faceoff. */
export const FACEOFF_GAP_PX = 12
/** How far sideways the contact punches the defender before it falls. */
export const KNOCK_PX = 28
/** The impact dip: down and back up inside the knock, never leaving the row. */
export const KNOCK_DIP_PX = 4
/** The boot's rendered height — about half the pill. Width follows the PNG's aspect. */
export const BOOT_HEIGHT_PX = 22
/**
 * Where on the logo's right edge the boot's heel sits, as a fraction of the
 * logo's height from its top. 0 was the first cut and read as a boot through
 * the head; leg height is a little below the middle.
 */
export const BOOT_ANCHOR_Y_FRACTION = 0.55

/** The whole kick's clock, derived from how many ranks the attacker took. */
export function timelineFor(delta: number): KickTimeline {
  const s = (seconds: number) => seconds * SPEED_FACTOR
  const collapseEnd = s(COLLAPSE_S)
  const climbEnd = collapseEnd + s(CLIMB_MIN_S + CLIMB_PER_RANK_S * Math.max(0, delta - 1))
  const windupEnd = climbEnd + s(WINDUP_S)
  const strikeEnd = windupEnd + s(STRIKE_S)
  const knockEnd = strikeEnd + s(KNOCK_S)
  const swapEnd = knockEnd + s(SWAP_S)
  const total = swapEnd + s(UNCOLLAPSE_S)

  return {
    total,
    beats: {
      collapse: [0, collapseEnd],
      climb: [collapseEnd, climbEnd],
      windup: [climbEnd, windupEnd],
      strike: [windupEnd, strikeEnd],
      knock: [strikeEnd, knockEnd],
      swap: [knockEnd, swapEnd],
      uncollapse: [swapEnd, total],
    },
    at(beat, ...within) {
      const [from, to] = beat
      return [from / total, ...within.map((w) => (from + (to - from) * w) / total), to / total]
    },
  }
}
