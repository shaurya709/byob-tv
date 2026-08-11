'use client'

import { useState } from 'react'

import { DevKickTrigger } from '@/components/DevKickTrigger'
import { WallHeader } from '@/components/WallHeader'
import { WeeklyLeaderboard } from '@/components/WeeklyLeaderboard'
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
  // The dev trigger writes to the same queue the detector writes to; this
  // counter is only the nudge that tells `useKick` to look, exactly as
  // `queueVersion` does. Adding to it keeps one drain and one reader.
  const [devTicks, setDevTicks] = useState(0)
  const { playing: kick, settled } = useKick(BOARD.name, queueVersion + devTicks)

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

      {/* The board is not dimmed during a kick. Forty rows going grey is a
          full-frame takeover in everything but name, and slide 2's kick is meant
          to be an event *inside* the leaderboard — the two rows involved clear
          their own details, and that is the whole focus beat. Dimming stays on
          the podium, where the contest genuinely is the frame. */}
      <WeeklyLeaderboard teams={teams} kick={kick} onSettled={settled} />

      <DevKickTrigger
        teams={teams}
        week={week}
        onQueued={() => setDevTicks((n) => n + 1)}
        onReset={settled}
      />
    </main>
  )
}
