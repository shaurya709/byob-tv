'use client'

import { VentureLogo } from '@/components/VentureLogo'
import { formatRupees } from '@/lib/format'
import type { Team } from '@/lib/types'

/**
 * Slide 1 — the absolute leaderboard: a crowned tile flanked by second and
 * third, over a strip carrying ranks 4–10.
 *
 * **First place is the anchor and everything else is subordinate to it.** It is
 * the only dark mass on the frame, the only tile with a full-bleed brand
 * surface, and the tallest thing on the board. Rank is carried three ways at
 * once — surface, size, and position on a shared baseline — so a phone photo of
 * one corner still ranks and greyscale compression cannot take it away.
 *
 * **No `layout` prop, and nothing animated at all.** The strip's rows are the
 * same pill the weekly board uses, but they are inert here: this slide is at
 * rest, and the boot kick lands on it in a later commit.
 */

const TOP = 10
const PODIUM_PLACES = 3

/**
 * The strip's mark, matching the weekly board's row exactly. Ranks 4–10 sit at
 * the same scale as every row on `/weekly`, which is the point — the audience
 * has to read the two slides as one board showing two figures.
 */
const STRIP_LOGO = 30

/**
 * Who is on the board.
 *
 * The top ten of whatever it is handed, and nothing else. **The three tiles
 * render whether or not anyone is trading**: a podium with second and third
 * missing tells a passer-by the wall is broken, where three tiles reading "—"
 * tell them the cohort has not started. Filtering the spares and ranking are
 * both the caller's job — this component ranks nothing, so the sort stays the
 * single authority on order.
 */
export function podiumTeams(ranked: readonly Team[]): Team[] {
  return ranked.slice(0, TOP)
}

/**
 * An em dash, not `₹0`.
 *
 * Zero is a figure, and a tile carrying one asserts that the team traded and
 * earned nothing. Before the cohort opens that is false for all forty of them.
 * The dash says "no figure yet", which is the only true thing available.
 */
function revenueOf(team: Team | undefined): string {
  if (team === undefined || team.totalRevenue <= 0) return '—'
  return formatRupees(team.totalRevenue)
}

function nameOf(team: Team | undefined): string {
  if (team === undefined) return ''
  return team.ventureName || team.teamId
}

/**
 * "TOTAL REVENUE", over every figure on the slide.
 *
 * `/podium` ranks on all-time revenue and `/weekly` on the week's, and the two
 * slides rotate on the same screen minutes apart. Without this the only
 * difference between them is which numbers happen to be larger. Same size and
 * same treatment as the weekly board's column headings, so it reads as the same
 * piece of apparatus rather than as a second labelling system.
 */
function Caption({ tone }: { tone: string }) {
  return (
    <span
      style={{
        font: 'var(--t-tv-podium-label)',
        letterSpacing: 'var(--track-overline)',
        textTransform: 'uppercase',
        color: tone,
      }}
    >
      Total revenue
    </span>
  )
}

/**
 * A name too long for its tile is clipped, not wrapped.
 *
 * Every tile is a fixed height with a fixed stack inside it, so a second line
 * would push the figure below it out of the tile — and the figure is the reason
 * the tile exists. `minWidth: 0` is what actually lets the clip happen: this is
 * a flex child, whose automatic minimum size is its content, so without it the
 * element grows past the tile instead of truncating inside it.
 */
function TileName({ team, font, tone }: { team: Team | undefined; font: string; tone: string }) {
  return (
    <span
      style={{
        font,
        color: tone,
        textAlign: 'center',
        width: '100%',
        minWidth: 0,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}
    >
      {nameOf(team)}
    </span>
  )
}

/**
 * One podium tile.
 *
 * The two variants differ only in surface and scale, so they are one component:
 * a crown and a flank that drifted apart would be the first thing to go wrong
 * on this slide, and nobody watching a wall would report it.
 *
 * The empty box where a logo would go is deliberate. It holds the stack's
 * geometry steady between "no feed yet" and the first snapshot, so the tile
 * does not visibly reassemble itself on the wall's first paint — and it is
 * empty rather than a placeholder mark, because a grey circle is filler and
 * this wall does not carry any.
 */
function Tile({
  team,
  place,
  crown,
}: {
  team: Team | undefined
  place: number
  /** First place: the dark surface, the larger scale, and the head above the rest. */
  crown: boolean
}) {
  const logo = crown ? 120 : 90
  return (
    <div
      className={crown ? 'theme-teal tv-podium-crown' : 'tv-podium-flank'}
      style={{
        width: crown ? 'var(--w-podium-1)' : 'var(--w-podium-2)',
        height: crown ? 'var(--h-podium-1)' : 'var(--h-podium-2)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: crown ? 'var(--s-4)' : 'var(--s-3)',
        padding: 'var(--s-5)',
        // The tile is a fixed box and the stack inside it is measured to fit;
        // this is the guarantee that a surprise — a font that loads a step
        // heavier, a figure one digit longer — is clipped by the tile rather
        // than spilling onto the tile beside it.
        overflow: 'hidden',
      }}
    >
      <span
        className="tv-figure"
        style={{
          font: crown ? 'var(--t-tv-podium-rank-1)' : 'var(--t-tv-podium-rank-2)',
          // Tangerine Glow on the dark tile, Deep Teal on the light ones: the
          // numeral is the loudest mark in each tile, and on the crown it is
          // the one warm thing on the whole frame.
          color: crown ? 'var(--tangerine-glow)' : 'var(--deep-teal)',
        }}
      >
        {place}
      </span>

      {team === undefined ? (
        <div style={{ width: logo, height: logo }} />
      ) : (
        <VentureLogo team={team} size={logo} />
      )}

      <TileName
        team={team}
        font={crown ? 'var(--t-tv-podium-name-1)' : 'var(--t-tv-podium-name-2)'}
        // `--fg1` under `.theme-teal` is white; on a white tile it is Midnight
        // Charcoal, so the flanks name Deep Teal explicitly. The brief asks for
        // Deep Teal type and for the crown's text to be light — on a Deep Teal
        // surface only one of those can hold, and legibility is the one that
        // matters at six metres.
        tone={crown ? 'var(--fg1)' : 'var(--deep-teal)'}
      />

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'var(--s-1)',
        }}
      >
        {/* Mint 300 on the dark tile — `--fg3` under `.theme-teal` — rather
            than the muted teal the light tiles use, which measures about 3.8:1
            on Deep Teal and disappears down a corridor. */}
        <Caption tone={crown ? 'var(--fg3)' : 'var(--fg-muted)'} />
        <span
          className="tv-figure"
          style={{
            font: crown ? 'var(--t-tv-podium-figure-1)' : 'var(--t-tv-podium-figure-2)',
            color: 'var(--tangerine-600)',
          }}
        >
          {revenueOf(team)}
        </span>
      </div>
    </div>
  )
}

/**
 * The three tiles, on one baseline.
 *
 * `flex-end` is what makes this a podium: the flanks are 80px shorter than the
 * crown, so aligning the bottoms puts their top edges 80px lower without either
 * offset being written down anywhere. Second on the left and third on the
 * right, reading outward from the centre — the arrangement everyone already
 * knows from a real podium, so nobody has to work out the order.
 */
function PodiumBand({ places }: { places: (Team | undefined)[] }) {
  const [first, second, third] = places
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        gap: 'var(--s-podium-gap)',
      }}
    >
      <Tile team={second} place={2} crown={false} />
      <Tile team={first} place={1} crown />
      <Tile team={third} place={3} crown={false} />
    </div>
  )
}

/**
 * The strip's row geometry, the weekly board's `ROW_OUTER` and `PILL_INNER` at
 * podium dimensions.
 *
 * Same arithmetic — rank track, pill track, and the three gaps around them —
 * so the rank sits *outside* the pill here exactly as it does on `/weekly`, and
 * the pill's own left edge is where the logo starts. The only thing that
 * changes is the width the pill is asked to fill: `--w-podium-pill` is derived
 * from the podium band's extent, so the strip's ends land under the outer edges
 * of second and third place.
 *
 * They are not imported from `VenturePill` because that row carries the kick's
 * whole animation surface and four columns this slide does not have. Sharing
 * the *tokens* is what keeps the two boards honest; sharing the component would
 * mean threading a second geometry through every beat of the kick.
 */
const STRIP_OUTER: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'var(--w-rank) auto',
  alignItems: 'center',
  gap: 'var(--s-3)',
  paddingInline: 'var(--s-3)',
  width: 'calc(var(--w-rank) + var(--w-podium-pill) + 3 * var(--s-3))',
  marginInline: 'auto',
}

const STRIP_INNER: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: `${STRIP_LOGO}px minmax(0, 1fr) var(--w-podium-total)`,
  alignItems: 'center',
  gap: 'var(--s-3)',
  paddingInline: 'var(--s-3)',
  height: '100%',
  overflow: 'hidden',
}

/**
 * Ranks 4–10.
 *
 * Seven rows, not the seven side-by-side tiles this slide used to carry: a row
 * is the shape the audience already reads on `/weekly`, and a horizontal strip
 * made ranks 4 and 10 look like peers of each other rather than a descending
 * list. The venture name comes back at this size too — the row is wide enough
 * to carry it, and a rank with no name on it is a number about nobody.
 */
function Strip({ teams, fromRank }: { teams: readonly Team[]; fromRank: number }) {
  // An empty strip carries no heading. Apparatus describing absence is the same
  // filler as a "no data" message, in a smaller typeface.
  if (teams.length === 0) return null

  return (
    <div style={{ display: 'grid', gridAutoRows: 'var(--h-row)', alignContent: 'start' }}>
      {/* The caption sits over the figures it names, on the strip's own grid,
          for the reason the weekly board's headings do: two copies of this
          template would drift apart on the first change and nobody would notice
          until a label pointed at the wrong column. */}
      <div style={{ ...STRIP_OUTER, height: 'var(--h-col-head)', alignItems: 'end' }}>
        <span />
        <div style={{ ...STRIP_INNER, alignItems: 'end' }}>
          <span />
          <span />
          <span style={{ textAlign: 'right' }}>
            <Caption tone="var(--fg-muted)" />
          </span>
        </div>
      </div>

      {teams.map((team, index) => (
        <div key={team.teamId} style={{ ...STRIP_OUTER, height: 'var(--h-row)' }}>
          <span
            className="tv-figure"
            style={{
              font: 'var(--t-tv-row-rank)',
              // One colour for all seven, matching the weekly board's ranks
              // exactly. The rank is board apparatus, not a tier.
              color: 'var(--midnight-charcoal)',
              textAlign: 'right',
            }}
          >
            {fromRank + index}
          </span>

          <div className="tv-pill" style={STRIP_INNER}>
            <VentureLogo team={team} size={STRIP_LOGO} />
            <span
              style={{
                font: 'var(--t-tv-podium-row-name)',
                color: 'var(--fg1)',
                textAlign: 'center',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {team.ventureName || team.teamId}
            </span>
            <span
              className="tv-figure"
              style={{
                font: 'var(--t-tv-podium-row-figure)',
                color: 'var(--tangerine-600)',
                textAlign: 'right',
              }}
            >
              {revenueOf(team)}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

export function Podium({ ranked }: { ranked: readonly Team[] }) {
  const visible = podiumTeams(ranked)
  // Explicit indices, not a destructure of `visible`: the three tiles have to
  // exist before the feed does, and `slice` on an empty list yields nothing to
  // destructure. `undefined` is the tile's empty state, and it is a real one.
  const places = [visible[0], visible[1], visible[2]]

  return (
    <div
      style={{
        display: 'grid',
        // The band, the breathing room between, and the strip. `alignContent`
        // centres the three in whatever height the frame leaves, which is where
        // the slide's resting margin comes from — it is not padding anyone had
        // to measure.
        gridTemplateRows: 'auto auto',
        alignContent: 'center',
        gap: 'var(--s-10)',
        height: '100%',
      }}
    >
      <PodiumBand places={places} />
      <Strip teams={visible.slice(PODIUM_PLACES)} fromRank={PODIUM_PLACES + 1} />
    </div>
  )
}
