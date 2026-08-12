'use client'

import { VentureLogo } from '@/components/VentureLogo'
import { biggestMover } from '@/lib/climber'
import { formatRupees, ordinal } from '@/lib/format'
import type { Team } from '@/lib/types'

/**
 * The pale panel under first place's card: who has moved the most this week.
 *
 * **A different kind of object from the podium cards, and it says so in one
 * move.** The cards are dark, stand on metal and carry a rank; this is pale,
 * stands on nothing and carries a change. Reading it as "fourth place" for even
 * a second would be worse than not having it, so the surface does the work
 * before any of the words are read.
 *
 * Its three states and the rule that decides between them live in
 * `lib/climber.ts`. This file only draws them.
 *
 * The figure on the right is **`--tangerine-600`, deliberately not a metal**.
 * Gold, silver and bronze encode first, second and third on this slide and
 * nothing else; a climb is not a podium position, and borrowing a metal here
 * would make the exemption those three colours have mean something looser than
 * it does.
 */
export function MoverPanel({ ranked }: { ranked: readonly Team[] }) {
  const mover = biggestMover(ranked)

  return (
    <aside className="tv-pod-mover">
      <span className="tv-pod-mover-label">
        {mover?.kind === 'climb' ? 'Biggest climber this week' : 'Biggest earner this week'}
      </span>

      {mover === null ? (
        // Nobody has traded yet. An em dash, which is what the podium cards
        // already say for "no figure yet" — the same silence in the same words,
        // rather than a sentence explaining that the week is young.
        <span className="tv-pod-mover-empty tv-figure">—</span>
      ) : (
        <div className="tv-pod-mover-row">
          <span className="tv-pod-mover-mark">
            <VentureLogo team={mover.team} size="var(--d-pod-mover-logo)" />
          </span>

          <span style={{ minWidth: 0 }}>
            <span className="tv-pod-mover-name">
              {mover.team.ventureName || mover.team.teamId}
            </span>
            <span className="tv-pod-mover-line tv-figure">
              {mover.kind === 'climb'
                ? `${ordinal(mover.fromRank)} to ${ordinal(mover.toRank)} on ${formatRupees(mover.weekRevenue)}`
                : `${ordinal(mover.toRank)} overall`}
            </span>
          </span>

          {/* The headline number is whatever the state is actually about:
              places gained when somebody climbed, the week's takings when
              nobody did. Showing "+0" in the second state would be a climb of
              zero dressed as news.

              Which is also why the line above it does *not* repeat the money in
              the earner state — the first render printed ₹25,870 twice, once as
              the headline and once in its own sub-line. Each element says one
              thing: the line places them on the board, the figure is the news. */}
          <span className="tv-pod-mover-gain tv-figure">
            {mover.kind === 'climb' ? `+${mover.gained}` : formatRupees(mover.weekRevenue)}
          </span>
        </div>
      )}
    </aside>
  )
}
