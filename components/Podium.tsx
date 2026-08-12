'use client'

import { VentureLogo } from '@/components/VentureLogo'
import { formatRupees } from '@/lib/format'
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

/** The strip's mark.
 *
 * **Larger than the weekly board's 30px, on purpose.** That board fits forty
 * marks on a frame; this one shows seven, and matching its size made the top
 * ten look like a footnote under the podium. The row keeps `/weekly`'s
 * *structure* — rank outside, mark, name centred, figure right — at the scale
 * seven rows can afford.
 *
 * 2.5vw is 48px at 1920, raised from 40 after rendering the real logos at
 * every size the wall uses: below about 50px the wordmarks stop resolving into
 * anything and become coloured dots. They are still only *recognisable* at
 * this size, not readable — which is the deal the circular frame makes, and it
 * holds because the venture's name is printed right beside the mark. */
const STRIP_LOGO = '2.5vw'

/** The mark on a pillar. First place's is larger — one of the two things left
    carrying rank now that all three columns are the same height. */
const POD_LOGO_FIRST = '5.2vw'
const POD_LOGO_REST = '4.2vw'

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
 * **By podium place, not by team.** Three places and three timelines, so the
 * marks on screen can never fall into lockstep — which is the entire visible
 * requirement, and one a hash cannot promise: three ids into three buckets
 * collide about one time in nine, and `lib/seed.ts` documents a worse failure
 * on top of that.
 *
 * Seeding it off the team id was the first attempt, on the reasoning that a
 * venture which moves differently after an overtake reads as a different
 * venture. That reasoning does not survive contact with this design: the
 * pillar's *colour* is already assigned by rank, so a promoted venture changes
 * its green whatever the idle does. Motion following rank is consistent with
 * that; a chorus line is not.
 */
function idleOf(place: number): string {
  return IDLE_TIMELINES[(place - 1) % IDLE_TIMELINES.length]
}

/**
 * A mark in a circular frame.
 *
 * `VentureLogo` draws a rounded square, because that is what forty rows of
 * `/weekly` want. This slide puts every mark in a disc instead — the shape the
 * logos were prepared for by `scripts/prepare-logos.py`, which squares each
 * one onto its own background colour so a circle can be filled rather than
 * cropped. Clipping here rather than in the shared component leaves the weekly
 * board exactly as it is.
 */
function Mark({ team, size, idle }: { team: Team; size: string; idle?: string }) {
  return (
    <div
      className={idle}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        overflow: 'hidden',
        ...(idle === undefined ? {} : { willChange: 'transform' }),
      }}
    >
      <VentureLogo team={team} size={size} />
    </div>
  )
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
 * The pillars align on their *bases*, and the shafts step down by rank, so the
 * marks ride up with their own columns — first place highest. The name and the
 * figure hang below the base, which means they land on one line across all
 * three without being told to.
 */
function Pillar({
  team,
  place,
  ink,
  shaft,
}: {
  team: Team | undefined
  place: number
  ink: string
  /** This pillar's shaft height. Stepped by rank — see `PodiumBand`. */
  shaft: string
}) {
  const logo = place === 1 ? POD_LOGO_FIRST : POD_LOGO_REST

  return (
    <div
      style={{
        width: 'var(--w-pod)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      {/* The mark's row, sized to this pillar's own mark. The capitals ride
          their shafts and are *meant* to sit at different heights — the shared
          line on this podium is the floor, not the top. */}
      <div
        style={{
          height: logo,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          marginBottom: 'var(--s-3)',
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
          <Mark team={team} size={logo} idle={idleOf(place)} />
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
          height: shaft,
          display: 'flex',
          justifyContent: 'center',
          paddingTop: 'var(--s-4)',
        }}
      >
        <span
          className="tv-figure"
          style={{
            font: 'var(--t-tv-pod-rank)',
            // Set by the pillar's own lightness rather than by its rank — the
            // same rule VentureLogo applies to its tints. Measured: deep teal
            // on pod 2 is 3.26:1, which is under the floor for a wall read at
            // six metres, while light type on it is 4.03:1.
            color: ink,
          }}
        >
          {place}
        </span>
      </div>
      <div
        className="tv-pod-slab"
        style={{ width: 'var(--w-pod-slab)', height: 'var(--h-pod-slab)' }}
      />

      <div style={{ marginTop: 'var(--s-4)', width: '100%' }}>
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
    // prettier-ignore
    { team: second, place: 2, fill: 'var(--pod-2)', slab: 'var(--slab-2)', ink: 'var(--soft-mint)', shaft: 'var(--h-pod-shaft-2)' },
    // prettier-ignore
    { team: first, place: 1, fill: 'var(--pod-1)', slab: 'var(--slab-1)', ink: 'var(--soft-mint)', shaft: 'var(--h-pod-shaft-1)' },
    // prettier-ignore
    { team: third, place: 3, fill: 'var(--pod-3)', slab: 'var(--slab-3)', ink: 'var(--deep-teal)', shaft: 'var(--h-pod-shaft-3)' },
  ]

  return (
    <div
      style={{
        display: 'flex',
        // `flex-end`, so the three bases land on one floor while the shafts
        // step down by rank. That shared ground line is what makes the group
        // read as a single podium instead of three columns of unequal size.
        alignItems: 'flex-end',
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
          <Pillar team={pod.team} place={pod.place} ink={pod.ink} shaft={pod.shaft} />
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
    gridTemplateColumns: `var(--w-pod-rank) ${STRIP_LOGO} minmax(0, 1fr) var(--w-pod-total)`,
    alignItems: 'center',
    gap: 'var(--s-5)',
    height: 'var(--h-pod-row)',
  }

  return (
    <div style={{ width: 'var(--w-pod-board)', marginInline: 'auto' }}>
      {/* The caption sits on the row's own grid so it lands over the figures it
          names. Two copies of this template would drift apart on the first
          change, and nobody would notice until a label pointed at the wrong
          column. */}
      <div style={{ ...row, height: 'var(--h-pod-col-head)', alignItems: 'end' }}>
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
              font: 'var(--t-tv-pod-row-rank)',
              // One colour for all seven, matching the weekly board's ranks
              // exactly. The rank is board apparatus, not a tier.
              color: 'var(--midnight-charcoal)',
              textAlign: 'right',
            }}
          >
            {fromRank + index}
          </span>
          <Mark team={team} size={STRIP_LOGO} />
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
        gap: 'var(--s-8)',
        height: '100%',
      }}
    >
      <PodiumBand places={places} />
      <Strip teams={visible.slice(PODIUM_PLACES)} fromRank={PODIUM_PLACES + 1} />
    </div>
  )
}
