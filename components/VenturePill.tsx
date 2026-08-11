import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { cubicBezier, motion, type Easing } from 'motion/react'

import { HOT_TODAY_MIN } from '@/config'
import { VentureLogo } from '@/components/VentureLogo'
import { formatRupees } from '@/lib/format'
import { BOOT_HEIGHT_PX, KNOCK_DIP_PX, type KickTimeline } from '@/lib/kickTimeline'
import type { Team } from '@/lib/types'

/**
 * One row of the weekly board. Forty of these are on screen at once.
 *
 * Four fields across a fixed grid — rank, mark and name, week revenue, today's
 * revenue. The grid template lives here rather than on the column so that every
 * row's columns line up whatever is in them, and so a row can be lifted out and
 * animated without the ones around it reflowing.
 *
 * ── Only two things are ever emphasised ──
 *
 * The weekly podium (ranks 1–3) and a strong day (today ≥ ₹5,000). Everything
 * else is one muted weight. With forty rows on a wall, a third emphasis would
 * mean nothing is emphasised.
 */

/**
 * `--green-600`, not `--bright-green`, for a strong day.
 *
 * The brief says Bright Green. On this wall's white surface `#6ED190` measures
 * about 1.9:1 against white — invisible from a corridor — because the token was
 * drawn for dark marketing surfaces. `--green-600` is the same hue one step
 * deeper and is an existing brand token, so this stays within the system rather
 * than inventing a colour.
 */
const HOT = 'var(--green-600)'

/**
 * A row is a rank number and then a pill, and the two are separate boxes.
 *
 * The rank is board apparatus — it belongs to the leaderboard, not to the team —
 * so it sits *outside* the pill. That is also what puts the logo at the pill's
 * own left edge, which is what lets the pill close around it.
 *
 * Both halves are shared with the column heading so the labels sit exactly over
 * the figures they name. Two copies of these templates would drift apart on the
 * first change and nobody would notice until a heading pointed at the wrong
 * column.
 */
export const ROW_OUTER: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'var(--w-rank) auto',
  alignItems: 'center',
  gap: 'var(--s-3)',
  paddingInline: 'var(--s-3)',
  // Stated, not `max-content`. Every track is fixed so the two agree at rest —
  // but a `max-content` row shrinks when the pill inside it does, and a shrunken
  // row with `margin: auto` re-centres, so the closed pill lands at the track's
  // right edge instead of its centre and the whole row slides. Measured: the
  // pill closed to 801-839 in a track spanning 186-839.
  width: 'calc(var(--w-rank) + var(--w-pill) + 3 * var(--s-3))',
  marginInline: 'auto',
}

export const PILL_INNER: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'auto var(--w-name) var(--w-week) var(--w-today)',
  alignItems: 'center',
  gap: 'var(--s-3)',
  paddingInline: 'var(--s-3)',
  height: '100%',
  // **Load bearing.** The inner tracks are fixed, so they do not compress as the
  // pill narrows — without this the venture name and both figures spill out of
  // the pill and across the row as it closes. The pill closing *over* its
  // contents is the whole beat, and this is the line that does it.
  overflow: 'hidden',
}

/**
 * What the two figures on each row are.
 *
 * Without it the board shows two rupee amounts per team and no way to know which
 * is which — the reason it was added after the first look at the real thing.
 * Sits above each column, not once across the frame, because the two columns are
 * two independent lists.
 */
export function ColumnHeading() {
  const label: React.CSSProperties = {
    font: 'var(--t-tv-col-head)',
    letterSpacing: 'var(--track-overline)',
    textTransform: 'uppercase',
    color: 'var(--fg-muted)',
    textAlign: 'right',
  }
  return (
    <div style={{ ...ROW_OUTER, height: 'var(--h-col-head)', alignItems: 'end' }}>
      <span />
      <div style={{ ...PILL_INNER, alignItems: 'end' }}>
        <span style={{ width: 30 }} />
        <span />
        <span style={label}>This week</span>
        <span style={label}>Today</span>
      </div>
    </div>
  )
}

/**
 * Beat A — the pill closing around its own logo, and Beat E — it opening again.
 *
 * ── The rows are the actors ──
 *
 * This animates the real row. There is no overlay, no clone, no mark drawn a
 * second time somewhere else. The board a passer-by is reading is the board that
 * moves; when the sequence ends nothing has to be reconciled, because nothing
 * was ever duplicated.
 *
 * ── One motion, not a sequence ──
 *
 * The pill's width, its padding and its offset are three properties of one
 * animation, on one window, with one curve. They arrive together in the same
 * frame. Closing the pill and *then* walking the logo to the centre would read
 * as two events, and there is only one thing happening.
 *
 * The logo needs no animation of its own. It sits against the pill's padding
 * edge, so narrowing the padding while the pill shrinks and slides carries it to
 * the centre of the row's space exactly — the arithmetic cancels, and the logo
 * crosses the full width of the row without ever being told to.
 *
 * ── The details fade rather than move ──
 *
 * They stay where they are and the pill closes over them, clipped by its own
 * rounded edge. Sliding them as well would be a second motion competing with the
 * pill's. The fade finishes at 60% of the window so nothing is still legible
 * while the edge is crossing it.
 */
/**
 * Not an ease-in. That was the first attempt and it read as a fade, not a
 * collapse: at 60% of the window — the moment the text had finished fading — the
 * pill was still 84% open, so the only visible thing in the first half was the
 * details disappearing, and the whole close was crammed into the last hundred
 * milliseconds as a snap. The pill has to be visibly shutting the entire time
 * the details are going, or the details *are* the animation.
 */
const SWALLOW = cubicBezier(0.42, 0, 0.58, 1)
const DISGORGE = cubicBezier(0.16, 1, 0.3, 1)
/** Beat B's arrival: fast off the line, decelerating into place below the defender. */
const CLIMB = cubicBezier(0.22, 0.68, 0.24, 1)

/** Beat A's window, the hold between, then Beat E's. Shared by every collapsing property. */
function windowOf(timeline: KickTimeline): number[] {
  return [...timeline.at(timeline.beats.collapse), ...timeline.at(timeline.beats.uncollapse)]
}
const EASE = [SWALLOW, 'linear', DISGORGE] as const

/** The closed pill: the logo, and an even hair either side of it. Exported for
    the brain: the faceoff offset is measured in logo widths. */
export const LOGO = 30
const CLOSED_PAD = 4



/**
 * The pill's resting geometry, read from the DOM once when the row mounts.
 *
 * ── Why this is measured and not computed ──
 *
 * Everything else on this wall derives its position from CSS and is never read
 * back. The pill's width cannot be: it is a `calc()` mixing `vw` tracks with
 * `px` gaps, and Motion cannot interpolate `width` between that and a pixel
 * value — measured, it writes `calc(138.728px)` on the first frame of a 653px
 * pill and eases from there. Starting at `100%` is worse: it snaps to the closed
 * width immediately. `paddingInline` is not animatable at all, being a
 * shorthand; only the long-hand sides are.
 *
 * So the animated values are plain numbers, and the ones that have to come from
 * the browser are taken **once, at mount** — long before any kick, and never
 * during one. No layout is read while an animation is running.
 *
 * `height` rides along for Beat B: the vertical travel is a multiple of the
 * row's rendered height, and `--h-row` is a `vw` value, so the true pixel
 * height exists only in the browser. The pill fills its row exactly, so its own
 * measured height *is* the row height — no second measurement, no parsed token.
 */
type Resting = { width: number; height: number; pad: number; border: number }

function useRestingPill(): [React.RefObject<HTMLDivElement | null>, Resting | null] {
  const ref = useRef<HTMLDivElement>(null)
  const [rest, setRest] = useState<Resting | null>(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (el === null) return
    // A mount-only read of layout that the animation config needs before it can
    // exist. It runs once per row, at page load, and never while a kick plays.
    const cs = getComputedStyle(el)
    const box = el.getBoundingClientRect()
    setRest({
      width: box.width,
      height: box.height,
      pad: Number.parseFloat(cs.paddingLeft),
      border: Number.parseFloat(cs.borderLeftWidth),
    })
  }, [])

  return [ref, rest]
}

/**
 * The closed width has to carry the border as well as the padding.
 *
 * `box-sizing: border-box` means a stated width *includes* the stroke, so
 * `logo + 2 * pad` left the content box 3px short of the logo and the pill
 * clipped it on the right — 5px of ring showing on the left against 3px on the
 * right. Symmetry here is arithmetic, not taste.
 */
function closedWidth(rest: Resting): number {
  return LOGO + 2 * CLOSED_PAD + 2 * rest.border
}

function pillMotion(rest: Resting, timeline: KickTimeline) {
  const closed = closedWidth(rest)
  const centred = (rest.width - closed) / 2
  return {
    animate: {
      width: [rest.width, closed, closed, rest.width],
      paddingLeft: [rest.pad, CLOSED_PAD, CLOSED_PAD, rest.pad],
      paddingRight: [rest.pad, CLOSED_PAD, CLOSED_PAD, rest.pad],
      x: [0, centred, centred, 0],
    },
    transition: { duration: timeline.total, times: windowOf(timeline), ease: EASE },
  }
}

/**
 * The details hold still and let the pill close over them.
 *
 * The local translate is the exact negative of the pill's slide, so on screen
 * they do not move at all: the pill travels across them while they stay put.
 * That is what makes this one motion rather than two. Every earlier version gave
 * them a window or a distance of their own, and it always read as a fade racing
 * a collapse — because that is what it was.
 *
 * Both edges then do the work. The left edge sweeps right and takes the name
 * with it; the right edge sweeps left through the figures; and the logo, riding
 * just inside the left edge and painted above, covers whatever it reaches. Text
 * only ever exists to the right of the logo, so nothing can sit on a mark.
 *
 * The fade is on the same window and the same curve — it softens the last few
 * pixels rather than being an effect of its own.
 */
function detailMotion(rest: Resting, timeline: KickTimeline) {
  const held = -(rest.width - closedWidth(rest)) / 2
  return {
    animate: { opacity: [1, 0, 0, 1], x: [0, held, held, 0] },
    transition: { duration: timeline.total, times: windowOf(timeline), ease: EASE },
  }
}

/**
 * The details, and the rank number with them.
 *
 * The rank goes too, rather than holding at the row's left edge while the logo
 * floats to the centre — a label that has lost its subject. It is also what
 * makes the rank *value* safe to change: a row shows its new rank the instant
 * the board re-sorts, and hiding the number through the middle of the sequence
 * means that swap can never be caught happening.
 */
function fadeMotion(timeline: KickTimeline) {
  return {
    animate: { opacity: [1, 0, 0, 1] },
    transition: {
      duration: timeline.total,
      // The rank is outside the pill, so nothing clips it — it fades on the same
      // window as everything else so the row leaves as one thing.
      times: windowOf(timeline),
      ease: EASE,
    },
  }
}

export type PillRole = 'attacker' | 'defender'

/**
 * One row's instruction for the kick in progress, computed by the leaderboard.
 *
 * The board is the brain and the rows are the actors: `WeeklyLeaderboard` reads
 * the event once and hands each involved row a cue; a row never looks at the
 * event, the other rows, or its own rank to decide what to do. Rows without a
 * cue are inert — nothing about them is animated, or even configured to be.
 */
export type KickCue = {
  /**
   * Which contestant this row is, if it is one. Contestants collapse (Beat A)
   * and uncollapse (Beat E); the rows *between* them slide fully open, so they
   * carry no role.
   */
  role?: PillRole
  /** Vertical travel during the climb, in row heights. Negative is up. Zero holds. */
  rows: number
  /** The kick's clock, derived from the event's climb size. One per kick, shared. */
  timeline: KickTimeline
  /** Attacker only: render the boot. Its windows and geometry are not per-event. */
  boot?: true
  /** Attacker: the faceoff slide's destination, relative to Beat B's end. */
  faceoffOffset?: KickOffset
  /** Attacker: the swap's destination — the defender's old slot — relative to Beat B's end. */
  slotSwapDestination?: KickOffset
  /** Defender: where the contact punches it, relative to its own slot. */
  knock?: KickOffset
  /** Defender: where it lands — the row below — which is also its snapshot slot. */
  fall?: KickOffset
}

/**
 * A choreography offset. Horizontal is in pixels, because it measures logo
 * widths and gaps that are constants; vertical is in row heights, because the
 * row height exists only in the browser and the brain never reads the DOM. The
 * actor multiplies `yRows` by its own measured height.
 */
export type KickOffset = { xPx: number; yRows: number }

/**
 * Beat B — the vertical ride, on the row's outer box so the rank travels with
 * its pill.
 *
 * The travel is on `transform`, never on the grid: every row keeps its slot and
 * only its visual y moves, which is what preserves the silent-reflow guarantee.
 * The climb's window and easing come from the shared timeline, so the attacker
 * and every sliding row move as one system — same start, same arrival, no
 * stagger.
 *
 * Rows ride to their *new* positions and hold there through the back half of
 * the sequence; the held snapshot then applies on settle, giving each ridden
 * row the grid slot its transform was already showing. `STILL` is the other
 * half of that handshake: the instant a row has no cue again, its transform is
 * zero — in the same commit that re-slots it — so the reorder and the reset
 * cannot be seen apart.
 */
export function rideMotion(rows: number, rest: Resting, timeline: KickTimeline) {
  const travel = rows * rest.height
  const ease: Easing[] = ['linear', CLIMB, 'linear']
  return {
    animate: { y: [0, 0, travel, travel] },
    transition: {
      duration: timeline.total,
      times: [0, ...timeline.at(timeline.beats.climb), 1],
      ease,
    },
  }
}

/** C's faceoff slide: accelerating out of the stack, decelerating into the square-up. */
const FACEOFF = cubicBezier(0.32, 0.72, 0.28, 1)
/** C's boot phases: accelerate into the cocked position; then ease-in only — contact at max speed. */
const WINDUP = cubicBezier(0.34, 0, 0.68, 0.6)
const SWING = cubicBezier(0.6, 0, 1, 0.5)
/** D's impact shove: accelerates out under the hit. */
const SHOVE = cubicBezier(0.3, 0, 0.6, 1)
/** D's fall and the attacker's slot-taking: gravity in, a touch of landing out. */
const GRAVITY = cubicBezier(0.4, 0, 0.7, 1)

/**
 * The attacker's whole ride, one animation per axis on the shared clock.
 *
 * y: hold, climb to one row below the defender (Beat B), then rise the last row
 * during the faceoff and hold at the defender's y for the rest of the sequence.
 * x: hold in column until the faceoff slides it out to the defender's left,
 * hold there through the windup, the strike and the knock, then take the
 * defender's vacated slot during the swap. Both axes end exactly on the grid
 * position the held snapshot re-slots this row into, which is what makes the
 * settle invisible.
 */
export function attackerRide(cue: KickCue, rest: Resting, timeline: KickTimeline) {
  const { beats } = timeline
  const climbY = cue.rows * rest.height
  const face = cue.faceoffOffset ?? { xPx: 0, yRows: 0 }
  const swap = cue.slotSwapDestination ?? { xPx: 0, yRows: 0 }
  const xEase: Easing[] = ['linear', FACEOFF, 'linear', GRAVITY, 'linear']
  const yEase: Easing[] = ['linear', CLIMB, FACEOFF, 'linear']
  return {
    animate: {
      x: [0, 0, face.xPx, face.xPx, swap.xPx, swap.xPx],
      y: [0, 0, climbY, climbY + face.yRows * rest.height, climbY + face.yRows * rest.height],
    },
    transition: {
      duration: timeline.total,
      x: {
        duration: timeline.total,
        times: [0, ...timeline.at(beats.faceoff), timeline.at(beats.swap)[0], timeline.at(beats.swap)[1], 1],
        ease: xEase,
      },
      y: {
        duration: timeline.total,
        times: [0, timeline.at(beats.climb)[0], timeline.at(beats.climb)[1], timeline.at(beats.faceoff)[1], 1],
        ease: yEase,
      },
    },
  }
}

/**
 * The defender's ride: nothing, nothing, then everything at once.
 *
 * Static through A, B and the whole of C — being hit is the first thing that
 * moves it. The knock shoves it sideways with a dip-and-recover that never
 * leaves the row; the swap drops it diagonally into the row the attacker
 * vacated in Beat B, which is exactly the slot the held snapshot assigns it.
 */
export function defenderRide(cue: KickCue, rest: Resting, timeline: KickTimeline) {
  const { beats } = timeline
  const knock = cue.knock ?? { xPx: 0, yRows: 0 }
  const fall = cue.fall ?? { xPx: 0, yRows: 0 }
  const fallY = fall.yRows * rest.height
  const xEase: Easing[] = ['linear', SHOVE, GRAVITY, 'linear']
  const yEase: Easing[] = ['linear', SHOVE, SHOVE, GRAVITY, 'linear']
  return {
    animate: {
      x: [0, 0, knock.xPx, fall.xPx, fall.xPx],
      y: [0, 0, KNOCK_DIP_PX, 0, fallY, fallY],
    },
    transition: {
      duration: timeline.total,
      x: {
        duration: timeline.total,
        times: [0, ...timeline.at(beats.knock), timeline.at(beats.swap)[1], 1],
        ease: xEase,
      },
      y: {
        duration: timeline.total,
        times: [0, ...timeline.at(beats.knock, 0.5), timeline.at(beats.swap)[1], 1],
        ease: yEase,
      },
    },
  }
}

/**
 * The boot: rotation and visibility on the one clock, like everything else.
 *
 * Invisible until the windup — the cue mounts it for the kick's whole duration
 * because the cue is pure of time, so "the boot exists only from the windup to
 * the swap's end" is a pair of step keyframes on opacity, not a mount. It cocks
 * away from the defender, swings through with no deceleration — the contact
 * frame is the moment of maximum angular velocity — and holds the follow-through
 * at +45° while the defender it just hit goes down.
 */
export function bootMotion(timeline: KickTimeline) {
  const { beats } = timeline
  const rotateEase: Easing[] = ['linear', WINDUP, SWING, 'linear']
  const windupStart = timeline.at(beats.windup)[0]
  const swapEnd = timeline.at(beats.swap)[1]
  return {
    animate: {
      rotate: [0, 0, -25, 45, 45],
      opacity: [0, 0, 1, 1, 0, 0],
    },
    transition: {
      duration: timeline.total,
      rotate: {
        duration: timeline.total,
        times: [0, windupStart, timeline.at(beats.windup)[1], timeline.at(beats.strike)[1], 1],
        ease: rotateEase,
      },
      // Duplicated times are steps: appear whole at the windup, vanish whole
      // when the follow-through ends. A boot that fades is a boot that lingers.
      opacity: {
        duration: timeline.total,
        times: [0, windupStart, windupStart, swapEnd, swapEnd, 1],
        ease: 'linear' as const,
      },
    },
  }
}

/**
 * The boot itself, anchored heel-first to the attacker's logo.
 *
 * Positioned by the same CSS tokens that lay the row out — no measurement. The
 * anchor is the logo's top-right corner: the pill sits centred in its
 * `--w-pill` track, the logo centred in the closed pill, so the corner is half
 * a logo right of and above the row's pill-track centre. `transform-origin`
 * 0% 0% pins the heel to that corner while the toe swings.
 *
 * It lives on the row, *outside* the pill: the pill's `overflow: hidden` is
 * load-bearing for the collapse, and a boot inside it would be clipped at the
 * first degree of swing.
 */
function Boot({ timeline }: { timeline: KickTimeline }) {
  return (
    <motion.img
      src="/assets/boot.png"
      alt=""
      {...bootMotion(timeline)}
      style={{
        position: 'absolute',
        left: `calc(var(--s-3) + var(--w-rank) + var(--s-3) + var(--w-pill) / 2 + ${LOGO / 2}px)`,
        top: `calc(var(--h-row) / 2 - ${LOGO / 2}px)`,
        height: BOOT_HEIGHT_PX,
        width: 'auto',
        transformOrigin: '0% 0%',
        // Above both pills: the attacker's row is later in the DOM than the
        // defender's, so the row already paints over it; this lifts the boot
        // over the attacker's own pill as well.
        zIndex: 2,
        pointerEvents: 'none',
      }}
    />
  )
}

const STILL = { animate: { x: 0, y: 0 }, transition: { duration: 0 } } as const

export function VenturePill({
  team,
  rank,
  cue,
  onSettled,
}: {
  team: Team
  rank: number
  /** Set only while this row is in a kick. Absent means an ordinary, inert row. */
  cue?: KickCue
  /** Called once, by the attacker's row, when the last beat finishes. */
  onSettled?: () => void
}) {
  const podium = rank <= 3
  const hot = team.todayRevenue >= HOT_TODAY_MIN
  // Rows without a cue carry no animation at all — during most kicks that is
  // most of the board. Only the two contestants collapse, and only the rows the
  // brain cued ride vertically, for exactly as long as the kick lasts.
  const [pillRef, rest] = useRestingPill()
  // Non-null exactly while this row is a contestant: the clock its A and E run on.
  const collapse = cue !== undefined && cue.role !== undefined ? cue.timeline : null
  const fade = collapse === null ? {} : fadeMotion(collapse)
  const pill = collapse === null || rest === null ? {} : pillMotion(rest, collapse)
  const detail = collapse === null || rest === null ? {} : detailMotion(rest, collapse)
  // `STILL`, not `{}`, for every row not currently riding: the reset to x/y 0
  // has to land in the same commit as the settle's re-slot — see `rideMotion`.
  // Contestants get their full strike-and-fall rides; the rows between get the
  // one-row slide; everyone else holds.
  const ride =
    cue === undefined || rest === null
      ? STILL
      : cue.role === 'attacker'
        ? attackerRide(cue, rest, cue.timeline)
        : cue.role === 'defender'
          ? defenderRide(cue, rest, cue.timeline)
          : cue.rows !== 0
            ? rideMotion(cue.rows, rest, cue.timeline)
            : STILL

  /**
   * The kick is over when this row's animation is, reported by the animation
   * itself.
   *
   * The component-level `onAnimationComplete`, not the transition-level
   * `onComplete`: the latter was measured never firing at all once the
   * transition carried per-property overrides, which wedged the queue with
   * `playing` pinned and nothing on screen progressing. This fires on an
   * animation whose keyframes are constants — 1, 0, 0, 1 — so it cannot resolve
   * early on an event whose values happen not to vary, which was the second
   * failure in the same place.
   */
  const attacker = cue?.role === 'attacker'
  const reportSettled = attacker ? onSettled : undefined

  /**
   * The deadlock guard. `onSettled` is the only thing standing between the
   * queue and a wedge: if this row unmounts before its animation completes —
   * the rotation moving on mid-kick, or an animation that never ran because
   * `rest` had not landed — nothing would ever report the kick finished and
   * `playing` would pin forever. The cleanup reports it instead. Idempotent by
   * construction: settling an already-settled kick is a no-op, so the normal
   * path calling both is harmless. Defence for the ordering assumption, not a
   * second completion path — when the animation runs, the animation reports.
   */
  useEffect(() => {
    if (!attacker) return
    return () => onSettled?.()
  }, [attacker, onSettled])

  return (
    // `position: relative`: the boot anchors to this box. Stated even though a
    // transform would establish the containing block anyway, because `STILL`
    // resolves to no transform at rest and the anchor must not depend on which.
    <motion.div {...ride} style={{ ...ROW_OUTER, height: 'var(--h-row)', position: 'relative' }}>
      {cue?.boot === true && <Boot timeline={cue.timeline} />}
      <motion.span
        {...fade}
        className="tv-figure"
        style={{
          font: 'var(--t-tv-row-rank)',
          color: podium ? 'var(--tangerine-600)' : 'var(--fg-muted)',
          textAlign: 'right',
        }}
      >
        {rank}
      </motion.span>

      <motion.div ref={pillRef} {...pill} className="tv-pill" style={PILL_INNER}>
        {/* Above the details in paint order. The logo crosses them on its way
            to the centre, and a number sitting on top of a venture's mark reads
            as a rendering fault. */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <VentureLogo team={team} size={LOGO} />
        </div>

      <motion.span
        {...detail}
        onAnimationComplete={reportSettled}
        style={{
          font: 'var(--t-tv-row-name)',
          color: 'var(--fg1)',
          // A name too long for its column is clipped, not wrapped: every row is
          // a fixed height and a wrapped name would push forty rows down.
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {team.ventureName || team.teamId}
      </motion.span>

      <motion.span
        {...detail}
        className="tv-figure"
        style={{
          font: 'var(--t-tv-row-week)',
          color: 'var(--fg1)',
          textAlign: 'right',
        }}
      >
        {/* Blank, not ₹0 — the same rule as the today column, and for the same
            reason. In week 4 only five of forty teams have sold anything this
            week, so printing the zero would set thirty-five identical figures
            down the board and teach the eye to skip the column that matters. */}
        {team.weekRevenue > 0 ? formatRupees(team.weekRevenue) : ''}
      </motion.span>

      <motion.span
        {...detail}
        className="tv-figure"
        style={{
          font: hot ? 'var(--t-tv-row-today-hot)' : 'var(--t-tv-row-today)',
          color: hot ? HOT : 'var(--fg-muted)',
          textAlign: 'right',
        }}
      >
        {/* A team that has not sold today shows nothing rather than ₹0. Forty
            rows of ₹0 every morning is noise, and the column is there to say
            who is moving today — silence is the honest answer for the rest. */}
        {team.todayRevenue > 0 ? formatRupees(team.todayRevenue) : ''}
        </motion.span>
      </motion.div>
    </motion.div>
  )
}
