'use client'

import { useEffect, useState } from 'react'

import { DevFlipTrigger } from '@/components/DevFlipTrigger'
import { WallHeader } from '@/components/WallHeader'
import { WeeklyGrid } from '@/components/WeeklyGrid'
import { WATCH_RANKS_WEEKLY } from '@/config'
import { openWeek } from '@/lib/feed'
import { competingTeams, rankByWeek } from '@/lib/ranking'
import { useDevOvertakes } from '@/lib/devOvertake'
import { useKick } from '@/lib/useKick'
import { useWallData, type BoardSpec } from '@/lib/useWallData'

/**
 * Slide 2 — the weekly board, forty cards in a 4 × 10 grid.
 *
 * The board is inert unless a rank changed hands. **No `layout` prop anywhere in
 * this tree**: a team's week revenue ticking up by ₹200 without moving changes
 * the sort input, and Motion's layout animation would answer that with a small
 * shift on every poll. Movement on this wall means something happened.
 *
 * ── The freeze rides the flip exactly ──
 *
 * Cards are keyed by team id, so a snapshot applied mid-flip would re-slot the
 * two contestants underneath their own animation — they would arrive at a
 * destination that had moved. Held snapshots land on settle instead, which is
 * also what makes the ending invisible: both cards finish exactly on the
 * positions the re-sorted board is about to give them.
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
  const { snapshot, queueVersion, freeze, thaw } = useWallData(BOARD)
  // The dev trigger writes to the same queue the detector writes to; this
  // counter is only the nudge that tells `useKick` to look, exactly as
  // `queueVersion` does. Adding to it keeps one drain and one reader.
  const [devTicks, setDevTicks] = useState(0)
  const { playing: kick, settled } = useKick(BOARD.name, queueVersion + devTicks)

  useEffect(() => {
    if (kick !== null) freeze()
    else thaw()
  }, [kick, freeze, thaw])

  const week = snapshot === null ? null : openWeek(snapshot.cohort)
  // In production this hook returns its argument — see lib/devOvertake.ts. In
  // development it is what makes a triggered climb change the standings, so a
  // flip settles onto a board that has actually re-sorted rather than onto the
  // one it started from.
  const { teams, commit: devCommit, reset: devReset } = useDevOvertakes(
    competingTeams(snapshot?.teams ?? []),
  )

  return (
    <main
      className="tv-frame"
      style={{
        display: 'grid',
        gridTemplateRows: 'auto minmax(0, 1fr)',
        // **No padding on the frame.** The band is full-bleed — a material that
        // stopped short of the frame edge would read as a wide dark card rather
        // than as the board's masthead — so the padding belongs to the grid
        // underneath it, which is the only thing that still wants a margin.
      }}
    >
      {/* No week number from the sheet means no heading. The board is still
          correct and still worth showing; captioning it "BYOB Week ?" would not
          be. The number itself is `current_open_week` from `TV_Cohort`, never a
          hardcoded 4. */}
      <WallHeader snapshot={snapshot} label={week === null ? undefined : `BYOB Week ${week}`} />

      <div
        style={{
          display: 'grid',
          minHeight: 0,
          padding: 'var(--s-board-top) var(--s-12) var(--s-board-bottom)',
        }}
      >
        <WeeklyGrid
          teams={teams}
          kick={kick}
          // One commit: the standings move and the kick clears together, so the
          // board is never seen reordering under a mark that has landed.
          onSettled={() => {
            devCommit()
            settled()
          }}
        />
      </div>

      <DevFlipTrigger
        teams={teams}
        week={week}
        onQueued={() => setDevTicks((n) => n + 1)}
        onReset={() => {
          devReset()
          settled()
        }}
      />
    </main>
  )
}
