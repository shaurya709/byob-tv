'use client'

import { AsOf } from '@/components/AsOf'
import { Podium } from '@/components/Podium'
import { WATCH_RANKS_PODIUM } from '@/config'
import { rankTeams } from '@/lib/ranking'
import { useWallData, type BoardSpec } from '@/lib/useWallData'

/**
 * Slide 1 — the absolute leaderboard, at rest.
 *
 * The overtake sequence and the end-of-day state both land here in session 2,
 * on the shared boot-kick component. This file is deliberately inert until then
 * rather than carrying a half-ported v1 animation.
 */
const BOARD: BoardSpec = {
  name: 'podium',
  rank: rankTeams,
  earned: (team) => team.totalRevenue,
  watchTo: WATCH_RANKS_PODIUM,
}

export default function PodiumPage() {
  const { snapshot } = useWallData(BOARD)

  return (
    <main className="tv-frame">
      <div style={{ position: 'absolute', top: 'var(--s-5)', right: 'var(--s-8)', zIndex: 2 }}>
        <AsOf snapshot={snapshot} />
      </div>

      <div style={{ height: '100%' }}>
        <Podium ranked={rankTeams(snapshot?.teams ?? [])} />
      </div>
    </main>
  )
}
