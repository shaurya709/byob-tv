import { useLayoutEffect, useRef, useState } from 'react'
import { cubicBezier, motion } from 'motion/react'

import { HOT_TODAY_MIN } from '@/config'
import { VentureLogo } from '@/components/VentureLogo'
import { formatRupees } from '@/lib/format'
import { BEATS, TOTAL, at } from '@/lib/kickTimeline'
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

/** Beat A's window, the hold between, then Beat E's. Shared by every property. */
const WINDOW = [...at(BEATS.collapse), ...at(BEATS.uncollapse)]
const EASE = [SWALLOW, 'linear', DISGORGE] as const

/** The closed pill: the logo, and an even hair either side of it. */
const LOGO = 30
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
 * So the four animated values are plain numbers, and the one number that has to
 * come from the browser is taken **once, at mount** — long before any kick, and
 * never during one. No layout is read while an animation is running.
 */
type Resting = { width: number; pad: number; border: number }

function useRestingPill(): [React.RefObject<HTMLDivElement | null>, Resting | null] {
  const ref = useRef<HTMLDivElement>(null)
  const [rest, setRest] = useState<Resting | null>(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (el === null) return
    // A mount-only read of layout that the animation config needs before it can
    // exist. It runs once per row, at page load, and never while a kick plays.
    const cs = getComputedStyle(el)
    setRest({
      width: el.getBoundingClientRect().width,
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

function pillMotion(rest: Resting) {
  const closed = closedWidth(rest)
  const centred = (rest.width - closed) / 2
  return {
    animate: {
      width: [rest.width, closed, closed, rest.width],
      paddingLeft: [rest.pad, CLOSED_PAD, CLOSED_PAD, rest.pad],
      paddingRight: [rest.pad, CLOSED_PAD, CLOSED_PAD, rest.pad],
      x: [0, centred, centred, 0],
    },
    transition: { duration: TOTAL, times: WINDOW, ease: EASE },
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
function detailMotion(rest: Resting) {
  const held = -(rest.width - closedWidth(rest)) / 2
  return {
    animate: { opacity: [1, 0, 0, 1], x: [0, held, held, 0] },
    transition: { duration: TOTAL, times: WINDOW, ease: EASE },
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
const FADE = {
  animate: { opacity: [1, 0, 0, 1] },
  transition: {
    duration: TOTAL,
    // The rank is outside the pill, so nothing clips it — it fades on the same
    // window as everything else so the row leaves as one thing.
    times: WINDOW,
    ease: EASE,
  },
} as const

export type PillRole = 'attacker' | 'defender'

export function VenturePill({
  team,
  rank,
  role,
  onSettled,
}: {
  team: Team
  rank: number
  /** Set only while this row is in a kick. Absent means an ordinary, inert row. */
  role?: PillRole
  /** Called once, by the attacker's row, when the last beat finishes. */
  onSettled?: () => void
}) {
  const podium = rank <= 3
  const hot = team.todayRevenue >= HOT_TODAY_MIN
  // Thirty-eight rows are plain spans with no animation attached at all. Only the
  // two in the contest become motion elements, and only while it lasts.
  const [pillRef, rest] = useRestingPill()
  const fade = role === undefined ? {} : FADE
  const pill = role === undefined || rest === null ? {} : pillMotion(rest)
  const detail = role === undefined || rest === null ? {} : detailMotion(rest)

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
  const reportSettled = role === 'attacker' ? onSettled : undefined

  return (
    <div style={{ ...ROW_OUTER, height: 'var(--h-row)' }}>
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
    </div>
  )
}
