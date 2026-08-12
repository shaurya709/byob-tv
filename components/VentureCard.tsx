import { HOT_TODAY_MIN } from '@/config'
import { VentureLogo } from '@/components/VentureLogo'
import { VentureName } from '@/components/VentureName'
import { formatRupees } from '@/lib/format'
import type { Team } from '@/lib/types'

/**
 * One team's card. Forty of these are on screen at once.
 *
 * Top half the mark, bottom half the name and both revenue figures, with the
 * rank badge in the top-left corner overlaying the logo.
 *
 * ── The text block is a fixed height; the logo half absorbs the ramp ──
 *
 * Row heights descend from row 1 to row 4, and *all* of that variance lands on
 * the mark. The name and both figures are the same size on rank 1 and rank 40.
 *
 * That is the design rule "if the bottom half is tight, take the space from the
 * logo half, never from a figure" expressed as geometry rather than as care: no
 * per-row type ramp exists to get wrong, and the row-4 floor is one subtraction
 * instead of a negotiation. It also keeps forty cards reading as one system —
 * only the marks change scale, which is the thing that can afford to.
 *
 * ── Only one thing is ever emphasised ──
 *
 * A strong day, today ≥ ₹5,000. Everything else — the rank badge included, rank
 * 1 the same as rank 40 — is one uniform treatment. With forty cards on a wall,
 * a second emphasis would mean nothing is emphasised.
 */

/**
 * `--green-600`, not `--bright-green`, for a strong day.
 *
 * On this wall's white surface `#6ED190` measures about 1.9:1 — invisible from a
 * corridor — because the token was drawn for dark marketing surfaces.
 * `--green-600` is the same hue one step deeper and is an existing brand token.
 */
const HOT = 'var(--green-600)'

export function VentureCard({ team, rank }: { team: Team; rank: number }) {
  const hot = team.todayRevenue >= HOT_TODAY_MIN

  return (
    <div
      className="tv-card"
      style={{
        // The card fills its grid cell; the cell's height is the row's, set once
        // per row by the grid. Nothing here knows which row it is in.
        height: '100%',
        display: 'grid',
        gridTemplateRows: `minmax(0, 1fr) var(--h-card-text)`,
        // **No padding on the card.** The green panel has to reach the card's
        // own edges, and a padded card would leave a white gutter around it that
        // reads as a swatch laid on the card rather than as the card's top half.
        // The text block carries its own padding instead.
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Board apparatus, not the team's. Constant size across the ramp, and one
          colour for all forty — a badge that changed at rank 3 would be a second
          emphasis system competing with the hot-day rule.

          **Opaque, with its own border.** It was first drawn as charcoal type on
          the card's own translucent stroke colour, which is invisible the moment
          it lands on a dark mark — measured on the live board at ranks 10, 11,
          24, 28, 33, 34 and 37, every one of them a black or near-black logo. It
          sits *over* forty unknown images, so it cannot borrow contrast from what
          is behind it: the fill is solid and the hairline is what keeps it
          legible on the pale marks the solid fill would otherwise disappear into. */}
      <div
        style={{
          position: 'absolute',
          top: 'var(--s-card-inset)',
          left: 'var(--s-card-inset)',
          minWidth: 'var(--d-card-badge)',
          height: 'var(--d-card-badge)',
          paddingInline: 'calc(var(--d-card-badge) * 0.22)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 'var(--radius-xs)',
          background: 'var(--white)',
          border: 'var(--stroke-hair) solid var(--border)',
          color: 'var(--midnight-charcoal)',
          font: 'var(--t-tv-card-rank)',
          zIndex: 1,
        }}
      >
        {rank}
      </div>

      {/* The mark, centred in whatever height this row leaves it. Square and
          height-bound: a contained logo is min(cardWidth, thisHeight) and at a
          171.6px card this is always the smaller, so `--d-card-logo` is the
          real diameter. Checking the *width* against the ~50px threshold would
          pass trivially while the mark sat under it — see the correction in
          docs/superpowers/specs/2026-08-12-weekly-card-grid.md §1. */}
      <div className="tv-card-panel" style={{ display: 'grid', placeItems: 'center', minHeight: 0 }}>
        <div className="tv-card-mark">
          <VentureLogo team={team} size="var(--d-card-logo)" />
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateRows: 'auto auto auto',
          alignContent: 'center',
          justifyItems: 'center',
          gap: 'calc(var(--s-1) / 2)',
          minWidth: 0,
          paddingInline: 'var(--s-card-inset)',
        }}
      >
        {/* An unnamed team shows its Team ID. It is identity, not a missing
            field — and with most of the cohort unnamed, a blank here would make
            the board look unfinished rather than quiet. `ventureNameOf` has
            already turned the workbook template's placeholder into an empty
            string, so this never prints "Type your venture name". */}
        <div
          style={{
            font: 'var(--t-tv-card-name)',
            color: 'var(--fg-muted)',
            width: '100%',
            minWidth: 0,
          }}
        >
          <VentureName name={team.ventureName || team.teamId} />
        </div>

        {/* The figure the board exists to show, and the largest thing on the
            card. Blank, never ₹0: in week 4 only five of forty teams have sold
            anything this week, and forty identical zeroes would teach the eye to
            skip the column that matters. */}
        <div
          className="tv-figure"
          style={{ font: 'var(--t-tv-card-week)', color: 'var(--fg1)' }}
        >
          {team.weekRevenue > 0 ? formatRupees(team.weekRevenue) : '—'}
        </div>

        {/* Today, carrying the wall's one emphasis.

            **Labelled, because the card has no column headings.** The list this
            replaced put "This week" and "Today" above the two figure columns; a
            card has nowhere to put them, so two bare rupee amounts on one card
            would give a passer-by no way to know which is which. The label rides
            the figure instead of sitting above the board.

            It appears only when there is a figure. A permanent "TODAY" caption
            over an empty line is apparatus describing absence, and today it
            would be describing it on all forty cards — the live feed currently
            has zero teams with a today figure at all.

            Blank rather than ₹0, for the same reason as the week: silence is the
            honest answer for a team that has not sold today. */}
        <div
          className="tv-figure"
          style={{
            font: hot ? 'var(--t-tv-card-today-hot)' : 'var(--t-tv-card-today)',
            color: hot ? HOT : 'var(--fg-muted)',
            // Reserved whether or not there is a figure, so the week revenue
            // sits on one line across all forty cards instead of dropping half a
            // line on the thirty-five teams that have not traded today.
            minHeight: '1em',
            display: 'flex',
            alignItems: 'baseline',
            gap: 'calc(var(--s-1) * 0.75)',
          }}
        >
          {team.todayRevenue > 0 && (
            <>
              <span
                style={{
                  font: 'var(--t-tv-card-label)',
                  letterSpacing: 'var(--track-overline)',
                  textTransform: 'uppercase',
                  color: 'var(--fg-muted)',
                }}
              >
                Today
              </span>
              {formatRupees(team.todayRevenue)}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
