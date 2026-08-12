'use client'

import { Podium } from '@/components/Podium'
import { PodiumMasthead } from '@/components/PodiumMasthead'
import { WATCH_RANKS_PODIUM } from '@/config'
import { competingTeams, rankTeams } from '@/lib/ranking'
import { useWallData, type BoardSpec } from '@/lib/useWallData'

/**
 * Slide 1 — the absolute leaderboard.
 *
 * A full-height masthead at the left and the board beside it. **No
 * `WallHeader`** — `/weekly` keeps the shared strip across the top, and this
 * slide replaced it with the spine. What the two boards must still share is the
 * data rather than the furniture: the same lockup, the same provenance stamp and
 * the same countdown brain all appear on both, arranged differently.
 *
 * The page has no padding of its own. The spine is full-bleed to three edges by
 * design, so the frame's margins belong to the board and are declared there.
 */
const BOARD: BoardSpec = {
  // The spares are filtered *here*, not in the component, so the detector and
  // the board rank the same list. Ranking all 42 while rendering 40 would let a
  // spare hold a rank the wall never shows, and every team below it would carry
  // a rank one lower than the board's — including the rank changes that fire an
  // overtake. `/weekly` composes its spec the same way, for the same reason.
  name: 'podium',
  rank: (teams) => rankTeams(competingTeams(teams)),
  earned: (team) => team.totalRevenue,
  watchTo: WATCH_RANKS_PODIUM,
}

export default function PodiumPage() {
  const { snapshot } = useWallData(BOARD)

  return (
    <main className="tv-frame" style={{ display: 'grid', gridTemplateColumns: 'auto 1fr' }}>
      <PodiumMasthead snapshot={snapshot} />
      <Podium ranked={rankTeams(competingTeams(snapshot?.teams ?? []))} />
    </main>
  )
}
