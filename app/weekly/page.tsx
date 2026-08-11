'use client'

import { BootKick } from '@/components/BootKick'
import { WallHeader } from '@/components/WallHeader'
import { COLUMN_LENGTH, WeeklyLeaderboard } from '@/components/WeeklyLeaderboard'
import { WATCH_RANKS_WEEKLY } from '@/config'
import { openWeek } from '@/lib/feed'
import { competingTeams, rankByWeek } from '@/lib/ranking'
import { useKick } from '@/lib/useKick'
import { useWallData, type BoardSpec } from '@/lib/useWallData'

/**
 * Slide 2 — the weekly board.
 *
 * The board is inert unless a rank changed hands. **No `layout` prop anywhere in
 * this tree**: a team's week revenue ticking up by ₹200 without moving changes
 * the sort input, and Motion's layout animation would answer that with a small
 * shift on every poll. Movement on this wall means something happened.
 */
const BOARD: BoardSpec = {
  name: 'weekly',
  rank: (teams) => rankByWeek(competingTeams(teams)),
  earned: (team) => team.weekRevenue,
  watchTo: WATCH_RANKS_WEEKLY,
}

export default function WeeklyPage() {
  const { snapshot, queueVersion } = useWallData(BOARD)
  const kick = useKick(BOARD.name, queueVersion)

  const week = snapshot === null ? null : openWeek(snapshot.cohort)
  const teams = competingTeams(snapshot?.teams ?? [])

  return (
    <main
      className="tv-frame"
      style={{
        display: 'grid',
        gridTemplateRows: 'auto minmax(0, 1fr)',
        padding: 'var(--s-10) var(--s-12)',
      }}
    >
      {/* No week number from the sheet means no label. The board is still
          correct and still worth showing; captioning it "Week ?" would not be. */}
      <WallHeader snapshot={snapshot} label={week === null ? undefined : `Week ${week}`} />

      <div style={{ position: 'relative' }}>
        <div
          style={{
            height: '100%',
            opacity: kick === null ? 1 : 0.16,
            transition: 'opacity 0.35s var(--ease-out)',
          }}
        >
          <WeeklyLeaderboard teams={teams} />
        </div>
        {kick !== null && <BootKick event={kick} teams={teams} perColumn={COLUMN_LENGTH} />}
      </div>
    </main>
  )
}
