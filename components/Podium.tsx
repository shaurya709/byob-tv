'use client'

import { VentureLogo } from '@/components/VentureLogo'
import { formatRupees } from '@/lib/format'
import { hashTeamId } from '@/lib/seed'
import type { Team } from '@/lib/types'

/**
 * Slide 1 — the absolute leaderboard: three pillars, and ranks 4–10 below.
 *
 * Each venture's mark stands on a column with a capital and a base, and idles
 * there. **The three pillars are identical in size.** Rank is carried by the
 * green ramp, by the mark's diameter and by the numeral — never by height.
 * Three tiles of unequal height was the previous design, and with nothing
 * underneath them they read as three unrelated cards rather than as a podium.
 *
 * ── What this deliberately spends ──
 *
 * This wall's rule is that movement means something happened, and the whole
 * overtake kick rests on it. A permanently idling mark spends that rule. It
 * was chosen knowingly: the idle is slow and small where the kick is fast,
 * large and directional, so the two stay distinguishable. If the kick ever
 * stops landing once both are on screen together, the idle is what gives.
 *
 * **No `layout` prop**, here or anywhere in the board tree — there is a source
 * scan in render.test.tsx that fails the build on one. The idle is CSS
 * keyframes on `transform` alone, so it is compositor work rather than a JS
 * loop running for the weeks this page stays open without reloading.
 */

const TOP = 10
const PODIUM_PLACES = 3

/** The strip's mark, matching the weekly board's row exactly. The *scale*
    matches so the two boards feel like one wall; the decoration differs so
    they read as two different boards. */
const STRIP_LOGO = 30

/** The mark on a pillar. First place's is larger — one of the two things left
    carrying rank now that all three columns are the same height. */
const POD_LOGO_FIRST = 132
const POD_LOGO_REST = 104

const IDLE_TIMELINES = ['tv-idle-1', 'tv-idle-2', 'tv-idle-3'] as const

/**
 * Who is on the board. The top ten of whatever it is handed, and nothing else.
 *
 * The three pillars render whether or not anyone is trading: a podium with
 * second and third missing tells a passer-by the wall is broken, where three
 * pillars reading "—" tell them the cohort has not started. Filtering the
 * spares and ranking are both the caller's job — this component ranks nothing,
 * so the sort stays the single authority on order.
 */
export function podiumTeams(ranked: readonly Team[]): Team[] {
  return ranked.slice(0, TOP)
}

/**
 * An em dash, not `₹0`.
 *
 * Zero is a figure, and a pillar carrying one asserts that the team traded and
 * earned nothing. Before the cohort opens that is false for all forty of them.
 * The dash says "no figure yet", which is the only true thing available.
 */
function revenueOf(team: Team | undefined): string {
  if (team === undefined || team.totalRevenue <= 0) return '—'
  return formatRupees(team.totalRevenue)
}

/**
 * Which of the three idle timelines this mark runs.
 *
 * Seeded off the team id, so a venture always idles the same way — exactly as
 * it always gets the same tint, and for the same reason: a mark that moved
 * differently after an overtake would read as a different venture.
 */
function idleOf(team: Team | undefined, place: number): string {
  const seed = team === undefined ? place : hashTeamId(team.teamId)
  return IDLE_TIMELINES[seed % IDLE_TIMELINES.length]
}

/**
 * "TOTAL REVENUE", over every figure on the slide.
 *
 * `/podium` ranks on all-time revenue and `/weekly` on the week's, and the two
 * rotate on one screen minutes apart. Without this the only difference between
 * them is which numbers happen to be larger.
 */
function Caption({ align }: { align: 'center' | 'right' }) {
  return (
    <span
      style={{
        font: 'var(--t-tv-pod-label)',
        letterSpacing: 'var(--track-overline)',
        textTransform: 'uppercase',
        color: 'var(--fg-muted)',
        textAlign: align,
        display: 'block',
      }}
    >
      Total revenue
    </span>
  )
}

/**
 * One pillar: a mark, a capital, a shaft carrying the rank, a base, then the
 * name and the figure.
 *
 * The mark sits in a fixed-height row and is bottom-aligned inside it. That is
 * what lets first place have a larger mark while all three capitals still land
 * on one line — aligning the marks by their tops instead would stagger every
 * slab, shaft and figure across the frame.
 */
function Pillar({ team, place }: { team: Team | undefined; place: number }) {
  const first = place === 1
  const logo = first ? POD_LOGO_FIRST : POD_LOGO_REST

  return (
    <div
      style={{
        width: 'var(--w-pod)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      {/* The mark's row. Its height is first place's diameter whatever this
          pillar's own mark measures, so the capital line below is shared. */}
      <div
        style={{
          height: POD_LOGO_FIRST,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          marginBottom: 'var(--s-4)',
        }}
      >
        {/* An empty box where a mark would go holds the stack's geometry steady
            between "no feed yet" and the first snapshot, so the pillar does not
            visibly assemble itself on the wall's first paint. Empty rather than
            a placeholder mark — a grey circle is filler, and this wall carries
            none. */}
        {team === undefined ? (
          <div style={{ width: logo, height: logo }} />
        ) : (
          <div className={idleOf(team, place)} style={{ willChange: 'transform' }}>
            <VentureLogo team={team} size={logo} />
          </div>
        )}
      </div>

      <div
        className="tv-pod-slab"
        style={{ width: 'var(--w-pod-slab)', height: 'var(--h-pod-slab)' }}
      />
      <div
        className="tv-pod-shaft"
        style={{
          width: 'var(--w-pod-shaft)',
          height: 'var(--h-pod-shaft)',
          display: 'flex',
          justifyContent: 'center',
          paddingTop: 'var(--s-4)',
        }}
      >
        <span
          className="tv-figure"
          style={{
            font: 'var(--t-tv-pod-rank)',
            // Light on the deep pillar, dark on the two light ones — the same
            // rule VentureLogo already applies to its own light tints.
            color: first ? 'var(--soft-mint)' : 'var(--deep-teal)',
          }}
        >
          {place}
        </span>
      </div>
      <div
        className="tv-pod-slab"
        style={{ width: 'var(--w-pod-slab)', height: 'var(--h-pod-slab)' }}
      />

      <div style={{ marginTop: 'var(--s-5)', width: '100%' }}>
        <span
          style={{
            font: 'var(--t-tv-pod-name)',
            color: 'var(--deep-teal)',
            display: 'block',
            textAlign: 'center',
            // Clipped, never wrapped: every pillar is a fixed stack, and a
            // second line pushes the figure out of it — and the figure is the
            // reason the pillar exists.
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {team === undefined ? '' : team.ventureName || team.teamId}
        </span>
        <div style={{ marginTop: 'var(--s-2)' }}>
          <Caption align="center" />
          <span
            className="tv-figure"
            style={{
              font: 'var(--t-tv-pod-figure)',
              color: 'var(--tangerine-600)',
              display: 'block',
              textAlign: 'center',
              marginTop: 'var(--s-1)',
            }}
          >
            {revenueOf(team)}
          </span>
        </div>
      </div>
    </div>
  )
}

/**
 * The three pillars, 2 · 1 · 3 outward from the centre — the arrangement
 * everyone already knows from a real podium, so nobody has to work out the
 * order.
 *
 * `perspective` lives here because the idle's glance is a `rotateY`; without a
 * perspective ancestor that flattens into a horizontal squash and the mark
 * looks like it is being crushed rather than turning to look at something.
 *
 * The ramp is applied as two custom properties per pillar, which `.tv-pod-shaft`
 * and `.tv-pod-slab` read. That keeps the colours themselves in `:root` rather
 * than spelling six of them out here.
 */
function PodiumBand({ places }: { places: (Team | undefined)[] }) {
  const [first, second, third] = places
  const pods = [
    { team: second, place: 2, fill: 'var(--pod-2)', slab: 'var(--slab-2)' },
    { team: first, place: 1, fill: 'var(--pod-1)', slab: 'var(--slab-1)' },
    { team: third, place: 3, fill: 'var(--pod-3)', slab: 'var(--slab-3)' },
  ]

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        gap: 'var(--s-pod-gap)',
        perspective: '900px',
      }}
    >
      {pods.map((pod) => (
        <div
          key={pod.place}
          style={{ '--pod-fill': pod.fill, '--slab-fill': pod.slab } as React.CSSProperties}
        >
          <Pillar team={pod.team} place={pod.place} />
        </div>
      ))}
    </div>
  )
}

/**
 * Ranks 4–10.
 *
 * **No pill.** `.tv-pill` is the weekly board's language — forty rows that
 * close around their own mark during a kick — and borrowing it here made slide
 * 1 look like a shorter slide 2. A hairline between rows is enough. The row
 * height and the mark still match `/weekly` exactly, so the scale reads as one
 * wall while the decoration says these are two different boards.
 *
 * The figures are black here and gold only on the podium. Gold on all ten
 * would make the top three ordinary.
 */
function Strip({ teams, fromRank }: { teams: readonly Team[]; fromRank: number }) {
  // An empty strip carries no heading. Apparatus describing absence is the same
  // filler as a "no data" message, in a smaller typeface.
  if (teams.length === 0) return null

  const row: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: `var(--w-rank) ${STRIP_LOGO}px minmax(0, 1fr) var(--w-pod-total)`,
    alignItems: 'center',
    gap: 'var(--s-3)',
    height: 'var(--h-row)',
  }

  return (
    <div style={{ width: 'var(--w-pod-board)', marginInline: 'auto' }}>
      {/* The caption sits on the row's own grid so it lands over the figures it
          names. Two copies of this template would drift apart on the first
          change, and nobody would notice until a label pointed at the wrong
          column. */}
      <div style={{ ...row, height: 'var(--h-col-head)', alignItems: 'end' }}>
        <span />
        <span />
        <span />
        <Caption align="right" />
      </div>

      {teams.map((team, index) => (
        <div
          key={team.teamId}
          style={{
            ...row,
            borderBottom:
              index === teams.length - 1 ? 'none' : 'var(--stroke-hair) solid var(--border)',
          }}
        >
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
          <VentureLogo team={team} size={STRIP_LOGO} />
          <span
            style={{
              font: 'var(--t-tv-pod-row-name)',
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
              font: 'var(--t-tv-pod-row-figure)',
              color: 'var(--midnight-charcoal)',
              textAlign: 'right',
            }}
          >
            {revenueOf(team)}
          </span>
        </div>
      ))}
    </div>
  )
}

export function Podium({ ranked }: { ranked: readonly Team[] }) {
  const visible = podiumTeams(ranked)
  // Explicit indices, not a destructure of `visible`: the three pillars have to
  // exist before the feed does, and `slice` on an empty list yields nothing to
  // destructure. `undefined` is the pillar's empty state, and it is a real one.
  const places = [visible[0], visible[1], visible[2]]

  return (
    <div
      style={{
        display: 'grid',
        // The band and the strip. `alignContent` centres the pair in whatever
        // height the frame leaves, which is where the slide's resting margin
        // comes from — it is not padding anyone had to measure.
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
