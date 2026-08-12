'use client'

import { VentureLogo } from '@/components/VentureLogo'
import { formatRupees } from '@/lib/format'
import type { Team } from '@/lib/types'

/**
 * Slide 1 — the absolute leaderboard: three floating cards, then ranks 4–10 as
 * bars.
 *
 * ── What this replaced, and why ──
 *
 * The pillars are gone. `/podium` was three columns with a capital and a base
 * standing on a shared ground line, and the argument for that shape was that a
 * shared floor is what makes three separate objects read as one podium. The
 * argument was right; the shape was the problem. Three heavy green blocks with
 * small marks perched on them read as *furniture with logos on it*, and the
 * venture — which is the only thing on this slide anyone cares about — was the
 * smallest element in its own column.
 *
 * The cards invert that. The mark is the card, the card floats, and the
 * apparatus that used to hold the mark up is simply not drawn.
 *
 * ── Rank is said three times ──
 *
 * Card size, the depth of the green, and the medal. Deliberately redundant: a
 * photograph of this wall taken from an angle loses the medal, a greyscale
 * reproduction loses the ramp, and either one still ranks. The old design made
 * the same argument for height, colour and numeral.
 *
 * ── What this deliberately spends ──
 *
 * This wall's rule is that movement means something happened. A permanently
 * idling mark spends that rule, and it was chosen knowingly: the idle is slow
 * and small where an overtake is fast, large and directional, so the two stay
 * distinguishable. If the overtake ever stops landing once both are on screen
 * together, the idle is what gives.
 *
 * **No `layout` prop**, here or anywhere in the board tree — there is a source
 * scan in render.test.tsx that fails the build on one. The idle is CSS
 * keyframes on `transform` alone, so it is compositor work rather than a JS
 * loop running for the weeks this page stays open without reloading.
 */

const TOP = 10
const PODIUM_PLACES = 3

const IDLE_TIMELINES = ['tv-idle-1', 'tv-idle-2', 'tv-idle-3'] as const

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
 * marks on screen can never fall into lockstep — which is the entire visible
 * requirement, and one a hash cannot promise: three ids into three buckets
 * collide about one time in nine, and `lib/seed.ts` documents a worse failure on
 * top of that.
 *
 * Seeding it off the team id was the first attempt, on the reasoning that a
 * venture which moves differently after an overtake reads as a different
 * venture. That reasoning does not survive contact with this design: the card's
 * *colour* is already assigned by rank, so a promoted venture changes its green
 * whatever the idle does. Motion following rank is consistent with that; a
 * chorus line is not.
 */
function idleOf(place: number): string {
  return IDLE_TIMELINES[(place - 1) % IDLE_TIMELINES.length]
}

/**
 * A mark, optionally ringed and idling.
 *
 * `VentureLogo` draws a disc itself — the source logos are circles and
 * `scripts/prepare-logos.py` masks each one to a disc with transparent corners —
 * so nothing here has to clip it round. The wrapper exists because the idle
 * needs an element it can transform without touching the logo's own sizing.
 */
function Mark({
  team,
  size,
  idle,
  ring,
}: {
  team: Team
  size: string
  idle?: string
  ring?: boolean
}) {
  return (
    <div
      className={[ring === true ? 'tv-pod-mark' : undefined, idle].filter(Boolean).join(' ')}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
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
 *
 * The colour is passed in rather than fixed, because this label appears on two
 * surfaces — on the green cards and on the white page above the strip — and a
 * single muted token cannot be right on both.
 */
function Caption({ align, tone }: { align: 'center' | 'right'; tone: string }) {
  return (
    <span
      style={{
        font: 'var(--t-tv-pod-label)',
        letterSpacing: 'var(--track-overline)',
        textTransform: 'uppercase',
        color: tone,
        textAlign: align,
        display: 'block',
      }}
    >
      Total revenue
    </span>
  )
}

/**
 * One floating card: a medal on the corner, the mark, the name, the figure.
 *
 * Both dimensions and the fill arrive as inline custom properties so the class
 * in `mesa-tv.css` can derive the mark's diameter from them — see `.tv-pod-card`
 * for why that derivation cannot live in `:root`.
 */
function PodiumCard({
  team,
  place,
  fill,
  width,
  height,
}: {
  team: Team | undefined
  place: number
  fill: string
  width: string
  height: string
}) {
  return (
    <div
      className="tv-pod-card"
      style={
        {
          '--pod-fill': fill,
          '--w-pod-card': width,
          '--h-pod-card': height,
        } as React.CSSProperties
      }
    >
      <span className="tv-pod-medal tv-figure">{place}</span>

      <div
        style={{
          height: '100%',
          padding: 'var(--s-pod-card-inset)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {/* `perspective` sits here, on the mark's **direct parent**. It applies
            to an element's own children and nothing deeper, so the version of
            this that put it on the row of cards left the idle's glance — a
            `rotateY` — rendering as a flat horizontal squash, which reads as the
            mark being crushed rather than as it turning to look at something. */}
        <div
          style={{
            flex: 1,
            width: '100%',
            display: 'grid',
            placeItems: 'center',
            perspective: '900px',
          }}
        >
          {/* An empty box where a mark would go holds the card's geometry steady
              between "no feed yet" and the first snapshot, so the card does not
              visibly assemble itself on the wall's first paint. Empty rather
              than a placeholder mark — a grey circle is filler, and this wall
              carries none. */}
          {team === undefined ? (
            <div style={{ width: 'var(--d-pod-logo)', height: 'var(--d-pod-logo)' }} />
          ) : (
            <Mark team={team} size="var(--d-pod-logo)" idle={idleOf(place)} ring />
          )}
        </div>

        <div
          style={{
            height: 'var(--h-pod-card-text)',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            gap: 'var(--s-1)',
          }}
        >
          <span
            style={{
              font: 'var(--t-tv-pod-name)',
              color: 'var(--white)',
              display: 'block',
              textAlign: 'center',
              // Clipped, never wrapped: the text block is a fixed height on all
              // three cards, and a second line pushes the figure out of it — and
              // the figure is the reason the card exists.
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {team === undefined ? '' : team.ventureName || team.teamId}
          </span>
          <Caption align="center" tone="var(--mint-300)" />
          <span
            className="tv-figure"
            style={{
              font: 'var(--t-tv-pod-figure)',
              // The light end of the tangerine ramp, not `--tangerine-600`. The
              // figure was gold on white and has to stay gold on green; the
              // deeper step measures under 3:1 on the third card's fill.
              color: 'var(--tangerine-200)',
              display: 'block',
              textAlign: 'center',
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
 * The three cards, 2 · 1 · 3 outward from the centre — the arrangement everyone
 * already knows from a real podium, so nobody has to work out the order.
 *
 * **Centred, not sitting on a floor.** The pillars aligned on their bases
 * because a podium has ground under it. These do not: first place is bigger in
 * both directions and overhangs the other two top and bottom, which is what
 * makes the group read as floating rather than as three objects standing on an
 * invisible shelf.
 */
function CardBand({ places }: { places: (Team | undefined)[] }) {
  const [first, second, third] = places
  const cards = [
    { team: second, place: 2, fill: 'var(--pod-2)' },
    { team: first, place: 1, fill: 'var(--pod-1)' },
    { team: third, place: 3, fill: 'var(--pod-3)' },
  ]

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'var(--s-pod-gap)',
      }}
    >
      {cards.map((card) => (
        <PodiumCard
          key={card.place}
          team={card.team}
          place={card.place}
          fill={card.fill}
          width={card.place === 1 ? 'var(--w-pod-card-1)' : 'var(--w-pod-card-r)'}
          height={card.place === 1 ? 'var(--h-pod-card-1)' : 'var(--h-pod-card-r)'}
        />
      ))}
    </div>
  )
}

/**
 * Ranks 4–10.
 *
 * A green tab carrying the rank, then a mint bar carrying the mark, the name and
 * the figure — the rank sitting *beside* the row rather than inside it, with
 * daylight between the two so the pair does not close up into one pill.
 *
 * **Quiet on purpose.** The three cards are the story. Seven bars in a strong
 * fill would flatten that back out, which is the same reason the pillars' strip
 * refused `.tv-pill`: borrowing the weekly board's language here made slide 1
 * look like a shorter slide 2.
 */
function Strip({ teams, fromRank }: { teams: readonly Team[]; fromRank: number }) {
  // An empty strip carries no heading. Apparatus describing absence is the same
  // filler as a "no data" message, in a smaller typeface.
  if (teams.length === 0) return null

  return (
    <div style={{ width: 'var(--w-pod-board)', marginInline: 'auto' }}>
      {/* The caption is inset by the same margin the figure block carries, so it
          lands over the column it names rather than over the bar's edge. */}
      <div
        style={{
          height: 'var(--h-pod-col-head)',
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'end',
          paddingRight: 'var(--s-2)',
        }}
      >
        <div style={{ width: 'var(--w-pod-total)', paddingInline: 'var(--s-3)' }}>
          <Caption align="right" tone="var(--fg-muted)" />
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-pod-row-gap)' }}>
        {teams.map((team, index) => (
          <div
            key={team.teamId}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--s-1)',
              height: 'var(--h-pod-row)',
            }}
          >
            <span className="tv-pod-tab tv-figure" style={{ font: 'var(--t-tv-pod-row-rank)' }}>
              {fromRank + index}
            </span>

            <div className="tv-pod-bar">
              <div style={{ paddingInline: 'var(--s-3)', display: 'flex' }}>
                <Mark team={team} size="var(--d-pod-row-logo)" />
              </div>
              <span
                style={{
                  flex: 1,
                  minWidth: 0,
                  font: 'var(--t-tv-pod-row-name)',
                  color: 'var(--fg1)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {team.ventureName || team.teamId}
              </span>
              <span
                className="tv-pod-total tv-figure"
                style={{
                  font: 'var(--t-tv-pod-row-figure)',
                  color: 'var(--deep-forest-green)',
                }}
              >
                {revenueOf(team)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function Podium({ ranked }: { ranked: readonly Team[] }) {
  const visible = podiumTeams(ranked)
  // Explicit indices, not a destructure of `visible`: the three cards have to
  // exist before the feed does, and `slice` on an empty list yields nothing to
  // destructure. `undefined` is the card's empty state, and it is a real one.
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
        // `--s-6`, not `--s-8`. Fixed px, so it holds its 32px while everything
        // around it shrinks with the frame — and at 1600x900 those eight pixels
        // were the difference between 10px of clearance and 2px.
        gap: 'var(--s-6)',
        height: '100%',
      }}
    >
      <CardBand places={places} />
      <Strip teams={visible.slice(PODIUM_PLACES)} fromRank={PODIUM_PLACES + 1} />
    </div>
  )
}
