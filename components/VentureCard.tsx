import { HOT_TODAY_MIN } from '@/config'
import { VentureDisc } from '@/components/VentureDisc'
import { VentureName } from '@/components/VentureName'
import { formatRupees } from '@/lib/format'
import type { Team } from '@/lib/types'

/**
 * One team's card: a base carrying the team's details, with the venture's mark
 * floating as a disc above it.
 *
 * ── There is no logo panel any more ──
 *
 * The mark used to sit inside a Deep Forest Green section filling the card's top
 * half. The disc replaced it: the card is now the base, and the mark hovers over
 * it on the page's own white.
 *
 * That removal also settled a defect the panel had created. Two of
 * `VentureLogo`'s six identity tints are Deep Forest Green and Deep Teal — the
 * panel's own colour and its neighbour — so four teams without artwork had discs
 * that could not be seen against it, and they needed a mint hairline to have any
 * edge at all. On white every tint reads, and the hairline is gone with the
 * panel that made it necessary.
 *
 * ── The base is a fixed height; the disc absorbs the ramp ──
 *
 * Row heights descend from row 1 to row 4 and *all* of that variance lands on
 * the mark. The name and both figures are the same size on rank 1 and rank 40,
 * so forty cards read as one system and only the marks change scale.
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

export function VentureCard({
  team,
  rank,
  idle,
  delaySeconds,
}: {
  team: Team
  rank: number
  /** An idle timeline class. Only row 1 gets one; the other thirty hold still. */
  idle?: string
  /** Phase offset, so ten marks on one row never fall into step. */
  delaySeconds?: number
}) {
  const hot = team.todayRevenue >= HOT_TODAY_MIN

  return (
    <div
      // Named so `scripts/measure-fit.mjs` can find the grid's true top edge.
      // The cell is what starts at the row's top; `.tv-card` is now only the
      // base at its bottom, and measuring that reported 207px of header
      // clearance on a grid whose real top was 24px below it.
      className="tv-card-cell"
      style={{
        height: '100%',
        position: 'relative',
      }}
    >
      {/* Board apparatus, not the team's. It sits on the *cell*, deliberately
          outside the animated disc: rank is a fact about the board, and a rank
          number that bobbed along with the mark would read as part of the
          venture rather than as the leaderboard's own label.

          Opaque with its own hairline, because it lands on the disc for row 1 —
          where the disc nearly fills the card — and on white for row 4, and it
          has to stay legible on both without knowing which it got. */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
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
          zIndex: 2,
        }}
      >
        {rank}
      </div>

      {/* The disc, centred over the base and lifted clear of it. Its bottom sits
          `--s-card-lift` above the base's top edge — small, because the shadow
          is what says "floating" and distance on its own just reads as a gap. */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: `calc(var(--h-card-text) + var(--s-card-lift))`,
          display: 'grid',
          placeItems: 'center',
          // **On the disc's direct parent, not on the cell.** `perspective`
          // applies only to an element's own children, so one level further up
          // it does nothing and the look-down renders orthographically — a flat
          // squash rather than a mark tipping its face forward. Measured while
          // it sat on the cell: the disc's height was exactly cos(30°) of its
          // width, which is the signature of no perspective at all. `/podium`
          // carries the same note for the same reason.
          perspective: '900px',
        }}
      >
        <VentureDisc team={team} idle={idle} delaySeconds={delaySeconds} />
      </div>

      {/* The base. This is the card now — the fill, the border and the radius
          are all here rather than around the whole cell. */}
      <div
        className="tv-card"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: 'var(--h-card-text)',
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
            card. Blank, never ₹0: in week 4 only sixteen of forty teams have
            sold anything this week, and forty identical zeroes would teach the
            eye to skip the column that matters. */}
        <div className="tv-figure" style={{ font: 'var(--t-tv-card-week)', color: 'var(--fg1)' }}>
          {team.weekRevenue > 0 ? formatRupees(team.weekRevenue) : '—'}
        </div>

        {/* Today, carrying the wall's one emphasis.

            **Labelled, because the card has no column headings.** The list this
            replaced put "This week" and "Today" above the two figure columns; a
            card has nowhere to put them, so two bare rupee amounts on one card
            would give a passer-by no way to know which is which.

            It appears only when there is a figure. A permanent "TODAY" caption
            over an empty line is apparatus describing absence, and on a quiet
            morning it would be describing it on all forty cards. */}
        <div
          className="tv-figure"
          style={{
            font: hot ? 'var(--t-tv-card-today-hot)' : 'var(--t-tv-card-today)',
            color: hot ? HOT : 'var(--fg-muted)',
            // Reserved whether or not there is a figure, so the week revenue
            // sits on one line across all forty cards instead of dropping half a
            // line on the teams that have not traded today.
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
