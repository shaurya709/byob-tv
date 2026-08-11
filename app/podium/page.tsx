'use client'

import { Podium } from '@/components/Podium'
import { WallHeader } from '@/components/WallHeader'
import { WATCH_RANKS_PODIUM } from '@/config'
import { competingTeams, rankTeams } from '@/lib/ranking'
import { useWallData, type BoardSpec } from '@/lib/useWallData'

/**
 * Slide 1 — the absolute leaderboard, at rest.
 *
 * The overtake sequence and the end-of-day state both land here in a later
 * commit, on the shared boot-kick component. This file is deliberately inert
 * until then rather than carrying a half-ported v1 animation.
 */
const BOARD: BoardSpec = {
  // The spares are filtered *here*, not in the component, so the detector and
  // the board rank the same list. Ranking all 42 while rendering 40 would let a
  // spare hold a rank the wall never shows, and every team below it would carry
  // a rank one lower than the board's — including the rank changes that fire a
  // kick. `/weekly` composes its spec the same way, for the same reason.
  name: 'podium',
  rank: (teams) => rankTeams(competingTeams(teams)),
  earned: (team) => team.totalRevenue,
  watchTo: WATCH_RANKS_PODIUM,
}

export default function PodiumPage() {
  const { snapshot } = useWallData(BOARD)

  return (
    <main
      className="tv-frame"
      style={{
        display: 'grid',
        gridTemplateRows: 'auto minmax(0, 1fr)',
        padding: 'var(--s-10) var(--s-12)',
      }}
    >
      {/* The same header component `/weekly` carries, in the same band, with
          the same Mesa lockup, the same Flea calendar and the same as-of stamp
          — only the heading differs. The two slides rotate on one screen
          minutes apart, and a header that shifted between them would read as
          two different systems. The heading is a constant here because the
          board is the top ten whatever week it is; `/weekly`'s is the sheet's
          open week, which is why that one can be absent and this one cannot. */}
      <WallHeader snapshot={snapshot} label="BYOB Top 10" />

      <Podium ranked={rankTeams(competingTeams(snapshot?.teams ?? []))} />
    </main>
  )
}
