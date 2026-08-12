'use client'

import { VentureLogo } from '@/components/VentureLogo'
import { formatRupees } from '@/lib/format'
import type { Team } from '@/lib/types'

/**
 * Slide 1 — the absolute leaderboard: three cards on metal plinths, and ranks
 * 4–10 as pill bars.
 *
 * ── The composition ──
 *
 * One tall card at the left, two short ones beside it, and the list filling the
 * well beneath the short pair. **The asymmetry is the ranking**: first place is
 * the only venture given a column to itself, and it does not have to be labelled
 * as first for that to read. Second and third are identical twins, as they are
 * on a real podium.
 *
 * The masthead spine that anchors all of this lives in `PodiumMasthead`.
 *
 * ── Rank is said three times ──
 *
 * Card size, the metal, and the badge. Deliberately redundant: a greyscale
 * reproduction loses the metals, a photograph taken at an angle loses a badge,
 * and either one still ranks. This argument has survived two redesigns of this
 * slide and it is the reason none of the three ever carries rank alone.
 *
 * ── What this deliberately spends ──
 *
 * This wall's rule is that movement means something happened. A permanently
 * idling mark spends that rule, and it was chosen knowingly: the idle is slow
 * and small where an overtake is fast, large and directional, so the two stay
 * distinguishable.
 *
 * **No `layout` prop**, here or anywhere in the board tree — there is a source
 * scan in render.test.tsx that fails the build on one. The idle is CSS keyframes
 * on `transform` alone, so it is compositor work rather than a JS loop running
 * for the weeks this page stays open without reloading.
 */

const TOP = 10
const PODIUM_PLACES = 3

const IDLE_TIMELINES = ['tv-idle-1', 'tv-idle-2', 'tv-idle-3'] as const

/**
 * Everything that differs between the three cards, in one table.
 *
 * The alternative is three branches on `place` scattered through the render, and
 * the failure mode there is a card that picks up second place's metal and third
 * place's ink because two of the branches disagreed.
 */
const PLACES = {
  1: {
    metal: 'var(--metal-gold)',
    ink: 'var(--metal-gold-ink)',
    fill: 'var(--deep-teal)',
    plinth: 'var(--h-pod-plinth-1)',
    disc: 'var(--d-pod-disc-1)',
    badge: 'var(--d-pod-badge-1)',
    badgeFont: 'var(--t-pod-badge-1)',
    nameFont: 'var(--t-pod-name-1)',
    nameTrack: 'var(--track-pod-name-1)',
    figFont: 'var(--t-pod-fig-1)',
    pad: 'var(--s-pod-card-pad)',
    figGap: '0.45em',
  },
  2: {
    metal: 'var(--metal-silver)',
    ink: 'var(--metal-silver-ink)',
    fill: 'var(--deep-forest-green)',
    plinth: 'var(--h-pod-plinth-r)',
    disc: 'var(--d-pod-disc-r)',
    badge: 'var(--d-pod-badge-r)',
    badgeFont: 'var(--t-pod-badge-r)',
    nameFont: 'var(--t-pod-name-r)',
    nameTrack: 'var(--track-pod-name-r)',
    figFont: 'var(--t-pod-fig-r)',
    pad: 'var(--s-pod-card-pad-r)',
    // Tighter than first place's, and the approved design is tighter still. A
    // short card has to spend its height on the mark; the interval between a
    // name and its figure is the one thing there that can give.
    figGap: '0.2em',
  },
  3: {
    metal: 'var(--metal-bronze)',
    ink: 'var(--metal-bronze-ink)',
    fill: 'var(--deep-forest-green)',
    plinth: 'var(--h-pod-plinth-r)',
    disc: 'var(--d-pod-disc-r)',
    badge: 'var(--d-pod-badge-r)',
    badgeFont: 'var(--t-pod-badge-r)',
    nameFont: 'var(--t-pod-name-r)',
    nameTrack: 'var(--track-pod-name-r)',
    figFont: 'var(--t-pod-fig-r)',
    pad: 'var(--s-pod-card-pad-r)',
    figGap: '0.2em',
  },
} as const

type Place = keyof typeof PLACES

/**
 * The mark's share of the white disc it sits in.
 *
 * Not 100%. Every source logo is already a circle with its own ground — Xoco's
 * is deep red, snackerly's is cream — so a mark drawn to the disc's edge hides
 * the disc entirely and the treatment would exist only for the teams without
 * artwork. At 82% the white reads as a mount that every card shares, and a dark
 * mark keeps an edge against a dark card.
 */
const MARK_IN_DISC = 0.82

/**
 * Who is on the board. The top ten of whatever it is handed, and nothing else.
 *
 * The three cards render whether or not anyone is trading: a podium with second
 * and third missing tells a passer-by the wall is broken, where three cards
 * reading "—" tell them the cohort has not started. Filtering the spares and
 * ranking are both the caller's job — this component ranks nothing, so the sort
 * stays the single authority on order.
 */
export function podiumTeams(ranked: readonly Team[]): Team[] {
  return ranked.slice(0, TOP)
}

/**
 * An em dash, not `₹0`.
 *
 * Zero is a figure, and a card carrying one asserts that the team traded and
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
 * marks on screen can never fall into lockstep — the entire visible requirement,
 * and one a hash cannot promise: three ids into three buckets collide about one
 * time in nine even with a good hash, and `lib/seed.ts` documents a worse
 * failure on top of that.
 */
function idleOf(place: number): string {
  return IDLE_TIMELINES[(place - 1) % IDLE_TIMELINES.length]
}

/** A venture's name, or its ID. Placeholder names are already blanked at the
    parse layer (`lib/feed.ts`), so an unnamed team arrives here with an empty
    string and carries its team ID rather than a gap. */
function nameOf(team: Team): string {
  return team.ventureName || team.teamId
}

/**
 * One podium card: a badge, a mark in a white disc, a name, a figure — standing
 * on its metal.
 */
function PodiumCard({ team, place }: { team: Team | undefined; place: Place }) {
  const p = PLACES[place]

  return (
    <div
      className="tv-pod-plinth"
      style={{ '--pod-metal': p.metal, '--h-pod-plinth': p.plinth } as React.CSSProperties}
    >
      <div
        className="tv-pod-card"
        style={
          {
            '--pod-fill-card': p.fill,
            padding: p.pad,
          } as React.CSSProperties
        }
      >
        <span
          className="tv-pod-badge tv-figure"
          style={{ '--pod-metal-ink': p.ink, width: p.badge, font: p.badgeFont } as React.CSSProperties}
        >
          {place}
        </span>

        {/* `perspective` sits on the mark's **direct parent**. It applies to an
            element's own children and nothing deeper, so putting it on the row
            of cards leaves the idle's glance rendering as a flat horizontal
            squash — the mark being crushed rather than turning to look. */}
        {/* `width: 100%` matters. Without it this shrink-wraps to its child, and
            the child's own width then resolves against a box that is already the
            child's width — the disc collapsed to a dot on the first render. */}
        {/* `flex: 1`, not a fixed box with the text pushed down by `auto`. The
            slack has to fall *around* the mark rather than all above the name:
            measured against the approved design, pinning the text to the foot
            left first place with 32% of its card empty between the mark and its
            own name, where the design leaves about 10%. Centring the mark in
            whatever the text does not use puts it back. */}
        <div
          style={{
            flex: 1,
            minHeight: 0,
            perspective: '900px',
            width: '100%',
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <div
            className={team === undefined ? undefined : idleOf(place)}
            style={{
              width: p.disc,
              aspectRatio: 1,
              ...(team === undefined ? {} : { willChange: 'transform' }),
            }}
          >
            {/* The disc renders whether or not there is a team, so the card holds
                its geometry through the first paint rather than assembling itself
                on the wall. Empty rather than a placeholder mark — a grey circle
                is filler, and this wall carries none. */}
            <div className="tv-pod-disc" style={{ width: '100%', height: '100%' }}>
              {team === undefined ? null : (
                <VentureLogo team={team} size={`calc(${p.disc} * ${MARK_IN_DISC})`} />
              )}
            </div>
          </div>
        </div>

        <div style={{ width: '100%', textAlign: 'center' }}>
          <span
            style={{
              display: 'block',
              font: p.nameFont,
              letterSpacing: p.nameTrack,
              textTransform: 'uppercase',
              color: 'var(--pod-name-ink)',
              // Clipped, never wrapped: the card is a fixed stack and a second
              // line pushes the figure out of it — and the figure is the reason
              // the card exists.
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {team === undefined ? '' : nameOf(team)}
          </span>
          <span
            className="tv-figure"
            style={{
              display: 'block',
              // Measured off the approved design, where the air between a name
              // and its figure is a real interval rather than a line gap — it is
              // what stops a tracked label reading as a caption glued to the
              // number underneath it.
              marginTop: p.figGap,
              font: p.figFont,
              letterSpacing: 'var(--track-pod-fig)',
              color: 'var(--white)',
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
 * Ranks 4–10, as pill bars.
 *
 * **The fill is measured against the list's own leader, not against rank 1.**
 * Against ₹54,782 every bar here would sit under four fifths of the track and
 * the seven would read as identical. The list is its own contest, and the shape
 * exists so the drop-off down it is visible without reading a figure.
 */
function Strip({ teams, fromRank }: { teams: readonly Team[]; fromRank: number }) {
  // An empty strip carries no heading. Apparatus describing absence is the same
  // filler as a "no data" message, in a smaller typeface.
  if (teams.length === 0) return null

  const leader = Math.max(...teams.map((team) => team.totalRevenue), 0)

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateRows: `repeat(${teams.length}, 1fr)`,
        rowGap: 'var(--s-pod-row-gap)',
        height: '100%',
      }}
    >
      {teams.map((team, index) => (
        <div key={team.teamId} className="tv-pod-pill">
          <div
            className="tv-pod-pill-fill"
            style={{
              // Floored at the pill's left cap. A bar three percent long is a
              // lozenge that reads as a rendering fault rather than as a small
              // number; at the cap's width it reads as "the bar starts here".
              // On real data the floor never binds — rank 10 is 38% of rank 4.
              width: leader <= 0 ? 0 : `${Math.max(13, (100 * team.totalRevenue) / leader)}%`,
            }}
          />
          <span
            className="tv-figure"
            style={{
              font: 'var(--t-pod-rank-row)',
              letterSpacing: 'var(--track-pod-fig)',
              color: 'var(--pod-rank-ink)',
              textAlign: 'center',
            }}
          >
            {fromRank + index}
          </span>
          <span className="tv-pod-pill-name">{nameOf(team)}</span>
          <span
            className="tv-figure"
            style={{
              font: 'var(--t-pod-fig-row)',
              letterSpacing: 'var(--track-pod-fig)',
              color: 'var(--deep-teal)',
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
  // Explicit indices, not a destructure of `visible`: the three cards have to
  // exist before the feed does, and `slice` on an empty list yields nothing to
  // destructure. `undefined` is the card's empty state, and it is a real one.
  const [first, second, third] = [visible[0], visible[1], visible[2]]

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'var(--w-pod-card-1) minmax(0, 1fr)',
        columnGap: 'var(--s-pod-gap)',
        padding:
          'var(--s-pod-top) var(--s-pod-edge) var(--s-pod-bottom) var(--s-pod-gutter)',
        // `height` and `minHeight` together, and both are load-bearing. Without
        // the height the board is auto-sized and the `fr` rows below size to
        // their content instead of to the frame; without `minHeight: 0` a grid
        // item refuses to shrink under its content's intrinsic size and the
        // whole board runs off the bottom. Measured with neither: first place's
        // figure was cut in half by the frame's edge.
        height: '100%',
        minHeight: 0,
        minWidth: 0,
      }}
    >
      {/* ── The vertical is fractions, never `vw` ──

          Sizing these heights in `vw` like the rest of the wall overflows
          off-ratio: the content comes to 55.4vw of height, and a 2000x1100 frame
          has only 55.0vw of height to give it. `fr` asks for a share of whatever
          height the frame actually has, so first place is 84% of the board at
          every aspect rather than 815px at one of them. */}
      <div style={{ display: 'grid', gridTemplateRows: '84fr 16fr', minHeight: 0 }}>
        <PodiumCard team={first} place={1} />
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateRows: '42.3fr 52.1fr',
          rowGap: 'var(--s-pod-stack-gap, 2.8vw)',
          minWidth: 0,
          minHeight: 0,
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            columnGap: 'var(--s-pod-gap)',
            minWidth: 0,
          }}
        >
          <PodiumCard team={second} place={2} />
          <PodiumCard team={third} place={3} />
        </div>

        <Strip teams={visible.slice(PODIUM_PLACES)} fromRank={PODIUM_PLACES + 1} />
      </div>
    </div>
  )
}
