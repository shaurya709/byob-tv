'use client'

import { WallHeader } from '@/components/WallHeader'
import { WeeklyGrid } from '@/components/WeeklyGrid'
import { WATCH_RANKS_WEEKLY } from '@/config'
import { openWeek } from '@/lib/feed'
import { competingTeams, rankByWeek } from '@/lib/ranking'
import { useWallData, type BoardSpec } from '@/lib/useWallData'

/**
 * Slide 2 — the weekly board, forty cards in a 4 × 10 grid.
 *
 * The board is inert unless a rank changed hands. **No `layout` prop anywhere in
 * this tree**: a team's week revenue ticking up by ₹200 without moving changes
 * the sort input, and Motion's layout animation would answer that with a small
 * shift on every poll. Movement on this wall means something happened.
 *
 * ── Detection runs; the flip does not exist yet ──
 *
 * `useWallData` still detects overtakes and queues them — that is deliberate and
 * is what keeps `BoardState` seeded, so a TV plugged in next week behaves like
 * one running since day one. What is gone is the boot kick that used to play
 * them. The flip replaces it (spec §3) and is the next slice; until it lands
 * nothing drains the queue, which is harmless because `KICK_QUEUE_CAP` bounds it
 * at four and the board re-sorts on data either way.
 */
const BOARD: BoardSpec = {
  name: 'weekly',
  rank: (teams) => rankByWeek(competingTeams(teams)),
  earned: (team) => team.weekRevenue,
  // Ranks 1–20 are the top two rows of the grid. The old justification was "the
  // whole first column", which the columns took with them — see the spec's
  // WATCH_RANKS_WEEKLY note for why the number survived the reasoning.
  watchTo: WATCH_RANKS_WEEKLY,
}

export default function WeeklyPage() {
  const { snapshot } = useWallData(BOARD)

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
      {/* No week number from the sheet means no heading. The board is still
          correct and still worth showing; captioning it "BYOB Week ?" would not
          be. The number itself is `current_open_week` from `TV_Cohort`, never a
          hardcoded 4. */}
      <WallHeader snapshot={snapshot} label={week === null ? undefined : `BYOB Week ${week}`} />

      <WeeklyGrid teams={teams} />
    </main>
  )
}
