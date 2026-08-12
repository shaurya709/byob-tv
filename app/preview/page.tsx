'use client'

import { WallHeader } from '@/components/WallHeader'
import { WeeklyGrid } from '@/components/WeeklyGrid'
import { openWeek } from '@/lib/feed'
import { competingTeams, rankByWeek } from '@/lib/ranking'
import { useWallData, type BoardSpec } from '@/lib/useWallData'
import { WATCH_RANKS_WEEKLY } from '@/config'

/**
 * **A preview. Not the wall.**
 *
 * `/weekly` is the board that ships and this route does not touch it. It renders
 * the same `WeeklyGrid`, from the same data, with one extra class on the frame —
 * `.tv-preview` — which is the only hook the green treatment's CSS answers to.
 * Nothing here can leak onto `/weekly` or `/podium`, because neither of them
 * carries that class.
 *
 * It exists to answer one question by looking rather than by describing: what
 * does the board become on Mesa green, with the two rings around every mark.
 *
 * Reusing the real grid rather than mocking a few cards is deliberate — a
 * preview built from its own markup drifts from the thing it is previewing on
 * the first change to either, and then it is worse than no preview at all.
 *
 * Delete this directory and the `.tv-preview` block in `app/mesa-tv.css`
 * together when the question is settled.
 */
const BOARD: BoardSpec = {
  name: 'weekly-preview',
  rank: (teams) => rankByWeek(competingTeams(teams)),
  earned: (team) => team.weekRevenue,
  watchTo: WATCH_RANKS_WEEKLY,
}

export default function PreviewPage() {
  const { snapshot } = useWallData(BOARD)
  const week = snapshot === null ? null : openWeek(snapshot.cohort)
  const teams = competingTeams(snapshot?.teams ?? [])

  return (
    <main
      className="tv-frame tv-preview"
      style={{
        display: 'grid',
        gridTemplateRows: 'auto minmax(0, 1fr)',
        padding: 'var(--s-10) var(--s-12)',
      }}
    >
      <WallHeader snapshot={snapshot} label={week === null ? undefined : `BYOB Week ${week}`} />
      <WeeklyGrid teams={teams} />
    </main>
  )
}
