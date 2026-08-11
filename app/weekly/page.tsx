'use client'

import { WallHeader } from '@/components/WallHeader'
import { WeeklyLeaderboard } from '@/components/WeeklyLeaderboard'
import { openWeek } from '@/lib/feed'
import { competingTeams } from '@/lib/ranking'
import { useWallData } from '@/lib/useWallData'

/**
 * Slide 2 — the weekly board, at rest.
 *
 * The boot kick lands here in session 2. Until then this renders the standing
 * and nothing moves, which is also what it does for the ~99% of its life when
 * no rank has changed.
 */
export default function WeeklyPage() {
  const { snapshot } = useWallData()
  const week = snapshot === null ? null : openWeek(snapshot.cohort)

  return (
    <main className="tv-frame" style={{ display: 'grid', gridTemplateRows: 'auto minmax(0, 1fr)', padding: 'var(--s-10) var(--s-12)' }}>
      {/* No week number from the sheet means no label. The board is still
          correct and still worth showing; captioning it "Week ?" would not be. */}
      <WallHeader snapshot={snapshot} label={week === null ? undefined : `Week ${week}`} />
      <WeeklyLeaderboard teams={competingTeams(snapshot?.teams ?? [])} />
    </main>
  )
}
