import { HOT_TODAY_MIN } from '@/config'
import { VentureLogo } from '@/components/VentureLogo'
import { formatRupees } from '@/lib/format'
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

export function VenturePill({ team, rank }: { team: Team; rank: number }) {
  const podium = rank <= 3
  const hot = team.todayRevenue >= HOT_TODAY_MIN

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

      <span
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
      </span>

      <span
        className="tv-figure"
        style={{ font: 'var(--t-tv-row-week)', color: 'var(--fg1)', textAlign: 'right' }}
      >
        {/* Blank, not ₹0 — the same rule as the today column, and for the same
            reason. In week 4 only five of forty teams have sold anything this
            week, so printing the zero would set thirty-five identical figures
            down the board and teach the eye to skip the column that matters. */}
        {team.weekRevenue > 0 ? formatRupees(team.weekRevenue) : ''}
      </span>

      <span
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
      </span>
    </div>
  )
}
