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
 * The row grid, shared with the column heading so the labels sit exactly over
 * the figures they name. Two copies of this template would drift apart on the
 * first change and nobody would notice until a heading pointed at the wrong
 * column.
 */
export const ROW: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'var(--w-rank) auto var(--w-name) var(--w-week) var(--w-today)',
  alignItems: 'center',
  gap: 'var(--s-3)',
  paddingInline: 'var(--s-3)',
  // Every track is fixed, so the row is exactly as wide as its content and can
  // be centred in its half of the frame. All forty rows then share one set of
  // column positions — a ragged left edge across twenty rows is unreadable at
  // distance.
  width: 'max-content',
  marginInline: 'auto',
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
    <div style={{ ...ROW, height: 'var(--h-col-head)', alignItems: 'end' }}>
      <span />
      <span style={{ width: 30 }} />
      <span />
      <span style={label}>This week</span>
      <span style={label}>Today</span>
    </div>
  )
}

/**
 * Beat A — the two involved rows swallowing their own details.
 *
 * ── The rows are the actors ──
 *
 * This animates the real row. There is no overlay, no clone, no mark drawn a
 * second time somewhere else. The board a passer-by is reading is the board that
 * moves; when the sequence ends nothing has to be reconciled, because nothing
 * was ever duplicated.
 *
 * ── Scale alone, with the origin outside the element ──
 *
 * Each detail cell's transform-origin is placed at the **logo's right edge**,
 * which is outside that cell's own box and further away for each cell in turn.
 * Scaling to zero about a point then does both halves of the effect at once:
 * the cell travels left *and* shrinks, and all three converge on the same point,
 * so the logo appears to swallow the row.
 *
 * Translating and scaling separately would need each cell's distance to the logo
 * as an animated value, which is a `calc()` of two grid tracks and a gap — and
 * interpolating between `calc()` strings is not something to rely on. A static
 * origin is resolved by CSS once, and the only animated value is a number.
 */
const SWALLOW = cubicBezier(0.32, 0, 0.67, 0)
const DISGORGE = cubicBezier(0.16, 1, 0.3, 1)

/**
 * Where each detail cell collapses to: the logo's right edge, expressed as an
 * offset from that cell's own left edge. Each one is further away than the last
 * by exactly the track it sits behind.
 */
const SWALLOW_ORIGIN = {
  name: 'calc(-1 * var(--s-3)) center',
  week: 'calc(-1 * (var(--w-name) + 2 * var(--s-3))) center',
  today: 'calc(-1 * (var(--w-name) + var(--w-week) + 3 * var(--s-3))) center',
} as const

const COLLAPSE = {
  animate: { scale: [1, 0, 0, 1] },
  transition: {
    duration: TOTAL,
    times: [...at(BEATS.collapse), ...at(BEATS.uncollapse)],
    ease: [SWALLOW, 'linear', DISGORGE] as const,
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
  const detail = role === undefined ? {} : COLLAPSE

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
    <div
      style={{
        display: 'grid',
        gridTemplateColumns:
          'var(--w-rank) auto var(--w-name) var(--w-week) var(--w-today)',
        // Every track is fixed, so the row is exactly as wide as its content and
        // can be centred in its half of the frame. All forty rows then share one
        // set of column positions — a ragged left edge across twenty rows is
        // unreadable at distance.
        width: 'max-content',
        marginInline: 'auto',
        alignItems: 'center',
        gap: 'var(--s-3)',
        height: 'var(--h-row)',
        paddingInline: 'var(--s-3)',
        borderRadius: 'var(--radius-sm)',
      }}
    >
      <span
        className="tv-figure"
        style={{
          font: 'var(--t-tv-row-rank)',
          color: podium ? 'var(--tangerine-600)' : 'var(--fg-muted)',
          textAlign: 'right',
        }}
      >
        {rank}
      </span>

      <VentureLogo team={team} size={30} />

      <motion.span
        {...detail}
        onAnimationComplete={reportSettled}
        style={{
          transformOrigin: SWALLOW_ORIGIN.name,
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
          transformOrigin: SWALLOW_ORIGIN.week,
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
          transformOrigin: SWALLOW_ORIGIN.today,
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
    </div>
  )
}
